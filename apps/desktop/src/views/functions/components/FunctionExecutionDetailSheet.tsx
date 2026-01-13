import React, { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import type { FunctionExecutionLog } from "@convex-panel/shared/api";
import {
  X,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Copy,
} from "lucide-react";

interface FunctionExecutionDetailSheetProps {
  log: FunctionExecutionLog | null;
  isOpen: boolean;
  onClose: () => void;
  container?: HTMLElement | null;
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

const formatTimestampWithRelative = (timestamp: number) => {
  if (!timestamp) return { absolute: "N/A", relative: "" };
  const date = new Date(timestamp);
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const milliseconds = date.getMilliseconds().toString().padStart(3, "0");
  const absolute = `${month} ${day}, ${hours}:${minutes}:${seconds}.${milliseconds}`;

  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const relative =
    diffMinutes === 1 ? "1 minute ago" : `${diffMinutes} minutes ago`;

  return { absolute, relative };
};

const formatCompute = (memoryMb?: number, durationMs?: number) => {
  if (!memoryMb || !durationMs) return "0.0000000 GB-hr (0 MB for 0s)";
  const memoryGb = memoryMb / 1024;
  const durationHours = durationMs / (1000 * 60 * 60);
  const gbHours = memoryGb * durationHours;
  const durationSeconds = durationMs / 1000;
  return `${gbHours.toFixed(7)} GB-hr (${memoryMb} MB for ${durationSeconds.toFixed(2)}s)`;
};

const formatBytes = (bytes?: number) => {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
};

const formatDuration = (ms: number) => {
  if (!ms || ms <= 0) return "0ms";
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  const seconds = ms / 1000;
  return `${seconds.toFixed(2)}s`;
};

export const FunctionExecutionDetailSheet: React.FC<
  FunctionExecutionDetailSheetProps
> = ({ log, isOpen, onClose, container: propContainer }) => {
  const [activeTab, setActiveTab] = useState<DetailTab>("execution");
  const [resourcesExpanded, setResourcesExpanded] = useState(true);
  const container = propContainer || null;

  if (!isOpen || !log) {
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
  } = log;

  const timestampInfo = formatTimestampWithRelative(startedAt ?? 0);
  const hasError = !success || error;

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
          height: "40px",
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

      {logLines &&
        logLines.length > 0 &&
        (() => {
          const nonEmptyLogLines = logLines.filter((line: any) => {
            if (typeof line === "string") {
              return line.trim().length > 0;
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
                  {udfType.charAt(0).toUpperCase() + udfType.slice(1)}
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
          <div style={{ fontSize: 12, padding: "16px" }}>
            <div
              style={{
                marginBottom: 12,
                color: "var(--color-text-secondary)",
                fontSize: 12,
              }}
            >
              This is an outline of the functions called in this request.
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  height: "28px",
                  alignItems: "center",
                  borderRadius: "6px",
                  border: "1px solid var(--color-border-base)",
                  backgroundColor: "var(--color-surface-raised)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    height: "100%",
                    alignItems: "center",
                  }}
                ></div>
                <div
                  style={{
                    display: "flex",
                    flexShrink: 0,
                    alignItems: "center",
                    gap: "4px",
                    paddingLeft: "8px",
                  }}
                >
                  {hasError ? (
                    <XCircle
                      size={16}
                      style={{ color: "var(--color-error-base)" }}
                      aria-label="Function call failed"
                    />
                  ) : (
                    <CheckCircle2
                      size={16}
                      style={{ color: "var(--color-success-base)" }}
                      aria-label="Function call succeeded"
                    />
                  )}
                  <div
                    style={{
                      display: "flex",
                      width: "100%",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {(() => {
                      const funcId = log.functionIdentifier;
                      if (!funcId)
                        return (
                          <span style={{ color: "var(--color-text-base)" }}>
                            Unknown
                          </span>
                        );
                      const parts = funcId.split(":");
                      if (parts.length > 1) {
                        return (
                          <>
                            <span
                              style={{ color: "var(--color-text-secondary)" }}
                            >
                              {parts[0]}:
                            </span>
                            <span style={{ color: "var(--color-text-base)" }}>
                              {parts.slice(1).join(":")}
                            </span>
                          </>
                        );
                      }
                      return (
                        <span style={{ color: "var(--color-text-base)" }}>
                          {funcId}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <span
                  style={{
                    marginLeft: "4px",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  ({formatDuration(durationMs)})
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      width="420px"
      container={container}
      renderMode="inline"
    >
      {sheetContent}
    </Sheet>
  );
};
