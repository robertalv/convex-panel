/**
 * MetricsSheet Component
 * Displays read/write metrics for a table with charts
 */

import { useState, useEffect, useMemo, memo } from "react";
import { RefreshCw } from "lucide-react";
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
import { ResizableSheet } from "./ResizableSheet";

interface TimeseriesBucket {
  time: Date;
  metric: number | null;
}

export interface MetricsSheetProps {
  tableName: string;
  deploymentUrl?: string;
  accessToken?: string;
  componentId?: string | null;
  onClose: () => void;
}

// Calculate time buckets based on time range
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

// Serialize date for API request
interface SerializedDate {
  secs_since_epoch: number;
  nanos_since_epoch: number;
}

function serializeDate(date: Date): SerializedDate {
  const unixTsSeconds = date.getTime() / 1000;
  const secsSinceEpoch = Math.floor(unixTsSeconds);
  const nanosSinceEpoch = Math.floor((unixTsSeconds - secsSinceEpoch) * 1e9);
  return {
    secs_since_epoch: secsSinceEpoch,
    nanos_since_epoch: nanosSinceEpoch,
  };
}

// Parse date from API response
function parseDate(date: SerializedDate): Date {
  let unixTsMs = date.secs_since_epoch * 1000;
  unixTsMs += date.nanos_since_epoch / 1_000_000;
  return new Date(unixTsMs);
}

// API response format: Array<[SerializedDate, number | null]>
type TimeseriesResponse = [SerializedDate, number | null][];

// Fetch table rate metrics
async function fetchTableRate(
  deploymentUrl: string,
  tableName: string,
  metric: "rowsRead" | "rowsWritten",
  start: Date,
  end: Date,
  numBuckets: number,
  accessToken: string,
): Promise<TimeseriesBucket[]> {
  // Build window args as JSON object
  const windowArgs = {
    start: serializeDate(start),
    end: serializeDate(end),
    num_buckets: numBuckets,
  };

  // Build URL with proper encoding
  const name = encodeURIComponent(tableName);
  const window = encodeURIComponent(JSON.stringify(windowArgs));
  const url = `${deploymentUrl}/api/app_metrics/table_rate?name=${name}&metric=${metric}&window=${window}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Convex ${accessToken}`,
      "Convex-Client": "dashboard-0.0.0",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch metrics: ${errorText || response.statusText}`,
    );
  }

  // Response is Array<[SerializedDate, number | null]>
  const data: TimeseriesResponse = await response.json();
  return data.map(([time, metricValue]) => ({
    time: parseDate(time),
    metric: metricValue,
  }));
}

export const MetricsSheet: React.FC<MetricsSheetProps> = memo(
  ({
    tableName,
    deploymentUrl,
    accessToken,
    componentId: _componentId,
    onClose,
  }) => {
    const [readsData, setReadsData] = useState<TimeseriesBucket[]>([]);
    const [writesData, setWritesData] = useState<TimeseriesBucket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
        const { startTime, endTime, numBuckets, timeMultiplier } = calcBuckets(
          start,
          end,
        );

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

    useEffect(() => {
      fetchMetrics();

      // Refresh metrics every 30 seconds
      const interval = setInterval(fetchMetrics, 30000);
      return () => clearInterval(interval);
    }, [tableName, deploymentUrl, accessToken]);

    // Format time for display
    const formatTime = (date: Date): string => {
      const hour12 = date.getHours() % 12 || 12;
      const ampm = date.getHours() >= 12 ? "PM" : "AM";
      const mins = date.getMinutes().toString().padStart(2, "0");
      return `${hour12}:${mins} ${ampm}`;
    };

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

    return (
      <ResizableSheet
        id="metrics-sheet"
        title="Metrics"
        subtitle={tableName}
        onClose={onClose}
        defaultWidth={400}
        minWidth={350}
        maxWidth={700}
        headerActions={
          <button
            onClick={fetchMetrics}
            disabled={isLoading}
            className="p-1.5 rounded-lg transition-colors"
            style={{
              color: "var(--color-text-muted)",
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "var(--color-surface-raised)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            title="Refresh"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </button>
        }
      >
        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading && (
            <div
              className="text-xs py-3"
              style={{ color: "var(--color-text-muted)" }}
            >
              Loading metrics...
            </div>
          )}

          {error && !isLoading && (
            <div
              className="text-xs py-3 px-4 rounded-lg mb-4"
              style={{
                color: "var(--color-error-base)",
                backgroundColor: "var(--color-surface-raised)",
                border: "1px solid var(--color-border-base)",
              }}
            >
              {error}
            </div>
          )}

          {!isLoading && !error && (
            <>
              {/* Info text */}
              <div className="flex flex-col gap-2 mb-4">
                <p
                  className="text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Reads and writes over the last hour. Values are aggregated
                  into fixed time buckets.
                </p>
                {lastUpdated && (
                  <span
                    className="text-xs"
                    style={{ color: "var(--color-text-subtle)" }}
                  >
                    Updated {formatTime(lastUpdated)} - Auto-refreshing every
                    30s
                  </span>
                )}
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <StatsCard
                  label="Total reads (1h)"
                  value={formatNumber(readsTotal)}
                  color="var(--color-brand-base)"
                />
                <StatsCard
                  label="Total writes (1h)"
                  value={formatNumber(writesTotal)}
                  color="var(--color-warning-base)"
                />
                <StatsCard
                  label="Peak throughput"
                  value={formatNumber(peakValue)}
                  color="var(--color-text-base)"
                />
              </div>

              {/* Charts */}
              <div className="flex flex-col gap-6">
                <div>
                  <h3
                    className="text-sm font-semibold mb-3"
                    style={{ color: "var(--color-text-base)" }}
                  >
                    Reads
                  </h3>
                  <div
                    className="rounded-lg p-4 h-48"
                    style={{
                      backgroundColor: "var(--color-surface-raised)",
                      border: "1px solid var(--color-border-base)",
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} syncId="table-metrics">
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--color-border-base)"
                          opacity={0.3}
                        />
                        <XAxis
                          dataKey="time"
                          stroke="var(--color-text-muted)"
                          tick={{
                            fill: "var(--color-text-muted)",
                            fontSize: 11,
                          }}
                          tickLine={{ stroke: "var(--color-text-muted)" }}
                        />
                        <YAxis
                          stroke="var(--color-text-muted)"
                          tick={{
                            fill: "var(--color-text-muted)",
                            fontSize: 11,
                          }}
                          tickLine={false}
                          width={50}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--color-surface-base)",
                            border: "1px solid var(--color-border-base)",
                            borderRadius: "6px",
                            color: "var(--color-text-base)",
                            fontSize: "12px",
                          }}
                          labelStyle={{ color: "var(--color-text-base)" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="reads"
                          stroke="var(--color-brand-base)"
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
                    className="text-sm font-semibold mb-3"
                    style={{ color: "var(--color-text-base)" }}
                  >
                    Writes
                  </h3>
                  <div
                    className="rounded-lg p-4 h-48"
                    style={{
                      backgroundColor: "var(--color-surface-raised)",
                      border: "1px solid var(--color-border-base)",
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} syncId="table-metrics">
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--color-border-base)"
                          opacity={0.3}
                        />
                        <XAxis
                          dataKey="time"
                          stroke="var(--color-text-muted)"
                          tick={{
                            fill: "var(--color-text-muted)",
                            fontSize: 11,
                          }}
                          tickLine={{ stroke: "var(--color-text-muted)" }}
                        />
                        <YAxis
                          stroke="var(--color-text-muted)"
                          tick={{
                            fill: "var(--color-text-muted)",
                            fontSize: 11,
                          }}
                          tickLine={false}
                          width={50}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--color-surface-base)",
                            border: "1px solid var(--color-border-base)",
                            borderRadius: "6px",
                            color: "var(--color-text-base)",
                            fontSize: "12px",
                          }}
                          labelStyle={{ color: "var(--color-text-base)" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="writes"
                          stroke="var(--color-warning-base)"
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
        </div>
      </ResizableSheet>
    );
  },
);

MetricsSheet.displayName = "MetricsSheet";

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
    className="rounded-lg p-3 flex flex-col gap-1"
    style={{
      backgroundColor: "var(--color-surface-raised)",
      border: "1px solid var(--color-border-base)",
    }}
  >
    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
      {label}
    </span>
    <span className="text-lg font-semibold" style={{ color }}>
      {value}
    </span>
  </div>
);

export default MetricsSheet;
