/**
 * OAuth 2.0 utilities for Convex authentication
 * Based on: https://docs.convex.dev/platform-apis/oauth-applications
 */

export type TokenScope = 'team' | 'project';

export interface OAuthConfig {
  clientId: string;
  clientSecret?: string; // Only needed for server-side token exchange
  redirectUri: string;
  scope?: TokenScope;
  tokenExchangeUrl?: string; // Optional: server-side endpoint to exchange code for token
}

export interface OAuthToken {
  access_token: string;
  token_type: 'bearer';
  expires_at?: number; // Optional expiration timestamp
}

const STORAGE_KEY = 'convex-panel-oauth-token';
const STATE_STORAGE_KEY = 'convex-panel-oauth-state';
const USED_CODE_STORAGE_KEY = 'convex-panel-oauth-used-codes';
const STATE_PAYLOAD_VERSION = 1;

const inFlightExchanges = new Map<string, Promise<OAuthToken | null>>();

interface OAuthStatePayload {
  v: number;
  nonce: string;
  pkce?: string;
  ts: number;
}

function encodeStatePayload(payload: OAuthStatePayload): string {
  const base64 = btoa(JSON.stringify(payload));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeStatePayload(state: string | null): OAuthStatePayload | null {
  if (!state) return null;

  try {
    let base64 = state.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    const json = atob(base64);
    const payload = JSON.parse(json) as OAuthStatePayload;
    if (payload && typeof payload === 'object' && payload.v === STATE_PAYLOAD_VERSION) {
      return payload;
    }
  } catch (err) {
    console.debug('[OAuth] State payload decode skipped (legacy format):', err);
  }

  return null;
}

/**
 * Generate a random state string for OAuth flow
 */
export function generateState(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate PKCE code verifier and challenge
 */
export async function generatePKCE(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  // Generate 32 random bytes and base64url encode
  const codeVerifier = btoa(
    String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  try {
    // Calculate SHA256 hash and base64url encode
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
    const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    return { codeVerifier, codeChallenge };
  } catch (e) {
    // Fallback if crypto.subtle not available (shouldn't happen in modern browsers)
    console.warn('PKCE SHA-256 not available, using plain code verifier');
    return { codeVerifier, codeChallenge: codeVerifier };
  }
}

/**
 * Build the Convex OAuth authorization URL
 */
export async function buildAuthorizationUrl(
  config: OAuthConfig,
  state?: string
): Promise<string> {
  console.debug('buildAuthorizationUrl called with:', {
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    scope: config.scope,
    state: state ? 'provided' : 'not provided',
  });

  const scope = config.scope || 'project';
  const baseUrl = `https://dashboard.convex.dev/oauth/authorize/${scope}`;
  console.debug('Base URL:', baseUrl);
  console.debug('Scope:', scope);
  
  const managesStateInternally = !state;
  const stateNonce = state || generateState();

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
  });

  console.debug('Initial params:', params.toString());

  let pkceCodeVerifier: string | undefined;

  // Add PKCE if available
  try {
    console.debug('Generating PKCE...');
    const pkce = await generatePKCE();
    console.debug('PKCE generated:', {
      codeVerifier: pkce.codeVerifier.substring(0, 20) + '...',
      codeChallenge: pkce.codeChallenge.substring(0, 20) + '...',
    });
    pkceCodeVerifier = pkce.codeVerifier;
    sessionStorage.setItem(`${STATE_STORAGE_KEY}-pkce`, pkce.codeVerifier);
    params.append('code_challenge', pkce.codeChallenge);
    params.append('code_challenge_method', 'S256');
    console.debug('PKCE added to params');
  } catch (e) {
    console.warn('PKCE not available, continuing without it:', e);
  }

  let finalState = stateNonce;
  if (managesStateInternally) {
    const payload: OAuthStatePayload = {
      v: STATE_PAYLOAD_VERSION,
      nonce: stateNonce,
      ts: Date.now(),
      ...(pkceCodeVerifier && { pkce: pkceCodeVerifier }),
    };
    finalState = encodeStatePayload(payload);
  }
  params.set('state', finalState);

  try {
    sessionStorage.setItem(STATE_STORAGE_KEY, finalState);
  } catch (err) {
    console.warn('Failed to store state in sessionStorage:', err);
  }

  const finalUrl = `${baseUrl}?${params.toString()}`;
  console.debug('Final authorization URL:', finalUrl);
  return finalUrl;
}

/**
 * Exchange authorization code for access token
 * 
 * Note: If tokenExchangeUrl is provided, it will use that server-side endpoint.
 * Otherwise, it will attempt to exchange directly (which may fail due to CORS).
 * For production, you should provide a server-side endpoint.
 */
export async function exchangeCodeForToken(
  code: string,
  config: OAuthConfig,
  codeVerifier?: string
): Promise<OAuthToken> {
  console.debug('exchangeCodeForToken called');
  console.debug('config:', {
    clientId: config.clientId,
    hasClientSecret: !!config.clientSecret,
    tokenExchangeUrl: config.tokenExchangeUrl,
  });

  // Warn if tokenExchangeUrl is missing (will fail with CORS)
  if (!config.tokenExchangeUrl) {
    console.warn(
      'tokenExchangeUrl is not set. ' +
      'Set VITE_CONVEX_TOKEN_EXCHANGE_URL or NEXT_PUBLIC_CONVEX_TOKEN_EXCHANGE_URL ' +
      'to your server-side token exchange endpoint (e.g., http://localhost:3004/api/convex/exchange). ' +
      'Direct token exchange from browser will fail due to CORS.'
    );
  }
  console.debug('code:', code.substring(0, 20) + '...');
  console.debug('hasCodeVerifier:', !!codeVerifier);

  // If a server-side token exchange URL is provided, use it
  if (config.tokenExchangeUrl) {
    console.debug('Using server-side token exchange endpoint:', config.tokenExchangeUrl);
    const response = await fetch(config.tokenExchangeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        codeVerifier,
        redirectUri: config.redirectUri,
      }),
    });

    if (!response.ok) {
      let errorText: string;
      let errorData: any;
      
      try {
        errorText = await response.text();
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
      } catch {
        errorText = `Server returned ${response.status}`;
        errorData = { error: errorText };
      }
      
      console.error('Token exchange failed:', response.status, errorData);
      
      // Provide helpful error message for missing client secret
      if (response.status === 500 && errorData.error?.includes('CONVEX_CLIENT_SECRET')) {
        const helpfulMessage = `OAuth server configuration error: ${errorData.error}\n\n` +
          `To fix this:\n` +
          `1. Create a .env file in the dev/ directory\n` +
          `2. Add: CONVEX_CLIENT_SECRET=your-client-secret-here\n` +
          `3. Get your client secret from: https://dashboard.convex.dev/team/settings\n` +
          `4. Restart the dev server (npm run dev:server)`;
        throw new Error(helpfulMessage);
      }
      
      throw new Error(`Failed to exchange code for token: ${response.status} ${errorData.error || errorText}`);
    }

    const token: OAuthToken = await response.json();
    console.debug('Token received from server');
    return token;
  }

  // Otherwise, try direct exchange (will fail due to CORS in browser)
  console.debug('Attempting direct token exchange (may fail due to CORS)');
  const body = new URLSearchParams({
    client_id: config.clientId,
    grant_type: 'authorization_code',
    redirect_uri: config.redirectUri,
    code,
    ...(codeVerifier && { code_verifier: codeVerifier }),
  });

  // If client secret is provided, use it (server-side only)
  if (config.clientSecret) {
    body.append('client_secret', config.clientSecret);
  }

  try {
    const response = await fetch('https://api.convex.dev/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Direct token exchange failed:', response.status, error);
      throw new Error(`Failed to exchange code for token: ${response.status} ${error}. Note: Token exchange must happen server-side. Provide a tokenExchangeUrl in oauthConfig.`);
    }

    const token: OAuthToken = await response.json();
    console.debug('Token received from direct exchange');
    
    // Store token with optional expiration
    if (token.expires_at) {
      token.expires_at = Date.now() + (token.expires_at * 1000);
    }
    
    return token;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('CORS')) {
      throw new Error('CORS error: Token exchange must happen server-side. Please provide a tokenExchangeUrl in oauthConfig pointing to your server endpoint that exchanges the code for a token.');
    }
    throw error;
  }
}

/**
 * Store OAuth token securely
 */
export function storeToken(token: OAuthToken): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(token));
  } catch (e) {
    console.error('Failed to store OAuth token:', e);
  }
}

/**
 * Retrieve stored OAuth token
 */
export function getStoredToken(): OAuthToken | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const token: OAuthToken = JSON.parse(stored);
    
    // Check if token is expired
    if (token.expires_at && token.expires_at < Date.now()) {
      clearToken();
      return null;
    }
    
    return token;
  } catch (e) {
    console.error('Failed to retrieve OAuth token:', e);
    return null;
  }
}

/**
 * Clear stored OAuth token
 */
export function clearToken(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(`${STATE_STORAGE_KEY}-pkce`);
    sessionStorage.removeItem(STATE_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear OAuth token:', e);
  }
}

/**
 * Get stored PKCE code verifier
 */
export function getStoredCodeVerifier(): string | null {
  try {
    return sessionStorage.getItem(`${STATE_STORAGE_KEY}-pkce`);
  } catch (e) {
    return null;
  }
}

/**
 * Handle OAuth callback and exchange code for token
 */
/**
 * Check if a code has already been used (prevents duplicate exchanges in React StrictMode)
 */
function isCodeUsed(code: string): boolean {
  try {
    const usedCodes = sessionStorage.getItem(USED_CODE_STORAGE_KEY);
    if (!usedCodes) return false;
    const codes = JSON.parse(usedCodes) as string[];
    return codes.includes(code);
  } catch {
    return false;
  }
}

/**
 * Mark a code as used
 */
function markCodeAsUsed(code: string): void {
  try {
    const usedCodes = sessionStorage.getItem(USED_CODE_STORAGE_KEY);
    const codes = usedCodes ? (JSON.parse(usedCodes) as string[]) : [];
    if (!codes.includes(code)) {
      codes.push(code);
      // Keep only last 10 codes to prevent storage bloat
      if (codes.length > 10) {
        codes.shift();
      }
      sessionStorage.setItem(USED_CODE_STORAGE_KEY, JSON.stringify(codes));
    }
  } catch (e) {
    console.warn('Failed to mark code as used:', e);
  }
}

export async function handleOAuthCallback(
  config: OAuthConfig
): Promise<OAuthToken | null> {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const error = urlParams.get('error');
  const statePayload = decodeStatePayload(state);

  if (error) {
    throw new Error(`OAuth error: ${error}`);
  }

  if (!code) {
    return null;
  }

  const existingExchange = inFlightExchanges.get(code);
  if (existingExchange) {
    console.debug('Exchange already in progress for this code, awaiting existing result');
    return existingExchange;
  }

  // Prevent duplicate exchanges (React StrictMode calls effects twice)
  if (isCodeUsed(code)) {
    console.debug('Code already used, skipping duplicate exchange');
    // Return stored token if available
    return getStoredToken();
  }

  const exchangePromise = (async () => {
    try {
      // Verify state if stored
      const storedState = sessionStorage.getItem(STATE_STORAGE_KEY);
      if (storedState && state !== storedState) {
        throw new Error('OAuth state mismatch');
      }

      // Get PKCE code verifier if used
      const storedCodeVerifier = getStoredCodeVerifier();
      const fallbackCodeVerifier = statePayload?.pkce || null;
      const codeVerifier = storedCodeVerifier || fallbackCodeVerifier || undefined;

      // Exchange code for token
      const token = await exchangeCodeForToken(code, config, codeVerifier);
      
      // Store token
      storeToken(token);

      // Mark code as used only after successful exchange
      markCodeAsUsed(code);
      
      // Clean up
      sessionStorage.removeItem(`${STATE_STORAGE_KEY}-pkce`);
      sessionStorage.removeItem(STATE_STORAGE_KEY);
      
      // Clean URL immediately to prevent React from reading it again
      window.history.replaceState({}, document.title, window.location.pathname);
      
      return token;
    } finally {
      inFlightExchanges.delete(code);
    }
  })();

  inFlightExchanges.set(code, exchangePromise);
  return exchangePromise;
}

