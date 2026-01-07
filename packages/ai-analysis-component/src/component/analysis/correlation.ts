/**
 * Deployment Correlation Functions
 * Correlate errors with deployments and calculate correlation scores
 */

import { v } from "convex/values";
import { action, query, mutation, internalAction, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { getFullConfig } from "../config";
import { createProvider } from "../providers/index";
import { getOrSetCache } from "../cache";
import type { ErrorContext, Deployment, Correlation } from "../providers/base";

/**
 * Correlate an error with recent deployments
 */
export const correlateWithDeployments = internalAction({
  args: {
    errorId: v.string(),
    errorMessage: v.string(),
    functionPath: v.optional(v.string()),
    timestamp: v.number(),
    stackTrace: v.optional(v.string()),
    logLines: v.optional(v.array(v.string())),
    deployments: v.array(
      v.object({
        deploymentId: v.string(),
        deploymentTime: v.number(),
        commitHash: v.optional(v.string()),
        description: v.optional(v.string()),
      })
    ),
  },
  returns: v.object({
    deploymentId: v.string(),
    correlationScore: v.number(),
    affectedFunctions: v.array(v.string()),
    reasoning: v.string(),
  }),
  handler: async (ctx, args) => {
    // Get AI configuration
    const config = await ctx.runQuery(internal.config.getFullConfig, {});
    if (!config || !config.enabled || config.provider === "none") {
      throw new Error("AI analysis is not configured or disabled");
    }

    if (args.deployments.length === 0) {
      throw new Error("No deployments provided for correlation");
    }

    // Create error context
    const errorContext: ErrorContext = {
      errorMessage: args.errorMessage,
      functionPath: args.functionPath,
      timestamp: args.timestamp,
      stackTrace: args.stackTrace,
      logLines: args.logLines,
    };

    // Convert to Deployment format
    const deployments: Deployment[] = args.deployments.map((d) => ({
      deploymentId: d.deploymentId,
      deploymentTime: d.deploymentTime,
      commitHash: d.commitHash,
      description: d.description,
    }));

    // Create AI provider
    const provider = createProvider({
      provider: config.provider,
      apiKey: config.apiKey.trim(),
      model: config.model.trim(),
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });

    // Check cache first
    const correlation = await getOrSetCache(
      ctx,
      config.provider,
      config.model,
      "correlateDeployment",
      { error: errorContext, deployments },
      async () => {
        return await provider.correlateDeployment(errorContext, deployments);
      }
    );

    // Store correlation
    await ctx.runMutation(internal.analysis.correlation.storeCorrelation as any, {
      deploymentId: correlation.deploymentId,
      deploymentTime:
        deployments.find((d) => d.deploymentId === correlation.deploymentId)
          ?.deploymentTime || args.timestamp,
      errorId: args.errorId,
      correlationScore: correlation.correlationScore,
      affectedFunctions: correlation.affectedFunctions,
    });

    return correlation;
  },
});

/**
 * Store deployment correlation
 */
export const storeCorrelation = internalMutation({
  args: {
    deploymentId: v.string(),
    deploymentTime: v.number(),
    errorId: v.string(),
    correlationScore: v.number(),
    affectedFunctions: v.array(v.string()),
  },
  returns: v.id("deploymentCorrelations"),
  handler: async (ctx, args) => {
    // Check if correlation already exists
    const existing = await ctx.db
      .query("deploymentCorrelations")
      .withIndex("by_deployment", (q) =>
        q.eq("deploymentId", args.deploymentId)
      )
      .filter((q) => q.eq(q.field("errorId"), args.errorId))
      .first();

    if (existing) {
      // Update existing correlation
      await ctx.db.patch(existing._id, {
        correlationScore: args.correlationScore,
        affectedFunctions: args.affectedFunctions,
      });
      return existing._id;
    }

    // Create new correlation
    return await ctx.db.insert("deploymentCorrelations", {
      deploymentId: args.deploymentId,
      deploymentTime: args.deploymentTime,
      errorId: args.errorId,
      correlationScore: args.correlationScore,
      affectedFunctions: args.affectedFunctions,
    });
  },
});

/**
 * Get correlations for a deployment
 */
export const getDeploymentCorrelations = query({
  args: {
    deploymentId: v.string(),
  },
  returns: v.array(
    v.object({
      deploymentId: v.string(),
      deploymentTime: v.number(),
      errorId: v.string(),
      correlationScore: v.number(),
      affectedFunctions: v.array(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const correlations = await ctx.db
      .query("deploymentCorrelations")
      .withIndex("by_deployment", (q) =>
        q.eq("deploymentId", args.deploymentId)
      )
      .collect();

    return correlations.map((c) => ({
      deploymentId: c.deploymentId,
      deploymentTime: c.deploymentTime,
      errorId: c.errorId,
      correlationScore: c.correlationScore,
      affectedFunctions: c.affectedFunctions,
    }));
  },
});

/**
 * Get correlations for an error
 */
export const getErrorCorrelations = query({
  args: {
    errorId: v.string(),
  },
  returns: v.array(
    v.object({
      deploymentId: v.string(),
      deploymentTime: v.number(),
      errorId: v.string(),
      correlationScore: v.number(),
      affectedFunctions: v.array(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const correlations = await ctx.db
      .query("deploymentCorrelations")
      .withIndex("by_error", (q) => q.eq("errorId", args.errorId))
      .collect();

    return correlations.map((c) => ({
      deploymentId: c.deploymentId,
      deploymentTime: c.deploymentTime,
      errorId: c.errorId,
      correlationScore: c.correlationScore,
      affectedFunctions: c.affectedFunctions,
    }));
  },
});

/**
 * Get recent correlations (all recent correlations, not filtered by deployment)
 */
export const getRecentCorrelations = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      deploymentId: v.string(),
      deploymentTime: v.number(),
      errorId: v.string(),
      correlationScore: v.number(),
      affectedFunctions: v.array(v.string()),
      reasoning: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const correlations = await ctx.db
      .query("deploymentCorrelations")
      .withIndex("by_deploymentTime")
      .order("desc")
      .take(args.limit ?? 10);

    return correlations.map((c) => {
      // Generate a default reasoning based on correlation score
      const reasoning = c.correlationScore > 0.7
        ? `Strong correlation (${Math.round(c.correlationScore * 100)}%) - This deployment likely caused the error`
        : c.correlationScore > 0.5
        ? `Moderate correlation (${Math.round(c.correlationScore * 100)}%) - This deployment may have contributed to the error`
        : `Weak correlation (${Math.round(c.correlationScore * 100)}%) - Possible relationship between deployment and error`;

      return {
        deploymentId: c.deploymentId,
        deploymentTime: c.deploymentTime,
        errorId: c.errorId,
        correlationScore: c.correlationScore,
        affectedFunctions: c.affectedFunctions,
        reasoning,
      };
    });
  },
});

/**
 * Find which deployment likely caused an issue
 */
export const findDeploymentImpact = action({
  args: {
    errorId: v.string(),
    errorMessage: v.string(),
    functionPath: v.optional(v.string()),
    timestamp: v.number(),
    deployments: v.array(
      v.object({
        deploymentId: v.string(),
        deploymentTime: v.number(),
        commitHash: v.optional(v.string()),
        description: v.optional(v.string()),
      })
    ),
  },
  returns: v.union(
    v.object({
      deploymentId: v.string(),
      correlationScore: v.number(),
      affectedFunctions: v.array(v.string()),
      reasoning: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args): Promise<{
    deploymentId: string;
    correlationScore: number;
    affectedFunctions: string[];
    reasoning: string;
  } | null> => {
    type CorrelationResult = {
      deploymentId: string;
      correlationScore: number;
      affectedFunctions: string[];
      reasoning: string;
    };

    if (args.deployments.length === 0) {
      return null;
    }

    try {
      const correlation = await ctx.runAction(
        internal.analysis.correlation.correlateWithDeployments as any,
        {
          errorId: args.errorId,
          errorMessage: args.errorMessage,
          functionPath: args.functionPath,
          timestamp: args.timestamp,
          deployments: args.deployments,
        }
      ) as CorrelationResult;

      // Only return if correlation score is above threshold
      if (correlation.correlationScore >= 0.5) {
        return correlation;
      }

      return null;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Failed to find deployment impact:", errorMessage);
      return null;
    }
  },
});

/**
 * Calculate correlation score between error and deployment
 * This is a helper function that can be used for quick scoring without AI
 */
export const calculateCorrelationScore = query({
  args: {
    errorTimestamp: v.number(),
    deploymentTime: v.number(),
    functionPath: v.optional(v.string()),
    deploymentDescription: v.optional(v.string()),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    // Simple heuristic-based scoring
    // Time proximity: errors within 1 hour of deployment get higher score
    const timeDiff = Math.abs(args.errorTimestamp - args.deploymentTime);
    const oneHour = 60 * 60 * 1000;
    const timeScore = Math.max(0, 1 - timeDiff / oneHour);

    // Function matching: if deployment description mentions the function, higher score
    let functionScore = 0.5; // Default
    if (
      args.functionPath &&
      args.deploymentDescription &&
      args.deploymentDescription.toLowerCase().includes(
        args.functionPath.toLowerCase()
      )
    ) {
      functionScore = 0.8;
    }

    // Weighted combination
    return timeScore * 0.7 + functionScore * 0.3;
  },
});
