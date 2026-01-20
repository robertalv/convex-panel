// WORKAROUND: macOS Keychain has persistent decryption errors
// All functions now use localStorage only

const NAMESPACE = "convex-desktop";
const ACCESS_KEY = `${NAMESPACE}.accessToken`;
const DEPLOY_KEY = `${NAMESPACE}.deployKey`;

export async function saveAccessToken(token: string | null): Promise<void> {
  if (!token) {
    await clearAccessToken();
    return;
  }
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(ACCESS_KEY, token);
  }
}

export async function loadAccessToken(): Promise<string | null> {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export async function clearAccessToken(): Promise<void> {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(ACCESS_KEY);
  }
}

export async function saveDeployKey(key: string | null): Promise<void> {
  if (!key) {
    await clearDeployKey();
    return;
  }
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(DEPLOY_KEY, key);
  }
}

export async function loadDeployKey(): Promise<string | null> {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(DEPLOY_KEY);
}

export async function clearDeployKey(): Promise<void> {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(DEPLOY_KEY);
  }
}

export const secureKeys = {
  access: ACCESS_KEY,
  deploy: DEPLOY_KEY,
};

// ============================================================================
// Per-deployment deploy key caching
// These keys are auto-generated via OAuth and cached per deployment
// ============================================================================

export interface CachedDeploymentKeyMetadata {
  deploymentName: string;
  projectId?: number;
  teamId?: number;
  createdAt: number;
}

/**
 * Get the storage key for a deployment's cached deploy key
 */
function getDeploymentKeyName(deploymentName: string): string {
  return `${NAMESPACE}.deploymentKey.${deploymentName}`;
}

/**
 * Get the storage key for deployment key metadata
 */
function getDeploymentKeyMetadataName(deploymentName: string): string {
  return `${NAMESPACE}.deploymentKeyMeta.${deploymentName}`;
}

/**
 * Save a deploy key for a specific deployment with metadata
 */
export async function saveDeploymentKey(
  deploymentName: string,
  key: string | null,
  metadata?: { projectId?: number; teamId?: number },
): Promise<void> {
  const storageKey = getDeploymentKeyName(deploymentName);
  const metadataKey = getDeploymentKeyMetadataName(deploymentName);

  if (!key) {
    await clearDeploymentKey(deploymentName);
    return;
  }

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(storageKey, key);

    // Save metadata
    const meta: CachedDeploymentKeyMetadata = {
      deploymentName,
      projectId: metadata?.projectId,
      teamId: metadata?.teamId,
      createdAt: Date.now(),
    };
    localStorage.setItem(metadataKey, JSON.stringify(meta));

    console.log(
      `[secureStorage] Saved deploy key for ${deploymentName} to localStorage`,
    );
  }
}

/**
 * Load a cached deploy key for a specific deployment
 */
export async function loadDeploymentKey(
  deploymentName: string,
): Promise<string | null> {
  const storageKey = getDeploymentKeyName(deploymentName);

  if (typeof localStorage === "undefined") return null;

  const key = localStorage.getItem(storageKey);
  if (key) {
    console.log(
      `[secureStorage] Loaded cached deploy key for ${deploymentName} from localStorage`,
    );
  }
  return key;
}

/**
 * Clear a cached deploy key for a specific deployment
 */
export async function clearDeploymentKey(
  deploymentName: string,
): Promise<void> {
  const storageKey = getDeploymentKeyName(deploymentName);
  const metadataKey = getDeploymentKeyMetadataName(deploymentName);

  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(metadataKey);
  }
}

/**
 * Get metadata for a cached deployment key
 */
export async function getDeploymentKeyMetadata(
  deploymentName: string,
): Promise<CachedDeploymentKeyMetadata | null> {
  const metadataKey = getDeploymentKeyMetadataName(deploymentName);

  if (typeof localStorage === "undefined") return null;

  const metadata = localStorage.getItem(metadataKey);
  if (!metadata) return null;

  try {
    return JSON.parse(metadata) as CachedDeploymentKeyMetadata;
  } catch {
    return null;
  }
}

/**
 * Get all cached deployment keys from localStorage
 * Returns a map of deployment name -> masked key preview with metadata
 */
export async function listCachedDeploymentKeys(projectId?: number): Promise<
  Array<{
    deploymentName: string;
    keyPreview: string;
    projectId?: number;
    teamId?: number;
  }>
> {
  const results: Array<{
    deploymentName: string;
    keyPreview: string;
    projectId?: number;
    teamId?: number;
  }> = [];
  const prefix = `${NAMESPACE}.deploymentKey.`;

  if (typeof localStorage !== "undefined") {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix) && !key.includes("Meta")) {
        const deploymentName = key.substring(prefix.length);
        const value = localStorage.getItem(key);
        const metadata = await getDeploymentKeyMetadata(deploymentName);

        // Filter by projectId if provided
        if (projectId !== undefined && metadata?.projectId !== projectId) {
          continue;
        }

        if (value) {
          // Create a preview: show first part before | and mask the rest
          const pipeIndex = value.indexOf("|");
          const keyPreview =
            pipeIndex > 0
              ? `${value.substring(0, Math.min(pipeIndex + 5, value.length))}...`
              : `${value.substring(0, 20)}...`;
          results.push({
            deploymentName,
            keyPreview,
            projectId: metadata?.projectId,
            teamId: metadata?.teamId,
          });
        }
      }
    }
  }

  return results;
}

// ============================================================================
// OAuth token helpers for credential fallback
// ============================================================================

/**
 * Get OAuth access token from localStorage
 * This token can be used as a fallback when deploy key generation fails
 */
export function getOAuthTokenFromStorage(): string | null {
  if (typeof localStorage === "undefined") return null;

  try {
    // Try to get the token from the standard access token key
    const accessToken = localStorage.getItem(ACCESS_KEY);
    if (accessToken) {
      return accessToken;
    }

    // Fallback: try the old oauth-token key for backward compatibility
    const oauthData = localStorage.getItem("convex-panel:oauth-token");
    if (oauthData) {
      const parsed = JSON.parse(oauthData);
      return parsed.access_token || parsed.accessToken || null;
    }
  } catch (err) {
    console.warn("[secureStorage] Failed to read OAuth token:", err);
  }

  return null;
}

/**
 * Check if OAuth token is expired
 * Note: Since tokens are not stored with expiration info in this app,
 * we assume they're valid if they exist
 */
export function isOAuthTokenExpired(): boolean {
  if (typeof localStorage === "undefined") return true;

  try {
    // If we have an access token, assume it's valid
    // The backend will reject it if it's expired
    const accessToken = localStorage.getItem(ACCESS_KEY);
    if (accessToken) {
      return false;
    }

    // Fallback: check old oauth-token format
    const oauthData = localStorage.getItem("convex-panel:oauth-token");
    if (oauthData) {
      const parsed = JSON.parse(oauthData);
      const expiresAt = parsed.expires_at;
      if (expiresAt) {
        // Add 5 minute buffer before actual expiration
        return Date.now() >= expiresAt - 5 * 60 * 1000;
      }
      // If no expiration info, assume valid
      return false;
    }
  } catch (err) {
    console.warn(
      "[secureStorage] Failed to check OAuth token expiration:",
      err,
    );
  }

  return true;
}

/**
 * Get OAuth token metadata
 */
export function getOAuthTokenMetadata(): {
  hasToken: boolean;
  isExpired: boolean;
  expiresAt?: number;
} {
  if (typeof localStorage === "undefined") {
    return { hasToken: false, isExpired: true };
  }

  try {
    // Check for access token first
    const accessToken = localStorage.getItem(ACCESS_KEY);
    if (accessToken) {
      // No expiration tracking for standard access tokens in this app
      return { hasToken: true, isExpired: false };
    }

    // Fallback: check old oauth-token format
    const oauthData = localStorage.getItem("convex-panel:oauth-token");
    if (oauthData) {
      const parsed = JSON.parse(oauthData);
      const expiresAt = parsed.expires_at;
      const isExpired = expiresAt
        ? Date.now() >= expiresAt - 5 * 60 * 1000
        : false;
      return { hasToken: true, isExpired, expiresAt };
    }
  } catch (err) {
    console.warn("[secureStorage] Failed to get OAuth token metadata:", err);
  }

  return { hasToken: false, isExpired: true };
}

// ============================================================================
// Deploy Key Auth Config (for direct deploy key login mode)
// ============================================================================

const DEPLOY_KEY_AUTH_CONFIG = `${NAMESPACE}.deployKeyAuthConfig`;
const AUTH_MODE_KEY = `${NAMESPACE}.authMode`;

export type AuthMode = "oauth" | "deployKey";

/**
 * Deploy key auth configuration for direct login mode
 */
export interface DeployKeyAuthConfig {
  deployKey: string;
  deploymentUrl: string;
  deploymentName: string;
}

/**
 * Save the current auth mode
 */
export async function saveAuthMode(mode: AuthMode): Promise<void> {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(AUTH_MODE_KEY, mode);
    console.log(`[secureStorage] Saved auth mode: ${mode}`);
  }
}

/**
 * Load the current auth mode
 */
export async function loadAuthMode(): Promise<AuthMode | null> {
  if (typeof localStorage === "undefined") return null;
  const mode = localStorage.getItem(AUTH_MODE_KEY);
  return mode as AuthMode | null;
}

/**
 * Clear the auth mode
 */
export async function clearAuthMode(): Promise<void> {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(AUTH_MODE_KEY);
  }
}

/**
 * Save deploy key auth configuration for direct login mode
 */
export async function saveDeployKeyAuthConfig(
  config: DeployKeyAuthConfig | null,
): Promise<void> {
  if (!config) {
    await clearDeployKeyAuthConfig();
    return;
  }

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(DEPLOY_KEY_AUTH_CONFIG, JSON.stringify(config));
    console.log(
      `[secureStorage] Saved deploy key auth config for ${config.deploymentName}`,
    );
  }
}

/**
 * Load deploy key auth configuration
 */
export async function loadDeployKeyAuthConfig(): Promise<DeployKeyAuthConfig | null> {
  if (typeof localStorage === "undefined") return null;

  const data = localStorage.getItem(DEPLOY_KEY_AUTH_CONFIG);
  if (!data) return null;

  try {
    return JSON.parse(data) as DeployKeyAuthConfig;
  } catch {
    console.warn("[secureStorage] Failed to parse deploy key auth config");
    return null;
  }
}

/**
 * Clear deploy key auth configuration
 */
export async function clearDeployKeyAuthConfig(): Promise<void> {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(DEPLOY_KEY_AUTH_CONFIG);
  }
}

/**
 * Clear all auth data (for full logout)
 */
export async function clearAllAuthData(): Promise<void> {
  await clearAccessToken();
  await clearDeployKey();
  await clearDeployKeyAuthConfig();
  await clearAuthMode();
}
