/**
 * Data Browser Types
 * Types for the mobile data browser feature
 */

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
  };
}

export interface TableSchema {
  type: string;
  fields: TableField[];
}

export interface TableDefinition {
  [tableName: string]: TableSchema;
}

export interface TableDocument {
  _id: string;
  _creationTime?: number;
  [key: string]: any;
}

export interface TableInfo {
  name: string;
  schema: TableSchema;
  documentCount?: number;
}

// ============================================
// Filter Types
// ============================================

export type FilterOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte";

export interface FilterClause {
  id: string;
  field: string;
  op: FilterOperator;
  value: any;
  enabled: boolean;
}

export interface FilterExpression {
  clauses: FilterClause[];
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
// View Types
// ============================================

export type DataViewMode = "list" | "table";

// ============================================
// API Response Types
// ============================================

export interface PaginatedDocumentsResponse {
  page: TableDocument[];
  hasMore: boolean;
  continueCursor: string | null;
}

export interface TableMappingResponse {
  tables: TableDefinition;
}

// ============================================
// Storage Types
// ============================================

export interface CachedTableData {
  documents: TableDocument[];
  timestamp: number;
  cursor: string | null;
}

export interface DataBrowserPreferences {
  selectedTable: string | null;
  viewMode: DataViewMode;
  filters: FilterExpression;
  sortConfig: SortConfig | null;
}
