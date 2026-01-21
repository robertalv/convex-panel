/**
 * useComponents Hook
 * Manages component selection for multi-component Convex apps
 *
 * Uses React Query for:
 * - Automatic caching
 * - Consistent state management
 */

import { useState, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  UseComponentsProps,
  UseComponentsReturn,
  ConvexComponent,
} from "../types";
import { ROOT_APP_PLACEHOLDER } from "../types";
import { STALE_TIME } from "@/contexts/query-context";

/** Root app component (always present) */
const ROOT_APP_COMPONENT: ConvexComponent = {
  id: null,
  name: null,
  path: ROOT_APP_PLACEHOLDER,
  state: "active",
};

// Query key factory for components
export const componentsQueryKeys = {
  all: ["components"] as const,
  list: (clientId: string | undefined) =>
    [...componentsQueryKeys.all, "list", clientId ?? "none"] as const,
};

/**
 * Fetch components from admin client
 */
async function fetchComponentsData(
  adminClient: any,
  useMockData: boolean,
): Promise<ConvexComponent[]> {
  if (useMockData) {
    // Mock data: just the root app component
    return [ROOT_APP_COMPONENT];
  }

  if (!adminClient) {
    return [ROOT_APP_COMPONENT];
  }

  try {
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

    return componentList;
  } catch (err) {
    console.error("Failed to fetch components:", err);
    // Fallback to just root app
    return [ROOT_APP_COMPONENT];
  }
}

export function useComponents({
  adminClient,
  useMockData = false,
}: UseComponentsProps): UseComponentsReturn {
  const queryClient = useQueryClient();

  // Local state for selected component (not cached in query)
  const [selectedComponentId, setSelectedComponentIdState] = useState<
    string | null
  >(null);

  // Generate a stable client ID for query key
  const clientId = adminClient?._id ?? adminClient?.address ?? "default";

  const query = useQuery({
    queryKey: componentsQueryKeys.list(clientId),
    queryFn: () => fetchComponentsData(adminClient, useMockData),
    enabled: Boolean(adminClient || useMockData),
    staleTime: STALE_TIME.components,
    // Don't refetch on mount if we have cached data
    refetchOnMount: false,
    // Always return at least the root component
    placeholderData: [ROOT_APP_COMPONENT],
  });

  const components = query.data ?? [ROOT_APP_COMPONENT];

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

  /**
   * Refetch components
   */
  const refetch = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: componentsQueryKeys.list(clientId),
    });
  }, [queryClient, clientId]);

  return {
    components,
    componentNames,
    selectedComponentId,
    selectedComponent,
    setSelectedComponent,
    isLoading: query.isLoading,
    refetch,
  };
}
