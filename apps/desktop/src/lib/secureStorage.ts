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

/**
 * Get the storage key for a deployment's cached deploy key
 */
function getDeploymentKeyName(deploymentName: string): string {
  return `${NAMESPACE}.deploymentKey.${deploymentName}`;
}

/**
 * Save a deploy key for a specific deployment
 */
export async function saveDeploymentKey(
  deploymentName: string,
  key: string | null,
): Promise<void> {
  const storageKey = getDeploymentKeyName(deploymentName);

  if (!key) {
    await clearDeploymentKey(deploymentName);
    return;
  }

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(storageKey, key);
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

  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(storageKey);
  }
}

/**
 * Get all cached deployment keys from localStorage
 * Returns a map of deployment name -> masked key preview
 */
export async function listCachedDeploymentKeys(): Promise<
  Array<{ deploymentName: string; keyPreview: string }>
> {
  const results: Array<{ deploymentName: string; keyPreview: string }> = [];
  const prefix = `${NAMESPACE}.deploymentKey.`;

  if (typeof localStorage !== "undefined") {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const deploymentName = key.substring(prefix.length);
        const value = localStorage.getItem(key);
        if (value) {
          // Create a preview: show first part before | and mask the rest
          const pipeIndex = value.indexOf("|");
          const keyPreview =
            pipeIndex > 0
              ? `${value.substring(0, Math.min(pipeIndex + 5, value.length))}...`
              : `${value.substring(0, 20)}...`;
          results.push({ deploymentName, keyPreview });
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
 */
export function isOAuthTokenExpired(): boolean {
  if (typeof localStorage === "undefined") return true;

  try {
    const oauthData = localStorage.getItem("convex-panel:oauth-token");
    if (oauthData) {
      const parsed = JSON.parse(oauthData);
      const expiresAt = parsed.expires_at;
      if (expiresAt) {
        // Add 5 minute buffer before actual expiration
        return Date.now() >= expiresAt - 5 * 60 * 1000;
      }
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
    const oauthData = localStorage.getItem("convex-panel:oauth-token");
    if (oauthData) {
      const parsed = JSON.parse(oauthData);
      const expiresAt = parsed.expires_at;
      const isExpired = expiresAt
        ? Date.now() >= expiresAt - 5 * 60 * 1000
        : true;
      return { hasToken: true, isExpired, expiresAt };
    }
  } catch (err) {
    console.warn("[secureStorage] Failed to get OAuth token metadata:", err);
  }

  return { hasToken: false, isExpired: true };
}
