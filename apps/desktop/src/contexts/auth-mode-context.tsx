import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  type AuthMode,
  type DeployKeyAuthConfig,
  loadAuthMode,
  loadDeployKeyAuthConfig,
  saveAuthMode,
  saveDeployKeyAuthConfig,
  clearAllAuthData,
} from "../lib/secureStorage";
import { getHttpActionsUrl } from "../lib/deployKeyAuth";

interface AuthModeContextValue {
  /** Current auth mode: oauth or deployKey */
  authMode: AuthMode | null;
  /** Whether auth state is still loading from storage */
  isLoading: boolean;
  /** Whether user is authenticated via deploy key */
  isDeployKeyMode: boolean;
  /** Deploy key configuration (only set in deployKey mode) */
  deployKeyConfig: DeployKeyAuthConfig | null;
  /** HTTP Actions URL (derived from deployment URL) */
  httpActionsUrl: string | null;
  /** Set auth mode to OAuth */
  setOAuthMode: () => Promise<void>;
  /** Set auth mode to deploy key with config */
  setDeployKeyMode: (config: DeployKeyAuthConfig) => Promise<void>;
  /** Clear all auth data and reset to initial state */
  clearAuth: () => Promise<void>;
}

const AuthModeContext = createContext<AuthModeContextValue | undefined>(
  undefined,
);

interface AuthModeProviderProps {
  children: ReactNode;
}

export function AuthModeProvider({ children }: AuthModeProviderProps) {
  const [authMode, setAuthModeState] = useState<AuthMode | null>(null);
  const [deployKeyConfig, setDeployKeyConfig] =
    useState<DeployKeyAuthConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state from storage on mount
  useEffect(() => {
    async function loadAuthState() {
      try {
        const [savedMode, savedConfig] = await Promise.all([
          loadAuthMode(),
          loadDeployKeyAuthConfig(),
        ]);

        if (savedMode) {
          setAuthModeState(savedMode);
        }

        if (savedConfig) {
          setDeployKeyConfig(savedConfig);
        }
      } catch (error) {
        console.error("[AuthModeContext] Failed to load auth state:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadAuthState();
  }, []);

  const setOAuthMode = useCallback(async () => {
    setAuthModeState("oauth");
    setDeployKeyConfig(null);
    await saveAuthMode("oauth");
    await saveDeployKeyAuthConfig(null);
    console.log("[AuthModeContext] Switched to OAuth mode");
  }, []);

  const setDeployKeyMode = useCallback(async (config: DeployKeyAuthConfig) => {
    setAuthModeState("deployKey");
    setDeployKeyConfig(config);
    await saveAuthMode("deployKey");
    await saveDeployKeyAuthConfig(config);
    console.log(
      `[AuthModeContext] Switched to deploy key mode for ${config.deploymentName}`,
    );
  }, []);

  const clearAuth = useCallback(async () => {
    setAuthModeState(null);
    setDeployKeyConfig(null);
    await clearAllAuthData();
    console.log("[AuthModeContext] Cleared all auth data");
  }, []);

  const isDeployKeyMode = authMode === "deployKey" && deployKeyConfig !== null;

  const httpActionsUrl = deployKeyConfig?.deploymentUrl
    ? getHttpActionsUrl(deployKeyConfig.deploymentUrl)
    : null;

  return (
    <AuthModeContext.Provider
      value={{
        authMode,
        isLoading,
        isDeployKeyMode,
        deployKeyConfig,
        httpActionsUrl,
        setOAuthMode,
        setDeployKeyMode,
        clearAuth,
      }}
    >
      {children}
    </AuthModeContext.Provider>
  );
}

/**
 * Hook to access auth mode context
 */
export function useAuthMode(): AuthModeContextValue {
  const context = useContext(AuthModeContext);
  if (context === undefined) {
    throw new Error("useAuthMode must be used within an AuthModeProvider");
  }
  return context;
}

/**
 * Hook to check if current auth mode is deploy key
 * Returns false if context is not available (for use in optional contexts)
 */
export function useIsDeployKeyMode(): boolean {
  const context = useContext(AuthModeContext);
  return context?.isDeployKeyMode ?? false;
}
