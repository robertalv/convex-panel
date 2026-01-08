/**
 * useSchema Hook
 * Fetches and parses Convex schema data with indexes and relationships.
 * Uses React Query for caching with 5-minute stale time.
 */

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SchemaJSON, ParsedSchema } from "@convex-panel/shared";
import { parseSchema } from "../utils/schema-parser";
import { STALE_TIME } from "@/contexts/QueryContext";

interface UseSchemaOptions {
  adminClient: any | null;
  componentId?: string | null;
}

interface UseSchemaReturn {
  schema: ParsedSchema | null;
  schemaJson: SchemaJSON | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Query key factory for consistent key management
export const schemaKeys = {
  all: ["schema"] as const,
  detail: (componentId: string | null) =>
    [...schemaKeys.all, componentId ?? "root"] as const,
};

/**
 * Hook to fetch and parse Convex schema with full index information.
 * Uses React Query for caching - schema data is cached for 5 minutes.
 */
export function useSchema({
  adminClient,
  componentId = null,
}: UseSchemaOptions): UseSchemaReturn {
  const queryClient = useQueryClient();

  const normalizedComponentId =
    componentId === "app" || componentId === null ? null : componentId;

  const enabled = Boolean(adminClient);

  const query = useQuery({
    queryKey: schemaKeys.detail(normalizedComponentId),
    queryFn: async (): Promise<{
      schema: ParsedSchema;
      schemaJson: SchemaJSON;
    }> => {
      if (!adminClient) {
        throw new Error("No admin client available");
      }

      // Fetch schema using the Convex system query
      const schemas = await adminClient.query(
        "_system/frontend/getSchemas:default" as any,
        { componentId: normalizedComponentId },
      );

      if (schemas?.active) {
        const parsed = JSON.parse(schemas.active) as SchemaJSON;
        const visualizationSchema = parseSchema(parsed);
        return { schema: visualizationSchema, schemaJson: parsed };
      } else {
        // No active schema - create empty schema
        const emptySchema: SchemaJSON = {
          tables: [],
          schemaValidation: false,
        };
        return { schema: parseSchema(emptySchema), schemaJson: emptySchema };
      }
    },
    enabled,
    staleTime: STALE_TIME.schemas,
    refetchOnMount: false,
  });

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: schemaKeys.detail(normalizedComponentId),
    });
  }, [queryClient, normalizedComponentId]);

  return {
    schema: query.data?.schema ?? null,
    schemaJson: query.data?.schemaJson ?? null,
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch,
  };
}

export default useSchema;
