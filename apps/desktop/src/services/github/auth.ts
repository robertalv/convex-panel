/**
 * GitHub OAuth Device Flow Authentication
 *
 * Handles authentication with GitHub using the Device Flow,
 * which is ideal for desktop applications.
 *
 * Flow:
 * 1. Call initiateDeviceFlow() - returns user_code and verification_uri
 * 2. User visits verification_uri and enters user_code
 * 3. App polls pollForToken() until user completes auth
 * 4. Token is stored securely in system keyring
 */

import type {
  DeviceCodeResponse,
  TokenPollResponse,
  GitHubUser,
} from "./types";

// Storage keys for keyring
const GITHUB_TOKEN_KEY = "github_access_token";
const GITHUB_USER_KEY = "github_user";
const DEVICE_ID_KEY = "device_id";

// API base URL - will be api.convexpanel.dev in production
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Generate or retrieve a unique device ID
 */
export async function getDeviceId(): Promise<string> {
  if (typeof localStorage !== "undefined") {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) {
      return existing;
    }
  }

  // Generate a new UUID
  const deviceId = crypto.randomUUID();
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Initiate GitHub Device Flow
 * Returns the user_code and verification_uri for the user
 */
export async function initiateDeviceFlow(
  scope = "repo read:user",
): Promise<DeviceCodeResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/github/device/code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ scope }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Failed to initiate device flow" }));
    throw new Error(error.error || "Failed to initiate device flow");
  }

  return response.json();
}

/**
 * Poll for the access token during device flow
 * Returns the token if authorization is complete, or throws if pending/error
 */
export async function pollForToken(
  deviceCode: string,
): Promise<TokenPollResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/github/device/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ device_code: deviceCode }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Failed to poll for token" }));
    throw new Error(error.error || "Failed to poll for token");
  }

  return response.json();
}

/**
 * Store the GitHub token securely
 */
export async function storeToken(token: string): Promise<void> {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(GITHUB_TOKEN_KEY, token);
    console.log("[GitHub Auth] Token stored");
  }
}

/**
 * Retrieve the stored GitHub token
 */
export async function getStoredToken(): Promise<string | null> {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(GITHUB_TOKEN_KEY);
}

/**
 * Delete the stored GitHub token (logout)
 */
export async function deleteToken(): Promise<void> {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(GITHUB_TOKEN_KEY);
    localStorage.removeItem(GITHUB_USER_KEY);
  }
}

/**
 * Store user info locally
 */
export async function storeUser(user: GitHubUser): Promise<void> {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(GITHUB_USER_KEY, JSON.stringify(user));
  }
}

/**
 * Get stored user info
 */
export async function getStoredUser(): Promise<GitHubUser | null> {
  if (typeof localStorage === "undefined") return null;

  try {
    const userJson = localStorage.getItem(GITHUB_USER_KEY);
    if (userJson) {
      return JSON.parse(userJson);
    }
  } catch (e) {
    console.error("Failed to get stored user:", e);
  }
  return null;
}

/**
 * Fetch the authenticated user from GitHub
 */
export async function fetchGitHubUser(token: string): Promise<GitHubUser> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Token expired or invalid");
    }
    throw new Error("Failed to fetch user");
  }

  return response.json();
}

/**
 * Revoke the GitHub token
 */
export async function revokeToken(token: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/v1/github/token/revoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ access_token: token }),
    });
  } catch (e) {
    // Don't fail logout if revocation fails
    console.error("Failed to revoke token:", e);
  }
}

/**
 * Complete device flow: poll for token, store it, fetch user
 *
 * @param deviceCode - The device_code from initiateDeviceFlow
 * @param interval - Polling interval in seconds
 * @param onPending - Callback when authorization is still pending
 * @param signal - AbortSignal to cancel polling
 */
export async function completeDeviceFlow(
  deviceCode: string,
  interval: number,
  onPending?: () => void,
  signal?: AbortSignal,
): Promise<{ token: string; user: GitHubUser }> {
  let pollInterval = interval * 1000; // Convert to ms

  while (!signal?.aborted) {
    await new Promise((resolve) => setTimeout(resolve, pollInterval));

    if (signal?.aborted) {
      throw new Error("Authentication cancelled");
    }

    const result = await pollForToken(deviceCode);

    if (result.access_token) {
      // Success! Store token and fetch user
      await storeToken(result.access_token);
      const user = await fetchGitHubUser(result.access_token);
      await storeUser(user);
      return { token: result.access_token, user };
    }

    if (result.error === "authorization_pending") {
      onPending?.();
      continue;
    }

    if (result.error === "slow_down") {
      // Increase polling interval
      pollInterval = (result.interval || 10) * 1000;
      continue;
    }

    if (result.error === "expired_token") {
      throw new Error("Device code expired. Please try again.");
    }

    if (result.error === "access_denied") {
      throw new Error("Access denied by user.");
    }

    throw new Error(
      result.error_description || result.error || "Unknown error",
    );
  }

  throw new Error("Authentication cancelled");
}

/**
 * Check if we have a valid stored token
 */
export async function checkAuth(): Promise<{
  token: string;
  user: GitHubUser;
} | null> {
  const token = await getStoredToken();
  if (!token) {
    return null;
  }

  try {
    // Verify token is still valid by fetching user
    const user = await fetchGitHubUser(token);
    await storeUser(user);
    return { token, user };
  } catch (e) {
    // Token is invalid, clean up
    await deleteToken();
    return null;
  }
}

/**
 * Full logout: revoke token and delete stored data
 */
export async function logout(): Promise<void> {
  const token = await getStoredToken();
  if (token) {
    await revokeToken(token);
  }
  await deleteToken();
}
