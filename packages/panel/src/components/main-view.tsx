import React from 'react';
import { HealthView } from '../views/health/health-view';
import { DataView } from '../views/data/data-view';
import { FunctionsView } from '../views/functions';
import { SchedulesView } from '../views/schedules';
import { TabId } from '../types/tabs';

interface MainViewsProps {
  activeTab: TabId;
  containerProps: {
    convex: any;
    accessToken: string;
    deployUrl?: string;
    baseUrl?: string;
    adminClient: any;
    useMockData?: boolean;
    onError?: (error: string) => void;
    theme?: any;
    mergedTheme?: any;
    settings?: any;
    [key: string]: any;
  };
}

const comingSoonStyle: React.CSSProperties = { padding: '24px', color: '#fff' };

const createComingSoonRenderer =
  (label: string) => (): React.ReactElement =>
    <div style={comingSoonStyle}>{`${label} View - Coming Soon`}</div>;

type ContainerProps = MainViewsProps['containerProps'];
type TabRenderer = (props: ContainerProps) => React.ReactElement;

const tabRenderers: Record<TabId, TabRenderer> = {
  health: ({ deployUrl, accessToken, useMockData }) => (
    <HealthView deploymentUrl={deployUrl} authToken={accessToken} useMockData={useMockData} />
  ),
  data: ({ deployUrl, baseUrl, accessToken, adminClient, useMockData, onError }) => (
    <DataView
      convexUrl={deployUrl || baseUrl}
      accessToken={accessToken}
      baseUrl={baseUrl}
      adminClient={adminClient}
      useMockData={useMockData}
      onError={onError}
    />
  ),
  functions: ({ adminClient, accessToken, useMockData, onError }) => (
    <FunctionsView
      adminClient={adminClient}
      accessToken={accessToken}
      useMockData={useMockData}
      onError={onError}
    />
  ),
  files: createComingSoonRenderer('Files'),
  schedules: ({ adminClient, accessToken, useMockData }) => (
    <SchedulesView
      adminClient={adminClient}
      accessToken={accessToken}
      useMockData={useMockData}
    />
  ),
  logs: createComingSoonRenderer('Logs'),
  settings: createComingSoonRenderer('Settings'),
};

export const MainViews: React.FC<MainViewsProps> = ({ activeTab, containerProps }) => {
  const render = tabRenderers[activeTab] || tabRenderers.health;
  return render(containerProps);
};
