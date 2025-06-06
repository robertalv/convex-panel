import React, { ReactNode, FC } from "react";
import { LogType } from "../utils/constants";
import { ConvexReactClient } from "convex/react";
import { ConvexClient } from 'convex/browser';
import {
  DiffEditorProps,
  EditorProps,
} from "@monaco-editor/react";

/**
 * Logs
 */
// Convex log schema
export interface LogEntry {
  timestamp: number;
  topic: string;
  function?: {
    type?: string;
    path?: string; 
    cached?: boolean;
    request_id?: string;
  };
  log_level?: string;
  message?: string;
  execution_time_ms?: number;
  status?: string;
  error_message?: string;
  usage?: {
    database_read_bytes?: number;
    database_write_bytes?: number;
    file_storage_read_bytes?: number;
    file_storage_write_bytes?: number;
    vector_storage_read_bytes?: number;
    vector_storage_write_bytes?: number;
    action_memory_used_mb?: number;
  };
  system_code?: string;
  audit_log_action?: string;
  audit_log_metadata?: string;
  raw: any;
}

/**
 * Theme interface
 */
// Theme interface
export interface ThemeClasses {
  container?: string;
  header?: string;
  toolbar?: string;
  table?: string;
  tableHeader?: string;
  tableRow?: string;
  text?: string;
  button?: string;
  input?: string;
  successText?: string;
  errorText?: string;
  warningText?: string;
}

// Button position type
export type ButtonPosition = 'bottom-left' | 'bottom-center' | 'bottom-right' | 'right-center' | 'top-right';

/**
 * ConvexPanel component props
 */
// Button props
export type ButtonProps = {
  convexUrl?: string;
  initialLimit?: number;
  initialShowSuccess?: boolean;
  initialLogType?: LogType;
  onLogFetch?: (logs: LogEntry[]) => void;
  onError?: (error: string) => void;
  theme?: ThemeClasses | undefined;
  maxStoredLogs?: number;
  convex?: ConvexReactClient;
  deployKey: string;
  accessToken: string;
  deployUrl?: string;
  buttonPosition?: ButtonPosition;
  useMockData?: boolean;
}

/**
 * Container props
 */
// Logs container props
export interface ContainerProps {
  isOpen: boolean;
  toggleOpen: () => void;
  onToggle?: (isOpen: boolean) => void;
  initialLimit?: number;
  initialShowSuccess?: boolean;
  initialLogType?: LogType;
  onLogFetch?: (logs: LogEntry[]) => void;
  onError?: (error: string) => void;
  theme?: ThemeClasses;
  maxStoredLogs?: number;
  position: { x: number; y: number };
  setPosition: (position: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  containerSize: { width: number; height: number };
  setContainerSize: (size: { width: number; height: number }) => void;
  dragControls: any;
  convex: ConvexReactClient;
  adminClient: ConvexClient | null;
  initialActiveTab: TabTypes;
  accessToken: string;
  deployUrl?: string;
  useMockData?: boolean;
}

// LogsContainer props
export interface LogsContainerProps {
  mergedTheme: ThemeClasses;
  isPaused: boolean;
  togglePause: () => void;
  clearLogs: () => void;
  refreshLogs: () => void;
  isLoading: boolean;
  filterText: string;
  setFilterText: (text: string) => void;
  requestIdFilter: string;
  setRequestIdFilter: (text: string) => void;
  limit: number;
  setLimit: (limit: number) => void;
  initialLimit: number;
  showSuccess: boolean;
  setShowSuccess: (show: boolean) => void;
  isPermanentlyDisabled: boolean;
  setIsPermanentlyDisabled: (disabled: boolean) => void;
  setConsecutiveErrors: (errors: number) => void;
  fetchLogs: () => void;
  logType: LogType;
  setLogType: (type: LogType) => void;
  filteredLogs: LogEntry[];
  containerSize: { width: number; height: number };
  isDetailPanelOpen: boolean;
  selectedLog: LogEntry | null;
  setIsDetailPanelOpen: (open: boolean) => void;
  handleLogSelect: (log: LogEntry) => void;
  error: Error | string | null;
  renderErrorWithRetry: () => React.ReactNode;
  onLogRowMouseEnter?: (logId: string, event: React.MouseEvent) => void;
  onLogRowMouseLeave?: () => void;
  settings?: ConvexPanelSettings;
}

// LogsToolbar props
export interface LogsToolbarProps {
  mergedTheme: ThemeClasses;
  isPaused: boolean;
  togglePause: () => void;
  clearLogs: () => void;
  refreshLogs: () => void;
  isLoading: boolean;
  filterText: string;
  setFilterText: (text: string) => void;
  requestIdFilter: string;
  setRequestIdFilter: (id: string) => void;
  limit: number;
  setLimit: (limit: number) => void;
  initialLimit: number;
  showSuccess: boolean;
  setShowSuccess: (show: boolean) => void;
  isPermanentlyDisabled: boolean;
  setIsPermanentlyDisabled: (disabled: boolean) => void;
  setConsecutiveErrors: (count: number) => void;
  fetchLogs: () => void;
  logType: LogType;
  setLogType: (type: LogType) => void;
  settings?: ConvexPanelSettings;
}

// LogsTable props
export interface LogsTableProps {
  mergedTheme: ThemeClasses;
  filteredLogs: LogEntry[];
  containerSize: { width: number; height: number };
  isDetailPanelOpen: boolean;
  selectedLog: LogEntry | null;
  setIsDetailPanelOpen: (isOpen: boolean) => void;
  handleLogSelect: (log: LogEntry) => void;
  error: Error | string | null;
  renderErrorWithRetry: () => React.ReactNode;
  isPaused: boolean;
  onLogRowMouseEnter?: (logId: string, event: React.MouseEvent) => void;
  onLogRowMouseLeave?: () => void;
}

// LogRow props
export interface LogRowProps {
  index: number;
  style: React.CSSProperties;
  data: LogRowItemData;
}

// LogDetailPanel props
export interface LogDetailPanelProps {
  selectedLog: LogEntry;
  mergedTheme: ThemeClasses;
  setIsDetailPanelOpen: (isOpen: boolean) => void;
}

/**
 * Data Table
 */
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

// Table Field Props
export interface TableField {
  fieldName: string;
  optional: boolean;
  shape: {
    type: string;
    fields?: TableField[];
    tableName?: string;
    float64Range?: {
      hasSpecialValues: boolean;
    };
    shape?: {
      type: string;
      tableName?: string;
    };
  };
}

// Table Schema Props
export interface TableSchema {
  type: string;
  fields: TableField[];
}

// Table Definition Props
export interface TableDefinition {
  [key: string]: TableSchema;
}

// Table Document Props
export interface TableDocument {
  _id: string;
  [key: string]: any;
  _initialEditMode?: boolean;
}

// Page Args Props
export interface PageArgs {
  paginationOpts: PaginationOptions;
  table: string;
  filters: string | null;
  componentId?: string | null;
}

// Pagination Options Props
export interface PaginationOptions {
  cursor: string | null;
  numItems: number;
  id?: number;
}

/**
 * Filter Menu
 */
export interface FilterMenuState {
  isOpen: boolean;
  position: MenuPosition;
  editingFilter?: FilterClause;
  field?: string;
}

// Filter Clause Props
export interface FilterClause {
  field: string;
  op: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'isType' | 'isNotType';
  value: any;
  enabled: boolean;
}

// Filter Expression Props
export interface FilterExpression {
  clauses: FilterClause[];
}

// Menu Position Props
export interface MenuPosition {
  top: number;
  left: number;
}

// Filter Menu Props
export interface FilterMenuProps {
  field: string;
  position: MenuPosition;
  onApply: (filter: FilterClause) => void;
  onClose: () => void;
  existingFilter?: FilterClause;
  theme?: ThemeClasses;
}

// Filter Debug Props
export interface FilterDebugProps {
  filters: FilterExpression;
  selectedTable: string;
}

// Active Filters Props
export interface ActiveFiltersProps {
  filters: FilterExpression;
  onRemove: (field: string) => void;
  onClearAll: () => void;
  selectedTable: string;
  theme?: ThemeClasses;
  onEdit?: (e: React.MouseEvent, field: string) => void;
}

// Data Table Sidebar Props
export interface RecentlyViewedTable {
  name: string;
  timestamp: number;
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

export interface ConvexPanelSettings {
  showDebugFilters: boolean;
  showStorageDebug: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  healthCheckInterval: number;
  showRequestIdInput: boolean;
  showLimitInput: boolean;
  showSuccessCheckbox: boolean;
}

// Data Table Content Props
export interface DataTableContentProps {
  documents: TableDocument[];
  columnHeaders: string[];
  isLoading: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  observerTarget: (node: HTMLDivElement) => void;
  onFilterButtonClick: (e: React.MouseEvent, header: string) => void;
  filterMenuField: string | null;
  filterMenuPosition: MenuPosition | null;
  handleFilterApply: (filter: FilterClause) => void;
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
  /**
   * Callback function to update the documents array.
   * Called when a document is updated or deleted.
   */
  setDocuments: React.Dispatch<React.SetStateAction<TableDocument[]>>;
}

// Storage Debug Props
export interface StorageDebugProps {
  visible?: boolean;
  selectedTable?: string;
  filters?: FilterExpression;
}

/**
 * Use Filters
 */
export interface UseFiltersProps {
  onFilterApply: (filter: FilterClause) => void;
  onFilterRemove: (field: string) => void;
  onFilterClear: () => void;
  selectedTable: string;
  initialFilters?: FilterExpression;
}

export interface UseFiltersReturn {
  filters: FilterExpression;
  filterMenuField: string | null;
  filterMenuPosition: MenuPosition | null;
  handleFilterButtonClick: (e: React.MouseEvent, header: string) => void;
  handleFilterApply: (filter: FilterClause) => void;
  handleFilterRemove: (field: string) => void;
  clearFilters: () => void;
  closeFilterMenu: () => void;
  setFilters: React.Dispatch<React.SetStateAction<FilterExpression>>;
}

/**
 * Use Table Data
 */
// Use Table Data Props
export interface UseTableDataProps {
  convexUrl: string;
  accessToken: string;
  baseUrl: string;
  adminClient: ConvexClient | null;
  onError?: (error: string) => void;
  useMockData?: boolean;
}

// Use Table Data Return
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

/**
 * Fetch Options and Responses
 */
export interface FetchLogsOptions {
  cursor: number | string;
  convexUrl: string;
  accessToken: string;
  signal?: AbortSignal;
}

export interface FetchLogsResponse {
  logs: LogEntry[];
  newCursor?: number | string;
  hostname: string;
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

/**
 * Health
 */
// Health Container Props
export interface HealthContainerProps {
  deploymentUrl: string;
  authToken: string;
  convexVersion?: string;
  useMockData?: boolean;
}

// Cache Hit Data
export interface CacheHitData {
  timestamp: string;
  values: Record<string, number | null>;
}

// Cache Hit Rate Chart Props
export interface CacheHitRateChartProps {
  deploymentUrl: string;
  authToken: string;
  refreshInterval?: number;
  refreshInterval?: number;
  useMockData?: boolean;
}

// Timestamp
export interface TimeStamp {
  secs_since_epoch: number;
  nanos_since_epoch: number;
}

// Failure Data
export interface FailureData {
  timestamp: string;
  values: Record<string, number | null>;
}

// Failure Rate Chart Props
export interface FailureRateChartProps {
  deploymentUrl: string;
  authToken: string;
  refreshInterval?: number;
  useMockData?: boolean;
}

// Scheduler Lag Chart Props
export interface SchedulerLagChartProps {
  deploymentUrl: string;
  authToken: string;
  refreshInterval?: number;
  showChart: boolean;
  useMockData?: boolean;
}

// Scheduler Status Props
export interface SchedulerStatusProps {
  status: 'on_time' | 'delayed' | 'error';
  message: string;
}

// Types
export type TimeSeriesData = [TimeStamp, number | null][];
export type APIResponse = [string, TimeSeriesData][];

// Update the LogRow itemData interface
export interface LogRowItemData {
  logs: LogEntry[];
  isDetailPanelOpen: boolean;
  mergedTheme: ThemeClasses;
  handleLogSelect: (log: LogEntry) => void;
  onLogRowMouseEnter?: (logId: string, event: React.MouseEvent) => void;
  onLogRowMouseLeave?: () => void;
}

/**
 * Network Panel Types
 */
export interface NetworkCall {
  id: string;
  url: string;
  method: string;
  status: number;
  statusText: string;
  size: string;
  time: number;
  type: string;
  initiator: string;
  timestamp: number;
  startTime: number;
  endTime: number;
  duration: number;
  isError: boolean;
  request: {
    headers: Record<string, string>;
    body?: string;
  };
  response: {
    headers: Record<string, string>;
    body?: any;
  };
}

export interface NetworkRowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    calls: NetworkCall[];
    isDetailPanelOpen: boolean;
    mergedTheme: any;
    handleCallSelect: (call: NetworkCall) => void;
    onRowMouseEnter?: (callId: string, event: React.MouseEvent) => void;
    onRowMouseLeave?: () => void;
  };
}

export interface NetworkTableProps {
  mergedTheme: ThemeClasses;
  filteredCalls: NetworkCall[];
  containerSize: { width: number; height: number };
  isDetailPanelOpen: boolean;
  selectedCall: NetworkCall | null;
  setIsDetailPanelOpen: (isOpen: boolean) => void;
  handleCallSelect: (call: NetworkCall) => void;
  onRowMouseEnter?: (callId: string, event: React.MouseEvent) => void;
  onRowMouseLeave?: () => void;
}

export interface NetworkPanelProps {
  mergedTheme: ThemeClasses;
  settings?: ConvexPanelSettings;
  containerSize: { width: number; height: number };
}

/**
 * Sort direction for table columns
 */
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  direction: SortDirection;
}

/**
 * Functions
 */
export type UdfType = 'query' | 'mutation' | 'action' | 'httpaction';

export type Visibility = {
  kind: 'public' | 'internal';
};

export type FileNode = {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
};

export type ModuleFunction = {
  name: string;
  identifier: string;
  udfType: UdfType;
  visibility: Visibility;
  file: {
    name: string;
    path: string;
  };
  sourceCode?: string;
  args?: Record<string, any>;
  returnType?: string;
};

export type FunctionsState = {
  selectedFunction: ModuleFunction | null;
  setSelectedFunction: (fn: ModuleFunction | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  rootEntries: FileNode[];
  modules: ModuleFunction[];
};

export interface File {
  type: 'file';
  name: string;
  identifier: string;
  functions: ModuleFunction[];
}

export interface Folder {
  type: 'folder';
  name: string;
  identifier: string;
  children: FileOrFolder[];
}

export type FileOrFolder = File | Folder; 

export type FilterOperation = 
  | 'equals' 
  | 'not_equals' 
  | 'contains' 
  | 'not_contains' 
  | 'starts_with' 
  | 'ends_with' 
  | 'greater_than' 
  | 'less_than' 
  | 'greater_than_equal' 
  | 'less_than_equal' 
  | 'is_empty' 
  | 'is_not_empty';

export const editorOptions: EditorProps["options"] &
  DiffEditorProps["options"] = {
  tabFocusMode: false,
  automaticLayout: true,
  minimap: { enabled: false },
  overviewRulerBorder: false,
  scrollBeyondLastLine: false,
  find: {
    addExtraSpaceOnTop: false,
    autoFindInSelection: "never",
    seedSearchStringFromSelection: "never",
  },
  lineNumbers: "off",
  glyphMargin: false,
  lineDecorationsWidth: 0,
  lineNumbersMinChars: 0,
  scrollbar: {
    alwaysConsumeMouseWheel: false,
    horizontalScrollbarSize: 8,
    verticalScrollbarSize: 8,
    useShadows: false,
    vertical: "visible",
  },
  suggest: { preview: false },
  hideCursorInOverviewRuler: true,
  quickSuggestions: false,
  parameterHints: { enabled: false },
  suggestOnTriggerCharacters: false,
  snippetSuggestions: "none",
  contextmenu: false,
  codeLens: false,
  disableLayerHinting: true,
  inlayHints: { enabled: "off" },
  inlineSuggest: { enabled: false },
  hover: { above: false },
  guides: {
    bracketPairs: false,
    bracketPairsHorizontal: false,
    highlightActiveBracketPair: false,
    indentation: false,
    highlightActiveIndentation: false,
  },
  bracketPairColorization: { enabled: false },
  matchBrackets: "never",
  tabCompletion: "off",
  selectionHighlight: false,
  renderLineHighlight: "none",
};

export type ProjectEnvVarConfig = {
  name: string;
  value: string;
  deploymentTypes: ("dev" | "preview" | "prod")[];
};

export interface ConvexPanelProps {
  accessToken: string;
  deployKey: string;
}

declare const ConvexPanel: FC<ConvexPanelProps>;

export default ConvexPanel;