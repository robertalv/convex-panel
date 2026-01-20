/**
 * Types for Logs feature
 */

import type { NativeStackScreenProps } from "@react-navigation/native-stack";

// Re-export LogEntry from API for convenience
export type { LogEntry, FetchLogsResponse } from "../../api/logs";

/**
 * Log type categories for filtering
 */
export type LogType = "success" | "error" | "info" | "warn" | "debug";

/**
 * Log filter state
 */
export interface LogFilter {
  search: string;
  types: Set<LogType>;
  components: Set<string>;
  functions: Set<string>;
}

/**
 * Navigation types for Logs feature
 */
export type LogsStackParamList = {
  LogsList: undefined;
};

export type LogsScreenProps = NativeStackScreenProps<
  LogsStackParamList,
  "LogsList"
>;

/**
 * Props for LogCard component
 */
export interface LogCardProps {
  log: import("../../api/logs").LogEntry;
  onPress?: () => void;
}

/**
 * Hook return type for useLogStream
 */
export interface UseLogStreamReturn {
  logs: import("../../api/logs").LogEntry[];
  isLoading: boolean;
  error: Error | null;
  isPaused: boolean;
  pause: () => void;
  resume: () => void;
  clearLogs: () => void;
  refetch: () => void;
}
