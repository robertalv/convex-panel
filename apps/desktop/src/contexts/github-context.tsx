/**
 * GitHub Context
 *
 * Provides GitHub authentication state and methods throughout the app.
 * Handles the Device Flow authentication and stores tokens securely.
 *
 * IMPORTANT: GitHub repo/branch settings are persisted per Convex project (team/project slug).
 * When switching between Convex projects, the selected repo/branch will be restored from storage.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from "react";
import type {
  GitHubUser,
  GitHubRepo,
  AuthStatus,
  DeviceCodeResponse,
} from "../services/github/types";
import {
  checkAuth,
  initiateDeviceFlow,
  completeDeviceFlow,
  logout as logoutService,
  getStoredToken,
} from "../services/github/auth";
import {
  listUserRepos,
  searchUserRepos,
  listAllBranches,
} from "../services/github/api";
import {
  getProjectGitHubSettings,
  saveProjectGitHubSettings,
  cleanupStaleSettings,
  type ConvexProjectId,
} from "../services/github/storage";

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

interface GitHubContextValue {
  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  authStatus: AuthStatus;
  user: GitHubUser | null;
  token: string | null;
  error: string | null;

  // Convex project identification
  convexProject: ConvexProjectId | null;
  hasConvexProject: boolean;

  // Device flow state (for auth modal)
  deviceCode: DeviceCodeResponse | null;

  // Actions
  startAuth: () => Promise<void>;
  cancelAuth: () => void;
  logout: () => Promise<void>;

  // Repository access
  repos: GitHubRepo[];
  reposLoading: boolean;
  refreshRepos: () => Promise<void>;

  // Search repos (server-side search, triggers after 3+ chars)
  searchRepos: (query: string) => Promise<GitHubRepo[]>;
  searchedRepos: GitHubRepo[];
  searchReposLoading: boolean;

  // Selected repo for schema visualization (per Convex project)
  selectedRepo: GitHubRepo | null;
  selectRepo: (repo: GitHubRepo | null) => void;

  // Selected branch (per Convex project)
  selectedBranch: string | null;
  selectBranch: (branch: string | null) => void;

  // Branch access (with pagination)
  branches: Array<{ name: string; sha: string }>;
  branchesLoading: boolean;
  fetchBranches: (owner: string, repo: string) => Promise<void>;
}

const GitHubContext = createContext<GitHubContextValue | undefined>(undefined);

interface GitHubProviderProps {
  children: ReactNode;
  /** Convex team slug - required for per-project GitHub settings */
  teamSlug?: string | null;
  /** Convex project slug - required for per-project GitHub settings */
  projectSlug?: string | null;
}

export function GitHubProvider({
  children,
  teamSlug,
  projectSlug,
}: GitHubProviderProps) {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Device flow state
  const [deviceCode, setDeviceCode] = useState<DeviceCodeResponse | null>(null);
  const authAbortController = useRef<AbortController | null>(null);

  // Repos state
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [reposLoading, setReposLoading] = useState(false);

  // Search repos state
  const [searchedRepos, setSearchedRepos] = useState<GitHubRepo[]>([]);
  const [searchReposLoading, setSearchReposLoading] = useState(false);
  const searchAbortController = useRef<AbortController | null>(null);
  const lastSearchQuery = useRef<string>("");

  // Branches state
  const [branches, setBranches] = useState<
    Array<{ name: string; sha: string }>
  >([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  // Per-project settings
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  // Compute convex project ID from props
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

  // Track if we've initialized settings for current project
  const initializedProjectRef = useRef<string | null>(null);

  // Track previous project key to detect changes
  const prevProjectKey = usePrevious(projectKey);

  // Derived state
  const hasConvexProject = convexProject !== null;

  // Clean up stale settings on mount
  useEffect(() => {
    cleanupStaleSettings();
  }, []);

  // Check for existing auth on mount
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      setAuthStatus("loading");

      try {
        const result = await checkAuth();
        if (result) {
          setIsAuthenticated(true);
          setUser(result.user);
          setToken(result.token);
          setAuthStatus("authenticated");
        } else {
          setAuthStatus("idle");
        }
      } catch (e) {
        console.error("Failed to check auth:", e);
        setAuthStatus("idle");
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Fetch repos when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      refreshRepos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]);

  // IMPORTANT: Immediately clear state when Convex project changes
  // This runs before the restore effect to ensure old state is never shown
  useEffect(() => {
    // Only act when project actually changes (not on initial mount)
    if (prevProjectKey !== undefined && prevProjectKey !== projectKey) {
      console.log(
        `[GitHubContext] Convex project changed from "${prevProjectKey}" to "${projectKey}", clearing state`,
      );
      setSelectedRepo(null);
      setSelectedBranch(null);
      initializedProjectRef.current = null;
    }
  }, [projectKey, prevProjectKey]);

  // Load saved settings when Convex project changes
  useEffect(() => {
    // Skip if no Convex project
    if (!convexProject) {
      setSelectedRepo(null);
      setSelectedBranch(null);
      initializedProjectRef.current = null;
      return;
    }

    // Skip if already initialized for this project
    if (initializedProjectRef.current === projectKey) {
      return;
    }

    // Try to restore saved settings for this Convex project
    const savedSettings = getProjectGitHubSettings(convexProject);

    if (savedSettings?.fullRepo) {
      // Use stored full repo for immediate restoration
      console.log(
        `[GitHubContext] Restored full repo for Convex project ${projectKey}: ${savedSettings.fullRepo.full_name}`,
      );
      setSelectedRepo(savedSettings.fullRepo);
      setSelectedBranch(savedSettings.branch);
    } else if (savedSettings?.repoFullName && repos.length > 0) {
      // Fallback: try to find repo in current repos list
      const savedRepo = repos.find(
        (r) => r.full_name === savedSettings.repoFullName,
      );
      if (savedRepo) {
        console.log(
          `[GitHubContext] Restored repo from list for Convex project ${projectKey}: ${savedSettings.repoFullName}`,
        );
        setSelectedRepo(savedRepo);
        setSelectedBranch(savedSettings.branch);
      } else {
        // Repo no longer accessible
        console.log(
          `[GitHubContext] Saved repo not found: ${savedSettings.repoFullName}`,
        );
        setSelectedRepo(null);
        setSelectedBranch(null);
      }
    } else if (!savedSettings?.repoFullName) {
      // No saved settings for this project
      setSelectedRepo(null);
      setSelectedBranch(null);
    }

    // Mark as initialized (immediate restoration, don't wait for repos)
    initializedProjectRef.current = projectKey;
  }, [convexProject, projectKey, repos]);

  // Validate and update stored repo when repos list becomes available
  useEffect(() => {
    if (!convexProject || repos.length === 0 || !selectedRepo) {
      return;
    }

    const savedSettings = getProjectGitHubSettings(convexProject);
    if (!savedSettings?.repoFullName) {
      return;
    }

    // If we have a selected repo, check if it matches the saved one and update if needed
    if (selectedRepo.full_name === savedSettings.repoFullName) {
      const currentRepo = repos.find(
        (r) => r.full_name === selectedRepo.full_name,
      );
      if (currentRepo && currentRepo !== selectedRepo) {
        // Update with fresh data from repos list
        console.log(
          `[GitHubContext] Updating repo with fresh data: ${selectedRepo.full_name}`,
        );
        setSelectedRepo(currentRepo);
        saveProjectGitHubSettings(convexProject, {
          repoFullName: currentRepo.full_name,
          fullRepo: currentRepo,
          branch: savedSettings.branch,
        });
      }
    }
  }, [convexProject, repos, selectedRepo]);

  // Start the Device Flow authentication
  const startAuth = useCallback(async () => {
    setError(null);
    setAuthStatus("loading");

    try {
      // Initiate device flow
      const deviceCodeResponse = await initiateDeviceFlow();
      setDeviceCode(deviceCodeResponse);
      setAuthStatus("awaiting_user");

      // Create abort controller for cancellation
      authAbortController.current = new AbortController();

      // Start polling for token
      setAuthStatus("polling");

      const result = await completeDeviceFlow(
        deviceCodeResponse.device_code,
        deviceCodeResponse.interval,
        () => {
          // Still waiting for user
        },
        authAbortController.current.signal,
      );

      // Success!
      setIsAuthenticated(true);
      setUser(result.user);
      setToken(result.token);
      setAuthStatus("authenticated");
      setDeviceCode(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Authentication failed";
      if (message !== "Authentication cancelled") {
        setError(message);
        setAuthStatus("error");
      } else {
        setAuthStatus("idle");
      }
      setDeviceCode(null);
    }
  }, []);

  // Cancel ongoing authentication
  const cancelAuth = useCallback(() => {
    authAbortController.current?.abort();
    authAbortController.current = null;
    setDeviceCode(null);
    setAuthStatus("idle");
    setError(null);
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await logoutService();
    } catch (e) {
      console.error("Logout error:", e);
    }

    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    setAuthStatus("idle");
    setRepos([]);
    setSelectedRepo(null);
    setSelectedBranch(null);
  }, []);

  // Refresh repository list
  const refreshRepos = useCallback(async () => {
    const currentToken = await getStoredToken();
    if (!currentToken) return;

    setReposLoading(true);
    try {
      const userRepos = await listUserRepos(currentToken);
      setRepos(userRepos);
    } catch (e) {
      console.error("Failed to fetch repos:", e);
    } finally {
      setReposLoading(false);
    }
  }, []);

  // Select a repository (persists to storage if Convex project is set)
  const selectRepo = useCallback(
    (repo: GitHubRepo | null) => {
      setSelectedRepo(repo);

      // Persist to storage if we have a Convex project
      if (convexProject) {
        saveProjectGitHubSettings(convexProject, {
          repoFullName: repo?.full_name ?? null,
          fullRepo: repo, // Store full repo object for immediate restoration
          // Clear branch when repo changes
          branch: null,
        });
      }

      // Clear branch when repo changes
      setSelectedBranch(null);
    },
    [convexProject],
  );

  // Select a branch (persists to storage if Convex project is set)
  const selectBranch = useCallback(
    (branch: string | null) => {
      setSelectedBranch(branch);

      // Persist to storage if we have a Convex project
      if (convexProject) {
        saveProjectGitHubSettings(convexProject, {
          branch,
        });
      }
    },
    [convexProject],
  );

  // Search repositories (server-side search, triggers after 3+ chars)
  const searchRepos = useCallback(
    async (query: string): Promise<GitHubRepo[]> => {
      const currentToken = await getStoredToken();
      if (!currentToken) return [];

      // Only search if query is 3+ characters
      if (query.length < 3) {
        setSearchedRepos([]);
        return [];
      }

      // Skip if this is the same query as last time (avoid duplicate searches)
      if (query === lastSearchQuery.current) {
        return searchedRepos;
      }

      // Cancel any ongoing search
      if (searchAbortController.current) {
        searchAbortController.current.abort();
      }

      // Create new abort controller for this search
      searchAbortController.current = new AbortController();
      lastSearchQuery.current = query;

      setSearchReposLoading(true);
      try {
        const results = await searchUserRepos(currentToken, query, {
          signal: searchAbortController.current.signal,
        });

        // Only update if this search wasn't cancelled
        if (!searchAbortController.current?.signal.aborted) {
          setSearchedRepos(results);
        }
        return results;
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
          console.log("Search was cancelled");
          return [];
        }
        console.error("Failed to search repos:", e);
        // Don't clear existing results on error, just stop loading
        if (
          searchedRepos.length === 0 &&
          !searchAbortController.current?.signal.aborted
        ) {
          setSearchedRepos([]);
        }
        return [];
      } finally {
        if (!searchAbortController.current?.signal.aborted) {
          setSearchReposLoading(false);
        }
      }
    },
    [searchedRepos],
  );

  // Fetch all branches for a repository (with pagination)
  const fetchBranches = useCallback(
    async (owner: string, repo: string): Promise<void> => {
      const currentToken = await getStoredToken();
      if (!currentToken) return;

      setBranchesLoading(true);
      try {
        const allBranches = await listAllBranches(currentToken, owner, repo);
        setBranches(
          allBranches.map((b) => ({ name: b.name, sha: b.commit.sha })),
        );
      } catch (e) {
        console.error("Failed to fetch branches:", e);
        setBranches([]);
      } finally {
        setBranchesLoading(false);
      }
    },
    [],
  );

  // Memoize the context value to prevent unnecessary re-renders
  const value: GitHubContextValue = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      authStatus,
      user,
      token,
      error,
      convexProject,
      hasConvexProject,
      deviceCode,
      startAuth,
      cancelAuth,
      logout,
      repos,
      reposLoading,
      refreshRepos,
      searchRepos,
      searchedRepos,
      searchReposLoading,
      selectedRepo,
      selectRepo,
      selectedBranch,
      selectBranch,
      branches,
      branchesLoading,
      fetchBranches,
    }),
    [
      isAuthenticated,
      isLoading,
      authStatus,
      user,
      token,
      error,
      convexProject,
      hasConvexProject,
      deviceCode,
      startAuth,
      cancelAuth,
      logout,
      repos,
      reposLoading,
      refreshRepos,
      searchRepos,
      searchedRepos,
      searchReposLoading,
      selectedRepo,
      selectRepo,
      selectedBranch,
      selectBranch,
      branches,
      branchesLoading,
      fetchBranches,
    ],
  );

  return (
    <GitHubContext.Provider value={value}>{children}</GitHubContext.Provider>
  );
}

/**
 * Hook to access GitHub authentication state and methods
 */
export function useGitHub(): GitHubContextValue {
  const context = useContext(GitHubContext);
  if (context === undefined) {
    throw new Error("useGitHub must be used within a GitHubProvider");
  }
  return context;
}

/**
 * Hook that returns null if outside provider (for optional GitHub features)
 */
export function useGitHubOptional(): GitHubContextValue | null {
  return useContext(GitHubContext) ?? null;
}
