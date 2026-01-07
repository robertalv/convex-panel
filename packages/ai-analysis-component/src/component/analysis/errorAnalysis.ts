/**
 * Error Analysis Functions
 * Analyze errors and identify root causes using AI
 */

import { v } from "convex/values";
import { action, query, mutation, internalMutation, internalAction } from "../_generated/server";
import { internal, api } from "../_generated/api";
import { getFullConfig } from "../config";
import { createProvider } from "../providers/index";
import { getOrSetCache, generateCacheKey } from "../cache";
import type { ErrorContext, ErrorAnalysis } from "../providers/base";

/**
 * Analyze a single error
 */
export const analyzeError = action({
  args: {
    errorId: v.string(),
    errorMessage: v.string(),
    functionPath: v.optional(v.string()),
    timestamp: v.number(),
    stackTrace: v.optional(v.string()),
    logLines: v.optional(v.array(v.string())),
    deploymentId: v.optional(v.string()),
  },
  returns: v.object({
    errorId: v.string(),
    rootCause: v.string(),
    confidence: v.number(),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    suggestions: v.array(v.string()),
    relatedIssues: v.optional(v.array(v.string())),
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
      deploymentId: args.deploymentId,
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
      "analyzeError",
      errorContext
    );

    const analysis = await getOrSetCache(
      ctx,
      config.provider,
      config.model,
      "analyzeError",
      errorContext,
      async () => {
        return await provider.analyzeError(errorContext);
      }
    );

    // Store analysis result
    await ctx.runMutation(internal.analysis.errorAnalysis.storeErrorAnalysis, {
      errorId: args.errorId,
      errorMessage: args.errorMessage,
      functionPath: args.functionPath,
      timestamp: args.timestamp,
      rootCause: analysis.rootCause,
      confidence: analysis.confidence,
      severity: analysis.severity,
      suggestions: analysis.suggestions,
      deploymentId: args.deploymentId,
      relatedIssues: analysis.relatedIssues,
    });

    return {
      errorId: args.errorId,
      rootCause: analysis.rootCause,
      confidence: analysis.confidence,
      severity: analysis.severity,
      suggestions: analysis.suggestions,
      relatedIssues: analysis.relatedIssues,
    };
  },
});

/**
 * Store error analysis result
 */
export const storeErrorAnalysis = internalMutation({
  args: {
    errorId: v.string(),
    errorMessage: v.string(),
    functionPath: v.optional(v.string()),
    timestamp: v.number(),
    rootCause: v.string(),
    confidence: v.number(),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    suggestions: v.array(v.string()),
    deploymentId: v.optional(v.string()),
    relatedIssues: v.optional(v.array(v.string())),
  },
  returns: v.id("errorAnalyses"),
  handler: async (ctx, args) => {
    // Check if analysis already exists
    const existing = await ctx.db
      .query("errorAnalyses")
      .withIndex("by_errorId", (q) => q.eq("errorId", args.errorId))
      .first();

    if (existing) {
      // Update existing analysis
      await ctx.db.patch(existing._id, {
        rootCause: args.rootCause,
        confidence: args.confidence,
        severity: args.severity,
        suggestions: args.suggestions,
        deploymentId: args.deploymentId,
      });
      return existing._id;
    }

    // Create new analysis
    return await ctx.db.insert("errorAnalyses", {
      errorId: args.errorId,
      errorMessage: args.errorMessage,
      functionPath: args.functionPath,
      timestamp: args.timestamp,
      rootCause: args.rootCause,
      confidence: args.confidence,
      severity: args.severity,
      suggestions: args.suggestions,
      deploymentId: args.deploymentId,
    });
  },
});

/**
 * Get error analysis by error ID
 */
export const getErrorAnalysis = query({
  args: {
    errorId: v.string(),
  },
  returns: v.union(
    v.object({
      errorId: v.string(),
      errorMessage: v.string(),
      functionPath: v.optional(v.string()),
      timestamp: v.number(),
      rootCause: v.string(),
      confidence: v.number(),
      severity: v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("critical")
      ),
      suggestions: v.array(v.string()),
      deploymentId: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const analysis = await ctx.db
      .query("errorAnalyses")
      .withIndex("by_errorId", (q) => q.eq("errorId", args.errorId))
      .first();

    if (!analysis) {
      return null;
    }

    return {
      errorId: analysis.errorId,
      errorMessage: analysis.errorMessage,
      functionPath: analysis.functionPath,
      timestamp: analysis.timestamp,
      rootCause: analysis.rootCause,
      confidence: analysis.confidence,
      severity: analysis.severity,
      suggestions: analysis.suggestions,
      deploymentId: analysis.deploymentId,
    };
  },
});

/**
 * Get recent error analyses
 */
export const getRecentAnalyses = query({
  args: {
    limit: v.optional(v.number()),
    functionPath: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      errorId: v.string(),
      errorMessage: v.string(),
      functionPath: v.optional(v.string()),
      timestamp: v.number(),
      rootCause: v.string(),
      confidence: v.number(),
      severity: v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("critical")
      ),
      suggestions: v.array(v.string()),
      deploymentId: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const analyses = args.functionPath
      ? await ctx.db
          .query("errorAnalyses")
          .withIndex("by_function", (q) =>
            q.eq("functionPath", args.functionPath!)
          )
          .order("desc")
          .take(args.limit ?? 10)
      : await ctx.db
          .query("errorAnalyses")
          .withIndex("by_timestamp")
          .order("desc")
          .take(args.limit ?? 10);

    return analyses.map((analysis) => ({
      errorId: analysis.errorId,
      errorMessage: analysis.errorMessage,
      functionPath: analysis.functionPath,
      timestamp: analysis.timestamp,
      rootCause: analysis.rootCause,
      confidence: analysis.confidence,
      severity: analysis.severity,
      suggestions: analysis.suggestions,
      deploymentId: analysis.deploymentId,
    }));
  },
});

/**
 * Analyze multiple errors in batch
 */
export const analyzeErrorBatch = internalAction({
  args: {
    errors: v.array(
      v.object({
        errorId: v.string(),
        errorMessage: v.string(),
        functionPath: v.optional(v.string()),
        timestamp: v.number(),
        stackTrace: v.optional(v.string()),
        logLines: v.optional(v.array(v.string())),
        deploymentId: v.optional(v.string()),
      })
    ),
  },
  returns: v.array(
    v.object({
      errorId: v.string(),
      rootCause: v.string(),
      confidence: v.number(),
      severity: v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("critical")
      ),
      suggestions: v.array(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    type AnalysisResult = {
      errorId: string;
      rootCause: string;
      confidence: number;
      severity: "low" | "medium" | "high" | "critical";
      suggestions: string[];
    };
    
    const results: AnalysisResult[] = [];

    // Process errors sequentially to avoid rate limits
    for (const errorItem of args.errors) {
      try {
        const analysis = await ctx.runAction(
          (api.analysis.errorAnalysis as any).analyzeError,
          {
            errorId: errorItem.errorId,
            errorMessage: errorItem.errorMessage,
            functionPath: errorItem.functionPath,
            timestamp: errorItem.timestamp,
            stackTrace: errorItem.stackTrace,
            logLines: errorItem.logLines,
            deploymentId: errorItem.deploymentId,
          }
        ) as AnalysisResult & { relatedIssues?: string[] };
        
        results.push({
          errorId: analysis.errorId,
          rootCause: analysis.rootCause,
          confidence: analysis.confidence,
          severity: analysis.severity,
          suggestions: analysis.suggestions,
        });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Failed to analyze error ${errorItem.errorId}:`, errorMessage);
        // Continue with other errors
      }
    }

    return results;
  },
});
