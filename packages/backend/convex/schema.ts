import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

const schema = defineSchema({
  todos: defineTable({
    title: v.string(),
    done: v.boolean(),
    archived: v.optional(v.boolean()),
  }).index("by_done", ["done"])
  .index("by_archived", ["archived"]),
})

export default schema;