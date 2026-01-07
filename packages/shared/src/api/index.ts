/**
 * Shared API module
 * Re-exports all API functions and types for use across packages
 */

// Export all types
export * from "./types";

// Export constants
export * from "./constants";

// Export helper functions
export {
  normalizeToken,
  callConvexQuery,
  callConvexMutation,
  serializeDate,
  parseDate,
  extractDeploymentName,
} from "./helpers";

// Export metrics functions
export {
  fetchFailureRate,
  fetchCacheHitRate,
  fetchSchedulerLag,
  fetchTableRate,
  fetchUdfExecutionStats,
  aggregateFunctionStats,
  fetchLatencyPercentiles,
  fetchUdfRate,
  fetchRecentErrors,
} from "./metrics";

// Export health functions
export {
  fetchLastPushEvent,
  fetchServerVersion,
  fetchInsights,
} from "./health";

// Export function discovery utilities
export {
  fetchFunctionSpec,
  fetchComponents,
  fetchSourceCode,
  discoverFunctions,
  groupFunctionsByPath,
  filterFunctionsByType,
  findFunctionByIdentifier,
  type ModuleFunction,
  type FunctionGroup,
  type UdfType,
} from "./functions";

// Export BigBrain API functions and types
export {
  // Core API functions
  callBigBrainAPI,
  callBigBrainManagementAPI,
  // Team & Project functions
  getTeams,
  getProjects,
  getDeployments,
  getProfile,
  getTeamSubscription,
  // Token & Auth functions
  getTokenDetails,
  getTeamFromDeployment,
  createDeployKey,
  // Usage & Insights functions
  getInsightsPeriod,
  queryUsage,
  // Constants
  BIG_BRAIN_URL,
  BIG_BRAIN_DASHBOARD_PATH,
  CONVEX_CLIENT_ID,
  DATABRICKS_QUERY_IDS,
  ROOT_COMPONENT_PATH,
  // Utilities
  extractDeploymentName as extractDeploymentNameFromUrl,
  normalizeBearerToken,
  // Types
  type Team,
  type Project,
  type Deployment,
  type UserProfile,
  type TeamSubscription,
  type TokenDetails,
  type TeamAndProject,
  type UsageQueryParams,
  type InsightsPeriod,
} from "./bigbrain";
