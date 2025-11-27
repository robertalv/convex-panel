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
  return provided || getEnvVar('NEXT_PUBLIC_CONVEX_URL') || getEnvVar('VITE_CONVEX_URL');
};

/**
 * Get OAuth config from environment variables
 */
export const getOAuthConfigFromEnv = (): {
  clientId: string;
  redirectUri: string;
  scope?: 'team' | 'project';
  tokenExchangeUrl?: string;
} | undefined => {
  // Try multiple possible env var names for flexibility
  const clientId = getEnvVar('NEXT_PUBLIC_CONVEX_OAUTH_CLIENT_ID') || 
                   getEnvVar('VITE_CONVEX_OAUTH_CLIENT_ID') ||
                   getEnvVar('NEXT_PUBLIC_OAUTH_CLIENT_ID') ||
                   getEnvVar('VITE_OAUTH_CLIENT_ID');
  
  if (!clientId) return undefined;

  // Construct redirect URI - normalize to remove trailing slash if pathname is just "/"
  const redirectUri = typeof window !== 'undefined' 
    ? (window.location.pathname === '/' 
        ? window.location.origin 
        : window.location.origin + window.location.pathname)
    : 'http://localhost:3000';

  // Try multiple possible env var names for token exchange URL
  const tokenExchangeUrl = getEnvVar('NEXT_PUBLIC_CONVEX_TOKEN_EXCHANGE_URL') || 
                           getEnvVar('VITE_CONVEX_TOKEN_EXCHANGE_URL') ||
                           getEnvVar('NEXT_PUBLIC_TOKEN_EXCHANGE_URL') ||
                           getEnvVar('VITE_TOKEN_EXCHANGE_URL');
  
  // Debug logging (can be removed in production)
  if (typeof window !== 'undefined' && !tokenExchangeUrl) {
    // Check what's actually available in the environment
    const envCheck: any = {};
    try {
      // @ts-ignore - import.meta.env is available in Vite
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        // @ts-ignore
        envCheck.VITE_CONVEX_TOKEN_EXCHANGE_URL = import.meta.env.VITE_CONVEX_TOKEN_EXCHANGE_URL;
        // @ts-ignore
        envCheck.VITE_TOKEN_EXCHANGE_URL = import.meta.env.VITE_TOKEN_EXCHANGE_URL;
      }
    } catch (e) {
      // Ignore
    }
    
    console.warn(
      '[OAuth] tokenExchangeUrl not found. ' +
      'Tried: VITE_CONVEX_TOKEN_EXCHANGE_URL, NEXT_PUBLIC_CONVEX_TOKEN_EXCHANGE_URL, ' +
      'VITE_TOKEN_EXCHANGE_URL, NEXT_PUBLIC_TOKEN_EXCHANGE_URL. ' +
      '\nMake sure to add VITE_CONVEX_TOKEN_EXCHANGE_URL=http://localhost:3004/api/convex/exchange to your .env file (in project root or dev/ directory) and RESTART the dev server.',
      '\nCurrent env check:', envCheck
    );
  }

  const scope = (getEnvVar('NEXT_PUBLIC_CONVEX_OAUTH_SCOPE') || 
                getEnvVar('VITE_CONVEX_OAUTH_SCOPE') || 
                'project') as 'team' | 'project';

  return {
    clientId,
    redirectUri,
    scope,
    ...(tokenExchangeUrl && { tokenExchangeUrl }),
  };
};

