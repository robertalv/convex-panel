import * as React from "react";
import { cn } from "@/lib/utils";
import { useNetworkTestsOptional } from "@/contexts/NetworkTestContext";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { ConvexLogo } from "@/components/ui/ConvexLogo";
import {
  Wifi,
  Globe,
  Radio,
  Server,
  RefreshCw,
  Check,
  X,
  Loader2,
  Clock,
} from "lucide-react";
import type { TestResult, TestStatus } from "@/contexts/NetworkTestContext";

interface TestRowProps {
  name: string;
  icon: React.ReactNode;
  result: TestResult;
  onRerun?: () => void;
}

function StatusIcon({ status }: { status: TestStatus }) {
  switch (status) {
    case "pending":
      return <Clock className="size-3.5 text-text-muted" />;
    case "running":
      return <Loader2 className="size-3.5 text-brand-base animate-spin" />;
    case "success":
      return <Check className="size-3.5 text-[var(--color-success-base)]" />;
    case "error":
      return <X className="size-3.5 text-[var(--color-error-base)]" />;
  }
}

function TestRow({ name, icon, result, onRerun }: TestRowProps) {
  return (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-surface-raised/50 rounded-lg group">
      <div className="flex items-center gap-2.5">
        <div className="text-text-muted">{icon}</div>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-text-base">{name}</span>
          {result.latency !== undefined && result.status === "success" && (
            <span className="text-[10px] text-text-muted">
              {result.latency}ms
            </span>
          )}
          {result.error && (
            <span className="text-[10px] text-[var(--color-error-base)] truncate max-w-[140px]">
              {result.error}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StatusIcon status={result.status} />
        {onRerun && result.status !== "running" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRerun();
            }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface-raised transition-opacity"
            title="Re-run this test"
          >
            <RefreshCw className="size-3 text-text-muted" />
          </button>
        )}
      </div>
    </div>
  );
}

function getOverallStatusColor(status: string): string {
  switch (status) {
    case "success":
      return "bg-[var(--color-success-base)]";
    case "error":
      return "bg-[var(--color-error-base)]";
    case "partial":
      return "bg-amber-500";
    case "running":
      return "bg-brand-base animate-pulse";
    default:
      return "bg-[var(--color-border-muted)]";
  }
}

function getOverallStatusText(status: string): string {
  switch (status) {
    case "success":
      return "All connections working";
    case "error":
      return "Connection issues detected";
    case "partial":
      return "Some connections have issues";
    case "running":
      return "Testing connections...";
    default:
      return "Connection status unknown";
  }
}

/**
 * Network Status Indicator for TopBar
 * Shows a Convex logo with a status dot and dropdown with test results
 */
export function NetworkStatusIndicator() {
  const networkTests = useNetworkTestsOptional();

  if (!networkTests) {
    return null;
  }

  const { tests, overallStatus, runAllTests, runTest, isRunning } =
    networkTests;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative flex items-center justify-center",
            "size-6 rounded-lg",
            "transition-colors duration-150",
            "text-text-muted hover:text-text-base hover:bg-surface-raised",
          )}
          title={getOverallStatusText(overallStatus)}
        >
          <ConvexLogo size={16} />
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-background-raised",
              getOverallStatusColor(overallStatus),
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-base">
          <div className="flex items-center gap-2">
            <ConvexLogo size={18} />
            <div>
              <h3 className="text-sm font-semibold text-text-base">
                Network Status
              </h3>
              <p className="text-[10px] text-text-muted">
                {getOverallStatusText(overallStatus)}
              </p>
            </div>
          </div>
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              isRunning
                ? "text-text-disabled cursor-not-allowed"
                : "text-text-muted hover:text-text-base hover:bg-surface-raised",
            )}
            title="Re-run all tests"
          >
            <RefreshCw className={cn("size-4", isRunning && "animate-spin")} />
          </button>
        </div>

        {/* Test Results */}
        <div className="py-1">
          <TestRow
            name="WebSocket (WSS)"
            icon={<Wifi className="size-4" />}
            result={tests.websocket}
            onRerun={() => runTest("websocket")}
          />
          <TestRow
            name="HTTP/HTTPS"
            icon={<Globe className="size-4" />}
            result={tests.http}
            onRerun={() => runTest("http")}
          />
          <TestRow
            name="Server-Sent Events"
            icon={<Radio className="size-4" />}
            result={tests.sse}
            onRerun={() => runTest("sse")}
          />
          <TestRow
            name="Proxied WebSocket"
            icon={<Server className="size-4" />}
            result={tests.proxiedWebsocket}
            onRerun={() => runTest("proxiedWebsocket")}
          />
        </div>

        {/* Footer with last run time */}
        {tests.http.lastRun && (
          <div className="px-4 py-2 border-t border-border-base">
            <p className="text-[10px] text-text-muted">
              Last tested: {tests.http.lastRun.toLocaleTimeString()}
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
