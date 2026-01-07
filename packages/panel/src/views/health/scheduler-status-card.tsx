import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Undo2,
  CheckCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { HealthCard } from "./components/health-card";
import { FunctionRateChart } from "./components/function-rate-chart";
import { TooltipAction } from "../../components/shared/tooltip-action";
import { fetchSchedulerLag } from "../../utils/api/metrics";
import { transformToChartData, getTimeRange } from "./utils";
import type { APIResponse } from "./types";
import { formatDistance } from "date-fns";

interface SchedulerStatusCardProps {
  deploymentUrl?: string;
  authToken: string;
  useMockData?: boolean;
}

type SchedulerHealth = "healthy" | "warning" | "error";

export const SchedulerStatusCard: React.FC<SchedulerStatusCardProps> = ({
  deploymentUrl,
  authToken,
  useMockData = false,
}) => {
  const [showChart, setShowChart] = useState(false);
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
        const result = await fetchSchedulerLag(
          deploymentUrl,
          authToken,
          useMockData,
        );

        // Transform the response to match the expected format
        // The API returns TimeseriesResponse: [SerializedDate, number | null][]
        // We need to convert it to APIResponse format: Array<[string, TimeSeriesData]>
        // Also convert lag from seconds to minutes (like Convex does)
        let transformedData: APIResponse | null = null;

        if (Array.isArray(result)) {
          // Check if it's already in APIResponse format (array of [string, TimeSeriesData])
          if (
            result.length > 0 &&
            Array.isArray(result[0]) &&
            result[0].length === 2 &&
            typeof result[0][0] === "string"
          ) {
            // Already in the right format
            transformedData = result as APIResponse;
          } else {
            // It's a TimeseriesResponse - convert to minutes and wrap
            const timeSeriesData = result.map(([timestamp, value]) => {
              // Convert seconds to minutes (like Convex: Math.round(value.metric / 60))
              const lagMinutes =
                value !== null && typeof value === "number"
                  ? Math.round(value / 60)
                  : null;
              return [timestamp, lagMinutes] as [
                { secs_since_epoch: number; nanos_since_epoch: number },
                number | null,
              ];
            });
            transformedData = [["lag", timeSeriesData]];
          }
        } else if (
          useMockData &&
          result &&
          typeof result === "object" &&
          "status" in result
        ) {
          // Mock data format - extract the time series data
          const mockData = result as any;
          if (
            mockData.data &&
            Array.isArray(mockData.data) &&
            mockData.data.length > 0
          ) {
            // Mock data already has lag in minutes, so just wrap it
            transformedData = [["lag", mockData.data[0][1] || []]];
          }
        }

        if (mounted) {
          setData(transformedData);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to fetch scheduler lag",
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

  // Transform data to chart format
  // For scheduler lag, we don't use the default null-filling behavior
  // Instead, we want to show the actual lag values (in minutes)
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { timestamps: [], functionData: new Map() };
    }

    // Scheduler lag uses a different transformation - we want to show lag in minutes
    // The data is already in minutes from our transformation above
    return transformToChartData(data, "failureRate");
  }, [data]);

  const timeRange = useMemo(() => {
    return getTimeRange(data);
  }, [data]);

  // Calculate health status based on lag (like Convex does)
  const healthStatus = useMemo((): {
    health: SchedulerHealth;
    behindBySeconds: number;
    message: string;
  } => {
    if (!data || data.length === 0 || !chartData.functionData.has("lag")) {
      return {
        health: "healthy",
        behindBySeconds: 0,
        message: "Scheduled functions are running on time.",
      };
    }

    const lagData = chartData.functionData.get("lag");
    if (!lagData || lagData.size === 0) {
      return {
        health: "healthy",
        behindBySeconds: 0,
        message: "Scheduled functions are running on time.",
      };
    }

    // Get the latest lag value (in minutes from the API, but we need to convert)
    // The API returns lag in seconds, but we display in minutes
    // Get the last non-null value
    const lagValues = Array.from(lagData.values()).filter(
      (v) => v !== null && typeof v === "number",
    ) as number[];
    if (lagValues.length === 0) {
      return {
        health: "healthy",
        behindBySeconds: 0,
        message: "Scheduled functions are running on time.",
      };
    }

    // The lag value from the chart is in minutes (after transformation)
    // But we need seconds for the health calculation
    // Actually, looking at Convex code: lag is in minutes, so behindBySeconds = 60 * lag
    const latestLagMinutes = lagValues[lagValues.length - 1];
    const behindBySeconds = 60 * latestLagMinutes;

    let health: SchedulerHealth = "healthy";
    let message = "Scheduled functions are running on time.";

    if (behindBySeconds <= 20) {
      health = "healthy";
      message = "Scheduled functions are running on time.";
    } else if (behindBySeconds > 300) {
      health = "error";
      message = `Scheduling is behind by ${formatDistance(0, behindBySeconds * 1000)}.`;
    } else {
      health = "warning";
      message = `Scheduling is behind by ${formatDistance(0, behindBySeconds * 1000)}.`;
    }

    return { health, behindBySeconds, message };
  }, [data, chartData]);

  // Get color based on health status
  const getHealthColor = (health: SchedulerHealth) => {
    switch (health) {
      case "healthy":
        return "var(--color-panel-success)";
      case "warning":
        return "var(--color-panel-warning)";
      case "error":
        return "var(--color-panel-error)";
    }
  };

  // Get background color based on health status
  const getHealthBgColor = (health: SchedulerHealth) => {
    switch (health) {
      case "healthy":
        return "rgba(16, 185, 129, 0.1)";
      case "warning":
        return "rgba(245, 158, 11, 0.1)";
      case "error":
        return "rgba(239, 68, 68, 0.1)";
    }
  };

  // Get icon based on health status
  const getHealthIcon = (health: SchedulerHealth) => {
    switch (health) {
      case "healthy":
        return <CheckCircle size={32} />;
      case "warning":
        return <Clock size={32} />;
      case "error":
        return <AlertTriangle size={32} />;
    }
  };

  // Format the lag time for display
  const formatLagTime = (seconds: number) => {
    if (seconds === 0) return "0s";
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) return `${minutes}m`;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <HealthCard
      title="Scheduler Status"
      tip="The status of function scheduling. Scheduling is unhealthy when functions are executing after their scheduled time."
      loading={loading}
      error={error}
      action={
        <TooltipAction
          icon={showChart ? <Undo2 size={16} /> : <LineChart size={16} />}
          text={showChart ? "Hide Chart" : "Show Chart"}
          onClick={() => setShowChart(!showChart)}
        />
      }
    >
      {showChart ? (
        <FunctionRateChart
          chartData={chartData}
          timeRange={timeRange}
          kind="failureRate"
        />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            minHeight: "100px",
            gap: "12px",
            padding: "16px",
          }}
        >
          {/* Status indicator with icon */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: getHealthBgColor(healthStatus.health),
              color: getHealthColor(healthStatus.health),
            }}
          >
            {getHealthIcon(healthStatus.health)}
          </div>

          {/* Status text */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <div
              style={{
                fontSize: "20px",
                fontWeight: 600,
                color: getHealthColor(healthStatus.health),
              }}
            >
              {healthStatus.health === "healthy" ? "On time" : "Overdue"}
            </div>

            {healthStatus.behindBySeconds > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 12px",
                  borderRadius: "12px",
                  backgroundColor: getHealthBgColor(healthStatus.health),
                  fontSize: "12px",
                  fontWeight: 500,
                  color: getHealthColor(healthStatus.health),
                }}
              >
                <Clock size={12} />
                {formatLagTime(healthStatus.behindBySeconds)} behind
              </div>
            )}
          </div>

          {/* Description */}
          <p
            style={{
              textAlign: "center",
              color: "var(--color-panel-text-secondary)",
              fontSize: "11px",
              margin: 0,
              maxWidth: "200px",
            }}
          >
            {healthStatus.message}
          </p>
        </div>
      )}
    </HealthCard>
  );
};
