import { useNetworkTestsOptional } from "../../../contexts/network-test-context";
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
  ExternalLink,
} from "lucide-react";
import type {
  TestResult,
  TestStatus,
} from "../../../contexts/network-test-context";

// Network test endpoints (for display)
const ENDPOINTS = {
  websocket: "wss://warmhearted-reindeer-937.convex.cloud/api/1.27.3/sync",
  http: "https://warmhearted-reindeer-937.convex.site/ping",
  sse: "https://warmhearted-reindeer-937.convex.site/sse",
  proxiedWebsocket: "https://sse-ws-proxy-production.up.railway.app/messages",
} as const;

function StatusBadge({ status }: { status: TestStatus }) {
  const styles = {
    pending: "bg-surface-raised text-text-muted",
    running: "bg-brand-base/10 text-brand-base",
    success: "bg-success-base/10 text-success-base",
    error: "bg-error-base/10 text-error-base",
  }[status];

  const Icon = {
    pending: Clock,
    running: Loader2,
    success: Check,
    error: X,
  }[status];

  const label = {
    pending: "Pending",
    running: "Testing...",
    success: "Connected",
    error: "Failed",
  }[status];

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium ${styles}`}
    >
      <Icon size={12} className={status === "running" ? "animate-spin" : ""} />
      {label}
    </div>
  );
}

interface TestCardProps {
  name: string;
  description: string;
  endpoint: string;
  icon: React.ReactNode;
  result: TestResult;
  onRerun: () => void;
}

function TestCard({
  name,
  description,
  endpoint,
  icon,
  result,
  onRerun,
}: TestCardProps) {
  return (
    <div className="mb-3 rounded-xl border border-border-base bg-surface-raised p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-overlay text-brand-base">
            {icon}
          </div>
          <div>
            <h4 className="mb-0.5 text-[13px] font-semibold text-text-base">
              {name}
            </h4>
            <p className="text-[11px] text-text-muted">{description}</p>
          </div>
        </div>
        <StatusBadge status={result.status} />
      </div>

      {/* Endpoint URL */}
      <div className="mt-3 overflow-hidden text-ellipsis whitespace-nowrap rounded-md bg-surface-overlay px-2.5 py-2 font-mono text-[10px] text-text-muted">
        {endpoint}
      </div>

      {/* Result Details */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {result.latency !== undefined && (
            <span className="text-[11px] text-text-muted">
              Latency:{" "}
              <strong className="text-text-base">{result.latency}ms</strong>
            </span>
          )}
          {result.messagesReceived !== undefined && (
            <span className="text-[11px] text-text-muted">
              Messages:{" "}
              <strong className="text-text-base">
                {result.messagesReceived}
              </strong>
            </span>
          )}
          {result.error && (
            <span className="text-[11px] text-error-base">{result.error}</span>
          )}
          {result.lastRun && (
            <span className="text-[10px] text-text-muted">
              Last: {result.lastRun.toLocaleTimeString()}
            </span>
          )}
        </div>
        <button
          onClick={onRerun}
          disabled={result.status === "running"}
          className={`flex items-center gap-1.5 rounded-md border-0 bg-surface-overlay px-3 py-1.5 text-[11px] font-medium transition-all ${
            result.status === "running"
              ? "cursor-not-allowed text-text-muted opacity-60"
              : "cursor-pointer text-text-base hover:bg-surface-base"
          }`}
        >
          <RefreshCw
            size={12}
            className={result.status === "running" ? "animate-spin" : ""}
          />
          Re-test
        </button>
      </div>
    </div>
  );
}

export function NetworkSettings() {
  const networkTests = useNetworkTestsOptional();

  if (!networkTests) {
    return (
      <div className="flex flex-1 items-center justify-center text-[13px] text-text-muted">
        Network testing is not available
      </div>
    );
  }

  const { tests, runAllTests, runTest, isRunning, overallStatus } =
    networkTests;

  const overallStatusConfig = {
    success: {
      color: "bg-success-base text-success-base",
      text: "All network tests passed",
    },
    error: {
      color: "bg-error-base text-error-base",
      text: "Network connectivity issues detected",
    },
    partial: {
      color: "bg-warning-base text-warning-base",
      text: "Some network tests failed",
    },
    running: {
      color: "bg-brand-base text-brand-base",
      text: "Running network tests...",
    },
    pending: {
      color: "bg-text-muted text-text-muted",
      text: "Network tests pending",
    },
  }[overallStatus];

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background-base">
      {/* Header */}
      <div className="flex h-[49px] items-center justify-between border-b border-border-base bg-background-base px-4">
        <h2 className="m-0 text-sm font-bold text-text-base">
          Network / Connectivity
        </h2>
        <button
          onClick={runAllTests}
          disabled={isRunning}
          className={`flex items-center gap-1.5 rounded-lg border-0 bg-brand-base px-3.5 py-2 text-xs font-medium text-white transition-all ${
            isRunning
              ? "cursor-not-allowed opacity-70"
              : "cursor-pointer hover:opacity-90"
          }`}
        >
          <RefreshCw size={14} className={isRunning ? "animate-spin" : ""} />
          Run All Tests
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-[700px]">
          {/* Overall Status Card */}
          <div
            className={`mb-6 flex items-center gap-3 rounded-xl border p-4 ${overallStatusConfig.color.replace("bg-", "border-")}/20 ${overallStatusConfig.color.replace("bg-", "bg-")}/[0.08]`}
          >
            <div
              className={`h-3 w-3 rounded-full ${overallStatusConfig.color.split(" ")[0]}`}
            />
            <div>
              <h3 className="mb-0.5 text-[13px] font-semibold text-text-base">
                {overallStatusConfig.text}
              </h3>
              <p className="text-[11px] text-text-muted">
                Testing connectivity to Convex services using multiple protocols
              </p>
            </div>
          </div>

          {/* Test Cards */}
          <TestCard
            name="WebSocket (WSS)"
            description="Real-time bidirectional communication for sync"
            endpoint={ENDPOINTS.websocket}
            icon={<Wifi size={20} />}
            result={tests.websocket}
            onRerun={() => runTest("websocket")}
          />

          <TestCard
            name="HTTP/HTTPS"
            description="Standard HTTP requests for API calls"
            endpoint={ENDPOINTS.http}
            icon={<Globe size={20} />}
            result={tests.http}
            onRerun={() => runTest("http")}
          />

          <TestCard
            name="Server-Sent Events (SSE)"
            description="One-way real-time updates from server"
            endpoint={ENDPOINTS.sse}
            icon={<Radio size={20} />}
            result={tests.sse}
            onRerun={() => runTest("sse")}
          />

          <TestCard
            name="Proxied WebSocket"
            description="WebSocket connections through proxy server"
            endpoint={ENDPOINTS.proxiedWebsocket}
            icon={<Server size={20} />}
            result={tests.proxiedWebsocket}
            onRerun={() => runTest("proxiedWebsocket")}
          />

          {/* Help Link */}
          <div className="mt-6">
            <a
              href="https://docs.convex.dev/production/hosting/troubleshooting"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-brand-base no-underline hover:underline"
            >
              Troubleshooting network issues
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
