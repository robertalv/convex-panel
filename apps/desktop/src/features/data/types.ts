/**
 * Data View Types
 * Types for the desktop data browser feature
 */

import type React from "react";

// ============================================
// Table & Schema Types
// ============================================

export interface TableField {
  fieldName: string;
  optional: boolean;
  shape: {
    type: string;
    fields?: TableField[];
    tableName?: string;
    value?: any;
    float64Range?: {
      hasSpecialValues: boolean;
    };
    shape?: {
      type: string;
      tableName?: string;
      value?: any;
      fields?: TableField[];
    };
  };
}

export interface TableSchema {
  type: string;
  fields: TableField[];
}

export interface TableDefinition {
  [key: string]: TableSchema;
}

export interface TableDocument {
  _id: string;
  _creationTime?: number;
  [key: string]: any;
}

export interface RecentlyViewedTable {
  name: string;
  timestamp: number;
}

// ============================================
// Filter Types
// ============================================

export interface FilterClause {
  id: string;
  field: string;
  op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "isType" | "isNotType";
  value: any;
  enabled: boolean;
}

// Index filter types for indexed queries
export type IndexFilterType = "indexEq" | "indexRange";

export interface IndexFilterClause {
  type: IndexFilterType;
  enabled: boolean;
  value?: any;
  // For equality filters
  op?: "eq" | "neq" | "gt" | "gte" | "lt" | "lte";
  // For range filters
  lowerOp?: "gt" | "gte";
  lowerValue?: any;
  upperOp?: "lt" | "lte";
  upperValue?: any;
}

export interface IndexFilter {
  name: string;
  clauses: IndexFilterClause[];
}

export interface SearchIndexFilterClause {
  field: string;
  op?: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "isType" | "isNotType";
  enabled: boolean;
  value?: any;
}

export interface SearchIndexFilter {
  name: string;
  search: string;
  clauses: SearchIndexFilterClause[];
}

export interface FilterExpression {
  clauses: FilterClause[];
  order?: SortDirection;
  index?: IndexFilter | SearchIndexFilter;
}

// ============================================
// Sort Types
// ============================================

export type SortDirection = "asc" | "desc";

export interface SortConfig {
  field: string;
  direction: SortDirection;
}

// ============================================
// Pagination Types
// ============================================

export interface PaginationOptions {
  cursor: string | null;
  numItems: number;
  id?: number;
}

export interface PageArgs {
  paginationOpts: PaginationOptions;
  table: string;
  filters: string | null;
  componentId?: string | null;
}

// ============================================
// View Types
// ============================================

export type DataViewMode = "table" | "list" | "json" | "raw";

// ============================================
// Hook Types
// ============================================

export interface UseTableDataProps {
  convexUrl: string;
  accessToken: string;
  adminClient: any;
  onError?: (error: string) => void;
  useMockData?: boolean;
  componentId?: string | null;
}

export interface UseTableDataReturn {
  tables: TableDefinition;
  selectedTable: string;
  setSelectedTable: (tableName: string) => void;
  documents: TableDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<TableDocument[]>>;
  isLoading: boolean;
  error: string | null;
  documentCount: number;
  continueCursor: string | null;
  hasMore: boolean;
  isLoadingMore: boolean;
  fetchTableData: (tableName: string, cursor: string | null) => Promise<void>;
  fetchTables: () => Promise<void>;
  patchDocumentFields: (
    table: string,
    ids: string[],
    fields: Record<string, any>,
  ) => Promise<any>;
  deleteDocuments: (table: string, ids: string[]) => Promise<void>;
  addDocument: (table: string, document: Record<string, any>) => Promise<any>;
  filters: FilterExpression;
  setFilters: React.Dispatch<React.SetStateAction<FilterExpression>>;
  sortConfig: SortConfig | null;
  setSortConfig: React.Dispatch<React.SetStateAction<SortConfig | null>>;
  observerTarget: (node: HTMLDivElement | null) => void;
  refreshData: () => Promise<void>;
}

// ============================================
// Component Types (for multi-component apps)
// ============================================

/**
 * Represents a Convex component (for multi-component apps).
 * The root app has id: null, name: null, and path: "_App"
 */
export interface ConvexComponent {
  /** The actual component ID for API calls (null = root app) */
  id: string | null;
  /** Component name if available */
  name: string | null;
  /** Display path (e.g., "_App", "betterAuth") */
  path: string;
  /** Component state */
  state?: "active" | "unmounted";
}

/** Placeholder for root app in UI */
export const ROOT_APP_PLACEHOLDER = "_App";

export interface UseComponentsProps {
  adminClient: any;
  useMockData?: boolean;
}

export interface UseComponentsReturn {
  /** List of all components (including root app) */
  components: ConvexComponent[];
  /** @deprecated Use selectedComponentId instead */
  componentNames: string[];
  /** The selected component ID (null = root app) */
  selectedComponentId: string | null;
  /** The selected component object (null if not found) */
  selectedComponent: ConvexComponent | null;
  /** Set selected component by ID (null = root app) */
  setSelectedComponent: (componentId: string | null) => void;
  isLoading: boolean;
}

// ============================================
// Component Types
// ============================================

export interface ColumnMeta {
  typeLabel: string;
  optional: boolean;
  linkTable?: string;
}

export interface IndexDefinition {
  name: string;
  fields: string[];
  type: "db" | "search" | "vector";
  staged?: boolean;
}

// Full index type from Convex API
export interface Index {
  table?: string;
  name: string;
  staged?: boolean;
  fields:
    | string[] // Database index
    | { searchField: string; filterFields: string[] } // Search index
    | { vectorField: string; filterFields: string[]; dimensions: number }; // Vector index
  backfill: {
    state: "backfilling" | "backfilled" | "done";
    stats?: { numDocsIndexed: number; totalDocs: number | null };
  };
}

// Default index constants
export const DEFAULT_INDEX = "by_creation_time" as const;
export const BY_ID_INDEX = "by_id" as const;

/**
 * Create a default filter expression with the by_creation_time index
 * This matches the Convex dashboard behavior where the default index is always shown
 */
export function createDefaultFilterExpression(): FilterExpression {
  return {
    clauses: [],
    order: "desc",
    index: {
      name: DEFAULT_INDEX,
      clauses: [
        {
          type: "indexRange",
          enabled: false,
          lowerOp: "gte",
          lowerValue: new Date().getTime(),
        },
      ],
    },
  };
}

// Index option for UI selection
export interface IndexOption {
  value:
    | string
    | { name: string; fields: string[]; type: "database" | "search" };
  label: string;
}

// ============================================
// Export Types
// ============================================

export type ExportFormat = "json" | "csv";

export interface ExportOptions {
  format: ExportFormat;
  includeAll: boolean; // true = full table, false = current query results
  fileName?: string;
}
