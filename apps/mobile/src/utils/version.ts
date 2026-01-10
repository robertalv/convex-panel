/**
 * Version and Git Commit Utilities
 * 
 * Provides version number and git commit hash for display
 */

// Version from package.json
export const APP_VERSION = '0.1.0';

// Git commit hash - can be injected at build time via environment variable
// For development, we'll try to read it from process.env or return 'unknown'
export const GIT_COMMIT_HASH = 
  (process.env.EXPO_PUBLIC_GIT_COMMIT_HASH as string | undefined) || 
  'unknown';

// Git repo URL - can be injected at build time
export const GIT_REPO_URL = 
  (process.env.EXPO_PUBLIC_GIT_REPO_URL as string | undefined) || 
  '';

