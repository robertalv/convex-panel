import React from "react";
import { X, AlertTriangle, ExternalLink, Code } from "lucide-react";
import { Sheet } from "../../../components/shared/sheet";
import { IconButton } from "../../../components/shared";
import type { Insight } from "../../../utils/api/types";
import { ProblemForInsight } from "./problem-for-insight";
import { ChartForInsight } from "./chart-for-insight";
import { EventsForInsight } from "./events-for-insight";

export interface InsightBreakdownSheetProps {
  isOpen: boolean;
  onClose: () => void;
  insight: Insight | null;
  container?: HTMLElement | null;
}

const severityForInsightKind: Record<Insight["kind"], "error" | "warning"> = {
  bytesReadLimit: "error",
  bytesReadThreshold: "warning",
  documentsReadLimit: "error",
  documentsReadThreshold: "warning",
  occFailedPermanently: "error",
  occRetried: "warning",
};

const titleForInsightKind: Record<Insight["kind"], string> = {
  occRetried: "Write Conflicts (Retried)",
  occFailedPermanently: "Write Conflicts (Failed)",
  bytesReadLimit: "Bytes Read Limit Exceeded",
  bytesReadThreshold: "Approaching Bytes Read Limit",
  documentsReadLimit: "Documents Read Limit Exceeded",
  documentsReadThreshold: "Approaching Documents Read Limit",
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

export const InsightBreakdownSheet: React.FC<InsightBreakdownSheetProps> = ({
  isOpen,
  onClose,
  insight,
  container,
}) => {
  if (!isOpen || !insight) return null;

  const severity = severityForInsightKind[insight.kind];
  const title = titleForInsightKind[insight.kind];
  const functionName = functionIdentifierValue(
    insight.functionId,
    insight.componentPath,
  );

  const handleFunctionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (functionName && typeof window !== "undefined") {
      localStorage.setItem(
        "convex-panel-functions-selected-function",
        functionName,
      );
      localStorage.removeItem("convex-panel-functions-view-statistics-tab");
      window.dispatchEvent(
        new CustomEvent("convex-panel-navigate-to-functions-code", {
          detail: { functionIdentifier: functionName },
        }),
      );
    }
  };

  const sheetContent = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0px 16px",
          borderBottom: "1px solid var(--color-panel-border)",
          backgroundColor: "var(--color-panel-bg-secondary)",
          height: "48px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flex: 1,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {severity === "error" ? (
              <X
                size={16}
                style={{
                  color: "var(--color-panel-error)",
                  flexShrink: 0,
                }}
              />
            ) : (
              <AlertTriangle
                size={16}
                style={{
                  color: "var(--color-panel-warning)",
                  flexShrink: 0,
                }}
              />
            )}
            <span
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--color-panel-text)",
              }}
            >
              {title}
            </span>
          </div>
        </div>

        <IconButton icon={X} onClick={onClose} aria-label="Close sheet" />
      </div>

      {/* Scrollable Content */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* Function Name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "var(--color-panel-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Function
            </span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 600,
                fontFamily: "monospace",
                color: "var(--color-panel-text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={functionName}
            >
              {functionName}
            </span>
          </div>
          <button
            onClick={handleFunctionClick}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--color-panel-accent)",
              backgroundColor: "transparent",
              border: "1px solid var(--color-panel-accent)",
              borderRadius: "6px",
              cursor: "pointer",
              transition: "all 0.15s ease",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "color-mix(in srgb, var(--color-panel-accent) 10%, transparent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <Code size={14} />
            View Code
          </button>
        </div>

        {/* Problem Explanation */}
        <div
          style={{
            backgroundColor: "var(--color-panel-bg-tertiary)",
            border: "1px solid var(--color-panel-border)",
            borderRadius: "6px",
            padding: "16px",
          }}
        >
          <ProblemForInsight insight={insight} explain />
        </div>

        {/* Chart Section */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--color-panel-text)",
              }}
            >
              Activity Over Time
            </span>
            <span
              style={{
                fontSize: "11px",
                color: "var(--color-panel-text-muted)",
              }}
            >
              Last 72 hours
            </span>
          </div>
          <ChartForInsight insight={insight} height={180} />
        </div>

        {/* Events Section */}
        <EventsForInsight insight={insight} />

        {/* Documentation Link */}
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "var(--color-panel-bg-tertiary)",
            border: "1px solid var(--color-panel-border)",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              color: "var(--color-panel-text-secondary)",
            }}
          >
            Need help resolving this issue?
          </span>
          <a
            href="https://docs.convex.dev/dashboard/deployments/health#insights"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--color-panel-accent)",
              textDecoration: "none",
            }}
          >
            View Documentation
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      width="600px"
      container={container}
    >
      {sheetContent}
    </Sheet>
  );
};
