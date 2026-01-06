import { useState, useMemo } from "react";
import type { Project, Team, User } from "convex-panel";
import {
  Search,
  Grid3X3,
  List,
  Zap,
  BookOpen,
  ExternalLink,
  Play,
  Code,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "./ProjectCard";
import { WelcomeBanner } from "./WelcomeBanner";
import { cn } from "@/lib/utils";
import { TierBadge } from "@/components/TierBadge";
import type { TeamSubscription } from "@/api/bigbrain";

interface ProjectSelectorProps {
  user: User | null;
  team: Team | null;
  projects: Project[];
  subscription?: TeamSubscription | null;
  onSelectProject: (project: Project) => void;
}

// Quick action links
const QUICK_LINKS = [
  {
    label: "Documentation",
    href: "https://docs.convex.dev",
    icon: BookOpen,
  },
  {
    label: "Tutorial",
    href: "https://docs.convex.dev/tutorial",
    icon: Play,
  },
  {
    label: "API Reference",
    href: "https://docs.convex.dev/api",
    icon: Code,
  },
];

export function ProjectSelector({
  user,
  team,
  projects,
  subscription,
  onSelectProject,
}: ProjectSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name?.toLowerCase().includes(query) ||
        p.slug.toLowerCase().includes(query),
    );
  }, [projects, searchQuery]);

  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => b.id - a.id);
  }, [filteredProjects]);

  const firstName = user?.name?.split(" ")[0] || user?.name;

  const openExternalLink = async (url: string) => {
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      const { open } = await import("@tauri-apps/plugin-shell");
      open(url);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="flex h-full flex-col bg-background-base overflow-auto">
      <div className="flex-1 p-6 lg:p-8">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Header with greeting and team info */}
          <div className="flex flex-row items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-text-base">
                  {team?.name || "Dashboard"}
                </h1>
                {team && <TierBadge subscription={subscription ?? null} />}
              </div>
              {firstName && (
                <p className="mt-1 text-sm text-text-muted">
                  Welcome back, {firstName}
                </p>
              )}
            </div>

            {/* Project Status indicator */}
            <div className="flex items-center gap-2 rounded-lg border border-border-base bg-surface-base px-3 py-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm text-text-muted">
                All systems operational
              </span>
            </div>
          </div>

          <WelcomeBanner userName={firstName} team={team} />

          {/* Welcome section with getting started */}
          <div className="rounded-xl border border-border-base bg-surface-base p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-xl">
                <h2 className="text-lg font-semibold text-text-base">
                  Welcome to your workspace
                </h2>
                <p className="mt-2 text-sm text-text-muted leading-relaxed">
                  Your projects are deployed on their own instances, with their
                  own APIs all set up and ready to use. Select a project below
                  to explore its data, functions, and more.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {QUICK_LINKS.map((link) => (
                    <Button
                      key={link.label}
                      variant="outline"
                      size="sm"
                      onClick={() => openExternalLink(link.href)}
                      className="gap-1.5"
                    >
                      <link.icon className="h-3.5 w-3.5" />
                      {link.label}
                      <ExternalLink className="h-3 w-3 text-text-subtle" />
                    </Button>
                  ))}
                </div>
              </div>

              {/* Mini code snippet preview */}
              <div className="shrink-0 rounded-lg border border-border-base bg-background-base p-4 font-mono text-xs">
                <div className="text-text-subtle">// Quick start</div>
                <div className="mt-1">
                  <span className="text-purple-400">npx</span>{" "}
                  <span className="text-text-base">convex dev</span>
                </div>
              </div>
            </div>
          </div>

          {/* Projects section */}
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-medium text-text-base">
                Your Projects
              </h2>
              <div className="flex items-center gap-2">
                {/* View mode toggle */}
                <div className="flex rounded-lg border border-border-base bg-surface-base p-0.5">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "h-7 w-7",
                      viewMode === "grid" && "bg-surface-raised",
                    )}
                    title="Grid view"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "h-7 w-7",
                      viewMode === "list" && "bg-surface-raised",
                    )}
                    title="List view"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                {/* Search input */}
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
                  <Input
                    type="search"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {/* Projects grid/list */}
            {sortedProjects.length > 0 ? (
              <div
                className={cn(
                  "grid gap-3",
                  viewMode === "grid"
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    : "grid-cols-1",
                )}
              >
                {sortedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onSelect={onSelectProject}
                  />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <EmptyProjectsState />
            ) : (
              <NoSearchResultsState />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Empty state when no projects exist
function EmptyProjectsState() {
  const openTutorial = async () => {
    const url = "https://docs.convex.dev/tutorial";
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      const { open } = await import("@tauri-apps/plugin-shell");
      open(url);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-base bg-surface-base py-16">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-raised">
        <Zap className="h-6 w-6 text-brand-base" />
      </div>
      <h3 className="text-base font-medium text-text-base">
        Welcome to Convex!
      </h3>
      <p className="mt-1 max-w-sm text-center text-sm text-text-muted">
        This team doesn&apos;t have any projects yet. Get started by following
        our tutorial.
      </p>
      <Button onClick={openTutorial} className="mt-4 gap-1.5">
        <Play className="h-4 w-4" />
        Start Tutorial
        <ExternalLink className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// No search results state
function NoSearchResultsState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-base bg-surface-base py-12">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-raised">
        <Search className="h-5 w-5 text-text-muted" />
      </div>
      <h3 className="text-sm font-medium text-text-base">
        No matching projects
      </h3>
      <p className="mt-1 text-sm text-text-muted">
        Try a different search term
      </p>
    </div>
  );
}

export { ProjectCard } from "./ProjectCard";
export { WelcomeBanner } from "./WelcomeBanner";
