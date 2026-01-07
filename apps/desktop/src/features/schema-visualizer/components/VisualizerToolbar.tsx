/**
 * VisualizerToolbar Component
 * Toolbar with layout controls, search, and export options
 * Styled to match table-toolbar.tsx from convex-panel
 */

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Download,
  RefreshCw,
  AlertTriangle,
  GitCompare,
  ChevronRight,
  Github,
} from "lucide-react";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import type { RemoteGitCommit } from "../hooks/useRemoteSchemaHistory";
import type {
  LayoutAlgorithm,
  VisualizationSettings,
  ExportFormat,
  SchemaHealth,
  DiffModeSettings,
  DiffViewMode,
} from "../types";

interface VisualizerToolbarProps {
  settings: VisualizationSettings;
  onLayoutChange: (layout: LayoutAlgorithm) => void;
  onExport: (format: ExportFormat) => void;
  onResetLayout: () => void;
  health: SchemaHealth;
  onHealthPanelToggle: () => void;
  showHealthPanel: boolean;
  // Diff mode props
  diffMode?: DiffModeSettings;
  onDiffModeChange?: (settings: Partial<DiffModeSettings>) => void;
  hasDiffChanges?: boolean;
  // Local schema props
  hasLocalSchema?: boolean;
  // GitHub integration props (remote)
  isGitHubConnected?: boolean;
  gitHubRepo?: { id: number; full_name: string } | null;
  gitHubRepos?: Array<{
    id: number;
    full_name: string;
    name: string;
    owner: { login: string };
    private: boolean;
  }>;
  gitHubReposLoading?: boolean;
  remoteCommits?: RemoteGitCommit[];
  remoteBranches?: Array<{ name: string; sha: string }>;
  remoteBranchesLoading?: boolean;
  remoteCurrentBranch?: string | null;
  onRemoteBranchChange?: (branch: string) => void;
  /** Select a GitHub commit for diff comparison - specifies target field */
  onSelectRemoteCommitForDiff?: (
    commit: RemoteGitCommit,
    target: "from" | "to",
  ) => void;
  onConnectGitHub?: () => void;
  onRepoChange?: (repoFullName: string) => void;
  /** Callback for server-side repository search (triggers after 3+ chars) */
  onRepoSearch?: (query: string) => void;
}

const layoutOptions: {
  value: LayoutAlgorithm;
  label: string;
}[] = [
  { value: "hierarchical", label: "Hierarchical" },
  { value: "force-directed", label: "Force-Directed" },
  { value: "circular", label: "Circular" },
  { value: "grid", label: "Grid" },
];

const exportOptions: { value: ExportFormat; label: string }[] = [
  { value: "png", label: "PNG Image" },
  { value: "svg", label: "SVG Vector" },
  { value: "mermaid", label: "Mermaid Diagram" },
  { value: "json", label: "JSON Data" },
];

const viewModeOptions: { value: DiffViewMode; label: string }[] = [
  { value: "visual-overlay", label: "Visual Overlay" },
  { value: "side-by-side", label: "Side by Side" },
  { value: "unified", label: "Unified" },
];

/**
 * Format a timestamp for display in the version selector
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return "just now";
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}

function ToggleButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        height: "28px",
        padding: "0 8px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "12px",
        fontWeight: 500,
        backgroundColor: active ? "var(--color-surface-raised)" : "transparent",
        color: active ? "var(--color-text-base)" : "var(--color-text-muted)",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = "var(--color-text-base)";
          e.currentTarget.style.backgroundColor = "var(--color-surface-raised)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = "var(--color-text-muted)";
          e.currentTarget.style.backgroundColor = "transparent";
        }
      }}
      title={title}
    >
      {children}
    </button>
  );
}

export function VisualizerToolbar({
  settings,
  onLayoutChange,
  onExport,
  onResetLayout,
  health,
  onHealthPanelToggle,
  showHealthPanel,
  diffMode,
  onDiffModeChange,
  hasDiffChanges = false,
  // Local schema
  hasLocalSchema = false,
  // GitHub integration (remote)
  isGitHubConnected = false,
  gitHubRepo = null,
  gitHubRepos = [],
  gitHubReposLoading = false,
  remoteCommits = [],
  remoteBranches = [],
  remoteBranchesLoading = false,
  remoteCurrentBranch = null,
  onRemoteBranchChange,
  onSelectRemoteCommitForDiff,
  onConnectGitHub,
  onRepoChange,
  onRepoSearch,
}: VisualizerToolbarProps) {
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportTriggerRef = useRef<HTMLButtonElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const [exportDropdownPosition, setExportDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const healthColor =
    health.score >= 80
      ? "var(--color-success-base)"
      : health.score >= 60
        ? "var(--color-warning-base)"
        : "var(--color-error-base)";

  // Export dropdown position calculation
  useEffect(() => {
    if (showExportDropdown && exportTriggerRef.current) {
      const updatePosition = () => {
        if (exportTriggerRef.current) {
          const rect = exportTriggerRef.current.getBoundingClientRect();
          setExportDropdownPosition({
            top: rect.bottom + 4,
            left: rect.right,
            width: Math.max(rect.width, 200),
          });
        }
      };

      requestAnimationFrame(() => {
        updatePosition();
      });

      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    } else {
      setExportDropdownPosition(null);
    }
  }, [showExportDropdown]);

  // Export dropdown click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(target) &&
        exportTriggerRef.current &&
        !exportTriggerRef.current.contains(target)
      ) {
        setShowExportDropdown(false);
      }
    };

    if (showExportDropdown) {
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 10);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showExportDropdown]);

  return (
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
        {/* Layout selector */}
        <SearchableSelect
          value={settings.layout}
          options={layoutOptions.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          onChange={(value) => onLayoutChange(value as LayoutAlgorithm)}
          placeholder="Layout"
          searchPlaceholder="Search layout..."
        />

        {/* Reset layout */}
        <button
          onClick={onResetLayout}
          style={{
            height: "28px",
            width: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "transparent",
            color: "var(--color-text-muted)",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--color-text-base)";
            e.currentTarget.style.backgroundColor =
              "var(--color-surface-raised)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--color-text-muted)";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
          title="Reset layout"
        >
          <RefreshCw size={14} />
        </button>

        {/* Diff Mode Section */}
        {diffMode && onDiffModeChange && (
          <>
            {/* Divider */}
            <div
              style={{
                width: "1px",
                height: "16px",
                backgroundColor: "var(--color-border-base)",
              }}
            />

            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {/* Diff toggle button */}
              <ToggleButton
                active={diffMode.enabled}
                onClick={() => onDiffModeChange({ enabled: !diffMode.enabled })}
                title={
                  diffMode.enabled ? "Disable diff mode" : "Enable diff mode"
                }
              >
                <GitCompare size={12} />
                <span>Diff</span>
                {hasDiffChanges && diffMode.enabled && (
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: "#f59e0b",
                    }}
                  />
                )}
              </ToggleButton>

              {diffMode.enabled && remoteCommits.length > 0 && (
                <>
                  <SearchableSelect
                    value={diffMode.fromSnapshotId || ""}
                    options={[
                      // GitHub commits (if connected and repo selected)
                      ...(isGitHubConnected &&
                      gitHubRepo &&
                      remoteCommits.length > 0
                        ? remoteCommits.map((c) => ({
                            value: `github:${c.sha}`,
                            label: `${c.shortSha}: ${c.message.substring(0, 40)}${c.message.length > 40 ? "..." : ""}`,
                            sublabel: `${c.author} - ${formatTimestamp(c.timestamp)}`,
                          }))
                        : []),
                    ]}
                    onChange={(value) => {
                      // Handle GitHub commit selection
                      if (value?.startsWith("github:")) {
                        const sha = value.replace("github:", "");
                        const commit = remoteCommits.find((c) => c.sha === sha);
                        if (commit && onSelectRemoteCommitForDiff) {
                          onSelectRemoteCommitForDiff(commit, "from");
                        }
                      } else {
                        onDiffModeChange?.({ fromSnapshotId: value || null });
                      }
                    }}
                    placeholder="From..."
                    searchPlaceholder="Search commits..."
                    sublabelAsText={true}
                  />

                  <ChevronRight
                    size={14}
                    style={{ color: "var(--color-text-muted)" }}
                  />

                  <SearchableSelect
                    value={diffMode.toSnapshotId || "__current__"}
                    options={[
                      // Built-in options
                      {
                        value: "__current__",
                        label: "Current (Deployed)",
                      },
                      ...(hasLocalSchema
                        ? [
                            {
                              value: "__local__",
                              label: "Local (schema.ts)",
                            },
                          ]
                        : []),
                      // GitHub commits (if connected and repo selected)
                      ...(isGitHubConnected &&
                      gitHubRepo &&
                      remoteCommits.length > 0
                        ? remoteCommits.map((c) => ({
                            value: `github:${c.sha}`,
                            label: `${c.shortSha}: ${c.message.substring(0, 40)}${c.message.length > 40 ? "..." : ""}`,
                            sublabel: `${c.author} - ${formatTimestamp(c.timestamp)}`,
                          }))
                        : []),
                    ]}
                    onChange={(value) => {
                      // Handle GitHub commit selection
                      if (value?.startsWith("github:")) {
                        const sha = value.replace("github:", "");
                        const commit = remoteCommits.find((c) => c.sha === sha);
                        if (commit && onSelectRemoteCommitForDiff) {
                          onSelectRemoteCommitForDiff(commit, "to");
                        }
                      } else {
                        // Keep __current__ as the value, but internally treat it as null for the diff logic
                        onDiffModeChange?.({
                          toSnapshotId:
                            value === "__current__" ? null : value || null,
                        });
                      }
                    }}
                    placeholder="To..."
                    searchPlaceholder="Search commits..."
                    sublabelAsText={true}
                  />

                  {/* View mode selector */}
                  <SearchableSelect
                    value={diffMode.viewMode}
                    options={viewModeOptions.map((o) => ({
                      value: o.value,
                      label: o.label,
                    }))}
                    onChange={(value) =>
                      onDiffModeChange?.({ viewMode: value as DiffViewMode })
                    }
                    placeholder="View..."
                    searchPlaceholder="View mode..."
                  />
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right section */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {/* GitHub integration section - ONLY shown when diff mode is enabled */}
        {diffMode?.enabled && (
          <>
            {!isGitHubConnected ? (
              // Show compact "Add GitHub" button when not connected
              onConnectGitHub && (
                <button
                  onClick={onConnectGitHub}
                  style={{
                    height: "28px",
                    padding: "0 10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    fontWeight: 500,
                    backgroundColor: "transparent",
                    color: "var(--color-text-muted)",
                    border: "1px dashed var(--color-border-base)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--color-brand-base)";
                    e.currentTarget.style.color = "var(--color-text-base)";
                    e.currentTarget.style.backgroundColor =
                      "var(--color-surface-raised)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--color-border-base)";
                    e.currentTarget.style.color = "var(--color-text-muted)";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  title="Connect GitHub for commit history in diff"
                >
                  <Github size={14} />
                  <span>Add GitHub History</span>
                </button>
              )
            ) : (
              <>
                {/* Repo selector - only show if no repo selected yet */}
                {!gitHubRepo && onRepoChange && (
                  <SearchableSelect
                    value=""
                    options={gitHubRepos.map((repo) => ({
                      value: repo.full_name,
                      label: repo.name,
                      sublabel: repo.owner.login,
                    }))}
                    onChange={onRepoChange}
                    placeholder={
                      gitHubReposLoading ? "Loading..." : "Select repo..."
                    }
                    searchPlaceholder="Search repositories..."
                    loading={gitHubReposLoading}
                    onSearchChange={onRepoSearch}
                    minSearchLength={3}
                    sublabelAsText
                  />
                )}

                {/* Branch selector - only show if repo is selected */}
                {gitHubRepo &&
                  (remoteBranches.length > 0 || remoteBranchesLoading) &&
                  onRemoteBranchChange && (
                    <SearchableSelect
                      value={remoteCurrentBranch || ""}
                      options={remoteBranches.map((branch) => ({
                        value: branch.name,
                        label: branch.name,
                      }))}
                      onChange={onRemoteBranchChange}
                      placeholder={
                        remoteBranchesLoading ? "Loading..." : "Branch..."
                      }
                      searchPlaceholder="Search branches..."
                      loading={remoteBranchesLoading}
                    />
                  )}
              </>
            )}

            {/* Divider after GitHub section */}
            <div
              style={{
                width: "1px",
                height: "16px",
                backgroundColor: "var(--color-border-base)",
              }}
            />
          </>
        )}

        {/* Health indicator */}
        <button
          onClick={onHealthPanelToggle}
          style={{
            height: "28px",
            padding: "0 10px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            fontWeight: 500,
            backgroundColor: showHealthPanel
              ? "var(--color-surface-raised)"
              : "transparent",
            color: showHealthPanel
              ? "var(--color-text-base)"
              : "var(--color-text-muted)",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (!showHealthPanel) {
              e.currentTarget.style.backgroundColor =
                "var(--color-surface-raised)";
            }
          }}
          onMouseLeave={(e) => {
            if (!showHealthPanel) {
              e.currentTarget.style.backgroundColor = "transparent";
            }
          }}
        >
          <AlertTriangle size={14} style={{ color: healthColor }} />
          <span style={{ color: healthColor }}>{health.score}%</span>
          {health.warnings.length > 0 && (
            <span style={{ color: "var(--color-text-muted)" }}>
              ({health.warnings.length})
            </span>
          )}
        </button>

        {/* Divider */}
        <div
          style={{
            width: "1px",
            height: "16px",
            backgroundColor: "var(--color-border-base)",
          }}
        />

        {/* Export */}
        <div style={{ position: "relative" }}>
          <button
            ref={exportTriggerRef}
            onClick={() => setShowExportDropdown(!showExportDropdown)}
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
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "var(--color-brand-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-brand-base)";
            }}
          >
            <Download size={14} />
            <span>Export</span>
          </button>

          {showExportDropdown &&
            exportDropdownPosition &&
            createPortal(
              <div
                ref={exportDropdownRef}
                style={{
                  position: "fixed",
                  top: `${exportDropdownPosition.top}px`,
                  left: `${exportDropdownPosition.left - exportDropdownPosition.width}px`,
                  minWidth: "200px",
                  maxWidth: "280px",
                  width: `${exportDropdownPosition.width}px`,
                  backgroundColor: "var(--color-surface-overlay)",
                  border: "1px solid var(--color-border-base)",
                  borderRadius: "12px",
                  boxShadow: "var(--shadow-lg)",
                  zIndex: 100000,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  pointerEvents: "auto",
                  animation: "exportDropdownFadeUp 0.15s ease",
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {/* Options List */}
                <div
                  style={{
                    padding: "4px",
                  }}
                >
                  {exportOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onExport(option.value);
                        setShowExportDropdown(false);
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                        padding: "6px 8px",
                        border: "none",
                        borderRadius: "10px",
                        backgroundColor: "transparent",
                        cursor: "pointer",
                        transition: "background-color 0.1s ease",
                        textAlign: "left",
                        marginBottom: "2px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--color-surface-raised)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <span
                        style={{
                          fontSize: "13px",
                          color: "var(--color-text-base)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Keyframe animation styles */}
                <style>{`
                  @keyframes exportDropdownFadeUp {
                    from {
                      opacity: 0;
                      transform: translateY(-4px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }
                `}</style>
              </div>,
              document.body,
            )}
        </div>
      </div>
    </div>
  );
}
