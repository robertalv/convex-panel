import { components } from "./_generated/api";
import { internalAction, query } from "./_generated/server";
import { OssStats } from "@erquhart/convex-oss-stats";

// Configure OSS stats for the Convex Panel project itself.
// This keeps GitHub and npm data in your Convex deployment.
export const ossStats = new OssStats(components.ossStats, {
  // GitHub
  githubOwners: ["robertalv"],
  githubRepos: ["robertalv/convex-panel"],
  // npm
  npmPackages: ["convex-panel"],
});

export const {
  sync,
  clearAndSync,
  getGithubOwner,
  getNpmOrg,
  getGithubRepo,
  getGithubRepos,
  getNpmPackage,
  getNpmPackages,
} = ossStats.api();

// Public helper to expose the current GitHub star count for the
// convex-panel repository to frontends (e.g. the marketing site header).
export const getConvexPanelStars = query({
  args: {},
  handler: async (ctx) => {
    const repo = await ossStats.getGithubRepo(ctx, "robertalv/convex-panel");
    return repo?.starCount ?? 0;
  },
});

// Internal action used by a cron job to keep star counts in sync when you
// don't have the GitHub webhook configured.
export const syncStars = internalAction({
  args: {},
  handler: async (ctx) => {
    await ossStats.sync(ctx);
  },
});


