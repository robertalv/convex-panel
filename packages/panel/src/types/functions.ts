/**
 * Function-related types
 */

import type { UdfType, UdfVisibility } from './convex';

export type CustomQuery = {
  type: 'customQuery';
  table: string | null;
  componentId?: string | null;
};

export interface FunctionExecutionStats {
  udf_type: string;
  component_path: string;
  identifier: string;
  timestamp: number;
  execution_time_ms: number;
  success: boolean;
  error?: string;
  usage_stats: {
    database_read_bytes: number;
    database_write_bytes: number;
    database_read_documents: number;
    storage_read_bytes: number;
    storage_write_bytes: number;
    vector_index_read_bytes?: number;
    vector_index_write_bytes?: number;
    memory_used_mb: number;
  };
  identity_type: string;
  request_id: string;
  execution_id: string;
  cachedResult?: boolean;
}

export interface StreamUdfExecutionResponse {
  entries: FunctionExecutionStats[];
  new_cursor: number;
}

export interface FunctionExecutionJson {
  udf_type: string;
  component_path?: string;
  identifier: string;
  log_lines?: any[];
  timestamp: number;
  cached_result?: boolean;
  execution_time: number;
  success?: any;
  error?: string;
  request_id: string;
  caller?: string;
  parent_execution_id?: string;
  execution_id: string;
  usage_stats: {
    database_read_bytes: number;
    database_write_bytes: number;
    database_read_documents: number;
    storage_read_bytes: number;
    storage_write_bytes: number;
    vector_index_read_bytes?: number;
    vector_index_write_bytes?: number;
    memory_used_mb: number;
  };
  return_bytes?: number;
  occ_info?: {
    table_name: string;
    document_id: string;
    write_source: string;
    retry_count: number;
  };
  execution_timestamp?: number;
  identity_type: string;
  environment?: string;
}

export interface FunctionExecutionLog {
  id: string;
  functionIdentifier: string;
  functionName: string;
  udfType: UdfType;
  componentPath?: string;
  timestamp: number;
  startedAt: number;
  completedAt: number;
  durationMs: number;
  success: boolean;
  error?: string;
  logLines: string[];
  usageStats: FunctionExecutionJson['usage_stats'];
  requestId: string;
  executionId: string;
  caller?: string;
  environment?: string;
  identityType: string;
  returnBytes?: number;
  cachedResult?: boolean;
  raw: FunctionExecutionJson;
}

export interface AggregatedFunctionStats {
  invocations: number[];
  errors: number[];
  executionTimes: number[];
  cacheHits: number[];
}

export type FileNode = {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
};

export type Visibility = UdfVisibility;

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
  componentId?: string | null;
  componentPath?: string;
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
