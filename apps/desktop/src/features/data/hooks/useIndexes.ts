/**
 * useIndexes Hook
 * Fetches and manages available indexes for a table
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { Index } from "../types";

interface UseIndexesProps {
  adminClient: any;
  tableName: string;
  componentId?: string | null;
  enabled?: boolean;
}

interface UseIndexesReturn {
  indexes: Index[] | undefined;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// System query for fetching indexes
const INDEXES_QUERY = "_system/frontend/indexes:default";

export function useIndexes({
  adminClient,
  tableName,
  componentId = null,
  enabled = true,
}: UseIndexesProps): UseIndexesReturn {
  const [indexes, setIndexes] = useState<Index[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache to prevent duplicate fetches
  const cacheRef = useRef<Map<string, { indexes: Index[]; timestamp: number }>>(
    new Map(),
  );
  const CACHE_TTL = 30000; // 30 seconds

  // Normalize component ID
  const normalizedComponentId =
    componentId === "app" || componentId === null ? null : componentId;

  const fetchIndexes = useCallback(async () => {
    if (!adminClient || !tableName || !enabled) {
      return;
    }

    // Check cache
    const cacheKey = `${tableName}|${normalizedComponentId || "null"}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setIndexes(cached.indexes);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await adminClient.query(INDEXES_QUERY as any, {
        tableName,
        tableNamespace: normalizedComponentId,
      });

      // Handle potential wrapper format
      let indexData: Index[] = result;
      if (result && typeof result === "object" && "value" in result) {
        indexData = result.value;
      }

      // Ensure we have an array
      if (!Array.isArray(indexData)) {
        indexData = [];
      }

      // Filter out system indexes (they're added as default options in UI)
      const userIndexes = indexData.filter(
        (idx) => idx.name !== "by_id" && idx.name !== "by_creation_time",
      );

      // Cache the result
      cacheRef.current.set(cacheKey, {
        indexes: userIndexes,
        timestamp: Date.now(),
      });

      setIndexes(userIndexes);
    } catch (err) {
      console.warn("Failed to fetch indexes:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch indexes");
      // Set empty array on error so UI can still function
      setIndexes([]);
    } finally {
      setIsLoading(false);
    }
  }, [adminClient, tableName, normalizedComponentId, enabled]);

  // Fetch indexes when table changes
  useEffect(() => {
    fetchIndexes();
  }, [fetchIndexes]);

  // Clear indexes when table changes
  useEffect(() => {
    setIndexes(undefined);
  }, [tableName]);

  return {
    indexes,
    isLoading,
    error,
    refetch: fetchIndexes,
  };
}

/**
 * Helper to check if an index is a search index
 */
export function isSearchIndex(index: Index): boolean {
  return (
    typeof index.fields === "object" &&
    !Array.isArray(index.fields) &&
    "searchField" in index.fields
  );
}

/**
 * Helper to check if an index is a vector index
 */
export function isVectorIndex(index: Index): boolean {
  return (
    typeof index.fields === "object" &&
    !Array.isArray(index.fields) &&
    "vectorField" in index.fields
  );
}

/**
 * Helper to check if an index is a database index
 */
export function isDatabaseIndex(index: Index): boolean {
  return Array.isArray(index.fields);
}

/**
 * Get the field names for an index
 */
export function getIndexFields(index: Index): string[] {
  if (Array.isArray(index.fields)) {
    return index.fields;
  }
  if ("searchField" in index.fields) {
    return [index.fields.searchField, ...index.fields.filterFields];
  }
  if ("vectorField" in index.fields) {
    return [index.fields.vectorField, ...index.fields.filterFields];
  }
  return [];
}
