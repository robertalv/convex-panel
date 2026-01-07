import React from "react";
import { X, AlertTriangle } from "lucide-react";
import type { Insight } from "../../../utils/api/types";
import { Tooltip } from "../../../components/shared/tooltip";
import { ProblemForInsight } from "./problem-for-insight";
import { SparklineForInsight } from "./sparkline-for-insight";

const severityForInsightKind: Record<Insight["kind"], "error" | "warning"> = {
  bytesReadLimit: "error",
  bytesReadThreshold: "warning",
  documentsReadLimit: "error",
  documentsReadThreshold: "warning",
  occFailedPermanently: "error",
  occRetried: "warning",
};

// Helper to format function identifier
function functionIdentifierValue(
  functionId: string,
  componentPath?: string | null,
): string {
  if (componentPath) {
    return `${componentPath}/${functionId}`;
  }
  return functionId;
}

export interface InsightsSummaryListItemProps {
  insight: Insight;
  /** Called when the user clicks on the insight row */
  onSelect?: (insight: Insight) => void;
}

export const InsightsSummaryListItem: React.FC<
  InsightsSummaryListItemProps
> = ({ insight, onSelect }) => {
  const severity = severityForInsightKind[insight.kind];
  const functionName = functionIdentifierValue(
    insight.functionId,
    insight.componentPath,
  );

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(insight);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        display: "flex",
        width: "100%",
        minWidth: "fit-content",
        alignItems: "center",
        gap: "8px",
        borderBottom: "1px solid var(--color-panel-border)",
        padding: "8px",
        textAlign: "left",
        background: "none",
        borderLeft: "none",
        borderRight: "none",
        borderTop: "none",
        cursor: "pointer",
        fontSize: "12px",
        color: "var(--color-panel-text)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--color-panel-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <span style={{ width: "80px", minWidth: "80px" }}>
        {severity === "error" ? (
          <Tooltip
            content={
              <span>
                This insight is a critical problem and should be addressed soon.
              </span>
            }
            position="left"
          >
            <div
              style={{
                display: "flex",
                width: "fit-content",
                gap: "4px",
                alignItems: "center",
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid var(--color-panel-error)",
                backgroundColor:
                  "color-mix(in srgb, var(--color-panel-error) 10%, transparent)",
                color: "var(--color-panel-error)",
                fontSize: "12px",
              }}
            >
              <X size={14} />
              <span>Critical</span>
            </div>
          </Tooltip>
        ) : (
          <Tooltip
            content={
              <span>
                This insight indicates a potential issue and should be
                investigated.
              </span>
            }
            position="left"
          >
            <div
              style={{
                display: "flex",
                width: "fit-content",
                gap: "4px",
                alignItems: "center",
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid var(--color-panel-warning)",
                backgroundColor:
                  "color-mix(in srgb, var(--color-panel-warning) 10%, transparent)",
                color: "var(--color-panel-warning)",
                fontSize: "12px",
              }}
            >
              <AlertTriangle size={14} />
              <span>Warning</span>
            </div>
          </Tooltip>
        )}
      </span>
      <div
        style={{
          width: "288px",
          minWidth: "288px",
          fontWeight: 600,
          color: "var(--color-panel-text)",
        }}
      >
        {functionName}
      </div>
      <div style={{ width: "240px", minWidth: "240px" }}>
        <ProblemForInsight insight={insight} />
      </div>
      <div
        style={{
          height: "100%",
          width: "240px",
          minWidth: "240px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <SparklineForInsight insight={insight} />
      </div>
    </button>
  );
};
