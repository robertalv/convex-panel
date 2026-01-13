/**
 * GitCommitSelector Component
 * Dropdown for selecting git commits to compare schema versions
 */

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  GitBranch,
  GitCommit,
  RefreshCw,
  Download,
  ChevronDown,
} from "lucide-react";
import type { GitCommit as GitCommitType } from "../hooks/useGitSchemaHistory";

interface GitCommitSelectorProps {
  commits: GitCommitType[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onSaveCommit: (commit: GitCommitType) => Promise<void>;
  currentBranch: string | null;
  isGitRepo: boolean;
}

/**
 * Format a relative time string
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
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
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}

export function GitCommitSelector({
  commits,
  loading,
  error,
  onRefresh,
  onSaveCommit,
  currentBranch,
  isGitRepo,
}: GitCommitSelectorProps) {
  // Null safety: ensure commits is always an array
  const safeCommits = commits ?? [];
  const [isOpen, setIsOpen] = useState(false);
  const [savingCommit, setSavingCommit] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  // Handle save commit
  const handleSaveCommit = async (commit: GitCommitType) => {
    setSavingCommit(commit.hash);
    try {
      await onSaveCommit(commit);
    } catch (err) {
      console.error("[GitCommitSelector] Failed to save commit:", err);
    } finally {
      setSavingCommit(null);
    }
  };

  // Position dropdown
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const updatePosition = () => {
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + 4,
            left: rect.left,
          });
        }
      };

      requestAnimationFrame(updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 10);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  if (!isGitRepo) {
    return null;
  }

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          height: "28px",
          padding: "0 8px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          fontSize: "12px",
          fontWeight: 500,
          backgroundColor: isOpen
            ? "var(--color-surface-raised)"
            : "transparent",
          color: isOpen ? "var(--color-text-base)" : "var(--color-text-muted)",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.color = "var(--color-text-base)";
            e.currentTarget.style.backgroundColor =
              "var(--color-surface-raised)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.color = "var(--color-text-muted)";
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
        title="Git history"
      >
        <GitBranch size={12} />
        <span>{currentBranch || "Git"}</span>
        <ChevronDown size={10} />
      </button>

      {isOpen &&
        dropdownPosition &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: "360px",
              maxHeight: "400px",
              backgroundColor: "var(--color-surface-overlay)",
              border: "1px solid var(--color-border-base)",
              borderRadius: "12px",
              boxShadow: "var(--shadow-lg)",
              zIndex: 100000,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              animation: "gitDropdownFadeUp 0.15s ease",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                borderBottom: "1px solid var(--color-border-base)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--color-text-base)",
                }}
              >
                <GitCommit size={14} />
                <span>Schema History</span>
                {safeCommits.length > 0 && (
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--color-text-muted)",
                      fontWeight: 400,
                    }}
                  >
                    ({safeCommits.length} commits)
                  </span>
                )}
              </div>
              <button
                onClick={onRefresh}
                disabled={loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "24px",
                  height: "24px",
                  backgroundColor: "transparent",
                  border: "none",
                  borderRadius: "6px",
                  color: "var(--color-text-muted)",
                  cursor: loading ? "wait" : "pointer",
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
                title="Refresh git history"
              >
                <RefreshCw
                  size={12}
                  style={{
                    animation: loading ? "spin 1s linear infinite" : "none",
                  }}
                />
              </button>
            </div>

            {/* Content */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "4px",
              }}
            >
              {error && (
                <div
                  style={{
                    padding: "12px",
                    fontSize: "12px",
                    color: "var(--color-error-base)",
                    textAlign: "center",
                  }}
                >
                  {error}
                </div>
              )}

              {!error && safeCommits.length === 0 && !loading && (
                <div
                  style={{
                    padding: "24px 12px",
                    fontSize: "12px",
                    color: "var(--color-text-muted)",
                    textAlign: "center",
                  }}
                >
                  No commits found that modified schema.ts
                </div>
              )}

              {safeCommits.map((commit) => (
                <div
                  key={commit.hash}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    padding: "8px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "background-color 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-surface-raised)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {/* Commit info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "2px",
                      }}
                    >
                      <code
                        style={{
                          fontSize: "11px",
                          color: "var(--color-brand-base)",
                          fontFamily: "monospace",
                        }}
                      >
                        {commit.shortHash}
                      </code>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--color-text-subtle)",
                        }}
                      >
                        {formatRelativeTime(commit.timestamp)}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--color-text-base)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {commit.message}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--color-text-subtle)",
                        marginTop: "2px",
                      }}
                    >
                      by {commit.author}
                    </div>
                  </div>

                  {/* Save button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveCommit(commit);
                    }}
                    disabled={savingCommit === commit.hash}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "28px",
                      height: "28px",
                      backgroundColor: "var(--color-surface-base)",
                      border: "1px solid var(--color-border-base)",
                      borderRadius: "6px",
                      color: "var(--color-text-muted)",
                      cursor: savingCommit === commit.hash ? "wait" : "pointer",
                      transition: "all 0.2s",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--color-brand-base)";
                      e.currentTarget.style.borderColor =
                        "var(--color-brand-base)";
                      e.currentTarget.style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--color-surface-base)";
                      e.currentTarget.style.borderColor =
                        "var(--color-border-base)";
                      e.currentTarget.style.color = "var(--color-text-muted)";
                    }}
                    title="Save as snapshot for comparison"
                  >
                    <Download size={12} />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer hint */}
            <div
              style={{
                padding: "8px 12px",
                borderTop: "1px solid var(--color-border-base)",
                fontSize: "11px",
                color: "var(--color-text-subtle)",
                textAlign: "center",
              }}
            >
              Click <Download size={10} style={{ verticalAlign: "middle" }} />{" "}
              to save a commit as a snapshot for comparison
            </div>

            {/* Animation styles */}
            <style>{`
              @keyframes gitDropdownFadeUp {
                from {
                  opacity: 0;
                  transform: translateY(-4px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              @keyframes spin {
                from {
                  transform: rotate(0deg);
                }
                to {
                  transform: rotate(360deg);
                }
              }
            `}</style>
          </div>,
          document.body,
        )}
    </>
  );
}

export default GitCommitSelector;
