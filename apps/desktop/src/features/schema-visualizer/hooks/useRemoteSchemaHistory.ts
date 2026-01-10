/**
 * useRemoteSchemaHistory Hook
 *
 * Fetches schema.ts file history from a GitHub repository.
 * Similar to useGitSchemaHistory but uses the GitHub API instead of local git.
 *
 * NOTE: This hook is designed to be resilient to missing data and gracefully
 * handles cases where GitHub context is not available or repo is not selected.
 *
 * IMPORTANT: This hook includes protections against:
 * - Race conditions when changing branches/repos
 * - State updates on unmounted components
 * - Infinite loops from effect dependencies
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useGitHubOptional } from "../../../contexts/GitHubContext";
import {
  getFileContent,
  getFileCommits,
  findSchemaFiles,
  listAllBranches,
} from "../../../services/github/api";
import { getStoredToken } from "../../../services/github/auth";
import type { GitHubCommit, GitHubRepo } from "../../../services/github/types";
import type { SchemaJSON } from "../types";
import { createSnapshot } from "../utils/schema-diff";
import { saveSnapshot, getAllSnapshots } from "../utils/schema-storage";

// Branch storage is now handled by GitHub context
// Legacy storage functions are kept for backward compatibility but do nothing

/**
 * Load persisted branch for a repository
 * Now uses GitHub context instead of localStorage
 */
function loadPersistedBranch(_repoFullName: string | null): string | null {
  // Branch is now managed by GitHub context, so we don't use localStorage anymore
  // This function is kept for backward compatibility but returns null
  return null;
}

/**
 * Save branch selection for a repository
 * Now uses GitHub context instead of localStorage
 */
function persistBranch(_repoFullName: string | null, _branch: string): void {
  // Branch is now managed by GitHub context, so we don't use localStorage anymore
  // This function is kept for backward compatibility but does nothing
  console.log(
    "[useRemoteSchemaHistory] Branch management delegated to GitHub context",
  );
}

export interface RemoteGitCommit {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string;
  timestamp: number;
}

export interface UseRemoteSchemaHistoryOptions {
  /** The repository to fetch from (if not using context) */
  repo?: GitHubRepo | null;
  /** Maximum number of commits to fetch */
  maxCommits?: number;
  /** Whether to auto-load on mount */
  autoLoad?: boolean;
  /** Custom schema file path (defaults to common locations) */
  schemaPath?: string;
  /** Initial branch to use (e.g., from local git) - syncs with local working branch */
  initialBranch?: string | null;
}

export interface UseRemoteSchemaHistoryReturn {
  /** List of commits that modified schema.ts */
  commits: RemoteGitCommit[];
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refresh the commit list */
  refresh: () => Promise<void>;
  /** Fetch schema content for a specific commit */
  fetchSchemaAtCommit: (commitSha: string) => Promise<string | null>;
  /** Save a remote commit as a snapshot for diffing */
  saveRemoteSnapshot: (commit: RemoteGitCommit) => Promise<void>;
  /** Whether connected to GitHub */
  isConnected: boolean;
  /** The selected repository */
  selectedRepo: GitHubRepo | null;
  /** Available branches */
  branches: Array<{ name: string; sha: string }>;
  /** Whether branches are loading */
  branchesLoading: boolean;
  /** Current/selected branch */
  currentBranch: string | null;
  /** Set the current branch */
  setBranch: (branch: string) => void;
  /** Path to the schema file */
  schemaFilePath: string | null;
  /** Available schema file paths found in the repo */
  availableSchemaFiles: string[];
  /** Set the schema file path */
  setSchemaPath: (path: string) => void;
}

/**
 * Hook to fetch schema history from a GitHub repository
 */
export function useRemoteSchemaHistory({
  repo,
  maxCommits = 50,
  autoLoad = true,
  schemaPath,
  initialBranch,
}: UseRemoteSchemaHistoryOptions = {}): UseRemoteSchemaHistoryReturn {
  // Use optional hook to gracefully handle missing provider
  const github = useGitHubOptional();
  const isAuthenticated = github?.isAuthenticated ?? false;
  const contextRepo = github?.selectedRepo ?? null;

  // Use provided repo or context repo
  const selectedRepo = repo ?? contextRepo;

  console.log("[useRemoteSchemaHistory] 🚀 Hook initialized", {
    isAuthenticated,
    selectedRepo: selectedRepo?.full_name ?? null,
    selectedRepoId: selectedRepo?.id ?? null,
    isConnected: isAuthenticated && !!selectedRepo,
    autoLoad,
    initialBranch,
  });

  // Core state - initialize branch from localStorage if available
  const [commits, setCommits] = useState<RemoteGitCommit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<
    Array<{ name: string; sha: string }>
  >([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [currentBranch, setCurrentBranch] = useState<string | null>(() =>
    loadPersistedBranch(selectedRepo?.full_name ?? null),
  );
  const [schemaFilePath, setSchemaFilePath] = useState<string | null>(
    schemaPath || null,
  );
  const [availableSchemaFiles, setAvailableSchemaFiles] = useState<string[]>(
    [],
  );

  // Async refresh trigger - prevents sync refresh() calls that cause race conditions
  const [pendingRefresh, setPendingRefresh] = useState(false);

  // Unmount protection
  const isMountedRef = useRef(true);
  const refreshIdRef = useRef(0);

  const isConnected = isAuthenticated && !!selectedRepo;

  // Track the repo ID to detect changes
  const currentRepoIdRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Convert GitHub commit to our format
   */
  const convertCommit = useCallback((commit: GitHubCommit): RemoteGitCommit => {
    return {
      sha: commit.sha,
      shortSha: commit.sha.substring(0, 7),
      message: commit.message.split("\n")[0], // First line only
      author: commit.author.name,
      date: new Date(commit.author.date).toLocaleDateString(),
      timestamp: new Date(commit.author.date).getTime(),
    };
  }, []);

  /**
   * Find schema files in the repository
   */
  const findSchemas = useCallback(async (): Promise<string[]> => {
    if (!selectedRepo) return [];

    const token = await getStoredToken();
    if (!token) return [];

    try {
      const [owner, repoName] = selectedRepo.full_name.split("/");
      const files = await findSchemaFiles(token, owner, repoName);
      return files;
    } catch (e) {
      console.error("[useRemoteSchemaHistory] Failed to find schema files:", e);
      return [];
    }
  }, [selectedRepo]);

  /**
   * Fetch branches for the repository (with pagination)
   */
  const fetchBranchesInternal = useCallback(async (): Promise<
    Array<{ name: string; sha: string }>
  > => {
    if (!selectedRepo) return [];

    const token = await getStoredToken();
    if (!token) return [];

    try {
      const [owner, repoName] = selectedRepo.full_name.split("/");
      const branchList = await listAllBranches(token, owner, repoName);
      return branchList.map((b) => ({
        name: b.name,
        sha: b.commit.sha,
      }));
    } catch (e) {
      console.error("[useRemoteSchemaHistory] Failed to fetch branches:", e);
      return [];
    }
  }, [selectedRepo]);

  /**
   * Fetch commits that modified the schema file
   */
  const fetchSchemaCommits = useCallback(
    async (
      filePath: string,
      branch?: string | null,
    ): Promise<RemoteGitCommit[]> => {
      if (!selectedRepo || !filePath) return [];

      const token = await getStoredToken();
      if (!token) return [];

      try {
        const [owner, repoName] = selectedRepo.full_name.split("/");
        console.log(`[useRemoteSchemaHistory] 🔍 Fetching commits:`, {
          owner,
          repo: repoName,
          path: filePath,
          branch: branch || "(default)",
          maxCommits,
        });
        const commits = await getFileCommits(
          token,
          owner,
          repoName,
          filePath,
          maxCommits,
          branch || undefined,
        );
        console.log(
          `[useRemoteSchemaHistory] 📦 GitHub API returned ${commits.length} commits`,
        );
        return commits.map(convertCommit);
      } catch (e) {
        console.error(
          "[useRemoteSchemaHistory] ❌ Failed to fetch commits:",
          e,
        );
        throw e;
      }
    },
    [selectedRepo, maxCommits, convertCommit],
  );

  /**
   * Fetch schema content at a specific commit
   */
  const fetchSchemaAtCommit = useCallback(
    async (commitSha: string): Promise<string | null> => {
      if (!selectedRepo || !schemaFilePath) return null;

      const token = await getStoredToken();
      if (!token) return null;

      try {
        const [owner, repoName] = selectedRepo.full_name.split("/");
        const content = await getFileContent(
          token,
          owner,
          repoName,
          schemaFilePath,
          commitSha,
        );
        return content;
      } catch (e) {
        console.error(
          `[useRemoteSchemaHistory] Failed to fetch schema at ${commitSha}:`,
          e,
        );
        return null;
      }
    },
    [selectedRepo, schemaFilePath],
  );

  /**
   * Parse schema content to extract table definitions
   */
  const parseSchemaContent = useCallback(
    async (content: string): Promise<SchemaJSON | null> => {
      // Simple regex-based parser (same as local git version)
      const tableRegex = /(\w+):\s*defineTable\(/g;
      const tables: SchemaJSON["tables"] = [];
      let match;

      while ((match = tableRegex.exec(content)) !== null) {
        const tableName = match[1];
        tables.push({
          tableName,
          indexes: [],
          searchIndexes: [],
          vectorIndexes: [],
          documentType: null,
        });
      }

      if (tables.length === 0) {
        return null;
      }

      return {
        tables,
        schemaValidation: true,
      };
    },
    [],
  );

  /**
   * Save a remote commit as a snapshot for diffing
   */
  const saveRemoteSnapshot = useCallback(
    async (commit: RemoteGitCommit): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        // Fetch schema content
        const schemaContent = await fetchSchemaAtCommit(commit.sha);
        if (!schemaContent) {
          throw new Error("Could not fetch schema at this commit");
        }

        // Parse schema
        const schemaJson = await parseSchemaContent(schemaContent);
        if (!schemaJson) {
          throw new Error("Could not parse schema content");
        }

        // Check for existing snapshot
        const existingSnapshots = await getAllSnapshots("github");
        const existing = existingSnapshots.find(
          (s) => s.commitHash === commit.sha,
        );
        if (existing) {
          console.log(
            "[useRemoteSchemaHistory] Snapshot already exists for commit:",
            commit.shortSha,
          );
          return;
        }

        // Create and save snapshot
        const snapshot = createSnapshot(schemaJson, {
          label: `${commit.shortSha}: ${commit.message.substring(0, 50)}`,
          source: "github",
          commitHash: commit.sha,
          commitMessage: commit.message,
        });

        await saveSnapshot(snapshot);
        console.log(
          "[useRemoteSchemaHistory] Saved remote snapshot:",
          commit.shortSha,
        );
      } catch (e) {
        console.error("[useRemoteSchemaHistory] Failed to save snapshot:", e);
        setError(e instanceof Error ? e.message : "Failed to save snapshot");
        throw e;
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [fetchSchemaAtCommit, parseSchemaContent],
  );

  /**
   * Refresh the commit list
   * Uses a refresh ID to prevent stale updates from race conditions
   */
  const refresh = useCallback(async () => {
    // Silently return if not connected - this is not an error state
    if (!isConnected || !isMountedRef.current) {
      console.log(
        "[useRemoteSchemaHistory] ⏭️  Skipping refresh (not connected or unmounted)",
      );
      return;
    }

    console.log(
      "[useRemoteSchemaHistory] 🔄 Starting refresh for repo:",
      selectedRepo?.full_name,
    );

    // Increment refresh ID to invalidate any pending refreshes
    refreshIdRef.current += 1;
    const thisRefreshId = refreshIdRef.current;

    try {
      setLoading(true);
      setError(null);
      setBranchesLoading(true);

      // Fetch branches
      console.log("[useRemoteSchemaHistory] 🌿 Fetching branches...");
      const branchData = await fetchBranchesInternal();

      // Check if this refresh is still valid
      if (!isMountedRef.current || refreshIdRef.current !== thisRefreshId) {
        console.log(
          "[useRemoteSchemaHistory] ⏭️  Refresh cancelled (component unmounted or new refresh started)",
        );
        return;
      }

      console.log(
        `[useRemoteSchemaHistory] 🌿 Found ${branchData.length} branches:`,
        branchData.map((b) => b.name),
      );
      setBranches(branchData);
      setBranchesLoading(false);

      // Determine which branch to use for fetching commits
      let branchToUse = currentBranch;

      // Set branch if not already set
      if (!branchToUse && branchData.length > 0) {
        // Try to use initialBranch if it exists in the remote
        if (initialBranch) {
          const branchExists = branchData.some((b) => b.name === initialBranch);
          if (branchExists) {
            branchToUse = initialBranch;
            setCurrentBranch(initialBranch);
            persistBranch(selectedRepo?.full_name ?? null, initialBranch);
            console.log(
              `[useRemoteSchemaHistory] 🌿 Using initial branch: ${initialBranch}`,
            );
          } else {
            // Fall back to default branch
            branchToUse = selectedRepo?.default_branch || "main";
            setCurrentBranch(branchToUse);
            persistBranch(selectedRepo?.full_name ?? null, branchToUse);
            console.log(
              `[useRemoteSchemaHistory] 🌿 Initial branch not found, using default: ${branchToUse}`,
            );
          }
        } else {
          branchToUse = selectedRepo?.default_branch || "main";
          setCurrentBranch(branchToUse);
          persistBranch(selectedRepo?.full_name ?? null, branchToUse);
          console.log(
            `[useRemoteSchemaHistory] 🌿 No initial branch, using default: ${branchToUse}`,
          );
        }
      } else {
        console.log(
          `[useRemoteSchemaHistory] 🌿 Using current branch: ${branchToUse}`,
        );
      }

      // Determine the schema file path to use
      let pathToUse = schemaFilePath;

      // Find schema files if not set
      if (!pathToUse) {
        console.log("[useRemoteSchemaHistory] 📁 Finding schema files...");
        const files = await findSchemas();

        // Check if still valid
        if (!isMountedRef.current || refreshIdRef.current !== thisRefreshId) {
          console.log(
            "[useRemoteSchemaHistory] ⏭️  Refresh cancelled (component unmounted or new refresh started)",
          );
          return;
        }

        console.log(
          `[useRemoteSchemaHistory] 📁 Found ${files.length} schema files:`,
          files,
        );
        setAvailableSchemaFiles(files);

        if (files.length > 0) {
          // Prefer convex/schema.ts
          pathToUse = files.find((f) => f === "convex/schema.ts") || files[0];
          setSchemaFilePath(pathToUse);
          console.log(
            `[useRemoteSchemaHistory] 📁 Using schema file: ${pathToUse}`,
          );
        } else {
          console.log(
            "[useRemoteSchemaHistory] ❌ No schema.ts file found in repository",
          );
          setError("No schema.ts file found in repository");
          setCommits([]);
          return;
        }
      } else {
        console.log(
          `[useRemoteSchemaHistory] 📁 Using existing schema path: ${pathToUse}`,
        );
      }

      // Fetch commits using the determined path and branch
      const schemaCommits = await fetchSchemaCommits(pathToUse, branchToUse);

      // Final check before updating state
      if (!isMountedRef.current || refreshIdRef.current !== thisRefreshId) {
        console.log(
          "[useRemoteSchemaHistory] ⏭️  Refresh cancelled (component unmounted or new refresh started)",
        );
        return;
      }

      setCommits(schemaCommits);

      console.log(
        `[useRemoteSchemaHistory] ✅ Successfully loaded ${schemaCommits.length} commits`,
        {
          branch: branchToUse,
          schemaPath: pathToUse,
          repo: selectedRepo?.full_name,
          commits: schemaCommits.map((c) => ({
            sha: c.shortSha,
            message: c.message,
          })),
        },
      );
    } catch (e) {
      // Only update error if this refresh is still valid
      if (isMountedRef.current && refreshIdRef.current === thisRefreshId) {
        console.error("[useRemoteSchemaHistory] ❌ Failed to refresh:", e);
        setError(
          e instanceof Error ? e.message : "Failed to load remote history",
        );
        setCommits([]);
      }
    } finally {
      if (isMountedRef.current && refreshIdRef.current === thisRefreshId) {
        setLoading(false);
        setBranchesLoading(false);
      }
    }
  }, [
    isConnected,
    schemaFilePath,
    currentBranch,
    initialBranch,
    selectedRepo?.default_branch,
    fetchBranchesInternal,
    findSchemas,
    fetchSchemaCommits,
  ]);

  /**
   * Set the current branch - triggers async refresh and persists to localStorage
   */
  const setBranch = useCallback(
    (branch: string) => {
      setCurrentBranch(branch);
      // Persist to localStorage for this repo
      persistBranch(selectedRepo?.full_name ?? null, branch);
      // Use async refresh trigger instead of calling refresh() synchronously
      setPendingRefresh(true);
    },
    [selectedRepo?.full_name],
  );

  /**
   * Set the schema file path
   */
  const setSchemaPath = useCallback((path: string) => {
    setSchemaFilePath(path);
  }, []);

  // Handle pending refresh asynchronously
  useEffect(() => {
    if (pendingRefresh && isConnected && isMountedRef.current) {
      setPendingRefresh(false);
      refresh();
    }
  }, [pendingRefresh, isConnected, refresh]);

  // Reset state when repo changes
  useEffect(() => {
    const newRepoId = selectedRepo?.id ?? null;

    // Only reset if repo actually changed
    if (currentRepoIdRef.current !== newRepoId) {
      currentRepoIdRef.current = newRepoId;

      // Clear all state for new repo
      setCommits([]);
      setBranches([]);
      setBranchesLoading(false);
      // Load persisted branch for the new repo, or null if not set
      setCurrentBranch(loadPersistedBranch(selectedRepo?.full_name ?? null));
      setSchemaFilePath(schemaPath || null);
      setAvailableSchemaFiles([]);
      setError(null);

      // Invalidate any pending refreshes
      refreshIdRef.current += 1;
    }
  }, [selectedRepo?.id, selectedRepo?.full_name, schemaPath]);

  // Clear state when disconnected
  useEffect(() => {
    if (!isConnected) {
      setCommits([]);
      setBranches([]);
      setBranchesLoading(false);
      setCurrentBranch(null);
      setSchemaFilePath(schemaPath || null);
      setAvailableSchemaFiles([]);
      setError(null);
      refreshIdRef.current += 1;
    }
  }, [isConnected, schemaPath]);

  // Sync with initialBranch when it changes (AFTER branches are loaded)
  // This does NOT call refresh - just updates the branch selection
  useEffect(() => {
    // Only sync if we have branches loaded and an initialBranch to sync to
    if (!initialBranch || branches.length === 0) return;

    // Check if the branch exists in remote
    const branchExists = branches.some((b) => b.name === initialBranch);
    if (branchExists && currentBranch !== initialBranch) {
      setCurrentBranch(initialBranch);
      // Don't trigger refresh here - the branch dropdown will handle it if user wants
    }
    // Note: Intentionally NOT including currentBranch in deps to prevent loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBranch, branches]);

  // Auto-load on mount or when repo/auth changes
  useEffect(() => {
    console.log("[useRemoteSchemaHistory] 🔍 Auto-load effect triggered", {
      autoLoad,
      isConnected,
      selectedRepoId: selectedRepo?.id,
    });

    if (autoLoad && isConnected) {
      console.log(
        "[useRemoteSchemaHistory] ✅ Conditions met, calling refresh()",
      );
      refresh();
    } else {
      console.log(
        "[useRemoteSchemaHistory] ❌ Conditions NOT met, skipping refresh",
        {
          autoLoad,
          isConnected,
          reason: !autoLoad ? "autoLoad is false" : "not connected",
        },
      );
    }
    // Only trigger on connection state or repo change, not on refresh changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, isConnected, selectedRepo?.id]);

  return {
    commits,
    loading,
    error,
    refresh,
    fetchSchemaAtCommit,
    saveRemoteSnapshot,
    isConnected,
    selectedRepo,
    branches,
    branchesLoading,
    currentBranch,
    setBranch,
    schemaFilePath,
    availableSchemaFiles,
    setSchemaPath,
  };
}

export default useRemoteSchemaHistory;
