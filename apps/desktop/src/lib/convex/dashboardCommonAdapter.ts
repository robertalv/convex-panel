import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import type { Deployment, Project, Team } from 'convex-panel';
import { getDeployments, getProfile, getProjects, getTeams, type UserProfile } from '@convex-panel/shared/api';

const AUTH_ISSUER = 'https://auth.convex.dev';
const AUTH_CLIENT_ID = 'HFtA247jp9iNs08NTLIB7JsNPMmRIyfi';
const BIG_BRAIN_URL = 'https://api.convex.dev';

export type DashboardFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface DeviceAuthResponse {
    device_code: string;
    user_code: string;
    verification_uri: string;
    verification_uri_complete: string;
    expires_in: number;
    interval: number;
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

const isTauri = () => typeof window !== 'undefined' && Boolean((window as any).__TAURI_INTERNALS__);

export const dashboardFetch: DashboardFetch = async (input, init) => {
    const url = input instanceof Request ? input.url : input.toString();
    console.log(`[DashboardAdapter] Fetching ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        console.error(`Request to ${url} timed out after 15s`);
        controller.abort();
    }, 15000);

    const newInit = {
        ...init,
        signal: (init?.signal || controller.signal) as AbortSignal,
    };

    try {
        let response;
        if (isTauri()) {
            console.log(`Using tauriFetch for ${url}`);
            response = await tauriFetch(input, newInit);
        } else {
            console.log(`Using native fetch for ${url}`);
            response = await fetch(input, newInit);
        }
        console.log(`Response for ${url}: ${response.status}`);
        return response;
    } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
};

async function discoverAuthEndpoints(fetcher: DashboardFetch) {
    const response = await fetcher(`${AUTH_ISSUER}/.well-known/openid-configuration`, { method: 'GET' });
    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Failed to discover auth configuration: ${response.status} ${errorText}`);
    }
    return response.json() as Promise<{ device_authorization_endpoint: string; token_endpoint: string }>;
}

export async function startDeviceAuthorization(fetcher: DashboardFetch = dashboardFetch): Promise<DeviceAuthResponse> {
    const config = await discoverAuthEndpoints(fetcher);
    const deviceResponse = await fetcher(config.device_authorization_endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: AUTH_CLIENT_ID,
            scope: 'openid profile email',
        }).toString(),
    });

    if (!deviceResponse.ok) {
        const errorText = await deviceResponse.text().catch(() => 'Unknown error');
        throw new Error(`Failed to start device authorization: ${deviceResponse.status} ${errorText}`);
    }

    return deviceResponse.json();
}

export async function pollForDeviceToken(
    auth: DeviceAuthResponse,
    fetcher: DashboardFetch = dashboardFetch,
    shouldStop?: () => boolean,
): Promise<TokenResponse | null> {
    const { token_endpoint } = await discoverAuthEndpoints(fetcher);
    const pollInterval = (auth.interval || 5) * 1000;
    const expiresAt = Date.now() + auth.expires_in * 1000;

    while (Date.now() < expiresAt) {
        if (shouldStop?.()) {
            return null;
        }
        const tokenResponse = await fetcher(token_endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
                client_id: AUTH_CLIENT_ID,
                device_code: auth.device_code,
            }).toString(),
        });

        if (tokenResponse.ok) {
            return tokenResponse.json();
        }

        await new Promise((resolve) => setTimeout(resolve, pollInterval));
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

    const response = await fetcher(`${BIG_BRAIN_URL}/api/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authnToken: oidcToken, deviceName: hostname }),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Failed to authorize with Convex: ${response.status} ${errorText}`);
    }

    const data = await response.json();
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
