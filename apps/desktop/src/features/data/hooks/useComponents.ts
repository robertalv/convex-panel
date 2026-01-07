/**
 * useComponents Hook
 * Manages component selection for multi-component Convex apps
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import type { UseComponentsProps, UseComponentsReturn } from "../types";

export function useComponents({
  adminClient,
  useMockData = false,
}: UseComponentsProps): UseComponentsReturn {
  const [componentNames, setComponentNames] = useState<string[]>([]);
  const [selectedComponent, setSelectedComponentState] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Fetch available components
   */
  const fetchComponents = useCallback(async () => {
    if (!adminClient && !useMockData) return;

    setIsLoading(true);

    try {
      if (useMockData) {
        // Mock data: just the app component
        setComponentNames(["app"]);
        setSelectedComponentState("app");
        return;
      }

      // Fetch components from admin client
      // Note: This endpoint may not exist in all Convex versions
      const result = await adminClient
        .query("_system/frontend/components:list" as any, {})
        .catch(() => []);

      const components: Array<{ name: string; path: string }> = result || [];

      // Extract unique component names, add "app" for root
      const names = [
        "app",
        ...components.map((c) => c.name || c.path).filter(Boolean),
      ];
      const uniqueNames = Array.from(new Set(names));

      setComponentNames(uniqueNames);

      // Select "app" (root) by default
      if (!selectedComponent && uniqueNames.length > 0) {
        setSelectedComponentState("app");
      }
    } catch (err) {
      console.error("Failed to fetch components:", err);
      // Fallback to just app
      setComponentNames(["app"]);
      setSelectedComponentState("app");
    } finally {
      setIsLoading(false);
    }
  }, [adminClient, useMockData, selectedComponent]);

  // Fetch components on mount
  useEffect(() => {
    fetchComponents();
  }, [fetchComponents]);

  /**
   * Set selected component with normalization
   */
  const setSelectedComponent = useCallback((component: string | null) => {
    setSelectedComponentState(component);
  }, []);

  /**
   * Get the component ID to pass to API calls
   * Returns null for "app" (root component)
   */
  const selectedComponentId = useMemo(() => {
    if (!selectedComponent || selectedComponent === "app") {
      return null;
    }
    return selectedComponent;
  }, [selectedComponent]);

  return {
    componentNames,
    selectedComponentId,
    selectedComponent,
    setSelectedComponent,
    isLoading,
  };
}
