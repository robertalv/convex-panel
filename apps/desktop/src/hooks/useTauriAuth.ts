import { useState, useCallback } from 'react';
import { UseOAuthReturn, OAuthConfig, buildAuthorizationUrl, exchangeCodeForToken, storeToken, clearToken, getStoredToken } from '@convex-panel/panel';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';

export function useTauriAuth(config: OAuthConfig): UseOAuthReturn {
    const [token, setToken] = useState(getStoredToken());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const authenticate = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Start local server via Rust command
            const port = await invoke<number>('start_oauth_server');
            const redirectUri = `http://localhost:${port}`;

            // Build auth URL
            const authUrl = await buildAuthorizationUrl({
                ...config,
                redirectUri,
            });

            // Open browser
            await import('@tauri-apps/api/shell').then(shell => shell.open(authUrl));

            // Listen for code
            const unlisten = await listen<string>('oauth-code', async (event) => {
                try {
                    const code = event.payload;
                    // Exchange code for token
                    const token = await exchangeCodeForToken(code, {
                        ...config,
                        redirectUri,
                    });
                    setToken(token);
                    storeToken(token);
                } catch (e) {
                    setError(e instanceof Error ? e.message : 'Token exchange failed');
                } finally {
                    setIsLoading(false);
                    unlisten(); // Stop listening
                }
            });

        } catch (e) {
            console.error('Tauri auth error:', e);
            setError(e instanceof Error ? e.message : 'Authentication failed');
            setIsLoading(false);
        }
    }, [config]);

    const logout = useCallback(() => {
        clearToken();
        setToken(null);
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
