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
  Code2,
  X,
  ExternalLink,
  FileCode,
  Loader2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useDeployment } from "@/contexts/DeploymentContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useMcpOptional } from "@/contexts/McpContext";
import { useGitHubOptional } from "@/contexts/GitHubContext";
import { useComponents, saveActiveTable } from "convex-panel";
import { useSchema } from "./hooks/useSchema";
import { useSchemaDiff } from "./hooks/useSchemaDiff";
import { useGitSchemaHistory } from "./hooks/useGitSchemaHistory";
import { useLocalSchema } from "./hooks/useLocalSchema";
import { useRemoteSchemaHistory } from "./hooks/useRemoteSchemaHistory";
import { useSchemaUpdates } from "./hooks/useSchemaUpdates";
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
  VisualizationSettings,
  LayoutAlgorithm,
  ExportFormat,
  SchemaTable,
} from "./types";

// Default sidebar width
const DEFAULT_SIDEBAR_WIDTH = 260;
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 400;

// Default code panel width
const DEFAULT_CODE_PANEL_WIDTH = 400;
const MIN_CODE_PANEL_WIDTH = 300;
const MAX_CODE_PANEL_WIDTH = 600;

// Default visualization settings
const defaultSettings: VisualizationSettings = {
  layout: "hierarchical",
  showFields: true,
  showIndexes: true,
  showRelationships: true,
  showCardinality: true,
  colorByModule: true,
};

/**
 * Resizable divider component
 */
function ResizeDivider({
  onResize,
  orientation = "vertical",
}: {
  onResize: (delta: number) => void;
  orientation?: "vertical" | "horizontal";
}) {
  const isDragging = useRef(false);
  const startPos = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      startPos.current = orientation === "vertical" ? e.clientX : e.clientY;

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current) return;
        const currentPos = orientation === "vertical" ? e.clientX : e.clientY;
        const delta = currentPos - startPos.current;
        startPos.current = currentPos;
        onResize(delta);
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [onResize, orientation],
  );

  return (
    <div
      className={`
        ${orientation === "vertical" ? "w-1 cursor-col-resize" : "h-1 cursor-row-resize"}
        transition-colors flex-shrink-0
      `}
      style={{
        backgroundColor: "var(--color-border-base)",
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--color-border-strong)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "var(--color-border-base)";
      }}
    />
  );
}

/**
 * Code panel component showing schema code
 */
function SchemaCodePanel({
  table,
  width,
  onClose,
  onOpenInCursor,
}: {
  table: SchemaTable | null;
  width: number;
  onClose: () => void;
  onOpenInCursor?: () => void;
}) {
  // Generate TypeScript-like schema code for the selected table
  const schemaCode = useMemo(() => {
    if (!table) {
      return "// Select a table to view its schema";
    }

    const lines: string[] = [];
    lines.push(`// Schema for table: ${table.name}`);
    lines.push("");
    lines.push(`export const ${table.name} = defineTable({`);

    for (const field of table.fields) {
      const optional = field.optional ? ".optional()" : "";
      let typeStr: string = field.type;

      if (field.type === "id" && field.referencedTable) {
        typeStr = `v.id("${field.referencedTable}")`;
      } else if (field.type === "array") {
        const elementType = field.arrayElementType?.type || "any";
        if (elementType === "id" && field.arrayElementType?.referencedTable) {
          typeStr = `v.array(v.id("${field.arrayElementType.referencedTable}"))`;
        } else {
          typeStr = `v.array(v.${elementType}())`;
        }
      } else if (field.type === "object") {
        typeStr = "v.object({...})";
      } else {
        typeStr = `v.${field.type}()`;
      }

      lines.push(`  ${field.name}: ${typeStr}${optional},`);
    }

    lines.push("})");

    // Add indexes
    if (table.indexes.length > 0) {
      lines.push("");
      lines.push("// Indexes");
      for (const index of table.indexes) {
        if (index.type === "db") {
          lines.push(
            `  .index("${index.name}", [${index.fields.map((f) => `"${f}"`).join(", ")}])`,
          );
        } else if (index.type === "search") {
          lines.push(
            `  .searchIndex("${index.name}", { searchField: "${index.searchField}", filterFields: [${index.filterFields?.map((f) => `"${f}"`).join(", ") || ""}] })`,
          );
        } else if (index.type === "vector") {
          lines.push(
            `  .vectorIndex("${index.name}", { vectorField: "${index.vectorField}", dimensions: ${index.dimensions}, filterFields: [${index.filterFields?.map((f) => `"${f}"`).join(", ") || ""}] })`,
          );
        }
      }
    }

    return lines.join("\n");
  }, [table]);

  return (
    <div
      className="flex flex-col h-full"
      style={{
        width,
        backgroundColor: "var(--color-surface-base)",
        borderLeft: "1px solid var(--color-border-base)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: "1px solid var(--color-border-base)" }}
      >
        <div
          className="flex items-center gap-2 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          <FileCode size={14} style={{ color: "var(--color-text-subtle)" }} />
          <span>{table?.name || "Schema"}</span>
        </div>
        <div className="flex items-center gap-1">
          {onOpenInCursor && (
            <button
              onClick={onOpenInCursor}
              className="p-1.5 rounded transition-colors"
              style={{ color: "var(--color-text-subtle)" }}
              title="Open in Cursor"
            >
              <ExternalLink size={14} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded transition-colors"
            style={{ color: "var(--color-text-subtle)" }}
            title="Close code panel"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Code content */}
      <div className="flex-1 overflow-auto">
        <pre
          className="p-4 text-xs font-mono whitespace-pre-wrap"
          style={{ color: "var(--color-text-muted)" }}
        >
          {schemaCode}
        </pre>
      </div>
    </div>
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
    componentNames,
    selectedComponent,
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
  const lastValidComponentRef = useRef<string | null>(selectedComponent);

  // Detect if we're about to revert to a previous valid component
  // This prevents showing the empty state flash before the revert happens
  const isRevertingToValidComponent =
    !isLoading &&
    schema &&
    schema.tables.size === 0 &&
    lastValidComponentRef.current !== null &&
    selectedComponent !== lastValidComponentRef.current;

  // If schema is empty (no tables) after loading, revert to the last valid component
  useEffect(() => {
    if (!isLoading && schema && schema.tables.size > 0) {
      // Schema has tables - this is a valid component, remember it
      lastValidComponentRef.current = selectedComponent;
    } else if (
      !isLoading &&
      schema &&
      schema.tables.size === 0 &&
      lastValidComponentRef.current !== null
    ) {
      // Schema is empty and we have a previous valid component - revert to it
      if (selectedComponent !== lastValidComponentRef.current) {
        setSelectedComponent(lastValidComponentRef.current);
      }
    }
  }, [schema, isLoading, selectedComponent, setSelectedComponent]);

  // UI state
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [codePanelWidth, setCodePanelWidth] = useState(
    DEFAULT_CODE_PANEL_WIDTH,
  );
  const [codePanelOpen, setCodePanelOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [settings, setSettings] =
    useState<VisualizationSettings>(defaultSettings);
  const [showHealthPanel, setShowHealthPanel] = useState(false);
  const [filterPresets] = useState<FilterPreset[]>([]);
  const [aggregations] = useState<AggregationDef[]>([]);
  const graphRef = useRef<SchemaGraphRef>(null);

  // Get selected table data
  const selectedTableData = useMemo(() => {
    if (!schema || !selectedTable) return null;
    return schema.tables.get(selectedTable) || null;
  }, [schema, selectedTable]);

  // Handle sidebar resize
  const handleSidebarResize = useCallback((delta: number) => {
    setSidebarWidth((prev) => {
      const newWidth = prev + delta;
      return Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, newWidth));
    });
  }, []);

  // Handle code panel resize
  const handleCodePanelResize = useCallback((delta: number) => {
    setCodePanelWidth((prev) => {
      const newWidth = prev - delta; // Negative because we're resizing from left edge
      return Math.max(
        MIN_CODE_PANEL_WIDTH,
        Math.min(MAX_CODE_PANEL_WIDTH, newWidth),
      );
    });
  }, []);

  // Handle layout change
  const handleLayoutChange = useCallback((layout: LayoutAlgorithm) => {
    setSettings((prev) => ({ ...prev, layout }));
  }, []);

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
            // Need to get fresh snapshots after saving
            // The snapshot ID format is: github-{shortSha}-{timestamp}
            // We need to find it by the commit hash in the label
            // Use a small delay to ensure the snapshot is persisted
            await new Promise((resolve) => setTimeout(resolve, 100));
            // Re-fetch snapshots to get the newly saved one
            const { getAllSnapshots } = await import("./utils/schema-storage");
            const allSnapshots = await getAllSnapshots("github");
            const matchingSnapshot = allSnapshots.find(
              (s) => s.commitHash === commit.sha,
            );
            if (matchingSnapshot) {
              if (target === "from") {
                setDiffMode({
                  enabled: true,
                  fromSnapshotId: matchingSnapshot.id,
                });
              } else {
                setDiffMode({
                  enabled: true,
                  toSnapshotId: matchingSnapshot.id,
                });
              }
            } else {
              console.warn(
                "[SchemaVisualizer] Could not find snapshot for commit:",
                commit.shortSha,
              );
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
              width={sidebarWidth}
              filterPresets={filterPresets}
              aggregations={aggregations}
              selectedComponent={selectedComponent}
              onComponentSelect={setSelectedComponent}
              components={componentNames}
            />
            <ResizeDivider onResize={handleSidebarResize} />
          </>
        )}

        {/* Graph area */}
        <div className="flex-1 relative">
          {/* Render different views based on diff mode */}
          {diffMode.enabled && diffMode.viewMode === "unified" && diff ? (
            <UnifiedDiffView diff={diff} />
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

          {/* Code panel toggle - only show for visual-overlay mode */}
          {!codePanelOpen &&
            !(
              diffMode.enabled &&
              (diffMode.viewMode === "unified" ||
                diffMode.viewMode === "side-by-side")
            ) && (
              <button
                onClick={() => setCodePanelOpen(true)}
                className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors z-10"
                style={{
                  backgroundColor: "var(--color-surface-overlay)",
                  border: "1px solid var(--color-border-base)",
                  color: "var(--color-text-muted)",
                }}
              >
                <Code2 size={14} />
                Code
              </button>
            )}
        </div>

        {/* Code panel */}
        {codePanelOpen && (
          <>
            <ResizeDivider onResize={handleCodePanelResize} />
            <SchemaCodePanel
              table={selectedTableData}
              width={codePanelWidth}
              onClose={() => setCodePanelOpen(false)}
              onOpenInCursor={
                mcp?.projectPath && selectedTable
                  ? () => handleOpenInCursor(selectedTable)
                  : undefined
              }
            />
          </>
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
