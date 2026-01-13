import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { ConvexReactClient } from "convex/react";
import type { Deployment, Project, Team, User } from "@/types/desktop";
import { useBigBrain } from "./hooks/useBigBrain";
import { useGlobalHotkeys } from "./hooks/useGlobalHotkeys";
import type { HotkeyDefinition } from "@/lib/hotkeys";
import {
  DashboardSession,
  exchangeForDashboardToken,
  pollForDeviceToken,
  startDeviceAuthorization,
} from "./lib/convex/dashboardCommonAdapter";
import {
  clearAccessToken,
  clearDeployKey,
  loadAccessToken,
  loadDeployKey,
  saveAccessToken,
} from "./lib/secureStorage";
import { HealthView } from "./views/health";
import { DataView } from "./views/data";
import FunctionsView from "./views/functions";
import { RunnerView } from "./views/runner";
import { FilesView } from "./views/files";
import { SchedulesView } from "./views/schedules";
import { LogsView } from "./views/logs";
import { SchemaVisualizerView } from "./views/schema-visualizer";
import { PerformanceAdvisorView } from "./views/performance-advisor";
import { ProjectSelector } from "./views/project-selector";
import { SettingsView } from "./views/settings";
import { AppShell, CommandPalette } from "./components/layout";
import {
  WelcomeScreen,
  LoadingScreen,
  LoginTransition,
} from "./components/auth";
import { DeploymentProvider } from "./contexts/deployment-context";
import { useTheme } from "./contexts/theme-context";
import { TerminalProvider } from "./contexts/terminal-context";
import { GitHubProvider } from "./contexts/github-context";
import { ProjectPathProvider } from "./contexts/project-path-context";
import { AboutDialog } from "./components/about-dialog";
import {
  OnboardingProvider,
  useOnboarding,
} from "./contexts/onboarding-context";
import { DeploymentNotificationListener } from "./components/deployment-notification-listener";
import { useApplicationVersion } from "./hooks/useApplicationVersion";
import { NAV_ITEMS } from "./lib/navigation";
import { isTauri } from "./utils/desktop";
import { STORAGE_KEYS } from "./lib/constants";

interface AppProps {
  convex?: ConvexReactClient | null;
}

/**
 * Wrapper component that bridges Convex project selection with GitHubProvider
 * GitHub repo/branch settings are persisted per Convex project (team/project slug).
 */
function GitHubProviderWithConvexProject({
  children,
  teamSlug,
  projectSlug,
}: {
  children: ReactNode;
  teamSlug: string | null;
  projectSlug: string | null;
}) {
  return (
    <GitHubProvider teamSlug={teamSlug} projectSlug={projectSlug}>
      {children}
    </GitHubProvider>
  );
}

/**
 * Component that syncs deployment changes with OnboardingContext
 */
function OnboardingSync({
  deploymentName,
  teamSlug,
  projectSlug,
}: {
  deploymentName?: string;
  teamSlug?: string | null;
  projectSlug?: string | null;
}) {
  const { updateDeployment } = useOnboarding();

  useEffect(() => {
    updateDeployment(deploymentName, teamSlug, projectSlug);
  }, [deploymentName, teamSlug, projectSlug, updateDeployment]);

  return null;
}

export default function App({ convex: _initialConvex }: AppProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const { theme, setTheme } = useTheme();

  const [authMethod] = useState<"device" | "manual">(() => {
    if (typeof window === "undefined") return "device";
    return (
      (localStorage.getItem(STORAGE_KEYS.authMethod) as "device" | "manual") ||
      "device"
    );
  });
  const [session, setSession] = useState<DashboardSession | null>(null);
  const [deployUrl, setDeployUrl] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.deployUrl) || ""
      : "",
  );
  const [deployKey, setDeployKey] = useState("");
  const [manualConnected, setManualConnected] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userCode, setUserCode] = useState<string | null>(null);
  const pollAbortRef = useRef(false);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem(STORAGE_KEYS.team);
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedProject, setSelectedProject] = useState<Project | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem(STORAGE_KEYS.project);
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedDeployment, setSelectedDeployment] =
    useState<Deployment | null>(() => {
      if (typeof window === "undefined") return null;
      const saved = localStorage.getItem(STORAGE_KEYS.deployment);
      return saved ? JSON.parse(saved) : null;
    });

  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Check for application updates
  useApplicationVersion();

  const {
    teams,
    projects,
    deployments,
    user,
    subscription,
    invoices,
    loadProjects,
    loadDeployments,
    loadSubscription,
    loadInvoices,
    deploymentsLoading,
  } = useBigBrain(
    session?.accessToken ?? null,
    useCallback((input, init) => {
      if (isTauri()) {
        return import("@tauri-apps/plugin-http").then(({ fetch }) =>
          fetch(input, init),
        );
      }
      return fetch(input, init);
    }, []),
  );

  // Create a stable fetch function for DeploymentProvider
  const tauriFetch = useCallback(
    (input: RequestInfo | URL, init?: RequestInit) => {
      if (isTauri()) {
        return import("@tauri-apps/plugin-http").then(({ fetch }) =>
          fetch(input, init),
        );
      }
      return fetch(input, init);
    },
    [],
  );

  useEffect(() => {
    (async () => {
      const [storedToken, storedDeployKey] = await Promise.all([
        loadAccessToken(),
        loadDeployKey(),
      ]);
      const hasSession = Boolean(storedToken || storedDeployKey);

      if (storedToken) {
        setSession({ accessToken: storedToken, tokenType: "Bearer" });
      }
      if (storedDeployKey) {
        setDeployKey(storedDeployKey);
        setManualConnected(true);
      }

      if (hasSession) {
        setIsTransitioning(true);
      }

      setIsRestoring(false);
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.authMethod, authMethod);
  }, [authMethod]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.deployUrl, deployUrl);
  }, [deployUrl]);

  useEffect(() => {
    if (selectedTeam)
      localStorage.setItem(STORAGE_KEYS.team, JSON.stringify(selectedTeam));
    else localStorage.removeItem(STORAGE_KEYS.team);
  }, [selectedTeam]);

  useEffect(() => {
    if (selectedProject)
      localStorage.setItem(
        STORAGE_KEYS.project,
        JSON.stringify(selectedProject),
      );
    else localStorage.removeItem(STORAGE_KEYS.project);
  }, [selectedProject]);

  useEffect(() => {
    if (selectedDeployment)
      localStorage.setItem(
        STORAGE_KEYS.deployment,
        JSON.stringify(selectedDeployment),
      );
    else localStorage.removeItem(STORAGE_KEYS.deployment);
  }, [selectedDeployment]);

  useEffect(() => {
    if (teams.length > 0 && selectedTeam) {
      const teamExists = teams.some((t) => t.id === selectedTeam.id);
      if (!teamExists) {
        setSelectedTeam(null);
        setSelectedProject(null);
        setSelectedDeployment(null);
        setIsInitialLoad(false);
      } else {
        const freshTeam = teams.find((t) => t.id === selectedTeam.id);
        if (freshTeam && freshTeam !== selectedTeam) {
          setSelectedTeam(freshTeam);
        }
      }
    }
  }, [teams, selectedTeam]);

  useEffect(() => {
    if (!selectedTeam && teams.length > 0) {
      setSelectedTeam(teams[0]);
      setIsInitialLoad(false);
    }
  }, [teams, selectedTeam]);

  useEffect(() => {
    if (selectedTeam) {
      loadProjects(selectedTeam.id);
      loadSubscription(selectedTeam.id);
      // Only load invoices for non-managed teams (managed teams don't have billing)
      if (!selectedTeam.managedBy) {
        loadInvoices(selectedTeam.id);
      }
    }
  }, [
    selectedTeam?.id,
    selectedTeam?.managedBy,
    loadProjects,
    loadSubscription,
    loadInvoices,
  ]);

  useEffect(() => {
    if (projects.length > 0 && selectedProject) {
      const projectExists = projects.some(
        (p) =>
          p.id === selectedProject.id && p.teamId === selectedProject.teamId,
      );
      if (!projectExists) {
        setSelectedProject(null);
        setSelectedDeployment(null);
        setIsInitialLoad(false);
      } else {
        const freshProject = projects.find((p) => p.id === selectedProject.id);
        if (freshProject && freshProject !== selectedProject) {
          setSelectedProject(freshProject);
        }
        if (isInitialLoad && session?.accessToken) {
          loadDeployments(selectedProject.id);
        }
      }
    }
  }, [deployments, selectedDeployment, selectedProject]);

  // Handle loading state for deployments
  useEffect(() => {
    if (
      selectedProject &&
      deploymentsLoading === true &&
      deployments.length === 0
    ) {
      // Deployments are still loading - keep existing selection but mark as not loaded yet
      // This prevents showing "No results found" during loading
      setIsInitialLoad(true);
    }
  }, [selectedProject, deploymentsLoading, deployments.length]);

  useEffect(() => {
    if (selectedProject && session?.accessToken) {
      loadDeployments(selectedProject.id);
    }
  }, [selectedProject?.id, loadDeployments, session?.accessToken]);

  useEffect(() => {
    if (selectedProject) {
      if (deployments.length > 0) {
        // Deployments are loaded - validate and update selection
        if (selectedDeployment) {
          const deploymentExists = deployments.some(
            (d) => d.id === selectedDeployment.id,
          );
          if (!deploymentExists) {
            setSelectedDeployment(null);
          } else {
            const freshDeployment = deployments.find(
              (d) => d.id === selectedDeployment.id,
            );
            if (freshDeployment && freshDeployment !== selectedDeployment) {
              setSelectedDeployment(freshDeployment);
            }
            setIsInitialLoad(false);
            return;
          }
        }
        // No valid selected deployment - auto-select dev or first deployment
        const dev = deployments.find(
          (d) => d.name.endsWith("dev") || d.deploymentType === "dev",
        );
        setSelectedDeployment(dev || deployments[0]);
        setIsInitialLoad(false);
      }
    } else {
      // No project selected - clear deployment
      setSelectedDeployment(null);
    }
  }, [deployments, selectedDeployment, selectedProject, deploymentsLoading]);

  // Register global hotkeys for palette, settings, and navigation
  const globalHotkeys = useMemo<HotkeyDefinition[]>(
    () => [
      {
        keys: ["ctrl+k", "meta+k"],
        action: () => setPaletteOpen(true),
        description: "Toggle command palette",
        enableOnFormTags: true,
      },
      {
        keys: ["ctrl+,", "meta+,"],
        action: () => navigate("/settings"),
        description: "Open settings",
        enableOnFormTags: true,
      },
      ...NAV_ITEMS.slice(0, 9).map(
        (item, index): HotkeyDefinition => ({
          keys: [`ctrl+${index + 1}`, `meta+${index + 1}`],
          action: () => navigate(item.path),
          description: `Navigate to ${item.label}`,
          enableOnFormTags: false,
        }),
      ),
    ],
    [navigate],
  );

  useGlobalHotkeys(globalHotkeys);

  useEffect(() => {
    if (!isTauri()) return;

    let unlisten: (() => void) | undefined;

    (async () => {
      const { listen } = await import("@tauri-apps/api/event");

      const unlistenAbout = await listen("show-about", () => {
        setAboutOpen(true);
      });

      const unlistenSettings = await listen("show-settings", () => {
        navigate("/settings");
      });

      unlisten = () => {
        unlistenAbout();
        unlistenSettings();
      };
    })();

    return () => {
      if (unlisten) unlisten();
    };
  }, [navigate]);

  const handleDisconnect = useCallback(async () => {
    setSession(null);
    setDeployKey("");
    setManualConnected(false);
    setSelectedDeployment(null);
    setSelectedProject(null);
    setSelectedTeam(null);
    await Promise.all([clearAccessToken(), clearDeployKey()]);
  }, []);

  const startDeviceAuth = useCallback(async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    pollAbortRef.current = false;

    try {
      const deviceAuth = await startDeviceAuthorization();
      setUserCode(deviceAuth.user_code);
      const url = deviceAuth.verification_uri_complete;

      if (isTauri()) {
        const { open } = await import("@tauri-apps/plugin-shell");
        open(url);
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }

      const tokens = await pollForDeviceToken(
        deviceAuth,
        undefined,
        () => pollAbortRef.current,
      );
      if (!tokens) throw new Error("Authentication expired or cancelled");

      const dashboardSession = await exchangeForDashboardToken(
        tokens.access_token,
      );
      setSession(dashboardSession);
      await saveAccessToken(dashboardSession.accessToken);
      setUserCode(null);
      setIsTransitioning(true);
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : "Authentication failed",
      );
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const cancelDeviceAuth = useCallback(() => {
    pollAbortRef.current = true;
    setIsAuthenticating(false);
    setUserCode(null);
    setAuthError(null);
  }, []);

  const onNavigate = useCallback((path: string) => navigate(path), [navigate]);

  const isConnected = Boolean(
    session?.accessToken || (deployUrl && deployKey && manualConnected),
  );

  const headerUser: User | null = user
    ? {
        id: 0,
        name: user.name || "",
        email: user.email || "",
        profilePictureUrl: user.profilePictureUrl,
      }
    : null;

  const authToken = session?.accessToken ?? deployKey ?? null;

  const mainAppContent = isConnected ? (
    <>
      <ProjectPathProvider>
        <OnboardingProvider>
          <GitHubProviderWithConvexProject
            teamSlug={selectedTeam?.slug ?? null}
            projectSlug={selectedProject?.slug ?? null}
          >
            <TerminalProvider>
              <DeploymentProvider
                deployment={selectedDeployment}
                authToken={authToken}
                accessToken={session?.accessToken}
                deployUrl={deployUrl}
                teamId={selectedTeam?.id ?? null}
                teamSlug={selectedTeam?.slug ?? null}
                projectSlug={selectedProject?.slug ?? null}
                fetchFn={tauriFetch}
              >
                <OnboardingSync
                  deploymentName={selectedDeployment?.name}
                  teamSlug={selectedTeam?.slug}
                  projectSlug={selectedProject?.slug}
                />
                <AppShell
                  theme={theme}
                  navItems={NAV_ITEMS}
                  currentPath={location.pathname}
                  onNavigate={onNavigate}
                  onOpenPalette={() => setPaletteOpen(true)}
                  onThemeChange={setTheme}
                  onDisconnect={handleDisconnect}
                  onOpenSettings={() => navigate("/settings")}
                  onNavigateToProjectSelector={() => {
                    setSelectedProject(null);
                    setSelectedDeployment(null);
                  }}
                  user={headerUser}
                  teams={teams}
                  projects={projects}
                  deployments={deployments}
                  selectedTeam={selectedTeam}
                  selectedProject={selectedProject}
                  selectedDeployment={selectedDeployment}
                  subscription={subscription}
                  invoices={invoices}
                  onSelectTeam={(team) => {
                    setSelectedTeam(team);
                    setSelectedProject(null);
                    setSelectedDeployment(null);
                  }}
                  onSelectProject={(project) => {
                    setSelectedProject(project);
                    setSelectedDeployment(null);
                  }}
                  onSelectDeployment={setSelectedDeployment}
                  hideNav={!selectedProject}
                  deploymentsLoading={deploymentsLoading}
                >
                  {selectedProject ? (
                    <Routes>
                      <Route path="/health" element={<HealthView />} />
                      <Route path="/data" element={<DataView />} />
                      <Route
                        path="/schema"
                        element={<SchemaVisualizerView />}
                      />
                      <Route
                        path="/advisor"
                        element={<PerformanceAdvisorView />}
                      />
                      <Route path="/functions" element={<FunctionsView />} />
                      <Route path="/runner" element={<RunnerView />} />
                      <Route path="/files" element={<FilesView />} />
                      <Route path="/schedules" element={<SchedulesView />} />
                      <Route path="/logs" element={<LogsView />} />
                      <Route
                        path="/settings"
                        element={
                          <SettingsView
                            user={{
                              name: headerUser?.name || "",
                              email: headerUser?.email || "",
                              profilePictureUrl: headerUser?.profilePictureUrl,
                            }}
                            onLogout={handleDisconnect}
                            teamId={selectedTeam?.id}
                          />
                        }
                      />
                      <Route
                        path="*"
                        element={<Navigate to="/health" replace />}
                      />
                    </Routes>
                  ) : (
                    <ProjectSelector
                      user={headerUser}
                      team={selectedTeam}
                      projects={projects}
                      subscription={subscription}
                      onSelectProject={(project) => {
                        setSelectedProject(project);
                        setSelectedDeployment(null);
                      }}
                    />
                  )}
                </AppShell>
                <DeploymentNotificationListener />
              </DeploymentProvider>
            </TerminalProvider>
            <CommandPalette
              open={paletteOpen}
              navItems={NAV_ITEMS}
              onSelect={onNavigate}
              onClose={() => setPaletteOpen(false)}
            />
            <AboutDialog
              isOpen={aboutOpen}
              onClose={() => setAboutOpen(false)}
            />
          </GitHubProviderWithConvexProject>
        </OnboardingProvider>
      </ProjectPathProvider>
    </>
  ) : null;

  // Set window size to 960x600 with min/max constraints when showing welcome screen
  useEffect(() => {
    if (!isConnected && !isRestoring) {
      invoke("set_window_fixed_size", { width: 960, height: 600 }).catch(
        (err) => {
          console.error("Failed to set window size:", err);
        },
      );
    }
  }, [isConnected, isRestoring]);

  // Remove window constraints when connected to allow fullscreen
  useEffect(() => {
    if (isConnected && !isRestoring && !isTransitioning) {
      invoke("remove_window_constraints").catch((err) => {
        console.error("Failed to remove window constraints:", err);
      });
    }
  }, [isConnected, isRestoring, isTransitioning]);

  if (isRestoring) {
    return <LoadingScreen theme={theme} />;
  }

  // Auth screen - not connected
  if (!isConnected) {
    return (
      <>
        <WelcomeScreen
          isAuthenticating={isAuthenticating}
          userCode={userCode}
          onStartDeviceAuth={startDeviceAuth}
          onCancelDeviceAuth={cancelDeviceAuth}
          authError={authError}
        />
        <AboutDialog isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
      </>
    );
  }

  // Main app - connected
  // Render mainAppContent always in the same tree position to prevent remounting
  // LoginTransition renders as an overlay on top when transitioning
  return (
    <>
      {mainAppContent}
      {isTransitioning && (
        <LoginTransition
          theme={theme}
          onComplete={() => setIsTransitioning(false)}
        />
      )}
    </>
  );
}
