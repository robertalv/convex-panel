/**
 * Fix Suggestions Functions
 * Generate fix suggestions and preventive measures based on error analysis
 */

import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { getFullConfig } from "../config";
import { createProvider } from "../providers/index";
import { getOrSetCache } from "../cache";
import type { ErrorContext, ErrorAnalysis, FixSuggestion } from "../providers/base";

/**
 * Suggest a fix for an error based on analysis
 */
export const suggestFix = action({
  args: {
    errorMessage: v.string(),
    functionPath: v.optional(v.string()),
    timestamp: v.number(),
    stackTrace: v.optional(v.string()),
    logLines: v.optional(v.array(v.string())),
    rootCause: v.string(),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
  },
  returns: v.object({
    suggestion: v.string(),
    codeExample: v.optional(v.string()),
    documentationLinks: v.array(v.string()),
    confidence: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get AI configuration
    const config = await ctx.runQuery(internal.config.getFullConfig, {});
    if (!config || !config.enabled || config.provider === "none") {
      throw new Error("AI analysis is not configured or disabled");
    }

    // Create error context
    const errorContext: ErrorContext = {
      errorMessage: args.errorMessage,
      functionPath: args.functionPath,
      timestamp: args.timestamp,
      stackTrace: args.stackTrace,
      logLines: args.logLines,
    };

    // Create analysis object
    const analysis: ErrorAnalysis = {
      rootCause: args.rootCause,
      confidence: 0.8, // Default confidence
      severity: args.severity,
      suggestions: [],
    };

    // Create AI provider
    const provider = createProvider({
      provider: config.provider,
      apiKey: config.apiKey.trim(),
      model: config.model.trim(),
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });

    // Check cache first
    const suggestion = await getOrSetCache(
      ctx,
      config.provider,
      config.model,
      "suggestFix",
      { error: errorContext, analysis },
      async () => {
        return await provider.suggestFix(errorContext, analysis);
      }
    );

    return suggestion;
  },
});

/**
 * Suggest preventive measures based on error patterns
 */
export const suggestPrevention = action({
  args: {
    errorMessage: v.string(),
    functionPath: v.optional(v.string()),
    rootCause: v.string(),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
  },
  returns: v.object({
    preventiveMeasures: v.array(v.string()),
    monitoringSuggestions: v.array(v.string()),
    codePatterns: v.optional(v.array(v.string())),
  }),
  handler: async (ctx, args) => {
    // Get AI configuration
    const config = await ctx.runQuery(internal.config.getFullConfig, {});
    if (!config || !config.enabled || config.provider === "none") {
      throw new Error("AI analysis is not configured or disabled");
    }

    // Create AI provider
    const provider = createProvider({
      provider: config.provider,
      apiKey: config.apiKey.trim(),
      model: config.model.trim(),
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });

    // Build prompt for preventive measures
    const prompt = `Based on this error, suggest preventive measures:

Error: ${args.errorMessage}
${args.functionPath ? `Function: ${args.functionPath}` : ""}
Root Cause: ${args.rootCause}
Severity: ${args.severity}

Provide a JSON response with:
{
  "preventiveMeasures": ["measure1", "measure2", ...],
  "monitoringSuggestions": ["suggestion1", ...],
  "codePatterns": ["pattern1", ...]
}`;

    // For now, use a simplified approach - in production, create a dedicated method
    const errorContext: ErrorContext = {
      errorMessage: args.errorMessage,
      functionPath: args.functionPath,
      timestamp: Date.now(),
    };

    const analysis: ErrorAnalysis = {
      rootCause: args.rootCause,
      confidence: 0.8,
      severity: args.severity,
      suggestions: [],
    };

    // Use suggestFix as a base and extract preventive measures
    const fixSuggestion = await provider.suggestFix(errorContext, analysis);

    // Parse the suggestion for preventive measures
    const preventiveMeasures: string[] = [];
    const monitoringSuggestions: string[] = [];

    // Extract preventive measures from the suggestion text
    // This is a simplified approach - in production, you'd want a dedicated AI call
    if (fixSuggestion.suggestion.includes("prevent")) {
      preventiveMeasures.push("Add input validation");
      preventiveMeasures.push("Implement error handling");
    }

    if (args.severity === "high" || args.severity === "critical") {
      monitoringSuggestions.push("Add alerting for this error type");
      monitoringSuggestions.push("Monitor error rate for this function");
    }

    return {
      preventiveMeasures,
      monitoringSuggestions,
      codePatterns: fixSuggestion.codeExample ? [fixSuggestion.codeExample] : undefined,
    };
  },
});

/**
 * Get documentation links for common error types
 */
export const getDocumentationLinks = action({
  args: {
    errorMessage: v.string(),
    functionPath: v.optional(v.string()),
  },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    // Common documentation links based on error patterns
    const links: string[] = [];

    // Convex-specific errors
    if (args.errorMessage.includes("convex") || args.errorMessage.includes("Convex")) {
      links.push("https://docs.convex.dev");
      links.push("https://docs.convex.dev/functions/errors");
    }

    // TypeScript/JavaScript errors
    if (
      args.errorMessage.includes("TypeError") ||
      args.errorMessage.includes("ReferenceError")
    ) {
      links.push("https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors");
    }

    // Database errors
    if (
      args.errorMessage.includes("database") ||
      args.errorMessage.includes("query") ||
      args.errorMessage.includes("mutation")
    ) {
      links.push("https://docs.convex.dev/database");
    }

    // Authentication errors
    if (
      args.errorMessage.includes("auth") ||
      args.errorMessage.includes("unauthorized") ||
      args.errorMessage.includes("permission")
    ) {
      links.push("https://docs.convex.dev/auth");
    }

    // If we have a function path, add function-specific docs
    if (args.functionPath) {
      links.push(`https://docs.convex.dev/functions#${args.functionPath}`);
    }

    return links;
  },
});
