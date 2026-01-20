/**
 * GitHub Service
 *
 * Unified export for all GitHub-related functionality.
 */

// Types
export * from "./types";

// Authentication
export {
  getDeviceId,
  initiateDeviceFlow,
  pollForToken,
  storeToken,
  getStoredToken,
  deleteToken,
  storeUser,
  getStoredUser,
  fetchGitHubUser,
  revokeToken,
  completeDeviceFlow,
  checkAuth,
  logout,
} from "./auth";

// API
export {
  getInstallUrl,
  listInstallations,
  listAppRepos,
  listUserRepos,
  getFileContent,
  getFileCommits,
  findSchemaFiles,
  listBranches,
  getCommit,
  compareCommits,
} from "./api";

// SSE
export {
  SSEClient,
  getSSEClient,
  destroySSEClient,
  type SSEConnectionState,
  type SSEClientOptions,
} from "./sse";

// Storage (per-project settings)
export {
  getProjectGitHubSettings,
  saveProjectGitHubSettings,
  clearProjectGitHubSettings,
  cleanupStaleSettings,
  hasProjectGitHubSettings,
  type ProjectGitHubSettings,
} from "./storage";
