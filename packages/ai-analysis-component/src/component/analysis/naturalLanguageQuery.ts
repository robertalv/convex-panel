/**
 * Natural Language Query Functions
 * Convert natural language queries into structured database query parameters
 */

import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { getFullConfig } from "../config";
import { createProvider } from "../providers/index";
import { getOrSetCache, generateCacheKey } from "../cache";
import type {
  NaturalLanguageQueryContext,
  NaturalLanguageQueryResult,
} from "../providers/base";

/**
 * Convert natural language query to structured query parameters
 */
export const convertNaturalLanguageQuery = action({
  args: {
    query: v.string(),
    tableName: v.string(),
    fields: v.array(
      v.object({
        fieldName: v.string(),
        type: v.string(),
        optional: v.optional(v.boolean()),
      })
    ),
    sampleDocuments: v.optional(v.array(v.any())),
  },
  returns: v.object({
    filters: v.array(
      v.object({
        field: v.string(),
        op: v.union(
          v.literal("eq"),
          v.literal("neq"),
          v.literal("gt"),
          v.literal("gte"),
          v.literal("lt"),
          v.literal("lte"),
          v.literal("contains"),
          v.literal("not_contains"),
          v.literal("starts_with"),
          v.literal("ends_with")
        ),
        value: v.any(),
      })
    ),
    sortConfig: v.union(
      v.object({
        field: v.string(),
        direction: v.union(v.literal("asc"), v.literal("desc")),
      }),
      v.null()
    ),
    limit: v.union(v.number(), v.null()),
  }),
  handler: async (ctx, args) => {
    // Get AI configuration
    const config = await ctx.runQuery(internal.config.getFullConfig, {});
    if (!config || !config.enabled || config.provider === "none") {
      throw new Error("AI analysis is not configured or disabled");
    }

    // Create query context
    const queryContext: NaturalLanguageQueryContext = {
      query: args.query,
      tableName: args.tableName,
      fields: args.fields.map((f) => ({
        fieldName: f.fieldName,
        type: f.type,
        optional: f.optional,
      })),
      sampleDocuments: args.sampleDocuments,
    };

    // Create AI provider (trim API key as safety measure)
    const provider = createProvider({
      provider: config.provider,
      apiKey: config.apiKey.trim(),
      model: config.model.trim(),
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });

    // Check cache first
    const cacheKey = generateCacheKey(
      config.provider,
      config.model,
      "convertNaturalLanguageQuery",
      queryContext
    );

    const result = await getOrSetCache(
      ctx,
      config.provider,
      config.model,
      "convertNaturalLanguageQuery",
      queryContext,
      async () => {
        return await provider.convertNaturalLanguageQuery(queryContext);
      }
    );

    return {
      filters: result.filters,
      sortConfig: result.sortConfig,
      limit: result.limit,
    };
  },
});







