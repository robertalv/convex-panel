/**
 * LogsView Feature
 * Main orchestrating component for the desktop logs viewer
 * Uses hooks and components from this feature, avoiding convex-panel dependencies
 */

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useDeployment } from "@/contexts/deployment-context";
import { useTheme } from "@/contexts/theme-context";
import { AlertCircle, X, ArrowUp } from "lucide-react";

// Hooks
import { useLogStream } from "@/contexts/log-stream-context";
import { useComponents } from "@/hooks/useComponents";
import { useFunctions } from "./hooks/useFunctions";
import { useLocalLogStore } from "./hooks/useLocalLogStore";
import { useDeploymentAuditLogs } from "./hooks/useDeploymentAuditLogs";
import { useTeamMembers } from "./hooks/useTeamMembers";

// Components
import { LogsToolbar } from "./components/LogsToolbar";
import { LogRow } from "./components/LogRow";
import { LogsSkeletonList } from "./components/LogRowSkeleton";
import { LogDetailSheet } from "./components/LogDetailSheet";
import { DeploymentEventListItem } from "./components/DeploymentEventListItem";
import { HistoricalLogsView } from "./components/HistoricalLogsView";

// Utils
import { exportLogsToFile } from "./utils/log-export";
import { interleaveLogs, getInterleavedLogKey } from "./utils/interleaveLogs";
import { useKeyboardNavigation } from "./utils/keyboard-navigation";

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
  const {
    deploymentUrl,
    useMockData,
    adminClient,
    accessToken,
    deployment,
    teamId,
  } = useDeployment();

  // Get deployment ID for storage
  const deploymentId = deployment?.id?.toString() || deploymentUrl || "unknown";

  // Historical logs modal state
  const [showHistoricalLogs, setShowHistoricalLogs] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<LogFilters>(initialFilters);

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

  // Track if we've completed initial load
  const hasCompletedInitialLoad = useRef(false);

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

  // Local SQLite log store hook
  const {
    ingestLogs: ingestToSqlite,
    stats: localStats,
    settings: logStoreSettings,
  } = useLocalLogStore();

  // Compute effective pause state
  const isDetailOpen = selectedLog !== null;
  const effectiveIsPaused = manuallyPaused || (isScrolledAway && !isDetailOpen);

  // Logs hook - uses centralized log stream context
  const { logs: rawLogs, isConnected, error, clearLogs } = useLogStream();

  // Derive isLoading from connection state (loading until first connection)
  const isLoading = !isConnected && rawLogs.length === 0;

  // Track when initial load completes
  useEffect(() => {
    if (!isLoading) {
      hasCompletedInitialLoad.current = true;
    }
  }, [isLoading]);

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

  // Fetch team members for resolving deployment event author names
  const { members: teamMembers } = useTeamMembers({
    accessToken,
    teamId,
    enabled: !useMockData && !!teamId && !!accessToken,
  });

  // Deployment audit logs hook
  // Fetch deployment events from the last 24 hours
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
  const { events: deploymentEvents } = useDeploymentAuditLogs({
    adminClient,
    fromTimestamp: twentyFourHoursAgo,
    enabled: !useMockData && !!adminClient, // Enable when we have a real admin client
    teamMembers,
  });

  // Persist new logs to SQLite storage when enabled
  const prevLogsLengthRef = useRef(0);
  useEffect(() => {
    // Only ingest if storage is enabled
    if (!logStoreSettings?.enabled) {
      prevLogsLengthRef.current = logs.length;
      return;
    }

    if (logs.length > prevLogsLengthRef.current) {
      // Get NEW logs (from previous length to end)
      const newLogs = logs.slice(prevLogsLengthRef.current);
      if (newLogs.length > 0) {
        console.log(
          `[LogsView] Auto-storing ${newLogs.length} new logs to SQLite`,
        );
        // Ingest to SQLite (fire-and-forget, non-blocking)
        ingestToSqlite(newLogs, deploymentId)
          .then((result) => {
            console.log(
              `[LogsView] Successfully ingested ${result.inserted} logs (${result.duplicates} duplicates, ${result.errors} errors)`,
            );
          })
          .catch((err) => {
            console.error("[LogsView] Failed to ingest to SQLite:", err);
          });
      }
    }
    prevLogsLengthRef.current = logs.length;
  }, [logs, ingestToSqlite, deploymentId, logStoreSettings?.enabled]);

  // Interleave logs and deployment events
  const interleavedLogs = useMemo(() => {
    // Both logs and deploymentEvents are sorted descending (newest first)
    // but interleaveLogs expects ascending (oldest first), so reverse them
    const logsAscending = [...logs].reverse();
    const eventsAscending = [...(deploymentEvents || [])].reverse();

    // Interleave in ascending order, then reverse the result back to descending
    const interleaved = interleaveLogs(logsAscending, eventsAscending, []);
    return interleaved.reverse();
  }, [logs, deploymentEvents]);

  // Filter logs based on current filter state
  const filteredLogs = useMemo(() => {
    return interleavedLogs.filter((item) => {
      // Deployment events always pass through (no filtering for now)
      if (item.kind === "DeploymentEvent") {
        return true;
      }

      // ClearedLogs markers always pass through
      if (item.kind === "ClearedLogs") {
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
          log.logLines?.some((line: string) =>
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
  }, [interleavedLogs, filters]);

  // Extract just log entries for keyboard navigation (exclude deployment events)
  const navigableLogs = useMemo(() => {
    return filteredLogs
      .filter(
        (item) =>
          item.kind !== "DeploymentEvent" && item.kind !== "ClearedLogs",
      )
      .map((item) => item.executionLog);
  }, [filteredLogs]);

  // Keyboard navigation
  useKeyboardNavigation({
    items: navigableLogs,
    selectedItem: selectedLog,
    onSelectItem: setSelectedLog,
    isDetailOpen: !!selectedLog,
    onCloseDetail: () => setSelectedLog(null),
  });

  // Handle pause toggle
  const handleTogglePause = useCallback(() => {
    if (effectiveIsPaused) {
      // Resume: scroll to top and unpause
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
    const logsToExport = filteredLogs
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
  }, [filteredLogs, deploymentId]);

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
          logCount={filteredLogs.length}
          isLoading={isLoading}
          components={components}
          functions={functions}
          onSearchChange={handleSearchChange}
          localLogCount={localStats?.total_logs}
          onViewStorage={() => setShowHistoricalLogs(true)}
        />

        {/* Logs list */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          {/* Log header row - matches dashboard-common format */}
          <div
            className="flex items-center px-4 py-2 text-xs sticky top-0 z-10 h-[41px]"
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

          {/* Container for logs and detail sheet */}
          <div className="relative h-[calc(100%-41px)]">
            {/* Scrollable logs */}
            <div
              ref={logsListRef}
              onScroll={handleLogsScroll}
              className="h-full overflow-auto bg-background-base"
            >
              {isLoading && !hasCompletedInitialLoad.current ? (
                // Show skeleton while initial log load is in progress
                <LogsSkeletonList count={25} />
              ) : filteredLogs.length === 0 ? (
                <div
                  className="flex items-center justify-center h-full text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  No logs to display
                </div>
              ) : (
                filteredLogs.map((item) => {
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

                  if (item.kind === "ClearedLogs") {
                    // Render a "logs cleared" marker (can be implemented later)
                    return null;
                  }

                  // ExecutionLog
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

            {/* Detail sheet - rendered inside logs container below header */}
            {selectedLog && (
              <LogDetailSheet
                log={selectedLog}
                allLogs={logs}
                onClose={handleCloseDetail}
              />
            )}
          </div>
        </div>
      </div>

      {/* Historical Logs Modal */}
      {showHistoricalLogs && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          onClick={() => setShowHistoricalLogs(false)}
        >
          <div
            className="relative w-[95vw] h-[90vh] !rounded-2xl overflow-hidden border border-border-base"
            style={{ backgroundColor: "var(--color-surface-base)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <HistoricalLogsView
              deploymentId={deploymentId}
              onClose={() => setShowHistoricalLogs(false)}
            />
          </div>
        </div>
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
