import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  todos: defineTable({
    title: v.string(),
    done: v.boolean(),
    text: v.optional(v.string()),
    category: v.optional(
      v.union(v.literal("Work"), v.literal("Chores"), v.literal("Other"))
    ),
  })
    .index("by_done", ["done"]),
  productHuntStats: defineTable({
    postId: v.string(),
    upvotes: v.number(),
    updatedAt: v.number(),
  })
    .index("by_postId", ["postId"]),
  schemaVisualizer: defineTable({
    schema: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  
  // User management - properly indexed
  users: defineTable({
    email: v.string(),
    name: v.string(),
    createdAt: v.number(),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended")),
  })
    .index("by_email", ["email"])
    .index("by_status", ["status"]),
  
  // Posts with foreign key to users - missing index on userId (should trigger warning)
  posts: defineTable({
    userId: v.id("users"), // Missing index - will trigger performance warning
    title: v.string(),
    content: v.string(),
    publishedAt: v.optional(v.number()),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    views: v.number(),
  })
    .index("by_status", ["status"]), // Has index on status but not userId
  
  // Comments with foreign keys to both posts and users - missing indexes
  comments: defineTable({
    postId: v.id("posts"), // Missing index - will trigger performance warning
    userId: v.id("users"), // Missing index - will trigger performance warning
    content: v.string(),
    createdAt: v.number(),
    parentCommentId: v.optional(v.id("comments")), // Self-referencing, also missing index
  })
    .index("by_parent_comment_id", ["parentCommentId"])
    .index("by_post_id", ["postId"])
    .index("by_user_id", ["userId"]), // No indexes at all - good for testing
  
  // Categories table - properly indexed
  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    parentCategoryId: v.optional(v.id("categories")), // Self-referencing with index
  })
    .index("by_slug", ["slug"])
    .index("by_parent", ["parentCategoryId"]),
  
  // PostCategories join table - multiple foreign keys without compound index (suggestion)
  postCategories: defineTable({
    postId: v.id("posts"), // Missing index
    categoryId: v.id("categories"), // Missing index
    // Should suggest compound index on [postId, categoryId]
  }), // No indexes - will suggest compound index
  
  // Tags table
  tags: defineTable({
    name: v.string(),
    color: v.optional(v.string()),
    usageCount: v.number(),
  })
    .index("by_name", ["name"]),
  
  // PostTags join table - missing indexes
  postTags: defineTable({
    postId: v.id("posts"), // Missing index
    tagId: v.id("tags"), // Missing index
  }), // No indexes
  
  // Likes - user to post relationship without indexes
  likes: defineTable({
    userId: v.id("users"), // Missing index
    postId: v.id("posts"), // Missing index
    createdAt: v.number(),
  })
    .index("by_post_id", ["postId"])
    .index("by_user_id", ["userId"]), // No indexes - should suggest compound index
  
  // Follows - user to user relationship
  follows: defineTable({
    followerId: v.id("users"), // Missing index
    followeeId: v.id("users"), // Missing index
    createdAt: v.number(),
  })
    .index("by_followee_id", ["followeeId"]),
  
  // Orders - wide table with many fields (should trigger wide table warning)
  orders: defineTable({
    userId: v.id("users"), // Missing index
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    total: v.number(),
    subtotal: v.number(),
    tax: v.number(),
    shipping: v.number(),
    discount: v.number(),
    currency: v.string(),
    billingAddressLine1: v.string(),
    billingAddressLine2: v.optional(v.string()),
    billingCity: v.string(),
    billingState: v.string(),
    billingZip: v.string(),
    billingCountry: v.string(),
    shippingAddressLine1: v.string(),
    shippingAddressLine2: v.optional(v.string()),
    shippingCity: v.string(),
    shippingState: v.string(),
    shippingZip: v.string(),
    shippingCountry: v.string(),
    paymentMethod: v.string(),
    paymentStatus: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    shippedAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_user", ["userId"]), // Has index on userId
  
  // OrderItems - relationship to orders and products
  orderItems: defineTable({
    orderId: v.id("orders"), // Missing index
    productId: v.id("products"), // Missing index
    quantity: v.number(),
    price: v.number(),
  })
    .index("by_order_id", ["orderId"]), // No indexes
  
  // Products table
  products: defineTable({
    name: v.string(),
    description: v.string(),
    price: v.number(),
    sku: v.string(),
    inventory: v.number(),
    categoryId: v.optional(v.id("categories")), // Missing index
  })
    .index("by_sku", ["sku"]), // Has index on sku but not categoryId
  
  // Reviews - relationship to products and users
  reviews: defineTable({
    productId: v.id("products"), // Missing index
    userId: v.id("users"), // Missing index
    rating: v.number(),
    title: v.string(),
    content: v.string(),
    createdAt: v.number(),
    helpful: v.number(),
  }), // No indexes
  
  // Orphaned table with no relationships - should trigger orphaned table info
  auditLogs: defineTable({
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    performedBy: v.string(),
    timestamp: v.number(),
    metadata: v.optional(v.string()),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_action", ["action"]),
  
  // Another orphaned table
  settings: defineTable({
    key: v.string(),
    value: v.string(),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"]),
  
  // Table with redundant index (prefix of another index)
  notifications: defineTable({
    userId: v.id("users"), // Missing index
    type: v.string(),
    read: v.boolean(),
    createdAt: v.number(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "read"]), // Compound index makes "by_user" redundant
    // This should trigger a redundant index warning
});

export default schema;