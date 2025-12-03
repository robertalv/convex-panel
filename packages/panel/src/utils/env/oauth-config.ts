/**
 * OAuth configuration utilities
 * Handles retrieving OAuth client ID and token exchange URL from various environment sources
 */

// Build-time injected variables (replaced at build time)
declare const __NEXT_PUBLIC_OAUTH_CLIENT_ID__: string | undefined;
declare const __NEXT_PUBLIC_CONVEX_TOKEN_EXCHANGE_URL__: string | undefined;
declare const __VITE_OAUTH_CLIENT_ID__: string | undefined;
declare const __VITE_CONVEX_TOKEN_EXCHANGE_URL__: string | undefined;

import { isNextJSEnv } from './platform';
import { getEnvVar } from './core';
import { CONVEX_PANEL_API_DOMAIN, ROUTES } from '../constants';

const DEFAULT_TOKEN_EXCHANGE_URL = `https://${CONVEX_PANEL_API_DOMAIN}${ROUTES.CONVEX_OAUTH}`;

/**
 * Get OAuth config from environment variables
 * Supports Next.js (NEXT_PUBLIC_*) and Vite (VITE_*) prefixes
 */
export const getOAuthConfigFromEnv = (): {
  clientId: string;
  redirectUri: string;
  tokenExchangeUrl?: string;
} | undefined => {
  let clientId: string | undefined;
  let envTokenExchangeUrl: string | undefined;
  
  // Check in order of priority:
  // 1. Build-time injected values (from webpack DefinePlugin for Next.js) - highest priority
  // 2. Direct process.env.NEXT_PUBLIC_* (Next.js) - ALWAYS check this first
  // 3. Direct process.env.VITE_* (Vite) - only if NEXT_PUBLIC_ not found
  // 4. getEnvVar() which checks all prefixes
  // 5. Non-prefixed process.env as final fallback
  
  // 1. Check build-time injected values first (highest priority)
  try {
    // Always check NEXT_PUBLIC_ build-time values first (Next.js)
    if (typeof __NEXT_PUBLIC_OAUTH_CLIENT_ID__ !== 'undefined' && __NEXT_PUBLIC_OAUTH_CLIENT_ID__) {
      const buildTimeClientId = String(__NEXT_PUBLIC_OAUTH_CLIENT_ID__).trim();
      if (buildTimeClientId) {
        clientId = buildTimeClientId;
      }
    }
    if (typeof __NEXT_PUBLIC_CONVEX_TOKEN_EXCHANGE_URL__ !== 'undefined' && __NEXT_PUBLIC_CONVEX_TOKEN_EXCHANGE_URL__) {
      const buildTimeTokenExchangeUrl = String(__NEXT_PUBLIC_CONVEX_TOKEN_EXCHANGE_URL__).trim();
      if (buildTimeTokenExchangeUrl) {
        envTokenExchangeUrl = buildTimeTokenExchangeUrl;
      }
    }
    
    // Check VITE_ build-time values as fallback (only if NEXT_PUBLIC_ not found)
    if (!clientId && typeof __VITE_OAUTH_CLIENT_ID__ !== 'undefined' && __VITE_OAUTH_CLIENT_ID__) {
      const buildTimeClientId = String(__VITE_OAUTH_CLIENT_ID__).trim();
      if (buildTimeClientId) {
        clientId = buildTimeClientId;
      }
    }
    if (!envTokenExchangeUrl && typeof __VITE_CONVEX_TOKEN_EXCHANGE_URL__ !== 'undefined' && __VITE_CONVEX_TOKEN_EXCHANGE_URL__) {
      const buildTimeTokenExchangeUrl = String(__VITE_CONVEX_TOKEN_EXCHANGE_URL__).trim();
      if (buildTimeTokenExchangeUrl) {
        envTokenExchangeUrl = buildTimeTokenExchangeUrl;
      }
    }
  } catch (e) {
    // Ignore if build-time values are not defined
  }
  
  // 2. Check process.env - ALWAYS check NEXT_PUBLIC_ first (works in Next.js)
  try {
    if (typeof process !== 'undefined' && process.env) {
      // Always check NEXT_PUBLIC_ prefix first (Next.js)
      if (!clientId) {
        clientId = process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID;
      }
      if (!envTokenExchangeUrl) {
        envTokenExchangeUrl = process.env.NEXT_PUBLIC_CONVEX_TOKEN_EXCHANGE_URL;
      }
      
      // Check VITE_ prefix as fallback (only if NEXT_PUBLIC_ not found)
      if (!clientId) {
        clientId = process.env.VITE_OAUTH_CLIENT_ID;
      }
      if (!envTokenExchangeUrl) {
        envTokenExchangeUrl = process.env.VITE_CONVEX_TOKEN_EXCHANGE_URL;
      }
      
      // Final fallback to non-prefixed versions
      if (!clientId) {
        clientId = process.env.OAUTH_CLIENT_ID;
      }
      if (!envTokenExchangeUrl) {
        envTokenExchangeUrl = process.env.CONVEX_TOKEN_EXCHANGE_URL;
      }
    }
  } catch (e) {
    // Ignore process.env access errors
  }
  
  // 3. Use getEnvVar which checks NEXT_PUBLIC_ and VITE_ prefixes
  if (!clientId) {
    clientId = getEnvVar('OAUTH_CLIENT_ID');
  }
  if (!envTokenExchangeUrl) {
    envTokenExchangeUrl = getEnvVar('CONVEX_TOKEN_EXCHANGE_URL');
  }
  
  if (!clientId) {
    // Debug: log what we found
    if (typeof window !== 'undefined') {
      let buildTimeClientId: any = undefined;
      let buildTimeViteClientId: any = undefined;
      try {
        buildTimeClientId = typeof __NEXT_PUBLIC_OAUTH_CLIENT_ID__ !== 'undefined' ? __NEXT_PUBLIC_OAUTH_CLIENT_ID__ : undefined;
      } catch (e) {
        // Ignore
      }
      try {
        buildTimeViteClientId = typeof __VITE_OAUTH_CLIENT_ID__ !== 'undefined' ? __VITE_OAUTH_CLIENT_ID__ : undefined;
      } catch (e) {
        // Ignore
      }
      
      const debugInfo = {
        isNext: isNextJSEnv(),
        hasProcess: typeof process !== 'undefined',
        hasProcessEnv: typeof process !== 'undefined' && !!process.env,
        nextPublicOAuthClientId: typeof process !== 'undefined' && process.env ? process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID : undefined,
        viteOAuthClientId: typeof process !== 'undefined' && process.env ? process.env.VITE_OAUTH_CLIENT_ID : undefined,
        oauthClientId: typeof process !== 'undefined' && process.env ? process.env.OAUTH_CLIENT_ID : undefined,
        buildTimeClientId: buildTimeClientId,
        buildTimeViteClientId: buildTimeViteClientId,
        allProcessEnvKeys: typeof process !== 'undefined' && process.env ? Object.keys(process.env).filter(k => k.includes('OAUTH') || k.includes('CONVEX') || k.includes('NEXT_PUBLIC') || k.includes('VITE_')).slice(0, 20).join(', ') : undefined,
      };
      
      console.warn('[ConvexPanel] OAuth client ID not found. Debug info:', debugInfo);
      console.warn('[ConvexPanel] Make sure NEXT_PUBLIC_OAUTH_CLIENT_ID or VITE_OAUTH_CLIENT_ID is set in your .env.local or .env file');
    }
    return undefined;
  }

  const redirectUri = typeof window !== 'undefined' 
    ? (window.location.pathname === '/' 
        ? window.location.origin 
        : window.location.origin + window.location.pathname)
    : 'http://localhost:3000';

  const tokenExchangeUrl = envTokenExchangeUrl || DEFAULT_TOKEN_EXCHANGE_URL;

  return {
    clientId,
    redirectUri,
    tokenExchangeUrl,
  };
};
