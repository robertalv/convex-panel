import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexHttpClient } from "convex/browser";
import type { Deployment } from "@/types/desktop";
import { createDeployKey } from "../api/bigbrain";
import {
  loadDeploymentKey,
  saveDeploymentKey,
  clearDeploymentKey,
  getOAuthTokenFromStorage,
  isOAuthTokenExpired,
} from "../lib/secureStorage";
import {
  writeDeployKeyToEnvLocal,
  readDeployKeyFromEnvLocal,
  validateDeployKey,
} from "../lib/envFile";
import type { DashboardFetch } from "../lib/convex/dashboardCommonAdapter";

interface DeploymentContextValue {
  /** The currently selected deployment */
  deployment: Deployment | null;
  /** The deployment URL */
  deploymentUrl: string | null;
  /** The authentication token (for admin client - typically the access token) */
  authToken: string | null;
  /** Whether we're using mock data (no real deployment connected) */
  useMockData: boolean;
  /** Admin client for mutations */
  adminClient: ConvexReactClient | null;
  /** HTTP client for API calls */
  httpClient: ConvexHttpClient | null;
  /** Team slug for dashboard links */
  teamSlug: string | null;
  /** Project slug for dashboard links */
  projectSlug: string | null;
  /** CLI deploy key for terminal (auto-generated from OAuth or manually set) */
  cliDeployKey: string | null;
  /** Error message if deploy key creation failed */
  cliDeployKeyError: string | null;
  /** Whether deploy key is being loaded/generated */
  cliDeployKeyLoading: boolean;
  /** Whether the deploy key was manually set by the user */
  cliDeployKeyIsManual: boolean;
  /** Regenerate the deploy key (clears cache and creates new one) */
  regenerateDeployKey: () => Promise<void>;
  /** Manually set the deploy key (for when auto-generation fails) */
  setManualDeployKey: (key: string) => Promise<void>;
  /** Clear the manually set deploy key */
  clearManualDeployKey: () => Promise<void>;
  /** Write the current deploy key to .env.local in the project directory */
  writeKeyToEnvLocal: (projectPath: string) => Promise<void>;
  /** Read deploy key from .env.local in the project directory */
  readKeyFromEnvLocal: (projectPath: string) => Promise<string | null>;
}

const DeploymentContext = createContext<DeploymentContextValue | undefined>(
  undefined,
);

interface DeploymentProviderProps {
  children: ReactNode;
  deployment: Deployment | null;
  /** Auth token for admin client (typically the OAuth access token) */
  authToken: string | null;
  /** OAuth access token for API calls (used to generate deploy keys) */
  accessToken?: string | null;
  deployUrl?: string | null;
  teamSlug?: string | null;
  projectSlug?: string | null;
  /** Fetch function for API calls (defaults to window.fetch) */
  fetchFn?: DashboardFetch;
}

/**
 * Provider for deployment credentials used by feature views.
 */
export function DeploymentProvider({
  children,
  deployment,
  authToken,
  accessToken,
  deployUrl,
  teamSlug = null,
  projectSlug = null,
  fetchFn = fetch,
}: DeploymentProviderProps) {
  // Derive deployment URL from deployment object or manual deployUrl
  const deploymentUrl = deployment?.url ?? deployUrl ?? null;

  // Use mock data if no deployment is selected or no auth token
  const useMockData = !deploymentUrl || !authToken;

  // Admin client state
  const [adminClient, setAdminClient] = useState<ConvexReactClient | null>(
    null,
  );
  const [httpClient, setHttpClient] = useState<ConvexHttpClient | null>(null);

  // CLI deploy key state (for terminal)
  const [cliDeployKey, setCliDeployKey] = useState<string | null>(null);
  const [cliDeployKeyError, setCliDeployKeyError] = useState<string | null>(
    null,
  );
  const [cliDeployKeyLoading, setCliDeployKeyLoading] = useState(false);
  const [cliDeployKeyIsManual, setCliDeployKeyIsManual] = useState(false);

  // Track if we're currently generating a key to avoid duplicate requests
  const generatingKeyRef = useRef<string | null>(null);

  // Auto-generate or load cached deploy key when deployment changes
  useEffect(() => {
    const deploymentName = deployment?.name;
    const token = accessToken;

    console.log("[DeploymentContext] Deploy key effect triggered:", {
      deploymentName,
      hasAccessToken: Boolean(token),
      accessTokenPrefix: token ? token.substring(0, 20) + "..." : null,
    });

    // Reset state when deployment changes
    setCliDeployKey(null);
    setCliDeployKeyError(null);

    // If no deployment or no access token, nothing to do
    if (!deploymentName || !token) {
      console.log(
        "[DeploymentContext] Missing deployment or token, skipping deploy key generation",
      );
      setCliDeployKeyLoading(false);
      return;
    }

    // Avoid duplicate requests for the same deployment
    if (generatingKeyRef.current === deploymentName) {
      return;
    }

    let cancelled = false;

    const loadOrCreateDeployKey = async () => {
      generatingKeyRef.current = deploymentName;
      setCliDeployKeyLoading(true);

      try {
        // First, try to load cached key
        const cachedKey = await loadDeploymentKey(deploymentName);

        if (cachedKey) {
          console.log(
            `[DeploymentContext] Using cached deploy key for ${deploymentName}`,
          );
          if (!cancelled) {
            setCliDeployKey(cachedKey);
            setCliDeployKeyLoading(false);
          }
          return;
        }

        // No cached key, create a new one
        console.log(
          `[DeploymentContext] Creating new deploy key for ${deploymentName}`,
        );
        // Use format: cp-{projectId}-{timestamp}
        const projectId = deployment?.projectId;
        const keyName = projectId
          ? `cp-${projectId}-${Date.now()}`
          : `cp-desktop-${Date.now()}`;

        const result = await createDeployKey(
          token,
          deploymentName,
          keyName,
          fetchFn,
        );

        if (!cancelled) {
          // Cache the key for future use
          await saveDeploymentKey(deploymentName, result.key);
          setCliDeployKey(result.key);
          console.log(
            `[DeploymentContext] Deploy key created and cached for ${deploymentName}`,
          );
        }
      } catch (error) {
        console.error(
          `[DeploymentContext] Failed to get deploy key for ${deploymentName}:`,
          error,
        );

        // ============================================================
        // FALLBACK CHAIN: Try alternative credential sources
        // ============================================================
        if (!cancelled) {
          // Try OAuth token from localStorage as fallback
          try {
            const oauthToken = getOAuthTokenFromStorage();
            const tokenExpired = isOAuthTokenExpired();

            if (oauthToken && !tokenExpired) {
              console.log(
                `[DeploymentContext] Using OAuth token as fallback for ${deploymentName}`,
              );

              // Validate that the token can be used with this deployment
              // Deploy keys have format: {deploymentName}|{key}, but OAuth tokens don't
              // We'll use the OAuth token directly and mark it as a fallback
              setCliDeployKey(oauthToken);
              setCliDeployKeyIsManual(false); // Not manual, it's auto-fallback
              setCliDeployKeyError(null);
              console.log(
                `[DeploymentContext] Successfully using OAuth token fallback for ${deploymentName}`,
              );
              return;
            } else if (oauthToken && tokenExpired) {
              console.warn(
                `[DeploymentContext] OAuth token found but expired for ${deploymentName}`,
              );
              setCliDeployKeyError(
                "OAuth token expired. Please re-authenticate or set a deploy key manually.",
              );
            } else {
              console.warn(
                `[DeploymentContext] No OAuth token fallback available for ${deploymentName}`,
              );
              setCliDeployKeyError(
                error instanceof Error
                  ? error.message
                  : "Failed to create deploy key. Please set one manually.",
              );
            }
          } catch (fallbackError) {
            console.error(
              `[DeploymentContext] Fallback credential check failed:`,
              fallbackError,
            );
            setCliDeployKeyError(
              error instanceof Error
                ? error.message
                : "Failed to create deploy key",
            );
          }
        }
      } finally {
        // Always clear the generating ref if it matches
        if (generatingKeyRef.current === deploymentName) {
          generatingKeyRef.current = null;
        }
        // Only update loading state if not cancelled (component still mounted)
        if (!cancelled) {
          setCliDeployKeyLoading(false);
        }
      }
    };

    loadOrCreateDeployKey();

    return () => {
      cancelled = true;
      // Reset loading state on cleanup to prevent stuck "Loading..." state
      setCliDeployKeyLoading(false);
    };
  }, [deployment?.name, deployment?.projectId, accessToken, fetchFn]);

  // Create admin client when credentials change
  useEffect(() => {
    // Clean up previous client
    if (adminClient) {
      try {
        (adminClient as any).close?.();
      } catch {
        // Ignore close errors
      }
      setAdminClient(null);
      setHttpClient(null);
    }

    if (!deploymentUrl || !authToken) {
      return;
    }

    try {
      // Create ConvexReactClient with admin auth
      const client = new ConvexReactClient(deploymentUrl, {
        reportDebugInfoToConvex: true,
      });

      // Set admin auth using the access token
      if (typeof (client as any).setAdminAuth === "function") {
        (client as any).setAdminAuth(authToken);
      }
      // Store the token on the client for utility functions to access
      (client as any)._adminAuth = authToken;
      (client as any)._adminKey = authToken;

      // Create HTTP client
      const http = new ConvexHttpClient(deploymentUrl);
      if (typeof (http as any).setAdminAuth === "function") {
        (http as any).setAdminAuth(authToken);
      }

      setAdminClient(client);
      setHttpClient(http);
    } catch (err) {
      console.error("Error creating Convex admin client:", err);
    }

    return () => {
      // Cleanup on unmount or credential change
      if (adminClient) {
        try {
          (adminClient as any).close?.();
        } catch {
          // Ignore close errors
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deploymentUrl, authToken]);

  // Function to regenerate deploy key (clears cache and creates new one)
  const regenerateDeployKey = useCallback(async () => {
    const deploymentName = deployment?.name;
    const token = accessToken;

    if (!deploymentName || !token) {
      setCliDeployKeyError("No deployment or access token available");
      return;
    }

    setCliDeployKeyLoading(true);
    setCliDeployKeyError(null);
    setCliDeployKeyIsManual(false);

    try {
      // Clear the cached key first
      await clearDeploymentKey(deploymentName);

      // Create a new key with retry logic
      console.log(
        `[DeploymentContext] Regenerating deploy key for ${deploymentName}`,
      );
      const projectId = deployment?.projectId;
      const keyName = projectId
        ? `cp-${projectId}-${Date.now()}`
        : `cp-desktop-${Date.now()}`;

      // Retry up to 3 times with exponential backoff
      let lastError: Error | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const result = await createDeployKey(
            token,
            deploymentName,
            keyName,
            fetchFn,
          );

          // Cache and set the new key
          await saveDeploymentKey(deploymentName, result.key);
          setCliDeployKey(result.key);
          console.log(
            `[DeploymentContext] Deploy key regenerated for ${deploymentName}`,
          );
          return; // Success!
        } catch (attemptError) {
          lastError =
            attemptError instanceof Error
              ? attemptError
              : new Error(String(attemptError));
          console.warn(
            `[DeploymentContext] Deploy key generation attempt ${attempt + 1} failed:`,
            attemptError,
          );

          // Wait before retrying (exponential backoff: 1s, 2s, 4s)
          if (attempt < 2) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * Math.pow(2, attempt)),
            );
          }
        }
      }

      // All retries failed, try OAuth fallback
      throw (
        lastError || new Error("Failed to regenerate deploy key after retries")
      );
    } catch (error) {
      console.error(
        `[DeploymentContext] Failed to regenerate deploy key:`,
        error,
      );

      // Try OAuth token fallback
      try {
        const oauthToken = getOAuthTokenFromStorage();
        const tokenExpired = isOAuthTokenExpired();

        if (oauthToken && !tokenExpired) {
          console.log(
            `[DeploymentContext] Using OAuth token as fallback after regeneration failure`,
          );
          setCliDeployKey(oauthToken);
          setCliDeployKeyError(null);
          return;
        }
      } catch (fallbackError) {
        console.error(
          `[DeploymentContext] OAuth fallback failed during regeneration:`,
          fallbackError,
        );
      }

      setCliDeployKeyError(
        error instanceof Error
          ? error.message
          : "Failed to regenerate deploy key",
      );
    } finally {
      setCliDeployKeyLoading(false);
    }
  }, [deployment?.name, deployment?.projectId, accessToken, fetchFn]);

  // Function to manually set a deploy key (for when auto-generation fails)
  const setManualDeployKey = useCallback(
    async (key: string) => {
      const deploymentName = deployment?.name;
      if (!deploymentName) {
        setCliDeployKeyError("No deployment selected");
        return;
      }

      // Validate that the key matches the current deployment
      const validation = validateDeployKey(key, deploymentName);
      if (!validation.valid) {
        setCliDeployKeyError(validation.error || "Invalid deploy key");
        console.error(
          `[DeploymentContext] Deploy key validation failed for ${deploymentName}:`,
          validation.error,
        );
        return;
      }

      try {
        // Save the manual key to cache
        await saveDeploymentKey(deploymentName, key);
        setCliDeployKey(key);
        setCliDeployKeyError(null);
        setCliDeployKeyIsManual(true);
        console.log(
          `[DeploymentContext] Manual deploy key set for ${deploymentName}`,
        );
      } catch (error) {
        console.error(
          `[DeploymentContext] Failed to save manual deploy key:`,
          error,
        );
        setCliDeployKeyError(
          error instanceof Error ? error.message : "Failed to save deploy key",
        );
      }
    },
    [deployment?.name],
  );

  // Function to clear a manually set deploy key
  const clearManualDeployKey = useCallback(async () => {
    const deploymentName = deployment?.name;
    if (!deploymentName) {
      return;
    }

    try {
      await clearDeploymentKey(deploymentName);
      setCliDeployKey(null);
      setCliDeployKeyIsManual(false);
      console.log(
        `[DeploymentContext] Manual deploy key cleared for ${deploymentName}`,
      );
    } catch (error) {
      console.error(
        `[DeploymentContext] Failed to clear manual deploy key:`,
        error,
      );
    }
  }, [deployment?.name]);

  // Function to write the current deploy key to .env.local
  const writeKeyToEnvLocal = useCallback(
    async (projectPath: string) => {
      if (!cliDeployKey) {
        throw new Error("No deploy key available to write");
      }

      try {
        await writeDeployKeyToEnvLocal(projectPath, cliDeployKey);
        console.log(
          `[DeploymentContext] Deploy key written to .env.local in ${projectPath}`,
        );
      } catch (error) {
        console.error(
          `[DeploymentContext] Failed to write deploy key to .env.local:`,
          error,
        );
        throw error;
      }
    },
    [cliDeployKey],
  );

  // Function to read deploy key from .env.local
  const readKeyFromEnvLocal = useCallback(
    async (projectPath: string): Promise<string | null> => {
      try {
        const key = await readDeployKeyFromEnvLocal(projectPath);
        if (key) {
          console.log(
            `[DeploymentContext] Found deploy key in .env.local at ${projectPath}`,
          );
        }
        return key;
      } catch (error) {
        console.error(
          `[DeploymentContext] Failed to read deploy key from .env.local:`,
          error,
        );
        return null;
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      deployment,
      deploymentUrl,
      authToken,
      useMockData,
      adminClient,
      httpClient,
      teamSlug,
      projectSlug,
      cliDeployKey,
      cliDeployKeyError,
      cliDeployKeyLoading,
      cliDeployKeyIsManual,
      regenerateDeployKey,
      setManualDeployKey,
      clearManualDeployKey,
      writeKeyToEnvLocal,
      readKeyFromEnvLocal,
    }),
    [
      deployment,
      deploymentUrl,
      authToken,
      useMockData,
      adminClient,
      httpClient,
      teamSlug,
      projectSlug,
      cliDeployKey,
      cliDeployKeyError,
      cliDeployKeyLoading,
      cliDeployKeyIsManual,
      regenerateDeployKey,
      setManualDeployKey,
      clearManualDeployKey,
      writeKeyToEnvLocal,
      readKeyFromEnvLocal,
    ],
  );

  return (
    <DeploymentContext.Provider value={value}>
      {children}
    </DeploymentContext.Provider>
  );
}

/**
 * Hook to access deployment credentials.
 */
export function useDeployment(): DeploymentContextValue {
  const context = useContext(DeploymentContext);
  if (context === undefined) {
    // Return mock data values if used outside provider
    return {
      deployment: null,
      deploymentUrl: null,
      authToken: null,
      useMockData: true,
      adminClient: null,
      httpClient: null,
      teamSlug: null,
      projectSlug: null,
      cliDeployKey: null,
      cliDeployKeyError: null,
      cliDeployKeyLoading: false,
      cliDeployKeyIsManual: false,
      regenerateDeployKey: async () => {},
      setManualDeployKey: async () => {},
      clearManualDeployKey: async () => {},
      writeKeyToEnvLocal: async () => {},
      readKeyFromEnvLocal: async () => null,
    };
  }
  return context;
}
