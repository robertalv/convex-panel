import { v } from "convex/values";
import { components } from "./_generated/api";
import { action, internalAction, internalMutation, query } from "./_generated/server";
import { OssStats } from "@erquhart/convex-oss-stats";
import { internal } from "./_generated/api";

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

/**
 * Query to get Product Hunt upvotes from the cache
 * Reads from cache, or returns cached data if available
 */
export const getProductHuntUpvotes = query({
  args: {
    postId: v.string(),
  },
  handler: async (ctx, args) => {
    const cached = await ctx.db
      .query("productHuntStats")
      .withIndex("by_postId", (q) => q.eq("postId", args.postId))
      .first();

    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    if (cached && cached.updatedAt > oneHourAgo) {
      return {
        upvotes: cached.upvotes,
      };
    }

    return {
      upvotes: cached?.upvotes ?? 0,
    };
  },
});

/**
 * Action to fetch Product Hunt upvotes from the API
 * This can be called periodically via cron or manually
 */
export const syncProductHuntUpvotes = action({
  args: {
    postId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const token = process.env.PRODUCT_HUNT_DEVELOPER_TOKEN;
      
      if (!token) {
        console.error("PRODUCT_HUNT_DEVELOPER_TOKEN environment variable is not set");
        return null;
      }

      const response = await fetch("https://api.producthunt.com/v2/api/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `
            query GetPost($id: ID!) {
              post(id: $id) {
                votesCount
              }
            }
          `,
          variables: {
            id: args.postId,
          },
        }),
      });

      if (!response.ok) {
        console.error(
          "Product Hunt API error:",
          response.status,
          response.statusText,
          await response.text()
        );
        return null;
      }

      const data = await response.json();
      
      if (data.errors) {
        console.error("Product Hunt GraphQL errors:", data.errors);
        return null;
      }

      const upvotes = data.data?.post?.votesCount ?? 0;
      
      if (upvotes === 0) {
        console.error("Product Hunt API returned 0 upvotes or no data");
        return null;
      }

      await ctx.runMutation(internal.stats.updateProductHuntCache, {
        postId: args.postId,
        upvotes,
      });

      return { upvotes };
    } catch (error) {
      console.error("Error fetching Product Hunt upvotes:", error);
      return null;
    }
  },
});

/**
 * Internal mutation to update the cache
 */
export const updateProductHuntCache = internalMutation({
  args: {
    postId: v.string(),
    upvotes: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("productHuntStats")
      .withIndex("by_postId", (q) => q.eq("postId", args.postId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        upvotes: args.upvotes,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("productHuntStats", {
        postId: args.postId,
        upvotes: args.upvotes,
        updatedAt: Date.now(),
      });
    }
  },
});


