import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Clock, TrendingUp } from "lucide-react";
import { HealthCard } from "./health-card";
import { fetchUdfExecutionStats } from "../../../utils/api/metrics";
import type { FunctionExecutionStats } from "../../../types";

interface SlowestFunctionsCardProps {
  deploymentUrl?: string;
  authToken: string;
  useMockData?: boolean;
}

interface SlowFunction {
  name: string;
  type: "query" | "mutation" | "action" | "httpAction";
  avgLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  count: number;
  trend: "up" | "down" | "stable"; // Latency trend
}

// Normalize UDF type to a consistent format
const normalizeUdfType = (
  udfType: string | undefined | null,
): "query" | "mutation" | "action" | "httpAction" => {
  if (!udfType) return "action";
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

export const SlowestFunctionsCard: React.FC<SlowestFunctionsCardProps> = ({
  deploymentUrl,
  authToken,
  useMockData = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slowFunctions, setSlowFunctions] = useState<SlowFunction[]>([]);
  const cursorRef = useRef<number>(0);

  // Process entries to find slowest functions
  const processEntries = useCallback(
    (entries: FunctionExecutionStats[]): SlowFunction[] => {
      const now = Math.floor(Date.now() / 1000);
      const oneHourAgo = now - 60 * 60;
      const thirtyMinsAgo = now - 30 * 60;

      // Aggregate by function with time-split for trend calculation
      const functionMap = new Map<
        string,
        {
          type: "query" | "mutation" | "action" | "httpAction";
          latencies: number[];
          latenciesFirstHalf: number[];
          latenciesSecondHalf: number[];
          count: number;
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

        const latency = entry.execution_time_ms || 0;
        if (latency <= 0) return; // Skip entries without latency data

        const funcName = entry.identifier || "Unknown";
        const existing = functionMap.get(funcName);
        const isSecondHalf = entryTime >= thirtyMinsAgo;

        if (existing) {
          existing.latencies.push(latency);
          existing.count++;
          if (isSecondHalf) {
            existing.latenciesSecondHalf.push(latency);
          } else {
            existing.latenciesFirstHalf.push(latency);
          }
        } else {
          functionMap.set(funcName, {
            type: normalizeUdfType(entry.udf_type),
            latencies: [latency],
            latenciesFirstHalf: isSecondHalf ? [] : [latency],
            latenciesSecondHalf: isSecondHalf ? [latency] : [],
            count: 1,
          });
        }
      });

      // Convert to array and calculate stats
      const getPercentile = (arr: number[], pct: number): number => {
        if (arr.length === 0) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const idx = Math.floor(sorted.length * pct);
        return sorted[Math.min(idx, sorted.length - 1)];
      };

      const getAverage = (arr: number[]): number => {
        if (arr.length === 0) return 0;
        return arr.reduce((a, b) => a + b, 0) / arr.length;
      };

      const results: SlowFunction[] = Array.from(functionMap.entries())
        .filter(([_, stats]) => stats.count >= 3) // Only functions with at least 3 calls
        .map(([name, stats]) => {
          const avgLatency = getAverage(stats.latencies);
          const avgFirstHalf = getAverage(stats.latenciesFirstHalf);
          const avgSecondHalf = getAverage(stats.latenciesSecondHalf);

          // Calculate trend
          let trend: "up" | "down" | "stable" = "stable";
          if (avgFirstHalf > 0 && avgSecondHalf > 0) {
            const change =
              ((avgSecondHalf - avgFirstHalf) / avgFirstHalf) * 100;
            if (change > 20) trend = "up";
            else if (change < -20) trend = "down";
          }

          return {
            name,
            type: stats.type,
            avgLatency: Math.round(avgLatency),
            p50Latency: Math.round(getPercentile(stats.latencies, 0.5)),
            p95Latency: Math.round(getPercentile(stats.latencies, 0.95)),
            p99Latency: Math.round(getPercentile(stats.latencies, 0.99)),
            count: stats.count,
            trend,
          };
        })
        .sort((a, b) => b.p95Latency - a.p95Latency) // Sort by p95 latency (more meaningful than avg)
        .slice(0, 5);

      return results;
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

        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        const cursor = Math.floor(oneHourAgo);

        const response = await fetchUdfExecutionStats(
          deploymentUrl,
          authToken,
          cursor,
        );

        if (mounted && response && response.entries) {
          const slowest = processEntries(response.entries);
          setSlowFunctions(slowest);
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

  const formatLatency = (ms: number): string => {
    if (ms < 1) return "<1ms";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getLatencyColor = (ms: number): string => {
    if (ms > 5000) return "#EF4444"; // Red for > 5s
    if (ms > 1000) return "#F59E0B"; // Orange for > 1s
    if (ms > 500) return "#EAB308"; // Yellow for > 500ms
    return "var(--color-panel-text)";
  };

  // Find the max p95 for bar scaling
  const maxP95 = useMemo(() => {
    if (slowFunctions.length === 0) return 1000;
    return Math.max(...slowFunctions.map((f) => f.p95Latency));
  }, [slowFunctions]);

  return (
    <HealthCard
      title="Slowest Functions"
      tip="Top 5 functions by p95 latency. Functions with high latency may benefit from optimization, caching, or splitting into smaller operations."
      loading={loading}
      error={error}
    >
      <div style={{ padding: "8px 0" }}>
        {slowFunctions.length > 0 ? (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {slowFunctions.map((fn) => (
              <div
                key={fn.name}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                {/* Function name row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      ...typeBadgeStyles[fn.type],
                      padding: "2px 5px",
                      borderRadius: "3px",
                      fontSize: "9px",
                      fontWeight: 600,
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
                      flex: 1,
                    }}
                    title={fn.name}
                  >
                    {fn.name}
                  </span>
                  {fn.trend === "up" && (
                    <span title="Latency increasing">
                      <TrendingUp
                        size={12}
                        style={{ color: "#EF4444", flexShrink: 0 }}
                      />
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: "10px",
                      color: "var(--color-panel-text-muted)",
                      flexShrink: 0,
                    }}
                  >
                    {fn.count.toLocaleString()} calls
                  </span>
                </div>

                {/* Latency bar and values */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  {/* Latency bar */}
                  <div
                    style={{
                      flex: 1,
                      height: "6px",
                      backgroundColor: "var(--color-panel-bg-secondary)",
                      borderRadius: "3px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, (fn.p95Latency / maxP95) * 100)}%`,
                        height: "100%",
                        backgroundColor: getLatencyColor(fn.p95Latency),
                        borderRadius: "3px",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>

                  {/* Latency values */}
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      fontSize: "10px",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ color: "var(--color-panel-text-muted)" }}>
                      p50:{" "}
                      <span style={{ color: "var(--color-panel-text)" }}>
                        {formatLatency(fn.p50Latency)}
                      </span>
                    </span>
                    <span style={{ color: "var(--color-panel-text-muted)" }}>
                      p95:{" "}
                      <span
                        style={{
                          color: getLatencyColor(fn.p95Latency),
                          fontWeight: 500,
                        }}
                      >
                        {formatLatency(fn.p95Latency)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !loading && !error ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "120px",
              color: "var(--color-panel-text-muted)",
              fontSize: "12px",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <Clock size={24} style={{ opacity: 0.5 }} />
            <span>No latency data available</span>
          </div>
        ) : null}
      </div>
    </HealthCard>
  );
};
