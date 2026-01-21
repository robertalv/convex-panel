import React, { useState, useEffect, useRef, useCallback } from "react";
import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import {
  PanelLeftOpen,
  ToggleLeft,
  ToggleRight,
  Save,
  ExternalLink,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { toast } from "sonner";
import { useDeployment } from "@/contexts/deployment-context";
import { useTheme } from "@/contexts/theme-context";
import { useProjectPathOptional } from "@/contexts/project-path-context";
import { openInEditor } from "@/utils/editor";
import { useFunctions } from "./hooks/useFunctions";
import { useLocalSourceCode } from "./hooks/useLocalSourceCode";
import { useLogStream } from "@/contexts/log-stream-context";
import { EmptyFunctionsState } from "./components/EmptyFunctionsState";
import { HealthCard } from "@/components/ui";
import { FunctionsSidebar } from "./components/FunctionsSidebar";
import { FunctionsToolbar } from "./components/FunctionsToolbar";
import { FunctionExecutionDetailSheet } from "./components/FunctionExecutionDetailSheet";
import { ResizableSheet } from "../data/components/ResizableSheet";
import {
  CustomQuerySheet,
  type FunctionRunnerLayout,
} from "../data/components/CustomQuerySheet";
import { useComponents } from "../data/hooks/useComponents";
import type {
  FunctionItem,
  OrganizationMode,
} from "./components/FunctionsSidebar";
import {
  fetchUdfExecutionStats,
  aggregateFunctionStats,
  fetchSourceCode,
  type ModuleFunction,
  type FunctionExecutionLog,
  type FetchFn,
} from "@convex-panel/shared/api";

// Use Tauri's fetch for CORS-free requests
const desktopFetch: FetchFn = (input, init) => tauriFetch(input, init);

type TabType = "statistics" | "code" | "logs";

const FunctionsView: React.FC = () => {
  const { deployment, deploymentUrl, authToken, adminClient, useMockData } =
    useDeployment();
  const { resolvedTheme } = useTheme();
  const projectPathContext = useProjectPathOptional();
  const projectPath = projectPathContext?.projectPath ?? null;
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedFunction, setSelectedFunction] =
    useState<ModuleFunction | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("statistics");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [organizationMode, setOrganizationMode] =
    useState<OrganizationMode>("byModule");

  // Component selection
  const {
    components,
    selectedComponentId,
    selectedComponent,
    setSelectedComponent,
    isLoading: componentsLoading,
  } = useComponents({
    adminClient,
    useMockData,
  });

  // Get component name for filtering functions (functions use component name, not ID)
  const componentName = selectedComponent?.name ?? null;

  const { groupedFunctions, isLoading } = useFunctions({
    adminClient,
    useMockData,
    componentId: componentName,
    deploymentId: deployment?.id?.toString(),
  });

  const [invocationData, setInvocationData] = useState<number[]>([]);
  const [executionTimeData, setExecutionTimeData] = useState<number[]>([]);
  const [errorData, setErrorData] = useState<number[]>([]);
  const [cacheHitData, setCacheHitData] = useState<number[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  const [sourceCode, setSourceCode] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);

  // Logs state
  const [logs, setLogs] = useState<FunctionExecutionLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const [isScrolledAway, setIsScrolledAway] = useState(false);
  const logsScrollRef = useRef<HTMLDivElement | null>(null);
  const scrollStateRef = useRef<{
    isScrolledAway: boolean;
    rafId: number | null;
  }>({
    isScrolledAway: false,
    rafId: null,
  });

  // Detail sheet state
  const [selectedExecution, setSelectedExecution] =
    useState<FunctionExecutionLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Monaco editor ref for scrolling to function
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  // Function runner state
  const [showFunctionRunner, setShowFunctionRunner] = useState(false);
  const [functionRunnerLayout, setFunctionRunnerLayout] =
    useState<FunctionRunnerLayout>("side");

  // Setup Monaco themes before mount
  const handleEditorWillMount: BeforeMount = useCallback((monaco) => {
    // Disable TypeScript semantic validation to avoid "Cannot find module" errors
    // since we're viewing standalone files without the full project context
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false, // Keep syntax validation for basic error highlighting
    });

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    });

    monaco.editor.defineTheme("convex-light", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#00000000", // Transparent to use CSS --color-background-base
      },
    });

    monaco.editor.defineTheme("convex-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#00000000", // Transparent to use CSS --color-background-base
      },
    });
  }, []);

  // Handle Monaco editor mount - store ref for scrolling
  const handleEditorDidMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
  }, []);

  // Find the line number for the selected function in the source code
  const functionLineNumber = React.useMemo(() => {
    if (!sourceCode || !selectedFunction?.name) return null;

    const functionName = selectedFunction.name;
    const lines = sourceCode.split("\n");

    // Look for common function definition patterns:
    // export const functionName = query(...)
    // export const functionName = mutation(...)
    // export const functionName = action(...)
    // export const functionName = internalQuery(...)
    // export default functionName
    // const functionName = ...
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Match: export const/let/var functionName =
      // or: const/let/var functionName =
      // or: export default functionName
      // or: export { functionName }
      const patterns = [
        new RegExp(`\\bexport\\s+(const|let|var)\\s+${functionName}\\s*=`),
        new RegExp(`\\b(const|let|var)\\s+${functionName}\\s*=`),
        new RegExp(`\\bexport\\s+default\\s+${functionName}\\b`),
        new RegExp(`\\bexport\\s+\\{[^}]*\\b${functionName}\\b`),
        new RegExp(`\\bfunction\\s+${functionName}\\s*\\(`),
        new RegExp(
          `\\b${functionName}\\s*:\\s*(query|mutation|action|internalQuery|internalMutation|internalAction|httpAction)\\s*\\(`,
        ),
      ];

      for (const pattern of patterns) {
        if (pattern.test(line)) {
          return i + 1; // Line numbers are 1-indexed
        }
      }
    }

    return null;
  }, [sourceCode, selectedFunction?.name]);

  // Scroll editor to the function when source code loads or function changes
  useEffect(() => {
    if (editorRef.current && functionLineNumber && sourceCode) {
      // Small delay to ensure editor has rendered the content
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.revealLineInCenter(functionLineNumber);
          // Also set cursor position at the function
          editorRef.current.setPosition({
            lineNumber: functionLineNumber,
            column: 1,
          });
        }
      }, 100);
    }
  }, [functionLineNumber, sourceCode]);

  // Convert ModuleFunction[] to FunctionItem[] for sidebar
  const sidebarFunctions: FunctionItem[] = groupedFunctions.flatMap((group) =>
    group.functions.map((func) => ({
      name: func.name,
      identifier: func.identifier,
      type: func.udfType.toLowerCase() as FunctionItem["type"],
      lastDeploy: undefined,
      source: func.file?.path,
    })),
  );

  // Handle URL query parameters to select component and function on mount
  useEffect(() => {
    const componentParam = searchParams.get("component");
    const functionParam = searchParams.get("function");

    // Step 1: Handle component switching if needed
    if (componentParam && components.length > 0 && !componentsLoading) {
      // Find the component by path or name (with flexible matching)
      const targetComponent = components.find((c) => {
        // Exact matches
        if (c.path === componentParam || c.name === componentParam) return true;

        // Case-insensitive matches
        const paramLower = componentParam.toLowerCase();
        if (
          c.path?.toLowerCase() === paramLower ||
          c.name?.toLowerCase() === paramLower
        )
          return true;

        // Try matching with kebab-case to camelCase conversion
        // e.g., "oss-stats" -> "ossStats"
        const camelCase = componentParam.replace(/-([a-z])/g, (_, letter) =>
          letter.toUpperCase(),
        );
        if (c.path === camelCase || c.name === camelCase) return true;

        // Try matching with camelCase to kebab-case conversion
        // e.g., "ossStats" -> "oss-stats"
        const kebabCase = componentParam
          .replace(/([A-Z])/g, (letter) => `-${letter.toLowerCase()}`)
          .replace(/^-/, "");
        if (c.path === kebabCase || c.name === kebabCase) return true;

        return false;
      });

      if (targetComponent) {
        // Check if we need to switch components
        const needsSwitch = selectedComponentId !== targetComponent.id;

        if (needsSwitch) {
          // Switch to the target component
          setSelectedComponent(targetComponent.id);
          // Don't clear params yet - wait for component to switch and functions to load
          return;
        }

        // Component is already selected, clear the param now
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("component");
        setSearchParams(newParams);
      } else {
        // Component not found, clear the param
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("component");
        setSearchParams(newParams);
      }
    }

    // Step 2: Handle function selection after component is correct
    // Only proceed if there's no pending component switch (componentParam is cleared)
    if (
      !componentParam &&
      functionParam &&
      groupedFunctions.length > 0 &&
      !selectedFunction
    ) {
      // Normalize the function parameter by removing .js extension if present
      let normalizedParam = functionParam.replace(/\.js$/, "");

      // If the function param includes a component path prefix, strip it
      // e.g., "ossStats/crons/public.js:del" -> "crons/public:del"
      if (
        selectedComponent?.name &&
        normalizedParam.startsWith(selectedComponent.name + "/")
      ) {
        normalizedParam = normalizedParam.substring(
          selectedComponent.name.length + 1,
        );
      }

      // Find the function in groupedFunctions by various matching strategies
      for (const group of groupedFunctions) {
        const func = group.functions.find((f) => {
          // Strategy 1: Exact identifier match
          if (f.identifier === functionParam) return true;

          // Strategy 2: Exact name match
          if (f.name === functionParam) return true;

          // Strategy 3: File path match
          if (f.file?.path === functionParam) return true;

          // Strategy 4: Normalized identifier match (without .js)
          const normalizedIdentifier = f.identifier.replace(/\.js$/, "");
          if (normalizedIdentifier === normalizedParam) return true;

          // Strategy 5: File path without .js match
          const normalizedFilePath = f.file?.path.replace(/\.js$/, "");
          if (normalizedFilePath === normalizedParam) return true;

          // Strategy 6: Identifier without export name matches param
          // e.g., "api/tasks.js:processTask" matches "api/tasks"
          const identifierBase = f.identifier
            .split(":")[0]
            .replace(/\.js$/, "");
          if (identifierBase === normalizedParam) return true;

          // Strategy 7: Match with :default appended
          // e.g., param "api/tasks" matches identifier "api/tasks:default"
          if (f.identifier === `${normalizedParam}:default`) return true;
          if (f.identifier === `${normalizedParam}.js:default`) return true;

          // Strategy 8: Match param with :default appended to identifier base
          // e.g., param "api/tasks:myFunc" matches if identifier has that base
          if (normalizedParam.includes(":")) {
            const paramBase = normalizedParam.split(":")[0];
            const paramExport = normalizedParam.split(":")[1];
            const funcBase = f.identifier.split(":")[0].replace(/\.js$/, "");
            const funcExport = f.identifier.split(":")[1];
            if (funcBase === paramBase && funcExport === paramExport)
              return true;
          }

          return false;
        });

        if (func) {
          setSelectedFunction(func);
          // Remove the query parameter after selecting
          setSearchParams({});
          break;
        }
      }
    }
  }, [
    groupedFunctions,
    searchParams,
    selectedFunction,
    setSearchParams,
    components,
    componentsLoading,
    selectedComponentId,
    setSelectedComponent,
  ]);

  // Fetch statistics when function is selected
  useEffect(() => {
    if (
      !selectedFunction ||
      !deploymentUrl ||
      !authToken ||
      useMockData ||
      activeTab !== "statistics"
    ) {
      return;
    }

    const fetchStats = async () => {
      // Only fetch when tab is visible
      if (document.visibilityState !== "visible") {
        return;
      }

      setStatsLoading(true);
      try {
        const now = Math.floor(Date.now() / 1000);
        const thirtyMinutesAgo = now - 1800;

        const getFunctionPath = () => {
          if (selectedFunction.identifier.includes(":")) {
            return selectedFunction.identifier.split(":")[0];
          }
          return selectedFunction.identifier;
        };

        const functionPath = getFunctionPath();

        const executionResponse = await fetchUdfExecutionStats(
          deploymentUrl,
          authToken,
          thirtyMinutesAgo * 1000,
          desktopFetch,
        ).catch(() => null);

        let invData: number[] = Array(30).fill(0);
        let execData: number[] = Array(30).fill(0);
        let cacheData: number[] = Array(30).fill(0);
        let errData: number[] = Array(30).fill(0);

        if (executionResponse && executionResponse.entries) {
          const aggregated = aggregateFunctionStats(
            executionResponse.entries,
            selectedFunction.identifier,
            selectedFunction.name,
            functionPath,
            thirtyMinutesAgo,
            now,
            30,
          );

          invData = aggregated.invocations;
          errData = aggregated.errors;
          execData = aggregated.executionTimes;
          cacheData = aggregated.cacheHits;
        }

        setInvocationData(invData);
        setExecutionTimeData(execData);
        setCacheHitData(cacheData);
        setErrorData(errData);
      } catch (error: any) {
        console.error("Failed to fetch statistics:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);

    // Also fetch when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchStats();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [selectedFunction, deploymentUrl, authToken, useMockData, activeTab]);

  // Compute module path for source code fetching
  const modulePath = React.useMemo(() => {
    if (!selectedFunction) return null;

    let path = selectedFunction.file?.path || "";

    if (!path && selectedFunction.identifier) {
      const parts = selectedFunction.identifier.split(":");
      if (parts.length >= 2) {
        path = parts[0];
      } else {
        path = selectedFunction.identifier;
      }
    }

    if (path && !path.includes(".")) {
      path = `${path}.js`;
    }

    return path || null;
  }, [selectedFunction]);

  // Try to load source code from local filesystem first
  const {
    sourceCode: localSourceCode,
    loading: localLoading,
    hasAttempted: localHasAttempted,
    localPath,
    refresh: refreshLocalSource,
  } = useLocalSourceCode({
    projectPath,
    modulePath,
    enabled: activeTab === "code" && !!selectedFunction && !useMockData,
  });

  // Track whether we're viewing a local (editable) file or API source (read-only)
  const [isLocalFile, setIsLocalFile] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Track API fetch state to avoid race conditions
  const apiFetchRef = useRef<{
    modulePath: string | null;
    inProgress: boolean;
  }>({ modulePath: null, inProgress: false });

  // Fetch source code: local first, then API fallback
  useEffect(() => {
    if (activeTab !== "code" || !selectedFunction || useMockData) {
      setSourceCode(null);
      setCodeLoading(false);
      setIsLocalFile(false);
      setHasUnsavedChanges(false);
      return;
    }

    // If local source code is still loading or hasn't been attempted yet, wait
    if (localLoading || !localHasAttempted) {
      setCodeLoading(true);
      return;
    }

    // If we have local source code, use it (editable)
    if (localSourceCode) {
      setSourceCode(localSourceCode);
      setCodeLoading(false);
      setIsLocalFile(true);
      setHasUnsavedChanges(false);
      apiFetchRef.current = { modulePath: null, inProgress: false };
      return;
    }

    // No local source code - try API fallback (read-only)
    if (!modulePath || !deploymentUrl || !authToken) {
      setSourceCode(null);
      setCodeLoading(false);
      setIsLocalFile(false);
      return;
    }

    // Avoid duplicate API fetches for the same module
    if (
      apiFetchRef.current.modulePath === modulePath &&
      apiFetchRef.current.inProgress
    ) {
      return;
    }

    apiFetchRef.current = { modulePath, inProgress: true };
    setCodeLoading(true);
    setIsLocalFile(false);

    // Pass the actual component ID (UUID) for fetching source code
    fetchSourceCode(deploymentUrl, authToken, modulePath, selectedComponentId)
      .then((code: string) => {
        if (apiFetchRef.current.modulePath === modulePath) {
          setSourceCode(code);
        }
      })
      .catch(() => {
        if (apiFetchRef.current.modulePath === modulePath) {
          setSourceCode(null);
        }
      })
      .finally(() => {
        if (apiFetchRef.current.modulePath === modulePath) {
          apiFetchRef.current.inProgress = false;
          setCodeLoading(false);
        }
      });
  }, [
    activeTab,
    selectedFunction,
    deploymentUrl,
    authToken,
    useMockData,
    selectedComponentId,
    modulePath,
    localSourceCode,
    localLoading,
    localHasAttempted,
  ]);

  // Handle editor content changes (only for local files)
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (isLocalFile && value !== undefined) {
        setSourceCode(value);
        setHasUnsavedChanges(value !== localSourceCode);
      }
    },
    [isLocalFile, localSourceCode],
  );

  // Save file to disk
  const handleSaveFile = useCallback(async () => {
    if (!localPath || !sourceCode || !isLocalFile) return;

    setIsSaving(true);
    try {
      await writeTextFile(localPath, sourceCode);
      setHasUnsavedChanges(false);
      toast.success("File saved");
      // Refresh the local source to update the reference
      refreshLocalSource();
    } catch (error) {
      console.error("Failed to save file:", error);
      toast.error("Failed to save file");
    } finally {
      setIsSaving(false);
    }
  }, [localPath, sourceCode, isLocalFile, refreshLocalSource]);

  // Open file in external code editor
  const handleOpenInEditor = useCallback(async () => {
    if (!localPath) return;

    try {
      // Pass the function line number so the editor opens at the right location
      await openInEditor(localPath, functionLineNumber ?? undefined);
    } catch (error) {
      console.error("Failed to open in editor:", error);
      toast.error("Could not open editor", {
        description:
          "Make sure your preferred editor is installed and available in PATH. Check Settings to configure.",
      });
    }
  }, [localPath, functionLineNumber]);

  // Handle keyboard shortcuts for save (Cmd+S / Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (isLocalFile && hasUnsavedChanges) {
          handleSaveFile();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLocalFile, hasUnsavedChanges, handleSaveFile]);

  // Logs streaming - uses centralized log stream filtered by function
  // Get logs from centralized stream, filtered by selected function
  const { logs: streamedLogs, isConnected: streamConnected } = useLogStream(
    selectedFunction?.identifier,
  );
  const streamingLoading = !streamConnected && streamedLogs.length === 0;

  useEffect(() => {
    if (activeTab === "logs") {
      setLogs(streamedLogs);
      setLogsLoading(streamingLoading);
    }
  }, [activeTab, streamedLogs, streamingLoading]);

  const handleLogsScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = e.currentTarget.scrollTop;
      const scrolledAway = scrollTop > 0;

      if (scrollStateRef.current.rafId !== null) {
        cancelAnimationFrame(scrollStateRef.current.rafId);
      }

      if (
        !manuallyPaused &&
        scrollStateRef.current.isScrolledAway !== scrolledAway
      ) {
        scrollStateRef.current.isScrolledAway = scrolledAway;

        scrollStateRef.current.rafId = requestAnimationFrame(() => {
          setIsScrolledAway(scrolledAway);
          scrollStateRef.current.rafId = null;
        });
      }
    },
    [manuallyPaused],
  );

  useEffect(() => {
    return () => {
      if (scrollStateRef.current.rafId !== null) {
        cancelAnimationFrame(scrollStateRef.current.rafId);
      }
    };
  }, []);

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handleFunctionSelect = (functionName: string | null) => {
    if (!functionName) {
      setSelectedFunction(null);
      return;
    }

    // Find the function in groupedFunctions
    for (const group of groupedFunctions) {
      const func = group.functions.find((f) => f.name === functionName);
      if (func) {
        setSelectedFunction(func);
        return;
      }
    }
  };

  const createChartPath = (data: number[]): string => {
    if (!data || data.length === 0) return "";

    const max = Math.max(...data, 1);
    const width = 300;
    const height = 100;
    const pointWidth = width / (data.length - 1 || 1);

    const points = data
      .map((value: number, index: number) => {
        const x = index * pointWidth;
        const y = height - (value / max) * height * 0.9;
        return `${x},${y}`;
      })
      .join(" ");

    return `M ${points}`;
  };

  if (!deployment) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-muted">
          Please select a deployment to view functions
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex h-full bg-background-base overflow-hidden"
    >
      {/* Sidebar toggle when collapsed */}
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="flex items-center justify-center w-10 h-full transition-colors"
          style={{
            backgroundColor: "var(--color-surface-base)",
            borderRight: "1px solid var(--color-border-base)",
            color: "var(--color-text-subtle)",
          }}
          title="Show sidebar"
        >
          <PanelLeftOpen size={16} />
        </button>
      )}

      {/* Left Panel - Function List */}
      {!sidebarCollapsed && (
        <ResizableSheet
          id="functions-sidebar"
          side="left"
          defaultWidth={260}
          minWidth={200}
          maxWidth={400}
          showHeader={false}
        >
          <FunctionsSidebar
            functions={sidebarFunctions}
            selectedFunction={selectedFunction?.name || null}
            onSelectFunction={handleFunctionSelect}
            isLoading={isLoading}
            organizationMode={organizationMode}
            selectedComponentId={selectedComponentId}
            onComponentSelect={setSelectedComponent}
            components={components}
          />
        </ResizableSheet>
      )}

      {/* Right Panel - Function Details */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <FunctionsToolbar
          organizationMode={organizationMode}
          onOrganizationModeChange={setOrganizationMode}
          onRunFunction={() => {
            if (selectedFunction) {
              setShowFunctionRunner(true);
            }
          }}
          selectedFunction={selectedFunction?.name || null}
          functionType={selectedFunction?.udfType}
          functionIdentifier={selectedFunction?.identifier}
          onCollapseSidebar={() => setSidebarCollapsed(true)}
          sidebarCollapsed={sidebarCollapsed}
        />

        {!selectedFunction ? (
          <EmptyFunctionsState />
        ) : (
          <div
            className={`flex-1 flex overflow-hidden ${
              showFunctionRunner && functionRunnerLayout === "bottom"
                ? "flex-col"
                : ""
            }`}
          >
            {/* Main content - hide when function runner is fullscreen */}
            {!(showFunctionRunner && functionRunnerLayout === "fullscreen") && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Tabs */}
                <div
                  style={{
                    borderBottom: "1px solid var(--color-border-base)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <button
                    onClick={() => setActiveTab("statistics")}
                    style={{
                      padding: "12px 16px",
                      fontSize: "12px",
                      fontWeight: 500,
                      transition: "color 0.15s",
                      borderBottom:
                        activeTab === "statistics"
                          ? "2px solid var(--color-brand-base)"
                          : "2px solid transparent",
                      color:
                        activeTab === "statistics"
                          ? "var(--color-text-base)"
                          : "var(--color-text-muted)",
                      backgroundColor: "transparent",
                      borderTop: "none",
                      borderLeft: "none",
                      borderRight: "none",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== "statistics") {
                        e.currentTarget.style.color =
                          "var(--color-text-secondary)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== "statistics") {
                        e.currentTarget.style.color = "var(--color-text-muted)";
                      }
                    }}
                  >
                    Statistics
                  </button>
                  <button
                    onClick={() => setActiveTab("code")}
                    style={{
                      padding: "12px 16px",
                      fontSize: "12px",
                      fontWeight: 500,
                      transition: "color 0.15s",
                      borderBottom:
                        activeTab === "code"
                          ? "2px solid var(--color-brand-base)"
                          : "2px solid transparent",
                      color:
                        activeTab === "code"
                          ? "var(--color-text-base)"
                          : "var(--color-text-muted)",
                      backgroundColor: "transparent",
                      borderTop: "none",
                      borderLeft: "none",
                      borderRight: "none",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== "code") {
                        e.currentTarget.style.color =
                          "var(--color-text-secondary)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== "code") {
                        e.currentTarget.style.color = "var(--color-text-muted)";
                      }
                    }}
                  >
                    Code
                  </button>
                  <button
                    onClick={() => setActiveTab("logs")}
                    style={{
                      padding: "12px 16px",
                      fontSize: "12px",
                      fontWeight: 500,
                      transition: "color 0.15s",
                      borderBottom:
                        activeTab === "logs"
                          ? "2px solid var(--color-brand-base)"
                          : "2px solid transparent",
                      color:
                        activeTab === "logs"
                          ? "var(--color-text-base)"
                          : "var(--color-text-muted)",
                      backgroundColor: "transparent",
                      borderTop: "none",
                      borderLeft: "none",
                      borderRight: "none",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== "logs") {
                        e.currentTarget.style.color =
                          "var(--color-text-secondary)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== "logs") {
                        e.currentTarget.style.color = "var(--color-text-muted)";
                      }
                    }}
                  >
                    Logs
                  </button>
                </div>

                {activeTab === "statistics" && (
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <HealthCard
                        title="Function Calls"
                        tip="The number of times this function has been called over the last 30 minutes, bucketed by minute."
                        loading={statsLoading}
                        error={null}
                      >
                        <div className="h-[100px] flex items-end relative w-full">
                          <svg
                            className="absolute inset-0 w-full h-full"
                            preserveAspectRatio="none"
                            viewBox="0 0 300 100"
                          >
                            <path
                              d={createChartPath(invocationData)}
                              stroke="currentColor"
                              className="text-blue-500"
                              strokeWidth="2"
                              fill="none"
                              vectorEffect="non-scaling-stroke"
                            />
                          </svg>
                        </div>
                      </HealthCard>

                      <HealthCard
                        title="Errors"
                        tip="The number of errors this function has encountered over the last 30 minutes, bucketed by minute."
                        loading={statsLoading}
                        error={null}
                      >
                        <div className="h-[100px] flex items-end relative w-full">
                          <svg
                            className="absolute inset-0 w-full h-full"
                            preserveAspectRatio="none"
                            viewBox="0 0 300 100"
                          >
                            <path
                              d={createChartPath(errorData)}
                              stroke="currentColor"
                              className="text-red-500"
                              strokeWidth="2"
                              fill="none"
                              vectorEffect="non-scaling-stroke"
                            />
                          </svg>
                        </div>
                      </HealthCard>

                      <HealthCard
                        title="Execution Time"
                        tip="The p50 (median) execution time of this function over the last 30 minutes, bucketed by minute."
                        loading={statsLoading}
                        error={null}
                      >
                        <div className="h-[100px] flex items-end relative w-full">
                          <svg
                            className="absolute inset-0 w-full h-full"
                            preserveAspectRatio="none"
                            viewBox="0 0 300 100"
                          >
                            <path
                              d={createChartPath(executionTimeData)}
                              stroke="currentColor"
                              className="text-green-500"
                              strokeWidth="2"
                              fill="none"
                              vectorEffect="non-scaling-stroke"
                            />
                          </svg>
                        </div>
                      </HealthCard>

                      <HealthCard
                        title="Cache Hit Rate"
                        tip="The percentage of queries served from cache vs executed fresh, over the last 30 minutes, bucketed by minute."
                        loading={statsLoading}
                        error={null}
                      >
                        <div className="h-[100px] flex items-end relative w-full">
                          <svg
                            className="absolute inset-0 w-full h-full"
                            preserveAspectRatio="none"
                            viewBox="0 0 300 100"
                          >
                            <path
                              d={createChartPath(cacheHitData)}
                              stroke="currentColor"
                              className="text-blue-500"
                              strokeWidth="2"
                              fill="none"
                              vectorEffect="non-scaling-stroke"
                            />
                          </svg>
                        </div>
                      </HealthCard>
                    </div>
                  </div>
                )}

                {activeTab === "code" && (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                      minHeight: 0,
                      backgroundColor: "var(--color-background-base)",
                    }}
                  >
                    {/* Status bar for local files */}
                    {isLocalFile && sourceCode && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "6px 12px",
                          borderBottom: "1px solid var(--color-border-muted)",
                          backgroundColor: "var(--color-background-secondary)",
                          fontSize: "12px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: "11px",
                            }}
                          >
                            {localPath}
                          </span>
                          {hasUnsavedChanges && (
                            <span
                              style={{
                                color: "var(--color-warning)",
                                fontWeight: 500,
                              }}
                            >
                              (unsaved)
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <button
                            onClick={handleOpenInEditor}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 8px",
                              fontSize: "11px",
                              fontWeight: 500,
                              color: "var(--color-text-secondary)",
                              backgroundColor: "transparent",
                              border: "1px solid var(--color-border-muted)",
                              borderRadius: "4px",
                              cursor: "pointer",
                            }}
                            title="Open in external editor"
                          >
                            <ExternalLink size={12} />
                            Open in Editor
                          </button>
                          <button
                            onClick={handleSaveFile}
                            disabled={!hasUnsavedChanges || isSaving}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 8px",
                              fontSize: "11px",
                              fontWeight: 500,
                              color: hasUnsavedChanges
                                ? "var(--color-text-primary)"
                                : "var(--color-text-muted)",
                              backgroundColor: hasUnsavedChanges
                                ? "var(--color-background-tertiary)"
                                : "transparent",
                              border: "1px solid var(--color-border-muted)",
                              borderRadius: "4px",
                              cursor: hasUnsavedChanges ? "pointer" : "default",
                              opacity: hasUnsavedChanges ? 1 : 0.5,
                            }}
                          >
                            <Save size={12} />
                            {isSaving ? "Saving..." : "Save"}
                            <span
                              style={{
                                opacity: 0.6,
                                marginLeft: "4px",
                              }}
                            >
                              {navigator.platform.includes("Mac")
                                ? "Cmd+S"
                                : "Ctrl+S"}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        minHeight: 0,
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          minHeight: 0,
                          overflow: "hidden",
                        }}
                      >
                        {codeLoading ? (
                          <div
                            style={{
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "var(--color-text-muted)",
                              fontSize: "14px",
                              padding: "32px",
                              textAlign: "center",
                            }}
                          >
                            Loading source code...
                          </div>
                        ) : sourceCode ? (
                          <div
                            style={{
                              height: "100%",
                              overflow: "hidden",
                              backgroundColor: "var(--color-background-base)",
                            }}
                          >
                            <Editor
                              height="100%"
                              defaultLanguage="typescript"
                              value={sourceCode}
                              onChange={handleEditorChange}
                              theme={
                                resolvedTheme === "dark"
                                  ? "convex-dark"
                                  : "convex-light"
                              }
                              beforeMount={handleEditorWillMount}
                              onMount={handleEditorDidMount}
                              options={{
                                readOnly: !isLocalFile,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                fontSize: 13,
                                lineNumbers: "on",
                                lineNumbersMinChars: 3,
                                scrollbar: {
                                  horizontalScrollbarSize: 8,
                                  verticalScrollbarSize: 8,
                                },
                                wordWrap: "on",
                                tabSize: 2,
                                domReadOnly: !isLocalFile,
                                contextmenu: true,
                                glyphMargin: false,
                                folding: true,
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            style={{
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "var(--color-text-muted)",
                              fontSize: "14px",
                              padding: "32px",
                              textAlign: "center",
                              gap: "8px",
                            }}
                          >
                            <svg
                              width="28"
                              height="28"
                              viewBox="0 0 15 15"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M14.7649 6.07596C14.9991 6.22231 15.0703 6.53079 14.9239 6.76495C14.4849 7.46743 13.9632 8.10645 13.3702 8.66305L14.5712 9.86406C14.7664 10.0593 14.7664 10.3759 14.5712 10.5712C14.3759 10.7664 14.0593 10.7664 13.8641 10.5712L12.6011 9.30817C11.805 9.90283 10.9089 10.3621 9.93375 10.651L10.383 12.3277C10.4544 12.5944 10.2961 12.8685 10.0294 12.94C9.76267 13.0115 9.4885 12.8532 9.41704 12.5865L8.95917 10.8775C8.48743 10.958 8.00036 11.0001 7.50001 11.0001C6.99965 11.0001 6.51257 10.958 6.04082 10.8775L5.58299 12.5864C5.51153 12.8532 5.23737 13.0115 4.97064 12.94C4.7039 12.8686 4.5765 12.5765 4.59699 12.3277L5.04625 10.6509C4.07103 10.362 3.17493 9.90282 2.37885 9.30815L1.11588 10.5712C0.920618 10.7664 0.604034 10.7664 0.408772 10.5712C0.21351 10.3759 0.21351 10.0593 0.408772 9.86406L1.60977 8.66303C1.01681 8.10643 0.495135 7.46742 0.0561054 6.76495C-0.0902503 6.53079 -0.0190703 6.22231 0.215094 6.07596C0.449259 5.92962 0.757736 6.0008 0.904082 6.23496C1.41259 7.04378 2.03243 7.76316 2.74426 8.37186C4.10605 9.51919 5.75006 10.0001 7.50001 10.0001C9.24996 10.0001 10.894 9.51919 12.2558 8.37186C12.9676 7.76316 13.5874 7.04378 14.0959 6.23496C14.2423 6.0008 14.5507 5.92962 14.7649 6.07596Z"
                                fill="currentColor"
                                fillRule="evenodd"
                                clipRule="evenodd"
                              />
                            </svg>
                            <p>We're unable to display your source code.</p>
                            <p
                              style={{
                                fontSize: "12px",
                                opacity: 0.7,
                              }}
                            >
                              Source maps may not be included in this
                              deployment.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "logs" && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      height: "100%",
                      overflow: "hidden",
                    }}
                  >
                    {/* Logs Table Container */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        minWidth: 0,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        ref={logsScrollRef}
                        onScroll={handleLogsScroll}
                        style={{
                          flex: 1,
                          overflow: "auto",
                          backgroundColor: "var(--color-background-base)",
                          fontFamily: "monospace",
                          fontSize: "12px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            borderBottom: "1px solid var(--color-border-base)",
                            color: "var(--color-text-muted)",
                            padding: "4px 8px",
                            position: "sticky",
                            top: 0,
                            backgroundColor: "var(--color-surface-base)",
                            zIndex: 10,
                            alignItems: "center",
                            height: "40px",
                          }}
                        >
                          <div style={{ width: "160px" }}>Timestamp</div>
                          <div style={{ width: "80px" }}>ID</div>
                          <div style={{ width: "128px" }}>Status</div>
                          <div style={{ flex: 1 }}>Function</div>
                          <div
                            style={{
                              flexShrink: 0,
                              marginLeft: "8px",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 500,
                                color: "var(--color-text-muted)",
                              }}
                            >
                              {manuallyPaused || isScrolledAway
                                ? "Paused"
                                : "Live"}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const isCurrentlyPaused =
                                  manuallyPaused || isScrolledAway;
                                if (isCurrentlyPaused) {
                                  logsScrollRef.current?.scrollTo({
                                    top: 0,
                                    behavior: "smooth",
                                  });
                                  setManuallyPaused(false);
                                } else {
                                  setManuallyPaused(true);
                                }
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "18px",
                                height: "18px",
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                padding: 0,
                                color:
                                  manuallyPaused || isScrolledAway
                                    ? "var(--color-text-subtle)"
                                    : "var(--color-success-base)",
                              }}
                              title={
                                manuallyPaused || isScrolledAway
                                  ? "Resume live updates"
                                  : "Pause live updates"
                              }
                            >
                              {manuallyPaused || isScrolledAway ? (
                                <ToggleLeft size={18} />
                              ) : (
                                <ToggleRight size={18} />
                              )}
                            </button>
                          </div>
                        </div>

                        {logsLoading && logs.length === 0 ? (
                          <div
                            style={{
                              color: "var(--color-text-muted)",
                              fontSize: "14px",
                              padding: "32px",
                              textAlign: "center",
                            }}
                          >
                            Loading logs...
                          </div>
                        ) : logs.length === 0 ? (
                          <div
                            style={{
                              color: "var(--color-text-muted)",
                              fontSize: "14px",
                              padding: "32px",
                              textAlign: "center",
                            }}
                          >
                            No logs available
                          </div>
                        ) : (
                          logs.map((log, i) => (
                            <div
                              key={i}
                              onClick={() => {
                                setSelectedExecution(log);
                                setIsDetailOpen(true);
                              }}
                              style={{
                                display: "flex",
                                padding: "4px 16px",
                                cursor: "pointer",
                                backgroundColor: "transparent",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "var(--color-surface-raised)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "transparent";
                              }}
                            >
                              <div
                                style={{
                                  width: "160px",
                                  color: "var(--color-text-secondary)",
                                }}
                              >
                                {formatTimestamp(log.timestamp)}
                              </div>
                              <div
                                style={{
                                  width: "80px",
                                  color: "var(--color-text-muted)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <span
                                  style={{
                                    border:
                                      "1px solid var(--color-border-base)",
                                    borderRadius: "4px",
                                    padding: "0 4px",
                                    fontSize: "10px",
                                  }}
                                >
                                  {log.requestId?.slice(0, 4) || "N/A"}
                                </span>
                              </div>
                              <div
                                style={{
                                  width: "128px",
                                  color: "var(--color-text-secondary)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                {log.success ? (
                                  <>
                                    <span
                                      style={{
                                        color: "var(--color-success-base)",
                                      }}
                                    >
                                      200
                                    </span>
                                    {log.cachedResult ? (
                                      <span
                                        style={{
                                          color: "var(--color-success-base)",
                                          fontSize: "11px",
                                          fontWeight: 500,
                                        }}
                                      >
                                        (cached)
                                      </span>
                                    ) : log.durationMs ? (
                                      <span
                                        style={{
                                          color: "var(--color-text-muted)",
                                        }}
                                      >
                                        {log.durationMs.toFixed(0)}ms
                                      </span>
                                    ) : null}
                                  </>
                                ) : log.error ? (
                                  <span
                                    style={{ color: "var(--color-error-base)" }}
                                  >
                                    Error
                                  </span>
                                ) : (
                                  <span
                                    style={{ color: "var(--color-text-muted)" }}
                                  >
                                    -
                                  </span>
                                )}
                              </div>
                              <div
                                style={{
                                  flex: 1,
                                  color: "var(--color-text-secondary)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  minWidth: 0,
                                  overflow: "hidden",
                                }}
                              >
                                <span
                                  style={{
                                    width: "16px",
                                    textAlign: "center",
                                    color: "var(--color-text-muted)",
                                    fontWeight: 700,
                                    fontSize: "10px",
                                    flexShrink: 0,
                                  }}
                                >
                                  {log.udfType === "query"
                                    ? "Q"
                                    : log.udfType === "mutation"
                                      ? "M"
                                      : log.udfType === "action"
                                        ? "A"
                                        : "H"}
                                </span>
                                <span
                                  style={{
                                    color: "var(--color-text-muted)",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    flexShrink: 1,
                                    minWidth: 0,
                                  }}
                                  title={log.functionIdentifier}
                                >
                                  {log.functionIdentifier}
                                </span>
                                {log.error && (
                                  <span
                                    style={{
                                      color: "var(--color-error-base)",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      flexShrink: 1,
                                      minWidth: 0,
                                      maxWidth: "250px",
                                    }}
                                    title={log.error}
                                  >
                                    {log.error}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Detail Sheet - renders inline to push table */}
                    {isDetailOpen && (
                      <FunctionExecutionDetailSheet
                        log={selectedExecution}
                        isOpen={isDetailOpen}
                        onClose={() => {
                          setIsDetailOpen(false);
                        }}
                        container={containerRef.current}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Bottom layout: Function runner at bottom */}
            {showFunctionRunner &&
              functionRunnerLayout === "bottom" &&
              selectedFunction && (
                <ResizableSheet
                  id="function-runner-bottom"
                  side="bottom"
                  defaultHeight={320}
                  minHeight={200}
                  maxHeight={600}
                  showHeader={false}
                >
                  <CustomQuerySheet
                    tableName=""
                    adminClient={adminClient}
                    deploymentUrl={deploymentUrl || undefined}
                    accessToken={authToken || undefined}
                    componentId={selectedComponentId}
                    onClose={() => setShowFunctionRunner(false)}
                    availableFunctions={groupedFunctions.flatMap(
                      (g) => g.functions,
                    )}
                    availableComponents={components}
                    initialSelectedFunction={selectedFunction}
                    layoutMode={functionRunnerLayout}
                    onLayoutModeChange={setFunctionRunnerLayout}
                  />
                </ResizableSheet>
              )}

            {/* Fullscreen layout: Function runner takes entire space */}
            {showFunctionRunner &&
              functionRunnerLayout === "fullscreen" &&
              selectedFunction && (
                <div
                  className="flex-1 h-full w-full"
                  style={{
                    animation: "fadeIn 0.15s ease-out",
                  }}
                >
                  <CustomQuerySheet
                    tableName=""
                    adminClient={adminClient}
                    deploymentUrl={deploymentUrl || undefined}
                    accessToken={authToken || undefined}
                    componentId={selectedComponentId}
                    onClose={() => setShowFunctionRunner(false)}
                    availableFunctions={groupedFunctions.flatMap(
                      (g) => g.functions,
                    )}
                    availableComponents={components}
                    initialSelectedFunction={selectedFunction}
                    layoutMode={functionRunnerLayout}
                    onLayoutModeChange={setFunctionRunnerLayout}
                  />
                </div>
              )}
          </div>
        )}
      </div>

      {/* Function Runner Sheet - Side layout only */}
      {showFunctionRunner &&
        selectedFunction &&
        !(
          functionRunnerLayout === "bottom" ||
          functionRunnerLayout === "fullscreen"
        ) && (
          <ResizableSheet
            id="function-runner-side"
            side="right"
            defaultWidth={500}
            minWidth={400}
            maxWidth={800}
            showHeader={false}
          >
            <CustomQuerySheet
              tableName=""
              adminClient={adminClient}
              deploymentUrl={deploymentUrl || undefined}
              accessToken={authToken || undefined}
              componentId={selectedComponentId}
              onClose={() => setShowFunctionRunner(false)}
              availableFunctions={groupedFunctions.flatMap((g) => g.functions)}
              availableComponents={components}
              initialSelectedFunction={selectedFunction}
              layoutMode={functionRunnerLayout}
              onLayoutModeChange={setFunctionRunnerLayout}
            />
          </ResizableSheet>
        )}

      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default FunctionsView;
