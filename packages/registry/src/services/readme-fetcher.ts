/**
 * README Fetcher Service
 *
 * Fetches README markdown from GitHub or npm for components.
 * Prioritizes GitHub, falls back to npm if GitHub fails.
 */

import type { RegistryComponent } from "../types";

/**
 * Parse GitHub URL to extract owner, repo, branch, and path
 */
function parseGitHubUrl(repoUrl: string): {
  owner: string;
  repo: string;
  branch: string;
  path?: string;
} | null {
  try {
    const url = new URL(repoUrl);
    
    // Must be a GitHub URL
    if (url.hostname !== "github.com" && url.hostname !== "www.github.com") {
      return null;
    }

    const pathParts = url.pathname.split("/").filter(Boolean);
    
    if (pathParts.length < 2) {
      return null;
    }

    const owner = pathParts[0];
    const repo = pathParts[1];
    
    // Check if there's a tree path (e.g., /tree/main/packages/package-name)
    let branch = "main";
    let path: string | undefined;

    const treeIndex = pathParts.indexOf("tree");
    if (treeIndex !== -1 && pathParts.length > treeIndex + 1) {
      branch = pathParts[treeIndex + 1];
      if (pathParts.length > treeIndex + 2) {
        path = pathParts.slice(treeIndex + 2).join("/");
      }
    }

    return { owner, repo, branch, path };
  } catch {
    return null;
  }
}

/**
 * Fetch README from GitHub using raw content API
 */
export async function fetchReadmeFromGitHub(
  repoUrl: string,
): Promise<{ content: string; source: "github" }> {
  const parsed = parseGitHubUrl(repoUrl);
  
  if (!parsed) {
    throw new Error(`Invalid GitHub URL: ${repoUrl}`);
  }

  const { owner, repo, branch, path } = parsed;
  
  // Try different README file names and locations
  const readmePaths = path
    ? [
        `${path}/README.md`,
        `${path}/readme.md`,
        `${path}/Readme.md`,
        "README.md", // Fallback to root
      ]
    : ["README.md", "readme.md", "Readme.md"];

  let lastError: Error | null = null;

  for (const readmePath of readmePaths) {
    try {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${readmePath}`;
      
      const response = await fetch(rawUrl, {
        headers: {
          Accept: "text/plain",
        },
      });

      if (response.ok) {
        const content = await response.text();
        if (content.trim()) {
          return { content, source: "github" };
        }
      } else if (response.status === 404) {
        // Try next path
        continue;
      } else if (response.status === 403 || response.status === 429) {
        // Rate limited
        throw new Error(
          `GitHub rate limit exceeded. Status: ${response.status}`,
        );
      } else {
        throw new Error(
          `Failed to fetch README from GitHub. Status: ${response.status}`,
        );
      }
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error("Unknown error fetching from GitHub");
      
      // If it's a rate limit or network error, don't try other paths
      if (
        lastError.message.includes("rate limit") ||
        lastError.message.includes("Failed to fetch")
      ) {
        throw lastError;
      }
      // Otherwise, continue to next path
      continue;
    }
  }

  // If we get here, all paths failed
  throw (
    lastError ||
    new Error(`README not found in GitHub repository: ${repoUrl}`)
  );
}

/**
 * Fetch README from npm registry
 */
export async function fetchReadmeFromNpm(
  packageName: string,
): Promise<{ content: string; source: "npm" }> {
  try {
    const registryUrl = `https://registry.npmjs.org/${encodeURIComponent(
      packageName,
    )}/latest`;

    const response = await fetch(registryUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Package not found on npm: ${packageName}`);
      }
      throw new Error(
        `Failed to fetch package from npm. Status: ${response.status}`,
      );
    }

    const data = (await response.json()) as {
      readme?: string;
    };

    // npm packages can have readme field
    if (data.readme && typeof data.readme === "string") {
      return { content: data.readme, source: "npm" };
    }

    throw new Error(`No README found in npm package: ${packageName}`);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Unknown error fetching from npm: ${packageName}`);
  }
}

/**
 * Fetch README for a component
 * Tries GitHub first, falls back to npm if GitHub fails
 */
export async function fetchComponentReadme(
  component: RegistryComponent,
): Promise<{ content: string; source: "github" | "npm" }> {
  // Try GitHub first if repoUrl is available
  if (component.repoUrl) {
    try {
      return await fetchReadmeFromGitHub(component.repoUrl);
    } catch (error) {
      // If GitHub fails but it's not a rate limit, try npm
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      
      // If it's a rate limit, we should still try npm as fallback
      // If npm package is available, try it
      if (component.npmPackage) {
        try {
          return await fetchReadmeFromNpm(component.npmPackage);
        } catch (npmError) {
          // Both failed, throw the original GitHub error
          throw error;
        }
      }
      
      // No npm fallback available, throw GitHub error
      throw error;
    }
  }

  // No GitHub URL, try npm if available
  if (component.npmPackage) {
    return await fetchReadmeFromNpm(component.npmPackage);
  }

  // Neither source available
  throw new Error(
    `No README source available for component: ${component.id}. Missing both repoUrl and npmPackage.`,
  );
}
