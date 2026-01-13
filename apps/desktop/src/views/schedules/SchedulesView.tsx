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
} from "@/views/data/components/FunctionSelector";
import type {
  SelectedFunction,
  ModuleFunction,
} from "@/views/data/components/FunctionSelector";
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

  // Multi-select component state
  const [selectedComponentIds, setSelectedComponentIds] = useState<
    (string | null)[]
  >([]);

  // Track if components have been initialized (set once on first load)
  const [componentsInitialized, setComponentsInitialized] = useState(false);

  // Initialize to all components when components are loaded
  useEffect(() => {
    // Wait for components to finish loading before initializing
    if (isLoadingComponents) {
      return;
    }

    // Only initialize once when components first load
    if (!componentsInitialized && components.length > 0) {
      console.log("[SchedulesView] Initializing components", {
        components: components.map((c) => ({
          id: c.id,
          name: c.name,
          path: c.path,
        })),
      });
      const allComponentIds = components.map((c) => c.id);
      setSelectedComponentIds(allComponentIds);
      setComponentsInitialized(true);
    }
  }, [components, isLoadingComponents, componentsInitialized]);

  // Get primary component ID (first selected or null for root)
  const primaryComponentId = selectedComponentIds[0] ?? null;

  // Function discovery
  const { functions, isLoading: isLoadingFunctions } = useFunctions({
    adminClient,
    useMockData,
  });

  // Selected functions state
  const [selectedFunctions, setSelectedFunctions] = useState<
    SelectedFunction[]
  >([]);

  // Track if functions have been initialized (set once on first load)
  const [functionsInitialized, setFunctionsInitialized] = useState(false);

  // Initialize with all functions selected by default
  useEffect(() => {
    // Wait for functions to finish loading before initializing
    if (isLoadingFunctions) {
      return;
    }

    // Only initialize once when functions first load
    if (!functionsInitialized && functions.length > 0) {
      setSelectedFunctions(functions);
      setFunctionsInitialized(true);
    }
  }, [functions, functionsInitialized, isLoadingFunctions]);

  // Type guard to check if a selected function is a ModuleFunction
  const isModuleFunction = (fn: SelectedFunction): fn is ModuleFunction => {
    return fn !== null && !isCustomQuery(fn);
  };

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

  // Get functions that belong to selected components
  const functionsForSelectedComponents = useMemo(() => {
    if (selectedComponentIds.length === 0) {
      return [];
    }

    return functions.filter((fn) =>
      selectedComponentIds.some((compId) =>
        functionBelongsToComponent(fn, compId),
      ),
    );
  }, [functions, selectedComponentIds, functionBelongsToComponent]);

  // When component selection changes after initialization, sync function selection
  // Only run this after both components and functions are initialized
  useEffect(() => {
    // Skip until both are initialized
    if (!functionsInitialized || !componentsInitialized) {
      return;
    }

    // Skip if components haven't been set yet
    if (selectedComponentIds.length === 0) {
      return;
    }

    // Skip if functions haven't been set yet
    if (selectedFunctions.length === 0) {
      return;
    }

    // Check if component selection actually changed (user interaction)
    const prevIds = prevComponentIdsRef.current;

    // Initialize the ref on first run after both initialized
    if (prevIds === null) {
      console.log("[SchedulesView] Initializing component sync ref", {
        selectedComponentIds,
        selectedFunctionsCount: selectedFunctions.length,
      });
      prevComponentIdsRef.current = [...selectedComponentIds];
      return; // Don't sync on initial setup
    }

    const hasChanged =
      prevIds.length !== selectedComponentIds.length ||
      !prevIds.every((id, i) => id === selectedComponentIds[i]);

    console.log("[SchedulesView] Component sync effect triggered", {
      prevIds,
      selectedComponentIds,
      hasChanged,
      selectedFunctionsCount: selectedFunctions.length,
    });

    // If component selection didn't change, don't sync
    if (!hasChanged) {
      return;
    }

    // Build new selection based on component changes:
    // 1. Keep functions from selected components that are currently selected
    // 2. Remove functions from deselected components
    // 3. Add functions from newly selected components

    // Get set of currently selected component IDs
    const currentComponentIds = new Set(selectedComponentIds);
    const previousComponentIds = new Set(prevIds);

    // Find newly selected components (in current but not in previous)
    const newlySelectedComponents = selectedComponentIds.filter(
      (id) => !previousComponentIds.has(id),
    );

    // Find newly deselected components (in previous but not in current)
    const deselectedComponents = prevIds.filter(
      (id) => !currentComponentIds.has(id),
    );

    console.log("[SchedulesView] Component changes detected", {
      newlySelectedComponents,
      deselectedComponents,
      componentIdToNameMap,
      deselectedComponentNames: deselectedComponents.map((id) =>
        id === null ? "root" : componentIdToNameMap[id] || id,
      ),
    });

    // Start with current selection
    let newSelection = [...selectedFunctions];

    // Remove functions from deselected components
    if (deselectedComponents.length > 0) {
      const beforeRemoval = newSelection.length;

      // Debug: Check what functions we have and their component IDs
      console.log("[SchedulesView] Sample of current functions:", {
        deselectedComponents,
        deselectedComponentNames: deselectedComponents.map((id) =>
          id === null ? "root" : componentIdToNameMap[id] || id,
        ),
        sampleFunctions: newSelection.slice(0, 10).map((fn) => {
          if (!fn || isCustomQuery(fn)) return { type: "custom-query" };
          const moduleFn = fn as ModuleFunction;
          const belongsToDeselected = deselectedComponents.some((compId) =>
            functionBelongsToComponent(moduleFn, compId),
          );
          return {
            identifier: moduleFn.identifier,
            componentId: moduleFn.componentId,
            belongsToDeselected,
            matchesAgainst: deselectedComponents.map((compId) => ({
              compId,
              compName:
                compId === null
                  ? "root"
                  : componentIdToNameMap[compId] || compId,
              matches: functionBelongsToComponent(moduleFn, compId),
            })),
          };
        }),
      });

      newSelection = newSelection.filter((fn) => {
        if (!fn || isCustomQuery(fn)) return true;
        // Keep function if it doesn't belong to any deselected component
        const belongsToDeselected = deselectedComponents.some((compId) =>
          functionBelongsToComponent(fn as ModuleFunction, compId),
        );
        if (belongsToDeselected) {
          console.log("[SchedulesView] Removing function", {
            identifier: (fn as ModuleFunction).identifier,
            componentId: (fn as ModuleFunction).componentId,
            deselectedComponents,
          });
        }
        return !belongsToDeselected;
      });
      console.log(
        "[SchedulesView] After removing deselected component functions",
        {
          beforeRemoval,
          afterRemoval: newSelection.length,
          removed: beforeRemoval - newSelection.length,
        },
      );
    }

    // Add functions from newly selected components
    if (newlySelectedComponents.length > 0) {
      // Get all functions from newly selected components
      const functionsToAdd = functions.filter((fn) =>
        newlySelectedComponents.some((compId) =>
          functionBelongsToComponent(fn, compId),
        ),
      );

      console.log(
        "[SchedulesView] Functions to add from newly selected components",
        {
          count: functionsToAdd.length,
          identifiers: functionsToAdd.map((f) => f.identifier).slice(0, 5),
        },
      );

      // Add functions that aren't already in selection
      const currentIdentifiers = new Set(
        newSelection
          .filter(isModuleFunction)
          .map((fn) => (fn as ModuleFunction).identifier),
      );

      const beforeAddition = newSelection.length;
      for (const fn of functionsToAdd) {
        if (!currentIdentifiers.has(fn.identifier)) {
          newSelection.push(fn);
          currentIdentifiers.add(fn.identifier);
        }
      }
      console.log(
        "[SchedulesView] After adding newly selected component functions",
        {
          beforeAddition,
          afterAddition: newSelection.length,
          added: newSelection.length - beforeAddition,
        },
      );
    }

    // Update selection if it changed
    const selectionChanged =
      newSelection.length !== selectedFunctions.length ||
      !newSelection.every((fn, i) => {
        const selectedFn = selectedFunctions[i];
        if (!fn || !selectedFn) return fn === selectedFn;
        if (isCustomQuery(fn) !== isCustomQuery(selectedFn)) return false;
        if (isCustomQuery(fn)) return true;
        return (
          (fn as ModuleFunction).identifier ===
          (selectedFunctions[i] as ModuleFunction).identifier
        );
      });

    console.log("[SchedulesView] Checking if selection changed", {
      oldCount: selectedFunctions.length,
      newCount: newSelection.length,
      selectionChanged,
    });

    if (selectionChanged) {
      console.log("[SchedulesView] Updating function selection", {
        from: selectedFunctions.length,
        to: newSelection.length,
      });
      setSelectedFunctions(newSelection);
      // Update the ref AFTER successful update
      prevComponentIdsRef.current = [...selectedComponentIds];
    } else {
      // Even if selection didn't change, update ref so we don't keep re-processing
      prevComponentIdsRef.current = [...selectedComponentIds];
    }
  }, [
    selectedComponentIds,
    functionsForSelectedComponents,
    functionsInitialized,
    componentsInitialized,
    selectedFunctions,
    functions,
    functionBelongsToComponent,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // Compute udfPath for filtering (only when a single function is selected)
  const udfPath = useMemo(() => {
    if (selectedFunctions.length !== 1) return undefined;
    const selected = selectedFunctions[0];
    if (!selected || isCustomQuery(selected)) return undefined;
    return selected.identifier;
  }, [selectedFunctions]);

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

  // Helper to normalize function identifiers (remove .js extensions)
  const normalizeIdentifier = (id: string) =>
    id.replace(/\.js:/g, ":").replace(/\.js$/g, "");

  // Filter scheduled jobs based on selected functions
  const filteredScheduledJobs = useMemo(() => {
    if (selectedFunctions.length <= 1) {
      // When 0 or 1 function selected, the API filtering handles it
      return scheduledJobs;
    }

    // When multiple functions selected, filter client-side
    const selectedIdentifiers = new Set(
      selectedFunctions
        .filter(isModuleFunction)
        .map((fn) => normalizeIdentifier(fn.identifier)),
    );

    return scheduledJobs.filter((job: any) => {
      const jobUdfPath = job.udfPath || job.component;
      if (!jobUdfPath) return false;
      const normalizedJobPath = normalizeIdentifier(jobUdfPath);
      return selectedIdentifiers.has(normalizedJobPath);
    });
  }, [scheduledJobs, selectedFunctions]);

  // Filter cron jobs based on selected functions
  const filteredCronJobs = useMemo(() => {
    if (selectedFunctions.length === 0) {
      // When no functions selected, show all
      return cronJobs;
    }

    const validFunctions = selectedFunctions.filter(isModuleFunction);

    if (validFunctions.length === 0) {
      return cronJobs;
    }

    const selectedIdentifiers = new Set(
      validFunctions.map((fn) => normalizeIdentifier(fn.identifier)),
    );

    // Check if all available cron functions are selected (show all in that case)
    const availableCronFunctions = cronJobs
      .map((job) => job.cronSpec?.udfPath)
      .filter(Boolean);
    const allFunctionsSelected =
      availableCronFunctions.length > 0 &&
      availableCronFunctions.every((udfPath) => {
        if (!udfPath) return false;
        const normalized = normalizeIdentifier(udfPath);
        return selectedIdentifiers.has(normalized);
      });

    if (allFunctionsSelected) {
      return cronJobs;
    }

    // Filter cron jobs
    return cronJobs.filter((job) => {
      const cronUdfPath = job.cronSpec?.udfPath;
      if (!cronUdfPath) return false;
      const normalizedCronUdfPath = normalizeIdentifier(cronUdfPath);
      return selectedIdentifiers.has(normalizedCronUdfPath);
    });
  }, [cronJobs, selectedFunctions]);

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
          padding="8px"
          className="gap-2 flex-shrink-0"
          style={{
            borderBottomColor: "var(--color-panel-border)",
            backgroundColor: "var(--color-panel-bg)",
          }}
          left={
            <>
              {/* Component Selector */}
          {components.length > 1 && (
            <div style={{ width: "240px" }}>
              <ComponentSelector
                multiSelect={true}
                selectedComponentId={selectedComponentIds}
                onSelect={setSelectedComponentIds}
                components={components}
                variant="input"
              />
            </div>
          )}

          {/* Function Selector */}
          <div style={{ width: "240px" }}>
            <FunctionSelector
              multiSelect={true}
              selectedFunction={selectedFunctions}
              onSelect={setSelectedFunctions}
              functions={functions}
              componentId={undefined}
              showCustomQuery={false}
            />
          </div>

          {/* Search */}
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
            </>
          }
          right={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
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
