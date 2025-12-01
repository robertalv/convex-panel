/**
 * Utility to check if the current environment is development
 */
export const isDevelopment = (): boolean => {
  // Check browser environment for development indicators
  if (typeof window !== 'undefined') {
    // Next.js development indicator
    try {
      // @ts-ignore - __NEXT_DATA__ is available in Next.js
      if (window.__NEXT_DATA__) {
        // @ts-ignore
        const nextData = window.__NEXT_DATA__;
        // @ts-ignore
        if (nextData.dev !== undefined) {
          // @ts-ignore
          return nextData.dev === true;
        }
      }
    } catch (e) {
      // Ignore if __NEXT_DATA__ is not available
    }

    // Check for localhost/127.0.0.1 which typically indicates development
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') {
      // Additional check: if not explicitly production, assume development
      try {
        if (typeof process !== 'undefined' && process.env) {
          const nodeEnv = process.env.NODE_ENV;
          // Only return false if explicitly production
          if (nodeEnv === 'production') return false;
        }
      } catch (e) {
        // Ignore process.env errors
      }
      // On localhost without explicit production flag, assume development
      return true;
    }
  }

  // Try Vite style
  try {
    // @ts-ignore - import.meta.env is available in Vite
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      if (import.meta.env.DEV !== undefined) {
        // @ts-ignore
        return import.meta.env.DEV === true;
      }
      // @ts-ignore
      if (import.meta.env.MODE !== undefined) {
        // @ts-ignore
        return import.meta.env.MODE === 'development';
      }
    }
  } catch (e) {
    // Ignore if import.meta is not defined
  }

  // Try Node.js style (Next.js, Remix, TanStack Start, Webpack, etc.)
  try {
    if (typeof process !== 'undefined' && process.env) {
      const nodeEnv = process.env.NODE_ENV;
      if (nodeEnv === 'development') return true;
      if (nodeEnv === 'production') return false;
    }
  } catch (e) {
    // Ignore if process is not defined
  }

  return false;
};

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
  return provided || getEnvVar('CONVEX_URL');
};

/**
 * Get OAuth config from environment variables
 */
export const getOAuthConfigFromEnv = (): {
  clientId: string;
  redirectUri: string;
  tokenExchangeUrl?: string;
} | undefined => {
  const clientId = getEnvVar('OAUTH_CLIENT_ID');
  
  if (!clientId) return undefined;

  const redirectUri = typeof window !== 'undefined' 
    ? (window.location.pathname === '/' 
        ? window.location.origin 
        : window.location.origin + window.location.pathname)
    : 'http://localhost:3000';

  const tokenExchangeUrl = getEnvVar('CONVEX_TOKEN_EXCHANGE_URL');

  return {
    clientId,
    redirectUri,
    ...(tokenExchangeUrl && { tokenExchangeUrl }),
  };
};

