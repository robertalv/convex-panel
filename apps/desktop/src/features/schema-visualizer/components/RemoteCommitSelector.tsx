/**
 * RemoteCommitSelector Component
 * Dropdown for selecting GitHub commits to compare schema versions
 * Styled to match SearchableSelect for consistency
 */

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  GitCommit,
  RefreshCw,
  ChevronDown,
  Search,
  CircleCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type { RemoteGitCommit } from "../hooks/useRemoteSchemaHistory";

interface RemoteCommitSelectorProps {
  commits: RemoteGitCommit[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onSelectCommit: (commit: RemoteGitCommit) => void;
  selectedCommitSha?: string | null;
  repoName: string | null;
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

export function RemoteCommitSelector({
  commits,
  loading,
  error,
  onRefresh,
  onSelectCommit,
  selectedCommitSha,
  repoName,
}: RemoteCommitSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  // Filter commits by search - use safe fallback for undefined commits
  const safeCommitsForFilter = commits ?? [];
  const filteredCommits = safeCommitsForFilter.filter((commit) => {
    if (!search) return true;
    const lower = search.toLowerCase();
    return (
      commit.shortSha.toLowerCase().includes(lower) ||
      commit.message.toLowerCase().includes(lower) ||
      commit.author.toLowerCase().includes(lower)
    );
  });

  // Reset highlighted index when filtered results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredCommits.length, search]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && optionsRef.current) {
      const highlighted = optionsRef.current.querySelector(
        `[data-index="${highlightedIndex}"]`,
      );
      if (highlighted) {
        highlighted.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

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
        setSearch("");
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

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setSearch("");
      setHighlightedIndex(0);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredCommits.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && filteredCommits.length > 0) {
      e.preventDefault();
      handleSelectCommit(filteredCommits[highlightedIndex]);
    }
  };

  // Handle commit selection
  const handleSelectCommit = (commit: RemoteGitCommit) => {
    try {
      onSelectCommit(commit);
    } catch (err) {
      console.error("[RemoteCommitSelector] Failed to select commit:", err);
    }
    setIsOpen(false);
    setSearch("");
    setHighlightedIndex(0);
  };

  // Return null if no repo selected or commits is not available
  if (!repoName) {
    return null;
  }

  // Safely handle undefined or empty commits array
  const safeCommits = commits ?? [];
  const selectedCommit = safeCommits.find((c) => c.sha === selectedCommitSha);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-lg text-sm font-medium border border-transparent hover:bg-surface-raised focus:outline-none focus:ring-0 cursor-pointer transition-colors duration-fast"
        style={{
          color:
            isOpen || selectedCommit
              ? "var(--color-text-base)"
              : "var(--color-text-muted)",
          backgroundColor: isOpen
            ? "var(--color-surface-raised)"
            : "transparent",
        }}
        title="Select GitHub commit for comparison"
      >
        <GitCommit size={12} />
        <span className="truncate" style={{ maxWidth: "100px" }}>
          {selectedCommit
            ? selectedCommit.shortSha
            : `${safeCommits.length} commits`}
        </span>
        <ChevronDown
          size={10}
          className="text-text-subtle transition-transform"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {isOpen &&
        dropdownPosition &&
        createPortal(
          <div
            ref={dropdownRef}
            className="animate-fade-up"
            style={{
              position: "fixed",
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              minWidth: "280px",
              maxWidth: "360px",
              maxHeight: "400px",
              backgroundColor: "var(--color-surface-base)",
              border: "1px solid var(--color-border-muted)",
              borderRadius: "12px",
              boxShadow: "var(--shadow-lg)",
              zIndex: 100000,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              animationDuration: "150ms",
            }}
          >
            {/* Search Input */}
            <div
              style={{ borderBottom: "1px solid var(--color-border-muted)" }}
            >
              <div style={{ position: "relative" }}>
                <Search
                  size={14}
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--color-text-subtle)",
                    pointerEvents: "none",
                    zIndex: 10,
                  }}
                />
                <Input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search commits..."
                  className="w-full pl-8 pr-3 py-1.5 border-0 rounded-none hover:bg-transparent hover:border-0 focus:border-0 focus:border-transparent"
                />
                {/* Refresh button in search bar */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRefresh();
                  }}
                  disabled={loading}
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "20px",
                    height: "20px",
                    backgroundColor: "transparent",
                    border: "none",
                    borderRadius: "4px",
                    color: "var(--color-text-muted)",
                    cursor: loading ? "wait" : "pointer",
                  }}
                  title="Refresh commits"
                >
                  <RefreshCw
                    size={12}
                    style={{
                      animation: loading ? "spin 1s linear infinite" : "none",
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Commits List */}
            <div
              ref={optionsRef}
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

              {!error && filteredCommits.length === 0 && !loading && (
                <div
                  style={{
                    padding: "12px",
                    fontSize: "12px",
                    color: "var(--color-text-muted)",
                    textAlign: "center",
                  }}
                >
                  {search ? "No matching commits" : "No commits found"}
                </div>
              )}

              {loading && safeCommits.length === 0 && (
                <div
                  style={{
                    padding: "12px",
                    fontSize: "12px",
                    color: "var(--color-text-muted)",
                    textAlign: "center",
                  }}
                >
                  Loading commits...
                </div>
              )}

              {filteredCommits.map((commit, index) => {
                const isSelected = commit.sha === selectedCommitSha;
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={commit.sha}
                    type="button"
                    data-index={index}
                    onClick={() => handleSelectCommit(commit)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                      padding: "8px",
                      border: "none",
                      borderRadius: "8px",
                      backgroundColor: isHighlighted
                        ? "var(--color-surface-raised)"
                        : "transparent",
                      cursor: "pointer",
                      transition: "background-color 0.1s ease",
                      textAlign: "left",
                      marginBottom: "2px",
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
                          {commit.shortSha}
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

                    {/* Selected indicator */}
                    {isSelected && (
                      <CircleCheck
                        size={16}
                        style={{
                          color: "var(--color-brand-base)",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Animation styles */}
            <style>{`
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

export default RemoteCommitSelector;
