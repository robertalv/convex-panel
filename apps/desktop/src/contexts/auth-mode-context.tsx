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
  type SelfHostedAuthConfig,
  loadAuthMode,
  loadDeployKeyAuthConfig,
  loadSelfHostedAuthConfig,
  saveAuthMode,
  saveDeployKeyAuthConfig,
  saveSelfHostedAuthConfig,
  clearAllAuthData,
} from "../lib/secureStorage";
import { getHttpActionsUrl } from "../lib/deployKeyAuth";
import { invoke } from "@tauri-apps/api/core";

interface AuthModeContextValue {
  /** Current auth mode: oauth, deployKey, or selfHosted */
  authMode: AuthMode | null;
  /** Whether auth state is still loading from storage */
  isLoading: boolean;
  /** Whether user is authenticated via deploy key */
  isDeployKeyMode: boolean;
  /** Whether user is authenticated via self-hosted */
  isSelfHostedMode: boolean;
  /** Deploy key configuration (only set in deployKey mode) */
  deployKeyConfig: DeployKeyAuthConfig | null;
  /** Self-hosted configuration (only set in selfHosted mode) */
  selfHostedConfig: SelfHostedAuthConfig | null;
  /** HTTP Actions URL (derived from deployment URL) */
  httpActionsUrl: string | null;
  /** Set auth mode to OAuth */
  setOAuthMode: () => Promise<void>;
  /** Set auth mode to deploy key with config */
  setDeployKeyMode: (config: DeployKeyAuthConfig) => Promise<void>;
  /** Set auth mode to self-hosted with config */
  setSelfHostedMode: (config: SelfHostedAuthConfig) => Promise<void>;
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
  const [selfHostedConfig, setSelfHostedConfig] =
    useState<SelfHostedAuthConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state from storage on mount
  useEffect(() => {
    async function loadAuthState() {
      try {
        const [savedMode, savedDeployConfig, savedSelfHostedConfig] = await Promise.all([
          loadAuthMode(),
          loadDeployKeyAuthConfig(),
          loadSelfHostedAuthConfig(),
        ]);

        if (savedMode) {
          setAuthModeState(savedMode);
        }

        if (savedDeployConfig) {
          setDeployKeyConfig(savedDeployConfig);
        }

        if (savedSelfHostedConfig) {
          setSelfHostedConfig(savedSelfHostedConfig);
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
    setSelfHostedConfig(null);

    // Clear any self-hosted URLs
    try {
      const urls = await invoke<string[]>("get_self_hosted_urls");
      for (const url of urls) {
        await invoke("remove_self_hosted_url", { url });
      }
      console.log("[AuthModeContext] Cleared self-hosted URLs");
    } catch (error) {
      console.warn("[AuthModeContext] Failed to clear self-hosted URLs:", error);
    }

    await saveAuthMode("oauth");
    await saveDeployKeyAuthConfig(null);
    await saveSelfHostedAuthConfig(null);
    console.log("[AuthModeContext] Switched to OAuth mode");
  }, []);

  const setDeployKeyMode = useCallback(async (config: DeployKeyAuthConfig) => {
    setAuthModeState("deployKey");
    setDeployKeyConfig(config);
    setSelfHostedConfig(null);

    // Clear any self-hosted URLs
    try {
      const urls = await invoke<string[]>("get_self_hosted_urls");
      for (const url of urls) {
        await invoke("remove_self_hosted_url", { url });
      }
      console.log("[AuthModeContext] Cleared self-hosted URLs");
    } catch (error) {
      console.warn("[AuthModeContext] Failed to clear self-hosted URLs:", error);
    }

    await saveAuthMode("deployKey");
    await saveDeployKeyAuthConfig(config);
    await saveSelfHostedAuthConfig(null);
    console.log(
      `[AuthModeContext] Switched to deploy key mode for ${config.deploymentName}`,
    );
  }, []);

  const setSelfHostedMode = useCallback(async (config: SelfHostedAuthConfig) => {
    setAuthModeState("selfHosted");
    setDeployKeyConfig(null);
    setSelfHostedConfig(config);
    
    // Register the self-hosted URL with Tauri
    try {
      await invoke("add_self_hosted_url", { url: config.deploymentUrl });
      console.log(`[AuthModeContext] Registered self-hosted URL: ${config.deploymentUrl}`);
    } catch (error) {
      console.error("[AuthModeContext] Failed to register self-hosted URL:", error);
    }
    
    await saveAuthMode("selfHosted");
    await saveDeployKeyAuthConfig(null);
    await saveSelfHostedAuthConfig(config);
    console.log(
      `[AuthModeContext] Switched to self-hosted mode for ${config.deploymentName}`,
    );
  }, []);

  const clearAuth = useCallback(async () => {
    setAuthModeState(null);
    setDeployKeyConfig(null);
    setSelfHostedConfig(null);
    await clearAllAuthData();
    console.log("[AuthModeContext] Cleared all auth data");
  }, []);

  const isDeployKeyMode = authMode === "deployKey" && deployKeyConfig !== null;
  const isSelfHostedMode = authMode === "selfHosted" && selfHostedConfig !== null;

  const httpActionsUrl = deployKeyConfig?.deploymentUrl
    ? getHttpActionsUrl(deployKeyConfig.deploymentUrl)
    : selfHostedConfig?.deploymentUrl
    ? selfHostedConfig.deploymentUrl
    : null;

  return (
    <AuthModeContext.Provider
      value={{
        authMode,
        isLoading,
        isDeployKeyMode,
        isSelfHostedMode,
        deployKeyConfig,
        selfHostedConfig,
        httpActionsUrl,
        setOAuthMode,
        setDeployKeyMode,
        setSelfHostedMode,
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
