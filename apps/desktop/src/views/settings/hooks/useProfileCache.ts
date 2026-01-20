import { useRef, useCallback } from "react";
import type {
  ProfileEmail,
  Identity,
  DiscordAccount,
} from "@convex-panel/shared/api";

// Cache entry structure
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Cache store
interface ProfileCacheStore {
  profile: CacheEntry<{ name: string }> | null;
  emails: CacheEntry<ProfileEmail[]> | null;
  identities: CacheEntry<Identity[]> | null;
  discord: CacheEntry<DiscordAccount[]> | null;
}

// Global cache storage keyed by accessToken
const globalProfileCache = new Map<string, ProfileCacheStore>();

// Cache duration in milliseconds (5 minutes)
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Hook to manage caching of profile data
 * Prevents redundant API calls for the same data within TTL period
 */
export function useProfileCache(accessToken: string | null) {
  const cacheRef = useRef<ProfileCacheStore | null>(null);

  // Initialize or get cache for this access token
  const getCache = useCallback((): ProfileCacheStore => {
    if (!accessToken) {
      return { profile: null, emails: null, identities: null, discord: null };
    }

    if (!globalProfileCache.has(accessToken)) {
      globalProfileCache.set(accessToken, {
        profile: null,
        emails: null,
        identities: null,
        discord: null,
      });
    }

    const cache = globalProfileCache.get(accessToken)!;
    cacheRef.current = cache;
    return cache;
  }, [accessToken]);

  // Check if cache entry is still valid
  const isCacheValid = useCallback((entry: CacheEntry<any> | null): boolean => {
    if (!entry) return false;
    return Date.now() < entry.expiresAt;
  }, []);

  // Get cached data if available and valid
  const getCached = useCallback(
    <T>(key: keyof ProfileCacheStore): T | null => {
      const cache = getCache();
      const entry = cache[key] as CacheEntry<T> | null;

      if (isCacheValid(entry)) {
        console.log(`[ProfileCache] Cache hit for ${String(key)}`);
        return entry!.data;
      }

      return null;
    },
    [getCache, isCacheValid],
  );

  // Set cache data
  const setCached = useCallback(
    <T>(key: keyof ProfileCacheStore, data: T): void => {
      const cache = getCache();
      const now = Date.now();

      (cache[key] as CacheEntry<T> | null) = {
        data,
        timestamp: now,
        expiresAt: now + CACHE_TTL_MS,
      };

      console.log(
        `[ProfileCache] Cache set for ${String(key)}, expires in ${CACHE_TTL_MS}ms`,
      );
    },
    [getCache],
  );

  // Clear specific cache entry
  const clearCache = useCallback(
    (key: keyof ProfileCacheStore): void => {
      const cache = getCache();
      (cache[key] as null) = null;
      console.log(`[ProfileCache] Cache cleared for ${String(key)}`);
    },
    [getCache],
  );

  // Clear all cache for this token
  const clearAllCache = useCallback((): void => {
    if (accessToken) {
      globalProfileCache.delete(accessToken);
      cacheRef.current = null;
      console.log(`[ProfileCache] All cache cleared for token`);
    }
  }, [accessToken]);

  // Get cache stats for debugging
  const getCacheStats = useCallback((): Record<string, boolean> => {
    const cache = getCache();
    return {
      profile: isCacheValid(cache.profile),
      emails: isCacheValid(cache.emails),
      identities: isCacheValid(cache.identities),
      discord: isCacheValid(cache.discord),
    };
  }, [getCache, isCacheValid]);

  return {
    getCached,
    setCached,
    clearCache,
    clearAllCache,
    getCacheStats,
  };
}
