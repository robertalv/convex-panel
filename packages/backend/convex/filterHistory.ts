import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";

/**
 * Push a new filter state onto the history.
 */
export const push = mutation({
  args: {
    scope: v.string(),
    state: v.any(), // { filters: FilterExpression, sortConfig: SortConfig | null }
    maxStates: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(components.filterHistory.lib.push, {
      scope: args.scope,
      state: args.state,
      maxStates: args.maxStates,
    });
  },
});

/**
 * Move head backward in the filter history.
 */
export const undo = mutation({
  args: {
    scope: v.string(),
    count: v.optional(v.number()),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.runMutation(components.filterHistory.lib.undo, {
      scope: args.scope,
      count: args.count,
    });
  },
});

/**
 * Move head forward in the filter history.
 */
export const redo = mutation({
  args: {
    scope: v.string(),
    count: v.optional(v.number()),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.runMutation(components.filterHistory.lib.redo, {
      scope: args.scope,
      count: args.count,
    });
  },
});

/**
 * Get the current filter state without modifying the history.
 */
export const getCurrentState = query({
  args: { scope: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.filterHistory.lib.getCurrentState, {
      scope: args.scope,
    });
  },
});

/**
 * Get filter history status: canUndo, canRedo, position, length.
 */
export const getStatus = query({
  args: { scope: v.string() },
  returns: v.object({
    canUndo: v.boolean(),
    canRedo: v.boolean(),
    position: v.union(v.number(), v.null()),
    length: v.number(),
  }),
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.filterHistory.lib.getStatus, {
      scope: args.scope,
    });
  },
});

/**
 * Create a named checkpoint of the current filter state.
 */
export const createCheckpoint = mutation({
  args: {
    scope: v.string(),
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(components.filterHistory.lib.createCheckpoint, {
      scope: args.scope,
      name: args.name,
    });
  },
});

/**
 * Restore a checkpoint by pushing its state as a new state.
 */
export const restoreCheckpoint = mutation({
  args: {
    scope: v.string(),
    name: v.string(),
    maxStates: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      components.filterHistory.lib.restoreCheckpoint,
      {
        scope: args.scope,
        name: args.name,
        maxStates: args.maxStates,
      },
    );
  },
});

/**
 * Get a checkpoint's state without restoring it.
 */
export const getCheckpointState = query({
  args: {
    scope: v.string(),
    name: v.string(),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.filterHistory.lib.getCheckpointState, {
      scope: args.scope,
      name: args.name,
    });
  },
});

/**
 * List all checkpoints for a scope.
 */
export const listCheckpoints = query({
  args: { scope: v.string() },
  returns: v.array(
    v.object({ name: v.string(), position: v.union(v.number(), v.null()) }),
  ),
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.filterHistory.lib.listCheckpoints, {
      scope: args.scope,
    });
  },
});

/**
 * Delete a checkpoint.
 */
export const deleteCheckpoint = mutation({
  args: {
    scope: v.string(),
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(components.filterHistory.lib.deleteCheckpoint, {
      scope: args.scope,
      name: args.name,
    });
  },
});

/**
 * Clear all states from a scope.
 */
export const clear = mutation({
  args: { scope: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(components.filterHistory.lib.clear, {
      scope: args.scope,
    });
  },
});

/**
 * Delete a scope and all its data.
 */
export const deleteScope = mutation({
  args: { scope: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(components.filterHistory.lib.deleteScope, {
      scope: args.scope,
    });
  },
});
