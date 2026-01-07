/**
 * SchemaVisualizerView
 * Main view component for the schema visualization feature
 * Provides split-pane layout with sidebar, graph, and optional code editor
 */

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { useNavigate } from "react-router-dom";
import {
  PanelLeftOpen,
  X,
  ExternalLink,
  Loader2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import Editor, { DiffEditor, type BeforeMount } from "@monaco-editor/react";
import { useDeployment } from "@/contexts/DeploymentContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useMcpOptional } from "@/contexts/McpContext";
import { useGitHubOptional } from "@/contexts/GitHubContext";
import { useComponents } from "@/features/data/hooks/useComponents";
import { saveActiveTable } from "@/lib/storage";
import type { ConvexComponent } from "@/features/data/types";
import { ResizableSheet } from "@/features/data/components/ResizableSheet";
import { useSchema } from "./hooks/useSchema";
import { useSchemaDiff } from "./hooks/useSchemaDiff";
import { useGitSchemaHistory } from "./hooks/useGitSchemaHistory";
import { useLocalSchema } from "./hooks/useLocalSchema";
import { useRemoteSchemaHistory } from "./hooks/useRemoteSchemaHistory";
import { useSchemaUpdates } from "./hooks/useSchemaUpdates";
import { useVisualizerSettings } from "./hooks/useVisualizerSettings";
import {
  SchemaTreeSidebar,
  type FilterPreset,
  type AggregationDef,
} from "./components/SchemaTreeSidebar";
import { SchemaGraph, type SchemaGraphRef } from "./components/SchemaGraph";
import { VisualizerToolbar } from "./components/VisualizerToolbar";
import { SchemaUpdatesPanel } from "./components/SchemaUpdatesPanel";
import { UnifiedDiffView } from "./components/UnifiedDiffView";
import { SideBySideView } from "./components/SideBySideView";
import { GitHubAuthModal } from "@/components/GitHubAuthModal";
import type {
  LayoutAlgorithm,
  ExportFormat,
  SchemaTable,
  SchemaDiff,
  ParsedSchema,
} from "./types";
import {
  generateFullSchemaCode,
  generateSchemaFromTable,
} from "./utils/code-generator";

// Default sidebar width
const DEFAULT_SIDEBAR_WIDTH = 260;
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 400;

// Default code panel width
const DEFAULT_CODE_PANEL_WIDTH = 400;
const MIN_CODE_PANEL_WIDTH = 300;
const MAX_CODE_PANEL_WIDTH = 600;

/**
 * Code panel component showing schema code with Monaco Editor
 * Supports both regular view and diff view when comparing schemas
 */
function SchemaCodePanel({
  table,
  schema,
  diff,
  onClose,
  onOpenInCursor,
}: {
  table: SchemaTable | null;
  schema: ParsedSchema | null;
  diff: SchemaDiff | null;
  onClose: () => void;
  onOpenInCursor?: () => void;
}) {
  const { resolvedTheme } = useTheme();

  // Generate TypeScript-like schema code for the selected table or full schema
  const schemaCode = useMemo(() => {
    if (table) {
      // Generate code for single table
      return `// Schema for table: ${table.name}\nimport { defineTable } from "convex/server";\nimport { v } from "convex/values";\n\n${generateSchemaFromTable(table)}`;
    }
    if (schema) {
      // Generate full schema code
      return generateFullSchemaCode(schema);
    }
    return "// Select a table to view its schema";
  }, [table, schema]);

  // Generate original code for diff view (from the "from" snapshot)
  const originalCode = useMemo(() => {
    if (!diff) return "";
    if (table) {
      // Find the table in the "from" schema
      const oldTable = diff.from.schema.tables.get(table.name);
      if (oldTable) {
        return `// Schema for table: ${oldTable.name}\nimport { defineTable } from "convex/server";\nimport { v } from "convex/values";\n\n${generateSchemaFromTable(oldTable)}`;
      }
      return "// Table does not exist in previous version";
    }
    return generateFullSchemaCode(diff.from.schema);
  }, [diff, table]);

  // Configure Monaco before it mounts
  const handleEditorWillMount: BeforeMount = useCallback((monaco) => {
    // Define custom themes with transparent background
    monaco.editor.defineTheme("convex-light", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#00000000",
      },
    });

    monaco.editor.defineTheme("convex-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#00000000",
      },
    });
  }, []);

  // Monaco editor options
  const editorOptions = useMemo(
    () => ({
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      lineNumbers: "on" as const,
      lineNumbersMinChars: 3,
      lineDecorationsWidth: 0,
      overviewRulerBorder: false,
      contextmenu: true,
      bracketPairColorization: { enabled: true },
      guides: { bracketPairs: true, indentation: true },
      renderLineHighlight: "line" as const,
      fontSize: 12,
      fontFamily:
        'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
      tabSize: 2,
      insertSpaces: true,
      wordWrap: "on" as const,
      folding: true,
      readOnly: true,
      scrollbar: {
        vertical: "auto" as const,
        horizontal: "auto" as const,
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
      },
      padding: { top: 12, bottom: 12 },
    }),
    [],
  );

  const isDiffMode = diff !== null;
  const monacoTheme = resolvedTheme === "dark" ? "convex-dark" : "convex-light";

  return (
    <ResizableSheet
      id="schema-code-panel"
      side="right"
      defaultWidth={DEFAULT_CODE_PANEL_WIDTH}
      minWidth={MIN_CODE_PANEL_WIDTH}
      maxWidth={MAX_CODE_PANEL_WIDTH}
      title={table?.name || "Schema"}
      subtitle={
        isDiffMode ? `${diff.from.label} → ${diff.to.label}` : undefined
      }
      onClose={onClose}
      headerActions={
        onOpenInCursor ? (
          <button
            onClick={onOpenInCursor}
            className="p-1.5 rounded transition-colors"
            style={{ color: "var(--color-text-subtle)" }}
            title="Open in Cursor"
          >
            <ExternalLink size={14} />
          </button>
        ) : undefined
      }
    >
      <div className="flex-1 min-h-0 overflow-hidden">
        {isDiffMode ? (
          <DiffEditor
            original={originalCode}
            modified={schemaCode}
            language="typescript"
            theme={monacoTheme}
            options={{
              ...editorOptions,
              renderSideBySide: true,
              enableSplitViewResizing: true,
              originalEditable: false,
            }}
            beforeMount={handleEditorWillMount}
            loading={
              <div
                className="flex items-center justify-center h-full"
                style={{ backgroundColor: "var(--color-surface-base)" }}
              >
                <span
                  className="text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Loading diff editor...
                </span>
              </div>
            }
          />
        ) : (
          <Editor
            height="100%"
            language="typescript"
            value={schemaCode}
            theme={monacoTheme}
            options={editorOptions}
            beforeMount={handleEditorWillMount}
            loading={
              <div
                className="flex items-center justify-center h-full"
                style={{ backgroundColor: "var(--color-surface-base)" }}
              >
                <span
                  className="text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Loading editor...
                </span>
              </div>
            }
          />
        )}
      </div>
    </ResizableSheet>
  );
}

/**
 * Empty state component
 */
function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center h-full"
      style={{ color: "var(--color-text-subtle)" }}
    >
      <AlertTriangle size={48} className="mb-4 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

/**
 * Loading state component
 */
function LoadingState() {
  return (
    <div
      className="flex flex-col items-center justify-center h-full"
      style={{ color: "var(--color-text-subtle)" }}
    >
      <Loader2 size={32} className="mb-4 animate-spin" />
      <p className="text-sm">Loading schema...</p>
    </div>
  );
}

/**
 * Main schema visualizer content
 */
function SchemaVisualizerContent() {
  const navigate = useNavigate();
  const { adminClient } = useDeployment();
  const mcp = useMcpOptional();
  const { resolvedTheme } = useTheme();

  // Fetch components for component selector
  const {
    components,
    setSelectedComponent,
    selectedComponentId,
  } = useComponents({
    adminClient,
    useMockData: false,
  });

  // Fetch schema data filtered by selected component
  const { schema, schemaJson, isLoading, error, refetch } = useSchema({
    adminClient,
    componentId: selectedComponentId,
  });

  // Load local schema from schema.ts file
  const {
    schema: localSchemaJson,
    exists: localSchemaExists,
    hasProjectPath,
  } = useLocalSchema();

  // Schema diff functionality
  const {
    diffMode,
    setDiffMode,
    diff,
    hasChanges: hasDiffChanges,
    refreshSnapshots,
  } = useSchemaDiff({
    deployedSchema: schemaJson,
    parsedSchema: schema,
    deploymentId: selectedComponentId ?? undefined,
    localSchema: localSchemaJson,
    hasLocalSchema:
      hasProjectPath && localSchemaExists && localSchemaJson !== null,
  });

  // Git schema history for comparing with previous commits
  const { currentBranch } = useGitSchemaHistory({
    projectPath: mcp?.projectPath ?? null,
    autoLoad: true,
  });

  // GitHub integration (optional - returns null if outside provider)
  const github = useGitHubOptional();

  // Remote schema history from GitHub
  const {
    commits: remoteCommits,
    saveRemoteSnapshot,
    isConnected: _isRemoteConnected,
    selectedRepo: _remoteSelectedRepo,
    branches: remoteBranches,
    branchesLoading: remoteBranchesLoading,
    currentBranch: remoteCurrentBranch,
    setBranch: setRemoteBranch,
  } = useRemoteSchemaHistory({
    autoLoad: github?.isAuthenticated ?? false,
    // Sync with local git branch so GitHub shows the same branch you're working on
    initialBranch: currentBranch,
  });

  // Real-time schema updates via SSE
  const {
    updates: schemaUpdates,
    unseenCount: unseenUpdatesCount,
    connectionState: sseConnectionState,
    error: sseError,
    connect: sseConnect,
    disconnect: sseDisconnect,
    markAllSeen: markAllUpdatesSeen,
    markSeen: markUpdateSeen,
    clearUpdates: clearSchemaUpdates,
    isConnected: _isSseConnected,
  } = useSchemaUpdates({
    autoConnect: github?.isAuthenticated && !!github?.selectedRepo,
  });

  // UI state for GitHub modals
  const [showGitHubAuthModal, setShowGitHubAuthModal] = useState(false);
  const [showUpdatesPanel, setShowUpdatesPanel] = useState(false);

  // Track the last component that had a valid schema
  const lastValidComponentRef = useRef<string | null>(selectedComponentId);

  // Detect if we're about to revert to a previous valid component
  // This prevents showing the empty state flash before the revert happens
  const isRevertingToValidComponent =
    !isLoading &&
    schema &&
    schema.tables.size === 0 &&
    lastValidComponentRef.current !== null &&
    selectedComponentId !== lastValidComponentRef.current;

  // If schema is empty (no tables) after loading, revert to the last valid component
  useEffect(() => {
    if (!isLoading && schema && schema.tables.size > 0) {
      // Schema has tables - this is a valid component, remember it
      lastValidComponentRef.current = selectedComponentId;
    } else if (
      !isLoading &&
      schema &&
      schema.tables.size === 0 &&
      lastValidComponentRef.current !== null
    ) {
      // Schema is empty and we have a previous valid component - revert to it
      if (selectedComponentId !== lastValidComponentRef.current) {
        setSelectedComponent(lastValidComponentRef.current);
      }
    }
  }, [schema, isLoading, selectedComponentId, setSelectedComponent]);

  // UI state - persisted via useVisualizerSettings
  const {
    settings,
    setLayout,
    sidebarCollapsed,
    setSidebarCollapsed,
    codePanelOpen,
    setCodePanelOpen,
    showHealthPanel,
    setShowHealthPanel,
  } = useVisualizerSettings();

  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPresets] = useState<FilterPreset[]>([]);
  const [aggregations] = useState<AggregationDef[]>([]);
  const graphRef = useRef<SchemaGraphRef>(null);

  // Get selected table data
  const selectedTableData = useMemo(() => {
    if (!schema || !selectedTable) return null;
    return schema.tables.get(selectedTable) || null;
  }, [schema, selectedTable]);

  // Handle layout change
  const handleLayoutChange = useCallback(
    (layout: LayoutAlgorithm) => {
      setLayout(layout);
    },
    [setLayout],
  );

  // Handle export
  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (!schema) return;

      if (format === "png" || format === "svg") {
        // Export as image
        await graphRef.current?.exportAsImage(format);
      } else if (format === "mermaid") {
        // Generate Mermaid diagram
        let mermaid = "erDiagram\n";
        for (const table of schema.tables.values()) {
          mermaid += `    ${table.name} {\n`;
          for (const field of table.fields) {
            const type = field.type === "id" ? "id" : field.type;
            mermaid += `        ${type} ${field.name}${field.optional ? "" : ' "NOT NULL"'}\n`;
          }
          mermaid += `    }\n`;
        }
        for (const rel of schema.relationships) {
          mermaid += `    ${rel.from} ||--o{ ${rel.to} : "${rel.field}"\n`;
        }

        // Download as .mmd file
        const blob = new Blob([mermaid], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `schema-export-${Date.now()}.mmd`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      } else if (format === "json") {
        // Export as JSON
        const jsonData = {
          tables: Array.from(schema.tables.values()).map((table) => ({
            name: table.name,
            fields: table.fields,
            indexes: table.indexes,
            isSystem: table.isSystem,
            module: table.module,
          })),
          relationships: schema.relationships,
          health: schema.health,
        };

        const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `schema-export-${Date.now()}.json`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    },
    [schema],
  );

  // Handle reset layout
  const handleResetLayout = useCallback(() => {
    refetch();
  }, [refetch]);

  // Navigate to data view
  const handleNavigateToData = useCallback(
    (tableName: string) => {
      // Use saveActiveTable to update both memory cache and localStorage
      // This ensures useTableData hook picks up the change immediately
      saveActiveTable(tableName);
      navigate(`/data?table=${encodeURIComponent(tableName)}`);
    },
    [navigate],
  );

  // Open in Cursor
  const handleOpenInCursor = useCallback(
    (_tableName: string) => {
      if (!mcp?.projectPath) return;

      // Try to open schema.ts file in Cursor
      const schemaPath = `${mcp.projectPath}/convex/schema.ts`;

      // Use shell to open in Cursor
      import("@tauri-apps/plugin-shell")
        .then(({ open }) => {
          open(`cursor://file/${schemaPath}`).catch(console.error);
        })
        .catch(console.error);
    },
    [mcp?.projectPath],
  );

  // Render loading state (also show loading when we're about to revert to a valid component)
  if (isLoading || isRevertingToValidComponent) {
    return <LoadingState />;
  }

  // Render error state
  if (error) {
    return <EmptyState message={error} />;
  }

  // Render empty state
  if (!schema || schema.tables.size === 0) {
    return (
      <EmptyState message="No schema found. Define tables in your convex/schema.ts file." />
    );
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: "var(--color-background-base)" }}
    >
      {/* Toolbar */}
      <VisualizerToolbar
        settings={settings}
        onLayoutChange={handleLayoutChange}
        onExport={handleExport}
        onResetLayout={handleResetLayout}
        health={schema.health}
        onHealthPanelToggle={() => setShowHealthPanel(!showHealthPanel)}
        showHealthPanel={showHealthPanel}
        diffMode={diffMode}
        onDiffModeChange={setDiffMode}
        hasDiffChanges={hasDiffChanges}
        hasLocalSchema={
          hasProjectPath && localSchemaExists && localSchemaJson !== null
        }
        // GitHub integration props
        isGitHubConnected={github?.isAuthenticated ?? false}
        gitHubRepo={github?.selectedRepo ?? null}
        gitHubRepos={
          // Combine initial repos with search results
          github?.searchedRepos && github.searchedRepos.length > 0
            ? github.searchedRepos
            : (github?.repos ?? [])
        }
        gitHubReposLoading={
          github?.reposLoading || github?.searchReposLoading || false
        }
        remoteCommits={remoteCommits}
        remoteBranches={remoteBranches}
        remoteBranchesLoading={remoteBranchesLoading}
        remoteCurrentBranch={remoteCurrentBranch}
        onRemoteBranchChange={setRemoteBranch}
        onSelectRemoteCommitForDiff={async (commit, target) => {
          try {
            // Save the commit as a snapshot
            await saveRemoteSnapshot(commit);
            await refreshSnapshots();

            // Use the same format as dropdown options: github:${sha}
            const commitValue = `github:${commit.sha}`;

            if (target === "from") {
              setDiffMode({
                enabled: true,
                fromSnapshotId: commitValue,
              });
            } else {
              setDiffMode({
                enabled: true,
                toSnapshotId: commitValue,
              });
            }
          } catch (err) {
            console.error(
              "[SchemaVisualizer] Failed to select remote commit for diff:",
              err,
            );
          }
        }}
        onConnectGitHub={() => setShowGitHubAuthModal(true)}
        onRepoChange={(repoFullName) => {
          try {
            // Look in both search results and initial repos
            const repo =
              github?.searchedRepos?.find(
                (r) => r.full_name === repoFullName,
              ) ?? github?.repos?.find((r) => r.full_name === repoFullName);
            if (repo) {
              github?.selectRepo(repo);
            }
          } catch (err) {
            console.error("[SchemaVisualizer] Failed to change repo:", err);
          }
        }}
        onRepoSearch={(query) => {
          // Debounce is handled in the SearchableSelect component
          github?.searchRepos(query);
        }}
        isCodePanelOpen={codePanelOpen}
        onToggleCodePanel={() => setCodePanelOpen(true)}
      />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
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

        {/* Sidebar */}
        {!sidebarCollapsed && (
          <>
            <SchemaTreeSidebar
              schema={schema}
              selectedTable={selectedTable}
              onSelectTable={setSelectedTable}
              onNavigateToData={handleNavigateToData}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              defaultWidth={DEFAULT_SIDEBAR_WIDTH}
              minWidth={MIN_SIDEBAR_WIDTH}
              maxWidth={MAX_SIDEBAR_WIDTH}
              filterPresets={filterPresets}
              aggregations={aggregations}
              selectedComponentId={selectedComponentId}
              onComponentSelect={(componentId) => {
                setSelectedComponent(componentId);
              }}
              components={components}
              isOpen={true}
              onClose={() => setSidebarCollapsed(true)}
            />
          </>
        )}

        {/* Graph area */}
        <div className="flex-1 relative">
          {/* Render different views based on diff mode */}
          {diffMode.enabled &&
          (diffMode.viewMode === "unified" || diffMode.viewMode === "split") &&
          diff ? (
            <UnifiedDiffView
              diff={diff}
              diffStyle={diffMode.viewMode === "split" ? "split" : "unified"}
              onDiffStyleChange={(style) =>
                setDiffMode({
                  viewMode: style === "split" ? "split" : "unified",
                })
              }
            />
          ) : diffMode.enabled &&
            diffMode.viewMode === "side-by-side" &&
            diff ? (
            <SideBySideView
              diff={diff}
              settings={{ ...settings, searchQuery }}
              colorMode={resolvedTheme === "light" ? "light" : "dark"}
              selectedTable={selectedTable}
              onTableSelect={setSelectedTable}
              onNavigateToData={handleNavigateToData}
              onOpenInCursor={mcp?.projectPath ? handleOpenInCursor : undefined}
              showOnlyChanges={diffMode.showOnlyChanges}
            />
          ) : (
            /* Default: visual-overlay mode (standard graph with diff highlighting) */
            <ReactFlowProvider>
              <SchemaGraph
                ref={graphRef}
                schema={schema}
                settings={{ ...settings, searchQuery }}
                selectedTable={selectedTable}
                onTableSelect={setSelectedTable}
                onNavigateToData={handleNavigateToData}
                onOpenInCursor={
                  mcp?.projectPath ? handleOpenInCursor : undefined
                }
                colorMode={resolvedTheme === "light" ? "light" : "dark"}
                onCollapseSidebar={
                  !sidebarCollapsed
                    ? () => setSidebarCollapsed(true)
                    : undefined
                }
                diff={diffMode.enabled ? diff : null}
                showOnlyChanges={diffMode.showOnlyChanges}
              />
            </ReactFlowProvider>
          )}
        </div>

        {/* Code panel */}
        {codePanelOpen && (
          <SchemaCodePanel
            table={selectedTableData}
            schema={schema}
            diff={diffMode.enabled ? diff : null}
            onClose={() => setCodePanelOpen(false)}
            onOpenInCursor={
              mcp?.projectPath && selectedTable
                ? () => handleOpenInCursor(selectedTable)
                : undefined
            }
          />
        )}
      </div>

      {/* Health panel (slide-out) */}
      {showHealthPanel && (
        <div
          className="absolute top-10 right-3 w-80 rounded-lg shadow-xl z-20 max-h-96 overflow-auto"
          style={{
            backgroundColor: "var(--color-surface-overlay)",
            border: "1px solid var(--color-border-base)",
          }}
        >
          <div
            className="flex items-center justify-between px-3 py-2"
            style={{ borderBottom: "1px solid var(--color-border-base)" }}
          >
            <span
              className="text-sm font-medium"
              style={{ color: "var(--color-text-base)" }}
            >
              Health Warnings ({schema.health.warnings.length})
            </span>
            <button
              onClick={() => setShowHealthPanel(false)}
              className="p-1 rounded transition-colors"
              style={{ color: "var(--color-text-muted)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--color-text-base)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--color-text-muted)";
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Warnings list */}
          {schema.health.warnings.length > 0 ? (
            <div className="p-2">
              {schema.health.warnings.slice(0, 5).map((warning, idx) => (
                <div
                  key={idx}
                  className="p-2 mb-1 rounded text-xs"
                  style={{
                    backgroundColor:
                      warning.severity === "error"
                        ? "color-mix(in srgb, var(--color-error-base) 10%, transparent)"
                        : warning.severity === "warning"
                          ? "color-mix(in srgb, var(--color-warning-base) 10%, transparent)"
                          : "color-mix(in srgb, var(--color-info-base) 10%, transparent)",
                    color:
                      warning.severity === "error"
                        ? "var(--color-error-base)"
                        : warning.severity === "warning"
                          ? "var(--color-warning-base)"
                          : "var(--color-info-base)",
                  }}
                >
                  <div className="font-medium">{warning.message}</div>
                  {warning.suggestion && (
                    <div
                      className="mt-1"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {warning.suggestion}
                    </div>
                  )}
                </div>
              ))}
              {schema.health.warnings.length > 5 && (
                <div
                  className="text-xs text-center py-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  +{schema.health.warnings.length - 5} more warnings
                </div>
              )}
            </div>
          ) : (
            <div
              className="p-4 text-center text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              No health warnings found
            </div>
          )}

          {/* Link to Performance Advisor */}
          <div
            className="px-3 py-2"
            style={{ borderTop: "1px solid var(--color-border-base)" }}
          >
            <button
              onClick={() => {
                setShowHealthPanel(false);
                navigate("/advisor");
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: "var(--color-brand-base)",
                color: "white",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--color-brand-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--color-brand-base)";
              }}
            >
              Open Performance Advisor
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* GitHub Auth Modal */}
      <GitHubAuthModal
        isOpen={showGitHubAuthModal}
        onClose={() => setShowGitHubAuthModal(false)}
      />

      {/* Schema Updates Panel */}
      <SchemaUpdatesPanel
        isOpen={showUpdatesPanel}
        onClose={() => setShowUpdatesPanel(false)}
        updates={schemaUpdates}
        unseenCount={unseenUpdatesCount}
        onMarkAllSeen={markAllUpdatesSeen}
        onMarkSeen={markUpdateSeen}
        onClearUpdates={clearSchemaUpdates}
        connectionState={sseConnectionState}
        error={sseError}
        onReconnect={sseConnect}
        onDisconnect={sseDisconnect}
        onViewDiff={(update) => {
          // When viewing a diff from an update, enable diff mode and set the snapshot
          setDiffMode({
            enabled: true,
            fromSnapshotId: update.commitId,
            toSnapshotId: null, // Current deployed
          });
          setShowUpdatesPanel(false);
        }}
      />
    </div>
  );
}

/**
 * Schema Visualizer View - wrapped with providers
 */
export function SchemaVisualizerView() {
  const { resolvedTheme } = useTheme();

  return (
    <div className={`cp-theme-${resolvedTheme} h-full`}>
      <SchemaVisualizerContent />
    </div>
  );
}

export default SchemaVisualizerView;
