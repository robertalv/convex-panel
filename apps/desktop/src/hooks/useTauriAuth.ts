import { useState, useCallback, useEffect, useRef } from 'react';
import { UseOAuthReturn, OAuthConfig, buildAuthorizationUrl, exchangeCodeForToken, storeToken, clearToken, getStoredToken } from 'convex-panel/react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

const OAUTH_TIMEOUT = 5 * 60 * 1000; // 5 minutes timeout for OAuth flow

export function useTauriAuth(config: OAuthConfig): UseOAuthReturn {
    const [token, setToken] = useState(getStoredToken());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const unlistenRef = useRef<UnlistenFn | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup function
    const cleanup = useCallback(() => {
        if (unlistenRef.current) {
            unlistenRef.current();
            unlistenRef.current = null;
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return cleanup;
    }, [cleanup]);

    const authenticate = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            cleanup(); // Clean up any previous listeners

            // Start local server via Rust command
            console.log('[useTauriAuth] Starting OAuth server...');
            const port = await invoke<number>('start_oauth_server');
            const redirectUri = `http://localhost:${port}`;
            console.log('[useTauriAuth] OAuth server started on port:', port);

            // Build auth URL
            const authUrl = await buildAuthorizationUrl({
                ...config,
                redirectUri,
            });
            console.log('[useTauriAuth] Opening browser with auth URL');

            // Open browser
            await import('@tauri-apps/api/shell').then(shell => shell.open(authUrl));

            // Set timeout for OAuth flow
            timeoutRef.current = setTimeout(() => {
                cleanup();
                setError('Authentication timed out. Please try again.');
                setIsLoading(false);
            }, OAUTH_TIMEOUT);

            // Listen for code
            const unlisten = await listen<string>('oauth-code', async (event) => {
                try {
                    console.log('[useTauriAuth] Received OAuth code');
                    const code = event.payload;

                    // Exchange code for token
                    console.log('[useTauriAuth] Exchanging code for token...');
                    const token = await exchangeCodeForToken(code, {
                        ...config,
                        redirectUri,
                    });

                    console.log('[useTauriAuth] Token received successfully');
                    setToken(token);
                    storeToken(token);
                    setError(null);
                } catch (e) {
                    console.error('[useTauriAuth] Token exchange failed:', e);
                    setError(e instanceof Error ? e.message : 'Token exchange failed');
                } finally {
                    setIsLoading(false);
                    cleanup();
                }
            });

            unlistenRef.current = unlisten;

        } catch (e) {
            console.error('[useTauriAuth] Authentication error:', e);
            setError(e instanceof Error ? e.message : 'Authentication failed');
            setIsLoading(false);
            cleanup();
        }
    }, [config, cleanup]);

    const logout = useCallback(() => {
        clearToken();
        setToken(null);
        setError(null);
        cleanup();
    }, [cleanup]);

    return {
        token,
        isAuthenticated: !!token,
        isLoading,
        error,
        authenticate,
        logout,
    };
}
