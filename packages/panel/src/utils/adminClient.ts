/**
 * Utility functions for working with Convex admin clients
 */

const OAUTH_TOKEN_STORAGE_KEY = 'convex-panel-oauth-token';

export interface AdminClientInfo {
  deploymentUrl: string | null;
  adminKey: string | null;
}

/**
 * Extract deployment URL from an admin client
 * Tries multiple possible property names where ConvexClient might store the URL
 * Also checks _client property for React client wrappers
 */
export function getDeploymentUrl(adminClient: any): string | null {
  if (!adminClient) return null;
  
  // Check direct properties first
  const directUrl = 
    (adminClient as any).address || 
    (adminClient as any)._baseUrl || 
    (adminClient as any).baseUrl ||
    (adminClient as any).url;
  
  if (directUrl) return directUrl;
  
  // Check _client property (React client wrapper)
  const client = (adminClient as any)._client;
  if (client) {
    const clientUrl =
      client.address ||
      client._baseUrl ||
      client.baseUrl ||
      client.url ||
      client?._httpClient?.baseURL;
    if (clientUrl) return clientUrl;
  }
  
  // Check _httpClient property
  const httpClient = (adminClient as any)._httpClient;
  if (httpClient?.baseURL) {
    return httpClient.baseURL;
  }
  
  return null;
}

/**
 * Get admin key from localStorage (OAuth token) or from adminClient
 * Priority: localStorage OAuth token > adminClient internal properties
 */
export function getAdminKey(adminClient?: any): string | null {
  // Prefer explicit admin auth on the admin client (usually deployKey)
  if (adminClient) {
    const fromClient =
      (adminClient as any)._adminAuth || (adminClient as any)._adminKey;
    if (fromClient) {
      return fromClient;
    }
  }

  // Fallback: try to get from localStorage (OAuth token)
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedToken = window.localStorage.getItem(OAUTH_TOKEN_STORAGE_KEY);
      if (storedToken) {
        const token = JSON.parse(storedToken);
        if (token.access_token) {
          return token.access_token;
        }
      }
    }
  } catch (e) {
    console.error('Failed to get token from localStorage:', e);
  }

  // Fallback: try common environment variables (Next.js / Node)
  try {
    const maybeProcess: any = typeof process !== 'undefined' ? process : null;
    if (maybeProcess?.env?.CONVEX_ACCESS_TOKEN) {
      return maybeProcess.env.CONVEX_ACCESS_TOKEN as string;
    }
  } catch {
    // Ignore env access errors
  }

  // Skip import.meta for Next.js to avoid webpack warnings
  // Check if we're in Next.js first
  const isNext = (() => {
    if (typeof window !== 'undefined') {
      try {
        // @ts-ignore
        if ((window as any).__NEXT_DATA__) return true;
      } catch {}
    }
    try {
      if (typeof process !== 'undefined' && process.env?.NEXT_RUNTIME) return true;
    } catch {}
    return false;
  })();

  // Try process.env for VITE_ prefixed vars (works in both)
  try {
    if (typeof process !== 'undefined' && process.env) {
      const viteToken = process.env.VITE_CONVEX_ACCESS_TOKEN;
      if (viteToken) return viteToken;
    }
  } catch {
    // Ignore
  }

  // Only try import.meta if NOT in Next.js (to avoid webpack warnings)
  if (!isNext) {
    try {
      // Direct access for Vite - webpack won't analyze this if isNext is true at build time
      // @ts-ignore - import.meta.env is available in Vite
      if (typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined') {
        // @ts-ignore
        const token = import.meta.env.VITE_CONVEX_ACCESS_TOKEN || import.meta.env.CONVEX_ACCESS_TOKEN;
        if (token) return token;
      }
    } catch {
      // Ignore
    }
  }

  return null;
}

/**
 * Get both deployment URL and admin key from adminClient
 * This is the main utility function to use when you need both values
 * @param adminClient - The admin client instance
 * @param providedDeploymentUrl - Optional deployment URL passed as prop (takes priority)
 */
export function getAdminClientInfo(adminClient: any, providedDeploymentUrl?: string): AdminClientInfo {
  return {
    deploymentUrl: providedDeploymentUrl || getDeploymentUrl(adminClient),
    adminKey: getAdminKey(adminClient),
  };
}
