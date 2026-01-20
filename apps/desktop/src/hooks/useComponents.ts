/**
 * useComponents Hook
 * Global hook for managing Convex component selection (multi-component apps)
 *
 * Usage:
 * - For single component selection: use selectedComponentId and setSelectedComponent
 * - For multi-select: use selectedComponents and setSelectedComponents
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import type { ConvexComponent } from "@/types/desktop";

/** Placeholder for root app in UI */
export const ROOT_APP_PLACEHOLDER = "_App";

/** Root app component (always present) */
const ROOT_APP_COMPONENT: ConvexComponent = {
  id: null,
  name: null,
  path: ROOT_APP_PLACEHOLDER,
  state: "active",
};

export interface UseComponentsOptions {
  /** Convex admin client */
  adminClient: any;
  /** Use mock data instead of real API calls */
  useMockData?: boolean;
  /** Enable multi-select mode (default: false) */
  multiSelect?: boolean;
}

export interface UseComponentsReturn {
  /** List of all components (including root app) */
  components: ConvexComponent[];
  /** List of component paths for display */
  componentNames: string[];
  /** Map from component path to ID */
  componentNameToId: Map<string, string | null>;
  /** The selected component ID for single-select mode (null = root app) */
  selectedComponentId: string | null;
  /** The selected component object */
  selectedComponent: ConvexComponent;
  /** Set selected component by ID (null = root app) - for single-select */
  setSelectedComponent: (componentId: string | null) => void;
  /** Selected component IDs for multi-select mode (or "all") */
  selectedComponents: (string | null)[] | "all";
  /** Set selected components for multi-select mode */
  setSelectedComponents: (components: (string | null)[] | "all") => void;
  /** Whether components are being loaded */
  isLoading: boolean;
  /** Refresh components list */
  refresh: () => Promise<void>;
}

export function useComponents({
  adminClient,
  useMockData = false,
  multiSelect: _multiSelect = false,
}: UseComponentsOptions): UseComponentsReturn {
  void _multiSelect; // Reserved for future use
  const [components, setComponents] = useState<ConvexComponent[]>([
    ROOT_APP_COMPONENT,
  ]);
  const [selectedComponentId, setSelectedComponentIdState] = useState<
    string | null
  >(null);
  const [selectedComponents, setSelectedComponentsState] = useState<
    (string | null)[] | "all"
  >("all");
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetch available components from Convex
   */
  const fetchComponents = useCallback(async () => {
    if (!adminClient && !useMockData) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      if (useMockData) {
        // Mock data: just the root app component
        setComponents([ROOT_APP_COMPONENT]);
        setIsLoading(false);
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
        if (!c.id || c.state !== "active") {
          continue;
        }

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
    } catch (err) {
      console.error("[useComponents] Failed to fetch components:", err);
      // Fallback to just root app
      setComponents([ROOT_APP_COMPONENT]);
    } finally {
      setIsLoading(false);
    }
  }, [adminClient, useMockData]);

  // Fetch components on mount and when dependencies change
  useEffect(() => {
    fetchComponents();
  }, [fetchComponents]);

  /**
   * Set selected component by ID (single-select mode)
   * Pass null to select root app
   */
  const setSelectedComponent = useCallback((componentId: string | null) => {
    setSelectedComponentIdState(componentId);
  }, []);

  /**
   * Set selected components (multi-select mode)
   */
  const setSelectedComponents = useCallback(
    (comps: (string | null)[] | "all") => {
      setSelectedComponentsState(comps);
    },
    [],
  );

  /**
   * Get the currently selected component object
   */
  const selectedComponent = useMemo(() => {
    return (
      components.find((c) => c.id === selectedComponentId) || ROOT_APP_COMPONENT
    );
  }, [components, selectedComponentId]);

  /**
   * Get component paths for display
   */
  const componentNames = useMemo(() => {
    return components.map((c) => c.path);
  }, [components]);

  /**
   * Map from component path to ID
   */
  const componentNameToId = useMemo(() => {
    const map = new Map<string, string | null>();
    components.forEach((c) => {
      map.set(c.path, c.id);
    });
    return map;
  }, [components]);

  return {
    components,
    componentNames,
    componentNameToId,
    selectedComponentId,
    selectedComponent,
    setSelectedComponent,
    selectedComponents,
    setSelectedComponents,
    isLoading,
    refresh: fetchComponents,
  };
}

export default useComponents;
