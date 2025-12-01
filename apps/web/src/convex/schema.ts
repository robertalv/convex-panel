import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  changelog: defineTable({
    version: v.string(),
    date: v.string(),
    title: v.string(),
    description: v.string(),
    changes: v.array(v.object({
      type: v.union(v.literal("feature"), v.literal("fix"), v.literal("improvement")),
      title: v.string(),
      description: v.string(),
    })),
  }),
});