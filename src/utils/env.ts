/**
 * Utility to safely get environment variables in both Vite and Next.js
 */
export const getEnvVar = (name: string): string | undefined => {
  // Try Next.js style (process.env)
  try {
    if (typeof process !== 'undefined' && process.env) {
      const value = process.env[name];
      if (value) return value;
    }
  } catch (e) {
    // Ignore if process is not defined
  }

  // Try Vite style (import.meta.env)
  try {
    // @ts-ignore - import.meta.env is available in Vite
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // Try both VITE_ prefixed and original name
      const viteName = name.startsWith('VITE_') ? name : `VITE_${name}`;
      const nextName = name.startsWith('NEXT_PUBLIC_') ? name : `NEXT_PUBLIC_${name}`;
      
      // @ts-ignore - import.meta.env is available in Vite
      return import.meta.env[viteName] || import.meta.env[nextName] || import.meta.env[name];
    }
  } catch (e) {
    // Ignore if import.meta is not defined
  }

  return undefined;
};

/**
 * Get Convex URL from environment or provided value
 */
export const getConvexUrl = (provided?: string): string | undefined => {
  return provided || getEnvVar('VITE_CONVEX_URL');
};

/**
 * Get OAuth config from environment variables
 */
export const getOAuthConfigFromEnv = (): {
  clientId: string;
  redirectUri: string;
  tokenExchangeUrl?: string;
} | undefined => {
  const clientId = getEnvVar('VITE_OAUTH_CLIENT_ID');
  
  if (!clientId) return undefined;

  const redirectUri = typeof window !== 'undefined' 
    ? (window.location.pathname === '/' 
        ? window.location.origin 
        : window.location.origin + window.location.pathname)
    : 'http://localhost:3000';

  const tokenExchangeUrl = getEnvVar('VITE_CONVEX_TOKEN_EXCHANGE_URL');

  return {
    clientId,
    redirectUri,
    ...(tokenExchangeUrl && { tokenExchangeUrl }),
  };
};

