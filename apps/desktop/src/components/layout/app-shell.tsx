import * as React from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";
import type {
  Team,
  Project,
  Deployment,
  User,
  ThemeType,
} from "@/types/desktop";
import type { TeamSubscription, Invoice } from "@convex-panel/shared/api";
import { TerminalPanel } from "../../views/terminal";
import { useTerminalActions } from "../../contexts/terminal-context";
import { FunctionRunnerPanel } from "../function-runner-panel";
import {
  useFunctionRunnerActions,
  useFunctionRunnerState,
} from "../../contexts/function-runner-context";
import { useGlobalHotkeys } from "../../hooks/useGlobalHotkeys";
import { useBackgroundPrefetch } from "../../hooks/useBackgroundPrefetch";
import { useProjectPathOptional } from "../../contexts/project-path-context";
import {
  FailedPaymentBanner,
  useShowFailedPaymentBanner,
} from "../failed-payment-banner";
import { STORAGE_KEYS } from "@/lib/constants";
import { openExternalLink } from "@/lib/utils";
import type { HotkeyDefinition } from "@/lib/hotkeys";
import { NavItem } from "@/lib/navigation";
import { SIDEBAR_MIN_WIDTH } from "@/lib/layout";

interface AppShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenPalette: () => void;
  onThemeChange: (theme: ThemeType) => void;
  onDisconnect: () => void;
  onOpenSettings?: () => void;
  onNavigateToProjectSelector?: () => void;
  onRefreshProjects?: () => void;
  theme: "light" | "dark" | "system";
  user: User | null;
  teams: Team[];
  projects: Project[];
  deployments: Deployment[];
  selectedTeam: Team | null;
  selectedProject: Project | null;
  selectedDeployment: Deployment | null;
  subscription: TeamSubscription | null;
  invoices: Invoice[];
  onSelectTeam?: (team: Team) => void;
  onSelectProject?: (project: Project) => void;
  onSelectDeployment?: (deployment: Deployment) => void;
  className?: string;
  hideNav?: boolean;
  teamsLoading?: boolean;
  deploymentsLoading?: boolean;
  /** Whether the app is in deploy key mode (restricted features) */
  isDeployKeyMode?: boolean;
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
  onNavigateToProjectSelector,
  onRefreshProjects,
  theme,
  user,
  teams,
  projects,
  deployments,
  selectedTeam,
  selectedProject,
  selectedDeployment,
  subscription,
  invoices,
  onSelectTeam,
  onSelectProject,
  onSelectDeployment,
  className,
  hideNav = false,
  teamsLoading = false,
  deploymentsLoading = false,
  isDeployKeyMode: _isDeployKeyMode = false,
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

  const handleToggleCollapse = React.useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const { toggleTerminal } = useTerminalActions();
  const { toggleFunctionRunner } = useFunctionRunnerActions();
  const { isOpen: isFunctionRunnerOpen, layoutMode: functionRunnerLayoutMode } =
    useFunctionRunnerState();

  useBackgroundPrefetch({ delay: 1500 });

  const showFailedPaymentBanner = useShowFailedPaymentBanner(invoices);

  const handleOpenBilling = React.useCallback(() => {
    if (selectedTeam?.slug) {
      const url = `https://dashboard.convex.dev/t/${selectedTeam.slug}/settings/billing#paymentMethod`;
      openExternalLink(url);
    }
  }, [selectedTeam?.slug]);

  // Register hotkeys for sidebar, terminal, and function runner toggles
  const appShellHotkeys = React.useMemo<HotkeyDefinition[]>(
    () => [
      {
        keys: ["ctrl+b", "meta+b"],
        action: handleToggleCollapse,
        description: "Toggle sidebar",
        enableOnFormTags: false,
      },
      {
        keys: ["ctrl+`", "meta+`"],
        action: toggleTerminal,
        description: "Toggle terminal",
        enableOnFormTags: true,
      },
      {
        keys: ["ctrl+1", "meta+1"],
        action: toggleFunctionRunner,
        description: "Toggle Function Runner",
        enableOnFormTags: false,
      },
    ],
    [handleToggleCollapse, toggleTerminal, toggleFunctionRunner],
  );

  useGlobalHotkeys(appShellHotkeys);

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
          onNavigateToProjectSelector={onNavigateToProjectSelector}
          onRefreshProjects={onRefreshProjects}
          theme={theme}
          teamsLoading={teamsLoading}
          deploymentsLoading={deploymentsLoading}
        />
        {showFailedPaymentBanner && selectedTeam && (
          <FailedPaymentBanner
            teamSlug={selectedTeam.slug}
            onOpenBilling={handleOpenBilling}
          />
        )}
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
            {/* Content wrapper - changes flex direction based on function runner layout */}
            <div
              className="flex-1 min-h-0 overflow-hidden"
              style={{
                display: "flex",
                flexDirection:
                  isFunctionRunnerOpen && functionRunnerLayoutMode === "side"
                    ? "row"
                    : "column",
              }}
            >
              {/* Hide main content when function runner is in fullscreen mode */}
              {!(
                isFunctionRunnerOpen &&
                functionRunnerLayoutMode === "fullscreen"
              ) && (
                <div
                  style={{
                    flex: 1,
                    minHeight: 0,
                    minWidth: 0,
                    overflow: "auto",
                    position: "relative",
                  }}
                >
                  {children}
                </div>
              )}
              <FunctionRunnerPanel />
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
