import { internal } from "./_generated/api";
import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("todos").order("desc").collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
  },
  handler: async (ctx, { title }) => {
    return ctx.db.insert("todos", {
      title,
      done: false,
      archived: false,
    });
  },
});

export const toggle = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const aId = ctx.db.normalizeId("todos", id)
    if(!aId) return;
    const todo = await ctx.db.get(aId);
    if (!todo) throw new Error("Todo not found");

    await ctx.db.patch(aId, { done: !todo.done });

    await ctx.runMutation(internal.todo.addRandomTodosAfter5Min)
  },
});


export const remove = mutation({
  args: { id: v.string()},
  handler: async (ctx, { id }) => {
        const aId = ctx.db.normalizeId("todos", id)
    if(!aId) return;
    await ctx.db.delete(aId);
  },
});


export const insertFetchedTodos = internalMutation({
  args: {
    todos: v.array(
      v.object({
        id: v.number(),
        todo: v.string(),
        completed: v.boolean(),
        userId: v.number(),
      })
    ),
  },
  handler: async (ctx, { todos }) => {
    // Insert each todo into your database
    for (const todo of todos) {
      await ctx.db.insert("todos", {
        title: todo.todo,
        done: todo.completed,
        // You might want to store userId or other fields too
      });
    }
  },
});

// Scheduler to trigger the fetch and insert
export const addRandomTodosAfter5Min = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(
      300000,
      internal.dummyjson.getFirstFewTodos,
      { opts: { limit: 10, skip: 0 } }
    );
  },
});


export const archiveOldTodos = internalMutation({
  args: {},
  handler: async (ctx) => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    const oldTodos = await ctx.db
      .query("todos")
      .withIndex("by_archived", q =>
        q.eq("archived", true).gte("_creationTime", oneHourAgo)
      )
      .collect();

    for (const todo of oldTodos) {
      await ctx.db.patch(todo._id, { archived: true });
    }

    console.log(`Archived ${oldTodos.length} todos older than 1 hour`);
    return { archived: oldTodos.length };
  },
});

export const deleteCompletedTodos = internalMutation({
  args: {},
  handler: async (ctx) => {
    const completedTodos = await ctx.db
      .query("todos")
      .withIndex("by_done", (q) => q.eq("done", true))
      .collect();

    for (const todo of completedTodos) {
      await ctx.db.delete(todo._id);
    }

    console.log(`Deleted ${completedTodos.length} completed todos`);
    return { deleted: completedTodos.length };
  },
});