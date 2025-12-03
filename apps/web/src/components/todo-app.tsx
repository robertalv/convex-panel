"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/backend/convex/_generated/api";
import type { Id } from "@repo/backend/convex/_generated/dataModel";
import { Check, Plus, Trash2, RefreshCw } from "lucide-react";
import { cn } from "../lib/utils";

type Category = "Work" | "Chores" | "Other";

const categoryColors: Record<Category, string> = {
  Work: "bg-[#F3B01C] text-black",
  Chores: "bg-[#34D399] text-black",
  Other: "bg-[#6B7280] text-white",
};

const categoryBorderColors: Record<Category, string> = {
  Work: "border-[#F3B01C]/30 hover:border-[#F3B01C]",
  Chores: "border-[#34D399]/30 hover:border-[#34D399]",
  Other: "border-[#6B7280]/30 hover:border-[#6B7280]",
};

export function TodoApp() {
  const todos = useQuery(api.todos.list, { limit: 10 });
  const createTodo = useMutation(api.todos.create);
  const toggleTodo = useMutation(api.todos.toggle);
  const removeTodo = useMutation(api.todos.remove);
  const seedData = useMutation(api.todos.seedDemoData);


  const [newTodoText, setNewTodoText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("Work");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    
    setIsAdding(true);
    try {
      await createTodo({ text: newTodoText.trim(), category: selectedCategory });
      setNewTodoText("");
    } catch (error: any) {
      // Handle paused deployment error gracefully
      if (error?.message?.includes('paused') || error?.message?.includes('Cannot run functions while')) {
        console.warn('Deployment is paused, cannot create todo');
        // Error will be shown by error boundary
        return;
      }
      throw error; // Re-throw other errors
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggle = async (id: Id<"todos">) => {
    try {
      await toggleTodo({ id });
    } catch (error: any) {
      if (error?.message?.includes('paused') || error?.message?.includes('Cannot run functions while')) {
        console.warn('Deployment is paused, cannot toggle todo');
        return;
      }
      throw error;
    }
  };

  const handleRemove = async (id: Id<"todos">) => {
    try {
      await removeTodo({ id });
    } catch (error: any) {
      if (error?.message?.includes('paused') || error?.message?.includes('Cannot run functions while')) {
        console.warn('Deployment is paused, cannot remove todo');
        return;
      }
      throw error;
    }
  };

  const lastCategorizedTime = todos && todos.length > 0 
    ? new Date(todos[0]._creationTime).toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    : "No data";

  // Handle paused deployment error
  if (todos === null) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-6 text-center">
          <div className="text-yellow-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Deployment Paused
          </h2>
          <p className="text-sm text-muted-foreground">
            This deployment is currently paused. Resume the deployment in the dashboard settings to allow functions to run.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* App Window Chrome */}
      <div className="rounded-xl border border-[#34D399]/20 bg-background/80 backdrop-blur-sm overflow-hidden shadow-xl shadow-[#34D399]/5">
        {/* Title Bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/30">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs text-muted-foreground ml-2 font-mono">my-amazing-project.app</span>
        </div>

        {/* App Content */}
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-muted-foreground">
              Last categorized: <span className="text-foreground">{lastCategorizedTime}</span>
            </span>
            <button
              onClick={() => seedData()}
              className="text-xs text-muted-foreground hover:text-[#34D399] transition-colors flex items-center gap-1"
              title="Seed demo data"
            >
              <RefreshCw className="size-3" />
              Seed
            </button>
          </div>

          {/* Todo List */}
          <div className="space-y-2 mb-4 max-h-[280px] overflow-y-auto pr-1">
            {todos === undefined ? (
              // Loading state
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 animate-pulse">
                    <div className="w-5 h-5 rounded border-2 border-muted" />
                    <div className="h-4 bg-muted rounded flex-1" />
                    <div className="h-5 w-14 bg-muted rounded-full" />
                  </div>
                ))}
              </div>
            ) : todos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No todos yet. Add one below or seed demo data!
              </div>
            ) : (
              todos.map((todo) => (
                <TodoItem
                  key={todo._id}
                  id={todo._id}
                  text={todo.text}
                  category={todo.category as Category}
                  completed={todo.completed}
                  onToggle={handleToggle}
                  onRemove={handleRemove}
                />
              ))
            )}
          </div>

          {/* Add Todo Form */}
          <form onSubmit={handleAddTodo} className="flex items-center gap-2">
            <input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              placeholder="Add a new task..."
              className="flex-1 px-3 py-2 text-sm bg-muted/30 border border-border/50 rounded-lg focus:outline-none focus:border-[#34D399]/50 focus:ring-1 focus:ring-[#34D399]/20 placeholder:text-muted-foreground"
            />
            <CategorySelector value={selectedCategory} onChange={setSelectedCategory} />
            <button
              type="submit"
              disabled={isAdding || !newTodoText.trim()}
              className="px-4 py-2 bg-[#34D399] hover:bg-[#26a878] text-black text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Plus className="size-4" />
              Add
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// TodoItem Component
interface TodoItemProps {
  id: Id<"todos">;
  text: string;
  category: Category;
  completed: boolean;
  onToggle: (id: Id<"todos">) => void;
  onRemove: (id: Id<"todos">) => void;
}

function TodoItem({ id, text, category, completed, onToggle, onRemove }: TodoItemProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-3 p-2 rounded-lg border transition-all",
        "bg-muted/20 hover:bg-muted/40",
        categoryBorderColors[category]
      )}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(id)}
        className={cn(
          "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
          completed
            ? "bg-[#34D399] border-[#34D399]"
            : "border-muted-foreground/50 hover:border-[#34D399]"
        )}
      >
        {completed && <Check className="size-3 text-black" strokeWidth={3} />}
      </button>

      {/* Text */}
      <span className={cn(
        "flex-1 text-sm transition-all",
        completed && "line-through text-muted-foreground"
      )}>
        {text}
      </span>

      {/* Category Badge */}
      <span className={cn(
        "px-2 py-0.5 text-xs font-medium rounded-full",
        categoryColors[category]
      )}>
        {category}
      </span>

      {/* Delete Button */}
      <button
        onClick={() => onRemove(id)}
        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-500 transition-all"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

// Category Selector Component
interface CategorySelectorProps {
  value: Category;
  onChange: (category: Category) => void;
}

function CategorySelector({ value, onChange }: CategorySelectorProps) {
  const categories: Category[] = ["Work", "Chores", "Other"];

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Category)}
        className={cn(
          "appearance-none px-3 py-2 pr-8 text-xs font-medium rounded-lg border cursor-pointer transition-all",
          "bg-muted/30 focus:outline-none focus:ring-1",
          value === "Work" && "border-[#F3B01C]/50 focus:border-[#F3B01C] focus:ring-[#F3B01C]/20",
          value === "Chores" && "border-[#34D399]/50 focus:border-[#34D399] focus:ring-[#34D399]/20",
          value === "Other" && "border-[#6B7280]/50 focus:border-[#6B7280] focus:ring-[#6B7280]/20"
        )}
      >
        {categories.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="size-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

