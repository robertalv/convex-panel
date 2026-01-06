/**
 * SchemaGraph Component
 * Main React Flow graph for visualizing schema relationships
 */

import {
  useCallback,
  useMemo,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import { PanelLeftClose } from "lucide-react";
import "@xyflow/react/dist/style.css";

import { TableNode } from "./TableNode";
import { RelationshipEdge, EdgeMarkerDefinitions } from "./RelationshipEdge";
import { DiffLegend } from "./DiffLegend";
import type {
  ParsedSchema,
  SchemaTable,
  VisualizationSettings,
  SchemaDiff,
  TableDiff,
} from "../types";
import { calculateLayout } from "../utils/layout";

// Register custom node and edge types
const nodeTypes: NodeTypes = {
  tableNode: TableNode,
};

const edgeTypes: EdgeTypes = {
  relationshipEdge: RelationshipEdge,
};

// Default visualization settings
const defaultSettings: VisualizationSettings = {
  layout: "hierarchical",
  showFields: true,
  showIndexes: true,
  showRelationships: true,
  showCardinality: true,
  colorByModule: true,
};

export interface SchemaGraphRef {
  exportAsImage: (format: "png" | "svg") => Promise<void>;
}

interface SchemaGraphProps {
  schema: ParsedSchema;
  settings?: Partial<VisualizationSettings>;
  selectedTable?: string | null;
  onTableSelect?: (tableName: string | null) => void;
  onNavigateToData?: (tableName: string) => void;
  onOpenInCursor?: (tableName: string) => void;
  colorMode?: "dark" | "light";
  onCollapseSidebar?: () => void;
  /** Schema diff to display (when diff mode is enabled) */
  diff?: SchemaDiff | null;
  /** Whether to show only changed tables (in diff mode) */
  showOnlyChanges?: boolean;
}

const moduleColors: Record<string, string> = {
  users: "#3b82f6",
  auth: "#8b5cf6",
  content: "#10b981",
  commerce: "#f59e0b",
  analytics: "#ef4444",
  messaging: "#06b6d4",
  storage: "#84cc16",
  default: "#6b7280",
};

export const SchemaGraph = forwardRef<SchemaGraphRef, SchemaGraphProps>(
  function SchemaGraph(
    {
      schema,
      settings: propSettings,
      selectedTable,
      onTableSelect,
      onNavigateToData,
      onOpenInCursor,
      colorMode = "dark",
      onCollapseSidebar,
      diff,
      showOnlyChanges = false,
    },
    ref,
  ) {
    const settings = { ...defaultSettings, ...propSettings };
    const { fitView } = useReactFlow();

    // Calculate initial layout
    const initialLayout = useMemo(() => {
      console.debug(`[SchemaGraph] Layout algorithm: ${settings.layout}`);
      const result = calculateLayout(schema, settings.layout);
      console.debug(
        `[SchemaGraph] Layout calculated: ${result.nodes.length} nodes`,
      );
      return result;
    }, [schema, settings.layout]);

    // Enhance nodes with additional data
    const enhancedNodes = useMemo(() => {
      return initialLayout.nodes.map((node) => {
        const table = node.data?.table as SchemaTable | undefined;
        const moduleColor = table?.module
          ? moduleColors[table.module] || moduleColors.default
          : moduleColors.default;

        const warnings = schema.health.warnings.filter(
          (w) => w.table === table?.name,
        );

        // Get diff data for this table if available
        const tableDiff: TableDiff | undefined = diff?.tableDiffs.get(
          table?.name ?? "",
        );

        return {
          ...node,
          data: {
            ...node.data,
            isSelected: selectedTable === table?.name,
            isHighlighted:
              settings.highlightedTable === table?.name ||
              (settings.searchQuery
                ? table?.name
                    .toLowerCase()
                    .includes(settings.searchQuery.toLowerCase())
                : undefined),
            showFields: settings.showFields,
            showIndexes: settings.showIndexes,
            moduleColor: settings.colorByModule ? moduleColor : undefined,
            hasWarnings: warnings.length > 0,
            onSelect: onTableSelect,
            onNavigateToData,
            onOpenInCursor,
            // Diff-related data
            diffStatus: tableDiff?.status,
            fieldDiffs: tableDiff?.fieldDiffs,
            indexDiffs: tableDiff?.indexDiffs,
          },
        };
      });
    }, [
      initialLayout.nodes,
      selectedTable,
      settings.highlightedTable,
      settings.searchQuery,
      settings.showFields,
      settings.showIndexes,
      settings.colorByModule,
      schema.health.warnings,
      onTableSelect,
      onNavigateToData,
      onOpenInCursor,
      diff,
    ]);

    // Enhance edges with additional data
    const enhancedEdges = useMemo(() => {
      if (!settings.showRelationships) return [];

      return initialLayout.edges.map((edge) => ({
        ...edge,
        data: {
          ...edge.data,
          showCardinality: settings.showCardinality,
          isHighlighted:
            selectedTable === edge.source || selectedTable === edge.target,
        },
      }));
    }, [
      initialLayout.edges,
      settings.showRelationships,
      settings.showCardinality,
      selectedTable,
    ]);

    // Apply search filter and diff filter
    const { nodes: filteredNodes, edges: filteredEdges } = useMemo(() => {
      let resultNodes = [...enhancedNodes];
      let resultEdges = [...enhancedEdges];

      // Filter by search query
      if (settings.searchQuery) {
        const query = settings.searchQuery.toLowerCase();
        const matchingNodeIds = new Set<string>();

        // Find matching nodes
        resultNodes.forEach((node) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const table = (node.data as any)?.table as SchemaTable | undefined;
          if (!table) return;

          // Match table name
          if (table.name.toLowerCase().includes(query)) {
            matchingNodeIds.add(node.id);
            return;
          }

          // Match field names
          if (table.fields.some((f) => f.name.toLowerCase().includes(query))) {
            matchingNodeIds.add(node.id);
          }
        });

        // Filter to matching nodes
        resultNodes = resultNodes.filter((n) => matchingNodeIds.has(n.id));

        // Filter edges to only include those between visible nodes
        resultEdges = resultEdges.filter(
          (e) => matchingNodeIds.has(e.source) && matchingNodeIds.has(e.target),
        );
      }

      // Filter to show only changed tables when in diff mode
      if (diff && showOnlyChanges) {
        resultNodes = resultNodes.filter((node) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const table = (node.data as any)?.table as SchemaTable | undefined;
          const tableDiff = diff.tableDiffs.get(table?.name ?? "");
          return tableDiff && tableDiff.status !== "unchanged";
        });
        // Filter edges to only include those between visible nodes
        const visibleNodeIds = new Set(resultNodes.map((n) => n.id));
        resultEdges = resultEdges.filter(
          (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target),
        );
      }

      return { nodes: resultNodes, edges: resultEdges };
    }, [
      enhancedNodes,
      enhancedEdges,
      settings.searchQuery,
      diff,
      showOnlyChanges,
    ]);

    // React Flow state
    const [nodes, setNodes, onNodesChange] = useNodesState(filteredNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(filteredEdges);

    // Update nodes/edges when filtered data changes
    useEffect(() => {
      setNodes(filteredNodes);
      setEdges(filteredEdges);
    }, [filteredNodes, filteredEdges, setNodes, setEdges]);

    // Fit view on initial load or layout change
    useEffect(() => {
      const timer = setTimeout(() => {
        fitView({ padding: 0.1, duration: 300 });
      }, 100);
      return () => clearTimeout(timer);
    }, [settings.layout, fitView]);

    // Handle node click
    const onNodeClick = useCallback(
      (_event: React.MouseEvent, node: Node) => {
        const table = node.data?.table as SchemaTable | undefined;
        if (table) {
          onTableSelect?.(table.name);
        }
      },
      [onTableSelect],
    );

    // Handle pane click (deselect)
    const onPaneClick = useCallback(() => {
      onTableSelect?.(null);
    }, [onTableSelect]);

    // MiniMap node color
    const getMinimapNodeColor = useCallback(
      (node: Node) => {
        const table = node.data?.table as SchemaTable | undefined;
        if (!table) return "#6b7280";
        if (settings.colorByModule && table.module) {
          return moduleColors[table.module] || moduleColors.default;
        }
        return "#6b7280";
      },
      [settings.colorByModule],
    );

    // Export as image
    const exportAsImage = useCallback(async (format: "png" | "svg") => {
      const reactFlowNode = document.querySelector(
        ".react-flow__viewport",
      ) as HTMLElement;
      if (!reactFlowNode) return;

      try {
        // Use canvas to capture the viewport
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = reactFlowNode.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        // For PNG, we'll use a simple canvas approach
        // Note: This is a basic implementation - for better results, consider using html2canvas
        ctx.fillStyle = getComputedStyle(reactFlowNode).backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Convert canvas to image
        const url = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `schema-export-${Date.now()}.${format}`;
        link.href = url;
        link.click();
      } catch (error) {
        console.error("Failed to export image:", error);
        // Fallback: try using Tauri screenshot if available
        try {
          const { invoke } = await import("@tauri-apps/api/core");
          await invoke("screenshot", {});
        } catch (e) {
          console.error("Screenshot fallback failed:", e);
        }
      }
    }, []);

    useImperativeHandle(ref, () => ({
      exportAsImage,
    }));

    // Compute background color from CSS variable
    const backgroundColor = useMemo(() => {
      if (typeof window === "undefined") return "#ffffff";
      const element = document.documentElement;
      const computedColor = getComputedStyle(element).getPropertyValue(
        "--color-border-muted",
      );
      return computedColor.trim() || "#ffffff";
    }, []);

    return (
      <div
        className="w-full h-full"
        style={{ backgroundColor: "var(--color-background-base)" }}
      >
        <EdgeMarkerDefinitions />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          colorMode={colorMode}
          fitView
          minZoom={0.1}
          maxZoom={2}
          defaultEdgeOptions={{
            type: "relationshipEdge",
            animated: false,
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            color={backgroundColor}
            gap={20}
            size={2}
            style={{ opacity: 1 }}
          />
          {onCollapseSidebar && (
            <button
              onClick={onCollapseSidebar}
              className="absolute bottom-26 left-4 p-1.5 rounded-lg transition-colors z-10"
              style={{
                backgroundColor: "var(--color-surface-raised)",
                border: "1px solid var(--color-border-strong)",
                color: "var(--color-text-subtle)",
                boxShadow: "var(--shadow-sm)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--color-text-base)";
                e.currentTarget.style.backgroundColor =
                  "var(--color-surface-overlay)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--color-text-subtle)";
                e.currentTarget.style.backgroundColor =
                  "var(--color-surface-raised)";
              }}
              title="Collapse sidebar"
            >
              <PanelLeftClose size={14} />
            </button>
          )}
          <Controls
            className="react-flow-controls-themed react-flow-controls-hoverable"
            showZoom
            showFitView
            showInteractive={false}
          />
          <MiniMap
            nodeColor={getMinimapNodeColor}
            maskColor="rgba(0, 0, 0, 0.6)"
            pannable
            zoomable
          />
        </ReactFlow>

        {/* Diff legend - shown when diff mode is active */}
        {diff && (
          <DiffLegend
            summary={diff.summary}
            position="top-left"
            compact={false}
          />
        )}
      </div>
    );
  },
);
