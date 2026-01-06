/**
 * useSchema Hook
 * Fetches and parses Convex schema data with indexes and relationships
 */

import { useState, useEffect, useCallback } from "react";
import type { SchemaJSON, ParsedSchema } from "../types";
import { parseSchema } from "../utils/schema-parser";

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

/**
 * Hook to fetch and parse Convex schema with full index information
 */
export function useSchema({
  adminClient,
  componentId = null,
}: UseSchemaOptions): UseSchemaReturn {
  const [schema, setSchema] = useState<ParsedSchema | null>(null);
  const [schemaJson, setSchemaJson] = useState<SchemaJSON | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchCount, setRefetchCount] = useState(0);

  const fetchSchema = useCallback(async () => {
    if (!adminClient) {
      setError("No admin client available");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const normalizedComponentId =
        componentId === "app" || componentId === null ? null : componentId;

      // Fetch schema using the Convex system query
      const schemas = await adminClient.query(
        "_system/frontend/getSchemas:default" as any,
        { componentId: normalizedComponentId },
      );

      if (schemas?.active) {
        const parsed = JSON.parse(schemas.active) as SchemaJSON;
        setSchemaJson(parsed);

        // Parse schema into visualization-ready format
        const visualizationSchema = parseSchema(parsed);
        setSchema(visualizationSchema);
      } else {
        // No active schema - create empty schema
        const emptySchema: SchemaJSON = {
          tables: [],
          schemaValidation: false,
        };
        setSchemaJson(emptySchema);
        setSchema(parseSchema(emptySchema));
      }
    } catch (err: any) {
      console.error("Error fetching schema:", err);
      setError(err?.message || "Failed to fetch schema");
      setSchema(null);
      setSchemaJson(null);
    } finally {
      setIsLoading(false);
    }
  }, [adminClient, componentId]);

  // Fetch schema when dependencies change
  useEffect(() => {
    fetchSchema();
  }, [fetchSchema, refetchCount]);

  const refetch = useCallback(() => {
    setRefetchCount((c) => c + 1);
  }, []);

  return {
    schema,
    schemaJson,
    isLoading,
    error,
    refetch,
  };
}

export default useSchema;
