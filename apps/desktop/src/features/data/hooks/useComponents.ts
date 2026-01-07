/**
 * useComponents Hook
 * Manages component selection for multi-component Convex apps
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  UseComponentsProps,
  UseComponentsReturn,
  ConvexComponent,
} from "../types";
import { ROOT_APP_PLACEHOLDER } from "../types";

/** Root app component (always present) */
const ROOT_APP_COMPONENT: ConvexComponent = {
  id: null,
  name: null,
  path: ROOT_APP_PLACEHOLDER,
  state: "active",
};

export function useComponents({
  adminClient,
  useMockData = false,
}: UseComponentsProps): UseComponentsReturn {
  const [components, setComponents] = useState<ConvexComponent[]>([
    ROOT_APP_COMPONENT,
  ]);
  const [selectedComponentId, setSelectedComponentIdState] = useState<
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
        // Mock data: just the root app component
        setComponents([ROOT_APP_COMPONENT]);
        setSelectedComponentIdState(null);
        return;
      }

      // Fetch components from admin client
      // Note: This endpoint may not exist in all Convex versions
      const result = await adminClient
        .query("_system/frontend/components:list" as any, {})
        .catch(() => []);

      const apiComponents: Array<{
        id: string;
        name: string | null;
        path: string;
        state?: string;
      }> = result || [];

      // Build components list with root app first
      const componentList: ConvexComponent[] = [ROOT_APP_COMPONENT];

      for (const c of apiComponents) {
        if (!c.id || c.state !== "active") continue;

        // Prefer human-readable name/path; skip components that only have a raw id
        const displayPath = c.name || c.path;
        if (!displayPath || displayPath === c.id) {
          continue;
        }

        componentList.push({
          id: c.id,
          name: c.name,
          path: displayPath,
          state: c.state as "active" | "unmounted",
        });
      }

      setComponents(componentList);

      // Select root app by default if nothing is selected
      if (selectedComponentId === null) {
        setSelectedComponentIdState(null);
      }
    } catch (err) {
      console.error("Failed to fetch components:", err);
      // Fallback to just root app
      setComponents([ROOT_APP_COMPONENT]);
      setSelectedComponentIdState(null);
    } finally {
      setIsLoading(false);
    }
  }, [adminClient, useMockData, selectedComponentId]);

  // Fetch components on mount
  useEffect(() => {
    fetchComponents();
  }, [fetchComponents]);

  /**
   * Set selected component by ID
   * Pass null to select root app
   */
  const setSelectedComponent = useCallback((componentId: string | null) => {
    setSelectedComponentIdState(componentId);
  }, []);

  /**
   * Get the currently selected component object
   */
  const selectedComponent = useMemo(() => {
    return (
      components.find((c) => c.id === selectedComponentId) || ROOT_APP_COMPONENT
    );
  }, [components, selectedComponentId]);

  /**
   * Get component names for backwards compatibility
   * @deprecated Use components array instead
   */
  const componentNames = useMemo(() => {
    return components.map((c) => c.path);
  }, [components]);

  return {
    components,
    componentNames,
    selectedComponentId,
    selectedComponent,
    setSelectedComponent,
    isLoading,
  };
}
