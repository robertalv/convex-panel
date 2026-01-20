/**
 * User Management Functions
 *
 * Handles user creation and lookup based on email/auth identity
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Get or create a user by email
 * This is called when a user logs in via OAuth
 * Note: Uses _creationTime (built-in) instead of createdAt
 */
export const getOrCreateUser = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      // Update last seen
      await ctx.db.patch(existingUser._id, {
        lastSeenAt: Date.now(),
        updatedAt: Date.now(),
        ...(args.name && { name: args.name }),
      });
      return existingUser._id;
    }

    // Create new user
    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      updatedAt: now,
      lastSeenAt: now,
    });

    return userId;
  },
});

/**
 * Get user by email
 */
export const getUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

/**
 * Get user by ID
 */
export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});
