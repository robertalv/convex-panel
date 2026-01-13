import axios from 'axios';
import type { DeviceAuthResponse, TokenResponse, DashboardSession, UserProfile } from '../types';

const AUTH_ISSUER = 'https://auth.convex.dev';
const AUTH_CLIENT_ID = 'HFtA247jp9iNs08NTLIB7JsNPMmRIyfi';
const BIG_BRAIN_URL = 'https://api.convex.dev';

/**
 * Discover OAuth endpoints from OpenID configuration
 */
async function discoverAuthEndpoints(): Promise<{
  device_authorization_endpoint: string;
  token_endpoint: string;
}> {
  const response = await axios.get(`${AUTH_ISSUER}/.well-known/openid-configuration`);
  return {
    device_authorization_endpoint: response.data.device_authorization_endpoint,
    token_endpoint: response.data.token_endpoint,
  };
}

/**
 * Start the device authorization flow
 * Returns device code and user code for display
 */
export async function startDeviceAuthorization(): Promise<DeviceAuthResponse> {
  const config = await discoverAuthEndpoints();
  
  const response = await axios.post(
    config.device_authorization_endpoint,
    new URLSearchParams({
      client_id: AUTH_CLIENT_ID,
      scope: 'openid profile email',
    }).toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return response.data as DeviceAuthResponse;
}

/**
 * Poll for device token after user has authorized
 * Returns token response if user has completed authorization, null otherwise
 */
export async function pollForDeviceToken(
  auth: DeviceAuthResponse
): Promise<TokenResponse | null> {
  const config = await discoverAuthEndpoints();
  
  try {
    const response = await axios.post(
      config.token_endpoint,
      new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code: auth.device_code,
        client_id: AUTH_CLIENT_ID,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data as TokenResponse;
  } catch (error: any) {
    const errorCode = error.response?.data?.error;
    
    if (errorCode === 'authorization_pending' || errorCode === 'slow_down') {
      // User hasn't authorized yet - this is expected
      return null;
    }

    if (errorCode === 'expired_token') {
      throw new Error('Authorization expired. Please try again.');
    }

    if (errorCode === 'access_denied') {
      throw new Error('Authorization was denied.');
    }

    throw error;
  }
}

/**
 * Exchange OIDC token for Convex dashboard access token
 */
export async function exchangeForDashboardToken(
  oidcToken: string
): Promise<DashboardSession> {
  const response = await axios.post(
    `${BIG_BRAIN_URL}/api/authorize`,
    {
      authnToken: oidcToken,
      deviceName: 'Convex Panel Mobile',
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Convex-Client': 'convex-panel-mobile-1.0.0',
      },
    }
  );

  const data = response.data;

  // Fetch user profile
  const profile = await getUserProfile(data.accessToken);

  return {
    accessToken: data.accessToken,
    expiresAt: data.expiresAt ? Date.now() + data.expiresAt * 1000 : Date.now() + 24 * 60 * 60 * 1000,
    profile,
  };
}

/**
 * Get user profile from BigBrain API
 */
async function getUserProfile(accessToken: string): Promise<UserProfile> {
  try {
    const response = await axios.get(`${BIG_BRAIN_URL}/api/dashboard/profile`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Convex-Client': 'convex-panel-mobile-1.0.0',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return {};
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const config = await discoverAuthEndpoints();
  
  const response = await axios.post(
    config.token_endpoint,
    new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: AUTH_CLIENT_ID,
      refresh_token: refreshToken,
    }).toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return response.data as TokenResponse;
}

/**
 * Validate if a token is still valid
 */
export function isTokenExpired(expiresAt?: number): boolean {
  if (!expiresAt) return true;
  // Add 5 minute buffer
  return Date.now() >= expiresAt - 5 * 60 * 1000;
}
