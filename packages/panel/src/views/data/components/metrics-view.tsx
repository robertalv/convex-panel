import React, { useState, useEffect, useMemo, memo } from "react";
import { fetchTableRate } from "../../../utils/api/metrics";
import type { TimeseriesBucket } from "../../../utils/api/types";
import { useSheetActionsSafe } from "../../../contexts/sheet-context";
import { SheetLayout } from "../../../components/shared/sheet-layout";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

export interface MetricsViewProps {
  tableName: string;
  deploymentUrl?: string;
  accessToken?: string;
  componentId?: string | null;
}

// Calculate time buckets based on time range (similar to Convex's calcBuckets)
function calcBuckets(
  start: Date,
  end: Date,
): {
  startTime: Date;
  endTime: Date;
  numBuckets: number;
  timeMultiplier: number;
  formatTime: (time: Date) => string;
} {
  let startMins = start.getTime() / 1000 / 60;
  const endMins = end.getTime() / 1000 / 60;
  const timeDiffMins = endMins - startMins;
  const threeDays = 60 * 72;
  const threeHours = 60 * 3;
  const secondsInMinute = 60;
  const secondsInHour = 60 * 60;
  const secondsInDay = 60 * 60 * 24;

  let numBuckets = 1;
  let timeMultiplier = 60;

  if (timeDiffMins <= threeHours) {
    numBuckets = Math.max(Math.round(timeDiffMins), 1);
    startMins = endMins - numBuckets;
    timeMultiplier = secondsInMinute;
  } else if (timeDiffMins <= threeDays) {
    numBuckets = Math.round(timeDiffMins / 60);
    startMins = endMins - numBuckets * 60;
    timeMultiplier = secondsInHour;
  } else {
    numBuckets = Math.round(timeDiffMins / 60 / 24);
    startMins = endMins - numBuckets * 60 * 24;
    timeMultiplier = secondsInDay;
  }

  function formatTime(time: Date): string {
    if (timeMultiplier === secondsInMinute) {
      return format(time, "h:mm a");
    }
    if (timeMultiplier === secondsInHour) {
      return format(time, "hh a");
    }
    return format(time, "yyyy-MM-dd");
  }

  const startTime = new Date(startMins * 1000 * 60);
  const endTime = new Date(endMins * 1000 * 60);

  return {
    startTime,
    endTime,
    numBuckets,
    timeMultiplier,
    formatTime,
  };
}

export const MetricsView: React.FC<MetricsViewProps> = memo(
  ({ tableName, deploymentUrl, accessToken, componentId }) => {
    const { closeSheet } = useSheetActionsSafe();
    const [readsData, setReadsData] = useState<TimeseriesBucket[]>([]);
    const [writesData, setWritesData] = useState<TimeseriesBucket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    useEffect(() => {
      const fetchMetrics = async () => {
        if (!deploymentUrl || !accessToken || !tableName) {
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setError(null);

        try {
          // Fetch metrics for the last hour
          const end = new Date();
          const start = new Date(end.getTime() - 60 * 60 * 1000); // 1 hour ago

          // Calculate optimal buckets based on time range
          const { startTime, endTime, numBuckets, timeMultiplier } =
            calcBuckets(start, end);

          const [reads, writes] = await Promise.all([
            fetchTableRate(
              deploymentUrl,
              tableName,
              "rowsRead",
              startTime,
              endTime,
              numBuckets,
              accessToken,
            ),
            fetchTableRate(
              deploymentUrl,
              tableName,
              "rowsWritten",
              startTime,
              endTime,
              numBuckets,
              accessToken,
            ),
          ]);

          // Apply time multiplier to convert to rate per time unit
          const adjustedReads = reads.map((bucket) => ({
            ...bucket,
            metric:
              bucket.metric !== null ? bucket.metric * timeMultiplier : null,
          }));
          const adjustedWrites = writes.map((bucket) => ({
            ...bucket,
            metric:
              bucket.metric !== null ? bucket.metric * timeMultiplier : null,
          }));

          setReadsData(adjustedReads);
          setWritesData(adjustedWrites);
          setLastUpdated(new Date());
        } catch (err: any) {
          console.error("Error fetching table metrics:", err);
          setError(err?.message || "Failed to fetch metrics");
          setReadsData([]);
          setWritesData([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchMetrics();

      // Refresh metrics every 30 seconds
      const interval = setInterval(fetchMetrics, 30000);
      return () => clearInterval(interval);
    }, [tableName, deploymentUrl, accessToken, componentId]);

    // Format time for display
    const formatTime = (date: Date): string => {
      const hour12 = date.getHours() % 12 || 12;
      const ampm = date.getHours() >= 12 ? "PM" : "AM";
      const mins = date.getMinutes().toString().padStart(2, "0");
      return `${hour12}:${mins} ${ampm}`;
    };

    // Calculate max value for Y-axis scaling
    // const maxValue = useMemo(() => {
    //   const allValues = [
    //     ...readsData.map(d => d.metric || 0),
    //     ...writesData.map(d => d.metric || 0),
    //   ];
    //   if (allValues.length === 0) return 4;
    //   const max = Math.max(...allValues);
    //   // Round up to nearest nice number
    //   if (max === 0) return 4;
    //   const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
    //   return Math.ceil(max / magnitude) * magnitude;
    // }, [readsData, writesData]);

    // const graphHeight = 200;
    // const graphWidth = 600;

    // Generate time labels from data
    // const timeLabels = useMemo(() => {
    //   const times = readsData.length > 0
    //     ? readsData.map(d => d.time)
    //     : writesData.length > 0
    //       ? writesData.map(d => d.time)
    //       : [];

    //   // Sample every nth label to avoid crowding
    //   const sampleRate = Math.max(1, Math.floor(times.length / 7));
    //   return times
    //     .filter((_, i) => i % sampleRate === 0 || i === times.length - 1)
    //     .map(formatTime);
    // }, [readsData, writesData]);

    // Render data line for a graph
    // const renderDataLine = (data: TimeseriesBucket[], color: string) => {
    //   if (data.length === 0 || maxValue === 0) return null;

    //   const points = data
    //     .map((bucket, index) => {
    //       const x = (index / (data.length - 1)) * graphWidth;
    //       const y = graphHeight - ((bucket.metric || 0) / maxValue) * graphHeight;
    //       return `${x},${y}`;
    //     })
    //     .join(' ');

    //   const areaPoints = `${points} ${graphWidth},${graphHeight} 0,${graphHeight}`;

    //   return (
    //     <>
    //       <polygon
    //         points={areaPoints}
    //         fill={`color-mix(in srgb, ${color} 18%, transparent)`}
    //         stroke="none"
    //       />
    //       <polyline
    //         points={points}
    //         fill="none"
    //         stroke={color}
    //         strokeWidth={2}
    //         strokeLinecap="round"
    //         strokeLinejoin="round"
    //       />
    //     </>
    //   );
    // };

    const formatNumber = (value: number) => {
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
      if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
      return value.toFixed(value >= 10 ? 0 : 1);
    };

    const readsTotal = useMemo(
      () => readsData.reduce((sum, bucket) => sum + (bucket.metric || 0), 0),
      [readsData],
    );

    const writesTotal = useMemo(
      () => writesData.reduce((sum, bucket) => sum + (bucket.metric || 0), 0),
      [writesData],
    );

    const peakValue = useMemo(() => {
      const combined = [...readsData, ...writesData].map((b) => b.metric || 0);
      return combined.length ? Math.max(...combined) : 0;
    }, [readsData, writesData]);

    const latestReads = readsData.length
      ? readsData[readsData.length - 1].metric || 0
      : 0;
    const latestWrites = writesData.length
      ? writesData[writesData.length - 1].metric || 0
      : 0;
    const avgReads = readsData.length ? readsTotal / readsData.length : 0;
    const avgWrites = writesData.length ? writesTotal / writesData.length : 0;

    const getTrendPercent = (data: TimeseriesBucket[]) => {
      if (data.length < 2) return 0;
      const first = data[0].metric || 0;
      const last = data[data.length - 1].metric || 0;
      if (first === 0) {
        return last === 0 ? 0 : 100;
      }
      return ((last - first) / Math.abs(first)) * 100;
    };

    const readsTrend = getTrendPercent(readsData);
    const writesTrend = getTrendPercent(writesData);

    // Format chart data for recharts
    const chartData = useMemo(() => {
      if (readsData.length === 0 && writesData.length === 0) {
        return [];
      }

      // Get formatTime function from calcBuckets
      const end = new Date();
      const start = new Date(end.getTime() - 60 * 60 * 1000);
      const { formatTime } = calcBuckets(start, end);

      const maxLength = Math.max(readsData.length, writesData.length);
      const data = [];

      for (let i = 0; i < maxLength; i++) {
        const readBucket = readsData[i];
        const writeBucket = writesData[i];
        const time = readBucket?.time || writeBucket?.time;

        if (time) {
          data.push({
            time: formatTime(time),
            reads: readBucket?.metric ?? 0,
            writes: writeBucket?.metric ?? 0,
          });
        }
      }

      return data;
    }, [readsData, writesData]);

    const subtitle = (
      <>
        for{" "}
        <code
          style={{
            fontFamily: "monospace",
            fontSize: "12px",
            padding: "2px 4px",
            borderRadius: "3px",
            backgroundColor: "var(--color-panel-bg-tertiary)",
            border: "1px solid var(--color-panel-border)",
          }}
        >
          {tableName}
        </code>
      </>
    );

    return (
      <SheetLayout
        title="Metrics"
        subtitle={subtitle}
        onClose={closeSheet}
        contentStyle={{ padding: "20px" }}
      >
        {isLoading && (
          <div
            style={{
              padding: "12px",
              fontSize: "12px",
              color: "var(--color-panel-text-muted)",
            }}
          >
            Loading metrics…
          </div>
        )}

        {error && !isLoading && (
          <div
            style={{
              padding: "12px",
              marginBottom: "12px",
              fontSize: "12px",
              color: "var(--color-panel-error)",
              backgroundColor: "var(--color-panel-bg-tertiary)",
              border: "1px solid var(--color-panel-border)",
              borderRadius: "6px",
            }}
          >
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginBottom: "16px",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: "var(--color-panel-text-secondary)",
                }}
              >
                Reads and writes over the last hour. Values are aggregated into
                fixed time buckets.
              </p>
              {lastUpdated && (
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--color-panel-text-muted)",
                  }}
                >
                  Updated {formatTime(lastUpdated)} • Auto‑refreshing every 30s
                </span>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <StatsCard
                label="Total reads (1h)"
                value={formatNumber(readsTotal)}
                color="var(--color-panel-accent)"
              />
              <StatsCard
                label="Total writes (1h)"
                value={formatNumber(writesTotal)}
                color="var(--color-panel-warning)"
              />
              <StatsCard
                label="Peak throughput"
                value={formatNumber(peakValue)}
                color="var(--color-panel-text)"
              />
            </div>

            <div
              style={{
                marginTop: "24px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "12px",
              }}
            >
              <MetricDetailCard
                title="Reads overview"
                latestLabel="Current interval"
                latestValue={formatNumber(latestReads)}
                averageValue={formatNumber(avgReads)}
                trend={readsTrend}
                color="var(--color-panel-accent)"
              />
              <MetricDetailCard
                title="Writes overview"
                latestLabel="Current interval"
                latestValue={formatNumber(latestWrites)}
                averageValue={formatNumber(avgWrites)}
                trend={writesTrend}
                color="var(--color-panel-warning)"
              />
            </div>

            {/* Charts */}
            <div
              style={{
                marginTop: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: "0 0 12px 0",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--color-panel-text)",
                  }}
                >
                  Reads
                </h3>
                <div
                  style={{
                    backgroundColor: "var(--color-panel-bg-tertiary)",
                    border: "1px solid var(--color-panel-border)",
                    borderRadius: "6px",
                    padding: "16px",
                    height: "200px",
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} syncId="table-metrics">
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-panel-border)"
                        opacity={0.3}
                      />
                      <XAxis
                        dataKey="time"
                        stroke="var(--color-panel-text-muted)"
                        tick={{
                          fill: "var(--color-panel-text-muted)",
                          fontSize: 12,
                        }}
                        tickLine={{ stroke: "var(--color-panel-text-muted)" }}
                      />
                      <YAxis
                        stroke="var(--color-panel-text-muted)"
                        tick={{
                          fill: "var(--color-panel-text-muted)",
                          fontSize: 12,
                        }}
                        tickLine={false}
                        width={60}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-panel-bg)",
                          border: "1px solid var(--color-panel-border)",
                          borderRadius: "6px",
                          color: "var(--color-panel-text)",
                        }}
                        labelStyle={{ color: "var(--color-panel-text)" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="reads"
                        stroke="var(--color-panel-accent)"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h3
                  style={{
                    margin: "0 0 12px 0",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--color-panel-text)",
                  }}
                >
                  Writes
                </h3>
                <div
                  style={{
                    backgroundColor: "var(--color-panel-bg-tertiary)",
                    border: "1px solid var(--color-panel-border)",
                    borderRadius: "6px",
                    padding: "16px",
                    height: "200px",
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} syncId="table-metrics">
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-panel-border)"
                        opacity={0.3}
                      />
                      <XAxis
                        dataKey="time"
                        stroke="var(--color-panel-text-muted)"
                        tick={{
                          fill: "var(--color-panel-text-muted)",
                          fontSize: 12,
                        }}
                        tickLine={{ stroke: "var(--color-panel-text-muted)" }}
                      />
                      <YAxis
                        stroke="var(--color-panel-text-muted)"
                        tick={{
                          fill: "var(--color-panel-text-muted)",
                          fontSize: 12,
                        }}
                        tickLine={false}
                        width={60}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-panel-bg)",
                          border: "1px solid var(--color-panel-border)",
                          borderRadius: "6px",
                          color: "var(--color-panel-text)",
                        }}
                        labelStyle={{ color: "var(--color-panel-text)" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="writes"
                        stroke="var(--color-panel-warning)"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetLayout>
    );
  },
);

MetricsView.displayName = "MetricsView";

const StatsCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) => (
  <div
    style={{
      backgroundColor: "var(--color-panel-bg-tertiary)",
      border: "1px solid var(--color-panel-border)",
      borderRadius: "6px",
      padding: "12px 14px",
      display: "flex",
      flexDirection: "column",
      gap: 4,
    }}
  >
    <span style={{ fontSize: 11, color: "var(--color-panel-text-muted)" }}>
      {label}
    </span>
    <span style={{ fontSize: 18, fontWeight: 600, color }}>{value}</span>
  </div>
);

const MetricDetailCard = ({
  title,
  latestLabel,
  latestValue,
  averageValue,
  trend,
  color,
}: {
  title: string;
  latestLabel: string;
  latestValue: string;
  averageValue: string;
  trend: number;
  color: string;
}) => (
  <div
    style={{
      backgroundColor: "var(--color-panel-bg-tertiary)",
      border: "1px solid var(--color-panel-border)",
      borderRadius: "6px",
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ fontSize: "13px", color: "var(--color-panel-text)" }}>
        {title}
      </div>
      <span
        style={{
          fontSize: "11px",
          padding: "2px 8px",
          borderRadius: "999px",
          backgroundColor: "var(--color-panel-bg-secondary)",
          color: "var(--color-panel-text-muted)",
        }}
      >
        Last hour
      </span>
    </div>
    <div>
      <div
        style={{
          fontSize: "12px",
          color: "var(--color-panel-text-muted)",
          marginBottom: "4px",
        }}
      >
        {latestLabel}
      </div>
      <div style={{ fontSize: "24px", fontWeight: 600, color }}>
        {latestValue}
      </div>
    </div>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: "12px",
        color: "var(--color-panel-text-muted)",
      }}
    >
      <span>
        Avg per interval{" "}
        <strong style={{ color: "var(--color-panel-text)" }}>
          {averageValue}
        </strong>
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <span
          style={{
            color: trend >= 0 ? color : "var(--color-panel-error)",
            fontWeight: 600,
          }}
        >
          {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}%
        </span>
        <span>vs start</span>
      </span>
    </div>
  </div>
);
