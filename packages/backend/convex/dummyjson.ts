import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

type Todo = {
  id: number;
  todo: string;
  completed: boolean;
  userId: number;
};

type TodoList = {
  total: number;
  skip: number;
  limit: number;
  todos: Todo[];
};

export const getFirstFewTodos = internalAction({
  args: {
    opts: v.object({
      limit: v.number(),
      skip: v.number(),
    }),
  },
  handler: async (ctx, { opts }): Promise<void> => {
    const data: TodoList = await fetch(
      `https://dummyjson.com/todos?limit=${opts.limit}&skip=${opts.skip}`
    ).then((res) => res.json());

    console.log(data)
    // Call the mutation to insert the todos
    await ctx.runMutation(internal.todos.addRandomTodosAfter5Min);
  },
});