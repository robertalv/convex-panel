/**
 * FunctionsToolbar Component
 * Toolbar with organization mode switcher and run function button
 */

import { Play, List, Layers, PanelLeftClose } from "lucide-react";
import { ToolbarButton, IconButton } from "@/components/ui/button";
import type { OrganizationMode } from "./FunctionsSidebar";

/**
 * Get badge style for function type matching the panel design
 */
function getFunctionTypeBadgeStyle(udfType: string): React.CSSProperties {
  const normalizedType = udfType.toLowerCase();
  const typeMap: Record<string, { bg: string; text: string; border: string }> =
    {
      httpaction: {
        bg: "rgba(139, 92, 246, 0.1)",
        text: "#a78bfa",
        border: "rgba(139, 92, 246, 0.2)",
      },
      query: {
        bg: "rgba(245, 158, 11, 0.1)",
        text: "#f59e0b",
        border: "rgba(245, 158, 11, 0.2)",
      },
      mutation: {
        bg: "rgba(59, 130, 246, 0.1)",
        text: "#3b82f6",
        border: "rgba(59, 130, 246, 0.2)",
      },
      action: {
        bg: "rgba(34, 197, 94, 0.1)",
        text: "#22c55e",
        border: "rgba(34, 197, 94, 0.2)",
      },
    };
  const style = typeMap[normalizedType] || typeMap["query"];
  return {
    padding: "0px 2px",
    borderRadius: "6px",
    border: `1px solid ${style.border}`,
    backgroundColor: style.bg,
    color: style.text,
    textTransform: "capitalize",
  };
}

interface FunctionsToolbarProps {
  organizationMode: OrganizationMode;
  onOrganizationModeChange: (mode: OrganizationMode) => void;
  onRunFunction: () => void;
  selectedFunction: string | null;
  functionType?: string;
  functionIdentifier?: string;
  onCollapseSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

export function FunctionsToolbar({
  organizationMode,
  onOrganizationModeChange,
  onRunFunction,
  selectedFunction,
  functionType,
  functionIdentifier,
  onCollapseSidebar,
  sidebarCollapsed,
}: FunctionsToolbarProps) {
  return (
    <div
      className="flex items-center justify-between px-3 py-2 gap-3"
      style={{
        borderBottom: "1px solid var(--color-border-base)",
        backgroundColor: "var(--color-surface-base)",
      }}
    >
      {/* Left side: Collapse button + Organization mode switcher */}
      <div className="flex items-center gap-2">
        {/* Collapse sidebar button */}
        {onCollapseSidebar && !sidebarCollapsed && (
          <IconButton
            onClick={onCollapseSidebar}
            tooltip="Hide sidebar"
            variant="ghost"
            size="sm"
          >
            <PanelLeftClose size={16} />
          </IconButton>
        )}
        {/* Organization mode buttons */}
        <div
          className="flex items-center rounded-lg p-0.5"
          style={{ backgroundColor: "var(--color-surface-raised)" }}
        >
          <IconButton
            onClick={() => onOrganizationModeChange("byModule")}
            tooltip="By Module"
            variant="ghost"
            size="sm"
            style={{
              backgroundColor:
                organizationMode === "byModule"
                  ? "var(--color-surface-base)"
                  : "transparent",
              color:
                organizationMode === "byModule"
                  ? "var(--color-text-base)"
                  : "var(--color-text-muted)",
              boxShadow:
                organizationMode === "byModule"
                  ? "0 1px 2px rgba(0,0,0,0.1)"
                  : "none",
            }}
          >
            <List size={14} />
          </IconButton>
          <IconButton
            onClick={() => onOrganizationModeChange("byType")}
            tooltip="By Type"
            variant="ghost"
            size="sm"
            style={{
              backgroundColor:
                organizationMode === "byType"
                  ? "var(--color-surface-base)"
                  : "transparent",
              color:
                organizationMode === "byType"
                  ? "var(--color-text-base)"
                  : "var(--color-text-muted)",
              boxShadow:
                organizationMode === "byType"
                  ? "0 1px 2px rgba(0,0,0,0.1)"
                  : "none",
            }}
          >
            <Layers size={14} />
          </IconButton>
        </div>

        {/* Function info */}
        {selectedFunction && (
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--color-text-base)" }}
            >
              {selectedFunction}
            </span>
            {functionType && (
              <span
                className="text-xs px-0.5 py-0 rounded capitalize"
                style={{
                  ...getFunctionTypeBadgeStyle(functionType),
                  fontSize: "10px",
                  fontWeight: 500,
                }}
              >
                {functionType}
              </span>
            )}
            {functionIdentifier && (
              <span
                className="text-[10px] font-mono"
                style={{ color: "var(--color-text-subtle)" }}
              >
                {functionIdentifier}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right side: Run function button */}
      <div className="flex items-center gap-2">
        <ToolbarButton
          onClick={onRunFunction}
          disabled={!selectedFunction}
          variant="primary"
        >
          <Play size={14} />
          <span>Run Function</span>
        </ToolbarButton>
      </div>
    </div>
  );
}

export default FunctionsToolbar;
