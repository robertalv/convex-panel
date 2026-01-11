import * as React from "react";
import { cn } from "@/lib/utils";
import { ConvexLogo } from "@/components/svg/convex-logo";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { UserMenu } from "./user-menu";
import type { Team, Project, Deployment, User, ThemeType } from "@/types/desktop";
import type { TeamSubscription } from "@/api/bigbrain";
import { useIsFullscreen } from "../../hooks/useIsFullscreen";
import { TerminalButton } from "../terminal-button";

interface TopBarProps {
  user: User | null;
  teams: Team[];
  projects: Project[];
  deployments: Deployment[];
  selectedTeam: Team | null;
  selectedProject: Project | null;
  selectedDeployment: Deployment | null;
  subscription: TeamSubscription | null;
  onSelectTeam: (team: Team) => void;
  onSelectProject: (project: Project) => void;
  onSelectDeployment: (deployment: Deployment) => void;
  onOpenPalette: () => void;
  onThemeChange: (theme: ThemeType) => void;
  onDisconnect: () => void;
  onOpenSettings?: () => void;
  onNavigateToProjectSelector?: () => void;
  theme: ThemeType;
  className?: string;
  deploymentsLoading?: boolean;
}

export function TopBar({
  user,
  teams,
  projects,
  deployments,
  selectedTeam,
  selectedProject,
  selectedDeployment,
  subscription,
  onSelectTeam,
  onSelectProject,
  onSelectDeployment,
  onOpenPalette: _onOpenPalette,
  onThemeChange,
  onDisconnect,
  onOpenSettings,
  onNavigateToProjectSelector,
  theme,
  className,
  deploymentsLoading = false,
}: TopBarProps) {
  const isFullscreen = useIsFullscreen();

  const teamOptions = React.useMemo(
    () => teams.map((t) => ({ value: String(t.id), label: t.name })),
    [teams],
  );

  const projectOptions = React.useMemo(
    () => projects.map((p) => ({ value: String(p.id), label: p.name })),
    [projects],
  );

  const deploymentOptions = React.useMemo(() => {
    if (deployments.length === 0 && selectedDeployment && deploymentsLoading) {
      return [
        {
          value: String(selectedDeployment.id),
          label: selectedDeployment.name,
          sublabel: selectedDeployment.deploymentType,
        },
      ];
    }
    return deployments.map((d) => ({
      value: String(d.id),
      label: d.name,
      sublabel: d.deploymentType,
    }));
  }, [deployments, selectedDeployment, deploymentsLoading]);

  const handleTeamChange = React.useCallback(
    (value: string) => {
      const team = teams.find((t) => String(t.id) === value);
      if (team) onSelectTeam(team);
    },
    [teams, onSelectTeam],
  );

  const handleProjectChange = React.useCallback(
    (value: string) => {
      const project = projects.find((p) => String(p.id) === value);
      if (project) onSelectProject(project);
    },
    [projects, onSelectProject],
  );

  const handleDeploymentChange = React.useCallback(
    (value: string) => {
      const deployment = deployments.find((d) => String(d.id) === value);
      if (deployment) onSelectDeployment(deployment);
    },
    [deployments, onSelectDeployment],
  );

  return (
    <header
      className={cn(
        "flex items-center justify-between",
        "h-10 pr-3",
        isFullscreen ? "pl-3" : "pl-18",
        "bg-background-raised border-b border-border-muted",
        "select-none",
        className,
      )}
      data-tauri-drag-region
    >
      <div className="flex items-center gap-1">
        <button
          onClick={onNavigateToProjectSelector}
          className={cn(
            "cursor-pointer transition-opacity duration-150",
            "hover:opacity-90 active:opacity-80",
            "shrink-0",
            "hover:animate-spin",
            !onNavigateToProjectSelector && "cursor-default",
          )}
          title="Go to project selector"
          type="button"
          disabled={!onNavigateToProjectSelector}
        >
          <ConvexLogo size={20} className="shrink-0" />
        </button>

        <SearchableSelect
          value={selectedTeam ? String(selectedTeam.id) : ""}
          options={teamOptions}
          onChange={handleTeamChange}
          placeholder="Team"
          searchPlaceholder="Search teams..."
          selectedTeam={selectedTeam ?? undefined}
          subscription={subscription}
        />

        <span className="text-text-disabled text-sm">/</span>

        <SearchableSelect
          value={selectedProject ? String(selectedProject.id) : ""}
          options={projectOptions}
          onChange={handleProjectChange}
          placeholder="Project"
          searchPlaceholder="Search projects..."
        />

        <span className="text-text-disabled text-sm">/</span>

        <SearchableSelect
          value={selectedDeployment ? String(selectedDeployment.id) : ""}
          options={deploymentOptions}
          onChange={handleDeploymentChange}
          placeholder="Deployment"
          searchPlaceholder="Search deployments..."
          selectedDeployment={selectedDeployment ?? undefined}
          showEnvironmentBadge={true}
          loading={deploymentsLoading}
        />
      </div>

      <div className="flex items-center gap-1">
        {selectedProject && <TerminalButton onOpenSettings={onOpenSettings} />}

        <UserMenu
          user={user}
          selectedTeam={selectedTeam}
          selectedProject={selectedProject}
          theme={theme}
          onThemeChange={onThemeChange}
          onLogout={onDisconnect}
        />
      </div>
    </header>
  );
}

export default TopBar;
