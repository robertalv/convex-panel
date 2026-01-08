import { useState, useEffect, useMemo } from 'react';
import type { ComponentInfo } from '../../../types/components';
import { fetchMultipleNpmPackagesComplete, type NpmPackageExtendedInfo } from "../utils/npm";

interface UseNpmPackageDataOptions {
  components: ComponentInfo[];
  enabled?: boolean;
}

interface UseNpmPackageDataResult {
  packageData: Map<string, NpmPackageExtendedInfo>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch npm package data (downloads and extended info) for components
 * Caches results to avoid unnecessary API calls
 */
export function useNpmPackageData({
  components,
  enabled = true,
}: UseNpmPackageDataOptions): UseNpmPackageDataResult {
  const [packageData, setPackageData] = useState<Map<string, NpmPackageExtendedInfo>>(new Map());
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

    // Check if we already have package data cached (in sessionStorage)
    const cachedPackageData = new Map<string, NpmPackageExtendedInfo>();
    const cacheKey = 'npm-package-data-cache';
    const cacheTimeKey = 'npm-package-data-cache-time';
    const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

    try {
      const cached = sessionStorage.getItem(cacheKey);
      const cacheTime = sessionStorage.getItem(cacheTimeKey);
      
      if (cached && cacheTime) {
        const age = Date.now() - parseInt(cacheTime, 10);
        if (age < CACHE_DURATION) {
          const parsed = JSON.parse(cached);
          Object.entries(parsed).forEach(([pkg, data]) => {
            cachedPackageData.set(pkg, data as NpmPackageExtendedInfo);
          });
          
          // Check if we have all packages cached
          const allCached = npmPackages.every((pkg) => cachedPackageData.has(pkg));
          if (allCached) {
            setPackageData(cachedPackageData);
            return; // Use cached data
          }
        }
      }
    } catch (err) {
      console.warn('Failed to read npm package data cache:', err);
    }

    // Fetch data for packages not in cache
    const packagesToFetch = npmPackages.filter((pkg) => !cachedPackageData.has(pkg));
    
    if (packagesToFetch.length === 0) {
      setPackageData(cachedPackageData);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetchMultipleNpmPackagesComplete(packagesToFetch)
      .then((results) => {
        // Merge cached and new data
        const merged = new Map(cachedPackageData);
        
        results.forEach((info, pkg) => {
          merged.set(pkg, info);
        });

        // Update cache
        try {
          const cacheObject: Record<string, NpmPackageExtendedInfo> = {};
          merged.forEach((data, pkg) => {
            cacheObject[pkg] = data;
          });
          sessionStorage.setItem(cacheKey, JSON.stringify(cacheObject));
          sessionStorage.setItem(cacheTimeKey, Date.now().toString());
        } catch (err) {
          console.warn('Failed to cache npm package data:', err);
        }

        setPackageData(merged);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch npm package data:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsLoading(false);
        
        // Use cached data even if fresh fetch failed
        if (cachedPackageData.size > 0) {
          setPackageData(cachedPackageData);
        }
      });
  }, [npmPackages, enabled]);

  return { packageData, isLoading, error };
}

// Legacy export for backward compatibility
export function useNpmDownloads({
  components,
  enabled = true,
}: UseNpmPackageDataOptions) {
  const { packageData, isLoading, error } = useNpmPackageData({ components, enabled });
  
  // Convert to old format for backward compatibility
  const downloads = new Map<string, number>();
  packageData.forEach((data, pkg) => {
    downloads.set(pkg, data.weeklyDownloads || data.downloads || 0);
  });
  
  return { downloads, isLoading, error };
}
