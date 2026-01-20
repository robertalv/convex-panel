import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  FolderOpen,
  RefreshCw,
  Undo2,
} from "lucide-react";
import { useDeployment } from "@/contexts/deployment-context";
import { useTheme } from "@/contexts/theme-context";
import { useSchema } from "../schema-visualizer/hooks/useSchema";
import { useComponents } from "@/views/data/hooks/useComponents";
import { ComponentSelector } from "@/components/component-selector";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Toolbar } from "@/components/ui/toolbar";
import type {
  HealthWarning,
  WarningAction,
  HealthSeverity,
} from "../schema-visualizer/types";
import { HealthScoreCard } from "./components/HealthScoreCard";
import { RecommendationCard } from "./components/RecommendationCard";
import { useDismissedWarnings } from "./hooks/useDismissedWarnings";
import { openSchemaInEditor } from "../../utils/editor";
import { applyFixToSchema } from "./utils/schema-editor";
import { useProjectPath } from "@/contexts/project-path-context";
import { SEVERITY_OPTIONS } from "@/lib/constants";

type SeverityFilter = HealthSeverity | "all";

export function PerformanceAdvisorView() {
  const { resolvedTheme } = useTheme();
  const { adminClient } = useDeployment();
  const { projectPath, selectProjectDirectory } = useProjectPath();

  const { components, setSelectedComponent, selectedComponentId } =
    useComponents({
      adminClient,
      useMockData: false,
    });

  const { schema, isLoading, error, refetch } = useSchema({
    adminClient,
    componentId: selectedComponentId,
  });

  const { dismissWarning, restoreAll, isDismissed, dismissedIds } =
    useDismissedWarnings();

  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [isApplying, setIsApplying] = useState<string | null>(null);

  const filteredWarnings = useMemo(() => {
    if (!schema?.health.warnings) return [];

    return schema.health.warnings.filter((w) => {
      if (isDismissed(w.id)) return false;

      if (severityFilter !== "all" && w.severity !== severityFilter)
        return false;

      return true;
    });
  }, [schema?.health.warnings, isDismissed, severityFilter]);

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

  const handleApplyFix = useCallback(
    async (warning: HealthWarning, action: WarningAction) => {
      if (!projectPath || !warning.table) {
        console.error("Cannot apply fix: missing project path or table name");
        return;
      }

      setIsApplying(warning.id);

      try {
        const result = await applyFixToSchema(
          projectPath,
          warning.table,
          action,
        );

        if (result.success) {
          toast.success("Index added successfully", {
            description: "Opening in editor...",
            duration: 3000,
          });

          dismissWarning(warning.id);

          if (result.lineNumber) {
            try {
              await openSchemaInEditor(projectPath, result.lineNumber);
            } catch (editorError) {
              console.error("Failed to open editor:", editorError);
              toast.error("Could not open editor", {
                description:
                  "The fix was applied successfully, but we couldn't open your editor. Check Settings to configure your preferred editor.",
              });
            }
          }
        } else {
          toast.error("Failed to apply fix", {
            description: result.message,
          });
        }
      } catch (err) {
        console.error("Failed to apply fix:", err);
        toast.error("Failed to apply fix", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        setIsApplying(null);
      }
    },
    [projectPath, dismissWarning],
  );

  const handleOpenInEditor = useCallback(
    async (_tableName: string) => {
      if (!projectPath) return;
      try {
        await openSchemaInEditor(projectPath);
      } catch (error) {
        console.error("Failed to open editor:", error);
        toast.error("Could not open editor", {
          description:
            "Check Settings to make sure your preferred editor is installed and available in your PATH.",
        });
      }
    },
    [projectPath],
  );

  const handleSelectProject = useCallback(async () => {
    await selectProjectDirectory();
  }, [selectProjectDirectory]);

  const dismissedCount = dismissedIds.size;
  const hasProjectPath = !!projectPath;

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
      {/* Toolbar */}
      <Toolbar
        left={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Component selector */}
          {components.length > 1 && (
            <>
              <ComponentSelector
                selectedComponentId={selectedComponentId}
                onSelect={setSelectedComponent}
                components={components}
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
        }
        right={
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
        }
      />

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
