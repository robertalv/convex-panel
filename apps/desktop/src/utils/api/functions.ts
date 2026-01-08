/**
 * Function specs and source code operations
 * Handles fetching function specifications, source code, and components
 */

import { ROUTES, SYSTEM_QUERIES } from '../../utils/constants';
import { normalizeToken } from './helpers';

/**
 * Fetch the API spec for all functions in the Convex deployment
 * @param adminClient - The Convex admin client instance
 * @param useMockData - Whether to use mock data instead of making API calls
 * @param componentId - Optional component ID to fetch functions for a specific component
 * @returns Array of function specifications
 */
export async function fetchFunctionSpec(
  adminClient: any,
  useMockData = false,
  componentId?: string | null
): Promise<any[]> {
  if (useMockData) {
    return []; // TODO: Add mock data implementation
  }

  if (!adminClient) {
    throw new Error('Admin client not available');
  }

  try {
    // Call the API spec endpoint with optional componentId parameter
    // Passing componentId allows us to fetch functions for a specific component
    const args: any = {};
    if (componentId !== undefined && componentId !== null) {
      args.componentId = componentId;
    }
    
    const results = await adminClient.query(SYSTEM_QUERIES.FUNCTION_API_SPEC, args) as any[];

    if (!Array.isArray(results)) {
      return [];
    }

    return results;
  } catch (err: any) {
    // Don't throw - return empty array so we can continue with other components
    return [];
  }
}

/**
 * Fetch the list of components from the Convex deployment
 * @param adminClient - The Convex admin client instance
 * @param useMockData - Whether to use mock data instead of making API calls
 * @returns Array of component definitions
 */
export async function fetchComponents(
  adminClient: any,
  useMockData = false
): Promise<any[]> {
  if (useMockData) {
    return []; // TODO: Add mock data implementation
  }

  if (!adminClient) {
    throw new Error('Admin client not available');
  }

  try {
    const results = await adminClient.query(SYSTEM_QUERIES.LIST_COMPONENTS, {}) as any[];

    if (!Array.isArray(results)) {
      return [];
    }

    return results;
  } catch (err) {
    // Don't throw - components might not be available in all deployments
    return [];
  }
}

/**
 * Fetch source code for a function
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token
 * @param modulePath - The path to the module
 * @param componentId - The component ID
 * @returns The source code
 */
export const fetchSourceCode = async (
  deploymentUrl: string,
  authToken: string,
  modulePath: string,
  componentId?: string | null
) => {
  const params = new URLSearchParams({ path: modulePath });
  
  if (componentId) {
    params.append('component', componentId);
  }
  
  const normalizedToken = normalizeToken(authToken);
  const url = `${deploymentUrl}${ROUTES.GET_SOURCE_CODE}?${params}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': normalizedToken,
      'Content-Type': 'application/json',
      'Convex-Client': 'dashboard-0.0.0',
    }
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Failed to fetch source code: HTTP ${response.status} - ${responseText}`);
  }

  const text = await response.text();
  
  if (text === 'null' || text.trim() === '') {
    return null;
  }
  
  try {
    const json = JSON.parse(text);
    
    if (json === null || json === undefined) {
      return null;
    }
    if (typeof json === 'object' && 'code' in json) {
      return json.code || null;
    }
    if (typeof json === 'object' && 'source' in json) {
      return json.source || null;
    }
    if (typeof json === 'string') {
      return json;
    }
  } catch (parseError) {
    // Not JSON, return as text
  }
  
  return text;
};

