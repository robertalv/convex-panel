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
    <div style={{ padding: '16px', height: '100%', overflowY: 'auto', backgroundColor: '#0F1115' }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '12px', 
        marginBottom: '12px' 
      }}>
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
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '12px', 
        marginBottom: '12px' 
      }}>
        <LastDeployedCard 
          deploymentUrl={deploymentUrl}
          authToken={authToken}
          useMockData={useMockData}
        />
        
        <div style={{ opacity: 0.5, pointerEvents: 'none', filter: 'grayscale(100%)', userSelect: 'none' }}>
          <Card title="Exception Reporting" action={<div style={{ display: 'flex', gap: '8px' }}><SettingsIcon size={16} /></div>}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
              <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '3px' }}>Coming soon</div>
              <div style={{ fontSize: '11px', color: '#4b5563' }}>Get notified of function failures.</div>
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
