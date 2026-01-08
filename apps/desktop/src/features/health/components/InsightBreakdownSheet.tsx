import { useMemo } from "react";
import { X, AlertTriangle, ExternalLink, Code, HelpCircle } from "lucide-react";
import type {
  Insight,
  OccRecentEvent,
  BytesReadRecentEvent,
} from "@convex-panel/shared/api";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/button";
import { MetricChart, TimeSeriesDataPoint } from "./MetricChart";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface InsightBreakdownSheetProps {
  insight: Insight;
  onClose: () => void;
  onNavigateToDocument?: (documentId: string, tableName: string) => void;
}

const severityForInsightKind: Record<Insight["kind"], "error" | "warning"> = {
  bytesReadLimit: "error",
  bytesReadThreshold: "warning",
  documentsReadLimit: "error",
  documentsReadThreshold: "warning",
  occFailedPermanently: "error",
  occRetried: "warning",
};

const titleForInsightKind: Record<Insight["kind"], string> = {
  occRetried: "Write Conflicts (Retried)",
  occFailedPermanently: "Write Conflicts (Failed)",
  bytesReadLimit: "Bytes Read Limit Exceeded",
  bytesReadThreshold: "Approaching Bytes Read Limit",
  documentsReadLimit: "Documents Read Limit Exceeded",
  documentsReadThreshold: "Approaching Documents Read Limit",
};

// Helper to format function identifier
function functionIdentifierValue(
  functionId: string,
  componentPath?: string | null,
): string {
  if (componentPath) {
    return `${componentPath}/${functionId}`;
  }
  return functionId;
}

function getProblemDescription(insight: Insight): string {
  switch (insight.kind) {
    case "occRetried":
      return `OCC retried ${insight.details.occCalls} times${insight.details.occTableName ? ` on table "${insight.details.occTableName}"` : ""}`;
    case "occFailedPermanently":
      return `OCC failed permanently ${insight.details.occCalls} times${insight.details.occTableName ? ` on table "${insight.details.occTableName}"` : ""}`;
    case "bytesReadLimit":
      return `Hit bytes read limit ${insight.details.count} times`;
    case "bytesReadThreshold":
      return `Approaching bytes read threshold (${insight.details.count} occurrences)`;
    case "documentsReadLimit":
      return `Hit documents read limit ${insight.details.count} times`;
    case "documentsReadThreshold":
      return `Approaching documents read threshold (${insight.details.count} occurrences)`;
    default:
      return "Unknown issue";
  }
}

// Table header cell style
const thStyle: React.CSSProperties = {
  padding: "8px 12px",
  textAlign: "left",
  fontWeight: 500,
  color: "var(--color-text-muted)",
  fontSize: "11px",
  whiteSpace: "nowrap",
};

// Table data cell style
const tdStyle: React.CSSProperties = {
  padding: "8px 12px",
  color: "var(--color-text-secondary)",
  fontFamily: "monospace",
  fontSize: "11px",
};

// OCC Events Table Component
function OccEventsTable({
  events,
  tableName,
  onNavigateToDocument,
}: {
  events: OccRecentEvent[];
  tableName?: string;
  onNavigateToDocument?: (documentId: string, tableName: string) => void;
}) {
  return (
    <table
      style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}
    >
      <thead>
        <tr
          style={{
            borderBottom: "1px solid var(--color-border-base)",
            backgroundColor: "var(--color-surface-base)",
          }}
        >
          <th style={thStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              Request ID
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle size={12} className="text-muted cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  Unique identifier for the request
                </TooltipContent>
              </Tooltip>
            </div>
          </th>
          <th style={thStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              Function Call ID
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle size={12} className="text-muted cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  Unique identifier for this function execution
                </TooltipContent>
              </Tooltip>
            </div>
          </th>
          <th style={thStyle}>Timestamp</th>
          <th style={thStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              Conflicting Document ID
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle size={12} className="text-muted cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  The document that caused the write conflict
                </TooltipContent>
              </Tooltip>
            </div>
          </th>
          <th style={thStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              Conflicting Function
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle size={12} className="text-muted cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  The function that wrote to the conflicting document
                </TooltipContent>
              </Tooltip>
            </div>
          </th>
          <th style={{ ...thStyle, textAlign: "right" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                justifyContent: "flex-end",
              }}
            >
              Retry #
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle size={12} className="text-muted cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  Number of times this execution was retried
                </TooltipContent>
              </Tooltip>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        {events.map((event, idx) => (
          <tr
            key={`${event.request_id}-${idx}`}
            style={{
              borderBottom:
                idx < events.length - 1
                  ? "1px solid var(--color-border-base)"
                  : "none",
            }}
          >
            <td style={tdStyle}>{event.request_id.substring(0, 13)}</td>
            <td style={tdStyle}>{event.id.substring(0, 16)}...</td>
            <td style={tdStyle}>
              {new Date(event.timestamp).toLocaleString()}
            </td>
            <td style={tdStyle}>
              {event.occ_document_id ? (
                onNavigateToDocument && tableName ? (
                  <button
                    onClick={() =>
                      onNavigateToDocument(event.occ_document_id!, tableName)
                    }
                    className="text-accent hover:underline cursor-pointer bg-transparent border-none p-0 font-mono text-[11px]"
                  >
                    {event.occ_document_id}
                    <ExternalLink size={10} className="inline ml-1" />
                  </button>
                ) : (
                  <span>{event.occ_document_id}</span>
                )
              ) : (
                <span className="text-muted">—</span>
              )}
            </td>
            <td style={tdStyle}>
              {event.occ_write_source ? (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <span>
                    {event.occ_write_source === "self"
                      ? "Self"
                      : event.occ_write_source}
                  </span>
                  {event.occ_write_source === "self" && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted/20 text-muted text-[10px] cursor-help">
                          i
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        This function conflicted with itself
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              ) : (
                <span className="text-muted">—</span>
              )}
            </td>
            <td style={{ ...tdStyle, textAlign: "right" }}>
              {event.occ_retry_count}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Bytes/Docs Events Table Component
function BytesDocsEventsTable({ events }: { events: BytesReadRecentEvent[] }) {
  return (
    <table
      style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}
    >
      <thead>
        <tr
          style={{
            borderBottom: "1px solid var(--color-border-base)",
            backgroundColor: "var(--color-surface-base)",
          }}
        >
          <th style={thStyle}>Request ID</th>
          <th style={thStyle}>Timestamp</th>
          <th style={thStyle}>Tables Read</th>
          <th style={{ ...thStyle, textAlign: "right" }}>Status</th>
        </tr>
      </thead>
      <tbody>
        {events.map((event, idx) => (
          <tr
            key={`${event.request_id}-${idx}`}
            style={{
              borderBottom:
                idx < events.length - 1
                  ? "1px solid var(--color-border-base)"
                  : "none",
            }}
          >
            <td style={tdStyle}>{event.request_id.substring(0, 13)}</td>
            <td style={tdStyle}>
              {new Date(event.timestamp).toLocaleString()}
            </td>
            <td style={tdStyle}>
              {event.calls && event.calls.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {event.calls.slice(0, 3).map((call, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 bg-muted/20 rounded text-[10px]"
                    >
                      {call.table_name}
                    </span>
                  ))}
                  {event.calls.length > 3 && (
                    <span className="text-muted text-[10px]">
                      +{event.calls.length - 3} more
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-muted">—</span>
              )}
            </td>
            <td style={{ ...tdStyle, textAlign: "right" }}>
              <span
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-medium",
                  event.success
                    ? "bg-success/20 text-success"
                    : "bg-error/20 text-error",
                )}
              >
                {event.success ? "Success" : "Failed"}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function InsightBreakdownSheet({
  insight,
  onClose,
  onNavigateToDocument,
}: InsightBreakdownSheetProps) {
  const severity = severityForInsightKind[insight.kind];
  const title = titleForInsightKind[insight.kind];
  const functionName = functionIdentifierValue(
    insight.functionId,
    insight.componentPath,
  );

  // Convert hourlyCounts to chart data format
  const chartData: TimeSeriesDataPoint[] = useMemo(() => {
    if (!("hourlyCounts" in insight.details) || !insight.details.hourlyCounts) {
      return [];
    }
    return insight.details.hourlyCounts.map((hc) => ({
      time: new Date(hc.hour).getTime(),
      value: hc.count,
    }));
  }, [insight.details]);

  // Determine chart color based on severity
  const chartColor = severity === "error" ? "error" : "warning";

  return (
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
          padding: "0px 16px",
          borderBottom: "1px solid var(--color-border-base)",
          backgroundColor: "var(--color-surface-base)",
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
            }}
          >
            {severity === "error" ? (
              <X size={16} className="shrink-0 text-error" />
            ) : (
              <AlertTriangle size={16} className="shrink-0 text-warning" />
            )}
            <span
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--color-text)",
              }}
            >
              {title}
            </span>
          </div>
        </div>

        <IconButton
          onClick={onClose}
          variant="ghost"
          size="md"
          tooltip="Close sheet"
          aria-label="Close sheet"
        >
          <X size={16} />
        </IconButton>
      </div>

      {/* Scrollable Content */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* Function Name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Function
            </span>
            <span
              className="text-sm font-semibold font-mono text-foreground truncate"
              title={functionName}
            >
              {functionName}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Navigate to function code
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5",
              "text-xs font-medium text-accent",
              "bg-transparent border border-accent rounded-md",
              "cursor-pointer transition-all duration-150",
              "hover:bg-accent/10",
            )}
          >
            <Code size={14} />
            View Code
          </button>
        </div>

        {/* Problem Explanation */}
        <div className="bg-overlay border border-border rounded-md p-4">
          <div
            style={{
              fontSize: "13px",
              color: "var(--color-text)",
              lineHeight: "1.5",
            }}
          >
            {getProblemDescription(insight)}
          </div>
          {(insight.kind === "occRetried" ||
            insight.kind === "occFailedPermanently") && (
            <div
              style={{
                marginTop: "12px",
                padding: "12px",
                backgroundColor: "var(--color-surface-base)",
                borderRadius: "6px",
                fontSize: "12px",
                color: "var(--color-text-secondary)",
                lineHeight: "1.5",
              }}
            >
              <strong>What this means:</strong> Optimistic Concurrency Control
              (OCC) conflicts occur when multiple transactions try to modify the
              same document simultaneously. When retried, Convex automatically
              retries the transaction. If it fails permanently, the transaction
              was unable to complete after retries.
            </div>
          )}
          {(insight.kind === "bytesReadLimit" ||
            insight.kind === "bytesReadThreshold") && (
            <div
              style={{
                marginTop: "12px",
                padding: "12px",
                backgroundColor: "var(--color-surface-base)",
                borderRadius: "6px",
                fontSize: "12px",
                color: "var(--color-text-secondary)",
                lineHeight: "1.5",
              }}
            >
              <strong>What this means:</strong> Your function is reading too
              much data from the database. Each query has a limit of 16MB of
              data read per query. Consider using indexes, pagination, or
              restructuring your queries to read less data.
            </div>
          )}
          {(insight.kind === "documentsReadLimit" ||
            insight.kind === "documentsReadThreshold") && (
            <div
              style={{
                marginTop: "12px",
                padding: "12px",
                backgroundColor: "var(--color-surface-base)",
                borderRadius: "6px",
                fontSize: "12px",
                color: "var(--color-text-secondary)",
                lineHeight: "1.5",
              }}
            >
              <strong>What this means:</strong> Your function is reading too
              many documents from the database. Each query has a limit of 32,000
              documents read per query. Consider using indexes, pagination, or
              restructuring your queries to read fewer documents.
            </div>
          )}
        </div>

        {/* Activity Chart */}
        {chartData.length > 0 && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
              }}
            >
              <h3
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--color-text)",
                  margin: 0,
                }}
              >
                Activity Over Time
              </h3>
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--color-text-muted)",
                }}
              >
                Last 72 hours
              </span>
            </div>
            <div className="bg-overlay border border-border rounded-md p-4">
              <MetricChart
                data={chartData}
                color={chartColor}
                height={140}
                showXAxis
                showYAxis
                formatValue={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
                }
                formatTooltipValue={(v) => `${v} occurrences`}
              />
            </div>
          </div>
        )}

        {/* Recent Events */}
        {"recentEvents" in insight.details &&
          insight.details.recentEvents.length > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <h3
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--color-text)",
                      margin: 0,
                    }}
                  >
                    Recent Events
                  </h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle
                        size={14}
                        className="text-muted cursor-help"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      Recent function executions that triggered this insight
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Data may be behind by a couple hours.
                </span>
              </div>
              <div
                className="bg-overlay border border-border rounded-md"
                style={{
                  overflow: "auto",
                }}
              >
                {(insight.kind === "occRetried" ||
                  insight.kind === "occFailedPermanently") && (
                  <OccEventsTable
                    events={insight.details.recentEvents as OccRecentEvent[]}
                    tableName={insight.details.occTableName}
                    onNavigateToDocument={onNavigateToDocument}
                  />
                )}
                {(insight.kind === "bytesReadLimit" ||
                  insight.kind === "bytesReadThreshold" ||
                  insight.kind === "documentsReadLimit" ||
                  insight.kind === "documentsReadThreshold") && (
                  <BytesDocsEventsTable events={insight.details.recentEvents} />
                )}
              </div>
            </div>
          )}

        {/* Documentation Link */}
        <div
          className="bg-overlay border border-border rounded-md p-3"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              color: "var(--color-text-secondary)",
            }}
          >
            Need help resolving this issue?
          </span>
          <a
            href="https://docs.convex.dev/dashboard/deployments/health#insights"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
          >
            View Documentation
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}
