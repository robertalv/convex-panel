/**
 * OAuth configuration validation utilities
 */

export interface OAuthValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Re-export OAuthConfig type for convenience, but we'll accept a simpler shape for validation
export interface OAuthConfig {
  clientId?: string;
  redirectUri?: string;
  tokenExchangeUrl?: string;
  scope?: 'team' | 'project' | string;
}

/**
 * Validate OAuth configuration before attempting connection
 */
export function validateOAuthConfig(config: OAuthConfig | null | undefined): OAuthValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config) {
    errors.push('OAuth configuration is missing. Please provide oauthConfig with at least a clientId.');
    return { isValid: false, errors, warnings };
  }

  // Required fields
  if (!config.clientId || config.clientId.trim() === '') {
    errors.push('OAuth Client ID is required. Please set OAUTH_CLIENT_ID environment variable or provide it in oauthConfig.');
  }

  if (!config.redirectUri || config.redirectUri.trim() === '') {
    errors.push('Redirect URI is required. It should match your OAuth app settings.');
  }

  // Warnings for missing but recommended fields
  if (!config.tokenExchangeUrl || config.tokenExchangeUrl.trim() === '') {
    warnings.push('Token exchange URL is not configured. The default production server (https://api.convexpanel.dev/v1/convex/oauth) will be used.');
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
    // First check if it's a health endpoint available
    // Try to find health endpoint by replacing common patterns
    const healthUrl = url.replace('/v1/convex/oauth', '/health').replace('/api/convex/exchange', '/health');
    
    try {
      const healthResponse = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Short timeout for health checks
        signal: AbortSignal.timeout(5000),
      });

      if (healthResponse.ok) {
        return { isReachable: true };
      }
    } catch (healthError) {
      // Health endpoint might not exist, that's okay
    }

    // Try a simple OPTIONS request to check CORS
    const optionsResponse = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'Accept': 'application/json',
        'Origin': typeof window !== 'undefined' ? window.location.origin : 'https://convexpanel.dev',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (optionsResponse.ok || optionsResponse.status === 204) {
      return { isReachable: true };
    }

    // If OPTIONS fails, try a simple GET to check if endpoint exists
    const getResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    // Even if GET returns an error, if we get a response, the endpoint exists
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
          error: 'Connection timeout. The API server may be down or unreachable. Please check https://api.convexpanel.dev/health',
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

  // Optionally check endpoint availability (default: true)
  const shouldCheckEndpoint = options?.checkEndpoint !== false;
  
  if (shouldCheckEndpoint && config && config.tokenExchangeUrl) {
    try {
      const endpointCheck = await checkTokenExchangeEndpoint(config.tokenExchangeUrl);
      
      if (!endpointCheck.isReachable) {
        configValidation.errors.push(endpointCheck.error || 'Token exchange endpoint is not reachable.');
        configValidation.isValid = false;
      }
    } catch (error) {
      // If endpoint check fails, add as warning rather than error
      // This allows connection to proceed (might be temporary network issue)
      configValidation.warnings.push(
        `Could not verify endpoint availability: ${error instanceof Error ? error.message : 'Unknown error'}. You can still try to connect.`
      );
    }
  }

  return configValidation;
}

