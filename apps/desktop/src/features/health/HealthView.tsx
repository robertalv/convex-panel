import { useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";

// Hooks
import { useHealthMetrics } from "./hooks/useHealthMetrics";
import { useFunctionHealth } from "./hooks/useFunctionHealth";
import { useDeploymentStatus } from "./hooks/useDeploymentStatus";
import { useInsights } from "./hooks/useInsights";
import { useFunctionActivity } from "./hooks/useFunctionActivity";

// Components
import { FailureRateCard } from "./components/FailureRateCard";
import { CacheHitRateCard } from "./components/CacheHitRateCard";
import { SchedulerLagCard } from "./components/SchedulerLagCard";
import { LatencyCard } from "./components/LatencyCard";
import { RequestRateCard } from "./components/RequestRateCard";
import { SlowestFunctionsCard } from "./components/SlowestFunctionsCard";
import { TopFunctionsCard } from "./components/TopFunctionsCard";
import { TopErrorsCard } from "./components/TopErrorsCard";
import { InsightsSummaryCard } from "./components/InsightsSummaryCard";
import { FunctionActivityCard } from "./components/FunctionActivityCard";
import { LastDeployedBadge } from "./components/layout/LastDeployedBadge";
import { TimeRangeDisplay } from "./components/layout/TimeRangeDisplay";

/**
 * Toolbar button component matching VisualizerToolbar styling
 */
function ToolbarButton({
  onClick,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        height: "28px",
        padding: "0 10px",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "12px",
        fontWeight: 500,
        backgroundColor:
          isHovered && !disabled
            ? "var(--color-surface-raised)"
            : "transparent",
        color:
          isHovered && !disabled
            ? "var(--color-text-base)"
            : "var(--color-text-muted)",
        border: "1px solid var(--color-border-base)",
        borderRadius: "8px",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

/**
 * Main Health View component for the desktop app.
 * Displays deployment health metrics in a responsive grid layout.
 */
export function HealthView() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data hooks
  const healthMetrics = useHealthMetrics();
  const functionHealth = useFunctionHealth();
  const functionActivity = useFunctionActivity();
  const deploymentStatus = useDeploymentStatus();
  const insightsData = useInsights();

  // Combined refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        healthMetrics.refetch(),
        functionHealth.refetch(),
        functionActivity.refetch(),
        deploymentStatus.refetch(),
        insightsData.refetch(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [
    healthMetrics,
    functionHealth,
    functionActivity,
    deploymentStatus,
    insightsData,
  ]);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--color-surface-base)",
      }}
    >
      {/* Toolbar - 40px height matching VisualizerToolbar */}
      <div
        style={{
          height: "40px",
          minHeight: "40px",
          borderBottom: "1px solid var(--color-border-base)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          backgroundColor: "var(--color-surface-base)",
        }}
      >
        {/* Left section */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <TimeRangeDisplay range="1h" size="sm" />
        </div>

        {/* Right section */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <LastDeployedBadge
            lastDeployed={deploymentStatus.lastPush}
            isLoading={deploymentStatus.lastPushLoading}
            version={deploymentStatus.version}
            versionLoading={deploymentStatus.versionLoading}
            hasUpdate={deploymentStatus.hasUpdate}
            latestVersion={deploymentStatus.latestVersion ?? undefined}
            size="sm"
          />

          {/* Divider */}
          <div
            style={{
              width: "1px",
              height: "16px",
              backgroundColor: "var(--color-border-base)",
            }}
          />

          <ToolbarButton
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh all metrics"
          >
            <RefreshCw
              size={14}
              style={{
                animation: isRefreshing ? "spin 1s linear infinite" : "none",
              }}
            />
            <span>Refresh</span>
          </ToolbarButton>
        </div>
      </div>

      {/* Scrollable content area */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "16px",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Large metric cards - 2 columns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
              gap: "16px",
            }}
          >
            <SlowestFunctionsCard
              functions={functionHealth.slowest}
              isLoading={functionHealth.isLoading}
              onRetry={functionHealth.refetch}
            />
            <FunctionActivityCard
              data={functionActivity.data}
              series={functionActivity.series}
              currentRate={functionActivity.currentRate}
              totalInvocations={functionActivity.totalInvocations}
              maxValue={functionActivity.maxValue}
              loading={functionActivity.isLoading}
              onRetry={functionActivity.refetch}
            />
          </div>

          {/* Status cards row - 3 columns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            <FailureRateCard
              currentRate={healthMetrics.failureRate}
              chartData={healthMetrics.failureRateData}
              isLoading={healthMetrics.failureRateLoading}
              onRetry={healthMetrics.refetchFailureRate}
            />
            <CacheHitRateCard
              currentRate={healthMetrics.cacheHitRate}
              chartData={healthMetrics.cacheHitRateData}
              isLoading={healthMetrics.cacheHitRateLoading}
            />
            <SchedulerLagCard
              currentLag={healthMetrics.schedulerLag}
              chartData={healthMetrics.schedulerLagData}
              isLoading={healthMetrics.schedulerLagLoading}
            />
          </div>

          {/* Additional metrics row - 2 columns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
              gap: "16px",
            }}
          >
            <LatencyCard
              percentiles={healthMetrics.latencyPercentiles}
              isLoading={healthMetrics.latencyLoading}
            />
            <RequestRateCard
              currentRate={healthMetrics.requestRate}
              chartData={healthMetrics.requestRateData}
              isLoading={healthMetrics.requestRateLoading}
            />
          </div>

          {/* Errors - full width */}
          <TopErrorsCard
            functions={functionHealth.topFailing}
            totalErrors={functionHealth.totalErrors}
            loading={functionHealth.isLoading}
          />

          {/* Top Functions and Insights - 2 columns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
              gap: "16px",
            }}
          >
            <TopFunctionsCard
              functions={functionHealth.mostCalled}
              isLoading={functionHealth.isLoading}
            />
            <InsightsSummaryCard
              insights={insightsData.insights}
              loading={insightsData.isLoading}
            />
          </div>
        </div>
      </div>

      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
