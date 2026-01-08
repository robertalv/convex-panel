import { useState, useEffect } from 'react';
import { fetchProfile } from "../utils/api";
import type { ProfileResponse } from "../utils/api";

/**
 * Hook to fetch and cache user profile information
 */
export function useProfile(accessToken?: string | null): {
  profile: ProfileResponse | null;
  isLoading: boolean;
  error: Error | null;
} {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setProfile(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const profileData = await fetchProfile(accessToken, true);
        if (isMounted) {
          setProfile(profileData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  return { profile, isLoading, error };
}

