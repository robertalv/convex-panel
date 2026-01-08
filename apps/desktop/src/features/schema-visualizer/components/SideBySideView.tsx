/**
 * SideBySideView Component
 * Shows two schema graphs side by side with synchronized pan/zoom
 * Left: "From" schema (old version, no diff highlighting)
 * Right: "To" schema (new version, with diff highlighting)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ReactFlowProvider, useReactFlow, type Viewport } from "@xyflow/react";
import type { SchemaDiff, VisualizationSettings } from "@convex-panel/shared";
import { SchemaGraph } from "./SchemaGraph";

interface SideBySideViewProps {
  diff: SchemaDiff;
  settings?: Partial<VisualizationSettings>;
  colorMode?: "dark" | "light";
  selectedTable?: string | null;
  onTableSelect?: (tableName: string | null) => void;
  onNavigateToData?: (tableName: string) => void;
  onOpenInCursor?: (tableName: string) => void;
  showOnlyChanges?: boolean;
}

/**
 * Inner component that handles viewport synchronization
 * Must be used within a ReactFlowProvider
 */
function SyncedGraph({
  schema,
  settings,
  colorMode,
  selectedTable,
  onTableSelect,
  onNavigateToData,
  onOpenInCursor,
  diff,
  showOnlyChanges,
  onViewportChange,
  externalViewport,
  isSource,
}: {
  schema: SchemaDiff["from"]["schema"] | SchemaDiff["to"]["schema"];
  settings?: Partial<VisualizationSettings>;
  colorMode?: "dark" | "light";
  selectedTable?: string | null;
  onTableSelect?: (tableName: string | null) => void;
  onNavigateToData?: (tableName: string) => void;
  onOpenInCursor?: (tableName: string) => void;
  diff?: SchemaDiff | null;
  showOnlyChanges?: boolean;
  onViewportChange: (viewport: Viewport) => void;
  externalViewport: Viewport | null;
  isSource: boolean;
}) {
  const { setViewport, getViewport } = useReactFlow();
  const isUpdatingRef = useRef(false);
  const lastViewportRef = useRef<Viewport | null>(null);

  // Sync viewport from external source
  useEffect(() => {
    if (externalViewport && !isSource) {
      // Prevent feedback loop
      if (isUpdatingRef.current) return;

      const currentViewport = getViewport();
      // Only update if viewport actually changed
      if (
        currentViewport.x !== externalViewport.x ||
        currentViewport.y !== externalViewport.y ||
        currentViewport.zoom !== externalViewport.zoom
      ) {
        isUpdatingRef.current = true;
        setViewport(externalViewport, { duration: 0 });
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 50);
      }
    }
  }, [externalViewport, isSource, setViewport, getViewport]);

  // Notify parent of viewport changes (with debounce)
  const handleMove = useCallback(() => {
    if (isUpdatingRef.current) return;

    const viewport = getViewport();
    // Only emit if actually changed
    if (
      !lastViewportRef.current ||
      lastViewportRef.current.x !== viewport.x ||
      lastViewportRef.current.y !== viewport.y ||
      lastViewportRef.current.zoom !== viewport.zoom
    ) {
      lastViewportRef.current = viewport;
      onViewportChange(viewport);
    }
  }, [getViewport, onViewportChange]);

  return (
    <div
      className="w-full h-full"
      onMouseMove={isSource ? handleMove : undefined}
      onWheel={isSource ? handleMove : undefined}
    >
      <SchemaGraph
        schema={schema}
        settings={settings}
        colorMode={colorMode}
        selectedTable={selectedTable}
        onTableSelect={onTableSelect}
        onNavigateToData={onNavigateToData}
        onOpenInCursor={onOpenInCursor}
        diff={diff}
        showOnlyChanges={showOnlyChanges}
      />
    </div>
  );
}

export function SideBySideView({
  diff,
  settings,
  colorMode = "dark",
  selectedTable,
  onTableSelect,
  onNavigateToData,
  onOpenInCursor,
  showOnlyChanges = false,
}: SideBySideViewProps) {
  // Track which side is being interacted with
  const [activeSource, setActiveSource] = useState<"left" | "right" | null>(
    null,
  );
  const [sharedViewport, setSharedViewport] = useState<Viewport | null>(null);

  // Handle viewport change from either side
  const handleLeftViewportChange = useCallback((viewport: Viewport) => {
    setActiveSource("left");
    setSharedViewport(viewport);
  }, []);

  const handleRightViewportChange = useCallback((viewport: Viewport) => {
    setActiveSource("right");
    setSharedViewport(viewport);
  }, []);

  return (
    <div
      className="h-full flex flex-col"
      style={{ backgroundColor: "var(--color-background-base)" }}
    >
      {/* Headers */}
      <div
        className="flex"
        style={{ borderBottom: "1px solid var(--color-border-base)" }}
      >
        {/* Left header (From) */}
        <div
          className="flex-1 px-4 py-2 text-center"
          style={{
            backgroundColor: "var(--color-surface-base)",
            borderRight: "1px solid var(--color-border-base)",
          }}
        >
          <span
            className="text-sm font-medium px-2 py-1 rounded"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              color: "#ef4444",
            }}
          >
            {diff.from.label}
          </span>
          <span
            className="ml-2 text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            (Previous)
          </span>
        </div>

        {/* Right header (To) */}
        <div
          className="flex-1 px-4 py-2 text-center"
          style={{ backgroundColor: "var(--color-surface-base)" }}
        >
          <span
            className="text-sm font-medium px-2 py-1 rounded"
            style={{
              backgroundColor: "rgba(34, 197, 94, 0.15)",
              color: "#22c55e",
            }}
          >
            {diff.to.label}
          </span>
          <span
            className="ml-2 text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            (Current)
          </span>
        </div>
      </div>

      {/* Graphs */}
      <div className="flex-1 flex min-h-0">
        {/* Left graph (From - no diff highlighting) */}
        <div
          className="flex-1 relative"
          style={{ borderRight: "2px solid var(--color-border-base)" }}
          onMouseEnter={() => setActiveSource("left")}
        >
          <ReactFlowProvider>
            <SyncedGraph
              schema={diff.from.schema}
              settings={settings}
              colorMode={colorMode}
              selectedTable={selectedTable}
              onTableSelect={onTableSelect}
              onNavigateToData={onNavigateToData}
              onOpenInCursor={onOpenInCursor}
              diff={null} // No diff highlighting on "from" side
              showOnlyChanges={false}
              onViewportChange={handleLeftViewportChange}
              externalViewport={
                activeSource === "right" ? sharedViewport : null
              }
              isSource={activeSource === "left"}
            />
          </ReactFlowProvider>
        </div>

        {/* Right graph (To - with diff highlighting) */}
        <div
          className="flex-1 relative"
          onMouseEnter={() => setActiveSource("right")}
        >
          <ReactFlowProvider>
            <SyncedGraph
              schema={diff.to.schema}
              settings={settings}
              colorMode={colorMode}
              selectedTable={selectedTable}
              onTableSelect={onTableSelect}
              onNavigateToData={onNavigateToData}
              onOpenInCursor={onOpenInCursor}
              diff={diff} // With diff highlighting
              showOnlyChanges={showOnlyChanges}
              onViewportChange={handleRightViewportChange}
              externalViewport={activeSource === "left" ? sharedViewport : null}
              isSource={activeSource === "right"}
            />
          </ReactFlowProvider>
        </div>
      </div>

      {/* Footer with sync indicator */}
      <div
        className="flex items-center justify-center px-4 py-1.5 text-xs"
        style={{
          backgroundColor: "var(--color-surface-base)",
          borderTop: "1px solid var(--color-border-base)",
          color: "var(--color-text-muted)",
        }}
      >
        Pan and zoom are synchronized between views
      </div>
    </div>
  );
}

export default SideBySideView;
