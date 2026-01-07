/**
 * GitHub Repository Selector
 *
 * A dropdown/modal for selecting a GitHub repository
 * to use for remote schema history.
 */

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  GitBranch,
  Lock,
  Globe,
  ChevronDown,
  X,
  Loader2,
} from "lucide-react";
import { useGitHub } from "../contexts/GitHubContext";
import type { GitHubRepo } from "../services/github/types";

interface GitHubRepoSelectorProps {
  onSelect?: (repo: GitHubRepo) => void;
  className?: string;
}

export function GitHubRepoSelector({
  onSelect,
  className = "",
}: GitHubRepoSelectorProps) {
  const {
    isAuthenticated,
    repos,
    reposLoading,
    selectedRepo,
    selectRepo,
    refreshRepos,
    searchRepos,
    searchedRepos,
    searchReposLoading,
  } = useGitHub();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Use a ref to store the timeout to avoid dependency issues
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track last search time to enforce minimum delay
  const lastSearchTime = useRef<number>(0);
  const MIN_SEARCH_DELAY = 2000; // 2 seconds minimum between searches

  // Trigger debounced search when query changes
  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // For queries < 3 chars, use client-side filtering only
    if (searchQuery.length < 3) {
      setIsSearchMode(false);
      return;
    }

    // For queries >= 3 chars, use server-side search with longer debounce
    setIsSearchMode(true);
    timeoutRef.current = setTimeout(() => {
      const now = Date.now();
      const timeSinceLastSearch = now - lastSearchTime.current;

      // Enforce minimum delay between searches
      if (timeSinceLastSearch >= MIN_SEARCH_DELAY) {
        lastSearchTime.current = now;
        searchRepos(searchQuery).catch(console.error);
      } else {
        // Wait for remaining time before searching
        const remainingDelay = MIN_SEARCH_DELAY - timeSinceLastSearch;
        setTimeout(() => {
          lastSearchTime.current = Date.now();
          searchRepos(searchQuery).catch(console.error);
        }, remainingDelay);
      }
    }, 1000); // Increased to 1000ms debounce

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchQuery, searchRepos]);

  // Determine which repos to show
  const filteredRepos = useMemo(() => {
    // If in search mode and we have results from server, show searched repos
    if (isSearchMode && searchQuery.length >= 3 && searchedRepos.length > 0) {
      return searchedRepos;
    }

    // Always do client-side filtering as fallback or for short queries
    if (!searchQuery.trim()) return repos;
    const query = searchQuery.toLowerCase();

    // Enhanced client-side filtering
    return repos.filter(
      (repo) =>
        repo.full_name.toLowerCase().includes(query) ||
        repo.name.toLowerCase().includes(query) ||
        repo.owner?.login?.toLowerCase().includes(query),
    );
  }, [repos, searchedRepos, searchQuery, isSearchMode]);

  // Loading state
  const isLoading = reposLoading || (isSearchMode && searchReposLoading);

  const handleSelect = (repo: GitHubRepo) => {
    selectRepo(repo);
    onSelect?.(repo);
    setIsOpen(false);
    setSearchQuery("");
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-raised hover:bg-surface-overlay border border-border-base transition-colors min-w-[180px]"
      >
        <GitBranch className="w-4 h-4 text-text-muted flex-shrink-0" />
        {selectedRepo ? (
          <>
            {selectedRepo.private ? (
              <Lock className="w-3 h-3 text-text-subtle flex-shrink-0" />
            ) : (
              <Globe className="w-3 h-3 text-text-subtle flex-shrink-0" />
            )}
            <span className="text-xs text-text-base truncate flex-1 text-left">
              {selectedRepo.full_name}
            </span>
          </>
        ) : (
          <span className="text-xs text-text-muted flex-1 text-left">
            Select repository...
          </span>
        )}
        <ChevronDown className="w-3 h-3 text-text-muted flex-shrink-0" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setSearchQuery("");
            }}
          />
          <div className="absolute left-0 top-full mt-1 w-80 bg-surface-base border border-border-base rounded-lg shadow-xl z-50 overflow-hidden">
            {/* Search input */}
            <div className="p-2 border-b border-border-base">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search repositories..."
                  className="w-full pl-8 pr-8 py-1.5 text-sm bg-surface-raised border border-border-base rounded-md text-text-base placeholder:text-text-muted focus:outline-none focus:border-brand-base"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-surface-overlay rounded"
                  >
                    <X className="w-3 h-3 text-text-muted" />
                  </button>
                )}
              </div>
            </div>

            {/* Repository list */}
            <div className="max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-text-muted animate-spin" />
                </div>
              ) : filteredRepos.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-text-muted">
                    {searchQuery
                      ? "No matching repositories"
                      : "No repositories found"}
                  </p>
                  <button
                    onClick={() => refreshRepos()}
                    className="mt-2 text-xs text-brand-base hover:text-brand-hover"
                  >
                    Refresh list
                  </button>
                </div>
              ) : (
                <div className="py-1">
                  {filteredRepos.map((repo) => (
                    <button
                      key={repo.id}
                      onClick={() => handleSelect(repo)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-raised transition-colors ${
                        selectedRepo?.id === repo.id ? "bg-surface-raised" : ""
                      }`}
                    >
                      {repo.private ? (
                        <Lock className="w-4 h-4 text-text-subtle flex-shrink-0" />
                      ) : (
                        <Globe className="w-4 h-4 text-text-subtle flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-base truncate">
                          {repo.name}
                        </p>
                        <p className="text-xs text-text-muted truncate">
                          {repo.owner.login}
                        </p>
                      </div>
                      {selectedRepo?.id === repo.id && (
                        <div className="w-2 h-2 rounded-full bg-brand-base flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {repos.length > 0 && (
              <div className="px-3 py-2 border-t border-border-base">
                <p className="text-xs text-text-subtle">
                  {repos.length} repositories available
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default GitHubRepoSelector;
