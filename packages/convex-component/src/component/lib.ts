import type { Id } from "./_generated/dataModel.js";
import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server.js";
import { mutation, query, internalMutation, action } from "./_generated/server.js";
import { internal } from "./_generated/api.js";

/**
 * Prune states ahead of current head and insert a new state.
 * Also invalidates checkpoint positions when their states are pruned.
 */
async function pruneAheadAndInsert(
  ctx: MutationCtx,
  scopeId: Id<"scopes">,
  currentHead: number | null,
  state: unknown,
): Promise<number> {
  // If head is null, we're before any states, so prune all states
  // If head is a number, prune states with index > head
  let statesToPrune;
  if (currentHead === null) {
    statesToPrune = await ctx.db
      .query("states")
      .withIndex("by_scope", (q) => q.eq("scope", scopeId))
      .collect();
  } else {
    statesToPrune = await ctx.db
      .query("states")
      .withIndex("by_scope_index", (q) =>
        q.eq("scope", scopeId).gt("index", currentHead),
      )
      .collect();
  }

  const prunedPositions = new Set(statesToPrune.map((s) => s.index));
  for (const stateToPrune of statesToPrune) {
    await ctx.db.delete(stateToPrune._id);
  }

  if (prunedPositions.size > 0) {
    const checkpoints = await ctx.db
      .query("checkpoints")
      .withIndex("by_scope", (q) => q.eq("scope", scopeId))
      .collect();

    for (const checkpoint of checkpoints) {
      if (
        checkpoint.position !== null &&
        prunedPositions.has(checkpoint.position)
      ) {
        await ctx.db.patch(checkpoint._id, { position: null });
      }
    }
  }

  // 0-indexed: if head is null, new index is 0; otherwise head + 1
  const newIndex = currentHead === null ? 0 : currentHead + 1;
  await ctx.db.insert("states", {
    scope: scopeId,
    state,
    index: newIndex,
  });

  return newIndex;
}

/**
 * Prune oldest states if count exceeds maxStates.
 * Also invalidates checkpoint positions when their states are pruned.
 */
async function pruneOldestIfNeeded(
  ctx: MutationCtx,
  scopeId: Id<"scopes">,
  maxStates: number,
): Promise<void> {
  if (maxStates <= 0) return;

  const allStates = await ctx.db
    .query("states")
    .withIndex("by_scope_index", (q) => q.eq("scope", scopeId))
    .order("asc")
    .collect();

  if (allStates.length > maxStates) {
    const statesToDelete = allStates.slice(0, allStates.length - maxStates);
    const prunedPositions = new Set(statesToDelete.map((s) => s.index));

    for (const stateToDelete of statesToDelete) {
      await ctx.db.delete(stateToDelete._id);
    }

    // Invalidate checkpoints at pruned positions
    const checkpoints = await ctx.db
      .query("checkpoints")
      .withIndex("by_scope", (q) => q.eq("scope", scopeId))
      .collect();

    for (const checkpoint of checkpoints) {
      if (
        checkpoint.position !== null &&
        prunedPositions.has(checkpoint.position)
      ) {
        await ctx.db.patch(checkpoint._id, { position: null });
      }
    }
  }
}

/**
 * Push a new filter state onto the history.
 *
 * If head is not at the leaf (after undo), prunes all states ahead of head first.
 *
 * ```
 * Before: [A:1] -- [B:2] -- [C:3]  head=2 (after undo)
 * push(D)
 * After:  [A:1] -- [B:2] -- [D:3]  head=3 (C pruned)
 * ```
 */
export const push = mutation({
  args: {
    scope: v.string(),
    state: v.any(), // { filters: FilterExpression, sortConfig: SortConfig | null }
    maxStates: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    let scope = await ctx.db
      .query("scopes")
      .withIndex("by_name", (q) => q.eq("name", args.scope))
      .unique();

    if (!scope) {
      const scopeId = await ctx.db.insert("scopes", {
        name: args.scope,
        head: null, // null = before any states
      });
      scope = await ctx.db.get(scopeId);
      if (!scope) throw new Error("Failed to create scope");
    }

    const newIndex = await pruneAheadAndInsert(
      ctx,
      scope._id,
      scope.head,
      args.state,
    );

    await ctx.db.patch(scope._id, { head: newIndex });

    if (args.maxStates !== undefined) {
      await pruneOldestIfNeeded(ctx, scope._id, args.maxStates);
    }

    return null;
  },
});

/**
 * Move head backward in the filter history.
 * Returns the state at the new head position, or null if head becomes null.
 */
export const undo = mutation({
  args: {
    scope: v.string(),
    count: v.optional(v.number()),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const scope = await ctx.db
      .query("scopes")
      .withIndex("by_name", (q) => q.eq("name", args.scope))
      .unique();

    if (!scope) return null;

    // If head is null, already at the beginning
    if (scope.head === null) return null;

    const count = args.count ?? 1;

    // 0-indexed: going below 0 means head becomes null
    const newHead = scope.head - count < 0 ? null : scope.head - count;

    await ctx.db.patch(scope._id, { head: newHead });

    if (newHead === null) return null;

    const state = await ctx.db
      .query("states")
      .withIndex("by_scope_index", (q) =>
        q.eq("scope", scope._id).eq("index", newHead),
      )
      .unique();

    return state?.state ?? null;
  },
});

/**
 * Move head forward in the filter history.
 * Returns the state at the new head position, or null if already at leaf.
 */
export const redo = mutation({
  args: {
    scope: v.string(),
    count: v.optional(v.number()),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const scope = await ctx.db
      .query("scopes")
      .withIndex("by_name", (q) => q.eq("name", args.scope))
      .unique();

    if (!scope) return null;

    const count = args.count ?? 1;

    // If count is 0, return current state without moving (no-op)
    if (count === 0) {
      if (scope.head === null) return null;

      const head = scope.head;

      const state = await ctx.db
        .query("states")
        .withIndex("by_scope_index", (q) =>
          q.eq("scope", scope._id).eq("index", head),
        )
        .unique();

      return state?.state ?? null;
    }

    const leafState = await ctx.db
      .query("states")
      .withIndex("by_scope_index", (q) => q.eq("scope", scope._id))
      .order("desc")
      .first();

    if (!leafState) return null;

    const maxIndex = leafState.index;

    // 0-indexed: if head is null, start from -1 so adding count moves to correct position
    const currentPosition = scope.head ?? -1;
    const newHead = Math.min(maxIndex, currentPosition + count);

    await ctx.db.patch(scope._id, { head: newHead });

    const state = await ctx.db
      .query("states")
      .withIndex("by_scope_index", (q) =>
        q.eq("scope", scope._id).eq("index", newHead),
      )
      .unique();

    return state?.state ?? null;
  },
});

/**
 * Get the current filter state without modifying the history.
 * Returns null if head is null (before any state).
 */
export const getCurrentState = query({
  args: { scope: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const scope = await ctx.db
      .query("scopes")
      .withIndex("by_name", (q) => q.eq("name", args.scope))
      .unique();

    if (!scope || scope.head === null) return null;

    const head = scope.head;

    const state = await ctx.db
      .query("states")
      .withIndex("by_scope_index", (q) =>
        q.eq("scope", scope._id).eq("index", head),
      )
      .unique();

    return state?.state ?? null;
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
    const scope = await ctx.db
      .query("scopes")
      .withIndex("by_name", (q) => q.eq("name", args.scope))
      .unique();

    if (!scope) {
      return { canUndo: false, canRedo: false, position: null, length: 0 };
    }

    const states = await ctx.db
      .query("states")
      .withIndex("by_scope", (q) => q.eq("scope", scope._id))
      .collect();

    // 0-indexed: max index is length - 1, but we need to handle empty case
    const leafIndex =
      states.length > 0 ? Math.max(...states.map((s) => s.index)) : null;

    return {
      canUndo: scope.head !== null,
      canRedo:
        scope.head === null
          ? states.length > 0
          : leafIndex !== null && scope.head < leafIndex,
      position: scope.head,
      length: states.length,
    };
  },
});

/**
 * Create a named checkpoint of the current filter state.
 * Checkpoints persist independently of the history through pruning.
 */
export const createCheckpoint = mutation({
  args: {
    scope: v.string(),
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const scope = await ctx.db
      .query("scopes")
      .withIndex("by_name", (q) => q.eq("name", args.scope))
      .unique();

    if (!scope)
      throw new Error(
        `Filter history scope "${args.scope}" not found. Use push() to create a new scope.`,
      );

    if (scope.head === null)
      throw new Error(
        "Cannot create checkpoint: filter history is at the beginning (no state). Push a state first.",
      );

    const head = scope.head;

    const currentState = await ctx.db
      .query("states")
      .withIndex("by_scope_index", (q) =>
        q.eq("scope", scope._id).eq("index", head),
      )
      .unique();

    if (!currentState) throw new Error("Current state not found");

    const existing = await ctx.db
      .query("checkpoints")
      .withIndex("by_scope_name", (q) =>
        q.eq("scope", scope._id).eq("name", args.name),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        state: currentState.state,
        position: scope.head,
      });
    } else {
      await ctx.db.insert("checkpoints", {
        scope: scope._id,
        name: args.name,
        state: currentState.state,
        position: scope.head,
      });
    }

    return null;
  },
});

/**
 * Restore a checkpoint by pushing its state as a new state.
 * Non-destructive: you can undo the restore.
 */
export const restoreCheckpoint = mutation({
  args: {
    scope: v.string(),
    name: v.string(),
    maxStates: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const scope = await ctx.db
      .query("scopes")
      .withIndex("by_name", (q) => q.eq("name", args.scope))
      .unique();

    if (!scope)
      throw new Error(
        `Filter history scope "${args.scope}" not found. Use push() to create a new scope.`,
      );

    const checkpoint = await ctx.db
      .query("checkpoints")
      .withIndex("by_scope_name", (q) =>
        q.eq("scope", scope._id).eq("name", args.name),
      )
      .unique();

    if (!checkpoint)
      throw new Error(
        `Checkpoint "${args.name}" not found in scope "${args.scope}". Use createCheckpoint() to create a checkpoint.`,
      );

    const newIndex = await pruneAheadAndInsert(
      ctx,
      scope._id,
      scope.head,
      checkpoint.state,
    );

    await ctx.db.patch(scope._id, { head: newIndex });

    if (args.maxStates !== undefined) {
      await pruneOldestIfNeeded(ctx, scope._id, args.maxStates);
    }

    return checkpoint.state;
  },
});

/**
 * List all checkpoints for a scope with their names and positions.
 */
export const listCheckpoints = query({
  args: { scope: v.string() },
  returns: v.array(
    v.object({ name: v.string(), position: v.union(v.number(), v.null()) }),
  ),
  handler: async (ctx, args) => {
    const scope = await ctx.db
      .query("scopes")
      .withIndex("by_name", (q) => q.eq("name", args.scope))
      .unique();

    if (!scope) return [];

    const checkpoints = await ctx.db
      .query("checkpoints")
      .withIndex("by_scope", (q) => q.eq("scope", scope._id))
      .collect();

    return checkpoints.map((c) => ({ name: c.name, position: c.position }));
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
    const scope = await ctx.db
      .query("scopes")
      .withIndex("by_name", (q) => q.eq("name", args.scope))
      .unique();

    if (!scope) return null;

    const checkpoint = await ctx.db
      .query("checkpoints")
      .withIndex("by_scope_name", (q) =>
        q.eq("scope", scope._id).eq("name", args.name),
      )
      .unique();

    if (checkpoint) await ctx.db.delete(checkpoint._id);

    return null;
  },
});

/**
 * Clear all states from a scope, resetting head to null.
 * Checkpoints are preserved.
 */
export const clear = mutation({
  args: { scope: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const scope = await ctx.db
      .query("scopes")
      .withIndex("by_name", (q) => q.eq("name", args.scope))
      .unique();

    if (!scope) return null;

    const states = await ctx.db
      .query("states")
      .withIndex("by_scope", (q) => q.eq("scope", scope._id))
      .collect();

    for (const state of states) {
      await ctx.db.delete(state._id);
    }

    await ctx.db.patch(scope._id, { head: null });

    return null;
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
    const scope = await ctx.db
      .query("scopes")
      .withIndex("by_name", (q) => q.eq("name", args.scope))
      .unique();

    if (!scope) return null;

    const checkpoint = await ctx.db
      .query("checkpoints")
      .withIndex("by_scope_name", (q) =>
        q.eq("scope", scope._id).eq("name", args.name),
      )
      .unique();

    return checkpoint?.state ?? null;
  },
});

/**
 * Delete a scope and all its data (states, checkpoints, and scope record).
 */
export const deleteScope = mutation({
  args: { scope: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const scope = await ctx.db
      .query("scopes")
      .withIndex("by_name", (q) => q.eq("name", args.scope))
      .unique();

    if (!scope) return null;

    const states = await ctx.db
      .query("states")
      .withIndex("by_scope", (q) => q.eq("scope", scope._id))
      .collect();

    for (const state of states) {
      await ctx.db.delete(state._id);
    }

    const checkpoints = await ctx.db
      .query("checkpoints")
      .withIndex("by_scope", (q) => q.eq("scope", scope._id))
      .collect();

    for (const checkpoint of checkpoints) {
      await ctx.db.delete(checkpoint._id);
    }

    await ctx.db.delete(scope._id);

    return null;
  },
});

/**
 * Get state at a specific position without moving head.
 * Returns null for negative positions or out-of-bounds.
 */
export const getStateAtPosition = query({
  args: {
    scope: v.string(),
    position: v.number(),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    // 0-indexed: position 0 is valid, negative is not
    if (args.position < 0) return null;

    const scope = await ctx.db
      .query("scopes")
      .withIndex("by_name", (q) => q.eq("name", args.scope))
      .unique();

    if (!scope) return null;

    const state = await ctx.db
      .query("states")
      .withIndex("by_scope_index", (q) =>
        q.eq("scope", scope._id).eq("index", args.position),
      )
      .unique();

    return state?.state ?? null;
  },
});

/**
 * List all states for a scope with their positions.
 * Returns array of { position, state } sorted by position.
 */
export const listStates = query({
  args: { scope: v.string() },
  returns: v.array(
    v.object({
      position: v.number(),
      state: v.any(),
    }),
  ),
  handler: async (ctx, args) => {
    const scope = await ctx.db
      .query("scopes")
      .withIndex("by_name", (q) => q.eq("name", args.scope))
      .unique();

    if (!scope) return [];

    const states = await ctx.db
      .query("states")
      .withIndex("by_scope_index", (q) => q.eq("scope", scope._id))
      .order("asc")
      .collect();

    return states.map((s) => ({
      position: s.index,
      state: s.state,
    }));
  },
});

/**
 * Internal mutation that performs the actual cleanup work.
 * Called by the public cleanup action.
 */
export const cleanupInternal = internalMutation({
  args: {
    retentionHours: v.number(),
  },
  returns: v.object({
    deletedStates: v.number(),
    deletedScopes: v.number(),
  }),
  handler: async (ctx, args) => {
    const retentionMs = args.retentionHours * 60 * 60 * 1000;
    const cutoffTime = Date.now() - retentionMs;
    let deletedStates = 0;
    let deletedScopes = 0;

    console.log(`[filterHistory cleanup] Starting cleanup with retention: ${args.retentionHours} hours (${retentionMs}ms), cutoff time: ${new Date(cutoffTime).toISOString()}`);

    // Get all scopes
    const allScopes = await ctx.db.query("scopes").collect();

    for (const scope of allScopes) {
      // Get all states for this scope
      const states = await ctx.db
        .query("states")
        .withIndex("by_scope", (q) => q.eq("scope", scope._id))
        .collect();

      // If no states, delete the scope
      if (states.length === 0) {
        // Also delete any checkpoints
        const checkpoints = await ctx.db
          .query("checkpoints")
          .withIndex("by_scope", (q) => q.eq("scope", scope._id))
          .collect();
        
        for (const checkpoint of checkpoints) {
          await ctx.db.delete(checkpoint._id);
        }
        
        await ctx.db.delete(scope._id);
        deletedScopes++;
        continue;
      }

      // Find the head state index
      const headIndex = scope.head;
      
      // Delete old states that are not the head
      for (const state of states) {
        // Skip if this is the current head state (preserve it)
        if (headIndex !== null && state.index === headIndex) {
          continue;
        }

        // Check if state is older than cutoff
        if (state._creationTime < cutoffTime) {
          await ctx.db.delete(state._id);
          deletedStates++;
        }
      }
    }

    const result = {
      deletedStates,
      deletedScopes,
    };
    
    console.log(`[filterHistory cleanup] Completed: deleted ${deletedStates} states, ${deletedScopes} scopes`);
    
    return result;
  },
});

/**
 * Clean up old filter history states that are older than the specified retention period.
 * Preserves the current head state even if it's old (user might be viewing it).
 * Also cleans up orphaned scopes with no states.
 * 
 * Users should call this from their own cron jobs. See example usage in the README.
 */
export const cleanup = action({
  args: {
    retentionHours: v.number(),
  },
  returns: v.object({
    deletedStates: v.number(),
    deletedScopes: v.number(),
  }),
  handler: async (ctx, args): Promise<{ deletedStates: number; deletedScopes: number }> => {
    const result: { deletedStates: number; deletedScopes: number } = await ctx.runMutation(
      (internal as any).lib.cleanupInternal,
      {
        retentionHours: args.retentionHours,
      },
    );
    return result;
  },
});
