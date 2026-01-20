import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Mobile App Subscription Schema
 *
 * This schema manages mobile-only Pro subscriptions, separate from Convex team plans.
 * Subscriptions are tied to user accounts via their email/auth identity.
 */

const schema = defineSchema({
  /**
   * Users table
   * Stores user profile information from BigBrain authentication
   * Note: Use _creationTime (built-in) instead of createdAt
   */
  users: defineTable({
    // User identity from BigBrain/OAuth
    email: v.string(),
    name: v.optional(v.string()),

    // BigBrain access token hash (for verification)
    // We store a hash of the token, not the token itself
    accessTokenHash: v.optional(v.string()),

    // User metadata
    updatedAt: v.number(),
    lastSeenAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_last_seen", ["lastSeenAt"]),

  /**
   * Subscriptions table
   * Tracks mobile Pro subscriptions with IAP integration
   * Note: Use _creationTime (built-in) instead of createdAt
   */
  subscriptions: defineTable({
    // User reference
    userId: v.id("users"),

    // Subscription status
    status: v.union(
      v.literal("active"),
      v.literal("expired"),
      v.literal("cancelled"),
      v.literal("pending"),
    ),

    // Platform-specific details
    platform: v.union(v.literal("ios"), v.literal("android")),

    // IAP receipt information
    transactionId: v.string(), // Apple transaction ID or Google purchase token
    productId: v.string(), // e.g., "mobile_pro_monthly", "mobile_pro_yearly"
    receiptData: v.optional(v.string()), // Encrypted receipt for verification

    // Subscription timing
    startDate: v.number(),
    expiryDate: v.number(),

    // Auto-renewal status
    autoRenewing: v.boolean(),

    // Metadata
    updatedAt: v.number(),

    // Last verification timestamp
    lastVerifiedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_transaction", ["transactionId"])
    .index("by_expiry", ["expiryDate"]),

  /**
   * Subscription events log
   * Audit trail for subscription lifecycle events
   * Note: Use _creationTime (built-in) for event timestamp instead of createdAt
   */
  subscriptionEvents: defineTable({
    subscriptionId: v.id("subscriptions"),
    userId: v.id("users"),

    // Event type
    eventType: v.union(
      v.literal("created"),
      v.literal("activated"),
      v.literal("renewed"),
      v.literal("cancelled"),
      v.literal("expired"),
      v.literal("refunded"),
      v.literal("verification_failed"),
    ),

    // Event details
    platform: v.union(v.literal("ios"), v.literal("android")),
    metadata: v.optional(v.string()), // JSON string with additional data
  })
    .index("by_subscription", ["subscriptionId"])
    .index("by_user", ["userId"])
    .index("by_event_type", ["eventType"]),
});

export default schema;
