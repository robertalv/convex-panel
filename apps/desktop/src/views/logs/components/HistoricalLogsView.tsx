/**
 * HistoricalLogsView Component
 * Browse and search through logs stored in SQLite
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, AlertCircle, Database, Loader2 } from "lucide-react";
import { useLocalLogStore } from "../hooks/useLocalLogStore";
import { useKeyboardNavigation } from "../utils/keyboard-navigation";
import { LogRow } from "./LogRow";
import { LogDetailSheet } from "./LogDetailSheet";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { IconButton, Button } from "@/components/ui/button";
import type { LogEntry } from "../types";
import type {
  LogFilters as LocalLogFilters,
  LocalLogEntry,
} from "../hooks/useLocalLogStore";

interface HistoricalLogsViewProps {
  deploymentId?: string;
  onClose?: () => void;
}

// Convert LocalLogEntry to LogEntry for display
function convertLocalLogToLogEntry(localLog: LocalLogEntry): LogEntry {
  let parsed: any = {};
  try {
    parsed = JSON.parse(localLog.json_blob);
  } catch (e) {
    console.error("Failed to parse log JSON:", e);
  }

  return {
    id: localLog.id,
    kind: "outcome", // Historical logs are always outcome entries
    timestamp: localLog.ts,
    startedAt: localLog.ts,
    completedAt: localLog.ts + (localLog.duration_ms || 0),
    functionIdentifier: localLog.function_path || "",
    functionName: localLog.function_name || "",
    udfType: (localLog.udf_type as any) || "query",
    requestId: localLog.request_id || "",
    executionId: localLog.execution_id || "",
    success: localLog.success ?? true,
    durationMs: localLog.duration_ms ?? 0,
    error: parsed.error,
    logLines: parsed.logLines || [],
    cachedResult: false,
    usageStats: parsed.usageStats || {
      database_read_bytes: 0,
      database_write_bytes: 0,
      database_read_documents: 0,
      storage_read_bytes: 0,
      storage_write_bytes: 0,
      memory_used_mb: 0,
    },
    identityType: parsed.identityType || "unknown",
    componentPath: parsed.componentPath,
    parentExecutionId: parsed.parentExecutionId || null,
    caller: parsed.caller,
    environment: parsed.environment,
    returnBytes: parsed.returnBytes,
    raw: parsed.raw || parsed, // Use raw if available, otherwise use parsed data
  };
}

export function HistoricalLogsView({
  deploymentId,
  onClose,
}: HistoricalLogsViewProps) {
  const { queryLogs, searchLogs, stats, refreshStats } = useLocalLogStore();

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string[]>([
    "success",
    "failure",
  ]);
  const [dateRange, setDateRange] = useState<{ start?: number; end?: number }>(
    {},
  );

  // Results state
  const [logs, setLogs] = useState<LocalLogEntry[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  // Load initial stats
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  // Build filters
  const filters = useMemo((): LocalLogFilters => {
    const f: LocalLogFilters = {};
    if (deploymentId) f.deployment = deploymentId;
    // If only one status is selected, filter by it
    if (statusFilter.length === 1) {
      f.success = statusFilter[0] === "success";
    }
    // If both or neither are selected, don't filter by status
    if (dateRange.start) f.start_ts = dateRange.start;
    if (dateRange.end) f.end_ts = dateRange.end;
    return f;
  }, [deploymentId, statusFilter, dateRange]);

  // Load logs
  const loadLogs = useCallback(
    async (reset: boolean = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = searchQuery.trim()
          ? await searchLogs(
              searchQuery,
              filters,
              50,
              reset ? undefined : cursor,
            )
          : await queryLogs(filters, 50, reset ? undefined : cursor);

        if (reset) {
          setLogs(result.logs);
          setCursor(result.cursor);
        } else {
          setLogs((prev) => [...prev, ...result.logs]);
          setCursor(result.cursor);
        }
        setHasMore(result.has_more);
      } catch (err) {
        console.error("Failed to load logs:", err);
        setError(err instanceof Error ? err.message : "Failed to load logs");
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, filters, cursor, queryLogs, searchLogs],
  );

  // Load initial logs
  useEffect(() => {
    loadLogs(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filters]);

  // Convert logs for display
  const displayLogs = useMemo(() => {
    return logs.map(convertLocalLogToLogEntry);
  }, [logs]);

  // Keyboard navigation
  useKeyboardNavigation({
    items: displayLogs,
    selectedItem: selectedLog,
    onSelectItem: setSelectedLog,
    isDetailOpen: !!selectedLog,
    onCloseDetail: () => setSelectedLog(null),
  });

  // Quick date range presets
  const setDatePreset = (preset: "today" | "week" | "month" | "all") => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    switch (preset) {
      case "today":
        setDateRange({ start: now - day, end: now });
        break;
      case "week":
        setDateRange({ start: now - 7 * day, end: now });
        break;
      case "month":
        setDateRange({ start: now - 30 * day, end: now });
        break;
      case "all":
        setDateRange({});
        break;
    }
  };

  // Date preset button configurations
  const datePresets = [
    {
      id: "today" as const,
      label: "Today",
      isActive: (start?: number) =>
        start && start > Date.now() - 24 * 60 * 60 * 1000,
    },
    {
      id: "week" as const,
      label: "Week",
      isActive: (start?: number) =>
        start && start > Date.now() - 7 * 24 * 60 * 60 * 1000,
    },
    {
      id: "month" as const,
      label: "Month",
      isActive: (start?: number) =>
        start && start > Date.now() - 30 * 24 * 60 * 60 * 1000,
    },
    {
      id: "all" as const,
      label: "All",
      isActive: (start?: number) => !start,
    },
  ] as const;

  // Helper to get button styles based on active state
  const getButtonStyle = (isActive: boolean) => ({
    backgroundColor: isActive
      ? "var(--color-surface-base)"
      : "transparent",
    color: isActive ? "var(--color-text-base)" : "var(--color-text-muted)",
    boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
    fontSize: "12px",
    fontWeight: 500,
    padding: "0 12px",
    height: "28px",
    width: "fit-content",
    minWidth: "fit-content",
    flexShrink: 0,
  });

  return (
    <div className="relative flex h-full overflow-hidden bg-background-base">
      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Toolbar */}
        <div
          className="flex items-center gap-2 border-b border-border-base px-4 py-2"
          style={{ backgroundColor: "var(--color-surface-base)" }}
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              size={16}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stored logs (full-text)..."
              className="w-full rounded-lg border border-border-base bg-surface-raised py-2 pl-10 pr-4 text-sm text-text-base placeholder:text-text-muted focus:border-brand-base focus:outline-none focus:ring-1 focus:ring-brand-base"
            />
          </div>

          {/* Success/Failure Filter */}
          <SearchableSelect
            multiSelect={true}
            value={statusFilter}
            onChange={(values) => setStatusFilter(values)}
            options={[
              { value: "success", label: "Success" },
              { value: "failure", label: "Failure" },
            ]}
            placeholder="Status"
            searchPlaceholder="Search status..."
            variant="ghost"
            buttonClassName="pl-2 pr-1 py-0.5"
          />

          {/* Date Range Presets - Segmented Control */}
          <div
            className="flex items-center rounded-lg p-0.5"
            style={{ backgroundColor: "var(--color-surface-raised)" }}
          >
            {datePresets.map((preset) => {
              const isActive = !!preset.isActive(dateRange.start);
              return (
                <IconButton
                  key={preset.id}
                  onClick={() => setDatePreset(preset.id)}
                  variant="ghost"
                  size="sm"
                  style={getButtonStyle(isActive)}
                >
                  {preset.label}
                </IconButton>
              );
            })}
          </div>

          {/* Close button */}
          {onClose && (
            <IconButton
              onClick={onClose}
              icon="close"
              variant="secondary"
              size="md"
              tooltip="Close"
            />
          )}
        </div>

        {/* Stats Bar */}
        {stats && (
          <div
            className="flex items-center gap-4 border-b border-border-base px-4 py-2 text-xs"
            style={{ backgroundColor: "var(--color-surface-overlay)" }}
          >
            <div className="flex items-center gap-2">
              <Database size={14} className="text-brand-base" />
              <span className="text-text-muted">Total stored:</span>
              <span className="font-semibold text-text-base">
                {stats.total_logs.toLocaleString()} logs
              </span>
            </div>
            <span className="text-text-muted">•</span>
            <span className="text-text-muted">
              Showing:{" "}
              <span className="font-semibold text-text-base">
                {logs.length}
              </span>
            </span>
          </div>
        )}

        {/* Content - with relative positioning for sheet */}
        <div className="relative flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {error && (
              <div className="flex items-center gap-2 border-b border-error-base bg-error-base/10 p-4 text-sm text-error-base">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {!isLoading && logs.length === 0 && !error && (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Database
                    size={48}
                    className="mx-auto mb-4 text-text-muted opacity-50"
                  />
                  <p className="text-sm text-text-muted">
                    {searchQuery
                      ? "No logs found matching your search"
                      : "No logs stored yet"}
                  </p>
                  <p className="mt-2 text-xs text-text-subtle">
                    Logs are automatically saved as you view them in the Live
                    Logs tab
                  </p>
                </div>
              </div>
            )}

            {logs.length > 0 && (
              <div className="divide-y divide-border-base">
                {displayLogs.map((log) => (
                  <LogRow
                    key={log.id}
                    log={log}
                    isSelected={selectedLog?.id === log.id}
                    onClick={() => setSelectedLog(log)}
                  />
                ))}
              </div>
            )}

            {/* Load More */}
            {hasMore && !isLoading && (
              <div className="border-t border-border-base p-4 text-center">
                <Button
                  onClick={() => loadLogs(false)}
                  variant="default"
                  size="default"
                >
                  Load More
                </Button>
              </div>
            )}

            {isLoading && logs.length > 0 && (
              <div className="flex items-center justify-center border-t border-border-base p-4">
                <Loader2 size={16} className="animate-spin text-text-muted" />
                <span className="ml-2 text-sm text-text-muted">Loading...</span>
              </div>
            )}
          </div>
          {/* End scrollable content */}

          {/* Log Detail Sheet - positioned absolutely within content area */}
          {selectedLog && (
            <LogDetailSheet
              log={selectedLog}
              allLogs={displayLogs}
              onClose={() => setSelectedLog(null)}
            />
          )}
        </div>
        {/* End Content wrapper */}
      </div>
      {/* End Main Content Wrapper */}
    </div>
  );
}
