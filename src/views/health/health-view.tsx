import React from 'react';
import { 
  Settings as SettingsIcon
} from 'lucide-react';
import { Card } from '../../components/shared/card';
import { FailureRateCard } from './components/failure-rate-card';
import { CacheHitRateCard } from './components/cache-hit-rate-card';
import { SchedulerStatusCard } from './scheduler-status-card';
import { LastDeployedCard } from './components/last-deployed-card';
import { InsightsSummary } from './components/insights-summary';

export const HealthView: React.FC<{ 
  deploymentUrl?: string; 
  authToken: string; 
  useMockData?: boolean 
}> = ({
  deploymentUrl,
  authToken,
  useMockData = false,
}) => {

  return (
    <div className="cp-health-container cp-scrollbar">
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

      <InsightsSummary
        deploymentUrl={deploymentUrl}
        authToken={authToken}
        useMockData={useMockData}
      />
    </div>
  );
};
