import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type {
  Insight,
  OccRecentEvent,
  BytesReadRecentEvent,
} from "../../../utils/api/types";

export interface EventsForInsightProps {
  insight: Insight;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return timestamp;
  }
};

const formatNumberCompact = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

// OCC Events Table
const OccEventsTable: React.FC<{ events: OccRecentEvent[] }> = ({ events }) => {
  if (events.length === 0) {
    return (
      <div
        style={{
          padding: "24px",
          textAlign: "center",
          color: "var(--color-panel-text-muted)",
          fontSize: "12px",
        }}
      >
        No recent events
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "12px",
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: "1px solid var(--color-panel-border)",
              backgroundColor: "var(--color-panel-bg-tertiary)",
            }}
          >
            <th
              style={{
                padding: "8px 12px",
                textAlign: "left",
                fontWeight: 500,
                color: "var(--color-panel-text-secondary)",
              }}
            >
              Timestamp
            </th>
            <th
              style={{
                padding: "8px 12px",
                textAlign: "left",
                fontWeight: 500,
                color: "var(--color-panel-text-secondary)",
              }}
            >
              Document ID
            </th>
            <th
              style={{
                padding: "8px 12px",
                textAlign: "left",
                fontWeight: 500,
                color: "var(--color-panel-text-secondary)",
              }}
            >
              Write Source
            </th>
            <th
              style={{
                padding: "8px 12px",
                textAlign: "right",
                fontWeight: 500,
                color: "var(--color-panel-text-secondary)",
              }}
            >
              Retry Count
            </th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr
              key={event.id}
              style={{
                borderBottom: "1px solid var(--color-panel-border)",
              }}
            >
              <td
                style={{
                  padding: "8px 12px",
                  color: "var(--color-panel-text-secondary)",
                }}
              >
                {formatTimestamp(event.timestamp)}
              </td>
              <td
                style={{
                  padding: "8px 12px",
                  fontFamily: "monospace",
                  color: "var(--color-panel-text)",
                }}
              >
                {event.occ_document_id || "—"}
              </td>
              <td
                style={{
                  padding: "8px 12px",
                  fontFamily: "monospace",
                  color: "var(--color-panel-text-secondary)",
                }}
              >
                {event.occ_write_source || "—"}
              </td>
              <td
                style={{
                  padding: "8px 12px",
                  textAlign: "right",
                  color: "var(--color-panel-text)",
                }}
              >
                {event.occ_retry_count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Bytes/Documents Read Events Table with expandable rows
const BytesEventsTable: React.FC<{
  events: BytesReadRecentEvent[];
  showBytes: boolean;
}> = ({ events, showBytes }) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (events.length === 0) {
    return (
      <div
        style={{
          padding: "24px",
          textAlign: "center",
          color: "var(--color-panel-text-muted)",
          fontSize: "12px",
        }}
      >
        No recent events
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "12px",
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: "1px solid var(--color-panel-border)",
              backgroundColor: "var(--color-panel-bg-tertiary)",
            }}
          >
            <th
              style={{
                padding: "8px 12px",
                textAlign: "left",
                fontWeight: 500,
                color: "var(--color-panel-text-secondary)",
                width: "24px",
              }}
            />
            <th
              style={{
                padding: "8px 12px",
                textAlign: "left",
                fontWeight: 500,
                color: "var(--color-panel-text-secondary)",
              }}
            >
              Timestamp
            </th>
            <th
              style={{
                padding: "8px 12px",
                textAlign: "right",
                fontWeight: 500,
                color: "var(--color-panel-text-secondary)",
              }}
            >
              {showBytes ? "Bytes Read" : "Documents Read"}
            </th>
            <th
              style={{
                padding: "8px 12px",
                textAlign: "center",
                fontWeight: 500,
                color: "var(--color-panel-text-secondary)",
              }}
            >
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => {
            const isExpanded = expandedRows.has(event.id);
            const hasTableBreakdown = event.calls && event.calls.length > 0;
            const totalValue = showBytes
              ? event.calls?.reduce((sum, c) => sum + c.bytes_read, 0) || 0
              : event.calls?.reduce((sum, c) => sum + c.documents_read, 0) || 0;

            return (
              <React.Fragment key={event.id}>
                <tr
                  style={{
                    borderBottom: isExpanded
                      ? "none"
                      : "1px solid var(--color-panel-border)",
                    cursor: hasTableBreakdown ? "pointer" : "default",
                  }}
                  onClick={() => hasTableBreakdown && toggleRow(event.id)}
                >
                  <td style={{ padding: "8px 12px" }}>
                    {hasTableBreakdown && (
                      <span
                        style={{
                          color: "var(--color-panel-text-muted)",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {isExpanded ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        )}
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "8px 12px",
                      color: "var(--color-panel-text-secondary)",
                    }}
                  >
                    {formatTimestamp(event.timestamp)}
                  </td>
                  <td
                    style={{
                      padding: "8px 12px",
                      textAlign: "right",
                      fontFamily: "monospace",
                      color: "var(--color-panel-text)",
                    }}
                  >
                    {showBytes
                      ? formatBytes(totalValue)
                      : formatNumberCompact(totalValue)}
                  </td>
                  <td
                    style={{
                      padding: "8px 12px",
                      textAlign: "center",
                    }}
                  >
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 500,
                        backgroundColor: event.success
                          ? "color-mix(in srgb, var(--color-panel-success) 15%, transparent)"
                          : "color-mix(in srgb, var(--color-panel-error) 15%, transparent)",
                        color: event.success
                          ? "var(--color-panel-success)"
                          : "var(--color-panel-error)",
                      }}
                    >
                      {event.success ? "Success" : "Failed"}
                    </span>
                  </td>
                </tr>
                {isExpanded && hasTableBreakdown && (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        padding: "0 12px 12px 36px",
                        borderBottom: "1px solid var(--color-panel-border)",
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: "var(--color-panel-bg)",
                          border: "1px solid var(--color-panel-border)",
                          borderRadius: "6px",
                          overflow: "hidden",
                        }}
                      >
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: "11px",
                          }}
                        >
                          <thead>
                            <tr
                              style={{
                                backgroundColor:
                                  "var(--color-panel-bg-tertiary)",
                              }}
                            >
                              <th
                                style={{
                                  padding: "6px 10px",
                                  textAlign: "left",
                                  fontWeight: 500,
                                  color: "var(--color-panel-text-secondary)",
                                }}
                              >
                                Table
                              </th>
                              <th
                                style={{
                                  padding: "6px 10px",
                                  textAlign: "right",
                                  fontWeight: 500,
                                  color: "var(--color-panel-text-secondary)",
                                }}
                              >
                                {showBytes ? "Bytes" : "Documents"}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {event.calls.map((call, idx) => (
                              <tr
                                key={idx}
                                style={{
                                  borderTop:
                                    idx > 0
                                      ? "1px solid var(--color-panel-border)"
                                      : undefined,
                                }}
                              >
                                <td
                                  style={{
                                    padding: "6px 10px",
                                    fontFamily: "monospace",
                                    color: "var(--color-panel-text)",
                                  }}
                                >
                                  {call.table_name}
                                </td>
                                <td
                                  style={{
                                    padding: "6px 10px",
                                    textAlign: "right",
                                    fontFamily: "monospace",
                                    color: "var(--color-panel-text-secondary)",
                                  }}
                                >
                                  {showBytes
                                    ? formatBytes(call.bytes_read)
                                    : formatNumberCompact(call.documents_read)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export const EventsForInsight: React.FC<EventsForInsightProps> = ({
  insight,
}) => {
  // Determine which table to render based on insight kind
  const isOccInsight =
    insight.kind === "occRetried" || insight.kind === "occFailedPermanently";
  const isBytesInsight =
    insight.kind === "bytesReadLimit" || insight.kind === "bytesReadThreshold";

  const getEventCount = (): number => {
    if ("details" in insight && insight.details.recentEvents) {
      return insight.details.recentEvents.length;
    }
    return 0;
  };

  return (
    <div
      style={{
        backgroundColor: "var(--color-panel-bg-secondary)",
        border: "1px solid var(--color-panel-border)",
        borderRadius: "6px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--color-panel-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--color-panel-text)",
          }}
        >
          Recent Events
        </span>
        <span
          style={{
            fontSize: "11px",
            color: "var(--color-panel-text-muted)",
          }}
        >
          {getEventCount()} event{getEventCount() === 1 ? "" : "s"}
        </span>
      </div>

      {isOccInsight && (
        <OccEventsTable
          events={
            (insight.details as { recentEvents: OccRecentEvent[] })
              .recentEvents || []
          }
        />
      )}

      {!isOccInsight && (
        <BytesEventsTable
          events={
            (insight.details as { recentEvents: BytesReadRecentEvent[] })
              .recentEvents || []
          }
          showBytes={isBytesInsight}
        />
      )}
    </div>
  );
};
