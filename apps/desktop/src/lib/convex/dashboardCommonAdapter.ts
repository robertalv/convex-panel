import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { invoke } from '@tauri-apps/api/core';
import type { Deployment, Project, Team } from 'convex-panel';
import { getDeployments, getProfile, getProjects, getTeams, type UserProfile } from '@convex-panel/shared/api';

const AUTH_ISSUER = 'https://auth.convex.dev';
const AUTH_CLIENT_ID = 'HFtA247jp9iNs08NTLIB7JsNPMmRIyfi';
const BIG_BRAIN_URL = 'https://api.convex.dev';
const REQUEST_TIMEOUT_MS = 15000;

export type DashboardFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface DeviceAuthResponse {
    device_code: string;
    user_code: string;
    verification_uri: string;
    verification_uri_complete: string;
    expires_in: number;
    interval: number;
    token_endpoint?: string;
}

export interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in?: number;
    refresh_token?: string;
}

export interface DashboardSession {
    accessToken: string;
    tokenType: string;
    expiresAt?: number;
    refreshToken?: string;
}

export interface DashboardAdapter {
    fetchUser(accessToken: string): Promise<UserProfile>;
    listTeams(accessToken: string): Promise<Team[]>;
    listProjects(accessToken: string, teamId: number): Promise<Project[]>;
    listDeployments(accessToken: string, projectId: number): Promise<Deployment[]>;
}

interface AuthEndpoints {
    device_authorization_endpoint: string;
    token_endpoint: string;
}

interface TokenErrorResponse {
    error?: string;
    error_description?: string;
    interval?: number;
}

interface TauriTokenPollResponse {
    status: number;
    body: TokenResponse & TokenErrorResponse & { [key: string]: unknown };
}

const isTauri = () => typeof window !== 'undefined' && Boolean((window as any).__TAURI_INTERNALS__);

async function readJsonWithTimeout<T>(
    response: Response,
    context: string,
    timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
        const rawText = await Promise.race([
            response.text(),
            new Promise<never>((_, reject) => {
                timeoutId = setTimeout(() => {
                    reject(new Error(`Timed out reading ${context} response body after ${timeoutMs / 1000}s`));
                }, timeoutMs);
            }),
        ]);

        try {
            return JSON.parse(rawText) as T;
        } catch (parseError) {
            throw new Error(
                `Failed to parse ${context} response as JSON: ${
                    parseError instanceof Error ? parseError.message : String(parseError)
                }`,
            );
        }
    } finally {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }
}

async function readTextWithTimeout(
    response: Response,
    context: string,
    timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<string> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
        return await Promise.race([
            response.text(),
            new Promise<never>((_, reject) => {
                timeoutId = setTimeout(() => {
                    reject(new Error(`Timed out reading ${context} response text after ${timeoutMs / 1000}s`));
                }, timeoutMs);
            }),
        ]);
    } finally {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }
}

export const dashboardFetch: DashboardFetch = async (input, init) => {
    const url = input instanceof Request ? input.url : input.toString();
    console.log(`[DashboardAdapter] Fetching ${url}`);

    const controller = new AbortController();

    const externalSignal = init?.signal;
    const onExternalAbort = () => controller.abort();
    if (externalSignal) {
        if (externalSignal.aborted) {
            controller.abort();
        } else {
            externalSignal.addEventListener('abort', onExternalAbort, { once: true });
        }
    }

    const newInit = {
        ...init,
        signal: controller.signal as AbortSignal,
    };

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
        const requestPromise = (async () => {
            if (isTauri()) {
                console.log(`Using tauriFetch for ${url}`);
                return tauriFetch(input, newInit);
            }

            console.log(`Using native fetch for ${url}`);
            return fetch(input, newInit);
        })();

        const timeoutPromise = new Promise<Response>((_, reject) => {
            timeoutId = setTimeout(() => {
                console.error(`Request to ${url} timed out after ${REQUEST_TIMEOUT_MS / 1000}s`);
                controller.abort();
                reject(new Error(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`));
            }, REQUEST_TIMEOUT_MS);
        });

        const response = await Promise.race([requestPromise, timeoutPromise]);
        if (isTauri()) {
            console.log(`Response for ${url}: ${response.status}`);
        }
        return response;
    } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        throw error;
    } finally {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        if (externalSignal) {
            externalSignal.removeEventListener('abort', onExternalAbort);
        }
    }
};

async function discoverAuthEndpoints(fetcher: DashboardFetch): Promise<AuthEndpoints> {
    const response = await fetcher(`${AUTH_ISSUER}/.well-known/openid-configuration`, { method: 'GET' });
    if (!response.ok) {
        const errorText = await readTextWithTimeout(response, 'OIDC discovery error', 5000).catch(() => 'Unknown error');
        throw new Error(`Failed to discover auth configuration: ${response.status} ${errorText}`);
    }

    console.log('[DashboardAdapter] Parsing OIDC discovery response');
    const data = await readJsonWithTimeout<Partial<AuthEndpoints>>(
        response,
        'OIDC discovery',
    );
    if (!data.device_authorization_endpoint || !data.token_endpoint) {
        throw new Error('Failed to discover auth configuration: missing OAuth endpoints');
    }

    console.log(
        '[DashboardAdapter] Discovered auth endpoints:',
        data.device_authorization_endpoint,
        data.token_endpoint,
    );

    return {
        device_authorization_endpoint: data.device_authorization_endpoint,
        token_endpoint: data.token_endpoint,
    };
}

export async function startDeviceAuthorization(fetcher: DashboardFetch = dashboardFetch): Promise<DeviceAuthResponse> {
    if (isTauri()) {
        const tauriResponse = await invoke<DeviceAuthResponse>(
            'auth_start_device_authorization',
            {
                clientId: AUTH_CLIENT_ID,
                scope: 'openid profile email',
            },
        );

        const verificationUrl = tauriResponse.verification_uri_complete || tauriResponse.verification_uri;
        if (!tauriResponse.device_code || !tauriResponse.user_code || !verificationUrl || !tauriResponse.expires_in) {
            throw new Error('Auth server returned an invalid device authorization response');
        }

        return {
            device_code: tauriResponse.device_code,
            user_code: tauriResponse.user_code,
            verification_uri: tauriResponse.verification_uri || verificationUrl,
            verification_uri_complete: verificationUrl,
            expires_in: tauriResponse.expires_in,
            interval: tauriResponse.interval || 5,
            token_endpoint: tauriResponse.token_endpoint,
        };
    }

    const config = await discoverAuthEndpoints(fetcher);
    console.log('[DashboardAdapter] Starting device authorization request', config.device_authorization_endpoint);
    const deviceResponse = await fetcher(config.device_authorization_endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: AUTH_CLIENT_ID,
            scope: 'openid profile email',
        }).toString(),
    });

    if (!deviceResponse.ok) {
        const errorText = await readTextWithTimeout(
            deviceResponse,
            'device authorization error',
            5000,
        ).catch(() => 'Unknown error');
        throw new Error(`Failed to start device authorization: ${deviceResponse.status} ${errorText}`);
    }

    const data = await readJsonWithTimeout<Partial<DeviceAuthResponse>>(
        deviceResponse,
        'device authorization',
    );
    const verificationUrl = data.verification_uri_complete || data.verification_uri;

    if (!data.device_code || !data.user_code || !verificationUrl || !data.expires_in) {
        throw new Error('Auth server returned an invalid device authorization response');
    }

    return {
        device_code: data.device_code,
        user_code: data.user_code,
        verification_uri: data.verification_uri || verificationUrl,
        verification_uri_complete: verificationUrl,
        expires_in: data.expires_in,
        interval: data.interval || 5,
        token_endpoint: config.token_endpoint,
    };
}

export async function pollForDeviceToken(
    auth: DeviceAuthResponse,
    fetcher: DashboardFetch = dashboardFetch,
    shouldStop?: () => boolean,
): Promise<TokenResponse | null> {
    const discoveredEndpoints = auth.token_endpoint
        ? { token_endpoint: auth.token_endpoint }
        : await discoverAuthEndpoints(fetcher);
    const tokenEndpoint = discoveredEndpoints.token_endpoint;
    const pollInterval = (auth.interval || 5) * 1000;
    const expiresAt = Date.now() + auth.expires_in * 1000;

    while (Date.now() < expiresAt) {
        if (shouldStop?.()) {
            return null;
        }
        if (isTauri()) {
            const tokenPollResponse = await invoke<TauriTokenPollResponse>(
                'auth_poll_device_token',
                {
                    tokenEndpoint,
                    clientId: AUTH_CLIENT_ID,
                    deviceCode: auth.device_code,
                },
            );

            const body = tokenPollResponse.body;

            if (tokenPollResponse.status >= 200 && tokenPollResponse.status < 300) {
                if (!body.access_token || typeof body.access_token !== 'string') {
                    throw new Error('Token response missing access_token');
                }
                return {
                    access_token: body.access_token,
                    token_type: typeof body.token_type === 'string' ? body.token_type : 'Bearer',
                    expires_in: typeof body.expires_in === 'number' ? body.expires_in : undefined,
                    refresh_token: typeof body.refresh_token === 'string' ? body.refresh_token : undefined,
                };
            }

            const errorCode = body.error;

            if (errorCode === 'authorization_pending') {
                await new Promise((resolve) => setTimeout(resolve, pollInterval));
                continue;
            }

            if (errorCode === 'slow_down') {
                const nextPollInterval = Math.max(
                    (typeof body.interval === 'number' ? body.interval : auth.interval || 5) * 1000,
                    pollInterval + 5000,
                );
                await new Promise((resolve) => setTimeout(resolve, nextPollInterval));
                continue;
            }

            if (errorCode === 'expired_token') {
                throw new Error('Authentication expired. Please try again.');
            }

            if (errorCode === 'access_denied') {
                throw new Error('Authentication was denied.');
            }

            if (errorCode) {
                throw new Error(`Authentication failed: ${body.error_description || errorCode}`);
            }

            throw new Error(`Authentication failed while polling token: HTTP ${tokenPollResponse.status}`);
        }

        const tokenResponse = await fetcher(tokenEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
                client_id: AUTH_CLIENT_ID,
                device_code: auth.device_code,
            }).toString(),
        });

        if (tokenResponse.ok) {
            return readJsonWithTimeout<TokenResponse>(tokenResponse, 'token');
        }

        const errorBody = await readJsonWithTimeout<TokenErrorResponse>(
            tokenResponse,
            'token error',
            5000,
        ).catch(() => ({} as TokenErrorResponse));
        const errorCode = errorBody.error;

        if (errorCode === 'authorization_pending') {
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
            continue;
        }

        if (errorCode === 'slow_down') {
            const nextPollInterval = Math.max((errorBody.interval || auth.interval || 5) * 1000, pollInterval + 5000);
            await new Promise((resolve) => setTimeout(resolve, nextPollInterval));
            continue;
        }

        if (errorCode === 'expired_token') {
            throw new Error('Authentication expired. Please try again.');
        }

        if (errorCode === 'access_denied') {
            throw new Error('Authentication was denied.');
        }

        if (errorCode) {
            throw new Error(`Authentication failed: ${errorBody.error_description || errorCode}`);
        }

        throw new Error(`Authentication failed while polling token: HTTP ${tokenResponse.status}`);
    }

    return null;
}

export async function exchangeForDashboardToken(
    oidcToken: string,
    fetcher: DashboardFetch = dashboardFetch,
): Promise<DashboardSession> {
    const hostname = typeof window !== 'undefined' && navigator?.userAgent?.includes('Tauri')
        ? 'Convex Panel Desktop'
        : 'convex-panel';

    if (isTauri()) {
        const data = await invoke<{
            accessToken: string;
            tokenType?: string;
            expiresAt?: number;
            refreshToken?: string;
        }>('auth_exchange_dashboard_token', {
            authnToken: oidcToken,
            deviceName: hostname,
        });

        return {
            accessToken: data.accessToken,
            tokenType: data.tokenType ?? 'Bearer',
            expiresAt: data.expiresAt ? Date.now() + data.expiresAt * 1000 : undefined,
            refreshToken: data.refreshToken,
        };
    }

    const response = await fetcher(`${BIG_BRAIN_URL}/api/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authnToken: oidcToken, deviceName: hostname }),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Failed to authorize with Convex: ${response.status} ${errorText}`);
    }

    const data = await readJsonWithTimeout<{
        accessToken: string;
        tokenType?: string;
        expiresAt?: number;
        refreshToken?: string;
    }>(response, 'dashboard authorize');
    return {
        accessToken: data.accessToken,
        tokenType: data.tokenType ?? 'Bearer',
        expiresAt: data.expiresAt ? Date.now() + data.expiresAt * 1000 : undefined,
        refreshToken: data.refreshToken,
    };
}

export function createDashboardAdapter(fetcher: DashboardFetch = dashboardFetch): DashboardAdapter {
    return {
        fetchUser: (token: string) => getProfile(token, fetcher),
        listTeams: (token: string) => getTeams(token, fetcher),
        listProjects: (token: string, teamId: number) => getProjects(token, teamId, fetcher),
        listDeployments: (token: string, projectId: number) => getDeployments(token, projectId, fetcher),
    };
}

export const mockDashboardAdapter: DashboardAdapter = {
    async fetchUser() {
        return {
            name: 'Jane Dev',
            email: 'jane@example.dev',
            profilePictureUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
        };
    },
    async listTeams() {
        return [
            { id: 1, name: 'Example Team', slug: 'example-team' },
            { id: 2, name: 'Edge Sandbox', slug: 'edge-sandbox' },
        ];
    },
    async listProjects(_, teamId) {
        return [
            { id: teamId * 10 + 1, name: 'web-app', slug: 'web-app', teamId },
            { id: teamId * 10 + 2, name: 'data-pipeline', slug: 'data-pipeline', teamId },
        ];
    },
    async listDeployments(_, projectId) {
        return [
            {
                id: projectId * 100 + 1,
                name: 'dev',
                url: 'https://demo-dev.convex.cloud',
                deploymentType: 'dev',
                projectId,
            },
            {
                id: projectId * 100 + 2,
                name: 'prod',
                url: 'https://demo-prod.convex.cloud',
                deploymentType: 'prod',
                projectId,
            },
        ];
    },
};

export const missingDashboardPieces = `
- Session refresh + impersonation: requires dashboard-common session manager and refresh endpoints.
- Native log streaming + function metrics: wire to dashboard deployment APIs when available.
- OAuth client configuration: surface dashboard-common oauth config UI once endpoints are exposed to desktop clients.
`;
