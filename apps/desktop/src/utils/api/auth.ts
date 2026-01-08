/**
 * Authentication provider operations
 * Handles fetching authentication provider configuration
 */

import { SYSTEM_QUERIES } from '../constants';
import type { AuthProvider } from './types';

/**
 * Get authentication providers for a deployment
 * @param adminClient - The Convex admin client instance
 * @returns The authentication providers
 */
export async function getAuthProviders(
  adminClient: any
): Promise<AuthProvider[]> {
  if (!adminClient) {
    throw new Error('Admin client not available');
  }

  try {
    const result = await adminClient.query(SYSTEM_QUERIES.LIST_AUTH_PROVIDERS, {});

    // The result might be directly an array, or wrapped in a status object
    if (Array.isArray(result)) {
      return result;
    }
    
    if (result && typeof result === 'object') {
      if (result.status === 'success' && result.value) {
        return Array.isArray(result.value) ? result.value : [];
      }
      // If it's already an object with providers, try to return it directly
      if (Array.isArray(result.providers)) {
        return result.providers;
      }
    }
    
    return [];
  } catch (error: any) {
    throw new Error(`Failed to get auth providers: ${error?.message || 'Unknown error'}`);
  }
}

