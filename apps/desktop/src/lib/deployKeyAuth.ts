/**
 * Deploy Key Authentication for Desktop App
 *
 * Provides authentication using Convex deploy keys as an alternative to OAuth.
 * Deploy keys allow direct access to a specific deployment without requiring
 * browser-based authentication.
 *
 * Ported from apps/raycast/src/lib/deployKeyAuth.ts
 */

import { isTauri } from "../utils/desktop";

/**
 * Configuration from deploy key credentials
 */
export interface DeployKeyConfig {
  /** The full deploy key (e.g., "polite-condor-874|017c7d...") */
  deployKey: string;
  /** The deployment URL (e.g., "https://polite-condor-874.convex.cloud") */
  deploymentUrl: string;
  /** Extracted deployment name (e.g., "polite-condor-874") */
  deploymentName: string;
}

/**
 * Extract deployment name from a Convex URL
 * e.g., "https://polite-condor-874.convex.cloud" -> "polite-condor-874"
 */
export function extractDeploymentNameFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // Handle *.convex.cloud format
    if (hostname.endsWith(".convex.cloud")) {
      return hostname.replace(".convex.cloud", "");
    }

    // Handle *.convex.site format
    if (hostname.endsWith(".convex.site")) {
      return hostname.replace(".convex.site", "");
    }

    // For self-hosted or custom domains, try to use the subdomain
    const parts = hostname.split(".");
    if (parts.length > 1) {
      return parts[0];
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Extract deployment name from a deploy key
 * Deploy key format: "instance-name|encrypted-key" or "prod:instance-name|encrypted-key"
 */
export function extractDeploymentNameFromKey(deployKey: string): string | null {
  const pipeIndex = deployKey.indexOf("|");
  if (pipeIndex === -1) {
    return null;
  }

  const prefix = deployKey.substring(0, pipeIndex);

  // Handle "prod:instance-name" format (CONVEX_DEPLOYMENT style)
  if (prefix.includes(":")) {
    const colonIndex = prefix.indexOf(":");
    return prefix.substring(colonIndex + 1);
  }

  // Direct instance name format
  return prefix;
}

/**
 * Build a DeployKeyConfig from raw values
 */
export function buildDeployKeyConfig(
  deployKey: string,
  deploymentUrl: string,
): DeployKeyConfig | null {
  if (!deployKey || !deploymentUrl) {
    return null;
  }

  // Validate and normalize the URL
  const normalizedUrl = deploymentUrl.startsWith("http")
    ? deploymentUrl
    : `https://${deploymentUrl}`;

  // Try to extract deployment name from URL first, then from key
  let deploymentName = extractDeploymentNameFromUrl(normalizedUrl);
  if (!deploymentName) {
    deploymentName = extractDeploymentNameFromKey(deployKey);
  }

  if (!deploymentName) {
    console.error("Could not extract deployment name from URL or deploy key");
    return null;
  }

  return {
    deployKey,
    deploymentUrl: normalizedUrl,
    deploymentName,
  };
}

/**
 * Validate deploy key format
 * Returns error message if invalid, undefined if valid
 */
export function validateDeployKeyFormat(value: string): string | undefined {
  if (!value) {
    return "Deploy key is required";
  }
  if (!value.includes("|")) {
    return "Invalid format. Expected: instance-name|key";
  }
  return undefined;
}

/**
 * Validate deployment URL format
 * Returns error message if invalid, undefined if valid
 */
export function validateDeploymentUrlFormat(value: string): string | undefined {
  if (!value) {
    return "Deployment URL is required";
  }
  try {
    const url = value.startsWith("http") ? value : `https://${value}`;
    new URL(url);
    return undefined;
  } catch {
    return "Invalid URL format";
  }
}

/**
 * Validate deploy key by making a test request to the deployment
 * Returns true if the key is valid, false otherwise
 */
export async function validateDeployKey(
  config: DeployKeyConfig,
  fetchFn?: typeof fetch,
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Use Tauri fetch if available for proper CORS handling
    const doFetch = fetchFn || (async (input: RequestInfo | URL, init?: RequestInit) => {
      if (isTauri()) {
        const { fetch: tauriFetch } = await import("@tauri-apps/plugin-http");
        return tauriFetch(input, init);
      }
      return fetch(input, init);
    });

    // Try to fetch the shapes2 endpoint which requires authentication
    const response = await doFetch(`${config.deploymentUrl}/api/shapes2`, {
      method: "GET",
      headers: {
        Authorization: `Convex ${config.deployKey}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      return { valid: true };
    }

    if (response.status === 401 || response.status === 403) {
      return { valid: false, error: "Invalid deploy key or unauthorized" };
    }

    return { valid: false, error: `Unexpected response: ${response.status}` };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

/**
 * Get HTTP Actions URL from deployment URL
 * e.g., "https://polite-condor-874.convex.cloud" -> "https://polite-condor-874.convex.site"
 */
export function getHttpActionsUrl(deploymentUrl: string): string {
  return deploymentUrl.replace(".convex.cloud", ".convex.site");
}
