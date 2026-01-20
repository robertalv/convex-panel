/**
 * Local Source Code Hook
 * Reads source code files from the local project's convex/ directory
 * Falls back to API fetch when local file is not available
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { readTextFile, exists } from "@tauri-apps/plugin-fs";

export interface LocalSourceCodeState {
  /** The source code content (if found) */
  sourceCode: string | null;
  /** Whether we're currently loading */
  loading: boolean;
  /** Whether the initial load attempt has completed */
  hasAttempted: boolean;
  /** Error message if loading failed */
  error: string | null;
  /** The source of the code: 'local' or 'api' or null */
  source: "local" | "api" | null;
  /** Path to the local file that was read */
  localPath: string | null;
}

export interface UseLocalSourceCodeOptions {
  /** Project path (parent of convex/ directory) */
  projectPath: string | null;
  /** Module path from Convex (e.g., "achievements.js" or "api/users.js") */
  modulePath: string | null;
  /** Whether to enable the hook */
  enabled?: boolean;
}

/**
 * Convert a module path from Convex format to local file path
 * - achievements.js -> convex/achievements.ts (prefer .ts, fallback to .js)
 * - api/users.js -> convex/api/users.ts
 */
function getLocalFilePaths(
  projectPath: string,
  modulePath: string,
): { tsPath: string; jsPath: string } {
  // Remove .js extension if present
  let basePath = modulePath;
  if (basePath.endsWith(".js")) {
    basePath = basePath.slice(0, -3);
  }

  return {
    tsPath: `${projectPath}/convex/${basePath}.ts`,
    jsPath: `${projectPath}/convex/${basePath}.js`,
  };
}

/**
 * Hook to read source code from the local filesystem
 * Prioritizes TypeScript files over JavaScript files
 */
export function useLocalSourceCode({
  projectPath,
  modulePath,
  enabled = true,
}: UseLocalSourceCodeOptions): LocalSourceCodeState & {
  refresh: () => Promise<void>;
} {
  // Track the current request to handle race conditions
  const requestIdRef = useRef(0);

  const [state, setState] = useState<LocalSourceCodeState>(() => ({
    sourceCode: null,
    loading: enabled && !!projectPath && !!modulePath,
    hasAttempted: false,
    error: null,
    source: null,
    localPath: null,
  }));

  const loadSourceCode = useCallback(async () => {
    // Increment request ID to track this specific request
    const currentRequestId = ++requestIdRef.current;

    if (!enabled || !projectPath || !modulePath) {
      setState({
        sourceCode: null,
        loading: false,
        hasAttempted: true,
        error: null,
        source: null,
        localPath: null,
      });
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const { tsPath, jsPath } = getLocalFilePaths(projectPath, modulePath);

      // Try TypeScript file first
      const tsExists = await exists(tsPath);

      // Check if this request is still current
      if (currentRequestId !== requestIdRef.current) return;

      if (tsExists) {
        const content = await readTextFile(tsPath);

        // Check again after async operation
        if (currentRequestId !== requestIdRef.current) return;

        setState({
          sourceCode: content,
          loading: false,
          hasAttempted: true,
          error: null,
          source: "local",
          localPath: tsPath,
        });
        return;
      }

      // Fall back to JavaScript file
      const jsExists = await exists(jsPath);

      // Check if this request is still current
      if (currentRequestId !== requestIdRef.current) return;

      if (jsExists) {
        const content = await readTextFile(jsPath);

        // Check again after async operation
        if (currentRequestId !== requestIdRef.current) return;

        setState({
          sourceCode: content,
          loading: false,
          hasAttempted: true,
          error: null,
          source: "local",
          localPath: jsPath,
        });
        return;
      }

      // Neither file exists
      setState({
        sourceCode: null,
        loading: false,
        hasAttempted: true,
        error: `File not found: ${tsPath} or ${jsPath}`,
        source: null,
        localPath: null,
      });
    } catch (err) {
      // Check if this request is still current
      if (currentRequestId !== requestIdRef.current) return;

      setState({
        sourceCode: null,
        loading: false,
        hasAttempted: true,
        error: err instanceof Error ? err.message : String(err),
        source: null,
        localPath: null,
      });
    }
  }, [projectPath, modulePath, enabled]);

  // Load on mount and when dependencies change
  useEffect(() => {
    // Reset state when inputs change
    setState((s) => ({
      ...s,
      loading: enabled && !!projectPath && !!modulePath,
      hasAttempted: false,
    }));
    loadSourceCode();
  }, [loadSourceCode, enabled, projectPath, modulePath]);

  return {
    ...state,
    refresh: loadSourceCode,
  };
}

export default useLocalSourceCode;
