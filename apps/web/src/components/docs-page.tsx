import { useMemo, useState } from "react";
import {
  Activity,
  Database,
  FileCode,
  Layout,
  Play,
  Server,
  Settings,
  Terminal,
} from "lucide-react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { DocsNavSection, DocsPath, Framework } from "./docs/constants";
import { CommandPalette } from "./docs/command-palette";
import { FrameworkSelector } from "./docs/framework-selector";
import {
  ConfigurationContent,
  EnvironmentContent,
  GenericViewContent,
  InstallationContent,
  IntroContent,
  QuickStartContent,
} from "./docs/sections";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const docsNav: DocsNavSection[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Introduction",
        href: "/docs",
        icon: Layout,
        description: "What is Convex Panel?",
      },
      {
        label: "Installation",
        href: "/docs/installation",
        icon: Terminal,
        description: "Add the package to your project",
      },
      {
        label: "Environment Setup",
        href: "/docs/environment",
        icon: Settings,
        description: "Configure variables & connections",
      },
    ],
  },
  {
    title: "Integration",
    items: [
      {
        label: "Quick Start",
        href: "/docs/quick-start",
        icon: Play,
        description: "Get up and running in seconds",
      },
      {
        label: "Configuration",
        href: "/docs/configuration",
        icon: Server,
        description: "Customizing behavior and themes",
      },
    ],
  },
  {
    title: "Features",
    items: [
      {
        label: "Data View",
        href: "/docs/data-view",
        icon: Database,
        description: "Browse and edit your data",
      },
      {
        label: "Logs View",
        href: "/docs/logs-view",
        icon: Activity,
        description: "Real-time function logs",
      },
      {
        label: "Functions Runner",
        href: "/docs/functions",
        icon: FileCode,
        description: "Test queries & mutations",
      },
    ],
  },
];

export const DocsPage: React.FC = () => {
  const [framework, setFramework] = useState<Framework>("react");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState<DocsPath>("/docs");

  const showFrameworkSelector = useMemo(
    () =>
      ["/docs/installation", "/docs/environment", "/docs/quick-start"].includes(
        currentPath,
      ),
    [currentPath],
  );

  const currentContent = useMemo(() => {
    switch (currentPath) {
      case "/docs":
        return <IntroContent />;
      case "/docs/installation":
        return <InstallationContent />;
      case "/docs/environment":
        return <EnvironmentContent framework={framework} />;
      case "/docs/quick-start":
        return <QuickStartContent framework={framework} />;
      case "/docs/configuration":
        return <ConfigurationContent />;
      case "/docs/data-view":
        return (
          <GenericViewContent
            title="Data View"
            description="Browse, filter, sort, and edit your Convex tables with an intuitive interface designed for speed and reliability."
            features={[
              "Table Browser: View all tables with paginated data display",
              "Advanced Filtering: Query-based filtering with date ranges and full-text search",
              "In-place Editing: Double-click any cell to edit (auto-converts types)",
              "Context Menu: Right-click for quick actions (copy, delete, view details)",
            ]}
          />
        );
      case "/docs/logs-view":
        return (
          <GenericViewContent
            title="Logs View"
            description="Real-time function logs with powerful filtering and search capabilities."
            features={[
              "Type Filtering: SUCCESS, FAILURE, DEBUG, WARNING, ERROR, HTTP",
              "Full-text Search: Search across all log messages instantly",
              "Time Range: Filter logs by specific time periods to debug historical issues",
              "Export: Download logs in JSON format for external analysis",
            ]}
          />
        );
      case "/docs/functions":
        return (
          <GenericViewContent
            title="Functions Runner"
            description="Test and debug your Convex functions directly from the panel without writing a script."
            features={[
              "Function Runner: Execute queries, mutations, and actions",
              "Code Inspection: View source code with syntax highlighting",
              "Input Editor: Monaco-powered editor with JSON validation",
              "Performance Metrics: View execution time and gas consumption",
            ]}
          />
        );
      default:
        return (
          <IntroContent />
        );
    }
  }, [currentPath, framework]);

  return (
    <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <CommandPalette
        open={cmdOpen}
        setOpen={setCmdOpen}
        docsNav={docsNav}
        onNavigate={(href) => setCurrentPath(href)}
      />

      <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex w-64 flex-col gap-6 sticky top-[90px] h-[calc(100vh-8rem)]">
          <button
            type="button"
            onClick={() => setCmdOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-background-secondary/50 border border-border/60 text-sm text-content-secondary hover:text-content-primary hover:border-border hover:bg-background-secondary transition-all group shadow-sm text-left"
          >
            <Terminal className="w-4 h-4 opacity-50 group-hover:opacity-100" />
            <span className="flex-1">Search docs...</span>
            <kbd className="hidden xl:inline-flex items-center gap-0.5 px-1.5 h-5 text-[10px] font-medium text-content-tertiary bg-background-tertiary rounded border border-border">
              <span className="text-xs">⌘</span>
              K
            </kbd>
          </button>

          <nav className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10 space-y-8">
            {docsNav.map((section) => (
              <div key={section.title}>
                <h3 className="text-[11px] font-bold text-content-tertiary uppercase tracking-widest mb-3 pl-3">
                  {section.title}
                </h3>
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = currentPath === item.href;
                    return (
                      <li key={item.href}>
                        <button
                          type="button"
                          onClick={() => setCurrentPath(item.href)}
                          className={cn(
                            "relative flex w-full items-center py-2 px-3 rounded-md text-sm transition-all duration-200 group text-left",
                            isActive
                              ? "text-content-primary font-medium bg-background-secondary"
                              : "text-content-secondary hover:text-content-primary hover:bg-background-secondary/50",
                          )}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="sidebar-active-pill"
                              className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.6)]"
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 30,
                              }}
                            />
                          )}

                          <span className="relative z-10 flex items-center gap-3">
                            <item.icon
                              className={cn(
                                "w-4 h-4 transition-colors",
                                isActive
                                  ? "text-primary"
                                  : "opacity-60 group-hover:opacity-100",
                              )}
                            />
                            {item.label}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Mobile Nav */}
        <div className="lg:hidden mb-6">
          <button
            type="button"
            onClick={() => setCmdOpen(true)}
            className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-background-secondary border border-border text-sm text-content-secondary hover:text-content-primary shadow-sm"
          >
            <Terminal className="w-4 h-4" />
            <span>Search documentation...</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 pb-20">
          {showFrameworkSelector && (
            <div className="mb-10">
              <FrameworkSelector current={framework} onChange={setFramework} />
            </div>
          )}

          {currentContent}

          <div className="mt-20 pt-8 border-t border-border/40 flex justify-between gap-4">
            <div className="text-sm text-content-tertiary">
              Was this page helpful?
              <button
                type="button"
                className="text-primary hover:underline ml-1"
              >
                Give feedback
              </button>
            </div>
            <div className="text-sm text-content-tertiary">
              Last updated on Dec 3, 2023
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

