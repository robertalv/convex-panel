import React from 'react';
import { HealthView } from '../views/health/health-view';
import { DataView } from '../views/data/data-view';
import { FunctionsView } from '../views/functions';

type TabId = 'health' | 'data' | 'functions' | 'files' | 'schedules' | 'logs' | 'settings';

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

export const FunctionsViewComponent: React.FC<MainViewsProps['containerProps']> = (props) => {
  return (
    <FunctionsView
      adminClient={props.adminClient}
      accessToken={props.accessToken}
      useMockData={props.useMockData}
      onError={props.onError}
    />
  );
};

export const FilesView: React.FC = () => {
  return <div style={{ padding: '24px', color: '#fff' }}>Files View - Coming Soon</div>;
};

export const SchedulesView: React.FC = () => {
  return <div style={{ padding: '24px', color: '#fff' }}>Schedules View - Coming Soon</div>;
};

export const LogsView: React.FC<MainViewsProps['containerProps']> = () => {
  return <div style={{ padding: '24px', color: '#fff' }}>Logs View - Coming Soon</div>;
};

export const SettingsView: React.FC = () => {
  return <div style={{ padding: '24px', color: '#fff' }}>Settings View - Coming Soon</div>;
};

export const MainViews: React.FC<MainViewsProps> = ({ activeTab, containerProps }) => {
  switch (activeTab) {
    case 'health':
      return (
        <HealthView
          deploymentUrl={containerProps.deployUrl}
          authToken={containerProps.accessToken}
          useMockData={containerProps.useMockData}
        />
      );
    case 'data':
      return (
        <DataView
          convexUrl={containerProps.deployUrl || containerProps.baseUrl}
          accessToken={containerProps.accessToken}
          baseUrl={containerProps.baseUrl}
          adminClient={containerProps.adminClient}
          useMockData={containerProps.useMockData}
          onError={containerProps.onError}
        />
      );
    case 'functions':
      return <FunctionsViewComponent {...containerProps} />;
    case 'files':
      return <FilesView />;
    case 'schedules':
      return <SchedulesView />;
    case 'logs':
      return <LogsView {...containerProps} />;
    case 'settings':
      return <SettingsView />;
    default:
      return (
        <HealthView
          deploymentUrl={containerProps.deployUrl}
          authToken={containerProps.accessToken}
          useMockData={containerProps.useMockData}
        />
      );
  }
};
