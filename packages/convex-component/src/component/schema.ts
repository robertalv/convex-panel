import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Scopes represent separate filter histories (e.g., "user:123:table:users")
  scopes: defineTable({
    name: v.string(),
    head: v.union(v.number(), v.null()), // null = before any states
  }).index("by_name", ["name"]),

  // States store filter state snapshots in the history
  states: defineTable({
    scope: v.id("scopes"),
    state: v.any(), // Filter state: { filters: FilterExpression, sortConfig: SortConfig | null }
    index: v.number(), // 0-indexed position in history
  })
    .index("by_scope", ["scope"])
    .index("by_scope_index", ["scope", "index"]),

  // Checkpoints are named saved filter states that persist independently
  checkpoints: defineTable({
    scope: v.id("scopes"),
    name: v.string(),
    state: v.any(), // Saved filter state
    position: v.union(v.number(), v.null()), // Position where checkpoint was created, null if original state was pruned
  })
    .index("by_scope", ["scope"])
    .index("by_scope_name", ["scope", "name"])
    .index("by_scope_position", ["scope", "position"]),
});
