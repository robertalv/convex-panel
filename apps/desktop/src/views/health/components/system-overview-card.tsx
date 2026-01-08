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
import type { TimeRange } from "@convex-panel/shared";

interface SystemOverviewCardProps {
  deploymentUrl?: string;
  authToken: string;
  useMockData?: boolean;
}

interface ResourceUsageData {
  timestamps: number[];
  dbReadBytes: number[];
  dbWriteBytes: number[];
  storageBytes: number[];
}

// Format bytes to human readable
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes.toFixed(0)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export const SystemOverviewCard: React.FC<SystemOverviewCardProps> = ({
  deploymentUrl,
  authToken,
  useMockData = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ResourceUsageData | null>(null);
  const cursorRef = useRef<number>(0);

  // Process entries into time-bucketed resource usage data
  const processEntries = useCallback(
    (entries: FunctionExecutionStats[]): ResourceUsageData => {
      const now = Math.floor(Date.now() / 1000);
      const oneHourAgo = now - 60 * 60;
      const numBuckets = 60; // 1 minute intervals
      const bucketSizeSeconds = 60;

      // Initialize arrays
      const timestamps: number[] = [];
      const dbReadBytes: number[] = Array(numBuckets).fill(0);
      const dbWriteBytes: number[] = Array(numBuckets).fill(0);
      const storageBytes: number[] = Array(numBuckets).fill(0);

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

        // Aggregate usage stats
        if (entry.usage_stats) {
          dbReadBytes[clampedIndex] +=
            entry.usage_stats.database_read_bytes || 0;
          dbWriteBytes[clampedIndex] +=
            entry.usage_stats.database_write_bytes || 0;
          storageBytes[clampedIndex] +=
            (entry.usage_stats.storage_read_bytes || 0) +
            (entry.usage_stats.storage_write_bytes || 0);
        }
      });

      return { timestamps, dbReadBytes, dbWriteBytes, storageBytes };
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
          const resourceData = processEntries(response.entries);
          setData(resourceData);
          cursorRef.current = response.new_cursor;
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to fetch resource usage",
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
      { name: "DB Reads", color: "#3B82F6", data: data.dbReadBytes },
      { name: "DB Writes", color: "#10B981", data: data.dbWriteBytes },
      { name: "Storage", color: "#F59E0B", data: data.storageBytes },
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

  const totalUsage = useMemo(() => {
    if (!data || data.timestamps.length === 0) {
      return { dbRead: 0, dbWrite: 0, storage: 0 };
    }
    return {
      dbRead: data.dbReadBytes.reduce((a, b) => a + b, 0),
      dbWrite: data.dbWriteBytes.reduce((a, b) => a + b, 0),
      storage: data.storageBytes.reduce((a, b) => a + b, 0),
    };
  }, [data]);

  const currentTotal = useMemo(() => {
    return totalUsage.dbRead + totalUsage.dbWrite + totalUsage.storage;
  }, [totalUsage]);

  const maxValue = useMemo(() => {
    if (!data || data.timestamps.length === 0) return 1024 * 1024; // 1MB default
    let max = 0;
    for (let i = 0; i < data.timestamps.length; i++) {
      const total =
        data.dbReadBytes[i] + data.dbWriteBytes[i] + data.storageBytes[i];
      if (total > max) max = total;
    }
    return Math.ceil(max * 1.1) || 1024 * 1024;
  }, [data]);

  return (
    <HealthCard
      title="Resource Usage"
      tip="Database read/write bytes and storage bytes consumed by function executions over time."
      loading={loading}
      error={error}
    >
      <div style={{ padding: "8px 0" }}>
        {/* Current value display */}
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 600,
              color: "var(--color-panel-text)",
            }}
          >
            {formatBytes(currentTotal)}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "var(--color-panel-text-muted)",
              marginTop: "4px",
            }}
          >
            Total bandwidth (1h)
          </div>
        </div>

        {/* Summary stats */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "12px",
            fontSize: "11px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "2px",
                backgroundColor: "#3B82F6",
              }}
            />
            <span style={{ color: "var(--color-panel-text-secondary)" }}>
              Reads: {formatBytes(totalUsage.dbRead)}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "2px",
                backgroundColor: "#10B981",
              }}
            />
            <span style={{ color: "var(--color-panel-text-secondary)" }}>
              Writes: {formatBytes(totalUsage.dbWrite)}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "2px",
                backgroundColor: "#F59E0B",
              }}
            />
            <span style={{ color: "var(--color-panel-text-secondary)" }}>
              Storage: {formatBytes(totalUsage.storage)}
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
            showLegend={false}
            formatValue={(v) => formatBytes(v)}
            formatYAxis={(v) => formatBytes(v)}
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
            No resource usage data available
          </div>
        )}
      </div>
    </HealthCard>
  );
};
