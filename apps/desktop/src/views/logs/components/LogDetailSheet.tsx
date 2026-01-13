/**
 * LogDetailSheet Component
 * Displays detailed information about a selected log entry
 */

import { useState } from "react";
import {
  Copy,
  CheckCircle2,
  XCircle,
  Zap,
  Clock,
  Database,
  HardDrive,
  Cpu,
} from "lucide-react";
import { ResizableSheet } from "@/views/data/components/ResizableSheet";
import { IconButton } from "@/components/ui/button";
import type { LogEntry, DetailTab } from "../types";
import {
  formatTimestampWithRelative,
  formatBytes,
  formatDuration,
  formatCompute,
} from "../utils/formatters";
import { cn } from "@/lib/utils";
import { FunctionCallTree } from "./FunctionCallTree";

interface LogDetailSheetProps {
  log: LogEntry | null;
  allLogs: LogEntry[];
  onClose: () => void;
}

const TABS: { id: DetailTab; label: string }[] = [
  { id: "execution", label: "Execution" },
  { id: "request", label: "Request" },
  { id: "functions", label: "Functions Called" },
];

export function LogDetailSheet({ log, allLogs, onClose }: LogDetailSheetProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("execution");
  const [copied, setCopied] = useState(false);

  // Don't render if no log selected
  if (!log) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const { absolute: timestamp, relative: relativeTime } =
    formatTimestampWithRelative(log.timestamp);

  const isSuccess = log.success;
  const isError = !log.success || !!log.error;
  const isCached = log.cachedResult || false;

  // Get status info
  const getStatusInfo = () => {
    if (isError) {
      return {
        icon: XCircle,
        color: "var(--color-error-base)",
        label: "Failed",
      };
    }
    if (isCached) {
      return {
        icon: Zap,
        color: "var(--color-warning-base)",
        label: "Cached",
      };
    }
    if (isSuccess) {
      return {
        icon: CheckCircle2,
        color: "var(--color-success-base)",
        label: "Success",
      };
    }
    return {
      icon: Clock,
      color: "var(--color-text-muted)",
      label: "Unknown",
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  // Get function type label
  const getFunctionTypeLabel = () => {
    switch (log.udfType) {
      case "query":
        return "Query";
      case "mutation":
        return "Mutation";
      case "action":
        return "Action";
      case "httpAction":
        return "HTTP Action";
      default:
        return log.udfType;
    }
  };

  return (
    <ResizableSheet
      id="log-detail"
      side="right"
      defaultWidth={450}
      minWidth={350}
      maxWidth={700}
      title={log.functionName || log.functionIdentifier}
      subtitle={getFunctionTypeLabel()}
      onClose={onClose}
      headerActions={
        <IconButton
          size="xs"
          variant="ghost"
          tooltip={copied ? "Copied!" : "Copy log ID"}
          onClick={() => handleCopy(log.id)}
        >
          <Copy size={14} />
        </IconButton>
      }
    >
      {/* Tabs */}
      <div
        className="flex gap-1 px-4 py-2"
        style={{ borderBottom: "1px solid var(--color-border-base)" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-md transition-colors",
              activeTab === tab.id
                ? "font-medium"
                : "hover:bg-[var(--color-surface-raised)]",
            )}
            style={{
              backgroundColor:
                activeTab === tab.id
                  ? "var(--color-brand-base-alpha)"
                  : "transparent",
              color:
                activeTab === tab.id
                  ? "var(--color-brand-base)"
                  : "var(--color-text-muted)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === "execution" && (
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center gap-2">
              <StatusIcon size={18} style={{ color: statusInfo.color }} />
              <span className="font-medium" style={{ color: statusInfo.color }}>
                {statusInfo.label}
              </span>
              {log.durationMs && (
                <span
                  className="text-xs ml-auto"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {formatDuration(log.durationMs)}
                </span>
              )}
            </div>

            {/* Error message */}
            {log.error && (
              <div
                className="p-3 rounded-md text-sm"
                style={{
                  backgroundColor: "var(--color-error-base-alpha)",
                  color: "var(--color-error-base)",
                  border: "1px solid var(--color-error-base)",
                }}
              >
                {log.error}
              </div>
            )}

            {/* Timestamp */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div
                  className="font-medium mb-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Timestamp
                </div>
                <div style={{ color: "var(--color-text-base)" }}>
                  {timestamp}
                </div>
                <div
                  className="text-xs"
                  style={{ color: "var(--color-text-subtle)" }}
                >
                  {relativeTime}
                </div>
              </div>

              <div>
                <div
                  className="font-medium mb-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Duration
                </div>
                <div style={{ color: "var(--color-text-base)" }}>
                  {log.durationMs ? formatDuration(log.durationMs) : "-"}
                </div>
              </div>
            </div>

            {/* Usage stats */}
            {log.usageStats && (
              <div>
                <div
                  className="font-medium mb-2 text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Usage Statistics
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <UsageStatCard
                    icon={Database}
                    label="Database Read"
                    value={formatBytes(log.usageStats.database_read_bytes)}
                    subValue={`${log.usageStats.database_read_documents} docs`}
                  />
                  <UsageStatCard
                    icon={Database}
                    label="Database Write"
                    value={formatBytes(log.usageStats.database_write_bytes)}
                  />
                  <UsageStatCard
                    icon={HardDrive}
                    label="Storage Read"
                    value={formatBytes(log.usageStats.storage_read_bytes)}
                  />
                  <UsageStatCard
                    icon={HardDrive}
                    label="Storage Write"
                    value={formatBytes(log.usageStats.storage_write_bytes)}
                  />
                  <UsageStatCard
                    icon={Cpu}
                    label="Memory"
                    value={`${log.usageStats.memory_used_mb} MB`}
                  />
                  <UsageStatCard
                    icon={Cpu}
                    label="Compute"
                    value={formatCompute(
                      log.usageStats.memory_used_mb,
                      log.durationMs,
                    )}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "request" && (
          <div className="space-y-4 text-xs">
            <InfoRow label="Request ID" value={log.requestId} copiable />
            <InfoRow label="Execution ID" value={log.executionId} copiable />
            <InfoRow label="Function" value={log.functionIdentifier} copiable />
            {log.componentPath && (
              <InfoRow label="Component" value={log.componentPath} />
            )}
            <InfoRow label="Identity Type" value={log.identityType} />
            {log.caller && <InfoRow label="Caller" value={log.caller} />}
            {log.environment && (
              <InfoRow label="Environment" value={log.environment} />
            )}
            {log.returnBytes !== undefined && (
              <InfoRow
                label="Return Size"
                value={formatBytes(log.returnBytes)}
              />
            )}
          </div>
        )}

        {activeTab === "functions" && (
          <FunctionCallTree
            logs={allLogs.filter((l) => l.requestId === log.requestId)}
            currentExecutionId={log.executionId}
          />
        )}
      </div>
    </ResizableSheet>
  );
}

// Helper component for usage stats
function UsageStatCard({
  icon: Icon,
  label,
  value,
  subValue,
}: {
  icon: typeof Database;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div
      className="p-2 rounded"
      style={{ backgroundColor: "var(--color-surface-raised)" }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} style={{ color: "var(--color-text-muted)" }} />
        <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
      </div>
      <div className="font-mono" style={{ color: "var(--color-text-base)" }}>
        {value}
      </div>
      {subValue && (
        <div style={{ color: "var(--color-text-subtle)" }}>{subValue}</div>
      )}
    </div>
  );
}

// Helper component for info rows
function InfoRow({
  label,
  value,
  copiable = false,
}: {
  label: string;
  value?: string;
  copiable?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-start gap-2">
      <div
        className="w-24 shrink-0"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </div>
      <div
        className="flex-1 font-mono break-all"
        style={{ color: "var(--color-text-base)" }}
      >
        {value}
      </div>
      {copiable && (
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 p-1 rounded hover:bg-[var(--color-surface-raised)] transition-colors"
          title={copied ? "Copied!" : "Copy"}
        >
          <Copy
            size={12}
            style={{
              color: copied
                ? "var(--color-success-base)"
                : "var(--color-text-muted)",
            }}
          />
        </button>
      )}
    </div>
  );
}

export default LogDetailSheet;
