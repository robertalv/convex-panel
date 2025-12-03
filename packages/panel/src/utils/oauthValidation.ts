import { CONVEX_PANEL_API_DOMAIN, CONVEX_PANEL_DOMAIN, ROUTES } from "./constants";

export interface OAuthValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface OAuthConfig {
  clientId?: string;
  redirectUri?: string;
  tokenExchangeUrl?: string;
  scope?: 'team' | 'project' | string;
}

/**
 * Validate OAuth configuration
 * @param config - The OAuth configuration to validate
 * @returns The validation result
 */
export function validateOAuthConfig(config: OAuthConfig | null | undefined): OAuthValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config) {
    errors.push('OAuth configuration is missing. Please provide oauthConfig with at least a clientId.');
    return { isValid: false, errors, warnings };
  }

  if (!config.clientId || config.clientId.trim() === '') {
    errors.push('OAuth Client ID is required. Please set OAUTH_CLIENT_ID environment variable or provide it in oauthConfig.');
  }

  if (!config.redirectUri || config.redirectUri.trim() === '') {
    errors.push('Redirect URI is required. It should match your OAuth app settings.');
  }

  if (!config.tokenExchangeUrl || config.tokenExchangeUrl.trim() === '') {
    warnings.push(`Token exchange URL is not configured. The default production server (https://${CONVEX_PANEL_API_DOMAIN}${ROUTES.CONVEX_OAUTH}) will be used.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if the token exchange endpoint is reachable
 */
export async function checkTokenExchangeEndpoint(url: string): Promise<{
  isReachable: boolean;
  error?: string;
}> {
  try {
    const healthUrl = url.replace(ROUTES.CONVEX_OAUTH, ROUTES.HEALTH_ENDPOINT).replace(ROUTES.OAUTH_DEV_ENDPOINT, ROUTES.HEALTH_ENDPOINT);
    
    try {
      const healthResponse = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (healthResponse.ok) {
        return { isReachable: true };
      }
    } catch (healthError) {
      // Health endpoint might not exist, that's okay
    }

    const optionsResponse = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'Accept': 'application/json',
        'Origin': typeof window !== 'undefined' ? window.location.origin : `https://${CONVEX_PANEL_DOMAIN}`,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (optionsResponse.ok || optionsResponse.status === 204) {
      return { isReachable: true };
    }

    const getResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (getResponse.status !== 0) {
      return { isReachable: true };
    }

    return {
      isReachable: false,
      error: 'Endpoint is not reachable. Please check your network connection or the API server status.',
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        return {
          isReachable: false,
          error: `Connection timeout. The API server may be down or unreachable. Please check https://${CONVEX_PANEL_API_DOMAIN}${ROUTES.HEALTH_ENDPOINT}`,
        };
      }
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return {
          isReachable: false,
          error: 'Network error. Please check your internet connection and try again.',
        };
      }

      if (error.message.includes('CORS')) {
        return {
          isReachable: false,
          error: 'CORS error. The API server may not be configured to allow requests from your origin.',
        };
      }

      return {
        isReachable: false,
        error: `Unable to reach endpoint: ${error.message}`,
      };
    }

    return {
      isReachable: false,
      error: 'Unknown error while checking endpoint availability.',
    };
  }
}

/**
 * Validate environment variables and optionally check endpoint availability
 */
export async function validateOAuthSetup(
  config: OAuthConfig | null | undefined,
  options?: { checkEndpoint?: boolean }
): Promise<OAuthValidationResult> {
  const configValidation = validateOAuthConfig(config);
  
  if (!configValidation.isValid) {
    return configValidation;
  }

  const isDev = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '[::1]'
  );
  const shouldCheckEndpoint = options?.checkEndpoint ?? !isDev;
  
  if (shouldCheckEndpoint && config && config.tokenExchangeUrl) {
    try {
      const endpointCheck = await checkTokenExchangeEndpoint(config.tokenExchangeUrl);
      
      if (!endpointCheck.isReachable) {
        const errorMsg = endpointCheck.error || 'Token exchange endpoint is not reachable.';
        if (errorMsg.includes('CORS')) {
          configValidation.warnings.push(
            `${errorMsg} This may not prevent OAuth from working. You can still try to connect.`
          );
        } else {
          configValidation.warnings.push(
            `${errorMsg} You can still try to connect, but it may fail.`
          );
        }
        // Don't set isValid to false - allow user to try anyway
      }
    } catch (error) {
      configValidation.warnings.push(
        `Could not verify endpoint availability: ${error instanceof Error ? error.message : 'Unknown error'}. You can still try to connect.`
      );
    }
  }

  return configValidation;
}

