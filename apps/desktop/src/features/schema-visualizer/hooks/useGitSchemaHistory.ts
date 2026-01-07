/**
 * useGitSchemaHistory Hook
 * Fetches schema.ts file history from git commits
 * Uses Tauri shell to execute git commands
 */

import { useState, useEffect, useCallback } from "react";
import { Command } from "@tauri-apps/plugin-shell";
import type { SchemaJSON } from "../types";
import { createSnapshot } from "../utils/schema-diff";
import { saveSnapshot, getAllSnapshots } from "../utils/schema-storage";

export interface GitCommit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
  timestamp: number;
}

export interface GitSchemaVersion {
  commit: GitCommit;
  schemaContent: string | null;
  hasSchema: boolean;
}

export interface UseGitSchemaHistoryOptions {
  /** Path to the project root */
  projectPath: string | null;
  /** Maximum number of commits to fetch */
  maxCommits?: number;
  /** Whether to auto-load on mount */
  autoLoad?: boolean;
}

export interface UseGitSchemaHistoryReturn {
  /** List of commits that modified schema.ts */
  commits: GitCommit[];
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refresh the commit list */
  refresh: () => Promise<void>;
  /** Fetch schema content for a specific commit */
  fetchSchemaAtCommit: (commitHash: string) => Promise<string | null>;
  /** Save a git commit as a snapshot for diffing */
  saveGitSnapshot: (commit: GitCommit) => Promise<void>;
  /** Check if git is available in the project */
  isGitRepo: boolean;
  /** Current branch name */
  currentBranch: string | null;
}

/**
 * Hook to fetch schema history from git
 */
export function useGitSchemaHistory({
  projectPath,
  maxCommits = 50,
  autoLoad = true,
}: UseGitSchemaHistoryOptions): UseGitSchemaHistoryReturn {
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGitRepo, setIsGitRepo] = useState(false);
  const [currentBranch, setCurrentBranch] = useState<string | null>(null);

  /**
   * Execute a git command and return the output
   */
  const execGit = useCallback(
    async (args: string[]): Promise<string> => {
      if (!projectPath) {
        throw new Error("No project path available");
      }

      const command = Command.create("git", args, { cwd: projectPath });
      const output = await command.execute();

      if (output.code !== 0) {
        throw new Error(
          output.stderr || `Git command failed with code ${output.code}`,
        );
      }

      return output.stdout;
    },
    [projectPath],
  );

  /**
   * Check if the project is a git repository
   */
  const checkGitRepo = useCallback(async (): Promise<boolean> => {
    if (!projectPath) return false;

    try {
      await execGit(["rev-parse", "--git-dir"]);
      return true;
    } catch {
      return false;
    }
  }, [projectPath, execGit]);

  /**
   * Get the current branch name
   */
  const getCurrentBranch = useCallback(async (): Promise<string | null> => {
    try {
      const output = await execGit(["rev-parse", "--abbrev-ref", "HEAD"]);
      return output.trim();
    } catch {
      return null;
    }
  }, [execGit]);

  /**
   * Fetch commits that modified convex/schema.ts
   */
  const fetchSchemaCommits = useCallback(async (): Promise<GitCommit[]> => {
    try {
      // Get commits that modified the schema file
      // Format: hash|shortHash|message|author|date|timestamp
      const format = "%H|%h|%s|%an|%ar|%at";
      const output = await execGit([
        "log",
        `--max-count=${maxCommits}`,
        `--format=${format}`,
        "--",
        "convex/schema.ts",
      ]);

      if (!output.trim()) {
        return [];
      }

      const commits: GitCommit[] = output
        .trim()
        .split("\n")
        .map((line) => {
          const [hash, shortHash, message, author, date, timestamp] =
            line.split("|");
          return {
            hash,
            shortHash,
            message,
            author,
            date,
            timestamp: parseInt(timestamp, 10) * 1000, // Convert to milliseconds
          };
        });

      return commits;
    } catch (err) {
      console.error("[useGitSchemaHistory] Failed to fetch commits:", err);
      throw err;
    }
  }, [execGit, maxCommits]);

  /**
   * Fetch schema.ts content at a specific commit
   */
  const fetchSchemaAtCommit = useCallback(
    async (commitHash: string): Promise<string | null> => {
      try {
        const output = await execGit([
          "show",
          `${commitHash}:convex/schema.ts`,
        ]);
        return output;
      } catch (err) {
        console.error(
          `[useGitSchemaHistory] Failed to fetch schema at ${commitHash}:`,
          err,
        );
        return null;
      }
    },
    [execGit],
  );

  /**
   * Parse TypeScript schema content to SchemaJSON
   * This is a simplified parser - the actual schema parsing happens in the diff utilities
   */
  const parseSchemaContent = useCallback(
    async (content: string): Promise<SchemaJSON | null> => {
      // For now, we'll try to read the current schema.ts to get the deployed version
      // In the future, we could use a TypeScript parser to extract table definitions
      // This is a limitation - we can only compare with the deployed schema structure

      // Try to extract table names from the schema content using regex
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
   * Save a git commit as a snapshot for diffing
   */
  const saveGitSnapshot = useCallback(
    async (commit: GitCommit): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        // Fetch the schema content at this commit
        const schemaContent = await fetchSchemaAtCommit(commit.hash);
        if (!schemaContent) {
          throw new Error("Could not fetch schema at this commit");
        }

        // Parse the schema content
        const schemaJson = await parseSchemaContent(schemaContent);
        if (!schemaJson) {
          throw new Error("Could not parse schema content");
        }

        // Check if we already have this snapshot
        const existingSnapshots = await getAllSnapshots("git");
        const existing = existingSnapshots.find(
          (s) => s.commitHash === commit.hash,
        );
        if (existing) {
          console.log(
            "[useGitSchemaHistory] Snapshot already exists for commit:",
            commit.shortHash,
          );
          return;
        }

        // Create and save the snapshot
        const snapshot = createSnapshot(schemaJson, {
          label: `${commit.shortHash}: ${commit.message.substring(0, 50)}`,
          source: "git",
          commitHash: commit.hash,
          commitMessage: commit.message,
        });

        await saveSnapshot(snapshot);
        console.log(
          "[useGitSchemaHistory] Saved git snapshot:",
          commit.shortHash,
        );
      } catch (err) {
        console.error(
          "[useGitSchemaHistory] Failed to save git snapshot:",
          err,
        );
        setError(
          err instanceof Error ? err.message : "Failed to save git snapshot",
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchSchemaAtCommit, parseSchemaContent],
  );

  /**
   * Refresh the commit list
   */
  const refresh = useCallback(async () => {
    // Silently return if no project path - this is normal during initialization
    if (!projectPath) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check if it's a git repo
      const isRepo = await checkGitRepo();
      setIsGitRepo(isRepo);

      if (!isRepo) {
        // Not a git repo is not necessarily an error - just return empty state
        setCommits([]);
        return;
      }

      // Get current branch
      const branch = await getCurrentBranch();
      setCurrentBranch(branch);

      // Fetch commits
      const schemaCommits = await fetchSchemaCommits();
      setCommits(schemaCommits);

      console.log(
        `[useGitSchemaHistory] Found ${schemaCommits.length} commits that modified schema.ts`,
      );
    } catch (err) {
      console.error("[useGitSchemaHistory] Failed to refresh:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load git history",
      );
      setCommits([]);
    } finally {
      setLoading(false);
    }
  }, [projectPath, checkGitRepo, getCurrentBranch, fetchSchemaCommits]);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad && projectPath) {
      refresh();
    }
  }, [autoLoad, projectPath, refresh]);

  return {
    commits,
    loading,
    error,
    refresh,
    fetchSchemaAtCommit,
    saveGitSnapshot,
    isGitRepo,
    currentBranch,
  };
}

export default useGitSchemaHistory;
