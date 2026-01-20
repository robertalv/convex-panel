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
import { createDeployKey } from "@convex-panel/shared/api";
import {
  getOAuthTokenFromStorage,
  isOAuthTokenExpired,
  saveDeploymentKey,
  loadDeploymentKey,
} from "../lib/secureStorage";
import {
  writeDeployKeyToEnvLocal,
  readDeployKeyFromEnvLocal,
  validateDeployKey,
} from "../lib/envFile";
import type { DashboardFetch } from "../lib/convex/dashboardCommonAdapter";

interface DeploymentContextValue {
  deployment: Deployment | null;
  deploymentUrl: string | null;
  authToken: string | null;
  accessToken: string | null;
  fetchFn: DashboardFetch;
  useMockData: boolean;
  adminClient: ConvexReactClient | null;
  httpClient: ConvexHttpClient | null;
  teamId: number | null;
  teamSlug: string | null;
  projectSlug: string | null;
  cliDeployKey: string | null;
  cliDeployKeyError: string | null;
  cliDeployKeyLoading: boolean;
  cliDeployKeyIsManual: boolean;
  regenerateDeployKey: () => Promise<void>;
  setManualDeployKey: (
    key: string,
    targetDeploymentName?: string,
  ) => Promise<void>;
  clearManualDeployKey: () => Promise<void>;
  writeKeyToEnvLocal: (projectPath: string) => Promise<void>;
  readKeyFromEnvLocal: (projectPath: string) => Promise<string | null>;
}

const DeploymentContext = createContext<DeploymentContextValue | undefined>(
  undefined,
);

interface DeploymentProviderProps {
  children: ReactNode;
  deployment: Deployment | null;
  authToken: string | null;
  accessToken?: string | null;
  deployUrl?: string | null;
  teamId?: number | null;
  teamSlug?: string | null;
  projectSlug?: string | null;
  fetchFn?: DashboardFetch;
}

export function DeploymentProvider({
  children,
  deployment,
  authToken,
  accessToken,
  deployUrl,
  teamId = null,
  teamSlug = null,
  projectSlug = null,
  fetchFn = fetch,
}: DeploymentProviderProps) {
  const deploymentUrl = deployment?.url ?? deployUrl ?? null;

  const useMockData = !deploymentUrl || !authToken;

  const [adminClient, setAdminClient] = useState<ConvexReactClient | null>(
    null,
  );
  const [httpClient, setHttpClient] = useState<ConvexHttpClient | null>(null);

  const [cliDeployKey, setCliDeployKey] = useState<string | null>(null);
  const [cliDeployKeyError, setCliDeployKeyError] = useState<string | null>(
    null,
  );
  const [cliDeployKeyLoading, setCliDeployKeyLoading] = useState(false);
  const [cliDeployKeyIsManual, setCliDeployKeyIsManual] = useState(false);

  const keyDeploymentRef = useRef<string | null>(null);
  const generatingKeyRef = useRef<string | null>(null);
  const fetchFnRef = useRef(fetchFn);

  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  // Load cached deploy key on deployment change
  useEffect(() => {
    const deploymentName = deployment?.name;
    const token = accessToken;

    console.log("[DeploymentContext] Deploy key validation effect triggered:", {
      deploymentName,
      hasAccessToken: Boolean(token),
      currentKey: cliDeployKey ? "present" : "null",
      keyDeployment: keyDeploymentRef.current,
    });

    if (!deploymentName || !token) {
      console.log(
        "[DeploymentContext] Missing deployment or token, clearing deploy key state",
      );
      setCliDeployKey(null);
      setCliDeployKeyError(null);
      setCliDeployKeyLoading(false);
      keyDeploymentRef.current = null;
      return;
    }

    // If we already have a valid key for this deployment, keep it
    if (cliDeployKey && keyDeploymentRef.current === deploymentName) {
      const validation = validateDeployKey(cliDeployKey, deploymentName);
      if (validation.valid) {
        console.log(
          `[DeploymentContext] Existing deploy key is valid for ${deploymentName}`,
        );
        return;
      }
    }

    // Try to load cached key from localStorage
    const loadCachedKey = async () => {
      try {
        const cachedKey = await loadDeploymentKey(deploymentName);
        if (cachedKey) {
          const validation = validateDeployKey(cachedKey, deploymentName);
          if (validation.valid) {
            console.log(
              `[DeploymentContext] Restored cached deploy key for ${deploymentName}`,
            );
            setCliDeployKey(cachedKey);
            keyDeploymentRef.current = deploymentName;
            setCliDeployKeyError(null);
            setCliDeployKeyIsManual(true); // Treat restored keys as manual
            return;
          } else {
            console.log(
              `[DeploymentContext] Cached key invalid for ${deploymentName}, clearing`,
            );
          }
        }
      } catch (err) {
        console.warn("[DeploymentContext] Failed to load cached key:", err);
      }

      // No cached key or invalid, show error prompting user to create one
      console.log(
        `[DeploymentContext] No valid deploy key for ${deploymentName}. User must create one manually.`,
      );
      setCliDeployKeyError(
        "No deploy key set. Please create one in Settings or enter one manually.",
      );
    };

    // Clear any existing invalid key first
    if (cliDeployKey && keyDeploymentRef.current !== deploymentName) {
      console.log(
        `[DeploymentContext] Deploy key is for different deployment. Clearing.`,
      );
      setCliDeployKey(null);
      keyDeploymentRef.current = null;
    }

    loadCachedKey();
  }, [deployment?.name, accessToken]);

  useEffect(() => {
    if (adminClient) {
      try {
        (adminClient as any).close?.();
      } catch {
        // Ignore close errors
      }
      setAdminClient(null);
      setHttpClient(null);
    }

    console.log("[DeploymentContext] AdminClient effect triggered:", {
      deploymentUrl,
      hasAuthToken: Boolean(authToken),
    });

    if (!deploymentUrl || !authToken) {
      console.log(
        "[DeploymentContext] Missing deploymentUrl or authToken, skipping client creation",
      );
      return;
    }

    try {
      console.log(
        "[DeploymentContext] Creating ConvexReactClient for:",
        deploymentUrl,
      );
      const client = new ConvexReactClient(deploymentUrl, {
        reportDebugInfoToConvex: true,
      });

      if (typeof (client as any).setAdminAuth === "function") {
        (client as any).setAdminAuth(authToken);
        console.log("[DeploymentContext] Called setAdminAuth on client");
      }
      (client as any)._adminAuth = authToken;
      (client as any)._adminKey = authToken;

      const http = new ConvexHttpClient(deploymentUrl);
      if (typeof (http as any).setAdminAuth === "function") {
        (http as any).setAdminAuth(authToken);
      }

      console.log("[DeploymentContext] AdminClient created successfully");
      setAdminClient(client);
      setHttpClient(http);
    } catch (err) {
      console.error(
        "[DeploymentContext] Error creating Convex admin client:",
        err,
      );
    }

    return () => {
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

  const regenerateDeployKey = useCallback(async () => {
    const deploymentName = deployment?.name;
    const token = accessToken;

    if (!deploymentName || !token) {
      setCliDeployKeyError("No deployment or access token available");
      return;
    }

    if (generatingKeyRef.current === deploymentName) {
      console.log(
        `[DeploymentContext] Already generating key for ${deploymentName}, skipping duplicate request`,
      );
      return;
    }

    generatingKeyRef.current = deploymentName;
    setCliDeployKeyLoading(true);
    setCliDeployKeyError(null);
    setCliDeployKeyIsManual(false);

    try {
      const projectId = deployment?.projectId;
      const keyName = projectId
        ? `cp-${projectId}-${Date.now()}`
        : `cp-desktop-${Date.now()}`;

      let lastError: Error | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const result = await createDeployKey(
            token,
            deploymentName,
            keyName,
            fetchFnRef.current,
          );

          setCliDeployKey(result.key);
          keyDeploymentRef.current = deploymentName;

          // Persist the key to localStorage
          await saveDeploymentKey(deploymentName, result.key, {
            projectId: deployment?.projectId,
            teamId: teamId ?? undefined,
          });

          console.log(
            `[DeploymentContext] Deploy key regenerated and saved for ${deploymentName}`,
          );
          generatingKeyRef.current = null;
          return;
        } catch (attemptError) {
          lastError =
            attemptError instanceof Error
              ? attemptError
              : new Error(String(attemptError));
          console.warn(
            `[DeploymentContext] Deploy key generation attempt ${attempt + 1} failed:`,
            attemptError,
          );

          if (attempt < 2) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * Math.pow(2, attempt)),
            );
          }
        }
      }

      throw (
        lastError || new Error("Failed to regenerate deploy key after retries")
      );
    } catch (error) {
      console.error(
        `[DeploymentContext] Failed to regenerate deploy key:`,
        error,
      );

      try {
        const oauthToken = getOAuthTokenFromStorage();
        const tokenExpired = isOAuthTokenExpired();

        if (oauthToken && !tokenExpired) {
          console.log(
            `[DeploymentContext] Using OAuth token as fallback after regeneration failure`,
          );
          setCliDeployKey(oauthToken);
          keyDeploymentRef.current = deploymentName;
          setCliDeployKeyError(null);
          generatingKeyRef.current = null;
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
      generatingKeyRef.current = null;
    } finally {
      setCliDeployKeyLoading(false);
    }
  }, [deployment?.name, deployment?.projectId, accessToken, teamId]);

  const setManualDeployKey = useCallback(
    async (key: string, targetDeploymentName?: string) => {
      const deploymentName = targetDeploymentName || deployment?.name;
      if (!deploymentName) {
        setCliDeployKeyError("No deployment selected");
        return;
      }

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
        setCliDeployKey(key);
        keyDeploymentRef.current = deploymentName;
        setCliDeployKeyError(null);
        setCliDeployKeyIsManual(true);

        // Persist the key to localStorage
        await saveDeploymentKey(deploymentName, key, {
          projectId: deployment?.projectId,
          teamId: teamId ?? undefined,
        });

        console.log(
          `[DeploymentContext] Manual deploy key set and saved for ${deploymentName}`,
        );
      } catch (error) {
        console.error(
          `[DeploymentContext] Failed to set manual deploy key:`,
          error,
        );
        setCliDeployKeyError(
          error instanceof Error ? error.message : "Failed to set deploy key",
        );
      }
    },
    [deployment?.name, deployment?.projectId, teamId],
  );

  const clearManualDeployKey = useCallback(async () => {
    const deploymentName = deployment?.name;
    if (!deploymentName) {
      return;
    }

    try {
      setCliDeployKey(null);
      keyDeploymentRef.current = null;
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
      accessToken: accessToken ?? null,
      fetchFn,
      useMockData,
      adminClient,
      httpClient,
      teamId,
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
      accessToken,
      fetchFn,
      useMockData,
      adminClient,
      httpClient,
      teamId,
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
    return {
      deployment: null,
      deploymentUrl: null,
      authToken: null,
      accessToken: null,
      fetchFn: fetch,
      useMockData: true,
      adminClient: null,
      httpClient: null,
      teamId: null,
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
