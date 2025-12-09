/**
 * Log Summarization Functions
 * Summarize logs by time window and function, identify patterns
 */

import { v } from "convex/values";
import { action, query, mutation, internalAction, internalMutation } from "../_generated/server";
import { internal, api } from "../_generated/api";
import { getFullConfig } from "../config";
import { createProvider } from "../providers/index";
import { getOrSetCache, generateCacheKey } from "../cache";
import type { LogEntry, LogSummary, SummarizeOptions } from "../providers/base";

/**
 * Summarize logs for a time window
 */
export const summarizeLogs = action({
  args: {
    logs: v.array(
      v.object({
        timestamp: v.number(),
        message: v.string(),
        functionPath: v.optional(v.string()),
        logLevel: v.optional(v.string()),
        errorMessage: v.optional(v.string()),
      })
    ),
    timeWindow: v.optional(
      v.object({
        start: v.number(),
        end: v.number(),
      })
    ),
    groupByFunction: v.optional(v.boolean()),
    includePatterns: v.optional(v.boolean()),
  },
  returns: v.object({
    summary: v.string(),
    keyEvents: v.array(v.string()),
    errorCount: v.number(),
    functionCount: v.number(),
    affectedFunctions: v.array(v.string()),
    patterns: v.optional(v.array(v.string())),
  }),
  handler: async (ctx, args) => {
    // Get AI configuration
    const config = await ctx.runQuery(internal.config.getFullConfig, {});
    if (!config || !config.enabled || config.provider === "none") {
      throw new Error("AI analysis is not configured or disabled");
    }

    // Convert to LogEntry format
    const logEntries: LogEntry[] = args.logs.map((log) => ({
      timestamp: log.timestamp,
      message: log.message,
      functionPath: log.functionPath,
      logLevel: log.logLevel,
      errorMessage: log.errorMessage,
    }));

    const options: SummarizeOptions = {
      timeWindow: args.timeWindow,
      groupByFunction: args.groupByFunction,
      includePatterns: args.includePatterns,
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
    const summary = await getOrSetCache(
      ctx,
      config.provider,
      config.model,
      "summarizeLogs",
      { logs: logEntries, options },
      async () => {
        return await provider.summarizeLogs(logEntries, options);
      }
    );

    // Store summary if time window is provided
    if (args.timeWindow) {
      await ctx.runMutation(internal.analysis.logSummarization.storeLogSummary, {
        timeWindow: args.timeWindow,
        summary: summary.summary,
        keyEvents: summary.keyEvents,
        errorCount: summary.errorCount,
        functionCount: summary.functionCount,
        affectedFunctions: summary.affectedFunctions,
        patterns: summary.patterns,
      });
    }

    return summary;
  },
});

/**
 * Store log summary
 */
export const storeLogSummary = internalMutation({
  args: {
    timeWindow: v.object({
      start: v.number(),
      end: v.number(),
    }),
    summary: v.string(),
    keyEvents: v.array(v.string()),
    errorCount: v.number(),
    functionCount: v.number(),
    affectedFunctions: v.array(v.string()),
    patterns: v.optional(v.array(v.string())),
  },
  returns: v.id("logSummaries"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("logSummaries", {
      timeWindow: args.timeWindow,
      summary: args.summary,
      keyEvents: args.keyEvents,
      errorCount: args.errorCount,
      functionCount: args.functionCount,
      affectedFunctions: args.affectedFunctions,
    });
  },
});

/**
 * Get log summary for a time window
 */
export const getLogSummary = query({
  args: {
    timeWindow: v.object({
      start: v.number(),
      end: v.number(),
    }),
  },
  returns: v.union(
    v.object({
      timeWindow: v.object({
        start: v.number(),
        end: v.number(),
      }),
      summary: v.string(),
      keyEvents: v.array(v.string()),
      errorCount: v.number(),
      functionCount: v.number(),
      affectedFunctions: v.array(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const summaries = await ctx.db
      .query("logSummaries")
      .withIndex("by_timeWindow", (q) =>
        q
          .eq("timeWindow.start", args.timeWindow.start)
          .eq("timeWindow.end", args.timeWindow.end)
      )
      .collect();

    // Find the most recent summary that overlaps with the requested window
    const matching = summaries
      .filter(
        (s) =>
          s.timeWindow.start <= args.timeWindow.end &&
          s.timeWindow.end >= args.timeWindow.start
      )
      .sort((a, b) => b._creationTime - a._creationTime)[0];

    if (!matching) {
      return null;
    }

    return {
      timeWindow: matching.timeWindow,
      summary: matching.summary,
      keyEvents: matching.keyEvents,
      errorCount: matching.errorCount,
      functionCount: matching.functionCount,
      affectedFunctions: matching.affectedFunctions,
    };
  },
});

/**
 * Get recent log summaries
 */
export const getRecentSummaries = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      timeWindow: v.object({
        start: v.number(),
        end: v.number(),
      }),
      summary: v.string(),
      keyEvents: v.array(v.string()),
      errorCount: v.number(),
      functionCount: v.number(),
      affectedFunctions: v.array(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const summaries = await ctx.db
      .query("logSummaries")
      .order("desc")
      .take(args.limit ?? 10);

    return summaries.map((s) => ({
      timeWindow: s.timeWindow,
      summary: s.summary,
      keyEvents: s.keyEvents,
      errorCount: s.errorCount,
      functionCount: s.functionCount,
      affectedFunctions: s.affectedFunctions,
    }));
  },
});

/**
 * Summarize logs grouped by function
 */
export const summarizeByFunction = action({
  args: {
    logs: v.array(
      v.object({
        timestamp: v.number(),
        message: v.string(),
        functionPath: v.optional(v.string()),
        logLevel: v.optional(v.string()),
        errorMessage: v.optional(v.string()),
      })
    ),
  },
  returns: v.record(
    v.string(),
    v.object({
      summary: v.string(),
      keyEvents: v.array(v.string()),
      errorCount: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    // Group logs by function
    const logsByFunction = new Map<string, typeof args.logs>();

    for (const log of args.logs) {
      const functionPath = log.functionPath || "unknown";
      if (!logsByFunction.has(functionPath)) {
        logsByFunction.set(functionPath, []);
      }
      logsByFunction.get(functionPath)!.push(log);
    }

    // Summarize each function's logs
    const results: Record<string, { summary: string; keyEvents: string[]; errorCount: number }> = {};

    for (const [functionPath, functionLogs] of logsByFunction.entries()) {
      try {
        const summary = await ctx.runAction(api.analysis.logSummarization.summarizeLogs as any, {
          logs: functionLogs,
          groupByFunction: true,
        });

        results[functionPath] = {
          summary: summary.summary,
          keyEvents: summary.keyEvents,
          errorCount: summary.errorCount,
        };
      } catch (error) {
        console.error(`Failed to summarize logs for ${functionPath}:`, error);
        results[functionPath] = {
          summary: "Failed to generate summary",
          keyEvents: [],
          errorCount: functionLogs.filter((l) => l.errorMessage).length,
        };
      }
    }

    return results;
  },
});

/**
 * Identify patterns in logs
 */
export const identifyPatterns = action({
  args: {
    logs: v.array(
      v.object({
        timestamp: v.number(),
        message: v.string(),
        functionPath: v.optional(v.string()),
        logLevel: v.optional(v.string()),
        errorMessage: v.optional(v.string()),
      })
    ),
  },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    // Get AI configuration
    const config = await ctx.runQuery(internal.config.getFullConfig, {});
    if (!config || !config.enabled || config.provider === "none") {
      return [];
    }

    // Convert to LogEntry format
    const logEntries: LogEntry[] = args.logs.map((log) => ({
      timestamp: log.timestamp,
      message: log.message,
      functionPath: log.functionPath,
      logLevel: log.logLevel,
      errorMessage: log.errorMessage,
    }));

    // Create AI provider
    const provider = createProvider({
      provider: config.provider,
      apiKey: config.apiKey.trim(),
      model: config.model.trim(),
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });

    // Summarize with pattern identification
    const summary = await provider.summarizeLogs(logEntries, {
      includePatterns: true,
    });

    return summary.patterns || [];
  },
});
