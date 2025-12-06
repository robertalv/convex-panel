// URLS
export const CONVEX_CLOUD_DOMAIN = 'convex.cloud';
export const CONVEX_PROVISION_DOMAIN = 'provision.convex.dev';
export const CONVEX_API_DOMAIN = 'api.convex.dev';
export const CONVEX_DASHBOARD_DOMAIN = 'dashboard.convex.dev';
export const CONVEX_PANEL_API_DOMAIN = 'api.convexpanel.dev';
export const CONVEX_PANEL_DOMAIN = 'convexpanel.dev';
export const NPM_API_DOMAIN = 'api.npmjs.org';

// Storage Keys
export const STORAGE_PREFIX = 'convex-panel';
export const STATE_PAYLOAD_VERSION = 1;
/**
 * Storage keys
 * @type {Record<string, string>}
 * @description A collection of storage keys for the Convex Panel
 */

export const STORAGE_KEYS: Record<string, string> = {
  OAUTH_TOKEN: `${STORAGE_PREFIX}:oauth-token`,
  OAUTH_STATE: `${STORAGE_PREFIX}:oauth-state`,
  OAUTH_CODE_VERIFIER: `${STORAGE_PREFIX}:oauth-code-verifier`,
  OAUTH_USED_CODES: `${STORAGE_PREFIX}:oauth-used-codes`,
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
  THEME: `${STORAGE_PREFIX}:theme`,
  PANEL_HEIGHT: `${STORAGE_PREFIX}:panel-height`,
  SETTINGS_SECTION: `${STORAGE_PREFIX}:settings-section`,
  BOTTOM_SHEET_EXPANDED: `${STORAGE_PREFIX}:bottom-sheet-expanded`,
  DEPLOYMENT_STATE_CHANGED: `${STORAGE_PREFIX}:deployment-state-changed`,
  FILTER_HISTORY_RETENTION_MS: `${STORAGE_PREFIX}:filter-history-retention-ms`,
}

export const PANEL_MIN_HEIGHT = 40;

export const UI_DEFAULTS = {
  DETAIL_PANEL_DEFAULT_WIDTH: 400,
  DETAIL_PANEL_MIN_WIDTH: 300,
  DETAIL_PANEL_MAX_WIDTH: 800,
  PANEL_MIN_HEIGHT,
  PANEL_COLLAPSED_HEIGHT: `${PANEL_MIN_HEIGHT}px`,
  PANEL_MAX_HEIGHT_RATIO: 0.9,
  PANEL_DEFAULT_HEIGHT: '60vh',
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
export const LogType = {
	ALL: "All log types",
	SUCCESS: "success",
	FAILURE: "failure",
	DEBUG: "debug",
	LOGINFO: "loginfo",
	WARNING: "warn",
	ERROR: "error",
	HTTP: "HTTP",
} as const;

export type LogType = typeof LogType[keyof typeof LogType];

export const LOG_TYPES = [
  { value: 'success', label: 'success' },
  { value: 'failure', label: 'failure' },
  { value: 'debug', label: 'debug' },
  { value: 'log / info', label: 'log / info' },
  { value: 'warn', label: 'warn' },
  { value: 'error', label: 'error' },
];

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
  STREAM_UDF_EXECUTION: '/api/stream_udf_execution',
  SHAPES2: '/api/shapes2',
  TABLE_COLUMNS: '/api/get_table_column_names',
  CACHE_HIT_RATE: '/api/app_metrics/cache_hit_percentage_top_k',
  CACHE_HIT_PERCENTAGE: '/api/cache_hit_percentage',
  FAILURE_RATE: '/api/app_metrics/failure_percentage_top_k',
  LIST_FUNCTION_LOGS: '/api/list_function_logs',
  SCHEDULER_LAG: '/api/app_metrics/scheduler_lag_top_k',
  GET_SOURCE_CODE: '/api/get_source_code',
  NPM_CONVEX: 'https://registry.npmjs.org/convex/latest',
  CONVEX_CHANGELOG: 'https://github.com/get-convex/convex-js/blob/main/CHANGELOG.md',
  UDF_RATE: '/api/app_metrics/udf_rate',
  PERFORMANCE_INVOCATION_UDF_RATE: 'api/udf_rate',
  PERFORMANCE_EXECUTION_TIME: 'api/execution_time',
  LATENCY_PERCENTILES: '/api/app_metrics/latency_percentiles',
  LAST_PUSH_EVENT: '/api/system/deployment_events/last_push_event',
  GET_VERSION: '/api/system/get_version',
  REQUEST_CLOUD_BACKUP: '/api/dashboard/deployments/{deploymentId}/request_cloud_backup',
  LIST_CLOUD_BACKUPS: '/api/dashboard/teams/{teamId}/list_cloud_backups',
  GET_CLOUD_BACKUP: '/api/dashboard/cloud_backups/{backupId}',
  DELETE_CLOUD_BACKUP: '/api/dashboard/cloud_backups/{backupId}/delete',
  CANCEL_CLOUD_BACKUP: '/api/dashboard/cloud_backups/{backupId}/cancel',
  RESTORE_FROM_CLOUD_BACKUP: '/api/dashboard/deployments/{deploymentId}/restore_from_cloud_backup',
  PERFORM_IMPORT: '/api/dashboard/deployments/{deploymentId}/perform_import',
  GET_BACKUP_DOWNLOAD_URL: '/api/export/zip/{snapshotId}?{params}',
  CONFIGURE_PERIODIC_BACKUP: '/api/dashboard/deployments/{deploymentId}/configure_periodic_backup',
  GET_PERIODIC_BACKUP_CONFIG: '/api/dashboard/deployments/{deploymentId}/get_periodic_backup_config',
  DISABLE_PERIODIC_BACKUP: '/api/v1/deployments/{deploymentId}/disable_periodic_backup',
  DELETE_COMPONENT: '/api/v1/delete_component',
  DELETE_TABLES: '/api/delete_tables',
  UPDATE_ENVIRONMENT_VARIABLES: '/api/update_environment_variables',
  QUERY: '/api/query',
  STORAGE: '/api/storage',
  QUERY_BATCH: '/api/admin/query_batch',
  STORAGE_UPLOAD: '/api/storage/upload',
  MUTATION: '/api/mutation',
  STREAM_FUNCTION_LOGS_API: '/api/app_metrics/stream_function_logs',
  SCHEDULED_JOB_LAG: '/api/app_metrics/scheduled_job_lag',
  TABLE_RATE: '/api/app_metrics/table_rate',
  DASHBOARD_PROFILE: '/api/dashboard/profile',
  TOKEN_DETAILS: '/v1/token_details',
  TEAMS: '/api/v1/teams',
  TEAM_FROM_DEPLOYMENT: '/api/v1/deployments/{deploymentName}/team_and_project',
  FETCH_TEAMS: '/api/dashboard/teams',
  FETCH_PROJECTS: '/api/dashboard/teams/{teamId}/projects',
  FETCH_DEPLOYMENTS: '/api/dashboard/projects/{projectId}/instances',
  CONVEX_OAUTH: '/v1/convex/oauth',
  CREATE_DEPLOY_KEY: '/api/v1/deployments/{deploymentId}/create_deploy_key',
  CHANGE_DEPLOYMENT_STATE: '/api/change_deployment_state',
  PERFORM_IMPORT_API: '/api/perform_import',
  HEALTH_ENDPOINT: '/health',
  OAUTH_DEV_ENDPOINT: '/api/convex/exchange',
  OAUTH_PROD_ENDPOINT: '/oauth/exchange',
  RUN_TEST_FUNCTION: '/api/run_test_function',
} as const;

export const NPM_ROUTES = {
  DOWNLOADS: '/downloads/point/last-week/{packageName}',
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

export const SYSTEM_QUERIES = {
  LIST_AUTH_PROVIDERS: '_system/frontend/listAuthProviders:default',
  LIST_SNAPSHOT_IMPORTS: '_system/frontend/snapshotImport:list',
  LIST_COMPONENTS: '_system/frontend/components:list',
  GET_ENVIRONMENT_VARIABLE: '_system/cli/queryEnvironmentVariables:get',
  LIST_ENVIRONMENT_VARIABLES: '_system/cli/queryEnvironmentVariables',
  GET_FILE: '_system/frontend/fileStorageV2:getFile',
  GET_FILE_METADATA: '_system/frontend/fileStorageV2:fileMetadata',
  LIST_DOCUMENTS: 'system:listDocuments',
  QUERY: 'system:query',
  FUNCTION_API_SPEC: '_system/cli/modules:apiSpec',
  LAST_PUSH_EVENT: '_system/frontend/deploymentEvents:lastPushEvent',
  GET_VERSION: '_system/frontend/getVersion:default',
  INSIGHTS_LIST: '_system/frontend/insights:list',
  GET_ALL_TABLE_FIELDS: '_system/frontend/getAllTableFields:default',
  GET_TABLE_MAPPING: '_system/frontend/getTableMapping',
  GET_TABLE_SIZE: '_system/frontend/tableSize:default',
  PAGINATED_TABLE_DOCUMENTS: '_system/frontend/paginatedTableDocuments:default',
  PROJECT_INFO: '_system/project:info',
  DEPLOYMENT_STATE: '_system/frontend/deploymentState:deploymentState',
  DEPLOYMENT_INFO: '_system/cli/deploymentInfo',
  CLOUD_URL: '_system/cli/convexUrl:cloudUrl',
}

export const SYSTEM_MUTATIONS = {
  CONFIRM_IMPORT: '_system/frontend/snapshotImport:confirm',
  GENERATE_UPLOAD_URL: '_system/frontend/fileStorageV2:generateUploadUrl',
  DELETE_FILES: '_system/frontend/fileStorageV2:deleteFiles',
}