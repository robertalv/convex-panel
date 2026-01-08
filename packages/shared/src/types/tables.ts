/**
 * Table and data-related types
 */

import React from 'react';
import type { ConvexClient } from 'convex/browser';
import type { ConvexReactClient } from 'convex/react';
import type { ThemeClasses, ConvexPanelSettings, SortConfig } from './common';
import type { FilterExpression } from './filters';

export interface TableField {
  fieldName: string;
  optional: boolean;
  shape: {
    type: string;
    fields?: TableField[];
    tableName?: string;
    value?: any; // For union, literal, array element types
    float64Range?: {
      hasSpecialValues: boolean;
    };
    shape?: {
      type: string;
      tableName?: string;
      value?: any; // For nested union, literal types
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
  [key: string]: any;
  _initialEditMode?: boolean;
}

export interface PageArgs {
  paginationOpts: PaginationOptions;
  table: string;
  filters: string | null;
  componentId?: string | null;
}

export interface PaginationOptions {
  cursor: string | null;
  numItems: number;
  id?: number;
}

export interface RecentlyViewedTable {
  name: string;
  timestamp: number;
}

export interface DataTableProps {
  convexUrl: string;
  accessToken: string;
  onError?: (error: string) => void;
  theme?: ThemeClasses;
  baseUrl: string;
  convex: ConvexReactClient;
  adminClient: ConvexClient | null;
  settings?: ConvexPanelSettings;
  useMockData?: boolean;
}

export interface DataTableSidebarProps {
  tables: TableDefinition;
  selectedTable: string;
  searchText: string;
  onSearchChange: (text: string) => void;
  onTableSelect: (tableName: string) => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  theme?: any;
  recentlyViewedTables?: RecentlyViewedTable[];
}

export interface DataTableContentProps {
  documents: TableDocument[];
  columnHeaders: string[];
  isLoading: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  observerTarget: (node: HTMLDivElement) => void;
  onFilterButtonClick: (e: React.MouseEvent, header: string) => void;
  filterMenuField: string | null;
  filterMenuPosition: { top: number; left: number } | null;
  handleFilterApply: (filter: any) => void;
  onFilterMenuClose: () => void;
  formatValue: (value: any, fieldName?: string) => string;
  activeFilters: FilterExpression;
  onUpdateDocument?: (params: { table: string, ids: string[], fields: Record<string, any> }) => Promise<void>;
  tableName?: string;
  selectedDocument: TableDocument | null;
  setSelectedDocument: (doc: TableDocument | null) => void;
  sortConfig?: SortConfig | null;
  onSort?: (field: string) => void;
  adminClient?: ConvexClient | null;
  setDocuments: React.Dispatch<React.SetStateAction<TableDocument[]>>;
}

export interface StorageDebugProps {
  visible?: boolean;
  selectedTable?: string;
  filters?: FilterExpression;
}

export interface UseTableDataProps {
  convexUrl: string;
  accessToken: string;
  adminClient: ConvexClient | null;
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
  patchDocumentFields: (table: string, ids: string[], fields: Record<string, any>) => Promise<any>;
  getTableFields: (tableName: string) => string[];
  getColumnHeaders: () => string[];
  formatValue: (value: any) => string;
  renderFieldType: (field: any) => string;
  observerTarget: (node: HTMLDivElement) => void;
  filters: FilterExpression;
  setFilters: React.Dispatch<React.SetStateAction<FilterExpression>>;
  sortConfig: SortConfig | null;
  setSortConfig: React.Dispatch<React.SetStateAction<SortConfig | null>>;
}

export interface FetchTablesOptions {
  convexUrl: string;
  accessToken: string;
  adminClient?: ConvexClient | null;
}

export interface FetchTablesResponse {
  tables: TableDefinition;
  selectedTable: string;
}

