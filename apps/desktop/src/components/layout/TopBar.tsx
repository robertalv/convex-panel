import * as React from "react";
import { cn } from "@/lib/utils";
import { ConvexLogo } from "@/components/ui/ConvexLogo";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { UserMenu } from "./UserMenu";
import type { Team, Project, Deployment, User } from "convex-panel";
import type { TeamSubscription } from "@/api/bigbrain";
import { Terminal } from "lucide-react";
import {
  useTerminalActions,
  useTerminalState,
} from "../../contexts/TerminalContext";
import { useMcpOptional } from "../../contexts/McpContext";

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
  onThemeChange: (theme: "light" | "dark" | "system") => void;
  onDisconnect: () => void;
  onOpenSettings?: () => void;
  theme: "light" | "dark" | "system";
  className?: string;
  deploymentsLoading?: boolean;
}

function TerminalButton({ onOpenSettings }: { onOpenSettings?: () => void }) {
  const { toggleTerminal } = useTerminalActions();
  const { isOpen } = useTerminalState();
  const mcp = useMcpOptional();

  const hasProjectPath = Boolean(mcp?.projectPath);
  const isLoading = mcp?.isLoading ?? false;

  const handleClick = async () => {
    if (!hasProjectPath) {
      if (mcp?.selectProjectDirectory) {
        const path = await mcp.selectProjectDirectory();
        if (path) {
          toggleTerminal();
        }
      } else if (onOpenSettings) {
        onOpenSettings();
      }
      return;
    }
    toggleTerminal();
  };

  const title = isLoading
    ? "Loading..."
    : !hasProjectPath
      ? "Select project directory to enable terminal"
      : isOpen
        ? "Close terminal (⌃`)"
        : "Open terminal (⌃`)";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex items-center justify-center relative",
        "h-6 w-6 rounded-lg",
        "transition-colors duration-150",
        !hasProjectPath
          ? "text-text-muted hover:text-text-base hover:bg-surface-raised"
          : isOpen
            ? "bg-brand-base/10 text-brand-base"
            : "text-text-muted hover:text-text-base hover:bg-surface-raised",
      )}
      title={title}
    >
      <Terminal className="h-4 w-4" />
      {!hasProjectPath && !isLoading && (
        <span
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500"
          title="Project directory not set"
        />
      )}
    </button>
  );
}

/**
 * Top bar component with logo, deployment breadcrumb selector, and action buttons.
 * Spans the full width of the window, inline with macOS traffic lights.
 */
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
  theme,
  className,
  deploymentsLoading = false,
}: TopBarProps) {
  const teamOptions = React.useMemo(
    () => teams.map((t) => ({ value: String(t.id), label: t.name })),
    [teams],
  );

  const projectOptions = React.useMemo(
    () => projects.map((p) => ({ value: String(p.id), label: p.name })),
    [projects],
  );

  const deploymentOptions = React.useMemo(
    () =>
      deployments.map((d) => ({
        value: String(d.id),
        label: d.name,
        sublabel: d.deploymentType,
      })),
    [deployments],
  );

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
        "h-10 pl-18 pr-3",
        "bg-background-raised border-b border-border-muted",
        "select-none",
        className,
      )}
      data-tauri-drag-region
    >
      {/* Left: Logo + Breadcrumb selectors */}
      <div className="flex items-center gap-1">
        <ConvexLogo size={20} className="flex-shrink-0" />

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

      <div className="flex items-center gap-2">
        {/* Terminal Toggle Button - only visible when a project is selected */}
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
