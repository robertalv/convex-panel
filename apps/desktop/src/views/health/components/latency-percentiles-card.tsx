import React, { useState, useEffect, useMemo } from "react";
import { HealthCard } from "./health-card";
import type { MetricHealth } from "./big-metric";
import { fetchLatencyPercentiles } from "../../../utils/api/metrics";
import type { APIResponse } from "@convex-panel/shared";

interface LatencyPercentilesCardProps {
  deploymentUrl?: string;
  authToken: string;
  useMockData?: boolean;
}

interface LatencyData {
  p50: number | null;
  p95: number | null;
  p99: number | null;
}

interface PercentileBarProps {
  label: string;
  value: number | null;
  maxValue: number;
  color: string;
  health?: MetricHealth;
}

const PercentileBar: React.FC<PercentileBarProps> = ({
  label,
  value,
  maxValue,
  color,
  health,
}) => {
  const percentage =
    value !== null ? Math.min((value / maxValue) * 100, 100) : 0;

  const getHealthColor = () => {
    switch (health) {
      case "error":
        return "var(--color-panel-error)";
      case "warning":
        return "var(--color-panel-warning)";
      default:
        return color;
    }
  };

  const formatLatency = (ms: number | null): string => {
    if (ms === null) return "N/A";
    if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "28px",
          fontSize: "10px",
          fontWeight: 600,
          color: "var(--color-panel-text-muted)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          flex: 1,
          height: "20px",
          backgroundColor: "var(--color-panel-bg-secondary)",
          borderRadius: "4px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${percentage}%`,
            backgroundColor: getHealthColor(),
            borderRadius: "4px",
            transition: "width 0.3s ease",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            paddingLeft: "8px",
            fontSize: "11px",
            fontWeight: 500,
            color: percentage > 40 ? "#fff" : "var(--color-panel-text)",
            zIndex: 1,
          }}
        >
          {formatLatency(value)}
        </div>
      </div>
    </div>
  );
};

export const LatencyPercentilesCard: React.FC<LatencyPercentilesCardProps> = ({
  deploymentUrl,
  authToken,
  useMockData = false,
}) => {
  const [data, setData] = useState<APIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const result = await fetchLatencyPercentiles(
          deploymentUrl,
          authToken,
          useMockData,
        );
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to fetch latency percentiles",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Refresh every 30 seconds for real-time tracking
    const interval = setInterval(fetchData, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [deploymentUrl, authToken, useMockData]);

  // Extract current latency values from data
  const currentLatency = useMemo((): LatencyData => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return { p50: null, p95: null, p99: null };
    }

    // The API returns data in format: Array<[number, TimeSeriesData]>
    // Where number is the percentile (50, 95, 99)
    const latencyData: LatencyData = { p50: null, p95: null, p99: null };

    data.forEach((item) => {
      const percentile = item[0];
      const timeSeries = item[1];

      if (!Array.isArray(timeSeries) || timeSeries.length === 0) {
        return;
      }

      // Get the most recent non-null value
      for (let i = timeSeries.length - 1; i >= 0; i--) {
        const [_, value] = timeSeries[i];
        if (value !== null && typeof value === "number") {
          const percentileNum =
            typeof percentile === "number"
              ? percentile
              : parseInt(String(percentile), 10);
          if (percentileNum === 50) {
            latencyData.p50 = value;
          } else if (percentileNum === 95) {
            latencyData.p95 = value;
          } else if (percentileNum === 99) {
            latencyData.p99 = value;
          }
          break;
        }
      }
    });

    return latencyData;
  }, [data]);

  // Calculate health status based on p95 latency
  const healthStatus = useMemo((): {
    health: MetricHealth;
    message: string;
  } => {
    const p95 = currentLatency.p95;
    if (p95 === null) {
      return { health: "healthy", message: "No latency data available" };
    }

    // Thresholds: < 100ms healthy, 100-500ms warning, > 500ms error
    if (p95 < 100) {
      return { health: "healthy", message: "Latency is within normal range" };
    } else if (p95 < 500) {
      return { health: "warning", message: "Latency is elevated" };
    } else {
      return { health: "error", message: "Latency is high" };
    }
  }, [currentLatency]);

  // Calculate the max value for the bar chart scaling
  const maxValue = useMemo(() => {
    const values = [
      currentLatency.p50,
      currentLatency.p95,
      currentLatency.p99,
    ].filter((v): v is number => v !== null);
    if (values.length === 0) return 100;
    return Math.max(...values) * 1.2; // Add 20% headroom
  }, [currentLatency]);

  // Get health for p95 specifically (the key indicator)
  const getP95Health = (): MetricHealth | undefined => {
    if (currentLatency.p95 === null) return undefined;
    if (currentLatency.p95 < 100) return undefined;
    if (currentLatency.p95 < 500) return "warning";
    return "error";
  };

  // Get health for p99
  const getP99Health = (): MetricHealth | undefined => {
    if (currentLatency.p99 === null) return undefined;
    if (currentLatency.p99 < 200) return undefined;
    if (currentLatency.p99 < 1000) return "warning";
    return "error";
  };

  return (
    <HealthCard
      title="Latency Percentiles"
      tip="The p50, p95, and p99 latency percentiles for all function executions, showing response time distribution."
      loading={loading}
      error={error}
    >
      {currentLatency.p50 !== null ||
      currentLatency.p95 !== null ||
      currentLatency.p99 !== null ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            padding: "12px 4px",
            height: "100%",
            justifyContent: "center",
          }}
        >
          <PercentileBar
            label="p50"
            value={currentLatency.p50}
            maxValue={maxValue}
            color="#3B82F6"
          />
          <PercentileBar
            label="p95"
            value={currentLatency.p95}
            maxValue={maxValue}
            color="#F59E0B"
            health={getP95Health()}
          />
          <PercentileBar
            label="p99"
            value={currentLatency.p99}
            maxValue={maxValue}
            color="#EF4444"
            health={getP99Health()}
          />

          <div
            style={{
              fontSize: "10px",
              color:
                healthStatus.health === "healthy"
                  ? "var(--color-panel-text-muted)"
                  : healthStatus.health === "warning"
                    ? "var(--color-panel-warning)"
                    : "var(--color-panel-error)",
              textAlign: "center",
              marginTop: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
            }}
          >
            {healthStatus.health !== "healthy" && (
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor:
                    healthStatus.health === "warning"
                      ? "var(--color-panel-warning)"
                      : "var(--color-panel-error)",
                }}
              />
            )}
            {healthStatus.message}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-panel-text-muted)",
            fontSize: "12px",
          }}
        >
          No latency data available
        </div>
      )}
    </HealthCard>
  );
};




