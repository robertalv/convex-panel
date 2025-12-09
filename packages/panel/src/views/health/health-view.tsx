import React from 'react';
import { 
  Settings as SettingsIcon
} from 'lucide-react';
import { Card } from '../../components/shared/card';
import { SkeletonCard } from '../../components/shared/skeleton-card';
import { FailureRateCard } from './components/failure-rate-card';
import { CacheHitRateCard } from './components/cache-hit-rate-card';
import { SchedulerStatusCard } from './scheduler-status-card';
import { LastDeployedCard } from './components/last-deployed-card';
import { InsightsSummary } from './components/insights-summary';
import { LatencyPercentilesCard } from './components/latency-percentiles-card';
import { FunctionInvocationRateCard } from './components/function-invocation-rate-card';
import { RecentErrorsSummary } from './components/recent-errors-summary';
import { AIErrorAnalysisCard } from './components/ai-error-analysis-card';
import { AILogSummaryCard } from './components/ai-log-summary-card';
import { DeploymentCorrelationCard } from './components/deployment-correlation-card';
import { useContainerRef } from '../../hooks/useContainerRef';

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
  const [isLoading, setIsLoading] = React.useState(true);
  const [healthViewRef, containerRef] = useContainerRef('.cp-main-content');

  React.useEffect(() => {
    // Simulate initial loading state
    if (deploymentUrl && authToken) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000); // Give components time to load their data
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [deploymentUrl, authToken]);

  if (isLoading) {
    return (
      <div className="cp-health-container">
        <div className="cp-health-grid">
          <SkeletonCard title="Failure Rate" height="140px" showTooltip variant="chart" />
          <SkeletonCard title="Cache Hit Rate" height="140px" showTooltip variant="chart" />
          <SkeletonCard title="Scheduler Status" height="140px" showTooltip variant="chart" />
          <SkeletonCard title="Latency Percentiles" height="140px" showTooltip variant="chart" />
          <SkeletonCard title="Function Invocation Rate" height="140px" showTooltip variant="chart" />
        </div>
        <div className="cp-health-grid">
          <SkeletonCard title="Last Deployed" height="100px" showTooltip variant="simple" />
          <SkeletonCard title="Exception Reporting" height="100px" showAction showTooltip variant="simple" />
        </div>
        <SkeletonCard title="Recent Errors" height="200px" showTooltip={false} variant="insights" />
        <div style={{ marginTop: '12px' }}>
          <SkeletonCard title="Insights" height="200px" showTooltip={false} variant="insights" />
        </div>
      </div>
    );
  }

  return (
    <div className="cp-health-container" ref={healthViewRef}>
      <div className="cp-health-grid">
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

        <LatencyPercentilesCard
          deploymentUrl={deploymentUrl}
          authToken={authToken}
          useMockData={useMockData}
        />

        <FunctionInvocationRateCard
          deploymentUrl={deploymentUrl}
          authToken={authToken}
          useMockData={useMockData}
        />
      </div>

      <div className="cp-health-grid">
        <LastDeployedCard
          deploymentUrl={deploymentUrl}
          authToken={authToken}
          useMockData={useMockData}
        />

        <div className="cp-health-disabled">
          <Card title="Exception Reporting" action={<div className="cp-flex cp-gap-2"><SettingsIcon size={16} /></div>}>
            <div className="cp-flex cp-flex-col cp-h-full cp-justify-center">
              <div className="cp-health-coming-soon">Coming soon</div>
              <div className="cp-health-coming-soon-desc">Get notified of function failures.</div>
            </div>
          </Card>
        </div>
      </div>

      <div className="cp-health-grid">
        <RecentErrorsSummary
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

      {/* AI Analysis Cards */}
      {adminClient && (
        <div className="cp-health-grid" style={{ marginTop: '12px', marginBottom: '0px !important' }}>
          <AIErrorAnalysisCard adminClient={adminClient} container={containerRef} />
          <AILogSummaryCard adminClient={adminClient} />
          <DeploymentCorrelationCard adminClient={adminClient} />
        </div>
      )}
    </div>
  );
};
