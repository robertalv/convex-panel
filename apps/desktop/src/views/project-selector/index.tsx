import { useState, useMemo } from "react";
import type { Project, Team, User } from "@/types/desktop";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { ProjectCard } from "./ProjectCard";
import { WelcomeBanner } from "./WelcomeBanner";
import { cn, openExternalLink } from "@/lib/utils";
import { TierBadge } from "@/components/tier-badge";
import type { TeamSubscription } from "@/api/bigbrain";
import { Icon } from "@/components/ui/icon";
import { CodeDiffViewer } from "@/components/ui/code-diff-viewer";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useConvexStatus, getStatusColor } from "@/hooks/useConvexStatus";
import ConvexLogo from "@/components/svg/convex-logo";
import { QUICK_LINKS } from "@/lib/constants";

interface ProjectSelectorProps {
  user: User | null;
  team: Team | null;
  projects: Project[];
  subscription?: TeamSubscription | null;
  onSelectProject: (project: Project) => void;
}

function QuickStartCodeBlock() {
  const { copied, copy } = useCopyToClipboard();
  const commandText = `npx convex dev`;

  const handleCopy = () => {
    copy(commandText);
  };

  return (
    <div className="group relative shrink-0">
      <CodeDiffViewer
        oldContent=""
        newContent={commandText}
        fileName="command.js"
        language="typescript"
        showLineNumbers={false}
        className="min-w-[200px]"
      />
      <Button
        variant="link"
        size="icon-sm"
        onClick={handleCopy}
        className="absolute right-0.5 top-0.25 z-10 h-6 w-6"
        tooltip={copied ? "Copied!" : "Copy command"}
      >
        <Icon
          name={copied ? "check" : "copy"}
          className={cn(
            "h-3.5 w-3.5",
            copied ? "text-green-500" : "text-text-muted",
          )}
        />
      </Button>
    </div>
  );
}

export function ProjectSelector({
  user,
  team,
  projects,
  subscription,
  onSelectProject,
}: ProjectSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const status = useConvexStatus();

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

  return (
    <div className="flex h-full flex-col bg-background-base overflow-auto">
      <div className="flex-1 p-6 lg:p-8">
        <div className="mx-auto max-w-6xl space-y-4">
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

            <Button
              onClick={() => openExternalLink("https://status.convex.dev/")}
              variant="link"
              className="!p-0 !py-0 h-auto text-text-base"
              disabled={status.isLoading}
              title="View status page"
            >
              <div
                className={cn(
                  "size-2 rounded-full animate-pulse",
                  getStatusColor(status.indicator),
                )}
              />
              <span>
                {status.isLoading ? "Checking status..." : status.description}
              </span>
            </Button>
          </div>

          <WelcomeBanner userName={firstName} team={team} />

          <div>
            <div className="flex flex-row gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
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
                      <Icon name={link.icon} className="h-3.5 w-3.5" />
                      {link.label}
                    </Button>
                  ))}
                </div>
              </div>

              <QuickStartCodeBlock />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-row gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-medium">
                Your Projects
              </h2>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5 rounded-lg border border-border-base bg-surface-base p-0.5">
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
                    <Icon name="grid" className="h-4 w-4" />
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
                    <Icon name="list" className="h-4 w-4" />
                  </Button>
                </div>

                <SearchInput
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

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
            ) : projects.length === 1 ? (
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

function EmptyProjectsState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-base bg-surface-base py-16">
      <ConvexLogo size={48} />
      <h3 className="text-base font-medium text-text-base mt-4">
        Welcome to Convex!
      </h3>
      <p className="mt-1 max-w-sm text-center text-sm text-text-muted">
        This team doesn&apos;t have any projects yet. Get started by following
        our tutorial.
      </p>
      <Button onClick={() => openExternalLink("https://docs.convex.dev/tutorial")} className="mt-4 gap-1.5">
          <Icon name="play" className="h-4 w-4" />
          Start Tutorial
      </Button>
    </div>
  );
}

function NoSearchResultsState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-raised">
        <Icon name="search" className="h-5 w-5 text-text-muted" />
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
