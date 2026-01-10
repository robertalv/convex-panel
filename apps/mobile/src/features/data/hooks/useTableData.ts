/**
 * React Query hooks for data browser
 */

import {
  useQuery,
  useInfiniteQuery,
  type UseQueryResult,
  type UseInfiniteQueryResult,
  type InfiniteData,
} from "@tanstack/react-query";
import { fetchTables, fetchDocuments } from "../../../api/data";
import type {
  TableDefinition,
  TableDocument,
  FilterExpression,
  SortConfig,
} from "../types";
import { cacheDocuments } from "../utils/storage";

/**
 * Query keys factory for data browser
 */
export const dataQueryKeys = {
  all: ["data"] as const,
  tables: (deploymentUrl: string) =>
    [...dataQueryKeys.all, "tables", deploymentUrl] as const,
  documents: (deploymentUrl: string, tableName: string) =>
    [...dataQueryKeys.all, "documents", deploymentUrl, tableName] as const,
  documentsWithFilters: (
    deploymentUrl: string,
    tableName: string,
    filters: FilterExpression[],
    sort: SortConfig | null,
  ) =>
    [
      ...dataQueryKeys.documents(deploymentUrl, tableName),
      { filters, sort },
    ] as const,
};

/**
 * Hook to fetch table list
 * Filters out system tables (starting with _)
 */
export function useTables(
  deploymentUrl: string | null,
  accessToken?: string,
): UseQueryResult<Array<{ name: string; schema: any }>, Error> {
  return useQuery({
    queryKey: dataQueryKeys.tables(deploymentUrl || ""),
    queryFn: async () => {
      if (!deploymentUrl) {
        throw new Error("No deployment selected");
      }

      const tables = await fetchTables(deploymentUrl, accessToken);

      // Convert TableDefinition object to array and filter system tables
      const tableArray = Object.entries(tables)
        .filter(([name]) => !name.startsWith("_"))
        .map(([name, schema]) => ({ name, schema }));

      return tableArray;
    },
    enabled: !!deploymentUrl,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch documents with infinite scroll pagination
 */
export function useDocuments(
  deploymentUrl: string | null,
  tableName: string | null,
  filters: FilterExpression[] = [],
  sort: SortConfig | null = null,
  pageSize: number = 50,
  accessToken?: string,
): UseInfiniteQueryResult<
  {
    page: TableDocument[];
    continueCursor: string | null;
    hasMore: boolean;
  },
  Error
> {
  return useInfiniteQuery({
    queryKey: dataQueryKeys.documentsWithFilters(
      deploymentUrl || "",
      tableName || "",
      filters,
      sort,
    ),
    queryFn: async ({ pageParam }) => {
      if (!deploymentUrl || !tableName) {
        throw new Error("No deployment or table selected");
      }

      const result = await fetchDocuments(
        deploymentUrl,
        tableName,
        pageSize,
        pageParam as string | undefined,
        filters,
        sort,
        accessToken,
      );

      // Cache documents for offline viewing
      if (result.page.length > 0) {
        await cacheDocuments(tableName, result.page);
      }

      return result;
    },
    enabled: !!deploymentUrl && !!tableName,
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.continueCursor : undefined;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Helper to get all documents from infinite query
 */
export function getAllDocuments(data: any): TableDocument[] {
  if (!data || !data.pages) return [];

  return data.pages.flatMap((page: any) => page.page);
}

/**
 * Sort documents client-side based on sort config
 */
export function sortDocuments(
  documents: TableDocument[],
  sortConfig: SortConfig | null,
): TableDocument[] {
  if (!sortConfig) return documents;

  return [...documents].sort((a, b) => {
    const aValue = a[sortConfig.field];
    const bValue = b[sortConfig.field];

    // Handle null/undefined (sort to end)
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    // String comparison
    if (typeof aValue === "string" && typeof bValue === "string") {
      const comparison = aValue.localeCompare(bValue);
      return sortConfig.direction === "asc" ? comparison : -comparison;
    }

    // Number comparison
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
    }

    // BigInt comparison
    if (typeof aValue === "bigint" && typeof bValue === "bigint") {
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortConfig.direction === "asc" ? comparison : -comparison;
    }

    // Boolean comparison (false < true)
    if (typeof aValue === "boolean" && typeof bValue === "boolean") {
      const comparison = aValue === bValue ? 0 : aValue ? 1 : -1;
      return sortConfig.direction === "asc" ? comparison : -comparison;
    }

    // Default: convert to string and compare
    const aStr = String(aValue);
    const bStr = String(bValue);
    const comparison = aStr.localeCompare(bStr);
    return sortConfig.direction === "asc" ? comparison : -comparison;
  });
}

/**
 * Helper to check if there are more documents to load
 */
export function hasMoreDocuments(data: any): boolean {
  if (!data || !data.pages || data.pages.length === 0) return false;

  const lastPage = data.pages[data.pages.length - 1];
  return lastPage.hasMore;
}
