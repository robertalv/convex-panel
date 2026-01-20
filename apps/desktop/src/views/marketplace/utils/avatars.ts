/**
 * Avatar utilities for component authors
 * 
 * Provides default avatars and helper functions for resolving author avatars
 */

/**
 * Default Convex organization avatar
 * GitHub user ID: 81530787 (get-convex organization)
 */
export const DEFAULT_CONVEX_AVATAR =
  "https://avatars.githubusercontent.com/u/81530787";

/**
 * Get the default avatar URL for a component author
 * 
 * @param authorName - Author's display name
 * @param githubUsername - Author's GitHub username
 * @returns Default avatar URL or null
 */
export function getDefaultAvatar(
  authorName?: string,
  githubUsername?: string,
): string | null {
  // Default to Convex avatar for Convex organization
  if (
    authorName?.toLowerCase() === "convex" ||
    githubUsername?.toLowerCase() === "get-convex"
  ) {
    return DEFAULT_CONVEX_AVATAR;
  }

  return null;
}

/**
 * Resolve author avatar URL with fallback logic
 * 
 * Priority:
 * 1. Explicitly provided avatar
 * 2. Default avatar (e.g., Convex)
 * 3. GitHub avatar (fetched from GitHub API)
 * 4. null (will show fallback icon)
 * 
 * @param avatar - Explicitly provided avatar URL
 * @param authorName - Author's display name
 * @param githubUsername - Author's GitHub username
 * @param githubAvatar - GitHub avatar URL (from useGitHubAvatar hook)
 * @returns Resolved avatar URL or null
 */
export function resolveAuthorAvatar(
  avatar?: string,
  authorName?: string,
  githubUsername?: string,
  githubAvatar?: string | null,
): string | null {
  // 1. Use explicitly provided avatar
  if (avatar) {
    return avatar;
  }

  // 2. Use default avatar (e.g., Convex)
  const defaultAvatar = getDefaultAvatar(authorName, githubUsername);
  if (defaultAvatar) {
    return defaultAvatar;
  }

  // 3. Use GitHub avatar
  if (githubAvatar) {
    return githubAvatar;
  }

  // 4. No avatar available
  return null;
}
