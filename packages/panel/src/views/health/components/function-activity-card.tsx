import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { BarChart3, TrendingUp } from "lucide-react";
import { HealthCard } from "./health-card";
import { StackedBarChart } from "./stacked-bar-chart";
import type { StackedBarSeries } from "./stacked-bar-chart";
import { TooltipAction } from "../../../components/shared/tooltip-action";
import { fetchUdfExecutionStats } from "../../../utils/api/metrics";
import type { FunctionExecutionStats } from "../../../types";
import type { TimeRange } from "../types";

interface FunctionActivityCardProps {
  deploymentUrl?: string;
  authToken: string;
  useMockData?: boolean;
}

interface FunctionActivityData {
  timestamps: number[];
  queries: number[];
  mutations: number[];
  actions: number[];
  scheduled: number[];
  httpActions: number[];
}

// Normalize UDF type to a consistent format
const normalizeUdfType = (udfType: string | undefined | null): string => {
  if (!udfType) return "action"; // Default to action for unknown types
  const type = udfType.toLowerCase();
  if (type === "query" || type === "q") return "query";
  if (type === "mutation" || type === "m") return "mutation";
  if (type === "action" || type === "a") return "action";
  if (type === "httpaction" || type === "http" || type === "h")
    return "httpAction";
  return type;
};

// Check if a function is scheduled (cron or scheduled)
const isScheduledFunction = (entry: FunctionExecutionStats): boolean => {
  const identifier = entry.identifier?.toLowerCase() || "";
  const componentPath = entry.component_path?.toLowerCase() || "";
  return (
    identifier.includes("cron") ||
    identifier.includes("scheduled") ||
    componentPath.includes("cron") ||
    componentPath.includes("scheduled")
  );
};

export const FunctionActivityCard: React.FC<FunctionActivityCardProps> = ({
  deploymentUrl,
  authToken,
  useMockData = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChart, setShowChart] = useState(true);
  const [data, setData] = useState<FunctionActivityData | null>(null);
  const cursorRef = useRef<number>(0);

  // Process entries into time-bucketed activity data
  const processEntries = useCallback(
    (entries: FunctionExecutionStats[]): FunctionActivityData => {
      const now = Math.floor(Date.now() / 1000);
      const oneHourAgo = now - 60 * 60;
      const numBuckets = 60; // 1 minute intervals
      const bucketSizeSeconds = 60;

      // Initialize arrays
      const timestamps: number[] = [];
      const queries: number[] = Array(numBuckets).fill(0);
      const mutations: number[] = Array(numBuckets).fill(0);
      const actions: number[] = Array(numBuckets).fill(0);
      const scheduled: number[] = Array(numBuckets).fill(0);
      const httpActions: number[] = Array(numBuckets).fill(0);

      // Generate timestamps
      for (let i = 0; i < numBuckets; i++) {
        timestamps.push(oneHourAgo + i * bucketSizeSeconds);
      }

      // Process each entry
      entries.forEach((entry) => {
        let entryTime = entry.timestamp;
        // Convert milliseconds to seconds if needed
        if (entryTime > 1e12) {
          entryTime = Math.floor(entryTime / 1000);
        }

        // Skip entries outside our time window
        if (entryTime < oneHourAgo || entryTime > now) {
          return;
        }

        // Calculate bucket index
        const bucketIndex = Math.floor(
          (entryTime - oneHourAgo) / bucketSizeSeconds,
        );
        const clampedIndex = Math.max(0, Math.min(numBuckets - 1, bucketIndex));

        // Categorize by type
        const udfType = normalizeUdfType(entry.udf_type);

        // Check if it's a scheduled function first
        if (isScheduledFunction(entry)) {
          scheduled[clampedIndex]++;
        } else {
          switch (udfType) {
            case "query":
              queries[clampedIndex]++;
              break;
            case "mutation":
              mutations[clampedIndex]++;
              break;
            case "action":
              actions[clampedIndex]++;
              break;
            case "httpaction":
              httpActions[clampedIndex]++;
              break;
            default:
              // Default to action for unknown types
              actions[clampedIndex]++;
          }
        }
      });

      return {
        timestamps,
        queries,
        mutations,
        actions,
        scheduled,
        httpActions,
      };
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
          const activityData = processEntries(response.entries);
          setData(activityData);
          cursorRef.current = response.new_cursor;
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to fetch function activity",
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
      { name: "Queries", color: "#3B82F6", data: data.queries },
      { name: "Mutations", color: "#10B981", data: data.mutations },
      { name: "Actions", color: "#F59E0B", data: data.actions },
      { name: "Scheduled", color: "#EF4444", data: data.scheduled },
      { name: "HTTP", color: "#8B5CF6", data: data.httpActions },
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

  const currentRate = useMemo(() => {
    if (!data || data.timestamps.length === 0) return 0;
    const lastIdx = data.timestamps.length - 1;
    return (
      data.queries[lastIdx] +
      data.mutations[lastIdx] +
      data.actions[lastIdx] +
      data.scheduled[lastIdx] +
      data.httpActions[lastIdx]
    );
  }, [data]);

  const totalInvocations = useMemo(() => {
    if (!data) return 0;
    let total = 0;
    for (let i = 0; i < data.timestamps.length; i++) {
      total +=
        data.queries[i] +
        data.mutations[i] +
        data.actions[i] +
        data.scheduled[i] +
        data.httpActions[i];
    }
    return total;
  }, [data]);

  const maxValue = useMemo(() => {
    if (!data || data.timestamps.length === 0) return 100;
    let max = 0;
    for (let i = 0; i < data.timestamps.length; i++) {
      const total =
        data.queries[i] +
        data.mutations[i] +
        data.actions[i] +
        data.scheduled[i] +
        data.httpActions[i];
      if (total > max) max = total;
    }
    return Math.ceil(max * 1.1) || 100;
  }, [data]);

  return (
    <HealthCard
      title="Function Activity"
      tip="Function invocations per minute by type, showing queries, mutations, actions, scheduled functions, and HTTP actions."
      loading={loading}
      error={error}
      action={
        <TooltipAction
          icon={showChart ? <TrendingUp size={16} /> : <BarChart3 size={16} />}
          text={showChart ? "Chart View" : "Summary View"}
          onClick={() => setShowChart(!showChart)}
        />
      }
    >
      <div style={{ padding: "8px 0" }}>
        {/* Current value display */}
        <div
          style={{
            marginBottom: "16px",
            display: "flex",
            alignItems: "baseline",
            gap: "8px",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              fontWeight: 600,
              color: "var(--color-panel-text)",
            }}
          >
            {currentRate}
          </div>
          <div
            style={{ fontSize: "12px", color: "var(--color-panel-text-muted)" }}
          >
            invocations/min
          </div>
          <div
            style={{
              marginLeft: "auto",
              fontSize: "11px",
              color: "var(--color-panel-text-secondary)",
            }}
          >
            {totalInvocations.toLocaleString()} total (1h)
          </div>
        </div>

        {/* Stacked bar chart */}
        {data && showChart && (
          <StackedBarChart
            timestamps={data.timestamps}
            series={series}
            timeRange={timeRange}
            height={100}
            showLegend={true}
            formatValue={(v) => `${v.toFixed(0)}`}
            maxValue={maxValue}
          />
        )}

        {/* Summary view */}
        {data && !showChart && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {series.map((s) => {
              // Sum up all values for this series
              const total = s.data.reduce((sum, val) => sum + val, 0);
              const overallTotal = totalInvocations || 1;
              const pct = ((total / overallTotal) * 100).toFixed(1);
              return (
                <div
                  key={s.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      backgroundColor: s.color,
                      borderRadius: "2px",
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      fontSize: "12px",
                      color: "var(--color-panel-text)",
                    }}
                  >
                    {s.name}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "var(--color-panel-text)",
                    }}
                  >
                    {total.toLocaleString()}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--color-panel-text-muted)",
                      width: "45px",
                      textAlign: "right",
                    }}
                  >
                    {pct}%
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* No data state */}
        {!data && !loading && !error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100px",
              color: "var(--color-panel-text-muted)",
              fontSize: "12px",
            }}
          >
            No function activity data available
          </div>
        )}
      </div>
    </HealthCard>
  );
};
