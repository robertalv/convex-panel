/**
 * DiffLegend Component
 * Visual legend showing the meaning of diff status colors
 */

import React, { memo } from "react";
import { Plus, Minus, RefreshCw } from "lucide-react";
import type { DiffSummary } from "../types";

interface DiffLegendProps {
  /** Summary of the diff (optional - shows counts if provided) */
  summary?: DiffSummary;
  /** Position of the legend */
  position?: "bottom-left" | "bottom-right" | "top-left" | "top-right";
  /** Whether to show in compact mode */
  compact?: boolean;
}

const DIFF_LEGEND_ITEMS = [
  {
    status: "added" as const,
    label: "Added",
    color: "#22c55e",
    bgColor: "#22c55e15",
    icon: Plus,
  },
  {
    status: "removed" as const,
    label: "Removed",
    color: "#ef4444",
    bgColor: "#ef444415",
    icon: Minus,
  },
  {
    status: "modified" as const,
    label: "Modified",
    color: "#f59e0b",
    bgColor: "#f59e0b15",
    icon: RefreshCw,
  },
];

function DiffLegendComponent({
  summary,
  position = "bottom-right",
  compact = false,
}: DiffLegendProps) {
  const positionStyles: Record<string, React.CSSProperties> = {
    "bottom-left": { bottom: 16, left: 16 },
    "bottom-right": { bottom: 16, right: 16 },
    "top-left": { top: 16, left: 16 },
    "top-right": { top: 16, right: 16 },
  };

  return (
    <div
      style={{
        position: "absolute",
        ...positionStyles[position],
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "16px",
        padding: "10px 14px",
        backgroundColor: "var(--color-surface-overlay)",
        border: "1px solid var(--color-border-base)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-md)",
        zIndex: 10,
        backdropFilter: "blur(8px)",
      }}
    >
      {!compact && (
        <div
          style={{
            fontSize: "10px",
            fontWeight: 600,
            textTransform: "uppercase",
            color: "var(--color-text-subtle)",
            letterSpacing: "0.05em",
            marginRight: "4px",
          }}
        >
          Changes
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "0",
        }}
      >
        {DIFF_LEGEND_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const count = summary
            ? item.status === "added"
              ? summary.tablesAdded
              : item.status === "removed"
                ? summary.tablesRemoved
                : summary.tablesModified
            : null;

          return (
            <React.Fragment key={item.status}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  paddingRight: index < DIFF_LEGEND_ITEMS.length - 1 ? "16px" : "0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "18px",
                    height: "18px",
                    borderRadius: "4px",
                    backgroundColor: item.bgColor,
                    border: `1.5px solid ${item.color}`,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={9} style={{ color: item.color }} strokeWidth={2.5} />
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "var(--color-text-base)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                  {count !== null && count > 0 && (
                    <span
                      style={{
                        marginLeft: "4px",
                        color: item.color,
                        fontWeight: 600,
                      }}
                    >
                      {count}
                    </span>
                  )}
                </span>
              </div>
              {index < DIFF_LEGEND_ITEMS.length - 1 && (
                <div
                  style={{
                    width: "1px",
                    height: "16px",
                    backgroundColor: "var(--color-border-base)",
                    marginRight: "16px",
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Total summary */}
      {summary && summary.tablesUnchanged > 0 && (
        <>
          <div
            style={{
              width: "1px",
              height: "16px",
              backgroundColor: "var(--color-border-base)",
            }}
          />
          <div
            style={{
              fontSize: "11px",
              color: "var(--color-text-muted)",
              whiteSpace: "nowrap",
            }}
          >
            {summary.tablesUnchanged} unchanged
          </div>
        </>
      )}
    </div>
  );
}

export const DiffLegend = memo(DiffLegendComponent);
