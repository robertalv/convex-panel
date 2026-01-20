import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { components } from "./_generated/api";

const crons = cronJobs();

// Keep GitHub / npm OSS stats in sync. This is a fallback if you don't
// configure the GitHub webhook; with the webhook configured this just
// makes sure things stay fresh.
crons.interval(
  "sync convex-panel stars",
  { minutes: 15 },
  internal.stats.syncStars,
);

// Example of cleaning up filter history
// TODO: put this in our docs
export const cleanupFilterHistory = internalAction(async (ctx) => {
  await ctx.runAction(components.convexPanel.lib.cleanup, {
    retentionHours: 6,
  });
});

crons.interval(
  "cleanup filter history",
  { hours: 6 },
  internal.crons.cleanupFilterHistory,
);

// AI Analysis cron jobs
// Note: These are commented out until we implement log fetching from the Convex API
// Uncomment and implement log fetching when ready to enable automatic analysis

// Hourly error analysis
// TODO: Implement log fetching and uncomment when ready
// crons.hourly(
//   "ai-analyze-recent-errors",
//   {
//     hourUTC: 0, // Run at the top of every hour
//     timezone: "UTC",
//   },
//   internal.aiAnalysis.jobs.analyzeRecentErrors,
//   {
//     errors: [], // This would be populated by fetching from logs API
//   }
// );

// Daily log summarization
// TODO: Implement log fetching and uncomment when ready
// crons.daily(
//   "ai-summarize-recent-logs",
//   {
//     hourUTC: 0,
//     minuteUTC: 0,
//     timezone: "UTC",
//   },
//   internal.aiAnalysis.jobs.summarizeRecentLogs,
//   {
//     logs: [], // This would be populated by fetching from logs API
//   }
// );

export default crons;