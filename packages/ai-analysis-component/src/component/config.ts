/**
 * Configuration Management
 * Handles getting, setting, and validating AI provider configuration
 */

import { v } from "convex/values";
import { query, mutation, action, internalQuery } from "./_generated/server";
import { createProvider } from "./providers/index";
import type { ErrorContext } from "./providers/base";

const CONFIG_KEY = "default";

/**
 * Get current AI configuration
 */
export const getConfig = query({
  args: {},
  returns: v.union(
    v.object({
      provider: v.union(v.literal("openai"), v.literal("anthropic"), v.literal("none")),
      model: v.string(),
      embeddingModel: v.optional(v.string()),
      temperature: v.optional(v.number()),
      maxTokens: v.optional(v.number()),
      enabled: v.boolean(),
      automaticAnalysis: v.boolean(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    // Get the single config document (there should only be one)
    const config = await ctx.db.query("aiConfig").first();

    if (!config) {
      return null;
    }

    // Don't expose API key
    return {
      provider: config.provider,
      model: config.model,
      embeddingModel: config.embeddingModel,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      enabled: config.enabled,
      automaticAnalysis: config.automaticAnalysis,
      updatedAt: config.updatedAt,
    };
  },
});

/**
 * Set AI provider configuration
 */
export const setConfig = mutation({
  args: {
    provider: v.union(v.literal("openai"), v.literal("anthropic"), v.literal("none")),
    apiKey: v.string(),
    model: v.string(),
    embeddingModel: v.optional(v.string()),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    enabled: v.boolean(),
    automaticAnalysis: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Validate configuration
    if (args.provider !== "none" && !args.apiKey) {
      throw new Error("API key is required when provider is not 'none'");
    }

    if (args.provider !== "none") {
      // Validate model names
      if (args.provider === "openai" && !args.model.startsWith("gpt-")) {
        throw new Error("Invalid OpenAI model name");
      }
      if (args.provider === "anthropic" && !args.model.startsWith("claude-")) {
        throw new Error("Invalid Anthropic model name");
      }
    }

    // Get the single config document (there should only be one)
    const existing = await ctx.db.query("aiConfig").first();

    // Trim API key to remove any accidental whitespace
    const trimmedApiKey = args.apiKey.trim();
    
    // Validate API key format (basic checks)
    if (args.provider === "openai" && trimmedApiKey && !trimmedApiKey.startsWith("sk-")) {
      throw new Error("Invalid OpenAI API key format. OpenAI keys should start with 'sk-'");
    }
    if (args.provider === "anthropic" && trimmedApiKey && trimmedApiKey.length < 10) {
      throw new Error("Invalid Anthropic API key format. Please check your API key.");
    }

    const configData = {
      provider: args.provider,
      apiKey: trimmedApiKey, // Store securely (in production, consider encryption)
      model: args.model.trim(),
      embeddingModel: args.embeddingModel?.trim() || undefined,
      temperature: args.temperature ?? 0.7,
      maxTokens: args.maxTokens ?? 2000,
      enabled: args.enabled,
      automaticAnalysis: args.automaticAnalysis,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, configData);
    } else {
      await ctx.db.insert("aiConfig", configData);
    }

    return null;
  },
});

/**
 * Validate configuration without saving
 */
export const validateConfig = mutation({
  args: {
    provider: v.union(v.literal("openai"), v.literal("anthropic"), v.literal("none")),
    apiKey: v.string(),
    model: v.string(),
  },
  returns: v.object({
    valid: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      if (args.provider === "none") {
        return { valid: true };
      }

      if (!args.apiKey) {
        return { valid: false, error: "API key is required" };
      }

      // Validate model names
      if (args.provider === "openai" && !args.model.startsWith("gpt-")) {
        return { valid: false, error: "Invalid OpenAI model name" };
      }
      if (args.provider === "anthropic" && !args.model.startsWith("claude-")) {
        return { valid: false, error: "Invalid Anthropic model name" };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Test AI provider connection
 */
export const testConnection = action({
  args: {
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
    apiKey: v.string(),
    model: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Trim API key to remove any accidental whitespace
      const trimmedApiKey = args.apiKey.trim();
      
      const aiProvider = createProvider({
        provider: args.provider,
        apiKey: trimmedApiKey,
        model: args.model.trim(),
      });

      // Test with a simple error analysis
      const testError: ErrorContext = {
        errorMessage: "Test error for connection validation",
        timestamp: Date.now(),
      };

      await aiProvider.analyzeError(testError);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Get full config including API key (internal use only)
 */
export const getFullConfig = internalQuery({
  args: {},
  returns: v.union(
    v.object({
      provider: v.union(v.literal("openai"), v.literal("anthropic"), v.literal("none")),
      apiKey: v.string(),
      model: v.string(),
      embeddingModel: v.optional(v.string()),
      temperature: v.optional(v.number()),
      maxTokens: v.optional(v.number()),
      enabled: v.boolean(),
      automaticAnalysis: v.boolean(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    // Get the single config document (there should only be one)
    const config = await ctx.db.query("aiConfig").first();

    if (!config) {
      return null;
    }

    // Trim API key to ensure no whitespace issues
    const apiKey = config.apiKey?.trim() || "";
    
    // Ensure model is trimmed and exists
    const model = config.model?.trim() || "";
    if (!model && config.provider !== "none") {
      throw new Error("Model is required when provider is not 'none'");
    }

    return {
      provider: config.provider,
      apiKey,
      model,
      embeddingModel: config.embeddingModel?.trim() || undefined,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      enabled: config.enabled,
      automaticAnalysis: config.automaticAnalysis,
      updatedAt: config.updatedAt,
    };
  },
});
