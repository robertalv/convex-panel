/**
 * LogDetailSheet Component
 * Displays detailed information about a selected log entry
 * Matches the design from FunctionExecutionDetailSheet
 */

import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import type { LogEntry } from "../types";
import { X, ChevronUp, ChevronDown, AlertCircle, Copy } from "lucide-react";
import { FunctionCallTree } from "./FunctionCallTree";
import {
  formatTimestampWithRelative,
  formatBytes,
  formatDuration,
  formatCompute,
} from "../utils/formatters";

interface LogDetailSheetProps {
  log: LogEntry | null;
  allLogs: LogEntry[];
  onClose: () => void;
}

type DetailTab = "execution" | "request" | "functions";

const formatDateTime = (timestamp: number) => {
  if (!timestamp) return "N/A";
  const date = new Date(timestamp);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export function LogDetailSheet({ log, allLogs, onClose }: LogDetailSheetProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("execution");
  const [resourcesExpanded, setResourcesExpanded] = useState(true);

  if (!log) {
    return null;
  }

  const {
    executionId,
    udfType,
    startedAt,
    completedAt,
    durationMs,
    environment,
    usageStats,
    caller,
    identityType,
    returnBytes,
    requestId,
    functionIdentifier,
    error,
    success,
    logLines,
    timestamp,
  } = log;

  const timestampInfo = formatTimestampWithRelative(timestamp);
  const hasError = !success || !!error;

  // Filter logs to only include those from the same request
  const requestLogs = allLogs.filter((l) => l.requestId === requestId);

  const sheetContent = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0px 12px",
          borderBottom: "1px solid var(--color-border-base)",
          backgroundColor: "var(--color-surface-raised)",
          height: "45px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flex: 1,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              overflow: "hidden",
            }}
          >
            <span
              style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}
            >
              {timestampInfo.absolute}
            </span>
            <span
              style={{ fontSize: "12px", color: "var(--color-text-muted)" }}
            >
              ({timestampInfo.relative})
            </span>
            {hasError && (
              <span
                style={{
                  fontSize: "12px",
                  color: "var(--color-error-base)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <AlertCircle size={14} />
                failure
              </span>
            )}
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: "6px",
            color: "var(--color-text-secondary)",
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
            transition: "all 0.2s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--color-text-base)";
            e.currentTarget.style.backgroundColor = "var(--color-border-base)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--color-text-secondary)";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Error message - show first if present */}
      {hasError && error && (
        <div
          style={{
            margin: "16px",
            padding: "12px",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "6px",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--color-error-base)",
              }}
            >
              Error
            </div>
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--color-error-base)",
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {error}
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(error);
            }}
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              border: "none",
              background: "transparent",
              color: "var(--color-error-base)",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
            }}
            title="Copy error"
          >
            <Copy size={14} />
          </button>
        </div>
      )}

      {/* Log messages - show after error, but not if they're just the error message repeated */}
      {logLines &&
        logLines.length > 0 &&
        (() => {
          // Filter out log lines that are just the error message repeated
          const nonEmptyLogLines = logLines.filter((line: any) => {
            if (typeof line === "string") {
              const trimmed = line.trim();
              // Don't show empty lines
              if (trimmed.length === 0) return false;
              // If there's an error, don't show log lines that are just the error message
              if (hasError && error && trimmed === error.trim()) return false;
              return true;
            }
            return true;
          });

          if (nonEmptyLogLines.length === 0) return null;

          const allLogContent = nonEmptyLogLines
            .map((line: any) => {
              const logContent =
                typeof line === "string"
                  ? line.trim()
                  : JSON.stringify(line, null, 2);
              return logContent || "";
            })
            .filter((content) => content.length > 0)
            .join("\n");

          return (
            <div
              style={{
                margin: "16px",
                padding: "12px",
                backgroundColor: "var(--color-surface-raised)",
                border: "1px solid var(--color-border-base)",
                borderRadius: "6px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--color-text-base)",
                  }}
                >
                  Log Message
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(allLogContent);
                  }}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "var(--color-text-muted)",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    borderRadius: "4px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--color-text-base)";
                    e.currentTarget.style.backgroundColor =
                      "var(--color-border-base)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--color-text-muted)";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  title="Copy log message"
                >
                  <Copy size={14} />
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  maxHeight: "400px",
                  overflowY: "auto",
                }}
              >
                {nonEmptyLogLines.map((line: any, index: number) => {
                  const logContent =
                    typeof line === "string"
                      ? line.trim()
                      : JSON.stringify(line, null, 2);

                  if (!logContent || logContent.length === 0) return null;

                  return (
                    <div
                      key={index}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "var(--color-surface-base)",
                        borderRadius: "6px",
                        fontFamily: "monospace",
                        fontSize: "11px",
                        color: "var(--color-text-secondary)",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        position: "relative",
                      }}
                    >
                      {logContent}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

      {/* Tabs */}
      <div
        style={{
          borderBottom: "1px solid var(--color-border-base)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex" }}>
          {(["execution", "request", "functions"] as DetailTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "10px 16px",
                fontSize: 12,
                fontWeight: 500,
                border: "none",
                borderBottom:
                  activeTab === tab
                    ? "2px solid var(--color-brand-base)"
                    : "2px solid transparent",
                backgroundColor: "transparent",
                color:
                  activeTab === tab
                    ? "var(--color-text-base)"
                    : "var(--color-text-muted)",
                cursor: "pointer",
              }}
            >
              {tab === "execution"
                ? "Execution"
                : tab === "request"
                  ? "Request"
                  : "Functions Called"}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
        }}
      >
        {activeTab === "execution" && (
          <div
            style={{
              backgroundColor: "var(--color-surface-base)",
              padding: "16px",
            }}
          >
            <div style={{ fontSize: 12 }}>
              <div
                style={{
                  marginBottom: 12,
                  display: "grid",
                  gridTemplateColumns: "120px 1fr",
                  rowGap: 6,
                }}
              >
                <span style={{ color: "var(--color-text-muted)" }}>
                  Execution ID
                </span>
                <span
                  style={{
                    fontFamily: "monospace",
                    color: "var(--color-text-secondary)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: 200,
                    display: "inline-block",
                  }}
                  title={executionId}
                >
                  {executionId}
                </span>

                <span style={{ color: "var(--color-text-muted)" }}>
                  Function
                </span>
                <span
                  style={{
                    fontFamily: "monospace",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {functionIdentifier}
                </span>

                <span style={{ color: "var(--color-text-muted)" }}>Type</span>
                <span
                  style={{
                    textTransform: "capitalize",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {udfType
                    ? udfType.charAt(0).toUpperCase() + udfType.slice(1)
                    : "Unknown"}
                </span>

                <span style={{ color: "var(--color-text-muted)" }}>
                  Started at
                </span>
                <span style={{ color: "var(--color-text-secondary)" }}>
                  {formatDateTime(startedAt ?? 0)}
                </span>

                <span style={{ color: "var(--color-text-muted)" }}>
                  Completed at
                </span>
                <span style={{ color: "var(--color-text-secondary)" }}>
                  {formatDateTime(completedAt)}
                </span>

                <span style={{ color: "var(--color-text-muted)" }}>
                  Duration
                </span>
                <span style={{ color: "var(--color-text-secondary)" }}>
                  {formatDuration(durationMs ?? 0)}
                </span>

                <span style={{ color: "var(--color-text-muted)" }}>
                  Environment
                </span>
                <span
                  style={{
                    color: "var(--color-text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {environment || "Convex"}
                </span>
              </div>

              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    color: "var(--color-text-base)",
                  }}
                >
                  Resources Used
                </div>
                <button
                  onClick={() => setResourcesExpanded(!resourcesExpanded)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "var(--color-text-muted)",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {resourcesExpanded ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                </button>
              </div>

              {resourcesExpanded && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    fontSize: 12,
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: "var(--color-text-muted)",
                        marginBottom: 2,
                      }}
                    >
                      Compute
                    </div>
                    <div
                      style={{
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {formatCompute(
                        usageStats?.memory_used_mb,
                        durationMs ?? 0,
                      )}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        color: "var(--color-text-muted)",
                        marginBottom: 2,
                      }}
                    >
                      DB Bandwidth
                    </div>
                    <div
                      style={{
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {`Accessed ${usageStats?.database_read_documents || 0} documents, ${formatBytes(
                        usageStats?.database_read_bytes,
                      )} read, ${formatBytes(usageStats?.database_write_bytes)} written`}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        color: "var(--color-text-muted)",
                        marginBottom: 2,
                      }}
                    >
                      File Bandwidth
                    </div>
                    <div
                      style={{
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {`${formatBytes(usageStats?.storage_read_bytes)} read, ${formatBytes(
                        usageStats?.storage_write_bytes,
                      )} written`}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        color: "var(--color-text-muted)",
                        marginBottom: 2,
                      }}
                    >
                      Vector Bandwidth
                    </div>
                    <div
                      style={{
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {`${formatBytes(usageStats?.vector_index_read_bytes)} read, ${formatBytes(
                        usageStats?.vector_index_write_bytes,
                      )} written`}
                    </div>
                  </div>
                </div>
              )}

              {returnBytes != null && (
                <div
                  style={{
                    marginTop: 16,
                    display: "grid",
                    gridTemplateColumns: "120px 1fr",
                    rowGap: 6,
                  }}
                >
                  <span style={{ color: "var(--color-text-muted)" }}>
                    Return Size
                  </span>
                  <span style={{ color: "var(--color-text-secondary)" }}>
                    {formatBytes(returnBytes)} returned
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "request" && (
          <div
            style={{
              padding: "16px",
              backgroundColor: "var(--color-surface-base)",
            }}
          >
            <div style={{ fontSize: 12 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "120px 1fr",
                  rowGap: 6,
                  marginBottom: 12,
                }}
              >
                <span style={{ color: "var(--color-text-muted)" }}>
                  Request ID
                </span>
                <span
                  style={{
                    fontFamily: "monospace",
                    color: "var(--color-text-secondary)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: 200,
                    display: "inline-block",
                  }}
                  title={requestId}
                >
                  {requestId}
                </span>

                <span style={{ color: "var(--color-text-muted)" }}>
                  Started at
                </span>
                <span style={{ color: "var(--color-text-secondary)" }}>
                  {formatDateTime(startedAt ?? 0)}
                </span>

                <span style={{ color: "var(--color-text-muted)" }}>
                  Completed at
                </span>
                <span style={{ color: "var(--color-text-secondary)" }}>
                  {formatDateTime(completedAt)}
                </span>

                <span style={{ color: "var(--color-text-muted)" }}>
                  Duration
                </span>
                <span style={{ color: "var(--color-text-secondary)" }}>
                  {formatDuration(durationMs ?? 0)}
                </span>

                <span style={{ color: "var(--color-text-muted)" }}>
                  Identity
                </span>
                <span
                  style={{
                    color: "var(--color-text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {identityType || "Unknown"}
                </span>

                <span style={{ color: "var(--color-text-muted)" }}>Caller</span>
                <span
                  style={{
                    color: "var(--color-text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {caller || "Websocket"}
                </span>

                <span style={{ color: "var(--color-text-muted)" }}>
                  Environment
                </span>
                <span
                  style={{
                    color: "var(--color-text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {environment || "Convex"}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "functions" && (
          <div style={{ padding: "16px" }}>
            <FunctionCallTree
              logs={requestLogs}
              currentExecutionId={executionId}
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Sheet isOpen={!!log} onClose={onClose} width="420px" renderMode="inline">
      {sheetContent}
    </Sheet>
  );
}

export default LogDetailSheet;
