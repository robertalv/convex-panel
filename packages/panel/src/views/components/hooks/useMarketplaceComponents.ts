/**
 * Hook for fetching marketplace components
 */

import { useState, useEffect, useCallback } from "react";

// Types are defined inline to avoid build dependency issues
// These match the types in @convex-panel/shared/src/types/marketplace.ts

export type MarketplaceCategory =
  | "ai"
  | "backend"
  | "database"
  | "durable-functions"
  | "integrations"
  | "payments";

export interface MarketplaceComponent {
  id: string;
  title: string;
  description: string;
  category: MarketplaceCategory;
  npmPackage: string;
  repoUrl: string;
  weeklyDownloads: number;
  author: {
    username: string;
    avatar: string;
  };
  image?: {
    src: string;
    width?: number;
    height?: number;
  };
}

export interface MarketplaceResponse {
  components: MarketplaceComponent[];
  fetchedAt: number;
  source: "remote" | "cache" | "static";
}

const CONVEX_COMPONENTS_URL = "https://www.convex.dev/components";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// In-memory cache
let cachedComponents: MarketplaceComponent[] | null = null;
let cacheTimestamp: number = 0;

/**
 * Clear the cache
 */
function clearMarketplaceCache(): void {
  cachedComponents = null;
  cacheTimestamp = 0;
}

/**
 * Fetch marketplace components
 */
async function fetchMarketplaceComponents(): Promise<MarketplaceResponse> {
  const now = Date.now();

  // Return cached data if still valid
  if (cachedComponents && now - cacheTimestamp < CACHE_TTL_MS) {
    return {
      components: cachedComponents,
      fetchedAt: cacheTimestamp,
      source: "cache",
    };
  }

  try {
    const response = await fetch(CONVEX_COMPONENTS_URL, {
      headers: {
        Accept: "text/html",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const components = parseComponentsFromHtml(html);

    if (components.length > 0) {
      cachedComponents = components;
      cacheTimestamp = now;

      return {
        components,
        fetchedAt: now,
        source: "remote",
      };
    }

    throw new Error("No components parsed from HTML");
  } catch (error) {
    console.warn(
      "Failed to fetch marketplace components, using static data:",
      error,
    );

    const staticComponents = getStaticComponents();
    return {
      components: staticComponents,
      fetchedAt: now,
      source: "static",
    };
  }
}

/**
 * Parse component data from HTML
 */
function parseComponentsFromHtml(html: string): MarketplaceComponent[] {
  const components: MarketplaceComponent[] = [];

  try {
    // Look for the components array in the RSC payload
    const escapedPattern = /\\"components\\":\s*\[/;
    const unescapedPattern = /"components":\s*\[/;

    let match = html.match(escapedPattern);
    let isEscaped = true;

    if (!match) {
      match = html.match(unescapedPattern);
      isEscaped = false;
    }

    if (!match || match.index === undefined) {
      return [];
    }

    const startIndex = match.index;
    const chunk = html.substring(startIndex, startIndex + 150000);

    let jsonChunk = isEscaped
      ? chunk.replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\\\/g, "\\")
      : chunk;

    const arrayStart = jsonChunk.indexOf("[");
    if (arrayStart === -1) return [];

    let depth = 0;
    let arrayEnd = -1;
    for (let i = arrayStart; i < jsonChunk.length; i++) {
      if (jsonChunk[i] === "[") depth++;
      if (jsonChunk[i] === "]") depth--;
      if (depth === 0) {
        arrayEnd = i + 1;
        break;
      }
    }

    if (arrayEnd === -1) return [];

    const arrayJson = jsonChunk.substring(arrayStart, arrayEnd);
    const rawComponents = JSON.parse(arrayJson);

    for (const comp of rawComponents) {
      if (!comp.id || !comp.npmPackage) continue;

      const component: MarketplaceComponent = {
        id: comp.id,
        title: comp.title || formatTitle(comp.id),
        description: comp.description || "",
        category: normalizeCategory(comp.category),
        npmPackage: comp.npmPackage,
        repoUrl: comp.repo || `https://github.com/get-convex/${comp.id}`,
        weeklyDownloads: comp.weeklyDownloads || 0,
        author: {
          username: comp.author?.username || "get-convex",
          avatar:
            comp.author?.avatar ||
            "https://avatars.githubusercontent.com/u/81530787?v=4",
        },
        image: comp.image
          ? {
              src: comp.image.src?.startsWith("http")
                ? comp.image.src
                : `https://www.convex.dev${comp.image.src}`,
              width: comp.image.width,
              height: comp.image.height,
            }
          : undefined,
      };

      components.push(component);
    }
  } catch (error) {
    console.error("Error parsing components from HTML:", error);
  }

  return components;
}

function normalizeCategory(category: string): MarketplaceCategory {
  const normalized = category?.toLowerCase().replace(/\s+/g, "-") || "backend";

  const validCategories: MarketplaceCategory[] = [
    "ai",
    "backend",
    "database",
    "durable-functions",
    "integrations",
    "payments",
  ];

  return validCategories.includes(normalized as MarketplaceCategory)
    ? (normalized as MarketplaceCategory)
    : "backend";
}

function formatTitle(id: string): string {
  return id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getStaticComponents(): MarketplaceComponent[] {
  return [
    {
      id: "agent",
      title: "AI Agent",
      description:
        "Agents organize your AI workflows into units, with message history and vector search built in.",
      category: "ai",
      npmPackage: "@convex-dev/agent",
      repoUrl: "https://github.com/get-convex/agent",
      weeklyDownloads: 17303,
      author: {
        username: "get-convex",
        avatar: "https://avatars.githubusercontent.com/u/81530787?v=4",
      },
    },
    {
      id: "rag",
      title: "RAG",
      description:
        "Retrieval-Augmented Generation (RAG) for use with your AI products and Agents",
      category: "ai",
      npmPackage: "@convex-dev/rag",
      repoUrl: "https://github.com/get-convex/rag",
      weeklyDownloads: 7039,
      author: {
        username: "get-convex",
        avatar: "https://avatars.githubusercontent.com/u/81530787?v=4",
      },
    },
    {
      id: "workpool",
      title: "Workpool",
      description:
        "Workpools give critical tasks priority by organizing async operations into separate, customizable queues.",
      category: "durable-functions",
      npmPackage: "@convex-dev/workpool",
      repoUrl: "https://github.com/get-convex/workpool",
      weeklyDownloads: 44567,
      author: {
        username: "get-convex",
        avatar: "https://avatars.githubusercontent.com/u/81530787?v=4",
      },
    },
    {
      id: "workflow",
      title: "Workflow",
      description:
        "Simplify programming long running code flows. Workflows execute durably with configurable retries and delays.",
      category: "durable-functions",
      npmPackage: "@convex-dev/workflow",
      repoUrl: "https://github.com/get-convex/workflow",
      weeklyDownloads: 18074,
      author: {
        username: "get-convex",
        avatar: "https://avatars.githubusercontent.com/u/81530787?v=4",
      },
    },
    {
      id: "rate-limiter",
      title: "Rate Limiter",
      description:
        "Define and use application-layer rate limits. Type-safe, transactional, fair, safe, and configurable sharding to scale.",
      category: "backend",
      npmPackage: "@convex-dev/rate-limiter",
      repoUrl: "https://github.com/get-convex/rate-limiter",
      weeklyDownloads: 29194,
      author: {
        username: "get-convex",
        avatar: "https://avatars.githubusercontent.com/u/81530787?v=4",
      },
    },
    {
      id: "migrations",
      title: "Migrations",
      description: "Framework for long running data migrations of live data.",
      category: "database",
      npmPackage: "@convex-dev/migrations",
      repoUrl: "https://github.com/get-convex/migrations",
      weeklyDownloads: 25348,
      author: {
        username: "get-convex",
        avatar: "https://avatars.githubusercontent.com/u/81530787?v=4",
      },
    },
    {
      id: "better-auth",
      title: "Better Auth",
      description:
        "Provides an integration layer for using Better Auth with Convex.",
      category: "integrations",
      npmPackage: "@convex-dev/better-auth",
      repoUrl: "https://github.com/get-convex/better-auth",
      weeklyDownloads: 22350,
      author: {
        username: "get-convex",
        avatar: "https://avatars.githubusercontent.com/u/81530787?v=4",
      },
    },
    {
      id: "resend",
      title: "Resend",
      description:
        "Send reliable transactional emails to your users with Resend.",
      category: "integrations",
      npmPackage: "@convex-dev/resend",
      repoUrl: "https://github.com/get-convex/resend",
      weeklyDownloads: 20900,
      author: {
        username: "get-convex",
        avatar: "https://avatars.githubusercontent.com/u/81530787?v=4",
      },
    },
    {
      id: "stripe",
      title: "Stripe",
      description:
        "Integrates Stripe payments, subscriptions, and billing into your Convex application.",
      category: "payments",
      npmPackage: "@convex-dev/stripe",
      repoUrl: "https://github.com/get-convex/stripe",
      weeklyDownloads: 4627,
      author: {
        username: "get-convex",
        avatar: "https://avatars.githubusercontent.com/u/81530787?v=4",
      },
    },
    {
      id: "polar",
      title: "Polar",
      description:
        "Add subscriptions and billing to your Convex app with Polar.",
      category: "payments",
      npmPackage: "@convex-dev/polar",
      repoUrl: "https://github.com/get-convex/polar",
      weeklyDownloads: 3644,
      author: {
        username: "get-convex",
        avatar: "https://avatars.githubusercontent.com/u/81530787?v=4",
      },
    },
  ];
}

export interface UseMarketplaceComponentsOptions {
  /** Whether to fetch on mount */
  enabled?: boolean;
  /** Category filter */
  category?: MarketplaceCategory | "all";
  /** Search query */
  searchQuery?: string;
}

export interface UseMarketplaceComponentsResult {
  /** List of components */
  components: MarketplaceComponent[];
  /** Filtered components based on category and search */
  filteredComponents: MarketplaceComponent[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Error if fetch failed */
  error: string | null;
  /** Data source (remote, cache, or static) */
  source: "remote" | "cache" | "static" | null;
  /** When the data was last fetched */
  fetchedAt: number | null;
  /** Refetch the data */
  refetch: () => Promise<void>;
  /** Clear cache and refetch */
  clearCacheAndRefetch: () => Promise<void>;
}

/**
 * Hook for fetching and managing marketplace components
 */
export function useMarketplaceComponents(
  options: UseMarketplaceComponentsOptions = {},
): UseMarketplaceComponentsResult {
  const { enabled = true, category = "all", searchQuery = "" } = options;

  const [components, setComponents] = useState<MarketplaceComponent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"remote" | "cache" | "static" | null>(
    null,
  );
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);

  const fetchComponents = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchMarketplaceComponents();
      setComponents(response.components);
      setSource(response.source);
      setFetchedAt(response.fetchedAt);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch components",
      );
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  const clearCacheAndRefetch = useCallback(async () => {
    clearMarketplaceCache();
    await fetchComponents();
  }, [fetchComponents]);

  // Fetch on mount
  useEffect(() => {
    fetchComponents();
  }, [fetchComponents]);

  // Filter components based on category and search
  const filteredComponents = components.filter((component) => {
    // Category filter
    if (category !== "all" && component.category !== category) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = component.title.toLowerCase().includes(query);
      const matchesDescription = component.description
        .toLowerCase()
        .includes(query);
      const matchesPackage = component.npmPackage.toLowerCase().includes(query);
      const matchesId = component.id.toLowerCase().includes(query);

      if (
        !matchesTitle &&
        !matchesDescription &&
        !matchesPackage &&
        !matchesId
      ) {
        return false;
      }
    }

    return true;
  });

  return {
    components,
    filteredComponents,
    isLoading,
    error,
    source,
    fetchedAt,
    refetch: fetchComponents,
    clearCacheAndRefetch,
  };
}

/**
 * Get all available categories from components
 */
export function getAvailableCategories(
  components: MarketplaceComponent[],
): MarketplaceCategory[] {
  const categories = new Set<MarketplaceCategory>();
  components.forEach((c) => categories.add(c.category));
  return Array.from(categories).sort();
}

/**
 * Category display names
 */
export const CATEGORY_LABELS: Record<MarketplaceCategory, string> = {
  ai: "AI",
  backend: "Backend",
  database: "Database",
  "durable-functions": "Durable Functions",
  integrations: "Integrations",
  payments: "Payments",
};
