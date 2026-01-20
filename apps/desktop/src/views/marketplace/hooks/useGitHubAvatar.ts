/**
 * Hook to fetch GitHub user avatar from username
 * 
 * GitHub API: https://api.github.com/users/{username}
 * Returns avatar URL or null if not found
 */

import { useState, useEffect } from "react";

/**
 * Get GitHub avatar URL from username
 */
export function useGitHubAvatar(
  githubUsername?: string,
): string | null {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!githubUsername) {
      setAvatarUrl(null);
      return;
    }

    // Try to fetch from GitHub API
    const fetchAvatar = async () => {
      try {
        const response = await fetch(
          `https://api.github.com/users/${githubUsername}`,
        );

        if (!response.ok) {
          // If API fails, fallback to GitHub's avatar CDN
          // Format: https://github.com/{username}.png
          setAvatarUrl(`https://github.com/${githubUsername}.png`);
          return;
        }

        const data = await response.json();
        if (data.avatar_url) {
          setAvatarUrl(data.avatar_url);
        } else {
          // Fallback to GitHub's avatar CDN
          setAvatarUrl(`https://github.com/${githubUsername}.png`);
        }
      } catch (error) {
        // On error, use GitHub's avatar CDN as fallback
        // This works even without API access
        setAvatarUrl(`https://github.com/${githubUsername}.png`);
      }
    };

    fetchAvatar();
  }, [githubUsername]);

  return avatarUrl;
}
