import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { PanelLeftOpen, ToggleLeft, ToggleRight } from "lucide-react";
import { useDeployment } from "@/contexts/DeploymentContext";
import { useFunctions } from "./hooks/useFunctions";
import { useFunctionLogStream } from "./hooks/useFunctionLogStream";
import { EmptyFunctionsState } from "./components/EmptyFunctionsState";
import { HealthCard } from "./components/HealthCard";
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
} from "@convex-panel/shared/api";

type TabType = "statistics" | "code" | "logs";

const FunctionsView: React.FC = () => {
  const { deployment, deploymentUrl, authToken, adminClient, useMockData } =
    useDeployment();
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

  // Function runner state
  const [showFunctionRunner, setShowFunctionRunner] = useState(false);
  const [functionRunnerLayout, setFunctionRunnerLayout] =
    useState<FunctionRunnerLayout>("side");

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
    return () => clearInterval(interval);
  }, [selectedFunction, deploymentUrl, authToken, useMockData, activeTab]);

  // Fetch source code when code tab is selected
  useEffect(() => {
    if (
      activeTab !== "code" ||
      !selectedFunction ||
      !deploymentUrl ||
      !authToken ||
      useMockData
    ) {
      setSourceCode(null);
      return;
    }

    let modulePath = selectedFunction.file?.path || "";

    if (!modulePath && selectedFunction.identifier) {
      const parts = selectedFunction.identifier.split(":");
      if (parts.length >= 2) {
        modulePath = parts[0];
      } else {
        modulePath = selectedFunction.identifier;
      }
    }

    if (modulePath && !modulePath.includes(".")) {
      modulePath = `${modulePath}.js`;
    }

    if (!modulePath) {
      setSourceCode(null);
      return;
    }

    setCodeLoading(true);
    // Pass the actual component ID (UUID) for fetching source code
    fetchSourceCode(deploymentUrl, authToken, modulePath, selectedComponentId)
      .then((code: string) => {
        setSourceCode(code);
      })
      .catch(() => {
        setSourceCode(null);
      })
      .finally(() => {
        setCodeLoading(false);
      });
  }, [
    activeTab,
    selectedFunction,
    deploymentUrl,
    authToken,
    useMockData,
    selectedComponentId,
  ]);

  // Logs streaming
  const isLogsTabActive = activeTab === "logs";
  const effectiveIsPaused =
    manuallyPaused || isScrolledAway || !isLogsTabActive;

  const { logs: streamedLogs, isLoading: streamingLoading } =
    useFunctionLogStream({
      deploymentUrl: deploymentUrl || "",
      authToken: authToken || "",
      selectedFunction: selectedFunction as any,
      isPaused: effectiveIsPaused,
      useProgressEvents: false,
      useMockData,
    });

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
      className="flex h-full bg-surface-base overflow-hidden"
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
                    }}
                  >
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
                              theme="convex-dark"
                              options={{
                                readOnly: true,
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
                                domReadOnly: true,
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
                              alignItems: "center",
                              justifyContent: "center",
                              color: "var(--color-text-muted)",
                              fontSize: "14px",
                              padding: "32px",
                              textAlign: "center",
                            }}
                          >
                            Source code not available
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
