/**
 * Marketplace API for fetching Convex components from convex.dev/components
 */

import type {
  MarketplaceComponent,
  MarketplaceResponse,
  MarketplaceCategory,
} from "../types/marketplace";

const CONVEX_COMPONENTS_URL = "https://www.convex.dev/components";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// In-memory cache
let cachedComponents: MarketplaceComponent[] | null = null;
let cacheTimestamp: number = 0;

/**
 * Fetches components from convex.dev/components
 * Falls back to static data if fetch fails
 */
export async function fetchMarketplaceComponents(
  fetchFn: typeof fetch = fetch,
): Promise<MarketplaceResponse> {
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
    const response = await fetchFn(CONVEX_COMPONENTS_URL, {
      headers: {
        Accept: "text/html",
        "User-Agent": "ConvexPanel/1.0",
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

    // If parsing returned nothing, use static data
    throw new Error("No components parsed from HTML");
  } catch (error) {
    console.warn(
      "Failed to fetch marketplace components, using static data:",
      error,
    );

    // Return static fallback data
    const staticComponents = getStaticComponents();
    return {
      components: staticComponents,
      fetchedAt: now,
      source: "static",
    };
  }
}

/**
 * Parses component data from convex.dev/components HTML
 * The data is embedded in React Server Component flight format
 */
export function parseComponentsFromHtml(html: string): MarketplaceComponent[] {
  const components: MarketplaceComponent[] = [];

  try {
    // Look for the components array in the RSC payload
    // Pattern: "components":[...] or \"components\":[...]
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

    // Extract a chunk of HTML starting from the match
    const startIndex = match.index;
    const chunk = html.substring(startIndex, startIndex + 150000);

    // Unescape if needed
    let jsonChunk = isEscaped
      ? chunk.replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\\\/g, "\\")
      : chunk;

    // Find the components array
    const arrayStart = jsonChunk.indexOf("[");
    if (arrayStart === -1) return [];

    // Find the matching closing bracket
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

    // Parse the JSON array
    const rawComponents = JSON.parse(arrayJson);

    // Transform to our MarketplaceComponent format
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

/**
 * Normalize category string to MarketplaceCategory
 */
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

/**
 * Format component ID to title
 */
function formatTitle(id: string): string {
  return id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Clear the cache (useful for forcing a refresh)
 */
export function clearMarketplaceCache(): void {
  cachedComponents = null;
  cacheTimestamp = 0;
}

/**
 * Static fallback components data
 * This is used when fetching from convex.dev fails
 */
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
      id: "persistent-text-streaming",
      title: "Persistent Text Streaming",
      description:
        "Stream text like AI chat to the browser in real-time while also efficiently storing it to the database.",
      category: "ai",
      npmPackage: "@convex-dev/persistent-text-streaming",
      repoUrl: "https://github.com/get-convex/persistent-text-streaming",
      weeklyDownloads: 4893,
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
      id: "retrier",
      title: "Action Retrier",
      description:
        "Add reliability to an unreliable external service. Retry idempotent calls a set number of times.",
      category: "durable-functions",
      npmPackage: "@convex-dev/action-retrier",
      repoUrl: "https://github.com/get-convex/action-retrier",
      weeklyDownloads: 13358,
      author: {
        username: "get-convex",
        avatar: "https://avatars.githubusercontent.com/u/81530787?v=4",
      },
    },
    {
      id: "crons",
      title: "Crons",
      description: "Use cronspec to run functions on a repeated schedule.",
      category: "durable-functions",
      npmPackage: "@convex-dev/crons",
      repoUrl: "https://github.com/get-convex/crons",
      weeklyDownloads: 4564,
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
      id: "presence",
      title: "Presence",
      description: "Track user presence in real-time.",
      category: "backend",
      npmPackage: "@convex-dev/presence",
      repoUrl: "https://github.com/get-convex/presence",
      weeklyDownloads: 7708,
      author: {
        username: "get-convex",
        avatar: "https://avatars.githubusercontent.com/u/81530787?v=4",
      },
    },
    {
      id: "action-cache",
      title: "Action Cache",
      description:
        "Cache action results, like expensive AI calls, with optional expiration times.",
      category: "backend",
      npmPackage: "@convex-dev/action-cache",
      repoUrl: "https://github.com/get-convex/action-cache",
      weeklyDownloads: 7500,
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
      id: "aggregate",
      title: "Aggregate",
      description:
        "Keep track of sums and counts in a denormalized and scalable way.",
      category: "database",
      npmPackage: "@convex-dev/aggregate",
      repoUrl: "https://github.com/get-convex/aggregate",
      weeklyDownloads: 11910,
      author: {
        username: "get-convex",
        avatar: "https://avatars.githubusercontent.com/u/81530787?v=4",
      },
    },
    {
      id: "sharded-counter",
      title: "Sharded Counter",
      description:
        "Scalable counter that can increment and decrement with high throughput.",
      category: "database",
      npmPackage: "@convex-dev/sharded-counter",
      repoUrl: "https://github.com/get-convex/sharded-counter",
      weeklyDownloads: 4125,
      author: {
        username: "get-convex",
        avatar: "https://avatars.githubusercontent.com/u/81530787?v=4",
      },
    },
    {
      id: "geospatial",
      title: "Geospatial",
      description:
        "Efficiently query points on a map within a selected region of the globe.",
      category: "database",
      npmPackage: "@convex-dev/geospatial",
      repoUrl: "https://github.com/get-convex/geospatial",
      weeklyDownloads: 1405,
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
      id: "cloudflare-r2",
      title: "Cloudflare R2",
      description: "Store and serve files from Cloudflare R2.",
      category: "integrations",
      npmPackage: "@convex-dev/cloudflare-r2",
      repoUrl: "https://github.com/get-convex/cloudflare-r2",
      weeklyDownloads: 7606,
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
    {
      id: "workos-authkit",
      title: "WorkOS AuthKit",
      description:
        "Integrate with AuthKit events and actions, and keep auth data synced in your Convex database.",
      category: "integrations",
      npmPackage: "@convex-dev/workos-authkit",
      repoUrl: "https://github.com/get-convex/workos-authkit",
      weeklyDownloads: 2869,
      author: {
        username: "get-convex",
        avatar: "https://avatars.githubusercontent.com/u/81530787?v=4",
      },
    },
    {
      id: "prosemirror-sync",
      title: "Collaborative Text Editor Sync",
      description:
        "Add a collaborative editor sync engine for the popular ProseMirror-based Tiptap and BlockNote rich text editors.",
      category: "integrations",
      npmPackage: "@convex-dev/prosemirror-sync",
      repoUrl: "https://github.com/get-convex/prosemirror-sync",
      weeklyDownloads: 3817,
      author: {
        username: "get-convex",
        avatar: "https://avatars.githubusercontent.com/u/81530787?v=4",
      },
    },
    {
      id: "push-notifications",
      title: "Expo Push Notifications",
      description:
        "Send push notifications with Expo. Manage retries and batching.",
      category: "integrations",
      npmPackage: "@convex-dev/push-notifications",
      repoUrl: "https://github.com/get-convex/push-notifications",
      weeklyDownloads: 3267,
      author: {
        username: "get-convex",
        avatar: "https://avatars.githubusercontent.com/u/81530787?v=4",
      },
    },
    {
      id: "twilio",
      title: "Twilio SMS",
      description:
        "Easily send and receive SMS via Twilio. Easily query message status from your query function.",
      category: "integrations",
      npmPackage: "@convex-dev/twilio",
      repoUrl: "https://github.com/get-convex/twilio",
      weeklyDownloads: 1849,
      author: {
        username: "get-convex",
        avatar: "https://avatars.githubusercontent.com/u/81530787?v=4",
      },
    },
    {
      id: "launchdarkly",
      title: "LaunchDarkly Feature Flags",
      description:
        "Sync your LaunchDarkly feature flags with your Convex backend for use in your Convex functions.",
      category: "integrations",
      npmPackage: "@convex-dev/launchdarkly",
      repoUrl: "https://github.com/get-convex/launchdarkly",
      weeklyDownloads: 1349,
      author: {
        username: "get-convex",
        avatar: "https://avatars.githubusercontent.com/u/81530787?v=4",
      },
    },
    {
      id: "autumn",
      title: "Autumn",
      description: "Autumn is your application's pricing and billing database.",
      category: "payments",
      npmPackage: "@convex-dev/autumn",
      repoUrl: "https://github.com/useautumn/autumn",
      weeklyDownloads: 2111,
      author: {
        username: "useautumn",
        avatar: "https://avatars.githubusercontent.com/u/194405912?v=4",
      },
    },
  ];
}
