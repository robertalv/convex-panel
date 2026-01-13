import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY =
  process.env.EXPO_PUBLIC_ACCESS_TOKEN_KEY || "convex_access_token";
const REFRESH_TOKEN_KEY =
  process.env.EXPO_PUBLIC_REFRESH_TOKEN_KEY || "convex_refresh_token";
const SESSION_KEY = process.env.EXPO_PUBLIC_SESSION_KEY || "convex_session";

// Validate that keys meet SecureStore requirements
if (!ACCESS_TOKEN_KEY || !REFRESH_TOKEN_KEY || !SESSION_KEY) {
  throw new Error("SecureStore keys must not be empty");
}

const SECURE_STORE_KEY_REGEX = /^[a-zA-Z0-9._-]+$/;
[ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, SESSION_KEY].forEach((key) => {
  if (!SECURE_STORE_KEY_REGEX.test(key)) {
    throw new Error(
      `Invalid SecureStore key: "${key}". Keys must contain only alphanumeric characters, ".", "-", and "_"`,
    );
  }
});

/**
 * Save access token securely
 */
export async function saveAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

/**
 * Load access token from secure storage
 */
export async function loadAccessToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

/**
 * Delete access token
 */
export async function clearAccessToken(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}

/**
 * Save refresh token securely
 */
export async function saveRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

/**
 * Load refresh token from secure storage
 */
export async function loadRefreshToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

/**
 * Delete refresh token
 */
export async function clearRefreshToken(): Promise<void> {
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

/**
 * Save entire session object
 */
export async function saveSession(session: object): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

/**
 * Load session object
 */
export async function loadSession<T = any>(): Promise<T | null> {
  const sessionStr = await SecureStore.getItemAsync(SESSION_KEY);
  if (!sessionStr) return null;

  try {
    return JSON.parse(sessionStr) as T;
  } catch (error) {
    console.error("Failed to parse session:", error);
    return null;
  }
}

/**
 * Clear all stored session data
 */
export async function clearAllSession(): Promise<void> {
  await Promise.all([
    clearAccessToken(),
    clearRefreshToken(),
    SecureStore.deleteItemAsync(SESSION_KEY),
  ]);
}
