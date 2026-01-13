/**
 * Subscription Management Functions
 *
 * Handles mobile Pro subscriptions with IAP integration
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { verifyReceipt } from "./receiptVerification";

// Get Apple shared secret from environment variable
// Set this in your Convex dashboard: Settings > Environment Variables
// Variable name: APPLE_SHARED_SECRET
// Value: 279a7199956f44c9a3ce1c26f5efcdde
const APPLE_SHARED_SECRET = process.env.APPLE_SHARED_SECRET;

/**
 * Check if a user has an active Pro subscription (read-only)
 */
export const checkProStatus = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      return { isPro: false, subscription: null };
    }

    // Find active subscription
    const activeSubscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!activeSubscription) {
      return { isPro: false, subscription: null };
    }

    // Check if subscription is expired (but don't modify - that's done in a separate mutation)
    const now = Date.now();
    if (activeSubscription.expiryDate < now) {
      return { isPro: false, subscription: null, needsUpdate: true };
    }

    return {
      isPro: true,
      subscription: activeSubscription,
    };
  },
});

/**
 * Create or update a subscription (called after IAP purchase)
 * Validates receipt with Apple/Google before activating
 */
export const createSubscription = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    platform: v.union(v.literal("ios"), v.literal("android")),
    transactionId: v.string(),
    productId: v.string(),
    receiptData: v.optional(v.string()),
    expiryDate: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Verify receipt with Apple/Google servers
    const verification = await verifyReceipt(
      args.platform,
      args.receiptData,
      args.transactionId,
      args.productId,
      APPLE_SHARED_SECRET,
    );

    if (!verification.isValid) {
      console.error(
        `[Subscriptions] Receipt verification failed: ${args.transactionId}`,
        verification.error,
      );
      throw new Error(verification.error || "Receipt verification failed");
    }

    // Validate transaction ID is unique (prevent replay attacks)
    const duplicateTransaction = await ctx.db
      .query("subscriptions")
      .withIndex("by_transaction", (q) =>
        q.eq("transactionId", args.transactionId),
      )
      .first();

    if (duplicateTransaction && duplicateTransaction.status === "active") {
      console.warn(
        `[Subscriptions] Duplicate active transaction: ${args.transactionId}`,
      );
      // Return existing subscription to prevent duplicate charges
      return duplicateTransaction._id;
    }

    // Get or create user
    let user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      const userId = await ctx.db.insert("users", {
        email: args.email,
        name: args.name,
        updatedAt: now,
        lastSeenAt: now,
      });
      user = await ctx.db.get(userId);
      if (!user) throw new Error("Failed to create user");
    }

    // Check if subscription with this transaction ID already exists
    const existingSubscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_transaction", (q) =>
        q.eq("transactionId", args.transactionId),
      )
      .first();

    if (existingSubscription) {
      // Update existing subscription
      await ctx.db.patch(existingSubscription._id, {
        status: "active",
        expiryDate: args.expiryDate,
        updatedAt: now,
        lastVerifiedAt: now,
        autoRenewing: true,
      });

      // Log renewal event
      await ctx.db.insert("subscriptionEvents", {
        subscriptionId: existingSubscription._id,
        userId: user._id,
        eventType: "renewed",
        platform: args.platform,
      });

      return existingSubscription._id;
    }

    // Create new subscription
    const subscriptionId = await ctx.db.insert("subscriptions", {
      userId: user._id,
      status: "active",
      platform: args.platform,
      transactionId: args.transactionId,
      productId: args.productId,
      receiptData: args.receiptData,
      startDate: now,
      expiryDate: args.expiryDate,
      autoRenewing: true,
      updatedAt: now,
      lastVerifiedAt: now,
    });

    // Log creation event
    await ctx.db.insert("subscriptionEvents", {
      subscriptionId,
      userId: user._id,
      eventType: "created",
      platform: args.platform,
      metadata: JSON.stringify({
        productId: args.productId,
        transactionId: args.transactionId,
      }),
    });

    return subscriptionId;
  },
});

/**
 * Cancel a subscription
 */
export const cancelSubscription = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!subscription) {
      throw new Error("No active subscription found");
    }

    const now = Date.now();

    await ctx.db.patch(subscription._id, {
      status: "cancelled",
      autoRenewing: false,
      updatedAt: now,
    });

    // Log cancellation event
    await ctx.db.insert("subscriptionEvents", {
      subscriptionId: subscription._id,
      userId: user._id,
      eventType: "cancelled",
      platform: subscription.platform,
    });

    return subscription._id;
  },
});

/**
 * Get subscription history for a user
 */
export const getSubscriptionHistory = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      return [];
    }

    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return subscriptions;
  },
});
