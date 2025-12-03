import { useState, useEffect, useMemo } from 'react';
import type { ComponentInfo } from '../../../types/components';
import { fetchMultipleNpmDownloads } from '../utils/npm';

interface UseNpmDownloadsOptions {
  components: ComponentInfo[];
  enabled?: boolean;
}

interface UseNpmDownloadsResult {
  downloads: Map<string, number>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch npm package downloads for components
 * Caches results to avoid unnecessary API calls
 */
export function useNpmDownloads({
  components,
  enabled = true,
}: UseNpmDownloadsOptions): UseNpmDownloadsResult {
  const [downloads, setDownloads] = useState<Map<string, number>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Extract unique npm packages from components
  const npmPackages = useMemo(() => {
    const packages = new Set<string>();
    components.forEach((component) => {
      if (component.npmPackage) {
        packages.add(component.npmPackage);
      }
    });
    return Array.from(packages);
  }, [components]);

  useEffect(() => {
    if (!enabled || npmPackages.length === 0) {
      return;
    }

    // Check if we already have downloads cached (in sessionStorage)
    const cachedDownloads = new Map<string, number>();
    const cacheKey = 'npm-downloads-cache';
    const cacheTimeKey = 'npm-downloads-cache-time';
    const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

    try {
      const cached = sessionStorage.getItem(cacheKey);
      const cacheTime = sessionStorage.getItem(cacheTimeKey);
      
      if (cached && cacheTime) {
        const age = Date.now() - parseInt(cacheTime, 10);
        if (age < CACHE_DURATION) {
          const parsed = JSON.parse(cached);
          Object.entries(parsed).forEach(([pkg, downloads]) => {
            cachedDownloads.set(pkg, downloads as number);
          });
          
          // Check if we have all packages cached
          const allCached = npmPackages.every((pkg) => cachedDownloads.has(pkg));
          if (allCached) {
            setDownloads(cachedDownloads);
            return; // Use cached data
          }
        }
      }
    } catch (err) {
      console.warn('Failed to read npm downloads cache:', err);
    }

    // Fetch downloads for packages not in cache
    const packagesToFetch = npmPackages.filter((pkg) => !cachedDownloads.has(pkg));
    
    if (packagesToFetch.length === 0) {
      setDownloads(cachedDownloads);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetchMultipleNpmDownloads(packagesToFetch)
      .then((results) => {
        // Merge cached and new downloads
        const merged = new Map(cachedDownloads);
        
        results.forEach((info, pkg) => {
          if (info.weeklyDownloads !== undefined) {
            merged.set(pkg, info.weeklyDownloads);
          }
        });

        // Update cache
        try {
          const cacheObject: Record<string, number> = {};
          merged.forEach((downloads, pkg) => {
            cacheObject[pkg] = downloads;
          });
          sessionStorage.setItem(cacheKey, JSON.stringify(cacheObject));
          sessionStorage.setItem(cacheTimeKey, Date.now().toString());
        } catch (err) {
          console.warn('Failed to cache npm downloads:', err);
        }

        setDownloads(merged);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch npm downloads:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsLoading(false);
        
        // Use cached data even if fresh fetch failed
        if (cachedDownloads.size > 0) {
          setDownloads(cachedDownloads);
        }
      });
  }, [npmPackages, enabled]);

  return { downloads, isLoading, error };
}
