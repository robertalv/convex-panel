/**
 * Environment variable management operations
 * Handles getting, setting, and deleting environment variables
 */

import type { EnvironmentVariable } from './types';
import { ROUTES, SYSTEM_QUERIES } from '../constants';

/**
 * Get a specific environment variable by name
 * @param adminClient - The Convex admin client instance
 * @param name - The name of the environment variable
 * @returns The environment variable
 */
export async function getEnvironmentVariable(
  adminClient: any,
  name: string
): Promise<EnvironmentVariable | null> {
  if (!adminClient) {
    throw new Error('Admin client not available');
  }

  try {
    const result = await adminClient.query(
      SYSTEM_QUERIES.GET_ENVIRONMENT_VARIABLE,
      { name }
    );
    return result;
  } catch (error: any) {
    throw new Error(`Failed to get environment variable: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Get all environment variables
 * @param adminClient - The Convex admin client instance
 * @returns The environment variables
 */
export async function getAllEnvironmentVariables(
  adminClient: any
): Promise<EnvironmentVariable[]> {
  if (!adminClient) {
    throw new Error('Admin client not available');
  }

  try {
    const result = await adminClient.query(
      SYSTEM_QUERIES.LIST_ENVIRONMENT_VARIABLES,
      {}
    );
    return result || [];
  } catch (error: any) {
    throw new Error(`Failed to get environment variables: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Update environment variables via HTTP
 * @param deploymentUrl - The deployment URL
 * @param adminKey - The admin key for authentication
 * @param changes - Array of changes, each with name and optional value (omit value to delete)
 */
export async function updateEnvironmentVariablesViaHTTP(
  deploymentUrl: string,
  adminKey: string,
  changes: Array<{ name: string; value?: string }>
): Promise<boolean> {
  const response = await fetch(`${deploymentUrl}${ROUTES.UPDATE_ENVIRONMENT_VARIABLES}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Convex ${adminKey}`,
    },
    body: JSON.stringify({ changes }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`HTTP error! status: ${response.status}, message: ${error.message || 'Unknown error'}`);
  }

  return response.status === 200;
}

/**
 * Set/update a single environment variable
 * @param deploymentUrl - The deployment URL
 * @param adminKey - The admin key
 * @param name - The name of the environment variable
 * @param value - The value of the environment variable
 * @returns The boolean
 */
export async function setEnvironmentVariable(
  deploymentUrl: string,
  adminKey: string,
  name: string,
  value: string
): Promise<boolean> {
  return updateEnvironmentVariablesViaHTTP(deploymentUrl, adminKey, [
    { name, value },
  ]);
}

/**
 * Delete an environment variable (set value to undefined/null)
 * @param deploymentUrl - The deployment URL
 * @param adminKey - The admin key
 * @param name - The name of the environment variable
 * @returns The boolean
 */
export async function deleteEnvironmentVariable(
  deploymentUrl: string,
  adminKey: string,
  name: string
): Promise<boolean> {
  return updateEnvironmentVariablesViaHTTP(deploymentUrl, adminKey, [
    { name }, // No value means delete
  ]);
}

/**
 * Batch update multiple environment variables
 * @param deploymentUrl - The deployment URL
 * @param adminKey - The admin key
 * @param updates - The updates to make
 * @param deletes - The names of the environment variables to delete
 * @returns The boolean
    */
export async function batchUpdateEnvironmentVariables(
  deploymentUrl: string,
  adminKey: string,
  updates: Record<string, string>,
  deletes: string[] = []
): Promise<boolean> {
  const changes = [
    ...Object.entries(updates).map(([name, value]) => ({ name, value })),
    ...deletes.map(name => ({ name })),
  ];

  return updateEnvironmentVariablesViaHTTP(deploymentUrl, adminKey, changes);
}

