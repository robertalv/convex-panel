import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { HealthCard } from "./health-card";
import { StackedBarChart } from "./stacked-bar-chart";
import type { StackedBarSeries } from "./stacked-bar-chart";
import { fetchUdfExecutionStats } from "../../../utils/api/metrics";
import type { FunctionExecutionStats } from "../../../types";
import type { TimeRange } from "../types";

interface DatabaseOpsCardProps {
  deploymentUrl?: string;
  authToken: string;
  useMockData?: boolean;
}

interface DatabaseOpsData {
  timestamps: number[];
  reads: number[]; // Document reads
  writes: number[]; // Document writes (we'll estimate from write bytes)
  totalOps: number;
}

export const DatabaseOpsCard: React.FC<DatabaseOpsCardProps> = ({
  deploymentUrl,
  authToken,
  useMockData = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DatabaseOpsData | null>(null);
  const cursorRef = useRef<number>(0);

  // Process entries into time-bucketed database operations data
  const processEntries = useCallback(
    (entries: FunctionExecutionStats[]): DatabaseOpsData => {
      const now = Math.floor(Date.now() / 1000);
      const oneHourAgo = now - 60 * 60;
      const numBuckets = 60; // 1 minute intervals
      const bucketSizeSeconds = 60;

      // Initialize arrays
      const timestamps: number[] = [];
      const reads: number[] = Array(numBuckets).fill(0);
      const writes: number[] = Array(numBuckets).fill(0);

      // Generate timestamps
      for (let i = 0; i < numBuckets; i++) {
        timestamps.push(oneHourAgo + i * bucketSizeSeconds);
      }

      let totalOps = 0;

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

        // Aggregate document operations from usage stats
        if (entry.usage_stats) {
          const docReads = entry.usage_stats.database_read_documents || 0;
          reads[clampedIndex] += docReads;
          totalOps += docReads;

          // Estimate writes based on write bytes (assuming avg 500 bytes per doc)
          // This is an approximation since we don't have exact document write counts
          const writeBytes = entry.usage_stats.database_write_bytes || 0;
          if (writeBytes > 0) {
            const estimatedWrites = Math.max(1, Math.ceil(writeBytes / 500));
            writes[clampedIndex] += estimatedWrites;
            totalOps += estimatedWrites;
          }
        }
      });

      return { timestamps, reads, writes, totalOps };
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
          const opsData = processEntries(response.entries);
          setData(opsData);
          cursorRef.current = response.new_cursor;
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch database ops",
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
      { name: "Reads", color: "#3B82F6", data: data.reads },
      { name: "Writes", color: "#10B981", data: data.writes },
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

  const currentOps = useMemo(() => {
    if (!data || data.timestamps.length === 0) return 0;
    const lastIdx = data.timestamps.length - 1;
    return data.reads[lastIdx] + data.writes[lastIdx];
  }, [data]);

  const totalReads = useMemo(() => {
    if (!data) return 0;
    return data.reads.reduce((a, b) => a + b, 0);
  }, [data]);

  const totalWrites = useMemo(() => {
    if (!data) return 0;
    return data.writes.reduce((a, b) => a + b, 0);
  }, [data]);

  const maxValue = useMemo(() => {
    if (!data || data.timestamps.length === 0) return 100;
    let max = 0;
    for (let i = 0; i < data.timestamps.length; i++) {
      const total = data.reads[i] + data.writes[i];
      if (total > max) max = total;
    }
    return Math.ceil(max * 1.1) || 100;
  }, [data]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  return (
    <HealthCard
      title="Database Operations"
      tip="Document read and write operations per minute across all function executions."
      loading={loading}
      error={error}
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
            {formatNumber(currentOps)}
          </div>
          <div
            style={{ fontSize: "12px", color: "var(--color-panel-text-muted)" }}
          >
            ops/min
          </div>
          <div
            style={{
              marginLeft: "auto",
              fontSize: "11px",
              color: "var(--color-panel-text-secondary)",
              display: "flex",
              gap: "12px",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "2px",
                  backgroundColor: "#3B82F6",
                }}
              />
              {formatNumber(totalReads)} reads
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "2px",
                  backgroundColor: "#10B981",
                }}
              />
              {formatNumber(totalWrites)} writes
            </span>
          </div>
        </div>

        {/* Stacked bar chart */}
        {data && (
          <StackedBarChart
            timestamps={data.timestamps}
            series={series}
            timeRange={timeRange}
            height={100}
            showLegend={true}
            formatValue={(v) => formatNumber(v)}
            maxValue={maxValue}
          />
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
            No database operations data available
          </div>
        )}
      </div>
    </HealthCard>
  );
};
