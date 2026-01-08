/**
 * Data Prefetching Utilities
 * Provides functions to prefetch data before components mount.
 * Uses the shared queryClient for cache management.
 */

import { queryClient, STALE_TIME } from "@/contexts/QueryContext";
import { tableDataKeys } from "../hooks/useTableData";
import { getActiveTable } from "../utils/storage";
import { createDefaultFilterExpression } from "@convex-panel/shared";
import type {
  TableDefinition,
  TableDocument,
  FilterExpression,
} from "@convex-panel/shared";

const PAGE_SIZE = 50;

// System query names
const SYSTEM_QUERIES = {
  GET_TABLE_MAPPING: "_system/frontend/getTableMapping",
  PAGINATED_TABLE_DOCUMENTS: "_system/frontend/paginatedTableDocuments:default",
};

/**
 * Prefetch tables data for a deployment
 * Call this during login transition to warm the cache
 */
export async function prefetchTables(
  adminClient: any,
  convexUrl: string,
  accessToken: string,
  componentId: string | null = null,
): Promise<TableDefinition> {
  const normalizedComponentId =
    componentId === "app" || componentId === null ? null : componentId;

  const queryKey = tableDataKeys.tables(normalizedComponentId, convexUrl);

  // Check if we already have cached data
  const cachedData = queryClient.getQueryData<TableDefinition>(queryKey);
  if (cachedData && Object.keys(cachedData).length > 0) {
    return cachedData;
  }

  // Fetch and cache tables
  const tables = await queryClient.fetchQuery({
    queryKey,
    queryFn: async () => {
      if (!adminClient) {
        return {};
      }

      let tableNames: string[] = [];

      try {
        const mappingResult = await adminClient
          .query(SYSTEM_QUERIES.GET_TABLE_MAPPING as any, {
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
        console.warn("Failed to get table mapping:", err);
      }

      let shapesData: Record<string, any> = {};

      if (convexUrl && accessToken) {
        try {
          const response = await fetch(`${convexUrl}/api/shapes2`, {
            headers: {
              authorization: `Convex ${accessToken}`,
              "convex-client": "dashboard-0.0.0",
            },
          });

          if (response.ok) {
            shapesData = await response.json();
          }
        } catch (err) {
          console.warn("Failed to fetch shapes:", err);
        }
      }

      const tableSchemas: TableDefinition = {};

      if (tableNames.length > 0) {
        for (const tableName of tableNames) {
          if (shapesData[tableName]) {
            tableSchemas[tableName] = shapesData[tableName];
          } else {
            tableSchemas[tableName] = { type: "Object", fields: [] };
          }
        }
      } else {
        for (const [tableName, schema] of Object.entries(shapesData)) {
          tableSchemas[tableName] = schema as any;
        }
      }

      if (Object.keys(tableSchemas).length === 0 && shapesData) {
        for (const [tableName, schema] of Object.entries(shapesData)) {
          if (
            !tableName.startsWith("_scheduled") &&
            !tableName.startsWith("_file")
          ) {
            tableSchemas[tableName] = schema as any;
          }
        }
      }

      return tableSchemas;
    },
    staleTime: STALE_TIME.tables,
  });

  return tables;
}

/**
 * Prefetch documents for the active table
 * Call this during login transition to warm the cache
 */
export async function prefetchDocuments(
  adminClient: any,
  tableName: string,
  componentId: string | null = null,
  filters: FilterExpression = createDefaultFilterExpression(),
): Promise<TableDocument[]> {
  const normalizedComponentId =
    componentId === "app" || componentId === null ? null : componentId;

  const queryKey = tableDataKeys.documents(
    tableName,
    normalizedComponentId,
    filters,
  );

  // Check if we already have cached data
  const cachedData = queryClient.getQueryData(queryKey);
  if (cachedData) {
    return (cachedData as any)?.pages?.flatMap((p: any) => p.documents) ?? [];
  }

  // Fetch and cache documents
  const result = await queryClient.fetchQuery({
    queryKey,
    queryFn: async () => {
      if (!adminClient || !tableName) {
        return { pages: [], pageParams: [] };
      }

      const enabledFilters = filters.clauses.filter((c) => c.enabled);

      const filterExpression: {
        clauses: typeof enabledFilters;
        order?: "asc" | "desc";
        index?: typeof filters.index;
      } = {
        clauses: enabledFilters,
      };

      if (filters.order) {
        filterExpression.order = filters.order;
      }

      if (filters.index) {
        const enabledIndexClauses = filters.index.clauses.filter(
          (c) => c.enabled,
        );
        if (
          enabledIndexClauses.length > 0 ||
          ("search" in filters.index && filters.index.search)
        ) {
          filterExpression.index = filters.index;
        }
      }

      const hasFilters =
        enabledFilters.length > 0 ||
        filterExpression.order ||
        filterExpression.index;
      const filterString = hasFilters
        ? btoa(JSON.stringify(filterExpression))
        : null;

      const queryResult = await adminClient.query(
        SYSTEM_QUERIES.PAGINATED_TABLE_DOCUMENTS as any,
        {
          table: tableName,
          componentId: normalizedComponentId,
          filters: filterString,
          paginationOpts: {
            numItems: PAGE_SIZE,
            cursor: null,
            id: Date.now(),
          },
        },
      );

      let data = queryResult;
      if (
        queryResult &&
        typeof queryResult === "object" &&
        "value" in queryResult
      ) {
        data = queryResult.value;
      }

      // Format as infinite query data
      return {
        pages: [
          {
            documents: data?.page || [],
            continueCursor: data?.continueCursor || null,
            isDone: data?.isDone ?? true,
          },
        ],
        pageParams: [null],
      };
    },
    staleTime: STALE_TIME.documents,
  });

  return (result as any)?.pages?.flatMap((p: any) => p.documents) ?? [];
}

/**
 * Prefetch all initial data needed for the data view
 * Call this during login transition
 */
export async function prefetchInitialData(
  adminClient: any,
  convexUrl: string,
  accessToken: string,
  componentId: string | null = null,
): Promise<{ tables: TableDefinition; documents: TableDocument[] }> {
  try {
    // First fetch tables
    const tables = await prefetchTables(
      adminClient,
      convexUrl,
      accessToken,
      componentId,
    );

    // Then fetch documents for the active or first table
    const savedTable = getActiveTable();
    const tableNames = Object.keys(tables);
    const tableToFetch =
      savedTable && tables[savedTable] ? savedTable : tableNames[0];

    let documents: TableDocument[] = [];

    if (tableToFetch) {
      documents = await prefetchDocuments(
        adminClient,
        tableToFetch,
        componentId,
      );
    }

    return { tables, documents };
  } catch (err) {
    console.warn("Failed to prefetch data:", err);
    return { tables: {}, documents: [] };
  }
}
