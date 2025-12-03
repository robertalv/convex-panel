/**
 * Log-related types
 */

import React from 'react';
import type { LogType } from '../utils/constants';
import type { ThemeClasses, ConvexPanelSettings } from './common';

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

export interface LogRowProps {
  index: number;
  style: React.CSSProperties;
  data: LogRowItemData;
}

export interface LogDetailPanelProps {
  selectedLog: LogEntry;
  mergedTheme: ThemeClasses;
  setIsDetailPanelOpen: (isOpen: boolean) => void;
}

export interface LogRowItemData {
  logs: LogEntry[];
  isDetailPanelOpen: boolean;
  mergedTheme: ThemeClasses;
  handleLogSelect: (log: LogEntry) => void;
  onLogRowMouseEnter?: (logId: string, event: React.MouseEvent) => void;
  onLogRowMouseLeave?: () => void;
}

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
