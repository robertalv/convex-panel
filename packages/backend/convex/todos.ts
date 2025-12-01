import { internal } from "./_generated/api";
import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

const categoryEnum = v.union(
  v.literal("Work"),
  v.literal("Chores"),
  v.literal("Other")
);

// Public query used by the marketing site's <TodoApp />
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit }) => {
    const docs = await ctx.db
      .query("todos")
      .order("desc")
      .take(limit ?? 100);

    // Bridge existing schema (title/done/archived) to the demo UI shape
    return docs.map((doc) => {
      const completed =
        (doc as any).completed ?? (doc as any).done ?? false;

      return {
        ...doc,
        text: (doc as any).text ?? (doc as any).title ?? "",
        category: (doc as any).category ?? "Other",
        completed,
      };
    });
  },
});

export const create = mutation({
  args: {
    text: v.string(),
    category: categoryEnum,
  },
  handler: async (ctx, { text, category }) => {
    const id = await ctx.db.insert("todos", {
      // Existing backend fields
      title: text,
      done: false,
      // Fields used by the demo UI
      text,
      category,
    });

    return id;
  },
});

export const toggle = mutation({
  args: {
    id: v.id("todos"),
  },
  handler: async (ctx, { id }) => {
    const todo = await ctx.db.get(id);
    if (!todo) {
      throw new Error("Todo not found");
    }

    const prevCompleted =
      (todo as any).completed ?? (todo as any).done ?? false;
    const completed = !prevCompleted;

    await ctx.db.patch(id, {
      done: completed,
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("todos"),
  },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

export const seedDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    const demoTodos = [
      {
        text: "Update project status",
        category: "Work" as const,
        completed: false,
      },
      {
        text: "Schedule a team meeting",
        category: "Work" as const,
        completed: false,
      },
      {
        text: "Do laundry",
        category: "Chores" as const,
        completed: false,
      },
      {
        text: "Go to the doctor",
        category: "Other" as const,
        completed: false,
      },
      {
        text: "Go to the gym",
        category: "Other" as const,
        completed: false,
      },
      {
        text: "Clean my room",
        category: "Chores" as const,
        completed: true,
      },
      {
        text: "Play tennis with Steve",
        category: "Other" as const,
        completed: false,
      },
      {
        text: "Play basketball",
        category: "Other" as const,
        completed: false,
      },
      {
        text: "Talk to my boss",
        category: "Work" as const,
        completed: false,
      },
      {
        text: "Buy groceries",
        category: "Chores" as const,
        completed: true,
      },
    ];

    for (const todo of demoTodos) {
      await ctx.db.insert("todos", {
        title: todo.text,
        done: todo.completed,
        text: todo.text,
        category: todo.category,
      });
    }

    return { created: demoTodos.length };
  },
});

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
        .withIndex("by_done", q =>
          q.eq("done", true).gte("_creationTime", oneHourAgo)
        )
        .collect();
  
      for (const todo of oldTodos) {
        await ctx.db.patch(todo._id, { done: true });
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
