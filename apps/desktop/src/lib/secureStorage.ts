import { invoke } from "@tauri-apps/api/core";

const NAMESPACE = "convex-desktop";
const ACCESS_KEY = `${NAMESPACE}.accessToken`;
const DEPLOY_KEY = `${NAMESPACE}.deployKey`;

const isTauri = () =>
  typeof window !== "undefined" && Boolean((window as any).__TAURI_INTERNALS__);

export async function saveAccessToken(token: string | null): Promise<void> {
  if (!token) {
    await clearAccessToken();
    return;
  }
  if (isTauri()) {
    try {
      await invoke("set_secret", { key: ACCESS_KEY, value: token });
      return;
    } catch (err) {
      console.warn(
        "[secureStorage] Falling back to localStorage for access token:",
        err,
      );
    }
  }
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(ACCESS_KEY, token);
  }
}

export async function loadAccessToken(): Promise<string | null> {
  if (isTauri()) {
    try {
      return await invoke<string | null>("get_secret", { key: ACCESS_KEY });
    } catch (err) {
      console.warn(
        "[secureStorage] Failed to load access token from secure store:",
        err,
      );
    }
  }
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export async function clearAccessToken(): Promise<void> {
  if (isTauri()) {
    try {
      await invoke("delete_secret", { key: ACCESS_KEY });
    } catch (err) {
      console.warn("[secureStorage] Failed to clear access token:", err);
    }
  }
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(ACCESS_KEY);
  }
}

export async function saveDeployKey(key: string | null): Promise<void> {
  if (!key) {
    await clearDeployKey();
    return;
  }
  if (isTauri()) {
    try {
      await invoke("set_secret", { key: DEPLOY_KEY, value: key });
      return;
    } catch (err) {
      console.warn(
        "[secureStorage] Falling back to localStorage for deploy key:",
        err,
      );
    }
  }
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(DEPLOY_KEY, key);
  }
}

export async function loadDeployKey(): Promise<string | null> {
  if (isTauri()) {
    try {
      return await invoke<string | null>("get_secret", { key: DEPLOY_KEY });
    } catch (err) {
      console.warn(
        "[secureStorage] Failed to load deploy key from secure store:",
        err,
      );
    }
  }
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(DEPLOY_KEY);
}

export async function clearDeployKey(): Promise<void> {
  if (isTauri()) {
    try {
      await invoke("delete_secret", { key: DEPLOY_KEY });
    } catch (err) {
      console.warn("[secureStorage] Failed to clear deploy key:", err);
    }
  }
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

  if (isTauri()) {
    try {
      await invoke("set_secret", { key: storageKey, value: key });
      console.log(`[secureStorage] Saved deploy key for ${deploymentName}`);
      return;
    } catch (err) {
      console.warn(
        `[secureStorage] Falling back to localStorage for deployment key (${deploymentName}):`,
        err,
      );
    }
  }

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(storageKey, key);
  }
}

/**
 * Load a cached deploy key for a specific deployment
 */
export async function loadDeploymentKey(
  deploymentName: string,
): Promise<string | null> {
  const storageKey = getDeploymentKeyName(deploymentName);

  if (isTauri()) {
    try {
      const key = await invoke<string | null>("get_secret", {
        key: storageKey,
      });
      if (key) {
        console.log(
          `[secureStorage] Loaded cached deploy key for ${deploymentName}`,
        );
      }
      return key;
    } catch (err) {
      console.warn(
        `[secureStorage] Failed to load deployment key from secure store (${deploymentName}):`,
        err,
      );
    }
  }

  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(storageKey);
}

/**
 * Clear a cached deploy key for a specific deployment
 */
export async function clearDeploymentKey(
  deploymentName: string,
): Promise<void> {
  const storageKey = getDeploymentKeyName(deploymentName);

  if (isTauri()) {
    try {
      await invoke("delete_secret", { key: storageKey });
    } catch (err) {
      console.warn(
        `[secureStorage] Failed to clear deployment key (${deploymentName}):`,
        err,
      );
    }
  }

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
