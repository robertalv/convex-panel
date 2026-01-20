/**
 * Background Analysis Jobs
 * Automatic analysis jobs that run on a schedule
 */

import { v } from "convex/values";
import { internalAction, internalMutation } from "./_generated/server";
import { internal, api } from "./_generated/api";

/**
 * Analyze recent errors (runs hourly)
 * This would typically be called from logs API or triggered by cron
 */
export const analyzeRecentErrors = internalAction({
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
  returns: v.object({
    analyzed: v.number(),
    failed: v.number(),
  }),
  handler: async (ctx, args) => {
    // Check if automatic analysis is enabled
    const config = await ctx.runQuery(internal.config.getFullConfig, {});
    if (!config || !config.enabled || !config.automaticAnalysis || config.provider === "none") {
      return { analyzed: 0, failed: 0 };
    }

    // Create job record
    const jobId = await ctx.runMutation(internal.jobs.createJob, {
      jobType: "analyzeErrors",
      parameters: { errorCount: args.errors.length },
    });

    let analyzed = 0;
    let failed = 0;

    try {
      // Analyze errors in batch
      const results = await ctx.runAction(internal.analysis.errorAnalysis.analyzeErrorBatch, {
        errors: args.errors,
      });

      analyzed = results.length;
      failed = args.errors.length - results.length;

      // Update job record
      await ctx.runMutation(internal.jobs.completeJob, {
        jobId,
        result: { analyzed, failed },
      });
    } catch (error) {
      failed = args.errors.length;
      await ctx.runMutation(internal.jobs.failJob, {
        jobId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return { analyzed, failed };
  },
});

/**
 * Summarize recent logs (runs daily)
 */
export const summarizeRecentLogs = internalAction({
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
  },
  returns: v.object({
    success: v.boolean(),
    summaryId: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Check if automatic analysis is enabled
    const config = await ctx.runQuery(internal.config.getFullConfig, {});
    if (!config || !config.enabled || !config.automaticAnalysis || config.provider === "none") {
      return { success: false };
    }

    // Calculate time window if not provided (default to last 24 hours)
    const timeWindow = args.timeWindow || {
      start: Date.now() - 24 * 60 * 60 * 1000,
      end: Date.now(),
    };

    // Create job record
    const jobId = await ctx.runMutation(internal.jobs.createJob, {
      jobType: "summarizeLogs",
      parameters: {
        logCount: args.logs.length,
        timeWindow,
      },
    });

    try {
      const summary: { summary: string; keyEvents: string[]; errorCount: number; functionCount: number; affectedFunctions: string[]; patterns?: string[] } = await ctx.runAction(
        (api.analysis.logSummarization as any).summarizeLogs as any,
        {
        logs: args.logs,
        timeWindow,
        includePatterns: true,
      });

      // Update job record
      await ctx.runMutation(internal.jobs.completeJob, {
        jobId,
        result: { summary },
      });

      return { success: true, summaryId: summary.summary };
    } catch (error) {
      await ctx.runMutation(internal.jobs.failJob, {
        jobId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return { success: false };
    }
  },
});

/**
 * Correlate errors with deployments (runs on deployment)
 */
export const correlateDeployment = internalAction({
  args: {
    deploymentId: v.string(),
    deploymentTime: v.number(),
    errors: v.array(
      v.object({
        errorId: v.string(),
        errorMessage: v.string(),
        functionPath: v.optional(v.string()),
        timestamp: v.number(),
      })
    ),
  },
  returns: v.object({
    correlated: v.number(),
  }),
  handler: async (ctx, args) => {
    // Check if automatic analysis is enabled
    const config = await ctx.runQuery(internal.config.getFullConfig, {});
    if (!config || !config.enabled || !config.automaticAnalysis || config.provider === "none") {
      return { correlated: 0 };
    }

    // Create job record
    const jobId = await ctx.runMutation(internal.jobs.createJob, {
      jobType: "correlateDeployment",
      parameters: {
        deploymentId: args.deploymentId,
        errorCount: args.errors.length,
      },
    });

    let correlated = 0;

    try {
      const deployment = {
        deploymentId: args.deploymentId,
        deploymentTime: args.deploymentTime,
      };

      for (const error of args.errors) {
        try {
          await ctx.runAction(internal.analysis.correlation.correlateWithDeployments, {
            errorId: error.errorId,
            errorMessage: error.errorMessage,
            functionPath: error.functionPath,
            timestamp: error.timestamp,
            deployments: [deployment],
          });
          correlated++;
        } catch (err) {
          console.error(`Failed to correlate error ${error.errorId}:`, err);
        }
      }

      // Update job record
      await ctx.runMutation(internal.jobs.completeJob, {
        jobId,
        result: { correlated },
      });
    } catch (error) {
      await ctx.runMutation(internal.jobs.failJob, {
        jobId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return { correlated };
  },
});

/**
 * Create a new analysis job record
 */
export const createJob = internalMutation({
  args: {
    jobType: v.union(
      v.literal("analyzeErrors"),
      v.literal("summarizeLogs"),
      v.literal("correlateDeployment")
    ),
    parameters: v.any(),
  },
  returns: v.id("analysisJobs"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("analysisJobs", {
      jobType: args.jobType,
      status: "pending",
      parameters: args.parameters,
      scheduledAt: Date.now(),
    });
  },
});

/**
 * Mark a job as running
 */
export const startJob = internalMutation({
  args: {
    jobId: v.id("analysisJobs"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: "running",
    });
    return null;
  },
});

/**
 * Mark a job as completed
 */
export const completeJob = internalMutation({
  args: {
    jobId: v.id("analysisJobs"),
    result: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: "completed",
      result: args.result,
      completedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Mark a job as failed
 */
export const failJob = internalMutation({
  args: {
    jobId: v.id("analysisJobs"),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: "failed",
      error: args.error,
      completedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Get job status
 */
export const getJobStatus = internalMutation({
  args: {
    jobId: v.id("analysisJobs"),
  },
  returns: v.union(
    v.object({
      jobType: v.union(
        v.literal("analyzeErrors"),
        v.literal("summarizeLogs"),
        v.literal("correlateDeployment")
      ),
      status: v.union(
        v.literal("pending"),
        v.literal("running"),
        v.literal("completed"),
        v.literal("failed")
      ),
      result: v.optional(v.any()),
      error: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) {
      return null;
    }

    return {
      jobType: job.jobType,
      status: job.status,
      result: job.result,
      error: job.error,
    };
  },
});
