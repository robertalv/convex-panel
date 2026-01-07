import { Database, Activity, Zap, Terminal } from "lucide-react";

export function IntroContent() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h3 className="text-2xl font-bold text-content-primary">Welcome to Convex Panel</h3>
      <p className="text-content-secondary text-lg leading-relaxed">
        Convex Panel is a powerful, open-source development tool designed specifically for the Convex ecosystem. 
        It provides a comprehensive real-time monitoring, debugging, and management interface that runs directly 
        in your browser, giving you complete visibility into your Convex backend without ever leaving your development environment.
      </p>

      <div className="mt-8 space-y-4">
        <h4 className="text-lg font-semibold text-content-primary">What Convex Panel Does</h4>
        <p className="text-content-secondary leading-relaxed">
          Convex Panel transforms your development workflow by providing instant access to your Convex application's 
          internals. Whether you're debugging a tricky query, monitoring system health, or inspecting live data, 
          everything you need is available in a beautiful, intuitive interface that stays out of your way until you need it.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <div className="p-4 rounded-xl border border-border bg-background-secondary/30">
          <Database className="w-6 h-6 text-blue-500 mb-3" />
          <h4 className="font-medium text-content-primary mb-1">Data Management</h4>
          <p className="text-sm text-content-tertiary">
            Browse, filter, sort, and edit your Convex tables with an intuitive interface. Double-click to edit values directly.
          </p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-background-secondary/30">
          <Activity className="w-6 h-6 text-green-500 mb-3" />
          <h4 className="font-medium text-content-primary mb-1">Live Logs & Monitoring</h4>
          <p className="text-sm text-content-tertiary">
            Monitor function calls, HTTP actions, and system events in real-time. Track performance metrics and health indicators.
          </p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-background-secondary/30">
          <Zap className="w-6 h-6 text-yellow-500 mb-3" />
          <h4 className="font-medium text-content-primary mb-1">Function Testing</h4>
          <p className="text-sm text-content-tertiary">
            Execute queries, mutations, and actions directly from the panel with custom inputs. View source code with syntax highlighting.
          </p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-background-secondary/30">
          <Terminal className="w-6 h-6 text-purple-500 mb-3" />
          <h4 className="font-medium text-content-primary mb-1">Zero Configuration</h4>
          <p className="text-sm text-content-tertiary">
            Drop it into your app and it automatically detects your Convex client. Works with React, Next.js and TanStack Start.
          </p>
        </div>
      </div>
    </div>
  );
}
