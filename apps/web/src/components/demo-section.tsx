"use client";

import { TodoApp } from './todo-app';
import { Play, Code2 } from 'lucide-react';

const codeSnippet = `// convex/todos.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    return ctx.db
      .query("todos")
      .order("desc")
      .take(limit ?? 100);
  },
});

export const create = mutation({
  args: {
    text: v.string(),
    category: v.union(
      v.literal("Work"),
      v.literal("Chores"),
      v.literal("Other")
    ),
  },
  handler: async (ctx, { text, category }) => {
    return ctx.db.insert("todos", {
      text,
      category,
      completed: false,
    });
  },
});

export const toggle = mutation({
  args: { id: v.id("todos") },
  handler: async (ctx, { id }) => {
    const todo = await ctx.db.get(id);
    if (!todo) throw new Error("Not found");
    await ctx.db.patch(id, { 
      completed: !todo.completed 
    });
  },
});`;

export default function DemoSection() {
  return (
    <section className="py-16 md:py-24 relative">
      {/* Section divider */}
      <div className="section-divider mb-16 md:mb-20" />
      
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 text-[#34D399] text-sm font-medium uppercase tracking-wider">
            <Play className="size-4" />
            Live Demo
          </span>
          <h2 className="text-3xl font-medium lg:text-4xl mt-3">
            Try It <span className="text-gradient-accent">Live</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            This todo app is powered by Convex. Add, toggle, and delete todos — watch it update in real-time. 
            Open the Convex Panel at the bottom to see your data and logs!
          </p>
        </div>

        {/* Demo Content */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Code Editor Panel */}
          <div className="rounded-xl border border-[#34D399]/20 bg-background/80 backdrop-blur-sm overflow-hidden shadow-xl shadow-[#34D399]/5 order-2 lg:order-1">
            {/* Editor Title Bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/30">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex items-center gap-2 ml-2">
                <Code2 className="size-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-mono">convex/todos.ts</span>
              </div>
            </div>
            
            {/* Code Content */}
            <div className="p-4 overflow-x-auto">
              <pre className="text-xs font-mono leading-relaxed">
                <code className="text-muted-foreground">
                  {codeSnippet.split('\n').map((line, i) => (
                    <div key={i} className="flex">
                      <span className="text-muted-foreground/50 w-8 text-right pr-4 select-none">{i + 1}</span>
                      <span className={getLineClassName(line)}>{highlightSyntax(line)}</span>
                    </div>
                  ))}
                </code>
              </pre>
            </div>
          </div>

          {/* Todo App Panel */}
          <div className="order-1 lg:order-2">
            <TodoApp />
          </div>
        </div>

        {/* Hint */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            💡 <span className="text-[#34D399]">Tip:</span> Click the panel at the bottom of the screen to see your todos in the Data tab and function calls in the Logs tab!
          </p>
        </div>
      </div>
    </section>
  );
}

function getLineClassName(line: string): string {
  if (line.trim().startsWith('//')) return 'text-muted-foreground/60 italic';
  return '';
}

function highlightSyntax(line: string): React.ReactNode {
  // Simple syntax highlighting
  const keywords = ['import', 'export', 'const', 'async', 'await', 'return', 'if', 'throw', 'new'];
  const types = ['query', 'mutation', 'v', 'ctx', 'id'];
  
  let result = line;
  
  // Highlight strings
  result = result.replace(/"([^"]*)"/g, '<span class="text-[#34D399]">"$1"</span>');
  result = result.replace(/'([^']*)'/g, '<span class="text-[#34D399]">\'$1\'</span>');
  
  // Highlight keywords
  keywords.forEach(kw => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g');
    result = result.replace(regex, '<span class="text-[#F3B01C]">$1</span>');
  });
  
  // Highlight comments
  if (line.trim().startsWith('//')) {
    return <span className="text-muted-foreground/60 italic">{line}</span>;
  }
  
  return <span dangerouslySetInnerHTML={{ __html: result }} />;
}

