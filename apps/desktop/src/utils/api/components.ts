/**
 * Component management operations
 * Handles fetching and deleting components
 */

import { SYSTEM_QUERIES } from "../api-constants";
import type { Component } from "./types";

/**
 * Get components for a deployment
 * @param adminClient - The Convex admin client instance
 * @returns The components
 */
export async function getComponents(adminClient: any): Promise<Component[]> {
  if (!adminClient) {
    throw new Error("Admin client not available");
  }

  try {
    const result = await adminClient.query(SYSTEM_QUERIES.LIST_COMPONENTS, {});

    // The result might be directly an array, or wrapped in a status object
    if (Array.isArray(result)) {
      return result;
    }

    if (result && typeof result === "object") {
      if (result.status === "success" && result.value) {
        return Array.isArray(result.value) ? result.value : [];
      }
      // If it's already an object with components, try to return it directly
      if (Array.isArray(result.components)) {
        return result.components;
      }
    }

    return [];
  } catch (error: any) {
    throw new Error(
      `Failed to get components: ${error?.message || "Unknown error"}`,
    );
  }
}

/**
 * Delete a component
 * @param deploymentUrl - The deployment URL
 * @param adminKey - The admin key
 * @param componentId - The component ID
 * @returns Promise<void>
 */
export async function deleteComponent(
  deploymentUrl: string,
  adminKey: string,
  componentId: string,
): Promise<void> {
  const response = await fetch(`${deploymentUrl}/api/delete_component`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Convex ${adminKey}`,
    },
    body: JSON.stringify({
      componentId,
    }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Unknown error" }));
    throw new Error(
      `HTTP error! status: ${response.status}, message: ${error.message || "Unknown error"}`,
    );
  }
}
