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
});

export default schema;