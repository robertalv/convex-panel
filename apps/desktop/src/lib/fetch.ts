/**
 * Smart Fetch Utility
 *
 * Intelligently routes HTTP requests to either:
 * - Native browser fetch (for Convex APIs and same-origin requests)
 * - Tauri HTTP plugin (only when necessary for CORS bypass)
 *
 * This dramatically reduces the number of Tauri channels created,
 * which in turn reduces the excessive `plugin:__TAURI_CHANNEL__|fetch` IPC calls.
 */

import { isTauri } from "@/utils/desktop";

/**
 * Extended RequestInit with Tauri-specific options
 */
export interface SmartFetchInit extends RequestInit {
  /**
   * Force using Tauri HTTP plugin even if native fetch would work
   * Useful for endpoints that require Tauri's CORS bypass
   */
  forceTauri?: boolean;

  /**
   * Tauri-specific options
   */
  maxRedirections?: number;
  connectTimeout?: number;
  proxy?: {
    all?: string;
    http?: string;
    https?: string;
  };
  danger?: {
    acceptInvalidCerts?: boolean;
    acceptInvalidHostnames?: boolean;
  };
}

/**
 * Request queue to limit concurrent Tauri HTTP requests
 */
class RequestQueue {
  private queue: Array<() => void> = [];
  private activeCount = 0;
  private maxConcurrent = 5; // Limit concurrent Tauri requests

  async add<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const execute = async () => {
        this.activeCount++;
        try {
          const result = await requestFn();
          resolve(result);
        } catch (e) {
          reject(e);
        } finally {
          this.activeCount--;
          this.processNext();
        }
      };

      this.queue.push(execute);
      this.processNext();
    });
  }

  private processNext() {
    while (this.activeCount < this.maxConcurrent && this.queue.length > 0) {
      const next = this.queue.shift();
      next?.();
    }
  }
}

const tauriRequestQueue = new RequestQueue();

/**
 * Determines if a URL should use native fetch or Tauri HTTP plugin
 */
function shouldUseNativeFetch(url: string): boolean {
  // Always use native fetch for:
  // 1. Convex Cloud URLs (they have proper CORS headers)
  // 2. Convex Site URLs (they have proper CORS headers)
  // 3. localhost URLs (no CORS issues)
  // 4. Relative URLs (same-origin)

  if (url.startsWith("/")) {
    return true; // Relative URL
  }

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // Convex endpoints support CORS properly
    if (
      hostname.endsWith(".convex.cloud") ||
      hostname.endsWith(".convex.site")
    ) {
      return true;
    }

    // Localhost is safe
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return true;
    }

    // Same origin is safe
    if (typeof window !== "undefined") {
      try {
        const currentOrigin = new URL(window.location.href).origin;
        if (urlObj.origin === currentOrigin) {
          return true;
        }
      } catch {
        // Ignore window errors
      }
    }
  } catch {
    // If URL parsing fails, default to native fetch
    return true;
  }

  // For all other external URLs, use Tauri HTTP plugin for CORS bypass
  return false;
}

/**
 * Smart fetch that intelligently chooses between native fetch and Tauri HTTP plugin
 *
 * @example
 * ```typescript
 * // Convex API call - uses native fetch (no Tauri channel created)
 * const response = await smartFetch('https://example.convex.cloud/api/query', {
 *   method: 'POST',
 *   body: JSON.stringify({ ... })
 * });
 *
 * // External API - uses Tauri HTTP plugin for CORS bypass
 * const response = await smartFetch('https://api.github.com/users/octocat', {
 *   forceTauri: true
 * });
 * ```
 */
export async function smartFetch(
  input: RequestInfo | URL,
  init?: SmartFetchInit,
): Promise<Response> {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;

  // Determine if we should use Tauri HTTP plugin
  const shouldUseTauri =
    isTauri() && (init?.forceTauri || !shouldUseNativeFetch(url));

  if (shouldUseTauri) {
    // Use Tauri HTTP plugin with request queuing to limit concurrent channels
    return tauriRequestQueue.add(async () => {
      const { fetch: tauriFetch } = await import("@tauri-apps/plugin-http");
      return tauriFetch(input, init);
    });
  }

  // Use native browser fetch (no Tauri channels created!)
  // Remove Tauri-specific options before passing to native fetch
  const cleanInit = init ? { ...init } : undefined;
  if (cleanInit) {
    delete cleanInit.forceTauri;
    delete cleanInit.maxRedirections;
    delete cleanInit.connectTimeout;
    delete cleanInit.proxy;
    delete cleanInit.danger;
  }

  return fetch(input, cleanInit);
}

/**
 * Utility to check if a request would use Tauri HTTP plugin
 * Useful for debugging and testing
 */
export function willUseTauriHttp(url: string, forceTauri = false): boolean {
  return isTauri() && (forceTauri || !shouldUseNativeFetch(url));
}
