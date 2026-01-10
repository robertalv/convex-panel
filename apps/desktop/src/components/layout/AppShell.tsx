import * as React from "react";
import { cn } from "@/lib/utils";
import { Sidebar, type NavItem, SIDEBAR_MIN_WIDTH } from "./Sidebar";
import { TopBar } from "./TopBar";
import type { Team, Project, Deployment, User } from "@/types/desktop";
import type { TeamSubscription } from "@/api/bigbrain";
import { TerminalPanel } from "../../features/terminal";
import { useTerminalActions } from "../../contexts/TerminalContext";
import { useHotkeys } from "react-hotkeys-hook";
import { useBackgroundPrefetch } from "../../hooks/useBackgroundPrefetch";
import { useProjectPathOptional } from "../../contexts/ProjectPathContext";

const STORAGE_KEYS = {
  sidebarWidth: "convex-desktop-sidebar-width",
  sidebarCollapsed: "convex-desktop-sidebar-collapsed",
};

interface AppShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenPalette: () => void;
  onThemeChange: (theme: "light" | "dark" | "system") => void;
  onDisconnect: () => void;
  onOpenSettings?: () => void;
  theme: "light" | "dark" | "system";
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
  className?: string;
  /** Hide the sidebar navigation (e.g., when showing project selector) */
  hideNav?: boolean;
  /** Whether deployments are currently loading */
  deploymentsLoading?: boolean;
}

export function AppShell({
  children,
  navItems,
  currentPath,
  onNavigate,
  onOpenPalette,
  onThemeChange,
  onDisconnect,
  onOpenSettings,
  theme,
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
  className,
  hideNav = false,
  deploymentsLoading = false,
}: AppShellProps) {
  const projectPathContext = useProjectPathOptional();
  const projectPath = projectPathContext?.projectPath ?? null;
  const [sidebarWidth, setSidebarWidth] = React.useState(() => {
    if (typeof window === "undefined") return SIDEBAR_MIN_WIDTH;
    const saved = localStorage.getItem(STORAGE_KEYS.sidebarWidth);
    return saved ? Number(saved) : SIDEBAR_MIN_WIDTH;
  });

  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEYS.sidebarCollapsed) === "true";
  });

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.sidebarWidth, String(sidebarWidth));
  }, [sidebarWidth]);

  React.useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.sidebarCollapsed,
      String(sidebarCollapsed),
    );
  }, [sidebarCollapsed]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setSidebarCollapsed((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleToggleCollapse = React.useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  // Terminal keyboard shortcut (Ctrl+` or Cmd+`)
  const { toggleTerminal } = useTerminalActions();

  // Prefetch health data in the background after the app loads
  useBackgroundPrefetch({ delay: 1500 });

  useHotkeys(
    "ctrl+`",
    (e) => {
      e.preventDefault();
      toggleTerminal();
    },
    { enableOnFormTags: true },
    [toggleTerminal],
  );
  useHotkeys(
    "meta+`",
    (e) => {
      e.preventDefault();
      toggleTerminal();
    },
    { enableOnFormTags: true },
    [toggleTerminal],
  );

  return (
    <div
      className={cn(
        "flex flex-col h-full w-full overflow-hidden",
        "min-w-[300px] min-h-[760px]",
        "bg-background-base text-text-base",
        theme,
        className,
      )}
    >
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02] overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--color-border-base) 1px, transparent 1px),
            linear-gradient(to bottom, var(--color-border-base) 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px",
        }}
      />

      <div className="shrink-0">
        <TopBar
          user={user}
          teams={teams}
          projects={projects}
          deployments={deployments}
          selectedTeam={selectedTeam}
          selectedProject={selectedProject}
          selectedDeployment={selectedDeployment}
          subscription={subscription}
          onSelectTeam={onSelectTeam}
          onSelectProject={onSelectProject}
          onSelectDeployment={onSelectDeployment}
          onOpenPalette={onOpenPalette}
          onThemeChange={onThemeChange}
          onDisconnect={onDisconnect}
          onOpenSettings={onOpenSettings}
          theme={theme}
          deploymentsLoading={deploymentsLoading}
        />
      </div>

      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
          {!hideNav && (
            <Sidebar
              navItems={navItems}
              currentPath={currentPath}
              onNavigate={onNavigate}
              collapsed={sidebarCollapsed}
              onToggleCollapse={handleToggleCollapse}
              width={sidebarWidth}
              onResize={setSidebarWidth}
              onOpenSettings={onOpenSettings}
              isSettingsActive={currentPath === "/settings"}
            />
          )}

          <main
            className="flex-1 min-w-0 min-h-0 overflow-hidden"
            style={{
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflow: "auto",
                position: "relative",
              }}
            >
              {children}
            </div>
            <TerminalPanel workingDirectory={projectPath || undefined} />
          </main>
        </div>
      </div>
    </div>
  );
}

export default AppShell;
export type { NavItem };
