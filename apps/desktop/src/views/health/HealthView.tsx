import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import type { Insight } from "@convex-panel/shared/api";
import { useHealthMetrics } from "./hooks/useHealthMetrics";
import { useFunctionHealth } from "./hooks/useFunctionHealth";
import { useDeploymentStatus } from "./hooks/useDeploymentStatus";
import { useInsights } from "./hooks/useInsights";
import { useFunctionActivity } from "./hooks/useFunctionActivity";
import { useUsageMetrics } from "./hooks/useUsageMetrics";
import { useTeamUsageSummary } from "./hooks/useTeamUsageSummary";
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
import { DatabaseUsageCard } from "./components/DatabaseUsageCard";
import { ResourceUsageCard } from "./components/ResourceUsageCard";
import { TeamUsageSummaryCard } from "./components/TeamUsageSummaryCard";
import { LastDeployedBadge } from "./components/layout/LastDeployedBadge";
import { TimeRangeDisplay } from "./components/layout/TimeRangeDisplay";
import { ToolbarButton } from "@/components/ui/button";
import { Toolbar } from "@/components/ui/toolbar";
import { InsightBreakdownSheet } from "./components/InsightBreakdownSheet";

/**
 * Main Health View component for the desktop app.
 * Displays deployment health metrics in a responsive grid layout.
 */
export function HealthView() {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);

  const healthMetrics = useHealthMetrics();
  const functionHealth = useFunctionHealth();
  const functionActivity = useFunctionActivity();
  const deploymentStatus = useDeploymentStatus();
  const insightsData = useInsights();
  const usageMetrics = useUsageMetrics();
  const teamUsage = useTeamUsageSummary();

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        healthMetrics.refetch(),
        functionHealth.refetch(),
        functionActivity.refetch(),
        deploymentStatus.refetch(),
        insightsData.refetch(),
        usageMetrics.refetch(),
        teamUsage.refetch(),
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
    usageMetrics,
    teamUsage,
  ]);

  const handleNavigateToDocument = useCallback(
    (documentId: string, tableName: string) => {
      const params = new URLSearchParams();
      params.set("table", tableName);
      params.set("doc", documentId);
      navigate(`/data?${params.toString()}`);
      setSelectedInsight(null);
    },
    [navigate],
  );

  return (
    <div
      className="flex h-full w-full overflow-hidden"
      style={{ backgroundColor: "var(--color-background-base)" }}
    >
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Toolbar
          className="shrink-0"
          left={
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <TimeRangeDisplay range="1h" size="sm" />
            </div>
          }
          right={
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
                    animation: isRefreshing
                      ? "spin 1s linear infinite"
                      : "none",
                  }}
                />
                <span>Refresh</span>
              </ToolbarButton>
            </div>
          }
        />

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

            {/* Database & Resource Usage - 2 columns */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
                gap: "16px",
              }}
            >
              <DatabaseUsageCard
                databaseReadBytes={usageMetrics.databaseReadBytes}
                databaseWriteBytes={usageMetrics.databaseWriteBytes}
                databaseReadDocuments={usageMetrics.databaseReadDocuments}
                storageReadBytes={usageMetrics.storageReadBytes}
                storageWriteBytes={usageMetrics.storageWriteBytes}
                isLoading={usageMetrics.isLoading}
                error={usageMetrics.error}
                onRetry={usageMetrics.refetch}
              />
              <ResourceUsageCard
                totalMemoryUsedMb={usageMetrics.totalMemoryUsedMb}
                peakMemoryUsedMb={usageMetrics.peakMemoryUsedMb}
                vectorIndexReadBytes={usageMetrics.vectorIndexReadBytes}
                vectorIndexWriteBytes={usageMetrics.vectorIndexWriteBytes}
                isLoading={usageMetrics.isLoading}
                error={usageMetrics.error}
                onRetry={usageMetrics.refetch}
              />
            </div>

            {/* Team Billing Usage - full width */}
            <TeamUsageSummaryCard
              data={teamUsage.data}
              isLoading={teamUsage.isLoading}
              error={teamUsage.error}
            />

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
                error={insightsData.error}
                onRetry={insightsData.refetch}
                onInsightClick={setSelectedInsight}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Insight Breakdown Sheet - slides in from right, pushes content left */}
      {selectedInsight && (
        <div
          className="shrink-0"
          style={{
            width: "600px",
            minWidth: "600px",
            maxWidth: "600px",
            height: "100%",
            borderLeft: "1px solid var(--color-border-base)",
            animation: "slideInRight 0.2s ease-out",
          }}
        >
          <InsightBreakdownSheet
            insight={selectedInsight}
            onClose={() => setSelectedInsight(null)}
            onNavigateToDocument={handleNavigateToDocument}
          />
        </div>
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
