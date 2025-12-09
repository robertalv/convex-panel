import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const getFirstFewTodos = internalAction({
  args: {
    opts: v.object({
      limit: v.number(),
      skip: v.number(),
    }),
  },
  handler: async (ctx, { opts }): Promise<void> => {
    await fetch(
      `https://dummyjson.com/todos?limit=${opts.limit}&skip=${opts.skip}`
    ).then((res) => res.json());

    await ctx.runMutation(internal.todos.addRandomTodosAfter5Min);
  },
});