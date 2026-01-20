/**
 * GitHub API Service
 *
 * Direct API calls to GitHub for:
 * - Fetching repository contents
 * - Getting commit history
 * - Reading schema.ts files
 *
 * Includes retry with exponential backoff for rate limiting and transient errors.
 */

import type { GitHubRepo, GitHubCommit, GitHubInstallation } from "./types";

const GITHUB_API_URL = "https://api.github.com";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

/**
 * Delay for a specified number of milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a fetch with exponential backoff retry
 * Retries on rate limiting (429) and server errors (5xx)
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<Response> {
  // If signal is already aborted, don't proceed
  if (options.signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Check if aborted before making request
      if (options.signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      const response = await fetch(url, options);

      // Check for retryable status codes
      if (response.status === 429 || response.status >= 500) {
        if (attempt < config.maxRetries) {
          // Calculate delay with exponential backoff
          let delayMs = Math.min(
            config.baseDelayMs * Math.pow(2, attempt),
            config.maxDelayMs,
          );

          // Check for Retry-After header (GitHub sends this on rate limiting)
          const retryAfter = response.headers.get("Retry-After");
          if (retryAfter) {
            const retryAfterSeconds = parseInt(retryAfter, 10);
            if (!isNaN(retryAfterSeconds)) {
              delayMs = Math.min(retryAfterSeconds * 1000, config.maxDelayMs);
            }
          }

          console.log(
            `[GitHub API] Rate limited/error (${response.status}), retrying in ${delayMs}ms (attempt ${attempt + 1}/${config.maxRetries})`,
          );
          await delay(delayMs);
          continue;
        }
      }

      return response;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));

      // Network errors - retry
      if (attempt < config.maxRetries) {
        const delayMs = Math.min(
          config.baseDelayMs * Math.pow(2, attempt),
          config.maxDelayMs,
        );
        console.log(
          `[GitHub API] Request failed, retrying in ${delayMs}ms (attempt ${attempt + 1}/${config.maxRetries}):`,
          lastError.message,
        );
        await delay(delayMs);
      }
    }
  }

  throw lastError || new Error("Request failed after retries");
}

/**
 * Create headers for GitHub API requests
 */
function githubHeaders(token: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

/**
 * Get the GitHub App installation URL
 */
export async function getInstallUrl(): Promise<string> {
  const response = await fetchWithRetry(
    `${API_BASE_URL}/v1/github/app/install-url`,
    {},
  );
  if (!response.ok) {
    throw new Error("Failed to get install URL");
  }
  const data = await response.json();
  return data.install_url;
}

/**
 * List GitHub App installations for the authenticated user
 */
export async function listInstallations(
  token: string,
): Promise<GitHubInstallation[]> {
  const response = await fetchWithRetry(
    `${API_BASE_URL}/v1/github/app/installations`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch installations");
  }

  const data = await response.json();
  return data.installations;
}

/**
 * List repositories accessible via GitHub App installations
 */
export async function listAppRepos(
  token: string,
  installationId?: number,
): Promise<GitHubRepo[]> {
  const url = new URL(`${API_BASE_URL}/v1/github/app/repos`);
  if (installationId) {
    url.searchParams.set("installation_id", installationId.toString());
  }

  const response = await fetchWithRetry(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch repositories");
  }

  const data = await response.json();
  return data.repositories;
}

/**
 * List all repositories the user has access to (direct API call)
 */
export async function listUserRepos(token: string): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const response = await fetchWithRetry(
      `${GITHUB_API_URL}/user/repos?per_page=${perPage}&page=${page}&sort=updated`,
      { headers: githubHeaders(token) },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch repositories");
    }

    const data = await response.json();
    if (data.length === 0) break;

    repos.push(
      ...data.map((repo: GitHubRepo) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private,
        owner: {
          login: repo.owner.login,
          avatar_url: repo.owner.avatar_url,
        },
        default_branch: repo.default_branch,
      })),
    );

    if (data.length < perPage) break;
    page++;
  }

  return repos;
}

/**
 * Get file content from a repository
 */
export async function getFileContent(
  token: string,
  owner: string,
  repo: string,
  path: string,
  ref?: string,
): Promise<string> {
  const url = new URL(
    `${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}`,
  );
  if (ref) {
    url.searchParams.set("ref", ref);
  }

  const response = await fetchWithRetry(url.toString(), {
    headers: githubHeaders(token),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`File not found: ${path}`);
    }
    throw new Error("Failed to fetch file content");
  }

  const data = await response.json();

  // GitHub returns base64 encoded content
  if (data.encoding === "base64" && data.content) {
    return atob(data.content.replace(/\n/g, ""));
  }

  throw new Error("Unexpected file encoding");
}

/**
 * Get commit history for a file
 * @param sha - Branch name or commit SHA to start listing commits from
 */
export async function getFileCommits(
  token: string,
  owner: string,
  repo: string,
  path: string,
  perPage = 30,
  sha?: string,
): Promise<GitHubCommit[]> {
  const url = new URL(`${GITHUB_API_URL}/repos/${owner}/${repo}/commits`);
  url.searchParams.set("path", path);
  url.searchParams.set("per_page", perPage.toString());
  if (sha) {
    url.searchParams.set("sha", sha);
  }

  console.log("[GitHub API] 🌐 Fetching commits:", {
    url: url.toString(),
    owner,
    repo,
    path,
    sha,
    perPage,
  });

  const response = await fetchWithRetry(url.toString(), {
    headers: githubHeaders(token),
  });

  if (!response.ok) {
    console.error("[GitHub API] ❌ Failed to fetch commit history:", {
      status: response.status,
      statusText: response.statusText,
    });
    throw new Error("Failed to fetch commit history");
  }

  const data = await response.json();
  console.log(`[GitHub API] ✅ Fetched ${data.length} commits`);

  return data.map(
    (item: {
      sha: string;
      commit: GitHubCommit["author"] & {
        message: string;
        author: GitHubCommit["author"];
        committer: GitHubCommit["committer"];
      };
    }) => ({
      sha: item.sha,
      message: item.commit.message,
      author: item.commit.author,
      committer: item.commit.committer,
    }),
  );
}

/**
 * Search for schema.ts files in a repository
 */
export async function findSchemaFiles(
  token: string,
  owner: string,
  repo: string,
): Promise<string[]> {
  // Search for schema.ts files
  const response = await fetchWithRetry(
    `${GITHUB_API_URL}/search/code?q=filename:schema.ts+repo:${owner}/${repo}`,
    { headers: githubHeaders(token) },
  );

  if (!response.ok) {
    // Search API has strict rate limits, fall back to checking common locations
    const commonPaths = [
      "convex/schema.ts",
      "src/convex/schema.ts",
      "schema.ts",
    ];
    const found: string[] = [];

    for (const path of commonPaths) {
      try {
        await getFileContent(token, owner, repo, path);
        found.push(path);
      } catch {
        // File doesn't exist at this path
      }
    }

    return found;
  }

  const data = await response.json();
  return data.items.map((item: { path: string }) => item.path);
}

/**
 * Get repository branches with pagination
 */
export async function listBranches(
  token: string,
  owner: string,
  repo: string,
  options?: { perPage?: number; page?: number },
): Promise<Array<{ name: string; commit: { sha: string } }>> {
  const perPage = options?.perPage ?? 100;
  const page = options?.page ?? 1;

  const response = await fetchWithRetry(
    `${GITHUB_API_URL}/repos/${owner}/${repo}/branches?per_page=${perPage}&page=${page}`,
    { headers: githubHeaders(token) },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch branches");
  }

  return response.json();
}

/**
 * Get all branches for a repository (handles pagination automatically)
 */
export async function listAllBranches(
  token: string,
  owner: string,
  repo: string,
): Promise<Array<{ name: string; commit: { sha: string } }>> {
  const branches: Array<{ name: string; commit: { sha: string } }> = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const pageBranches = await listBranches(token, owner, repo, {
      perPage,
      page,
    });

    branches.push(...pageBranches);

    if (pageBranches.length < perPage) break;
    page++;
  }

  return branches;
}

/**
 * Search repositories the user has access to using GitHub Search API
 * Triggers after 3+ characters typed
 *
 * Note: We search across all repos user can access (not just owned repos)
 * because `user:@me` doesn't work reliably with Device Flow OAuth tokens.
 * We then filter to repos the user has push access to or is a collaborator on.
 */
export async function searchUserRepos(
  token: string,
  query: string,
  options?: { perPage?: number; signal?: AbortSignal; username?: string },
): Promise<GitHubRepo[]> {
  const perPage = options?.perPage ?? 30;

  try {
    // Build search query
    // If we have a username, search user's repos and orgs they belong to
    // Otherwise, just search by name which will include repos user has access to
    let searchQuery = `${query} in:name`;

    // If username is provided, add user qualifier for better results
    if (options?.username) {
      // Search for repos where user is owner OR is a member of the org
      // Using `user:` finds repos owned by that user
      searchQuery = `${query} in:name user:${options.username}`;
    }

    const response = await fetchWithRetry(
      `${GITHUB_API_URL}/search/repositories?q=${encodeURIComponent(searchQuery)}&per_page=${perPage}&sort=updated`,
      {
        headers: githubHeaders(token),
        signal: options?.signal,
      },
    );

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 403) {
        console.warn("GitHub search rate limited or forbidden");
        return [];
      }
      if (response.status === 422) {
        console.warn("GitHub search query validation failed");
        return [];
      }
      // Search API might fail for certain queries, fall back to empty
      console.warn("GitHub search failed, status:", response.status);
      return [];
    }

    const data = await response.json();
    return data.items.map((repo: GitHubRepo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      private: repo.private,
      owner: {
        login: repo.owner.login,
        avatar_url: repo.owner.avatar_url,
      },
      default_branch: repo.default_branch,
    }));
  } catch (e) {
    console.error("GitHub search error:", e);
    return [];
  }
}

/**
 * Get a specific commit
 */
export async function getCommit(
  token: string,
  owner: string,
  repo: string,
  sha: string,
): Promise<{
  sha: string;
  commit: {
    message: string;
    author: { name: string; email: string; date: string };
  };
  files?: Array<{ filename: string; status: string }>;
}> {
  const response = await fetchWithRetry(
    `${GITHUB_API_URL}/repos/${owner}/${repo}/commits/${sha}`,
    { headers: githubHeaders(token) },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch commit");
  }

  return response.json();
}

/**
 * Compare two commits
 */
export async function compareCommits(
  token: string,
  owner: string,
  repo: string,
  base: string,
  head: string,
): Promise<{
  files: Array<{
    filename: string;
    status: "added" | "removed" | "modified" | "renamed";
    patch?: string;
  }>;
}> {
  const response = await fetchWithRetry(
    `${GITHUB_API_URL}/repos/${owner}/${repo}/compare/${base}...${head}`,
    { headers: githubHeaders(token) },
  );

  if (!response.ok) {
    throw new Error("Failed to compare commits");
  }

  return response.json();
}
