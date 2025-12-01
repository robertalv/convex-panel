import React from 'react';
import { HealthView } from '../views/health/health-view';
import { DataView } from '../views/data/data-view';
import { FunctionsView } from '../views/functions';
import { SchedulesView } from '../views/schedules';
import { FilesView } from '../views/files';
import { LogsView } from '../views/logs';
import { TabId } from '../types/tabs';

interface MainViewsProps {
  activeTab: TabId;
  containerProps: {
    convex: any;
    accessToken: string;
    teamAccessToken?: string;
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
  data: ({ deployUrl, baseUrl, accessToken, adminClient, useMockData, onError, teamSlug, projectSlug }) => (
    <DataView
      convexUrl={deployUrl || baseUrl}
      accessToken={accessToken}
      baseUrl={baseUrl}
      adminClient={adminClient}
      useMockData={useMockData}
      onError={onError}
      teamSlug={teamSlug}
      projectSlug={projectSlug}
    />
  ),
  functions: ({ adminClient, accessToken, deployUrl, baseUrl, useMockData, onError }) => (
    <FunctionsView
      adminClient={adminClient}
      accessToken={accessToken}
      deployUrl={deployUrl}
      baseUrl={baseUrl}
      useMockData={useMockData}
      onError={onError}
    />
  ),
  files: ({ deployUrl, baseUrl, accessToken, adminClient, useMockData, onError, teamSlug, projectSlug }) => (
    <FilesView
      convexUrl={deployUrl || baseUrl}
      accessToken={accessToken}
      baseUrl={baseUrl}
      adminClient={adminClient}
      useMockData={useMockData}
      onError={onError}
      teamSlug={teamSlug}
      projectSlug={projectSlug}
    />
  ),
  schedules: ({ adminClient, accessToken, useMockData }) => (
    <SchedulesView
      adminClient={adminClient}
      accessToken={accessToken}
      useMockData={useMockData}
    />
  ),
  logs: ({ deployUrl, baseUrl, accessToken, adminClient, useMockData, onError, teamSlug, projectSlug }) => (
    <LogsView
      convexUrl={deployUrl || baseUrl}
      accessToken={accessToken}
      baseUrl={baseUrl}
      adminClient={adminClient}
      useMockData={useMockData}
      onError={onError}
      teamSlug={teamSlug}
      projectSlug={projectSlug}
    />
  ),
<<<<<<< HEAD
  components: () => <ComponentsView />,
  settings: ({ deployUrl, accessToken, adminClient, teamAccessToken }) => (
    <SettingsView
      adminClient={adminClient}
      accessToken={accessToken}
      deploymentUrl={deployUrl}
      teamAccessToken={teamAccessToken}
    />
  ),
=======
  settings: createComingSoonRenderer('Settings'),
>>>>>>> b2a4a8f8de8904a46f4a76f8476d7f39a6f12196
};

export const MainViews: React.FC<MainViewsProps> = ({ activeTab, containerProps }) => {
  const render = tabRenderers[activeTab] || tabRenderers.health;
  return render(containerProps);
};
