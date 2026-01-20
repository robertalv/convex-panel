/**
 * useTableData Hook
 * Manages table data fetching, filtering, sorting, and mutations
 * Uses React Query for caching and background refetching
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import type {
  TableDefinition,
  TableDocument,
  FilterExpression,
  SortConfig,
  UseTableDataProps,
  UseTableDataReturn,
} from "../types";
import { createDefaultFilterExpression } from "../types";
import {
  saveActiveTable,
  getActiveTable,
  getTableFilters,
  saveTableFilters,
  getTableSortConfig,
  saveTableSortConfig,
  updateRecentlyViewedTable,
} from "../utils/storage";
import { STALE_TIME } from "@/contexts/query-context";

const PAGE_SIZE = 50;

// Default sort configuration: _creationTime descending (newest first)
const DEFAULT_SORT_CONFIG: SortConfig = {
  field: "_creationTime",
  direction: "desc",
};

// System query names
const SYSTEM_QUERIES = {
  GET_TABLE_MAPPING: "_system/frontend/getTableMapping",
  PAGINATED_TABLE_DOCUMENTS: "_system/frontend/paginatedTableDocuments:default",
  PATCH_DOCUMENTS_FIELDS: "_system/frontend/patchDocumentsFields:default",
  DELETE_DOCUMENTS: "_system/frontend/deleteDocuments:default",
  ADD_DOCUMENT: "_system/frontend/addDocument:default",
};

// Query key factory for consistent key management
export const tableDataKeys = {
  all: ["tableData"] as const,
  tables: (componentId: string | null, convexUrl: string) =>
    [...tableDataKeys.all, "tables", componentId ?? "root", convexUrl] as const,
  documents: (
    tableName: string,
    componentId: string | null,
    filters: FilterExpression,
  ) =>
    [
      ...tableDataKeys.all,
      "documents",
      tableName,
      componentId ?? "root",
      JSON.stringify(filters),
    ] as const,
};

/**
 * Fetch tables (schemas) from Convex
 */
async function fetchTablesData(
  adminClient: any,
  convexUrl: string,
  accessToken: string,
  componentId: string | null,
  useMockData: boolean,
): Promise<TableDefinition> {
  if (useMockData) {
    // Mock data for development
    return {
      users: {
        type: "Object",
        fields: [
          { fieldName: "name", optional: false, shape: { type: "String" } },
          { fieldName: "email", optional: false, shape: { type: "String" } },
          { fieldName: "createdAt", optional: true, shape: { type: "Number" } },
        ],
      },
      posts: {
        type: "Object",
        fields: [
          { fieldName: "title", optional: false, shape: { type: "String" } },
          { fieldName: "content", optional: false, shape: { type: "String" } },
          {
            fieldName: "authorId",
            optional: false,
            shape: { type: "Id", tableName: "users" },
          },
        ],
      },
    };
  }

  if (!adminClient) {
    return {};
  }

  // Try to get table names from table mapping first
  let tableNames: string[] = [];

  try {
    const mappingResult = await adminClient
      .query(SYSTEM_QUERIES.GET_TABLE_MAPPING as any, {
        componentId,
      })
      .catch(() => null);

    if (mappingResult && typeof mappingResult === "object") {
      let mapping = mappingResult;
      if ("value" in mappingResult) {
        mapping = mappingResult.value;
      }
      if (mapping && typeof mapping === "object") {
        tableNames = Object.values(mapping as Record<string, string>).filter(
          (name) => name !== "_scheduled_jobs" && name !== "_file_storage",
        );
      }
    }
  } catch (err) {
    console.warn("Failed to get table mapping:", err);
  }

  // Fetch shapes data via HTTP endpoint
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

  // Build table definitions
  const tableSchemas: TableDefinition = {};

  // If we got table names from mapping, filter shapes to those tables
  if (tableNames.length > 0) {
    for (const tableName of tableNames) {
      if (shapesData[tableName]) {
        tableSchemas[tableName] = shapesData[tableName];
      } else {
        tableSchemas[tableName] = { type: "Object", fields: [] };
      }
    }
  } else {
    // Use all tables from shapes data
    for (const [tableName, schema] of Object.entries(shapesData)) {
      tableSchemas[tableName] = schema as any;
    }
  }

  // If still no tables, try to get them from shapes data keys
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
}

/**
 * Fetch documents from a table with pagination
 */
async function fetchDocumentsPage(
  adminClient: any,
  tableName: string,
  componentId: string | null,
  filters: FilterExpression,
  cursor: string | null,
  useMockData: boolean,
): Promise<{
  documents: TableDocument[];
  continueCursor: string | null;
  isDone: boolean;
}> {
  if (useMockData) {
    const mockDocs: TableDocument[] = Array.from({ length: 10 }, (_, i) => ({
      _id: `mock_${tableName}_${i}_${Date.now()}`,
      _creationTime: Date.now() - i * 86400000,
      name: `Item ${i + 1}`,
      value: Math.random() * 100,
    }));
    return {
      documents: mockDocs,
      continueCursor: null,
      isDone: true,
    };
  }

  if (!adminClient || !tableName) {
    return { documents: [], continueCursor: null, isDone: true };
  }

  // Build filter string for API
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
    const enabledIndexClauses = filters.index.clauses.filter((c) => c.enabled);
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

  const result = await adminClient.query(
    SYSTEM_QUERIES.PAGINATED_TABLE_DOCUMENTS as any,
    {
      table: tableName,
      componentId,
      filters: filterString,
      paginationOpts: {
        numItems: PAGE_SIZE,
        cursor,
        id: Date.now(),
      },
    },
  );

  let data = result;
  if (result && typeof result === "object" && "value" in result) {
    data = result.value;
  }

  return {
    documents: data?.page || [],
    continueCursor: data?.continueCursor || null,
    isDone: data?.isDone ?? true,
  };
}

export function useTableData({
  convexUrl,
  accessToken,
  adminClient,
  onError,
  useMockData = false,
  componentId = null,
}: UseTableDataProps): UseTableDataReturn {
  const queryClient = useQueryClient();

  // Local state for UI
  const [selectedTable, setSelectedTableState] = useState<string>("");
  const [filters, setFilters] = useState<FilterExpression>(
    createDefaultFilterExpression,
  );
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(
    DEFAULT_SORT_CONFIG,
  );

  // Refs for intersection observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingMoreRef = useRef(false);

  // Normalize component ID
  const normalizedComponentId = useMemo(() => {
    if (componentId === "app" || componentId === null) return null;
    return componentId;
  }, [componentId]);

  // ============================================
  // Tables Query (with caching)
  // ============================================
  const tablesQuery = useQuery({
    queryKey: tableDataKeys.tables(normalizedComponentId, convexUrl),
    queryFn: () =>
      fetchTablesData(
        adminClient,
        convexUrl,
        accessToken,
        normalizedComponentId,
        useMockData,
      ),
    enabled: Boolean(adminClient || useMockData),
    staleTime: STALE_TIME.tables,
    // Don't refetch on mount if we have cached data
    refetchOnMount: false,
  });

  const tables = tablesQuery.data ?? {};

  // Auto-select table when tables are loaded
  useEffect(() => {
    if (tablesQuery.isSuccess && Object.keys(tables).length > 0) {
      const savedTable = getActiveTable();
      const tableToSelect =
        savedTable && tables[savedTable] ? savedTable : Object.keys(tables)[0];

      if (tableToSelect && !selectedTable) {
        setSelectedTable(tableToSelect);
      }
    }
  }, [tablesQuery.isSuccess, tables, selectedTable]);

  // ============================================
  // Documents Infinite Query (with caching)
  // ============================================
  const documentsQuery = useInfiniteQuery({
    queryKey: tableDataKeys.documents(
      selectedTable,
      normalizedComponentId,
      filters,
    ),
    queryFn: ({ pageParam }) =>
      fetchDocumentsPage(
        adminClient,
        selectedTable,
        normalizedComponentId,
        filters,
        pageParam,
        useMockData,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.isDone ? undefined : lastPage.continueCursor,
    enabled: Boolean(selectedTable && (adminClient || useMockData)),
    staleTime: STALE_TIME.documents,
    // Don't refetch on mount if we have cached data
    refetchOnMount: false,
  });

  // Flatten all pages into a single documents array
  const documents = useMemo(() => {
    return documentsQuery.data?.pages.flatMap((page) => page.documents) ?? [];
  }, [documentsQuery.data]);

  const documentCount = documents.length;
  const hasMore = documentsQuery.hasNextPage ?? false;
  const continueCursor =
    documentsQuery.data?.pages[documentsQuery.data.pages.length - 1]
      ?.continueCursor ?? null;

  // ============================================
  // Wrapper for setSelectedTable
  // ============================================
  const setSelectedTable = useCallback((tableName: string) => {
    setSelectedTableState(tableName);
    saveActiveTable(tableName);
    updateRecentlyViewedTable(tableName);

    // Load saved filters and sort for this table
    const savedFilters = getTableFilters(tableName);
    if (savedFilters) {
      if (!savedFilters.index) {
        const defaultFilters = createDefaultFilterExpression();
        setFilters({
          ...savedFilters,
          index: defaultFilters.index,
        });
      } else {
        setFilters(savedFilters);
      }
    } else {
      setFilters(createDefaultFilterExpression());
    }

    const savedSort = getTableSortConfig(tableName);
    setSortConfig(savedSort || DEFAULT_SORT_CONFIG);
  }, []);

  // Save filters when they change
  useEffect(() => {
    if (selectedTable) {
      saveTableFilters(selectedTable, filters);
    }
  }, [selectedTable, filters]);

  // Save sort config when it changes
  useEffect(() => {
    if (selectedTable) {
      saveTableSortConfig(selectedTable, sortConfig);
    }
  }, [selectedTable, sortConfig]);

  // ============================================
  // Mutations
  // ============================================
  const patchMutation = useMutation({
    mutationFn: async ({
      table,
      ids,
      fields,
    }: {
      table: string;
      ids: string[];
      fields: Record<string, any>;
    }) => {
      if (!adminClient) {
        throw new Error("Admin client not available");
      }
      return adminClient.mutation(
        SYSTEM_QUERIES.PATCH_DOCUMENTS_FIELDS as any,
        {
          table,
          ids,
          fields,
          componentId: normalizedComponentId,
        },
      );
    },
    onSuccess: (_, variables) => {
      // Optimistically update cached documents
      queryClient.setQueryData(
        tableDataKeys.documents(
          variables.table,
          normalizedComponentId,
          filters,
        ),
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              documents: page.documents.map((doc: TableDocument) =>
                variables.ids.includes(doc._id)
                  ? { ...doc, ...variables.fields }
                  : doc,
              ),
            })),
          };
        },
      );
    },
    onError: (err) => {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update document";
      onError?.(errorMessage);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ table, ids }: { table: string; ids: string[] }) => {
      if (!adminClient) {
        throw new Error("Admin client not available");
      }
      return adminClient.mutation(SYSTEM_QUERIES.DELETE_DOCUMENTS as any, {
        table,
        ids,
        componentId: normalizedComponentId,
      });
    },
    onSuccess: (_, variables) => {
      // Optimistically remove deleted documents from cache
      queryClient.setQueryData(
        tableDataKeys.documents(
          variables.table,
          normalizedComponentId,
          filters,
        ),
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              documents: page.documents.filter(
                (doc: TableDocument) => !variables.ids.includes(doc._id),
              ),
            })),
          };
        },
      );
    },
    onError: (err) => {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete documents";
      onError?.(errorMessage);
    },
  });

  const addMutation = useMutation({
    mutationFn: async ({
      table,
      document,
    }: {
      table: string;
      document: Record<string, any>;
    }) => {
      if (!adminClient) {
        throw new Error("Admin client not available");
      }
      return adminClient.mutation(SYSTEM_QUERIES.ADD_DOCUMENT as any, {
        table,
        documents: [document],
        componentId: normalizedComponentId,
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate the documents query to refetch with new document
      queryClient.invalidateQueries({
        queryKey: tableDataKeys.documents(
          variables.table,
          normalizedComponentId,
          filters,
        ),
      });
    },
    onError: (err) => {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add document";
      onError?.(errorMessage);
    },
  });

  // ============================================
  // Callback wrappers for API compatibility
  // ============================================
  const patchDocumentFields = useCallback(
    async (table: string, ids: string[], fields: Record<string, any>) => {
      return patchMutation.mutateAsync({ table, ids, fields });
    },
    [patchMutation],
  );

  const deleteDocuments = useCallback(
    async (table: string, ids: string[]) => {
      return deleteMutation.mutateAsync({ table, ids });
    },
    [deleteMutation],
  );

  const addDocument = useCallback(
    async (table: string, document: Record<string, any>) => {
      return addMutation.mutateAsync({ table, document });
    },
    [addMutation],
  );

  const fetchTables = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: tableDataKeys.tables(normalizedComponentId, convexUrl),
    });
  }, [queryClient, normalizedComponentId, convexUrl]);

  const fetchTableData = useCallback(
    async (tableName: string, cursor: string | null) => {
      if (cursor === null) {
        // Fresh fetch - invalidate and refetch
        await queryClient.invalidateQueries({
          queryKey: tableDataKeys.documents(
            tableName,
            normalizedComponentId,
            filters,
          ),
        });
      } else {
        // Load more - fetch next page
        await documentsQuery.fetchNextPage();
      }
    },
    [queryClient, normalizedComponentId, filters, documentsQuery],
  );

  const refreshData = useCallback(async () => {
    if (selectedTable) {
      await queryClient.invalidateQueries({
        queryKey: tableDataKeys.documents(
          selectedTable,
          normalizedComponentId,
          filters,
        ),
      });
    }
  }, [queryClient, selectedTable, normalizedComponentId, filters]);

  // ============================================
  // Intersection Observer for infinite scroll
  // ============================================
  const observerTarget = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (
        !node ||
        !hasMore ||
        documentsQuery.isFetchingNextPage ||
        loadingMoreRef.current
      )
        return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (
            entries[0]?.isIntersecting &&
            hasMore &&
            !loadingMoreRef.current &&
            !documentsQuery.isFetchingNextPage
          ) {
            loadingMoreRef.current = true;
            documentsQuery.fetchNextPage().finally(() => {
              loadingMoreRef.current = false;
            });
          }
        },
        { threshold: 0.1 },
      );

      observerRef.current.observe(node);
    },
    [hasMore, documentsQuery],
  );

  // ============================================
  // Error handling
  // ============================================
  useEffect(() => {
    if (tablesQuery.error) {
      const errorMessage =
        tablesQuery.error instanceof Error
          ? tablesQuery.error.message
          : "Failed to fetch tables";
      onError?.(errorMessage);
    }
    if (documentsQuery.error) {
      const errorMessage =
        documentsQuery.error instanceof Error
          ? documentsQuery.error.message
          : "Failed to fetch documents";
      onError?.(errorMessage);
    }
  }, [tablesQuery.error, documentsQuery.error, onError]);

  // Combine loading states
  const isLoading =
    tablesQuery.isLoading ||
    (documentsQuery.isLoading && !documentsQuery.isFetchingNextPage);
  const isLoadingMore = documentsQuery.isFetchingNextPage;
  const error =
    tablesQuery.error?.message ?? documentsQuery.error?.message ?? null;

  // Setter for documents (for optimistic updates)
  const setDocuments = useCallback(
    (updater: React.SetStateAction<TableDocument[]>) => {
      queryClient.setQueryData(
        tableDataKeys.documents(selectedTable, normalizedComponentId, filters),
        (oldData: any) => {
          if (!oldData) return oldData;
          const currentDocs =
            oldData.pages?.flatMap((p: any) => p.documents) ?? [];
          const newDocs =
            typeof updater === "function" ? updater(currentDocs) : updater;
          // Put all documents in a single page
          return {
            ...oldData,
            pages: [
              {
                documents: newDocs,
                continueCursor: null,
                isDone: true,
              },
            ],
            pageParams: [null],
          };
        },
      );
    },
    [queryClient, selectedTable, normalizedComponentId, filters],
  );

  return {
    tables,
    selectedTable,
    setSelectedTable,
    documents,
    setDocuments,
    isLoading,
    error,
    documentCount,
    continueCursor,
    hasMore,
    isLoadingMore,
    fetchTableData,
    fetchTables,
    patchDocumentFields,
    deleteDocuments,
    addDocument,
    filters,
    setFilters,
    sortConfig,
    setSortConfig,
    observerTarget,
    refreshData,
  };
}
