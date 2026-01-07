/**
 * AI Response Caching System
 * Caches AI responses to reduce API calls and costs
 */

import { v } from "convex/values";
import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate cache key from input data
 */
function generateCacheKey(
  provider: string,
  model: string,
  operation: string,
  input: any
): string {
  const inputStr = JSON.stringify(input);
  // Simple hash function (in production, use crypto)
  let hash = 0;
  for (let i = 0; i < inputStr.length; i++) {
    const char = inputStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `${provider}:${model}:${operation}:${Math.abs(hash).toString(36)}`;
}

/**
 * Get cached response if available and not expired
 */
export const getCached = internalQuery({
  args: {
    cacheKey: v.string(),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const cached = await ctx.db
      .query("aiCache")
      .withIndex("by_key", (q) => q.eq("cacheKey", args.cacheKey))
      .first();

    if (!cached) {
      return null;
    }

    // Check if expired
    if (cached.expiresAt < Date.now()) {
      // Return null for expired cache
      // Cleanup will be handled by periodic cleanup jobs or when setting new cache
      return null;
    }

    return cached.response;
  },
});

/**
 * Store response in cache
 */
export const setCached = internalMutation({
  args: {
    cacheKey: v.string(),
    provider: v.string(),
    model: v.string(),
    response: v.any(),
    ttlMs: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const expiresAt = Date.now() + (args.ttlMs ?? DEFAULT_TTL_MS);

    // Check if already exists
    const existing = await ctx.db
      .query("aiCache")
      .withIndex("by_key", (q) => q.eq("cacheKey", args.cacheKey))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        response: args.response,
        expiresAt,
      });
    } else {
      await ctx.db.insert("aiCache", {
        cacheKey: args.cacheKey,
        provider: args.provider,
        model: args.model,
        response: args.response,
        expiresAt,
      });
    }

    return null;
  },
});

/**
 * Clean up expired cache entries
 */
export const cleanupExpired = internalMutation({
  args: {
    cacheKey: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();

    if (args.cacheKey) {
      // Clean up specific cache entry
      const cached = await ctx.db
        .query("aiCache")
        .withIndex("by_key", (q) => q.eq("cacheKey", args.cacheKey!))
        .first();

      if (cached && cached.expiresAt < now) {
        await ctx.db.delete(cached._id);
      }
    } else {
      // Clean up all expired entries
      const expired = await ctx.db
        .query("aiCache")
        .withIndex("by_expiresAt", (q) => q.lt("expiresAt", now))
        .collect();

      for (const entry of expired) {
        await ctx.db.delete(entry._id);
      }
    }

    return null;
  },
});

/**
 * Clear all cache entries
 */
export const clearCache = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const allEntries = await ctx.db.query("aiCache").collect();
    for (const entry of allEntries) {
      await ctx.db.delete(entry._id);
    }
    return null;
  },
});

/**
 * Helper function to get or set cache
 * This is a helper that works with action contexts
 */
export async function getOrSetCache(
  ctx: { runQuery: any; runMutation: any },
  provider: string,
  model: string,
  operation: string,
  input: any,
  fetchFn: () => Promise<any>,
  ttlMs?: number
): Promise<any> {
  const cacheKey = generateCacheKey(provider, model, operation, input);

  // Try to get from cache
  const cached = await ctx.runQuery(internal.cache.getCached, { cacheKey });
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const response = await fetchFn();

  // Store in cache
  await ctx.runMutation(internal.cache.setCached as any, {
    cacheKey,
    provider,
    model,
    response,
    ttlMs,
  });

  return response;
}

// Export cache key generator for use in other modules
export { generateCacheKey };
