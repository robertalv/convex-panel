/**
 * RelationshipEdge Component
 * Custom edge for rendering relationships between tables
 */

import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import type { SchemaRelationship } from "@convex-panel/shared";

interface RelationshipEdgeData {
  relationship: SchemaRelationship;
  isHighlighted?: boolean;
  showCardinality?: boolean;
}

function RelationshipEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  style,
}: EdgeProps) {
  const edgeData = data as unknown as RelationshipEdgeData | undefined;
  const relationship = edgeData?.relationship;
  const isHighlighted = edgeData?.isHighlighted ?? false;
  const showCardinality = edgeData?.showCardinality ?? true;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Determine edge color based on state
  // Use explicit colors for better performance (avoid getComputedStyle on every render)
  const strokeColor = selected
    ? "#3b82f6"
    : isHighlighted
      ? "#f59e0b"
      : "#71717a"; // Default gray color

  // Increase default stroke width for better visibility
  const strokeWidth = selected || isHighlighted ? 2.5 : 1.5;
  // Increase default opacity so relationships are clearly visible
  const opacity = isHighlighted === false ? 0.7 : 1;

  // Cardinality marker
  const cardinalityLabel =
    relationship?.cardinality === "one-to-many"
      ? "1:N"
      : relationship?.cardinality === "many-to-many"
        ? "N:M"
        : "1:1";

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth,
          opacity,
        }}
        markerEnd={`url(#arrow-${selected ? "selected" : isHighlighted ? "highlighted" : "default"})`}
      />

      {/* Edge label */}
      {showCardinality && relationship && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
              opacity,
            }}
            className="nodrag nopan"
          >
            <div
              className="px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-1"
              style={{
                backgroundColor: "var(--color-surface-overlay)",
                border: "1px solid var(--color-border-base)",
                color: "var(--color-text-base)",
              }}
              title={`${relationship.from}.${relationship.field} -> ${relationship.to}`}
            >
              <span style={{ color: "var(--color-text-muted)" }}>
                {relationship.field}
              </span>
              <span
                style={{
                  color: relationship.isArray
                    ? "var(--color-info-base)"
                    : relationship.optional
                      ? "var(--color-text-muted)"
                      : "var(--color-warning-base)",
                }}
              >
                {cardinalityLabel}
              </span>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

/**
 * SVG marker definitions for edge arrows
 */
export function EdgeMarkerDefinitions() {
  return (
    <svg style={{ position: "absolute", width: 0, height: 0 }}>
      <defs>
        {/* Default arrow */}
        <marker
          id="arrow-default"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#71717a" />
        </marker>

        {/* Selected arrow */}
        <marker
          id="arrow-selected"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
        </marker>

        {/* Highlighted arrow */}
        <marker
          id="arrow-highlighted"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
        </marker>
      </defs>
    </svg>
  );
}

export const RelationshipEdge = memo(RelationshipEdgeComponent);
