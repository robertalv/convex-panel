/**
 * LogsView Feature
 * Main orchestrating component for the desktop logs viewer
 * Uses hooks and components from this feature, avoiding convex-panel dependencies
 */

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useDeployment } from "@/contexts/deployment-context";
import { useTheme } from "@/contexts/theme-context";
import { AlertCircle, X, ArrowUp } from "lucide-react";
import { fetch } from "@tauri-apps/plugin-http";

// Hooks
import { useLogs } from "./hooks/useLogs";
import { useComponents } from "@/hooks/useComponents";
import { useFunctions } from "./hooks/useFunctions";
import { useLogStorage } from "./hooks/useLogStorage";
import { useDeploymentAuditLogs } from "./hooks/useDeploymentAuditLogs";

// Components
import { LogsToolbar } from "./components/LogsToolbar";
import { LogRow } from "./components/LogRow";
import { LogDetailSheet } from "./components/LogDetailSheet";
import { DeploymentEventListItem } from "./components/DeploymentEventListItem";

// Utils
import { exportLogsToFile } from "./utils/log-export";
import { interleaveLogs, getInterleavedLogKey } from "./utils/interleaveLogs";

// Types
import type { LogEntry, LogFilters } from "./types";

// Initial filter state
const initialFilters: LogFilters = {
  searchQuery: "",
  selectedComponents: "all",
  selectedFunctions: "all", // Default to all functions
  selectedLogTypes: [
    "success",
    "failure",
    "debug",
    "log / info",
    "warn",
    "error",
  ],
};

/**
 * Main LogsView content component
 */
function LogsViewContent() {
  const { deploymentUrl, authToken, useMockData, adminClient, deployment } =
    useDeployment();

  // Get deployment ID for storage
  const deploymentId = deployment?.id?.toString() || deploymentUrl || "unknown";

  // Filter state
  const [filters, setFilters] = useState<LogFilters>(initialFilters);

  // Pagination state
  const PAGE_SIZE = 100;
  const [currentPage, setCurrentPage] = useState(1);
  const [storedLogs, setStoredLogs] = useState<LogEntry[]>([]);
  const [isLoadingStoredLogs, setIsLoadingStoredLogs] = useState(false);

  // Selected log for detail view
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  // Manual pause state (user clicked pause)
  const [manuallyPaused, setManuallyPaused] = useState(false);

  // Scroll-away pause state
  const [isScrolledAway, setIsScrolledAway] = useState(false);

  // Error display
  const [displayError, setDisplayError] = useState<string | null>(null);

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  // Stable error handler
  const handleError = useCallback((err: string) => {
    setDisplayError(err);
  }, []);

  // Refs for scroll handling
  const logsListRef = useRef<HTMLDivElement>(null);
  const scrollStateRef = useRef<{
    isScrolledAway: boolean;
    rafId: number | null;
  }>({
    isScrolledAway: false,
    rafId: null,
  });

  // Components hook
  const { components } = useComponents({
    adminClient,
    useMockData,
  });

  // Functions hook
  const { functions } = useFunctions({
    adminClient,
    useMockData,
  });

  // Log storage hook
  const { isEnabled: isStorageEnabled, persistLogs, loadLogs } = useLogStorage({
    deploymentId,
    enabled: false, // Default to off, user can enable
  });

  // Compute effective pause state
  // Pause streaming when on pages > 1 (viewing historical logs)
  const isDetailOpen = selectedLog !== null;
  const isViewingHistoricalLogs = currentPage > 1;
  const effectiveIsPaused =
    isViewingHistoricalLogs ||
    manuallyPaused ||
    (isScrolledAway && !isDetailOpen);

  // Logs hook
  const {
    logs: rawLogs,
    isLoading,
    error,
    clearLogs,
  } = useLogs({
    deploymentUrl,
    authToken,
    useMockData,
    isPaused: effectiveIsPaused,
    onError: handleError,
    fetchFn: fetch,
  });

  // Final deduplication safety check before rendering
  const logs = useMemo(() => {
    const seen = new Set<string>();
    return rawLogs.filter((log) => {
      if (seen.has(log.id)) {
        console.warn(`[LogsView] Duplicate log ID detected: ${log.id}`);
        return false;
      }
      seen.add(log.id);
      return true;
    });
  }, [rawLogs]);

  // Deployment audit logs hook
  // Fetch deployment events from the last 24 hours
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
  const { events: deploymentEvents } = useDeploymentAuditLogs({
    adminClient,
    fromTimestamp: twentyFourHoursAgo,
    enabled: !useMockData && !!adminClient, // Enable when we have a real admin client
  });

  // Interleave logs and deployment events
  const interleavedLogs = useMemo(() => {
    return interleaveLogs(logs, deploymentEvents || []);
  }, [logs, deploymentEvents]);

  // Persist new logs to storage when enabled
  const prevLogsLengthRef = useRef(0);
  useEffect(() => {
    if (isStorageEnabled && logs.length > prevLogsLengthRef.current) {
      const newLogs = logs.slice(0, logs.length - prevLogsLengthRef.current);
      if (newLogs.length > 0) {
        persistLogs(newLogs);
      }
    }
    prevLogsLengthRef.current = logs.length;
  }, [logs, isStorageEnabled, persistLogs]);

  // Load stored logs when viewing pages > 1
  // Load a larger batch to account for filtering, then paginate after filtering
  useEffect(() => {
    if (isViewingHistoricalLogs && isStorageEnabled) {
      setIsLoadingStoredLogs(true);
      // Load a larger batch (10 pages worth) to account for filtering
      // We'll filter and paginate in memory
      const batchSize = PAGE_SIZE * 10;
      loadLogs({
        limit: batchSize,
        offset: 0, // Start from beginning, we'll paginate after filtering
        order: "desc",
      })
        .then((stored) => {
          // Convert StoredLogEntry to LogEntry (remove storage metadata)
          const convertedLogs: LogEntry[] = stored.map((log) => {
            const { deploymentId: _, storedAt: __, ...logEntry } = log;
            return logEntry;
          });
          setStoredLogs(convertedLogs);
        })
        .catch((err) => {
          console.error("[LogsView] Failed to load stored logs:", err);
          setDisplayError(
            `Failed to load stored logs: ${err instanceof Error ? err.message : String(err)}`,
          );
          setStoredLogs([]);
        })
        .finally(() => {
          setIsLoadingStoredLogs(false);
        });
    } else if (!isViewingHistoricalLogs) {
      // Clear stored logs when back on page 1
      setStoredLogs([]);
    }
    // PAGE_SIZE is a constant, so we don't need it in dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isViewingHistoricalLogs, isStorageEnabled, loadLogs]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Determine which logs to use (streaming for page 1, stored for pages > 1)
  const logsToFilter = useMemo(() => {
    if (isViewingHistoricalLogs) {
      // Use stored logs for historical pages
      return storedLogs;
    }
    // Use streaming logs for page 1
    return logs;
  }, [isViewingHistoricalLogs, storedLogs, logs]);

  // Interleave logs and deployment events (only for page 1 with streaming logs)
  const interleavedLogsForPage1 = useMemo(() => {
    if (isViewingHistoricalLogs) {
      // Don't interleave deployment events for historical pages
      return logsToFilter.map((log) => ({
        kind: "ExecutionLog" as const,
        executionLog: log,
      }));
    }
    return interleaveLogs(logsToFilter, deploymentEvents || []);
  }, [logsToFilter, deploymentEvents, isViewingHistoricalLogs]);

  // Filter logs based on current filter state
  const filteredInterleavedLogs = useMemo(() => {
    return interleavedLogsForPage1.filter((item) => {
      // Deployment events always pass through (no filtering for now)
      if (item.kind === "DeploymentEvent") {
        return true;
      }

      // Filter execution logs
      const log = item.executionLog;

      // Filter by search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesSearch =
          log.functionName?.toLowerCase().includes(query) ||
          log.functionIdentifier?.toLowerCase().includes(query) ||
          log.requestId?.toLowerCase().includes(query) ||
          log.error?.toLowerCase().includes(query) ||
          log.logLines?.some((line) =>
            (typeof line === "string" ? line : JSON.stringify(line))
              .toLowerCase()
              .includes(query),
          );
        if (!matchesSearch) return false;
      }

      // Filter by log type
      if (
        filters.selectedLogTypes.length > 0 &&
        filters.selectedLogTypes.length < 6
      ) {
        let matchesLogType = false;

        for (const logType of filters.selectedLogTypes) {
          if (logType === "success" && log.success) {
            matchesLogType = true;
            break;
          }
          if (logType === "failure" && !log.success) {
            matchesLogType = true;
            break;
          }
          if (logType === "error" && log.error) {
            matchesLogType = true;
            break;
          }
          // For debug/info/warn, check log lines (simplified for now)
          if (
            logType === "log / info" ||
            logType === "debug" ||
            logType === "warn"
          ) {
            // Could check log.logLines for specific levels if needed
            matchesLogType = true;
            break;
          }
        }

        if (!matchesLogType) return false;
      }

      return true;
    });
  }, [interleavedLogsForPage1, filters]);

  // Apply pagination to filtered logs
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return filteredInterleavedLogs.slice(startIndex, endIndex);
  }, [filteredInterleavedLogs, currentPage]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredInterleavedLogs.length / PAGE_SIZE));
  }, [filteredInterleavedLogs.length]);

  // Handle page navigation
  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
        setCurrentPage(newPage);
        // Scroll to top when changing pages
        logsListRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        setIsScrolledAway(false);
      }
    },
    [totalPages],
  );

  const handlePrevPage = useCallback(() => {
    handlePageChange(currentPage - 1);
  }, [currentPage, handlePageChange]);

  const handleNextPage = useCallback(() => {
    handlePageChange(currentPage + 1);
  }, [currentPage, handlePageChange]);

  // Handle pause toggle
  const handleTogglePause = useCallback(() => {
    if (effectiveIsPaused) {
      // Resume: scroll to top, go to page 1, and unpause
      setCurrentPage(1);
      logsListRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      setManuallyPaused(false);
      setIsScrolledAway(false);
    } else {
      // Pause manually
      setManuallyPaused(true);
    }
  }, [effectiveIsPaused]);

  // Handle scroll detection for auto-pause
  const handleLogsScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = e.currentTarget.scrollTop;
      const scrolledAway = scrollTop > 50; // Small threshold

      if (scrollStateRef.current.rafId !== null) {
        cancelAnimationFrame(scrollStateRef.current.rafId);
      }

      if (
        !manuallyPaused &&
        !isDetailOpen &&
        scrollStateRef.current.isScrolledAway !== scrolledAway
      ) {
        scrollStateRef.current.isScrolledAway = scrolledAway;

        scrollStateRef.current.rafId = requestAnimationFrame(() => {
          setIsScrolledAway(scrolledAway);
          scrollStateRef.current.rafId = null;
        });
      }
    },
    [manuallyPaused, isDetailOpen],
  );

  // Reset scroll state when detail sheet closes
  useEffect(() => {
    if (!isDetailOpen && logsListRef.current) {
      const scrollTop = logsListRef.current.scrollTop;
      if (scrollTop === 0 && !manuallyPaused) {
        scrollStateRef.current.isScrolledAway = false;
        setIsScrolledAway(false);
      }
    }
  }, [isDetailOpen, manuallyPaused]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (scrollStateRef.current.rafId !== null) {
        cancelAnimationFrame(scrollStateRef.current.rafId);
      }
    };
  }, []);

  // Handle log row click
  const handleLogClick = useCallback((log: LogEntry) => {
    setSelectedLog(log);
  }, []);

  // Handle detail sheet close
  const handleCloseDetail = useCallback(() => {
    setSelectedLog(null);
  }, []);

  // Handle search change
  const handleSearchChange = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  // Handle export
  const handleExport = useCallback(async () => {
    // Filter out deployment events for export (only export execution logs)
    const logsToExport = filteredInterleavedLogs
      .filter((item) => item.kind === "ExecutionLog")
      .map((item) => item.executionLog);

    if (logsToExport.length === 0) return;

    setIsExporting(true);
    try {
      const result = await exportLogsToFile(logsToExport, "json", deploymentId);
      if (!result.success && result.error !== "Export cancelled") {
        setDisplayError(`Export failed: ${result.error}`);
      }
    } catch (err) {
      setDisplayError(
        `Export failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setIsExporting(false);
    }
  }, [filteredInterleavedLogs, deploymentId]);

  // Scroll to top button
  const handleScrollToTop = useCallback(() => {
    logsListRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setIsScrolledAway(false);
    if (!manuallyPaused) {
      setManuallyPaused(false);
    }
  }, [manuallyPaused]);

  return (
    <div
      className="flex h-full w-full overflow-hidden"
      style={{ backgroundColor: "var(--color-surface-base)" }}
    >
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Error banner */}
        {(error || displayError) && (
          <div
            className="flex items-center gap-2 px-3 py-2 text-xs"
            style={{
              backgroundColor: "var(--color-error-base-alpha)",
              color: "var(--color-error-base)",
              borderBottom: "1px solid var(--color-error-base)",
            }}
          >
            <AlertCircle size={14} />
            <span className="flex-1">{error?.message || displayError}</span>
            <button
              type="button"
              onClick={() => setDisplayError(null)}
              className="p-0.5 rounded hover:bg-[var(--color-error-base)]"
              style={{ color: "var(--color-error-base)" }}
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Toolbar */}
        <LogsToolbar
          filters={filters}
          onFiltersChange={setFilters}
          isPaused={effectiveIsPaused}
          onTogglePause={handleTogglePause}
          onClearLogs={clearLogs}
          onExport={handleExport}
          isExporting={isExporting}
          logCount={filteredInterleavedLogs.length}
          isLoading={isLoading || isLoadingStoredLogs}
          components={components}
          functions={functions}
          onSearchChange={handleSearchChange}
          currentPage={currentPage}
          totalPages={totalPages}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
          isViewingHistoricalLogs={isViewingHistoricalLogs}
        />

        {/* Logs list */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          {/* Log header row - matches dashboard-common format */}
          <div
            className="flex items-center px-4 py-2 text-xs sticky top-0 z-10"
            style={{
              backgroundColor: "var(--color-surface-base)",
              borderBottom: "1px solid var(--color-border-base)",
              color: "var(--color-text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            <div style={{ width: "148px" }}>Timestamp</div>
            <div style={{ width: "60px" }}>ID</div>
            <div style={{ width: "112px" }}>Status</div>
            <div style={{ flex: 1 }}>Function</div>
          </div>

          {/* Scrollable logs */}
          <div
            ref={logsListRef}
            onScroll={handleLogsScroll}
            className="h-[calc(100%-32px)] overflow-auto"
          >
            {paginatedLogs.length === 0 ? (
              <div
                className="flex items-center justify-center h-full text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
                {isLoading || isLoadingStoredLogs
                  ? "Loading logs..."
                  : "No logs to display"}
              </div>
            ) : (
              paginatedLogs.map((item) => {
                const key = getInterleavedLogKey(item);

                if (item.kind === "DeploymentEvent") {
                  return (
                    <DeploymentEventListItem
                      key={key}
                      event={item.deploymentEvent}
                      setShownLog={() => {
                        // For now, deployment events don't open details
                        // We can add this functionality later
                      }}
                      logKey={key}
                    />
                  );
                }

                return (
                  <LogRow
                    key={key}
                    log={item.executionLog}
                    onClick={() => handleLogClick(item.executionLog)}
                    isSelected={selectedLog?.id === item.executionLog.id}
                    functions={functions}
                  />
                );
              })
            )}
          </div>

          {/* Scroll to top button when scrolled away */}
          {isScrolledAway && (
            <button
              type="button"
              onClick={handleScrollToTop}
              className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-2 rounded-full shadow-lg transition-all hover:scale-105"
              style={{
                backgroundColor: "var(--color-brand-base)",
                color: "white",
              }}
            >
              <ArrowUp size={14} />
              <span className="text-xs font-medium">Scroll to top</span>
            </button>
          )}
        </div>
      </div>

      {/* Detail sheet */}
      {selectedLog && (
        <LogDetailSheet
          log={selectedLog}
          allLogs={logs}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
}

/**
 * LogsView wrapper with theme
 */
export function LogsView() {
  const { resolvedTheme } = useTheme();

  return (
    <div className={`cp-theme-${resolvedTheme} h-full`}>
      <LogsViewContent />
    </div>
  );
}

export default LogsView;
