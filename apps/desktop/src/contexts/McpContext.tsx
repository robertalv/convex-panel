import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

/**
 * MCP Server status from the Rust backend
 */
export interface McpStatus {
  running: boolean;
  port: number | null;
  url: string | null;
  connected_clients: number;
}

/**
 * Convex project identifier for MCP settings
 */
export interface ConvexProjectId {
  teamSlug: string;
  projectSlug: string;
}

/**
 * Hook to track previous value of a prop/state
 */
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

// Storage key and version for per-project MCP settings
const MCP_STORAGE_KEY = "convex-desktop-mcp-settings";
const MCP_STORAGE_VERSION = 1;

interface McpSettingsStore {
  version: number;
  projects: {
    [projectKey: string]: {
      projectPath: string | null;
      lastUpdated: number;
    };
  };
}

function getProjectKey(project: ConvexProjectId): string {
  return `${project.teamSlug}/${project.projectSlug}`;
}

function getMcpStore(): McpSettingsStore {
  try {
    const raw = localStorage.getItem(MCP_STORAGE_KEY);
    if (!raw) {
      return { version: MCP_STORAGE_VERSION, projects: {} };
    }
    const parsed = JSON.parse(raw);
    if (!parsed.version || parsed.version < MCP_STORAGE_VERSION) {
      return { version: MCP_STORAGE_VERSION, projects: {} };
    }
    return parsed as McpSettingsStore;
  } catch {
    return { version: MCP_STORAGE_VERSION, projects: {} };
  }
}

function saveMcpStore(store: McpSettingsStore): void {
  try {
    localStorage.setItem(MCP_STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error("[McpStorage] Failed to save settings:", e);
  }
}

function getProjectMcpPath(project: ConvexProjectId): string | null {
  const store = getMcpStore();
  const key = getProjectKey(project);
  return store.projects[key]?.projectPath ?? null;
}

function saveProjectMcpPath(
  project: ConvexProjectId,
  path: string | null,
): void {
  const store = getMcpStore();
  const key = getProjectKey(project);
  store.projects[key] = {
    projectPath: path,
    lastUpdated: Date.now(),
  };
  saveMcpStore(store);
}

/**
 * MCP Context state
 */
interface McpContextValue {
  // Status
  status: McpStatus;
  isLoading: boolean;
  error: string | null;

  // Project configuration
  projectPath: string | null;

  // Actions
  startServer: () => Promise<void>;
  stopServer: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  setProjectPath: (path: string | null) => Promise<void>;
  selectProjectDirectory: () => Promise<string | null>;
  getCursorConfig: () => Promise<string | null>;
  copyConfigToClipboard: () => Promise<void>;
  openInCursor: (filePath: string, line?: number) => Promise<void>;
}

const McpContext = createContext<McpContextValue | null>(null);

interface McpProviderProps {
  children: ReactNode;
  /** Convex team slug - required for per-project MCP settings */
  teamSlug?: string | null;
  /** Convex project slug - required for per-project MCP settings */
  projectSlug?: string | null;
}

export function McpProvider({
  children,
  teamSlug,
  projectSlug,
}: McpProviderProps) {
  const [status, setStatus] = useState<McpStatus>({
    running: false,
    port: null,
    url: null,
    connected_clients: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectPath, setProjectPathState] = useState<string | null>(null);

  // Track if we've initialized for current project
  const initializedProjectRef = useRef<string | null>(null);

  // Compute Convex project ID from props
  const convexProject: ConvexProjectId | null = useMemo(() => {
    if (teamSlug && projectSlug) {
      return { teamSlug, projectSlug };
    }
    return null;
  }, [teamSlug, projectSlug]);

  // Create a stable key for tracking project changes
  const projectKey = convexProject
    ? `${convexProject.teamSlug}/${convexProject.projectSlug}`
    : null;

  // Track previous project key to detect changes
  const prevProjectKey = usePrevious(projectKey);

  // Refresh MCP status
  const refreshStatus = useCallback(async () => {
    try {
      const newStatus = await invoke<McpStatus>("get_mcp_status");
      setStatus(newStatus);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  // Start the MCP server
  const startServer = useCallback(async () => {
    setIsLoading(true);
    try {
      const port = await invoke<number>("start_mcp_server");
      console.log(`MCP server started on port ${port}`);
      await refreshStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [refreshStatus]);

  // Stop the MCP server
  const stopServer = useCallback(async () => {
    setIsLoading(true);
    try {
      await invoke("stop_mcp_server");
      await refreshStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [refreshStatus]);

  // Set project path (persists to per-project storage)
  const setProjectPath = useCallback(
    async (path: string | null) => {
      setProjectPathState(path);

      // Persist to per-project storage if we have a Convex project
      if (convexProject) {
        saveProjectMcpPath(convexProject, path);
      }

      try {
        await invoke("set_mcp_project_path", { path });
      } catch (err) {
        console.error("Failed to set MCP project path:", err);
      }
    },
    [convexProject],
  );

  // Select project directory using native dialog
  const selectProjectDirectory = useCallback(async (): Promise<
    string | null
  > => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Convex Project Directory",
      });

      if (selected && typeof selected === "string") {
        await setProjectPath(selected);
        return selected;
      }
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    }
  }, [setProjectPath]);

  // Get Cursor configuration JSON
  const getCursorConfig = useCallback(async (): Promise<string | null> => {
    try {
      return await invoke<string | null>("get_cursor_mcp_config");
    } catch (err) {
      console.error("Failed to get Cursor config:", err);
      return null;
    }
  }, []);

  // Copy configuration to clipboard
  const copyConfigToClipboard = useCallback(async () => {
    const config = await getCursorConfig();
    if (config) {
      await navigator.clipboard.writeText(config);
    }
  }, [getCursorConfig]);

  // Open a file in Cursor
  const openInCursor = useCallback(async (filePath: string, line?: number) => {
    try {
      await invoke("open_in_editor", {
        path: filePath,
        line: line ?? null,
        editor: "cursor",
      });
    } catch (err) {
      // Fall back to VS Code if Cursor isn't available
      try {
        await invoke("open_in_editor", {
          path: filePath,
          line: line ?? null,
          editor: "code",
        });
      } catch (fallbackErr) {
        setError(`Failed to open file: ${err}`);
      }
    }
  }, []);

  // IMPORTANT: Immediately clear state when Convex project changes
  // This runs before the restore effect to ensure old state is never shown
  useEffect(() => {
    // Only act when project actually changes (not on initial mount)
    if (prevProjectKey !== undefined && prevProjectKey !== projectKey) {
      console.log(
        `[McpContext] Convex project changed from "${prevProjectKey}" to "${projectKey}", clearing state`,
      );
      setProjectPathState(null);
      initializedProjectRef.current = null;

      // Also update the backend with null path immediately
      invoke("set_mcp_project_path", { path: null }).catch((err) =>
        console.error("Failed to clear MCP project path:", err),
      );
    }
  }, [projectKey, prevProjectKey]);

  // Restore project path from storage when Convex project changes
  useEffect(() => {
    // Skip if no Convex project
    if (!convexProject) {
      setProjectPathState(null);
      initializedProjectRef.current = null;
      return;
    }

    // Skip if already initialized for this project
    if (initializedProjectRef.current === projectKey) {
      return;
    }

    // Mark as initialized
    initializedProjectRef.current = projectKey;

    // Try to restore saved project path for this Convex project
    const savedPath = getProjectMcpPath(convexProject);

    if (savedPath) {
      console.log(
        `[McpContext] Restored project path for Convex project ${projectKey}: ${savedPath}`,
      );
      setProjectPathState(savedPath);

      // Update the backend
      invoke("set_mcp_project_path", { path: savedPath }).catch((err) =>
        console.error("Failed to set MCP project path:", err),
      );
    } else {
      setProjectPathState(null);
    }
  }, [convexProject, projectKey]);

  // Initial MCP status check
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        await refreshStatus();
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [refreshStatus]);

  // Listen for MCP events from the backend
  useEffect(() => {
    const setupListeners = async () => {
      // Listen for terminal command requests from MCP
      const unlisten = await listen<{
        command: string;
        cwd?: string;
        newSession?: boolean;
        sessionName?: string;
      }>("mcp:terminal-command", (event) => {
        // Dispatch to terminal context
        window.dispatchEvent(
          new CustomEvent("mcp-terminal-command", { detail: event.payload }),
        );
      });

      return unlisten;
    };

    const unlistenPromise = setupListeners();
    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  // Periodic status refresh
  useEffect(() => {
    const interval = setInterval(refreshStatus, 5000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  const value = useMemo<McpContextValue>(
    () => ({
      status,
      isLoading,
      error,
      projectPath,
      startServer,
      stopServer,
      refreshStatus,
      setProjectPath,
      selectProjectDirectory,
      getCursorConfig,
      copyConfigToClipboard,
      openInCursor,
    }),
    [
      status,
      isLoading,
      error,
      projectPath,
      startServer,
      stopServer,
      refreshStatus,
      setProjectPath,
      selectProjectDirectory,
      getCursorConfig,
      copyConfigToClipboard,
      openInCursor,
    ],
  );

  return <McpContext.Provider value={value}>{children}</McpContext.Provider>;
}

export function useMcp(): McpContextValue {
  const context = useContext(McpContext);
  if (!context) {
    throw new Error("useMcp must be used within an McpProvider");
  }
  return context;
}

/**
 * Hook to check if MCP is available (for optional usage)
 */
export function useMcpOptional(): McpContextValue | null {
  return useContext(McpContext);
}
