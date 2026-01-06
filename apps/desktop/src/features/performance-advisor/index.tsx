/**
 * PerformanceAdvisorView
 * Main view component for the Performance Advisor feature
 * Styled to match other views with consistent toolbar
 */

import { useState, useMemo, useCallback } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FolderOpen,
  RefreshCw,
  Undo2,
} from "lucide-react";
import { useDeployment } from "@/contexts/DeploymentContext";
import { useMcpOptional } from "@/contexts/McpContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useSchema } from "../schema-visualizer/hooks/useSchema";
import { useComponents, ComponentSelector } from "convex-panel";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import type {
  HealthWarning,
  WarningAction,
  HealthSeverity,
} from "../schema-visualizer/types";
import { HealthScoreCard } from "./components/HealthScoreCard";
import { RecommendationCard } from "./components/RecommendationCard";
import { useDismissedWarnings } from "./hooks/useDismissedWarnings";
import { applyFixToSchema } from "./utils/schema-editor";

type SeverityFilter = HealthSeverity | "all";

const SEVERITY_OPTIONS = [
  { value: "all", label: "All severities" },
  { value: "error", label: "Errors only" },
  { value: "warning", label: "Warnings only" },
  { value: "info", label: "Suggestions only" },
];

export function PerformanceAdvisorView() {
  const { resolvedTheme } = useTheme();
  const { adminClient } = useDeployment();
  const mcp = useMcpOptional();

  // Components selector
  const {
    componentNames,
    selectedComponent,
    setSelectedComponent,
    selectedComponentId,
  } = useComponents({
    adminClient,
    useMockData: false,
  });

  // Fetch schema data
  const { schema, isLoading, error, refetch } = useSchema({
    adminClient,
    componentId: selectedComponentId,
  });

  // Dismissed warnings state
  const { dismissWarning, restoreAll, isDismissed, dismissedIds } =
    useDismissedWarnings();

  // Filter state
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [isApplying, setIsApplying] = useState<string | null>(null);

  // Filter warnings
  const filteredWarnings = useMemo(() => {
    if (!schema?.health.warnings) return [];

    return schema.health.warnings.filter((w) => {
      // Filter by dismissed state
      if (isDismissed(w.id)) return false;

      // Filter by severity
      if (severityFilter !== "all" && w.severity !== severityFilter)
        return false;

      return true;
    });
  }, [schema?.health.warnings, isDismissed, severityFilter]);

  // Group warnings by severity
  const warningsByType = useMemo(() => {
    const groups: Record<string, HealthWarning[]> = {
      error: [],
      warning: [],
      info: [],
    };

    filteredWarnings.forEach((w) => {
      groups[w.severity].push(w);
    });

    return groups;
  }, [filteredWarnings]);

  // Handle apply fix
  const handleApplyFix = useCallback(
    async (warning: HealthWarning, action: WarningAction) => {
      if (!mcp?.projectPath || !warning.table) {
        console.error("Cannot apply fix: missing project path or table name");
        return;
      }

      setIsApplying(warning.id);

      try {
        const result = await applyFixToSchema(
          mcp.projectPath,
          warning.table,
          action,
        );

        if (result.success) {
          // Show success - the warning will be resolved on next schema refresh
          console.log(result.message);
          // Optionally dismiss the warning
          dismissWarning(warning.id);
        } else {
          console.error(result.message);
          // TODO: Show error toast
        }
      } catch (err) {
        console.error("Failed to apply fix:", err);
      } finally {
        setIsApplying(null);
      }
    },
    [mcp?.projectPath, dismissWarning],
  );

  // Handle open in editor
  const handleOpenInEditor = useCallback(
    (_tableName: string) => {
      if (!mcp?.projectPath) return;
      mcp.openInCursor(`${mcp.projectPath}/convex/schema.ts`);
    },
    [mcp],
  );

  // Handle select project
  const handleSelectProject = useCallback(async () => {
    if (!mcp) return;
    await mcp.selectProjectDirectory();
  }, [mcp]);

  const dismissedCount = dismissedIds.size;
  const hasProjectPath = !!mcp?.projectPath;

  // Get health score color
  const healthColor = schema
    ? schema.health.score >= 80
      ? "var(--color-success-base)"
      : schema.health.score >= 60
        ? "var(--color-warning-base)"
        : "var(--color-error-base)"
    : "var(--color-text-muted)";

  return (
    <div
      className={`cp-theme-${resolvedTheme} h-full`}
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--color-background-base)",
      }}
    >
      {/* Toolbar - matching table-toolbar style */}
      <div
        style={{
          height: "40px",
          borderBottom: "1px solid var(--color-border-base)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 8px",
          backgroundColor: "var(--color-surface-base)",
        }}
      >
        {/* Left section */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Component selector */}
          {componentNames.length > 1 && (
            <>
              <ComponentSelector
                selectedComponent={selectedComponent}
                onSelect={setSelectedComponent}
                components={componentNames}
              />

              {/* Divider */}
              <div
                style={{
                  width: "1px",
                  height: "16px",
                  backgroundColor: "var(--color-border-base)",
                }}
              />
            </>
          )}

          {/* Severity filter */}
          <SearchableSelect
            value={severityFilter}
            options={SEVERITY_OPTIONS}
            onChange={(value) => setSeverityFilter(value as SeverityFilter)}
            placeholder="All severities"
            searchPlaceholder="Filter by severity..."
          />

          {/* Health score badge */}
          {schema && (
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
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  backgroundColor: "var(--color-surface-raised)",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: healthColor,
                  }}
                />
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "var(--color-text-base)",
                  }}
                >
                  Score: {schema.health.score}
                </span>
                {schema.health.warnings.length > 0 && (
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    ({schema.health.warnings.length} issue
                    {schema.health.warnings.length !== 1 ? "s" : ""})
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right section */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Restore dismissed */}
          {dismissedCount > 0 && (
            <button
              onClick={restoreAll}
              style={{
                height: "28px",
                padding: "0 10px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                fontWeight: 500,
                backgroundColor: "transparent",
                color: "var(--color-text-muted)",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--color-surface-raised)";
                e.currentTarget.style.color = "var(--color-text-base)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--color-text-muted)";
              }}
            >
              <Undo2 size={12} />
              <span>Restore {dismissedCount}</span>
            </button>
          )}

          {/* Divider */}
          <div
            style={{
              width: "1px",
              height: "16px",
              backgroundColor: "var(--color-border-base)",
            }}
          />

          {/* Refresh button */}
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            style={{
              height: "28px",
              padding: "0 12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: 500,
              backgroundColor: "var(--color-brand-base)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.7 : 1,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor =
                  "var(--color-brand-hover)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-brand-base)";
            }}
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "24px",
        }}
      >
        {/* Project path warning */}
        {!hasProjectPath && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              marginBottom: "24px",
              backgroundColor:
                "color-mix(in srgb, var(--color-warning-base) 10%, transparent)",
              border: "1px solid var(--color-warning-base)",
              borderRadius: "8px",
            }}
          >
            <AlertTriangle
              size={18}
              style={{ color: "var(--color-warning-base)", flexShrink: 0 }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--color-warning-base)",
                }}
              >
                Project not configured
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--color-text-muted)",
                  marginTop: "2px",
                }}
              >
                Select your Convex project directory to enable automatic fixes.
              </div>
            </div>
            <button
              onClick={handleSelectProject}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 500,
                border: "none",
                borderRadius: "6px",
                backgroundColor: "var(--color-warning-base)",
                color: "white",
                cursor: "pointer",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              <FolderOpen size={14} />
              Select Project
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px",
              color: "var(--color-text-muted)",
            }}
          >
            <RefreshCw size={24} className="animate-spin" />
            <span style={{ marginLeft: "12px" }}>Analyzing schema...</span>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div
            style={{
              padding: "16px",
              backgroundColor:
                "color-mix(in srgb, var(--color-error-base) 10%, transparent)",
              border: "1px solid var(--color-error-base)",
              borderRadius: "8px",
              color: "var(--color-error-base)",
            }}
          >
            <div style={{ fontWeight: 500, marginBottom: "4px" }}>
              Error loading schema
            </div>
            <div style={{ fontSize: "13px" }}>{error}</div>
          </div>
        )}

        {/* Schema health content */}
        {schema && !isLoading && (
          <div style={{ maxWidth: "900px", margin: "0 auto" }}>
            {/* Health Score Card */}
            <HealthScoreCard health={schema.health} />

            {/* Recommendations header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "32px",
                marginBottom: "16px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--color-text-base)",
                }}
              >
                Recommendations
              </h2>
              <span
                style={{
                  fontSize: "12px",
                  color: "var(--color-text-muted)",
                }}
              >
                {filteredWarnings.length} of {schema.health.warnings.length}{" "}
                shown
              </span>
            </div>

            {/* No issues state */}
            {filteredWarnings.length === 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "48px",
                  backgroundColor: "var(--color-surface-base)",
                  borderRadius: "12px",
                  border: "1px solid var(--color-border-base)",
                }}
              >
                <CheckCircle2
                  size={48}
                  style={{
                    color: "var(--color-success-base)",
                    marginBottom: "16px",
                  }}
                />
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 500,
                    color: "var(--color-text-base)",
                    marginBottom: "4px",
                  }}
                >
                  {schema.health.warnings.length === 0
                    ? "No issues found"
                    : "All issues addressed"}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {schema.health.warnings.length === 0
                    ? "Your schema is well-optimized!"
                    : `${dismissedCount} issue${dismissedCount === 1 ? "" : "s"} dismissed`}
                </div>
              </div>
            )}

            {/* Warnings list */}
            {filteredWarnings.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {/* Errors first */}
                {warningsByType.error.map((warning) => (
                  <RecommendationCard
                    key={warning.id}
                    warning={warning}
                    onApplyFix={hasProjectPath ? handleApplyFix : undefined}
                    onDismiss={dismissWarning}
                    onOpenInEditor={
                      hasProjectPath ? handleOpenInEditor : undefined
                    }
                    isApplying={isApplying === warning.id}
                  />
                ))}

                {/* Then warnings */}
                {warningsByType.warning.map((warning) => (
                  <RecommendationCard
                    key={warning.id}
                    warning={warning}
                    onApplyFix={hasProjectPath ? handleApplyFix : undefined}
                    onDismiss={dismissWarning}
                    onOpenInEditor={
                      hasProjectPath ? handleOpenInEditor : undefined
                    }
                    isApplying={isApplying === warning.id}
                  />
                ))}

                {/* Then info/suggestions */}
                {warningsByType.info.map((warning) => (
                  <RecommendationCard
                    key={warning.id}
                    warning={warning}
                    onApplyFix={hasProjectPath ? handleApplyFix : undefined}
                    onDismiss={dismissWarning}
                    onOpenInEditor={
                      hasProjectPath ? handleOpenInEditor : undefined
                    }
                    isApplying={isApplying === warning.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PerformanceAdvisorView;
