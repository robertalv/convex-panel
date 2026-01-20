import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Trash2, Code, Pause, Play } from "lucide-react";
import { useScheduledJobs, useCronJobs, useScheduleActions } from "./hooks";
import {
  EmptyScheduledJobsState,
  EmptyCronJobsState,
  ScheduledJobsTable,
  CronJobsTable,
  ScheduledJobArgumentsSheet,
  CronJobDetailSheet,
  CronsFileSheet,
} from "./components";
import { ToolbarButton } from "@/components/ui/button";
import { Toolbar } from "@/components/ui/toolbar";
import { ComponentSelector } from "@/components/component-selector";
import {
  FunctionSelector,
  isCustomQuery,
} from "@/components/function-selector";
import type {
  SelectedFunction,
  ModuleFunction,
} from "@/components/function-selector";
import { useComponents } from "@/views/data/hooks/useComponents";
import { useFunctions } from "@/views/data/hooks/useFunctions";
import { useDeployment } from "@/contexts/deployment-context";
import type { CronJobWithRuns } from "@convex-panel/shared";

type TabType = "scheduled" | "cron";

type SheetType = "scheduledArgs" | "cronDetail" | "cronsFile" | null;

interface SheetState {
  type: SheetType;
  data?: any;
}

export function SchedulesView() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<TabType>("scheduled");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [sheetState, setSheetState] = useState<SheetState>({ type: null });
  const containerRef = useRef<HTMLDivElement>(null);
  const [tableHeight, setTableHeight] = useState(600);

  // Track previous component IDs to detect actual user changes
  const prevComponentIdsRef = useRef<(string | null)[] | null>(null);

  // Deployment context
  const { adminClient, useMockData = false } = useDeployment();

  // Component selection
  const { components, isLoading: isLoadingComponents } = useComponents({
    adminClient,
    useMockData,
  });

  // Single component state
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    null,
  );

  // Track if components have been initialized (set once on first load)
  const [componentsInitialized, setComponentsInitialized] = useState(false);

  // Initialize to null (root/all) when components are loaded
  useEffect(() => {
    // Wait for components to finish loading before initializing
    if (isLoadingComponents) {
      return;
    }

    // Only initialize once when components first load
    if (!componentsInitialized && components.length >= 0) {
      console.log("[SchedulesView] Initializing component to null (all)", {
        components: components.map((c) => ({
          id: c.id,
          name: c.name,
          path: c.path,
        })),
      });
      setSelectedComponentId(null);
      setComponentsInitialized(true);
    }
  }, [components, isLoadingComponents, componentsInitialized]);

  // Use the selected component ID directly
  const primaryComponentId = selectedComponentId;

  // Function discovery
  const { functions, isLoading: isLoadingFunctions } = useFunctions({
    adminClient,
    useMockData,
  });

  // Selected function state (single select)
  const [selectedFunction, setSelectedFunction] =
    useState<SelectedFunction>(null);

  // Track if functions have been initialized (set once on first load)
  const [functionsInitialized, setFunctionsInitialized] = useState(false);

  // Initialize with null (all functions) by default
  useEffect(() => {
    // Wait for functions to finish loading before initializing
    if (isLoadingFunctions) {
      return;
    }

    // Only initialize once when functions first load
    if (!functionsInitialized && functions.length >= 0) {
      setSelectedFunction(null);
      setFunctionsInitialized(true);
    }
  }, [functions, functionsInitialized, isLoadingFunctions]);

  // Create a mapping from component ID to component name/path
  // Since functions store component name/path in their componentId field
  const componentIdToNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const comp of components) {
      if (comp.id && comp.name) {
        map[comp.id] = comp.name;
      } else if (comp.id && comp.path) {
        map[comp.id] = comp.path;
      }
    }
    return map;
  }, [components]);

  // Helper to check if a function belongs to a component
  // Checks both componentId field and identifier prefix
  // Note: functions store component NAME in their componentId field,
  // but we're passed the component ID, so we need to map it
  const functionBelongsToComponent = useCallback(
    (fn: ModuleFunction, componentId: string | null): boolean => {
      // For root app (null)
      if (componentId === null) {
        return fn.componentId === null || fn.componentId === undefined;
      }

      // Get the component name/path for this ID
      const componentName = componentIdToNameMap[componentId];

      // Check if function's componentId matches the component name
      if (componentName && fn.componentId === componentName) {
        return true;
      }

      // Check componentId field directly (in case it's already the name)
      if (fn.componentId === componentId) {
        return true;
      }

      // Check identifier prefix (for backward compatibility)
      if (
        fn.identifier &&
        componentName &&
        fn.identifier.startsWith(`${componentName}:`)
      ) {
        return true;
      }

      if (fn.identifier && fn.identifier.startsWith(`${componentId}:`)) {
        return true;
      }

      return false;
    },
    [componentIdToNameMap],
  );

  // Get functions that belong to selected component
  const functionsForSelectedComponent = useMemo(() => {
    if (selectedComponentId === null) {
      // null means all components
      return functions;
    }

    return functions.filter((fn) =>
      functionBelongsToComponent(fn, selectedComponentId),
    );
  }, [functions, selectedComponentId, functionBelongsToComponent]);

  // When component selection changes after initialization, sync function selection
  // Only run this after both components and functions are initialized
  useEffect(() => {
    // Skip until both are initialized
    if (!functionsInitialized || !componentsInitialized) {
      return;
    }

    // Check if component selection actually changed (user interaction)
    const prevId = prevComponentIdsRef.current?.[0] ?? null;

    // Initialize the ref on first run after both initialized
    if (prevComponentIdsRef.current === null) {
      console.log("[SchedulesView] Initializing component sync ref", {
        selectedComponentId,
      });
      prevComponentIdsRef.current = [selectedComponentId];
      return; // Don't sync on initial setup
    }

    const hasChanged = prevId !== selectedComponentId;

    console.log("[SchedulesView] Component sync effect triggered", {
      prevId,
      selectedComponentId,
      hasChanged,
    });

    // If component selection didn't change, don't sync
    if (!hasChanged) {
      return;
    }

    // When component changes, reset function to null (all functions)
    console.log(
      "[SchedulesView] Resetting function selection for component change",
    );

    setSelectedFunction(null);
    prevComponentIdsRef.current = [selectedComponentId];
  }, [
    selectedComponentId,
    functionsForSelectedComponent,
    functionsInitialized,
    componentsInitialized,
    functions,
    functionBelongsToComponent,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // Compute udfPath for filtering (only when a single function is selected)
  const udfPath = useMemo(() => {
    if (!selectedFunction || isCustomQuery(selectedFunction)) return undefined;
    return selectedFunction.identifier;
  }, [selectedFunction]);

  // Fetch data based on selected tab
  const { jobs: scheduledJobs, isLoading: isLoadingScheduled } =
    useScheduledJobs({
      enabled: selectedTab === "scheduled" && !isPaused,
      udfPath,
      componentId: primaryComponentId,
    });

  const {
    cronJobs,
    cronJobRuns,
    cronsModulePath,
    isLoading: isLoadingCron,
  } = useCronJobs({
    enabled: selectedTab === "cron" && !isPaused,
    componentId: primaryComponentId,
  });

  const { cancelJob, cancelAllJobs, isCanceling } = useScheduleActions();

  // Filter scheduled jobs - API filtering handles single function selection via udfPath
  const filteredScheduledJobs = scheduledJobs;

  // Filter cron jobs - show all when no function or null selected
  const filteredCronJobs = cronJobs;

  // Calculate available height for table
  useEffect(() => {
    if (!containerRef.current) return;

    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Subtract toolbar (56px) + tabs (49px) + padding
        const availableHeight = rect.height - 105;
        if (availableHeight > 0) {
          setTableHeight(availableHeight);
        }
      }
    };

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(containerRef.current);
    updateHeight();

    return () => resizeObserver.disconnect();
  }, []);

  const isLoading =
    selectedTab === "scheduled" ? isLoadingScheduled : isLoadingCron;
  const hasData =
    selectedTab === "scheduled"
      ? filteredScheduledJobs.length > 0
      : filteredCronJobs.length > 0;

  const handleCancelAll = () => {
    if (
      window.confirm(
        "Are you sure you want to cancel all scheduled jobs? This action cannot be undone.",
      )
    ) {
      cancelAllJobs({});
    }
  };

  const handleCancelJob = (jobId: string) => {
    if (window.confirm("Cancel this scheduled job?")) {
      cancelJob({ jobId });
    }
  };

  const handleViewArgs = (job: any) => {
    if (selectedTab === "scheduled") {
      setSheetState({ type: "scheduledArgs", data: job });
    } else {
      // For cron jobs, use the unified detail sheet
      setSheetState({ type: "cronDetail", data: job });
    }
  };

  const handleViewExecutions = (job: CronJobWithRuns) => {
    // Use the unified detail sheet for cron jobs
    setSheetState({ type: "cronDetail", data: job });
  };

  const handleViewCronsFile = () => {
    if (cronsModulePath) {
      setSheetState({ type: "cronsFile", data: cronsModulePath });
    }
  };

  const handleFunctionClick = (functionPath: string) => {
    navigate(`/functions?function=${encodeURIComponent(functionPath)}`);
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* Main content area */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
          backgroundColor: "var(--color-panel-bg)",
        }}
      >
        {/* Toolbar */}
        <Toolbar
          left={
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* Component selector */}
              {components.length > 1 && (
                <>
                  <ComponentSelector
                    multiSelect={false}
                    selectedComponentId={selectedComponentId}
                    onSelect={setSelectedComponentId}
                    components={components}
                    variant="inline"
                  />

                  {/* Divider */}
                  <div
                    style={{
                      width: "1px",
                      height: "16px",
                      backgroundColor: "var(--color-panel-border)",
                    }}
                  />
                </>
              )}

              {/* Function selector */}
              <FunctionSelector
                multiSelect={false}
                selectedFunction={selectedFunction}
                onSelect={setSelectedFunction}
                functions={functions}
                componentId={undefined}
                showCustomQuery={false}
                showAllFunctions={true}
                variant="inline"
              />

              {/* Divider */}
              <div
                style={{
                  width: "1px",
                  height: "16px",
                  backgroundColor: "var(--color-panel-border)",
                }}
              />

              {/* Search input */}
              <div style={{ minWidth: "200px", width: "300px" }}>
                <div className="cp-search-wrapper">
                  <Search size={14} className="cp-search-icon" />
                  <input
                    type="text"
                    placeholder={
                      selectedTab === "cron"
                        ? "Search by name..."
                        : "Search by ID..."
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="cp-search-input"
                  />
                </div>
              </div>
            </div>
          }
          right={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 400,
                  color: "var(--color-panel-text-muted)",
                }}
              >
                {selectedTab === "scheduled"
                  ? `Total Jobs ${filteredScheduledJobs.length}`
                  : `Total Crons ${filteredCronJobs.length}`}
              </span>

              {/* Divider */}
              <div
                style={{
                  width: "1px",
                  height: "16px",
                  backgroundColor: "var(--color-panel-border)",
                }}
              />

              <ToolbarButton
                onClick={() => setIsPaused(!isPaused)}
                variant="ghost"
              >
                {isPaused ? (
                  <>
                    <Play size={14} /> Resume
                  </>
                ) : (
                  <>
                    <Pause size={14} /> Pause
                  </>
                )}
              </ToolbarButton>
              {selectedTab === "scheduled" && (
                <ToolbarButton
                  onClick={handleCancelAll}
                  disabled={isCanceling || !hasData}
                  variant="destructive"
                >
                  <Trash2 size={12} />
                  Cancel All
                </ToolbarButton>
              )}
            </div>
          }
        />

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--color-panel-border)",
            backgroundColor: "var(--color-panel-bg)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <button
              onClick={() => setSelectedTab("scheduled")}
              style={{
                padding: "12px 16px",
                fontSize: "13px",
                fontWeight: 500,
                color:
                  selectedTab === "scheduled"
                    ? "var(--color-panel-text)"
                    : "var(--color-panel-text-muted)",
                background: "none",
                border: "none",
                borderBottom:
                  selectedTab === "scheduled"
                    ? "2px solid var(--color-panel-accent)"
                    : "2px solid transparent",
                cursor: "pointer",
                transition: "color 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (selectedTab !== "scheduled") {
                  e.currentTarget.style.color =
                    "var(--color-panel-text-secondary)";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedTab !== "scheduled") {
                  e.currentTarget.style.color = "var(--color-panel-text-muted)";
                }
              }}
            >
              Scheduled Functions
              {filteredScheduledJobs.length > 0 && (
                <span
                  style={{
                    marginLeft: "8px",
                    backgroundColor: "var(--color-panel-bg-secondary)",
                    padding: "2px 8px",
                    borderRadius: "9999px",
                    fontSize: "11px",
                    color: "var(--color-panel-text-muted)",
                  }}
                >
                  {filteredScheduledJobs.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setSelectedTab("cron")}
              style={{
                padding: "12px 16px",
                fontSize: "13px",
                fontWeight: 500,
                color:
                  selectedTab === "cron"
                    ? "var(--color-panel-text)"
                    : "var(--color-panel-text-muted)",
                background: "none",
                border: "none",
                borderBottom:
                  selectedTab === "cron"
                    ? "2px solid var(--color-panel-accent)"
                    : "2px solid transparent",
                cursor: "pointer",
                transition: "color 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (selectedTab !== "cron") {
                  e.currentTarget.style.color =
                    "var(--color-panel-text-secondary)";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedTab !== "cron") {
                  e.currentTarget.style.color = "var(--color-panel-text-muted)";
                }
              }}
            >
              Cron Jobs
              {filteredCronJobs.length > 0 && (
                <span
                  style={{
                    marginLeft: "8px",
                    backgroundColor: "var(--color-panel-bg-secondary)",
                    padding: "2px 8px",
                    borderRadius: "9999px",
                    fontSize: "11px",
                    color: "var(--color-panel-text-muted)",
                  }}
                >
                  {filteredCronJobs.length}
                </span>
              )}
            </button>
          </div>
          {selectedTab === "cron" && cronsModulePath && (
            <button
              onClick={handleViewCronsFile}
              style={{
                marginRight: "16px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                color: "var(--color-panel-info)",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              <Code size={12} />
              View {cronsModulePath}
            </button>
          )}
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {isLoading ? (
            <div
              style={{
                display: "flex",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-panel-text-muted)",
                fontSize: "14px",
              }}
            >
              Loading...
            </div>
          ) : !hasData || (searchQuery && !hasData) ? (
            selectedTab === "scheduled" ? (
              <EmptyScheduledJobsState searchQuery={searchQuery} />
            ) : (
              <EmptyCronJobsState searchQuery={searchQuery} />
            )
          ) : selectedTab === "scheduled" ? (
            <ScheduledJobsTable
              jobs={filteredScheduledJobs}
              height={tableHeight}
              searchQuery={searchQuery}
              onCancelJob={handleCancelJob}
              onViewArgs={handleViewArgs}
              onFunctionClick={handleFunctionClick}
            />
          ) : (
            <CronJobsTable
              cronJobs={filteredCronJobs}
              height={tableHeight}
              searchQuery={searchQuery}
              onRowClick={handleViewExecutions}
              onFunctionClick={handleFunctionClick}
            />
          )}
        </div>
      </div>

      {/* Sheet panels - slide in from right, push content left */}
      {sheetState.type === "scheduledArgs" && (
        <ScheduledJobArgumentsSheet
          isOpen={true}
          onClose={() => setSheetState({ type: null })}
          job={sheetState.data}
        />
      )}
      {sheetState.type === "cronDetail" && (
        <CronJobDetailSheet
          isOpen={true}
          onClose={() => setSheetState({ type: null })}
          cronJob={sheetState.data}
          allRuns={cronJobRuns}
        />
      )}
      {sheetState.type === "cronsFile" && (
        <CronsFileSheet
          isOpen={true}
          onClose={() => setSheetState({ type: null })}
          cronsModulePath={sheetState.data}
        />
      )}
    </div>
  );
}
