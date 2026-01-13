/**
 * CronJobDetailSheet
 * Unified sheet component for viewing cron job details with tabs
 * Similar to LogDetailSheet with Executions and Arguments tabs
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ResizableSheet } from "@/views/data/components/ResizableSheet";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Calendar,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import type { CronJobWithRuns, CronJobLog } from "@convex-panel/shared";
import { formatTimestamp } from "@convex-panel/shared";

interface CronJobDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cronJob: CronJobWithRuns | null;
  allRuns: CronJobLog[];
}

type TabType = "executions" | "arguments";

const formatDuration = (seconds: number): string => {
  if (seconds < 1) {
    return `${Math.round(seconds * 1000)}ms`;
  }
  return `${seconds.toFixed(1)}s`;
};

export function CronJobDetailSheet({
  isOpen,
  onClose,
  cronJob,
  allRuns,
}: CronJobDetailSheetProps) {
  const [activeTab, setActiveTab] = useState<TabType>("executions");

  // Filter runs for this specific cron job
  const runs = useMemo(() => {
    if (!cronJob) return [];
    return allRuns.filter((run) => run.name === cronJob.name);
  }, [cronJob, allRuns]);

  const argsJson = useMemo(() => {
    if (!cronJob?.cronSpec) return "[]";

    const { udfArgs } = cronJob.cronSpec;

    if (!udfArgs) {
      return "[]";
    }

    try {
      // Convert ArrayBuffer to string
      let jsonString: string;

      if (udfArgs instanceof ArrayBuffer) {
        const decoder = new TextDecoder("utf-8");
        jsonString = decoder.decode(udfArgs);
      } else if (typeof udfArgs === "string") {
        jsonString = udfArgs;
      } else if (Array.isArray(udfArgs)) {
        // If it's already an array, stringify it directly
        return JSON.stringify(udfArgs, null, 2);
      } else {
        return JSON.stringify(udfArgs, null, 2);
      }

      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      console.error("Error parsing cron job arguments:", error);
      return "[]";
    }
  }, [cronJob]);

  const handleCopyArguments = async () => {
    try {
      await navigator.clipboard.writeText(argsJson);
      toast.success("Arguments copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy arguments");
    }
  };

  if (!isOpen || !cronJob) return null;

  return (
    <ResizableSheet
      id="cron-job-detail"
      title={`Executions: ${cronJob.name}`}
      onClose={onClose}
      side="right"
      defaultWidth={800}
      minWidth={500}
      maxWidth={1200}
      headerActions={
        activeTab === "arguments" ? (
          <Button variant="ghost" size="sm" onClick={handleCopyArguments}>
            <Copy size={14} />
            Copy
          </Button>
        ) : undefined
      }
    >
      <div className="flex h-full flex-col overflow-hidden">
        {/* Tabs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid var(--color-panel-border)",
            backgroundColor: "var(--color-panel-bg)",
            flexShrink: 0,
          }}
        >
          <TabButton
            label="Executions"
            isActive={activeTab === "executions"}
            onClick={() => setActiveTab("executions")}
          />
          <TabButton
            label="Arguments"
            isActive={activeTab === "arguments"}
            onClick={() => setActiveTab("arguments")}
          />
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === "executions" && (
            <ExecutionsTab runs={runs} cronJob={cronJob} />
          )}
          {activeTab === "arguments" && <ArgumentsTab argsJson={argsJson} />}
        </div>
      </div>
    </ResizableSheet>
  );
}

// Tab Button Component
interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function TabButton({ label, isActive, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "12px 16px",
        fontSize: "13px",
        fontWeight: 500,
        color: isActive
          ? "var(--color-panel-text)"
          : "var(--color-panel-text-muted)",
        background: "none",
        border: "none",
        borderBottom: isActive
          ? "2px solid var(--color-panel-accent)"
          : "2px solid transparent",
        cursor: "pointer",
        transition: "color 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.color = "var(--color-panel-text-secondary)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.color = "var(--color-panel-text-muted)";
        }
      }}
    >
      {label}
    </button>
  );
}

// Executions Tab Component
interface ExecutionsTabProps {
  runs: CronJobLog[];
  cronJob: CronJobWithRuns;
}

function ExecutionsTab({ runs, cronJob }: ExecutionsTabProps) {
  return (
    <div className="flex flex-col">
      {/* Next scheduled or currently running execution */}
      <div
        style={{
          padding: "12px",
          borderBottom: "1px solid var(--color-border-base)",
        }}
      >
        <TopCronJobLogListItem cronJob={cronJob} />
      </div>

      {/* Past executions */}
      {runs.map((run) => (
        <CronJobLogListItem key={`${run.ts}-${run.name}`} cronJobLog={run} />
      ))}

      {runs.length === 0 && (
        <div
          style={{
            padding: "32px",
            textAlign: "center",
            color: "var(--color-text-muted)",
            fontSize: "14px",
          }}
        >
          No past executions found
        </div>
      )}
    </div>
  );
}

// Top item showing next scheduled or currently running execution
interface TopCronJobLogListItemProps {
  cronJob: CronJobWithRuns;
}

function TopCronJobLogListItem({ cronJob }: TopCronJobLogListItemProps) {
  const navigate = useNavigate();
  const { nextRun } = cronJob;
  const { nextTs, state } = nextRun;
  const timestamp = formatTimestamp(nextTs);
  const currentlyRunning = state === "running";

  const estRuntimeRef = useRef<HTMLSpanElement>(null);

  const handleFunctionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cronJob.cronSpec.udfPath) {
      navigate(
        `/functions?function=${encodeURIComponent(cronJob.cronSpec.udfPath)}`,
      );
    }
  };

  useEffect(() => {
    if (currentlyRunning) {
      let handle = 0;
      const update = () => {
        if (estRuntimeRef.current) {
          const start = new Date(Number(nextTs) / 1000000);
          const ms = Date.now() - Number(start);
          const s = formatDuration(ms / 1000);
          estRuntimeRef.current.textContent = s;
          handle = requestAnimationFrame(update);
        }
      };
      handle = requestAnimationFrame(update);
      return () => cancelAnimationFrame(handle);
    }
  }, [currentlyRunning, nextTs]);

  const textColor = currentlyRunning
    ? "var(--color-text-base)"
    : "var(--color-text-muted)";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        fontFamily: "monospace",
        fontSize: "12px",
        padding: "12px",
        border: currentlyRunning
          ? "none"
          : "1px dashed var(--color-border-base)",
        borderRadius: "8px",
        backgroundColor: currentlyRunning
          ? "var(--color-surface-raised)"
          : "transparent",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
          style={{
            whiteSpace: "nowrap",
            color: textColor,
            minWidth: "180px",
          }}
        >
          {timestamp}
        </div>
        <div
          style={{
            width: "56px",
            textAlign: "right",
            whiteSpace: "nowrap",
            color: textColor,
          }}
        >
          {currentlyRunning ? <span ref={estRuntimeRef}>0ms</span> : ""}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            color: textColor,
          }}
        >
          {currentlyRunning ? (
            <Play
              size={14}
              style={{
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }}
            />
          ) : (
            <Calendar size={14} />
          )}
          <span style={{ width: "60px" }}>
            {currentlyRunning ? "running" : "scheduled"}
          </span>
        </div>
        <div
          onClick={handleFunctionClick}
          style={{
            color: "var(--color-accent-base)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            cursor: cronJob.cronSpec.udfPath ? "pointer" : "default",
            transition: "color 0.15s, text-decoration 0.15s",
          }}
          onMouseEnter={(e) => {
            if (cronJob.cronSpec.udfPath) {
              e.currentTarget.style.textDecoration = "underline";
            }
          }}
          onMouseLeave={(e) => {
            if (cronJob.cronSpec.udfPath) {
              e.currentTarget.style.textDecoration = "none";
            }
          }}
          title={
            cronJob.cronSpec.udfPath ? "Click to view function code" : undefined
          }
        >
          {cronJob.cronSpec.udfPath}
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

// Past execution log item
interface CronJobLogListItemProps {
  cronJobLog: CronJobLog;
}

function CronJobLogListItem({ cronJobLog }: CronJobLogListItemProps) {
  const navigate = useNavigate();
  const timestamp = formatTimestamp(cronJobLog.ts);
  const duration = cronJobLog.executionTime
    ? formatDuration(cronJobLog.executionTime)
    : "";

  const handleFunctionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cronJobLog.udfPath) {
      navigate(`/functions?function=${encodeURIComponent(cronJobLog.udfPath)}`);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        fontFamily: "monospace",
        fontSize: "12px",
        padding: "12px",
        borderBottom: "1px solid var(--color-border-base)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
          style={{
            whiteSpace: "nowrap",
            color: "var(--color-text-base)",
            minWidth: "180px",
          }}
        >
          {timestamp}
        </div>
        <div
          style={{
            width: "56px",
            textAlign: "right",
            whiteSpace: "nowrap",
            color: "var(--color-text-muted)",
          }}
        >
          {duration}
        </div>
        <LogStatusLine status={cronJobLog.status} />
        <div
          onClick={handleFunctionClick}
          style={{
            color: "var(--color-accent-base)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            cursor: cronJobLog.udfPath ? "pointer" : "default",
            transition: "color 0.15s, text-decoration 0.15s",
          }}
          onMouseEnter={(e) => {
            if (cronJobLog.udfPath) {
              e.currentTarget.style.textDecoration = "underline";
            }
          }}
          onMouseLeave={(e) => {
            if (cronJobLog.udfPath) {
              e.currentTarget.style.textDecoration = "none";
            }
          }}
          title={cronJobLog.udfPath ? "Click to view function code" : undefined}
        >
          {cronJobLog.udfPath}
        </div>
      </div>
      {cronJobLog.logLines?.logLines &&
        cronJobLog.logLines.logLines.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              paddingTop: "8px",
              borderTop: "1px solid var(--color-border-base)",
            }}
          >
            {cronJobLog.logLines.logLines.map((line, idx) => (
              <div
                key={idx}
                style={{
                  padding: "4px 8px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  color: "var(--color-text-base)",
                  fontSize: "11px",
                  fontFamily: "monospace",
                }}
              >
                {line}
              </div>
            ))}
          </div>
        )}
      {cronJobLog.status.type === "failure" && cronJobLog.status.result && (
        <div
          style={{
            padding: "8px",
            backgroundColor:
              "color-mix(in srgb, var(--color-error-base) 10%, transparent)",
            border: "1px solid var(--color-error-base)",
            borderRadius: "4px",
            color: "var(--color-error-base)",
            fontSize: "11px",
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {typeof cronJobLog.status.result === "object" &&
          "value" in cronJobLog.status.result
            ? String(cronJobLog.status.result.value)
            : String(cronJobLog.status.result)}
        </div>
      )}
    </div>
  );
}

// Status icon and label component
interface LogStatusLineProps {
  status: CronJobLog["status"];
}

function LogStatusLine({ status }: LogStatusLineProps) {
  const { type } = status;

  if (type === "success") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          color: "var(--color-success-base)",
        }}
      >
        <CheckCircle2 size={14} />
        <span style={{ width: "60px" }}>success</span>
      </div>
    );
  } else if (type === "failure") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          color: "var(--color-error-base)",
        }}
      >
        <XCircle size={14} />
        <span style={{ width: "60px" }}>failure</span>
      </div>
    );
  } else if (type === "running") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          color: "var(--color-text-muted)",
        }}
      >
        <Play size={14} />
        <span style={{ width: "60px" }}>running</span>
      </div>
    );
  } else {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          color: "var(--color-warning-base)",
        }}
      >
        <AlertTriangle size={14} />
        <span style={{ width: "60px" }}>canceled</span>
      </div>
    );
  }
}

// Arguments Tab Component
interface ArgumentsTabProps {
  argsJson: string;
}

function ArgumentsTab({ argsJson }: ArgumentsTabProps) {
  return (
    <div className="h-full bg-surface-raised p-4">
      <pre className="font-mono text-xs text-text-base">
        <code>{argsJson}</code>
      </pre>
    </div>
  );
}
