/**
 * README Cache Service
 *
 * Manages caching of README content in sessionStorage.
 */

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedReadme {
  content: string;
  source: "github" | "npm";
  timestamp: number;
}

/**
 * Get cache key for a component's README
 * Includes repoUrl and npmPackage to invalidate cache when these change
 */
function getCacheKey(componentId: string, repoUrl?: string, npmPackage?: string): string {
  // Include repoUrl and npmPackage in cache key to invalidate when they change
  const urlHash = repoUrl ? `:${repoUrl}` : "";
  const pkgHash = npmPackage ? `:${npmPackage}` : "";
  return `readme-cache:${componentId}${urlHash}${pkgHash}`;
}

/**
 * Get cached README for a component
 */
export function getCachedReadme(
  componentId: string,
  repoUrl?: string,
  npmPackage?: string,
): { content: string; source: "github" | "npm" } | null {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return null;
  }

  try {
    const cacheKey = getCacheKey(componentId, repoUrl, npmPackage);
    const cached = sessionStorage.getItem(cacheKey);

    if (!cached) {
      return null;
    }

    const data: CachedReadme = JSON.parse(cached);
    const age = Date.now() - data.timestamp;

    // Check if cache is still valid
    if (age > CACHE_DURATION_MS) {
      // Cache expired, remove it
      sessionStorage.removeItem(cacheKey);
      return null;
    }

    return {
      content: data.content,
      source: data.source,
    };
  } catch (error) {
    console.warn(`Failed to get cached README for ${componentId}:`, error);
    // If cache is corrupted, remove it
    try {
      sessionStorage.removeItem(getCacheKey(componentId, repoUrl, npmPackage));
    } catch {
      // Ignore cleanup errors
    }
    return null;
  }
}

/**
 * Set cached README for a component
 */
export function setCachedReadme(
  componentId: string,
  content: string,
  source: "github" | "npm",
  repoUrl?: string,
  npmPackage?: string,
): void {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return;
  }

  try {
    const cacheKey = getCacheKey(componentId, repoUrl, npmPackage);
    const data: CachedReadme = {
      content,
      source,
      timestamp: Date.now(),
    };

    sessionStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (error) {
    // If storage is full or unavailable, just log a warning
    console.warn(`Failed to cache README for ${componentId}:`, error);
  }
}

/**
 * Clear cached README for a specific component
 */
export function clearCachedReadme(
  componentId: string,
  repoUrl?: string,
  npmPackage?: string,
): void {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return;
  }

  try {
    // Clear the specific cache entry
    sessionStorage.removeItem(getCacheKey(componentId, repoUrl, npmPackage));
    
    // Also clear any old cache entries for this component (without repoUrl/npmPackage)
    // This handles migration from old cache format
    const oldKey = `readme-cache:${componentId}`;
    sessionStorage.removeItem(oldKey);
  } catch (error) {
    console.warn(`Failed to clear cached README for ${componentId}:`, error);
  }
}

/**
 * Clear all cached READMEs
 */
export function clearAllCachedReadmes(): void {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return;
  }

  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith("readme-cache:")) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
  } catch (error) {
    console.warn("Failed to clear all cached READMEs:", error);
  }
}

/**
 * Get cache age for a component's README (in milliseconds)
 * Returns null if not cached
 */
export function getCacheAge(
  componentId: string,
  repoUrl?: string,
  npmPackage?: string,
): number | null {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return null;
  }

  try {
    const cacheKey = getCacheKey(componentId, repoUrl, npmPackage);
    const cached = sessionStorage.getItem(cacheKey);

    if (!cached) {
      return null;
    }

    const data: CachedReadme = JSON.parse(cached);
    return Date.now() - data.timestamp;
  } catch {
    return null;
  }
}
