import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { Insight } from "@convex-panel/shared/api";
import { useHealthMetrics } from "./hooks/useHealthMetrics";
import { useFunctionHealth } from "./hooks/useFunctionHealth";
import { useDeploymentStatus } from "./hooks/useDeploymentStatus";
import { useInsights } from "./hooks/useInsights";
import { useFunctionActivity } from "./hooks/useFunctionActivity";
import { useUsageMetrics } from "./hooks/useUsageMetrics";
import { useTeamUsageSummary } from "./hooks/useTeamUsageSummary";
import { useDeploymentMarkers } from "./hooks/useDeploymentMarkers";
import { FailureRateCard } from "./components/failure-rate-card";
import { CacheHitRateCard } from "./components/cache-hit-rate-card";
import { SchedulerLagCard } from "./components/scheduler-lag-card";
import { LatencyCard } from "./components/latency-card";
import { RequestRateCard } from "./components/request-rate-card";
import { TopFunctionsCard } from "./components/top-functions-card";
import { InsightsSummaryCard } from "./components/insights-summary-card";
import { FunctionActivityCard } from "./components/function-activity-card";
import { DatabaseUsageCard } from "./components/database-usage-card";
import { ResourceUsageCard } from "./components/resource-usage-card";
import { TeamUsageSummaryCard } from "./components/team-usage-summary-card";
import { LastDeployedBadge } from "./components/layout/last-deployed-badge";
import { TimeRangeDisplay } from "./components/layout/time-range-display";
import { HealthScrollableContent } from "./components/layout/health-scrollable-content";
import { Toolbar } from "@/components/ui/toolbar";
import { InsightBreakdownSheet } from "./components/insight-breakdown-sheet";

/**
 * Main Health View component for the desktop app.
 * Displays deployment health metrics in a responsive grid layout.
 */
export function HealthView() {
  const navigate = useNavigate();
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);

  const healthMetrics = useHealthMetrics();
  const functionHealth = useFunctionHealth();
  const functionActivity = useFunctionActivity();
  const deploymentStatus = useDeploymentStatus();
  const insightsData = useInsights();
  const usageMetrics = useUsageMetrics();
  const teamUsage = useTeamUsageSummary();
  const deploymentMarkers = useDeploymentMarkers();

  const handleNavigateToDocument = useCallback(
    (documentId: string, tableName: string, componentPath?: string | null) => {
      const params = new URLSearchParams();
      params.set("table", tableName);
      params.set("doc", documentId);
      if (componentPath) {
        const componentName = componentPath.split("/")[0];
        params.set("component", componentName);
      }
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
            </div>
          }
        />

        {/* Scrollable content area */}
        <HealthScrollableContent>
          {/* Large metric cards - 2 columns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
              gap: "16px",
            }}
          >
            {/* <SlowestFunctionsCard
              functions={functionHealth.slowest}
              isLoading={functionHealth.isLoading}
            /> */}
            <FunctionActivityCard
              data={functionActivity.data}
              series={functionActivity.series}
              currentRate={functionActivity.currentRate}
              totalInvocations={functionActivity.totalInvocations}
              maxValue={functionActivity.maxValue}
              loading={functionActivity.isLoading}
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
              deploymentMarkers={deploymentMarkers}
              isLoading={healthMetrics.failureRateLoading}
            />
            <CacheHitRateCard
              currentRate={healthMetrics.cacheHitRate}
              chartData={healthMetrics.cacheHitRateData}
              deploymentMarkers={deploymentMarkers}
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
              trend={healthMetrics.requestRateTrend}
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
              timeSeries={usageMetrics.timeSeries}
              isLoading={usageMetrics.isLoading}
              error={usageMetrics.error}
            />
            <ResourceUsageCard
              totalMemoryUsedMb={usageMetrics.totalMemoryUsedMb}
              peakMemoryUsedMb={usageMetrics.peakMemoryUsedMb}
              vectorIndexReadBytes={usageMetrics.vectorIndexReadBytes}
              vectorIndexWriteBytes={usageMetrics.vectorIndexWriteBytes}
              isLoading={usageMetrics.isLoading}
              error={usageMetrics.error}
            />
          </div>

          {/* Team Billing Usage - full width */}
          <TeamUsageSummaryCard
            data={teamUsage.data}
            isLoading={teamUsage.isLoading}
            error={teamUsage.error}
          />

          {/* Errors - full width */}
          {/* <TopErrorsCard
            functions={functionHealth.topFailing}
            totalErrors={functionHealth.totalErrors}
            loading={functionHealth.isLoading}
          /> */}

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
              onInsightClick={setSelectedInsight}
            />
          </div>
        </HealthScrollableContent>
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
