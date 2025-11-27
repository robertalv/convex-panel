// Storage Keys
export const STORAGE_PREFIX = 'convex-panel';

/**
 * Storage keys
 * @type {Record<string, string>}
 * @description A collection of storage keys for the Convex Panel
 */
export const STORAGE_KEYS: Record<string, string> = {
	POSITION: `${STORAGE_PREFIX}:position`,
	SIZE: `${STORAGE_PREFIX}:size`,
  ACTIVE_TAB: `${STORAGE_PREFIX}:active-tab`,
  SETTINGS: `${STORAGE_PREFIX}:settings`,
  ACTIVE_TABLE: `${STORAGE_PREFIX}:active-table`,
  TABLE_FILTERS: `${STORAGE_PREFIX}:table-filters`,
  SIDEBAR_COLLAPSED: `${STORAGE_PREFIX}:sidebar-collapsed`,
  LOG_TYPE_FILTER: `${STORAGE_PREFIX}:log-type-filter`,
  DEVTOOLS_ACTIVE_TAB: `${STORAGE_PREFIX}:devtools-active-tab`,
  RECENTLY_VIEWED_TABLES: `${STORAGE_PREFIX}:recently-viewed-tables`,
  DETAIL_PANEL_WIDTH: `${STORAGE_PREFIX}:detail-panel-width`,
  SELECTED_FUNCTION: `${STORAGE_PREFIX}:selected-function`,
  PANEL_HIDDEN: `${STORAGE_PREFIX}:panel-hidden`,
}

// Default UI measurements
export const UI_DEFAULTS = {
  DETAIL_PANEL_DEFAULT_WIDTH: 400, // pixels
  DETAIL_PANEL_MIN_WIDTH: 300, // pixels
  DETAIL_PANEL_MAX_WIDTH: 800, // pixels
};

/**
 * Interval constants for polling and retries
 */
export const INTERVALS = {
  /**
   * Polling interval for fetching logs in milliseconds
   * Controls how frequently logs are fetched when streaming
   * @default 1000
   */
  POLLING_INTERVAL: 1000,

  /**
   * Minimum interval between fetch requests in milliseconds
   * Prevents too frequent API calls
   * @default 500
   */
  MIN_FETCH_INTERVAL: 1000,

  /**
   * Delay before retrying after a timeout in milliseconds
   * Controls backoff period after failed requests
   * @default 2000
   */
  RETRY_DELAY: 2000,

  /**
   * Maximum number of retry attempts for timeouts
   * Prevents infinite retry loops
   * @default 3
   */
  MAX_RETRY_ATTEMPTS: 3,

  /**
   * Maximum number of consecutive errors before disabling
   * Prevents continuous failed requests
   * @default 5
   */
  MAX_CONSECUTIVE_ERRORS: 5
};

// Types for tabs
export type TabTypes = 'logs' | 'data-tables' | 'health' | 'devtools' | 'functions';
export type FunctionTabTypes = 'insights' | 'code' | 'function input';
export type DevToolsTabTypes = 'console' | 'network';

// Convex dashboard log types
export enum LogType {
	ALL = "All log types",
	SUCCESS = "success",
	FAILURE = "failure",
	DEBUG = "debug",
	LOGINFO = "loginfo",
	WARNING = "warn",
	ERROR = "error",
	HTTP = "HTTP",
}

// Default settings
export const defaultSettings = {
  showDebugFilters: false,
  showStorageDebug: false,
  logLevel: 'info' as const,
  healthCheckInterval: 60, // seconds
  showRequestIdInput: true,
  showLimitInput: true,
  showSuccessCheckbox: true,
};

// API Routes
export const ROUTES = {
  STREAM_FUNCTION_LOGS: '/api/stream_function_logs',
  SHAPES2: '/api/shapes2',
  CACHE_HIT_RATE: '/api/app_metrics/cache_hit_percentage_top_k',
  FAILURE_RATE: '/api/app_metrics/failure_percentage_top_k',
  LIST_FUNCTION_LOGS: '/api/list_function_logs',
  SCHEDULER_LAG: '/api/app_metrics/scheduler_lag_top_k',
  GET_SOURCE_CODE: '/api/get_source_code',
  NPM_CONVEX: 'https://registry.npmjs.org/convex/latest',
  CONVEX_CHANGELOG: 'https://github.com/get-convex/convex-js/blob/main/CHANGELOG.md',
  UDF_RATE: '/api/app_metrics/udf_rate',
  LATENCY_PERCENTILES: '/api/app_metrics/latency_percentiles',
  LAST_PUSH_EVENT: '/api/system/deployment_events/last_push_event',
  GET_VERSION: '/api/system/get_version',
} as const;

// Filter types
export const typeOptions = [
  { value: 'string', label: 'string' },
  { value: 'boolean', label: 'boolean' },
  { value: 'number', label: 'number' },
  { value: 'bigint', label: 'bigint' },
  { value: 'null', label: 'null' },
  { value: 'object', label: 'object' },
  { value: 'array', label: 'array' },
  { value: 'id', label: 'id' },
  { value: 'bytes', label: 'bytes' },
  { value: 'unset', label: 'unset' }
];

// Filter operators
export const operatorOptions = [
  { value: 'eq', label: 'equals' },
  { value: 'neq', label: 'not equal' },
  { value: 'gt', label: '>' },
  { value: 'lt', label: '<' },
  { value: 'gte', label: '>=' },
  { value: 'lte', label: '<=' },
  { value: 'isType', label: 'Is type' },
  { value: 'isNotType', label: 'Is not type' },
];

// Console Filter Types
export const CONSOLE_FILTER_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error'},
  { value: 'debug', label: 'Debug' }
]

export const TABS = [
  { id: 'logs' as const, label: 'Logs' },
  { id: 'data-tables' as const, label: 'Data' },
  { id: 'health' as const, label: 'Health' },
  { id: 'devtools' as const, label: 'DevTools' },
  { id: 'functions' as const, label: 'Functions' },
] as const;

export const DEVTOOL_TABS = [
  { id: 'console' as const, label: 'Console' },
  { id: 'network' as const, label: 'Network' },
  // { id: 'application' as const, label: 'Application' },
] as const;