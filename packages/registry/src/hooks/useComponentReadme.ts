/**
 * useComponentReadme Hook
 *
 * React hook for fetching and caching README content for components.
 */

import { useState, useEffect, useCallback } from "react";
import type { RegistryComponent } from "../types";
import { fetchComponentReadme } from "../services/readme-fetcher";
import {
  getCachedReadme,
  setCachedReadme,
  clearCachedReadme,
} from "../services/readme-cache";

export interface UseComponentReadmeResult {
  /** README markdown content */
  readme: string | null;
  /** Source of the README (github or npm) */
  source: "github" | "npm" | null;
  /** Whether the README is currently being fetched */
  isLoading: boolean;
  /** Error message if fetching failed */
  error: string | null;
  /** Function to refetch the README */
  refetch: () => Promise<void>;
  /** Function to clear the cached README and refetch */
  clearCacheAndRefetch: () => Promise<void>;
}

/**
 * Hook to fetch and cache README for a component
 */
export function useComponentReadme(
  component: RegistryComponent | null,
  options: { enabled?: boolean } = {},
): UseComponentReadmeResult {
  const { enabled = true } = options;

  const [readme, setReadme] = useState<string | null>(null);
  const [source, setSource] = useState<"github" | "npm" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReadme = useCallback(async () => {
    if (!component || !enabled) {
      return;
    }

    // Check cache first (include repoUrl and npmPackage for cache invalidation)
    const cached = getCachedReadme(
      component.id,
      component.repoUrl,
      component.npmPackage,
    );
    if (cached) {
      setReadme(cached.content);
      setSource(cached.source);
      setError(null);
      return;
    }

    // Fetch from API
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchComponentReadme(component);
      setReadme(result.content);
      setSource(result.source);
      
      // Cache the result (include repoUrl and npmPackage)
      setCachedReadme(
        component.id,
        result.content,
        result.source,
        component.repoUrl,
        component.npmPackage,
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch README";
      setError(errorMessage);
      setReadme(null);
      setSource(null);
    } finally {
      setIsLoading(false);
    }
  }, [component, enabled]);

  const clearCacheAndRefetch = useCallback(async () => {
    if (!component) {
      return;
    }

    clearCachedReadme(component.id, component.repoUrl, component.npmPackage);
    await fetchReadme();
  }, [component, fetchReadme]);

  // Fetch on mount or when component changes
  // Include repoUrl in dependencies to refetch when repository URL changes
  useEffect(() => {
    if (!component || !enabled) {
      setReadme(null);
      setSource(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    fetchReadme();
  }, [component?.id, component?.repoUrl, component?.npmPackage, enabled, fetchReadme]);

  return {
    readme,
    source,
    isLoading,
    error,
    refetch: fetchReadme,
    clearCacheAndRefetch,
  };
}
