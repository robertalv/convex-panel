/**
 * useSchema Hook
 * Fetches and parses Convex schema data with indexes and relationships.
 * Uses React Query for caching with 5-minute stale time.
 */

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SchemaJSON, ParsedSchema } from "../types";
import { parseSchema } from "../utils/schema-parser";
import { STALE_TIME } from "@/contexts/query-context";
import { useDeployment } from "@/contexts/deployment-context";

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
 * Transform shapes2 API format to the format expected by the schema parser.
 *
 * shapes2 format:
 * {
 *   type: "Object",
 *   fields: [
 *     {fieldName: "name", optional: false, shape: {type: "String"}}
 *   ]
 * }
 *
 * Parser expected format:
 * {
 *   type: "object",
 *   value: {
 *     name: {fieldType: {type: "string"}, optional: false}
 *   }
 * }
 */
function transformShapes2ToSchemaFormat(shape: any): any {
  if (!shape || typeof shape !== "object") {
    return shape;
  }

  // Handle Object type
  if (shape.type === "Object" && Array.isArray(shape.fields)) {
    const value: Record<string, any> = {};

    for (const field of shape.fields) {
      if (field.fieldName && field.shape) {
        value[field.fieldName] = {
          fieldType: transformShapeType(field.shape),
          optional: field.optional ?? false,
        };
      }
    }

    return {
      type: "object",
      value,
    };
  }

  // Handle Array type
  if (shape.type === "Array" && shape.shape) {
    return {
      type: "array",
      value: transformShapeType(shape.shape),
    };
  }

  // Handle Union type
  if (shape.type === "Union" && Array.isArray(shape.shapes)) {
    return {
      type: "union",
      value: shape.shapes.map((s: any) => transformShapeType(s)),
    };
  }

  // Handle Literal type
  if (shape.type === "Literal") {
    return {
      type: "literal",
      value: shape.value,
    };
  }

  // Handle primitive types
  return transformShapeType(shape);
}

/**
 * Transform a shape type from shapes2 format to parser format
 */
function transformShapeType(shape: any): any {
  if (!shape || typeof shape !== "object") {
    return shape;
  }

  const typeMap: Record<string, string> = {
    String: "string",
    Float64: "number",
    Int64: "bigint",
    Boolean: "boolean",
    Bytes: "bytes",
    Null: "null",
    Any: "any",
    Id: "id",
    Object: "object",
    Array: "array",
    Union: "union",
    Literal: "literal",
    Record: "record",
  };

  const mappedType = typeMap[shape.type] || shape.type.toLowerCase();

  // Handle Id type with tableName
  if (shape.type === "Id" && shape.tableName) {
    return {
      type: "id",
      tableName: shape.tableName,
    };
  }

  // Handle Array type
  if (shape.type === "Array" && shape.shape) {
    return {
      type: "array",
      value: transformShapeType(shape.shape),
    };
  }

  // Handle Object type (nested)
  if (shape.type === "Object" && Array.isArray(shape.fields)) {
    const value: Record<string, any> = {};

    for (const field of shape.fields) {
      if (field.fieldName && field.shape) {
        value[field.fieldName] = {
          fieldType: transformShapeType(field.shape),
          optional: field.optional ?? false,
        };
      }
    }

    return {
      type: "object",
      value,
    };
  }

  // Handle Union type
  if (shape.type === "Union" && Array.isArray(shape.shapes)) {
    return {
      type: "union",
      value: shape.shapes.map((s: any) => transformShapeType(s)),
    };
  }

  // Handle Literal type
  if (shape.type === "Literal") {
    return {
      type: "literal",
      value: shape.value,
    };
  }

  // Handle Record type
  if (shape.type === "Record" && shape.keys && shape.values) {
    return {
      type: "record",
      keys: transformShapeType(shape.keys),
      values: transformShapeType(shape.values),
    };
  }

  // Default: just lowercase the type
  return {
    type: mappedType,
  };
}

// Query key factory for consistent key management
export const schemaKeys = {
  all: ["schema"] as const,
  detail: (componentId: string | null, convexUrl: string) =>
    [...schemaKeys.all, componentId ?? "root", convexUrl] as const,
};

/**
 * Hook to fetch and parse Convex schema with full index information.
 * Uses React Query for caching - schema data is cached for 5 minutes.
 *
 * This hook uses the same approach as the Data view:
 * 1. Fetches table names from _system/frontend/getTableMapping
 * 2. Fetches actual schema shapes from /api/shapes2
 */
export function useSchema({
  adminClient,
  componentId = null,
}: UseSchemaOptions): UseSchemaReturn {
  const queryClient = useQueryClient();
  const { deploymentUrl, accessToken } = useDeployment();

  const normalizedComponentId =
    componentId === "app" || componentId === null ? null : componentId;

  const enabled = Boolean(adminClient && deploymentUrl && accessToken);

  const query = useQuery({
    queryKey: schemaKeys.detail(normalizedComponentId, deploymentUrl ?? ""),
    queryFn: async (): Promise<{
      schema: ParsedSchema;
      schemaJSON: SchemaJSON;
    }> => {
      if (!adminClient || !deploymentUrl || !accessToken) {
        throw new Error(
          "Missing admin client, deployment URL, or access token",
        );
      }

      // Step 1: Get table names from table mapping
      let tableNames: string[] = [];
      try {
        const mappingResult = await adminClient
          .query("_system/frontend/getTableMapping" as any, {
            componentId: normalizedComponentId,
          })
          .catch(() => null);

        if (mappingResult && typeof mappingResult === "object") {
          let mapping = mappingResult;
          if ("value" in mappingResult) {
            mapping = mappingResult.value;
          }
          if (mapping && typeof mapping === "object") {
            tableNames = Object.values(
              mapping as Record<string, string>,
            ).filter(
              (name) => name !== "_scheduled_jobs" && name !== "_file_storage",
            );
          }
        }
      } catch (err) {
        console.warn("[useSchema] Failed to get table mapping:", err);
      }

      // Step 2: Fetch shapes data via HTTP endpoint
      let shapesData: Record<string, any> = {};
      try {
        const response = await fetch(`${deploymentUrl}/api/shapes2`, {
          headers: {
            authorization: `Convex ${accessToken}`,
            "convex-client": "desktop-app-0.0.0",
          },
        });

        if (response.ok) {
          shapesData = await response.json();
          console.log("[useSchema] Shapes API response:", shapesData);
        } else {
          console.warn(
            "[useSchema] Shapes API returned non-OK status:",
            response.status,
          );
        }
      } catch (err) {
        console.warn("[useSchema] Failed to fetch shapes:", err);
      }

      // Step 3: Build schema JSON from shapes data
      // Transform shapes2 format to the format expected by the parser
      const tables: any[] = [];

      if (tableNames.length > 0) {
        // Use table names from mapping
        for (const tableName of tableNames) {
          if (shapesData[tableName]) {
            const transformedShape = transformShapes2ToSchemaFormat(
              shapesData[tableName],
            );
            console.log(
              `[useSchema] Transformed shape for ${tableName}:`,
              transformedShape,
            );
            tables.push({
              tableName,
              documentType: transformedShape,
              indexes: [],
              searchIndexes: [],
              vectorIndexes: [],
            });
          }
        }
      } else {
        // Fallback: use all tables from shapes data
        for (const [tableName, shape] of Object.entries(shapesData)) {
          if (
            !tableName.startsWith("_scheduled") &&
            !tableName.startsWith("_file")
          ) {
            const transformedShape = transformShapes2ToSchemaFormat(shape);
            tables.push({
              tableName,
              documentType: transformedShape,
              indexes: [],
              searchIndexes: [],
              vectorIndexes: [],
            });
          }
        }
      }

      console.log("[useSchema] Built schema JSON:", { tables });

      const schemaJSON: SchemaJSON = {
        tables,
        schemaValidation: tables.length > 0,
      };

      const visualizationSchema = parseSchema(schemaJSON);

      return { schema: visualizationSchema, schemaJSON };
    },
    enabled,
    staleTime: STALE_TIME.schemas,
    refetchOnMount: false,
  });

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: schemaKeys.detail(normalizedComponentId, deploymentUrl ?? ""),
    });
  }, [queryClient, normalizedComponentId, deploymentUrl]);

  return {
    schema: query.data?.schema ?? null,
    schemaJson: query.data?.schemaJSON ?? null,
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch,
  };
}

export default useSchema;
