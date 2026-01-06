import React, { lazy, Suspense, useEffect, useRef } from "react";
import type { TabId } from "../types/tabs";
import { useSheetActionsSafe } from "../contexts/sheet-context";

// Lazy load all views for code splitting
const HealthView = lazy(() =>
  import("../views/health/health-view").then((m) => ({
    default: m.HealthView,
  })),
);
const DataView = lazy(() =>
  import("../views/data/data-view").then((m) => ({ default: m.DataView })),
);
const FunctionsView = lazy(() =>
  import("../views/functions").then((m) => ({ default: m.FunctionsView })),
);
const SchedulesView = lazy(() =>
  import("../views/schedules").then((m) => ({ default: m.SchedulesView })),
);
const FilesView = lazy(() =>
  import("../views/files").then((m) => ({ default: m.FilesView })),
);
const LogsView = lazy(() =>
  import("../views/logs").then((m) => ({ default: m.LogsView })),
);
const ComponentsView = lazy(() =>
  import("../views/components").then((m) => ({ default: m.ComponentsView })),
);
const SettingsView = lazy(() =>
  import("../views/settings").then((m) => ({ default: m.SettingsView })),
);

// Loading fallback component
const ViewLoadingFallback: React.FC<{ height?: string }> = ({
  height = "400px",
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height,
      color: "var(--cp-text-secondary, #666)",
    }}
  >
    <div>Loading...</div>
  </div>
);

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
    container?: HTMLElement | null;
    [key: string]: any;
  };
}

// Reserved for potential future use:
// const comingSoonStyle: React.CSSProperties = { padding: '24px', color: '#fff' };
// const createComingSoonRenderer =
//   (label: string) => (): React.ReactElement =>
//     <div style={comingSoonStyle}>{`${label} View - Coming Soon`}</div>;

type ContainerProps = MainViewsProps["containerProps"];
type TabRenderer = (props: ContainerProps) => React.ReactElement;

const tabRenderers: Record<TabId, TabRenderer> = {
  health: ({
    deployUrl,
    accessToken,
    teamAccessToken,
    useMockData,
    adminClient,
  }) => (
    <HealthView
      deploymentUrl={deployUrl}
      authToken={accessToken}
      teamAccessToken={teamAccessToken}
      useMockData={useMockData}
      adminClient={adminClient}
    />
  ),
  data: ({
    deployUrl,
    baseUrl,
    accessToken,
    adminClient,
    useMockData,
    onError,
    teamSlug,
    projectSlug,
  }) => (
    <DataView
      convexUrl={deployUrl || baseUrl}
      accessToken={accessToken}
      adminClient={adminClient}
      useMockData={useMockData}
      onError={onError}
      teamSlug={teamSlug}
      projectSlug={projectSlug}
    />
  ),
  functions: ({
    adminClient,
    accessToken,
    deployUrl,
    baseUrl,
    useMockData,
    onError,
  }) => (
    <FunctionsView
      adminClient={adminClient}
      accessToken={accessToken}
      deployUrl={deployUrl}
      baseUrl={baseUrl}
      useMockData={useMockData}
      onError={onError}
    />
  ),
  files: ({
    deployUrl,
    baseUrl,
    accessToken,
    adminClient,
    useMockData,
    onError,
  }) => (
    <FilesView
      convexUrl={deployUrl || baseUrl}
      accessToken={accessToken}
      adminClient={adminClient}
      useMockData={useMockData}
      onError={onError}
    />
  ),
  schedules: ({ adminClient, useMockData }) => (
    <SchedulesView adminClient={adminClient} useMockData={useMockData} />
  ),
  logs: ({
    deployUrl,
    baseUrl,
    accessToken,
    adminClient,
    useMockData,
    onError,
  }) => (
    <LogsView
      convexUrl={deployUrl || baseUrl}
      accessToken={accessToken}
      baseUrl={baseUrl}
      adminClient={adminClient}
      useMockData={useMockData}
      onError={onError}
    />
  ),
  components: () => <ComponentsView />,
  settings: ({ deployUrl, accessToken, adminClient, teamAccessToken }) => (
    <SettingsView
      adminClient={adminClient}
      accessToken={accessToken}
      deploymentUrl={deployUrl}
      teamAccessToken={teamAccessToken}
    />
  ),
};

const MainViewsComponent: React.FC<MainViewsProps> = ({
  activeTab,
  containerProps,
}) => {
  const { closeSheet } = useSheetActionsSafe();
  const prevActiveTabRef = useRef<TabId | null>(null);

  // Close sheet when switching to a different view
  useEffect(() => {
    if (
      prevActiveTabRef.current !== null &&
      prevActiveTabRef.current !== activeTab
    ) {
      closeSheet();
    }
    prevActiveTabRef.current = activeTab;
  }, [activeTab, closeSheet]);

  const render = tabRenderers[activeTab] || tabRenderers.health;
  return (
    <Suspense fallback={<ViewLoadingFallback />}>
      {render(containerProps)}
    </Suspense>
  );
};

// Memoize MainViews to prevent re-renders when parent re-renders
// but props haven't changed (e.g., when sheet state changes)
export const MainViews = React.memo(MainViewsComponent);
