import React from "react";
import { RefreshCw } from "lucide-react";
import { FailureRateCard } from "./components/failure-rate-card";
import { CacheHitRateCard } from "./components/cache-hit-rate-card";
import { SchedulerStatusCard } from "./scheduler-status-card";
import { InsightsSummary } from "./components/insights-summary";
import { AIErrorAnalysisCard } from "./components/ai-error-analysis-card";
import { AILogSummaryCard } from "./components/ai-log-summary-card";
import { DeploymentCorrelationCard } from "./components/deployment-correlation-card";
import { SlowestFunctionsCard } from "./components/slowest-functions-card";
import { FunctionActivityCard } from "./components/function-activity-card";
import { TopFunctionsCard } from "./components/top-functions-card";
import { TopErrorsCard } from "./components/top-errors-card";
import { LastDeployedBadge } from "./components/last-deployed-badge";
import { useContainerRef } from "../../hooks/useContainerRef";

export const HealthView: React.FC<{
  deploymentUrl?: string;
  authToken: string;
  teamAccessToken?: string;
  useMockData?: boolean;
  adminClient?: any;
}> = ({
  deploymentUrl,
  authToken,
  teamAccessToken,
  useMockData = false,
  adminClient,
}) => {
  const [healthViewRef, containerRef] = useContainerRef(".cp-main-content");

  // Get current time range for display
  const getTimeRangeDisplay = () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const formatTime = (date: Date) => {
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    };
    return `${formatTime(oneHourAgo)} - ${formatTime(now)}`;
  };

  return (
    <div className="cp-health-container" ref={healthViewRef}>
      {/* Header with time range selector and last deployed */}
      <div className="cp-health-header">
        <div style={{ display: "flex", alignItems: "center" }}>
          <span
            style={{ fontSize: "11px", color: "var(--color-panel-text-muted)" }}
          >
            {getTimeRangeDisplay()}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <LastDeployedBadge
            deploymentUrl={deploymentUrl}
            authToken={authToken}
            useMockData={useMockData}
          />
          <button
            className="cp-health-refresh-btn"
            onClick={() => window.location.reload()}
            title="Refresh data"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Large metric cards - Slowest Functions and Function Activity */}
      <div className="cp-health-section">
        <div className="cp-health-grid cp-health-grid--large">
          <SlowestFunctionsCard
            deploymentUrl={deploymentUrl}
            authToken={authToken}
            useMockData={useMockData}
          />
          <FunctionActivityCard
            deploymentUrl={deploymentUrl}
            authToken={authToken}
            useMockData={useMockData}
          />
        </div>
      </div>

      {/* Status cards row */}
      <div className="cp-health-section">
        <div className="cp-health-grid cp-health-grid--status">
          <FailureRateCard
            deploymentUrl={deploymentUrl}
            authToken={authToken}
            useMockData={useMockData}
          />

          <CacheHitRateCard
            deploymentUrl={deploymentUrl}
            authToken={authToken}
            useMockData={useMockData}
          />

          <SchedulerStatusCard
            deploymentUrl={deploymentUrl}
            authToken={authToken}
            useMockData={useMockData}
          />
        </div>
      </div>

      {/* Top Errors - Full width */}
      <div className="cp-health-section">
        <div className="cp-health-grid cp-health-grid--full">
          <TopErrorsCard
            deploymentUrl={deploymentUrl}
            authToken={authToken}
            useMockData={useMockData}
          />
        </div>
      </div>

      {/* Top Functions and Insights */}
      <div className="cp-health-section">
        <div className="cp-health-grid cp-health-grid--large">
          <TopFunctionsCard
            deploymentUrl={deploymentUrl}
            authToken={authToken}
            useMockData={useMockData}
          />
          <InsightsSummary
            deploymentUrl={deploymentUrl}
            authToken={authToken}
            teamAccessToken={teamAccessToken}
            useMockData={useMockData}
          />
        </div>
      </div>

      {/* AI Analysis Cards */}
      {adminClient && (
        <div className="cp-health-section">
          <div className="cp-health-grid cp-health-grid--ai">
            <AIErrorAnalysisCard
              adminClient={adminClient}
              container={containerRef}
            />
            <AILogSummaryCard adminClient={adminClient} />
            <DeploymentCorrelationCard adminClient={adminClient} />
          </div>
        </div>
      )}
    </div>
  );
};
