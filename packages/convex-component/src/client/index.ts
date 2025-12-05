import type {
  GenericDataModel,
  GenericMutationCtx,
  GenericQueryCtx,
} from "convex/server";
import type { ComponentApi } from "../component/_generated/component.js";

type MutationCtx = Pick<
  GenericMutationCtx<GenericDataModel>,
  "runQuery" | "runMutation"
>;

type QueryCtx = Pick<GenericQueryCtx<GenericDataModel>, "runQuery">;

/**
 * Filter state structure: contains filters and sort configuration
 */
export interface FilterState {
  filters: {
    clauses: Array<{
      field: string;
      op:
        | "eq"
        | "neq"
        | "gt"
        | "gte"
        | "lt"
        | "lte"
        | "isType"
        | "isNotType";
      value: any;
      enabled: boolean;
    }>;
  };
  sortConfig: { field: string; direction: "asc" | "desc" } | null;
}

export interface FilterHistoryStatus {
  canUndo: boolean;
  canRedo: boolean;
  position: number | null;
  length: number;
}

export interface Checkpoint {
  name: string;
  position: number | null;
}

/**
 * Filter history component for undo/redo state management.
 *
 * Maintains a linear history of filter state snapshots organized by scope.
 * Supports named checkpoints that persist independently of the history.
 *
 * @example
 * ```ts
 * const filterHistory = new FilterHistory(components.filterHistory);
 *
 * // In a mutation:
 * await filterHistory.push(ctx, "user:123:table:users", {
 *   filters: { clauses: [...] },
 *   sortConfig: { field: "name", direction: "asc" }
 * });
 * const prev = await filterHistory.undo(ctx, "user:123:table:users");
 * ```
 */
export class FilterHistory<FilterScope extends string = string> {
  private maxStatesForScope: (scope: FilterScope) => number | undefined;

  /**
   * @param component - The filter history component API from components.filterHistory
   * @param options.maxStatesPerScope - Max states per scope. Can be a number or
   *   a record mapping scope prefixes to limits (longest matching prefix wins).
   */
  constructor(
    public component: ComponentApi,
    public options?: {
      maxStatesPerScope?: number | Record<string, number>;
    },
  ) {
    this.maxStatesForScope = (scope: FilterScope) => {
      if (options?.maxStatesPerScope === undefined) return undefined;

      if (typeof options.maxStatesPerScope === "number") {
        return options.maxStatesPerScope;
      }

      let bestMatch: { prefix: string; limit: number } | undefined;

      for (const [prefix, limit] of Object.entries(options.maxStatesPerScope)) {
        if (scope.startsWith(prefix)) {
          if (!bestMatch || prefix.length > bestMatch.prefix.length) {
            bestMatch = { prefix, limit };
          }
        }
      }

      return bestMatch?.limit;
    };
  }

  /**
   * Push a new filter state onto the history.
   * If head is not at the leaf (after undo), states ahead of head are pruned.
   */
  async push<Scope extends FilterScope>(
    ctx: MutationCtx,
    scope: Scope,
    state: FilterState,
  ): Promise<void> {
    await ctx.runMutation(this.component.lib.push, {
      scope,
      state,
      maxStates: this.maxStatesForScope(scope),
    });
  }

  /**
   * Move head backward. Returns state at new position, or null if at position 0.
   */
  async undo<Scope extends FilterScope>(
    ctx: MutationCtx,
    scope: Scope,
    count: number = 1,
  ): Promise<FilterState | null> {
    return (await ctx.runMutation(this.component.lib.undo, {
      scope,
      count,
    })) as FilterState | null;
  }

  /**
   * Move head forward. Returns state at new position, or null if at leaf.
   */
  async redo<Scope extends FilterScope>(
    ctx: MutationCtx,
    scope: Scope,
    count: number = 1,
  ): Promise<FilterState | null> {
    return (await ctx.runMutation(this.component.lib.redo, {
      scope,
      count,
    })) as FilterState | null;
  }

  /**
   * Get current filter state without modifying history. Null if at position 0.
   */
  async currentState<Scope extends FilterScope>(
    ctx: QueryCtx,
    scope: Scope,
  ): Promise<FilterState | null> {
    return (await ctx.runQuery(this.component.lib.getCurrentState, {
      scope,
    })) as FilterState | null;
  }

  /**
   * Get filter history status: canUndo, canRedo, position, length.
   */
  async status<Scope extends FilterScope>(
    ctx: QueryCtx,
    scope: Scope,
  ): Promise<FilterHistoryStatus> {
    return (await ctx.runQuery(this.component.lib.getStatus, {
      scope,
    })) as FilterHistoryStatus;
  }

  /**
   * Create a named checkpoint of the current filter state.
   * Checkpoints persist even when history states are pruned.
   */
  async createCheckpoint<Scope extends FilterScope>(
    ctx: MutationCtx,
    scope: Scope,
    name: string,
  ): Promise<void> {
    await ctx.runMutation(this.component.lib.createCheckpoint, {
      scope,
      name,
    });
  }

  /**
   * Restore a checkpoint by pushing its state as a new state.
   * Non-destructive: you can undo the restore.
   */
  async restoreCheckpoint<Scope extends FilterScope>(
    ctx: MutationCtx,
    scope: Scope,
    name: string,
  ): Promise<FilterState> {
    return (await ctx.runMutation(this.component.lib.restoreCheckpoint, {
      scope,
      name,
      maxStates: this.maxStatesForScope(scope),
    })) as FilterState;
  }

  /**
   * Get a checkpoint's state without restoring it.
   */
  async getCheckpointState<Scope extends FilterScope>(
    ctx: QueryCtx,
    scope: Scope,
    name: string,
  ): Promise<FilterState | null> {
    return (await ctx.runQuery(this.component.lib.getCheckpointState, {
      scope,
      name,
    })) as FilterState | null;
  }

  /**
   * List all checkpoints for a scope with their names and positions.
   */
  async listCheckpoints<Scope extends FilterScope>(
    ctx: QueryCtx,
    scope: Scope,
  ): Promise<Checkpoint[]> {
    return (await ctx.runQuery(this.component.lib.listCheckpoints, {
      scope,
    })) as Checkpoint[];
  }

  /**
   * Delete a checkpoint.
   */
  async deleteCheckpoint<Scope extends FilterScope>(
    ctx: MutationCtx,
    scope: Scope,
    name: string,
  ): Promise<void> {
    await ctx.runMutation(this.component.lib.deleteCheckpoint, {
      scope,
      name,
    });
  }

  /**
   * Clear all states from a scope, resetting head to null. Checkpoints preserved.
   */
  async clear<Scope extends FilterScope>(
    ctx: MutationCtx,
    scope: Scope,
  ): Promise<void> {
    await ctx.runMutation(this.component.lib.clear, { scope });
  }

  /**
   * Delete a scope and all its data (states, checkpoints, scope record).
   */
  async deleteScope<Scope extends FilterScope>(
    ctx: MutationCtx,
    scope: Scope,
  ): Promise<void> {
    await ctx.runMutation(this.component.lib.deleteScope, { scope });
  }

  /**
   * Get state at a specific position without moving head.
   */
  async getStateAtPosition<Scope extends FilterScope>(
    ctx: QueryCtx,
    scope: Scope,
    position: number,
  ): Promise<FilterState | null> {
    return (await ctx.runQuery(this.component.lib.getStateAtPosition, {
      scope,
      position,
    })) as FilterState | null;
  }

  /**
   * List all states for a scope with their positions and states.
   */
  async listStates<Scope extends FilterScope>(
    ctx: QueryCtx,
    scope: Scope,
  ): Promise<Array<{ position: number; state: FilterState }>> {
    return (await ctx.runQuery(this.component.lib.listStates, {
      scope,
    })) as Array<{ position: number; state: FilterState }>;
  }

  /**
   * Create a scoped facade with the scope pre-bound.
   *
   * @example
   * ```ts
   * const userTableHistory = filterHistory.forScope("user:123:table:users");
   * await userTableHistory.push(ctx, {
   *   filters: { clauses: [...] },
   *   sortConfig: { field: "name", direction: "asc" }
   * });
   * await userTableHistory.undo(ctx);
   * ```
   */
  forScope<Scope extends FilterScope>(scope: Scope) {
    return {
      push: (ctx: MutationCtx, state: FilterState) =>
        this.push(ctx, scope, state),
      undo: (ctx: MutationCtx, count?: number) => this.undo(ctx, scope, count),
      redo: (ctx: MutationCtx, count?: number) => this.redo(ctx, scope, count),
      currentState: (ctx: QueryCtx) => this.currentState(ctx, scope),
      status: (ctx: QueryCtx) => this.status(ctx, scope),
      createCheckpoint: (ctx: MutationCtx, name: string) =>
        this.createCheckpoint(ctx, scope, name),
      restoreCheckpoint: (ctx: MutationCtx, name: string) =>
        this.restoreCheckpoint(ctx, scope, name),
      getCheckpointState: (ctx: QueryCtx, name: string) =>
        this.getCheckpointState(ctx, scope, name),
      listCheckpoints: (ctx: QueryCtx) => this.listCheckpoints(ctx, scope),
      deleteCheckpoint: (ctx: MutationCtx, name: string) =>
        this.deleteCheckpoint(ctx, scope, name),
      clear: (ctx: MutationCtx) => this.clear(ctx, scope),
      deleteScope: (ctx: MutationCtx) => this.deleteScope(ctx, scope),
      getStateAtPosition: (ctx: QueryCtx, position: number) =>
        this.getStateAtPosition(ctx, scope, position),
      listStates: (ctx: QueryCtx) => this.listStates(ctx, scope),
    };
  }
}
