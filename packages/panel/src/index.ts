import ConvexPanel from "./ConvexPanel";

export type {
  ButtonProps,
  ThemeClasses,
  LogEntry,
  ContainerProps,
  ConvexPanelProps,
  LogsContainerProps,
  LogsToolbarProps,
  LogsTableProps,
  LogRowProps,
  LogDetailPanelProps,
  DataTableProps,
  NetworkPanelProps,
  HealthContainerProps,
  ActiveFiltersProps,
  FilterMenuProps,
  FilterDebugProps,
  DataTableSidebarProps,
  DataTableContentProps,
  StorageDebugProps,
  FilterClause,
  FilterExpression,
  MenuPosition,
  TableField,
  TableSchema,
  TableDefinition,
  TableDocument,
  RecentlyViewedTable,
  SortConfig,
  SortDirection,
  NetworkCall,
  NetworkRowProps,
  NetworkTableProps,
  ButtonPosition,
  LogRowItemData,
  PageArgs,
  PaginationOptions,
  FilterMenuState,
  UseFiltersProps,
  UseFiltersReturn,
  UseTableDataProps,
  UseTableDataReturn,
  FetchLogsOptions,
  FetchLogsResponse,
  FetchTablesOptions,
  FetchTablesResponse,
  CacheHitData,
  CacheHitRateChartProps,
  TimeStamp,
  FailureData,
  FailureRateChartProps,
  SchedulerLagChartProps,
  SchedulerStatusProps,
  TimeSeriesData,
  APIResponse,
  UdfType,
  Visibility,
  FileNode,
  ModuleFunction,
  FunctionsState,
  File,
  Folder,
  FileOrFolder,
  ProjectEnvVarConfig,
  FetchFn,
} from "./types";
export { LogType, LOG_TYPES } from "./utils/constants";

// OAuth exports
export { useOAuth } from "./hooks/useOAuth";
export type { UseOAuthReturn } from "./hooks/useOAuth";
export type { OAuthConfig, OAuthToken, TokenScope } from "./utils/oauth";
export {
  buildAuthorizationUrl,
  exchangeCodeForToken,
  handleOAuthCallback,
  getStoredToken,
  storeToken,
  clearToken,
} from "./utils/oauth";

// Theme exports
export { ThemeProvider, useTheme, useThemeSafe } from "./hooks/useTheme";
export type { Theme } from "./hooks/useTheme";

export { isDevelopment } from "./utils/env";

// API utilities for metrics
export {
  fetchFailureRate,
  fetchCacheHitRate,
  fetchSchedulerLag,
  fetchLatencyPercentiles,
  fetchUdfRate,
  fetchRecentErrors,
  fetchTableRate,
  fetchUdfExecutionStats,
  aggregateFunctionStats,
} from "./utils/api/metrics";

// Component exports
export { ConvexPanel };
export { ConvexPanelShadow } from "./ConvexPanelShadow";
export { BottomSheet } from "./components/bottom-sheet";
export { AuthPanel } from "./components/auth-panel";
export { AppErrorBoundary } from "./components/app-error-boundary";
export { AppContentWrapper } from "./components/app-content-wrapper";
export { ConvexLogo } from "./components/ConvexLogo";
export { UserMenu } from "./components/UserMenu";
export { DesktopHeader } from "./components/DesktopHeader";
export type { DesktopHeaderProps } from "./components/DesktopHeader";
export type { Team, Project, Deployment, User } from "./types/dashboard";

// View exports for desktop app
export { HealthView } from "./views/health";
export { DataView } from "./views/data";
export { FunctionsView } from "./views/functions";
export { FilesView } from "./views/files";
export { LogsView } from "./views/logs";

// Context exports for desktop app
export {
  SheetProvider,
  useSheet,
  useSheetSafe,
  useSheetActions,
  useSheetActionsSafe,
  useSheetState,
  useSheetStateSafe,
} from "./contexts/sheet-context";
export type { SheetContent } from "./contexts/sheet-context";

// Component selector exports for desktop app
export { ComponentSelector } from "./components/component-selector";
export type { ComponentSelectorProps } from "./components/component-selector";
export { useComponents } from "./hooks/useComponents";
export type {
  UseComponentsProps,
  UseComponentsReturn,
} from "./hooks/useComponents";
export { GlobalSheet } from "./components/shared/global-sheet";

// Sheet component for inline rendering in desktop
export { Sheet } from "./components/shared/sheet";
export type { SheetProps } from "./components/shared/sheet";

// EditDocumentSheet for desktop data view with inline mode support
export { EditDocumentSheet } from "./views/data/components/edit-document-sheet";
export type { EditDocumentSheetProps } from "./views/data/components/edit-document-sheet";

// Style utilities for desktop/standalone apps (not used by default to avoid affecting parent websites)
export { panelStyles } from "./styles/runtime";
export { injectPanelStyles, removePanelStyles } from "./utils/injectStyles";

// Storage utilities for desktop apps to sync with internal caching
export { saveActiveTable, getActiveTable } from "./utils/storage";

// Settings view exports for desktop app
export { SettingsView } from "./views/settings";
export type { SettingsViewProps } from "./views/settings";
export { EnvironmentVariables } from "./views/settings/components/environment-variables";
export type { EnvironmentVariablesProps } from "./views/settings/components/environment-variables";
export { UrlDeployKey } from "./views/settings/components/url-deploy-key";
export type { UrlDeployKeyProps } from "./views/settings/components/url-deploy-key";
export { Authentication } from "./views/settings/components/authentication";
export type { AuthenticationProps } from "./views/settings/components/authentication";
export { Components as SettingsComponents } from "./views/settings/components/components";
export type { ComponentsProps as SettingsComponentsProps } from "./views/settings/components/components";
export { BackupRestore } from "./views/settings/components/backup-restore";
export type { BackupRestoreProps } from "./views/settings/components/backup-restore";
export { PauseDeployment } from "./views/settings/components/pause-deployment";
export { AIAnalysisSettings } from "./views/settings/components/ai-analysis-settings";

// Default export uses Shadow DOM for complete isolation
import ConvexPanelShadow from "./ConvexPanelShadow";
export default ConvexPanelShadow;
