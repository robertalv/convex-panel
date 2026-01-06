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
