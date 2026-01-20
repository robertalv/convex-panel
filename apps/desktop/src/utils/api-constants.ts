/**
 * API Constants for Convex API interactions
 * Contains routes, domains, and system queries/mutations
 */

// URLS
export const CONVEX_CLOUD_DOMAIN = "convex.cloud";
export const CONVEX_PROVISION_DOMAIN = "provision.convex.dev";
export const CONVEX_API_DOMAIN = "api.convex.dev";
export const CONVEX_DASHBOARD_DOMAIN = "dashboard.convex.dev";

/**
 * API Routes for various Convex endpoints
 */
export const ROUTES = {
  // Backup & Restore
  REQUEST_CLOUD_BACKUP:
    "/api/dashboard/deployments/{deploymentId}/request_cloud_backup",
  LIST_CLOUD_BACKUPS: "/api/dashboard/teams/{teamId}/list_cloud_backups",
  GET_CLOUD_BACKUP: "/api/dashboard/cloud_backups/{backupId}",
  DELETE_CLOUD_BACKUP: "/api/dashboard/cloud_backups/{backupId}/delete",
  CANCEL_CLOUD_BACKUP: "/api/dashboard/cloud_backups/{backupId}/cancel",
  RESTORE_FROM_CLOUD_BACKUP:
    "/api/dashboard/deployments/{deploymentId}/restore_from_cloud_backup",
  PERFORM_IMPORT: "/api/dashboard/deployments/{deploymentId}/perform_import",
  GET_BACKUP_DOWNLOAD_URL: "/api/export/zip/{snapshotId}?{params}",
  CONFIGURE_PERIODIC_BACKUP:
    "/api/dashboard/deployments/{deploymentId}/configure_periodic_backup",
  GET_PERIODIC_BACKUP_CONFIG:
    "/api/dashboard/deployments/{deploymentId}/get_periodic_backup_config",
  DISABLE_PERIODIC_BACKUP:
    "/api/v1/deployments/{deploymentId}/disable_periodic_backup",

  // Components
  DELETE_COMPONENT: "/api/delete_component",

  // Environment Variables
  UPDATE_ENVIRONMENT_VARIABLES: "/api/update_environment_variables",

  // Teams & Deployments
  TOKEN_DETAILS: "/v1/token_details",
  TEAMS: "/api/v1/teams",
  TEAM_FROM_DEPLOYMENT: "/api/deployment/{deploymentName}/team_and_project",
  FETCH_TEAMS: "/api/dashboard/teams",
  FETCH_PROJECTS: "/api/dashboard/teams/{teamId}/projects",
  FETCH_DEPLOYMENTS: "/api/dashboard/projects/{projectId}/instances",
  DASHBOARD_PROFILE: "/api/dashboard/profile",
  CREATE_DEPLOY_KEY: "/api/v1/deployments/{deploymentId}/deploy_keys",

  // Other
  QUERY: "/api/query",
  MUTATION: "/api/mutation",
  STORAGE: "/api/storage",
  PERFORM_IMPORT_API: "/api/perform_import",
  CHANGE_DEPLOYMENT_STATE: "/api/change_deployment_state",
} as const;

/**
 * System queries for Convex internal operations
 */
export const SYSTEM_QUERIES = {
  LIST_AUTH_PROVIDERS: "_system/frontend/listAuthProviders:default",
  LIST_SNAPSHOT_IMPORTS: "_system/frontend/snapshotImport:list",
  LIST_COMPONENTS: "_system/frontend/components:list",
  GET_ENVIRONMENT_VARIABLE: "_system/cli/queryEnvironmentVariables:get",
  LIST_ENVIRONMENT_VARIABLES: "_system/cli/queryEnvironmentVariables",
  GET_FILE: "_system/frontend/fileStorageV2:getFile",
  GET_FILE_METADATA: "_system/frontend/fileStorageV2:fileMetadata",
  LIST_DOCUMENTS: "system:listDocuments",
  QUERY: "system:query",
  FUNCTION_API_SPEC: "_system/cli/modules:apiSpec",
  LAST_PUSH_EVENT: "_system/frontend/deploymentEvents:lastPushEvent",
  GET_VERSION: "_system/frontend/getVersion:default",
  GET_ALL_TABLE_FIELDS: "_system/frontend/getAllTableFields:default",
  GET_TABLE_MAPPING: "_system/frontend/getTableMapping",
  GET_TABLE_SIZE: "_system/frontend/tableSize:default",
  PAGINATED_TABLE_DOCUMENTS: "_system/frontend/paginatedTableDocuments:default",
  PROJECT_INFO: "_system/project:info",
  DEPLOYMENT_STATE: "_system/frontend/deploymentState:deploymentState",
  DEPLOYMENT_INFO: "_system/cli/deploymentInfo",
  CLOUD_URL: "_system/cli/convexUrl:cloudUrl",
} as const;

/**
 * System mutations for Convex internal operations
 */
export const SYSTEM_MUTATIONS = {
  CONFIRM_IMPORT: "_system/frontend/snapshotImport:confirm",
  GENERATE_UPLOAD_URL: "_system/frontend/fileStorageV2:generateUploadUrl",
  DELETE_FILES: "_system/frontend/fileStorageV2:deleteFiles",
} as const;
