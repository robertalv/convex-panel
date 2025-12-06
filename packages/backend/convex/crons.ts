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

export default crons;