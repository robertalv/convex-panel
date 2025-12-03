// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Keep GitHub / npm OSS stats in sync. This is a fallback if you don't
// configure the GitHub webhook; with the webhook configured this just
// makes sure things stay fresh.
crons.interval(
  "sync convex-panel stars",
  { minutes: 15 },
  internal.stats.syncStars,
);

export default crons;