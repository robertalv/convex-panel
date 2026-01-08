import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Card } from "../../../components/shared/card";
import { StackedBarChart } from "./stacked-bar-chart";
import type { StackedBarSeries } from "./stacked-bar-chart";
import { fetchUdfExecutionStats } from "../../../utils/api/metrics";
import type { FunctionExecutionStats } from "../../../types";
import type { TimeRange } from "@convex-panel/shared";

interface TopFunctionsCardProps {
  deploymentUrl?: string;
  authToken: string;
  useMockData?: boolean;
}

interface FunctionStat {
  name: string;
  type: "query" | "mutation" | "action" | "httpAction";
  count: number;
  avgLatency: number;
  errorRate: number;
  successCount: number;
  errorCount: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
}

interface AggregatedData {
  timestamps: number[];
  successful: number[];
  failed: number[];
  topFunctions: FunctionStat[];
}

// Normalize UDF type to a consistent format
const normalizeUdfType = (
  udfType: string | undefined | null,
): "query" | "mutation" | "action" | "httpAction" => {
  if (!udfType) return "action"; // Default to action for unknown types
  const type = udfType.toLowerCase();
  if (type === "query" || type === "q") return "query";
  if (type === "mutation" || type === "m") return "mutation";
  if (type === "httpaction" || type === "http" || type === "h")
    return "httpAction";
  return "action";
};

const typeBadgeStyles: Record<string, React.CSSProperties> = {
  query: { backgroundColor: "rgba(59, 130, 246, 0.15)", color: "#3B82F6" },
  mutation: { backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10B981" },
  action: { backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#F59E0B" },
  httpAction: { backgroundColor: "rgba(139, 92, 246, 0.15)", color: "#8B5CF6" },
};

export const TopFunctionsCard: React.FC<TopFunctionsCardProps> = ({
  deploymentUrl,
  authToken,
  useMockData = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFunction, setExpandedFunction] = useState<string | null>(null);
  const [data, setData] = useState<AggregatedData | null>(null);
  const cursorRef = useRef<number>(0);

  // Process entries into aggregated data
  const processEntries = useCallback(
    (entries: FunctionExecutionStats[]): AggregatedData => {
      const now = Math.floor(Date.now() / 1000);
      const oneHourAgo = now - 60 * 60;
      const numBuckets = 60;
      const bucketSizeSeconds = 60;

      // Initialize arrays
      const timestamps: number[] = [];
      const successful: number[] = Array(numBuckets).fill(0);
      const failed: number[] = Array(numBuckets).fill(0);

      // Generate timestamps
      for (let i = 0; i < numBuckets; i++) {
        timestamps.push(oneHourAgo + i * bucketSizeSeconds);
      }

      // Aggregate by function
      const functionMap = new Map<
        string,
        {
          type: "query" | "mutation" | "action" | "httpAction";
          count: number;
          successCount: number;
          errorCount: number;
          latencies: number[];
        }
      >();

      entries.forEach((entry) => {
        let entryTime = entry.timestamp;
        if (entryTime > 1e12) {
          entryTime = Math.floor(entryTime / 1000);
        }

        // Skip entries outside our time window
        if (entryTime < oneHourAgo || entryTime > now) {
          return;
        }

        // Update time-bucketed success/failure counts
        const bucketIndex = Math.floor(
          (entryTime - oneHourAgo) / bucketSizeSeconds,
        );
        const clampedIndex = Math.max(0, Math.min(numBuckets - 1, bucketIndex));

        if (entry.success) {
          successful[clampedIndex]++;
        } else {
          failed[clampedIndex]++;
        }

        // Aggregate by function
        const funcName = entry.identifier || "Unknown";
        const existing = functionMap.get(funcName);
        const latency = entry.execution_time_ms || 0;

        if (existing) {
          existing.count++;
          if (entry.success) {
            existing.successCount++;
          } else {
            existing.errorCount++;
          }
          if (latency > 0) {
            existing.latencies.push(latency);
          }
        } else {
          functionMap.set(funcName, {
            type: normalizeUdfType(entry.udf_type),
            count: 1,
            successCount: entry.success ? 1 : 0,
            errorCount: entry.success ? 0 : 1,
            latencies: latency > 0 ? [latency] : [],
          });
        }
      });

      // Convert to sorted array and calculate percentiles
      const topFunctions: FunctionStat[] = Array.from(functionMap.entries())
        .map(([name, stats]) => {
          const sortedLatencies = stats.latencies.sort((a, b) => a - b);
          const getPercentile = (arr: number[], pct: number) => {
            if (arr.length === 0) return 0;
            const idx = Math.floor(arr.length * pct);
            return arr[Math.min(idx, arr.length - 1)];
          };

          const avgLatency =
            sortedLatencies.length > 0
              ? sortedLatencies.reduce((a, b) => a + b, 0) /
                sortedLatencies.length
              : 0;

          return {
            name,
            type: stats.type,
            count: stats.count,
            avgLatency: Math.round(avgLatency),
            errorRate:
              stats.count > 0 ? (stats.errorCount / stats.count) * 100 : 0,
            successCount: stats.successCount,
            errorCount: stats.errorCount,
            p50Latency: Math.round(getPercentile(sortedLatencies, 0.5)),
            p95Latency: Math.round(getPercentile(sortedLatencies, 0.95)),
            p99Latency: Math.round(getPercentile(sortedLatencies, 0.99)),
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 functions

      return { timestamps, successful, failed, topFunctions };
    },
    [],
  );

  useEffect(() => {
    if (!deploymentUrl || !authToken) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch real data from the API
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        const cursor = Math.floor(oneHourAgo);

        const response = await fetchUdfExecutionStats(
          deploymentUrl,
          authToken,
          cursor,
        );

        if (mounted && response && response.entries) {
          const aggregatedData = processEntries(response.entries);
          setData(aggregatedData);
          cursorRef.current = response.new_cursor;
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to fetch function data",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [deploymentUrl, authToken, useMockData, processEntries]);

  const series: StackedBarSeries[] = useMemo(() => {
    if (!data) return [];
    return [
      { name: "Successful", color: "#10B981", data: data.successful },
      { name: "Failed", color: "#EF4444", data: data.failed },
    ];
  }, [data]);

  const timeRange: TimeRange = useMemo(() => {
    if (!data || data.timestamps.length === 0) {
      return { start: "", end: "" };
    }
    const startDate = new Date(data.timestamps[0] * 1000);
    const endDate = new Date(
      data.timestamps[data.timestamps.length - 1] * 1000,
    );
    return {
      start: startDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      end: endDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  }, [data]);

  const totalInvocations = useMemo(() => {
    if (!data) return 0;
    return data.topFunctions.reduce((sum, f) => sum + f.count, 0);
  }, [data]);

  const totalErrors = useMemo(() => {
    if (!data) return 0;
    return data.topFunctions.reduce((sum, f) => sum + f.errorCount, 0);
  }, [data]);

  const getTimeRangeDisplay = (): string => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const formatTime = (date: Date) => {
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    };
    return `${formatTime(oneHourAgo)} - ${formatTime(now)}`;
  };

  const formatLatency = (ms: number): string => {
    if (ms < 1) return "<1ms";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <Card
      title="Total Invocations"
      action={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "10px",
            color: "var(--color-panel-text-muted)",
          }}
        >
          {getTimeRangeDisplay()}
        </div>
      }
    >
      {loading ? (
        <div
          style={{
            padding: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-panel-text-muted)",
            fontSize: "12px",
          }}
        >
          Loading...
        </div>
      ) : error ? (
        <div
          style={{
            padding: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-panel-error)",
            fontSize: "12px",
          }}
        >
          {error}
        </div>
      ) : (
        <div>
          {/* Total count and chart */}
          <div style={{ padding: "12px 16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: 600,
                  color: "var(--color-panel-text)",
                }}
              >
                {totalInvocations.toLocaleString()}
              </div>
              {totalErrors > 0 && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--color-panel-error)",
                  }}
                >
                  ({totalErrors.toLocaleString()} errors)
                </div>
              )}
            </div>

            {data && data.timestamps.length > 0 && (
              <StackedBarChart
                timestamps={data.timestamps}
                series={series}
                timeRange={timeRange}
                height={80}
                showLegend={false}
                formatValue={(v) => v.toFixed(0)}
              />
            )}
          </div>

          {/* Function list header */}
          {data && data.topFunctions.length > 0 && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "24px 1fr 80px 80px 60px",
                  gap: "8px",
                  padding: "8px 16px",
                  borderTop: "1px solid var(--color-panel-border)",
                  borderBottom: "1px solid var(--color-panel-border)",
                  backgroundColor: "var(--color-panel-bg-secondary)",
                  fontSize: "10px",
                  fontWeight: 500,
                  color: "var(--color-panel-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                <div></div>
                <div>Function</div>
                <div style={{ textAlign: "right" }}>Count</div>
                <div style={{ textAlign: "right" }}>Latency</div>
                <div style={{ textAlign: "right" }}>Errors</div>
              </div>

              {/* Function list */}
              <div>
                {data.topFunctions.map((fn) => (
                  <div key={fn.name}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "24px 1fr 80px 80px 60px",
                        gap: "8px",
                        padding: "10px 16px",
                        borderBottom: "1px solid var(--color-panel-border)",
                        cursor: "pointer",
                        transition: "background-color 0.15s",
                        alignItems: "center",
                      }}
                      onClick={() =>
                        setExpandedFunction(
                          expandedFunction === fn.name ? null : fn.name,
                        )
                      }
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--color-panel-bg-hover)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <div style={{ color: "var(--color-panel-text-muted)" }}>
                        {expandedFunction === fn.name ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            ...typeBadgeStyles[fn.type],
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "10px",
                            fontWeight: 500,
                            textTransform: "uppercase",
                            flexShrink: 0,
                          }}
                        >
                          {fn.type === "httpAction"
                            ? "HTTP"
                            : fn.type.slice(0, 1).toUpperCase()}
                        </span>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "var(--color-panel-text)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={fn.name}
                        >
                          {fn.name}
                        </span>
                      </div>
                      <div
                        style={{
                          textAlign: "right",
                          fontSize: "12px",
                          fontWeight: 500,
                          color: "var(--color-panel-text)",
                        }}
                      >
                        {fn.count.toLocaleString()}
                      </div>
                      <div
                        style={{
                          textAlign: "right",
                          fontSize: "12px",
                          color:
                            fn.avgLatency > 1000
                              ? "var(--color-panel-warning)"
                              : "var(--color-panel-text-secondary)",
                        }}
                      >
                        {formatLatency(fn.avgLatency)}
                      </div>
                      <div
                        style={{
                          textAlign: "right",
                          fontSize: "12px",
                          color:
                            fn.errorRate > 1
                              ? "var(--color-panel-error)"
                              : fn.errorRate > 0
                                ? "var(--color-panel-warning)"
                                : "var(--color-panel-text-muted)",
                        }}
                      >
                        {fn.errorRate > 0 ? `${fn.errorRate.toFixed(1)}%` : "-"}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {expandedFunction === fn.name && (
                      <div
                        style={{
                          padding: "12px 16px 12px 40px",
                          backgroundColor: "var(--color-panel-bg-secondary)",
                          borderBottom: "1px solid var(--color-panel-border)",
                          fontSize: "11px",
                          color: "var(--color-panel-text-secondary)",
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr 1fr",
                            gap: "16px",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                color: "var(--color-panel-text-muted)",
                                marginBottom: "4px",
                              }}
                            >
                              p50 Latency
                            </div>
                            <div
                              style={{
                                fontWeight: 500,
                                color: "var(--color-panel-text)",
                              }}
                            >
                              {formatLatency(fn.p50Latency)}
                            </div>
                          </div>
                          <div>
                            <div
                              style={{
                                color: "var(--color-panel-text-muted)",
                                marginBottom: "4px",
                              }}
                            >
                              p95 Latency
                            </div>
                            <div
                              style={{
                                fontWeight: 500,
                                color: "var(--color-panel-text)",
                              }}
                            >
                              {formatLatency(fn.p95Latency)}
                            </div>
                          </div>
                          <div>
                            <div
                              style={{
                                color: "var(--color-panel-text-muted)",
                                marginBottom: "4px",
                              }}
                            >
                              p99 Latency
                            </div>
                            <div
                              style={{
                                fontWeight: 500,
                                color: "var(--color-panel-text)",
                              }}
                            >
                              {formatLatency(fn.p99Latency)}
                            </div>
                          </div>
                          <div>
                            <div
                              style={{
                                color: "var(--color-panel-text-muted)",
                                marginBottom: "4px",
                              }}
                            >
                              Success / Errors
                            </div>
                            <div
                              style={{
                                fontWeight: 500,
                                color: "var(--color-panel-text)",
                              }}
                            >
                              {fn.successCount.toLocaleString()} /{" "}
                              {fn.errorCount.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* No data state */}
          {(!data || data.topFunctions.length === 0) && (
            <div
              style={{
                padding: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-panel-text-muted)",
                fontSize: "12px",
              }}
            >
              No function data available
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
