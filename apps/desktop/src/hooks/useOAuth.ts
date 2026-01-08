import { useState, useEffect, useCallback, useRef } from 'react';
import {
  buildAuthorizationUrl,
  handleOAuthCallback,
  getStoredToken,
  clearToken,
} from "../utils/oauth";
import type {
  OAuthConfig,
  OAuthToken,
} from "../utils/oauth";

export interface UseOAuthReturn {
  token: OAuthToken | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  authenticate: () => Promise<void>;
  logout: () => void;
}

/**
 * React hook for Convex OAuth authentication
 */
export function useOAuth(config: OAuthConfig | null): UseOAuthReturn {
  const [token, setToken] = useState<OAuthToken | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to track if we've already processed this config to prevent infinite loops
  const configRef = useRef<string | null>(null);
  const hasProcessedRef = useRef(false);

  // Check for stored token on mount
  useEffect(() => {
    if (!config) {
      setIsLoading(false);
      return;
    }

    // Create a stable key from config to detect actual changes
    const configKey = JSON.stringify({
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      tokenExchangeUrl: config.tokenExchangeUrl,
      scope: config.scope,
    });

    // Only process if config actually changed or we haven't processed yet
    if (configRef.current === configKey && hasProcessedRef.current) {
      return;
    }

    configRef.current = configKey;

    // Check for OAuth callback
    const checkCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const hasCode = urlParams.has('code');
        
        // If we have a code in the URL, validate config first before exchanging
        if (hasCode) {
          try {
            const { validateOAuthConfig } = await import('../utils/oauthValidation');
            const validation = validateOAuthConfig(config);
            
            if (!validation.isValid || validation.errors.length > 0) {
              // Don't exchange token if config is invalid - wait for user to fix it
              setError(`Configuration error: ${validation.errors.join('; ')}`);
              setIsLoading(false);
              hasProcessedRef.current = true;
              // Don't clean URL - let user see what happened and fix config
              return;
            }
          } catch (validationError) {
            // If validation fails to load/run, still try to exchange (might be network issue)
            console.warn('[useOAuth] Validation check failed, proceeding with token exchange:', validationError);
          }
          
          // Config is valid, proceed with token exchange
          const newToken = await handleOAuthCallback(config);
          if (newToken) {
            setToken(newToken);
            setError(null);
          }
        } else {
          // No code in URL, just check for stored token
          const storedToken = getStoredToken();
          if (storedToken) {
            setToken(storedToken);
            setError(null);
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Authentication failed');
      } finally {
        setIsLoading(false);
        hasProcessedRef.current = true;
      }
    };

    checkCallback();
  }, [config]);

  // Authenticate function
  const authenticate = useCallback(async () => {
    if (!config) {
      setError('OAuth configuration not provided');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      
      // Build authorization URL (automatically manages OAuth state + PKCE)
      const authUrl = await buildAuthorizationUrl(config);
      
      // Redirect to Convex authorization page
      window.location.href = authUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start authentication');
      setIsLoading(false);
    }
  }, [config]);

  // Logout function
  const logout = useCallback(() => {
    clearToken();
    setToken(null);
    setError(null);
  }, []);

  return {
    token,
    isAuthenticated: !!token,
    isLoading,
    error,
    authenticate,
    logout,
  };
}

