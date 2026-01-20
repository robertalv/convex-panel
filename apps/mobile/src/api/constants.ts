export const CONVEX_DASHBOARD_DOMAIN = "dashboard.convex.dev";
export const BIG_BRAIN_URL = "https://api.convex.dev";
export const BIG_BRAIN_DASHBOARD_PATH = "/api/dashboard";

export const ROUTES = {
  STREAM_UDF_EXECUTION: "/api/stream_udf_execution",
  CACHE_HIT_RATE: "/api/app_metrics/cache_hit_percentage_top_k",
  FAILURE_RATE: "/api/app_metrics/failure_percentage_top_k",
  SCHEDULED_JOB_LAG: "/api/app_metrics/scheduled_job_lag",
  LATENCY_PERCENTILES: "/api/app_metrics/latency_percentiles",
  UDF_RATE: "/api/app_metrics/udf_rate",
  QUERY: "/api/query",
  MUTATION: "/api/mutation",
} as const;

export const SYSTEM_QUERIES = {
  LAST_PUSH_EVENT: "_system/frontend/deploymentEvents:lastPushEvent",
  GET_VERSION: "_system/frontend/getVersion:default",
  DEPLOYMENT_STATE: "_system/frontend/deploymentState:deploymentState",
};

export const DATABRICKS_QUERY_IDS = {
  INSIGHTS: "9ab3b74e-a725-480b-88a6-43e6bd70bd82",
} as const;

export const ROOT_COMPONENT_PATH = "-root-component-";
export const CONVEX_CLIENT_ID = "convex-panel-mobile-1.0.0";
