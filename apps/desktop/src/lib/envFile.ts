/**
 * Utilities for reading and writing to .env.local files in project directories
 */
import { invoke } from "@tauri-apps/api/core";

const ENV_LOCAL_FILENAME = ".env.local";
const DEPLOY_KEY_VAR = "CONVEX_DEPLOY_KEY";

/**
 * Get the full path to .env.local in a project directory
 */
function getEnvLocalPath(projectPath: string): string {
  // Normalize path separators and ensure no trailing slash
  const normalizedPath = projectPath.replace(/\\/g, "/").replace(/\/$/, "");
  return `${normalizedPath}/${ENV_LOCAL_FILENAME}`;
}

/**
 * Write the CONVEX_DEPLOY_KEY to .env.local in the project directory
 * Creates the file if it doesn't exist, updates if it does
 */
export async function writeDeployKeyToEnvLocal(
  projectPath: string,
  deployKey: string,
): Promise<void> {
  const filePath = getEnvLocalPath(projectPath);

  await invoke("write_env_variable", {
    filePath,
    key: DEPLOY_KEY_VAR,
    value: deployKey,
  });
}

/**
 * Read the CONVEX_DEPLOY_KEY from .env.local in the project directory
 * Returns null if file doesn't exist or key is not found
 */
export async function readDeployKeyFromEnvLocal(
  projectPath: string,
): Promise<string | null> {
  const filePath = getEnvLocalPath(projectPath);

  const result = await invoke<string | null>("read_env_variable", {
    filePath,
    key: DEPLOY_KEY_VAR,
  });

  return result;
}

/**
 * Check if .env.local exists in the project directory
 */
export async function envLocalExists(projectPath: string): Promise<boolean> {
  try {
    const filePath = getEnvLocalPath(projectPath);
    // Try to read the file - if it doesn't exist, read_env_variable returns null
    // But we can check by trying to read any key
    await invoke<string | null>("read_env_variable", {
      filePath,
      key: "__CHECK_EXISTS__",
    });
    // If we got here without error, the file exists (even if key not found)
    return true;
  } catch {
    // File doesn't exist or can't be read
    return false;
  }
}

/**
 * Get a preview of the deploy key (first 20 chars + ...)
 */
export function getKeyPreview(key: string): string {
  if (key.length <= 24) return key;
  return `${key.slice(0, 20)}...`;
}

/**
 * Deploy key types supported by Convex
 */
export type DeployKeyType = "dev" | "prod" | "preview" | "project";

/**
 * Parsed deploy key structure
 */
export interface ParsedDeployKey {
  /** The type of deployment (dev, prod, preview, project) */
  type: DeployKeyType;
  /** The deployment name (e.g., "dutiful-lion-632") */
  deploymentName: string;
  /** The token portion of the key */
  token: string;
  /** The full original key */
  fullKey: string;
}

/**
 * Parse a Convex deploy key into its components.
 * Deploy keys have the format: {type}:{deployment-name}|{token}
 * Example: dev:dutiful-lion-632|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 * @param key - The deploy key to parse
 * @returns Parsed key object or null if the key is invalid
 */
export function parseDeployKey(key: string): ParsedDeployKey | null {
  if (!key || typeof key !== "string") {
    return null;
  }

  const trimmedKey = key.trim();

  // Check for the pipe separator
  const pipeIndex = trimmedKey.indexOf("|");
  if (pipeIndex === -1) {
    return null;
  }

  const prefix = trimmedKey.substring(0, pipeIndex);
  const token = trimmedKey.substring(pipeIndex + 1);

  if (!token) {
    return null;
  }

  // Parse the prefix: {type}:{deployment-name}
  const colonIndex = prefix.indexOf(":");
  if (colonIndex === -1) {
    return null;
  }

  const type = prefix.substring(0, colonIndex);
  const deploymentName = prefix.substring(colonIndex + 1);

  // Validate the type
  const validTypes: DeployKeyType[] = ["dev", "prod", "preview", "project"];
  if (!validTypes.includes(type as DeployKeyType)) {
    return null;
  }

  // Validate deployment name is not empty
  if (!deploymentName) {
    return null;
  }

  return {
    type: type as DeployKeyType,
    deploymentName,
    token,
    fullKey: trimmedKey,
  };
}

/**
 * Check if a deploy key matches the expected deployment.
 *
 * @param key - The deploy key to validate
 * @param expectedDeploymentName - The deployment name the key should match
 * @returns true if the key is valid and matches the deployment, false otherwise
 */
export function doesKeyMatchDeployment(
  key: string,
  expectedDeploymentName: string,
): boolean {
  const parsed = parseDeployKey(key);
  if (!parsed) {
    return false;
  }

  return parsed.deploymentName === expectedDeploymentName;
}

/**
 * Validate a deploy key format and optionally check it matches a deployment.
 *
 * @param key - The deploy key to validate
 * @param expectedDeploymentName - Optional deployment name to match against
 * @returns Object with validation result and error message if invalid
 */
export function validateDeployKey(
  key: string,
  expectedDeploymentName?: string,
): { valid: boolean; error?: string; parsed?: ParsedDeployKey } {
  const parsed = parseDeployKey(key);

  if (!parsed) {
    return {
      valid: false,
      error:
        "Invalid key format. Keys should be in the format: {type}:{deployment-name}|{token}",
    };
  }

  if (
    expectedDeploymentName &&
    parsed.deploymentName !== expectedDeploymentName
  ) {
    return {
      valid: false,
      error: `Key is for deployment "${parsed.deploymentName}" but expected "${expectedDeploymentName}"`,
      parsed,
    };
  }

  return { valid: true, parsed };
}
