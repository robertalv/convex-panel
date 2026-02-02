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
import { smartFetch } from "./lib/fetch";
import {
  DashboardSession,
  exchangeForDashboardToken,
  pollForDeviceToken,
  startDeviceAuthorization,
} from "./lib/convex/dashboardCommonAdapter";
import {
  loadAccessToken,
  loadDeployKey,
  saveAccessToken,
  saveDeployKeyAuthConfig,
  loadDeployKeyAuthConfig,
  saveAuthMode,
  loadAuthMode,
  clearAllAuthData,
  type DeployKeyAuthConfig,
  type AuthMode,
} from "./lib/secureStorage";
import type { DeployKeyConfig } from "./lib/deployKeyAuth";
import { HealthView } from "./views/health";
import { DataView } from "./views/data";
import FunctionsView from "./views/functions";
import { FilesView } from "./views/files";
import { SchedulesView } from "./views/schedules";
import { LogsView } from "./views/logs";
import { SchemaVisualizerView } from "./views/schema-visualizer";
import { PerformanceAdvisorView } from "./views/performance-advisor";
import { ProjectSelector } from "./views/project-selector";
import { SettingsView } from "./views/settings";
import { MarketplaceView } from "./views/marketplace";
import { AppShell } from "./components/layout";
import { CommandPalette } from "./components/layout/command-palette";
import { saveActiveTable } from "./views/data/utils/storage";
import {
  WelcomeScreen,
  LoadingScreen,
  LoginTransition,
} from "./components/auth";
import { DeploymentProvider } from "./contexts/deployment-context";
import { LogStreamProvider } from "./contexts/log-stream-context";
import { useTheme } from "./contexts/theme-context";
import { TerminalProvider } from "./contexts/terminal-context";
import { FunctionRunnerProvider } from "./contexts/function-runner-context";
import { GitHubProvider } from "./contexts/github-context";
import { ProjectPathProvider } from "./contexts/project-path-context";
import { CommandPaletteWithData } from "./components/command-palette-with-data";
import { AboutDialog } from "./components/about-dialog";
import {
  OnboardingProvider,
  useOnboarding,
} from "./contexts/onboarding-context";
import { DeploymentNotificationListener } from "./components/deployment-notification-listener";
import { useApplicationVersion } from "./hooks/useApplicationVersion";
import { NAV_ITEMS, getFilteredNavItems } from "./lib/navigation";
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

/**
 * Create a synthetic deployment object from deploy key config
 */
function createSyntheticDeployment(config: DeployKeyAuthConfig): Deployment {
  return {
    id: 0, // Synthetic ID
    name: config.deploymentName,
    url: config.deploymentUrl,
    deploymentType: "prod", // Assume prod for deploy key mode
    projectId: 0,
    kind: "cloud",
    previewIdentifier: null,
  };
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
  const [deployUrl, _setDeployUrl] = useState(() =>
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

  // Deploy key auth mode state
  const [authMode, setAuthModeState] = useState<AuthMode | null>(null);
  const [deployKeyAuthConfig, setDeployKeyAuthConfig] =
    useState<DeployKeyAuthConfig | null>(null);

  const [aboutOpen, setAboutOpen] = useState(false);

  // Create a ref to hold the sidebar toggle function from AppShell
  // This will be set by AppShell via onToggleSidebar callback
  const sidebarToggleRef = useRef<(() => void) | null>(null);

  const handleToggleSidebar = useCallback(() => {
    if (sidebarToggleRef.current) {
      sidebarToggleRef.current();
    }
  }, []);

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

  // Computed values for deploy key mode
  const isDeployKeyMode =
    authMode === "deployKey" && deployKeyAuthConfig !== null;

  // In deploy key mode, use the synthetic deployment
  const effectiveDeployment =
    isDeployKeyMode && deployKeyAuthConfig
      ? createSyntheticDeployment(deployKeyAuthConfig)
      : selectedDeployment;

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
    teamsLoading,
    deploymentsLoading,
  } = useBigBrain(
    // Don't call BigBrain in deploy key mode
    isDeployKeyMode ? null : (session?.accessToken ?? null),
    smartFetch,
  );

  // Create a stable fetch function for DeploymentProvider
  // Using smartFetch to intelligently route requests
  const tauriFetch = smartFetch;

  // Load auth state on mount
  useEffect(() => {
    (async () => {
      const [
        storedToken,
        storedDeployKey,
        storedAuthMode,
        storedDeployKeyConfig,
      ] = await Promise.all([
        loadAccessToken(),
        loadDeployKey(),
        loadAuthMode(),
        loadDeployKeyAuthConfig(),
      ]);

      // Restore auth mode state
      if (storedAuthMode) {
        setAuthModeState(storedAuthMode);
      }
      if (storedDeployKeyConfig) {
        setDeployKeyAuthConfig(storedDeployKeyConfig);
      }

      // Check if we have a deploy key auth session
      if (storedAuthMode === "deployKey" && storedDeployKeyConfig) {
        // Deploy key mode - no need for OAuth session
        setIsTransitioning(true);
        setIsRestoring(false);
        return;
      }

      // OAuth mode
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

  // Skip team/project/deployment selection effects in deploy key mode
  useEffect(() => {
    if (isDeployKeyMode) return;

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
  }, [teams, selectedTeam, isDeployKeyMode]);

  useEffect(() => {
    if (isDeployKeyMode) return;

    if (!selectedTeam && teams.length > 0) {
      setSelectedTeam(teams[0]);
      setIsInitialLoad(false);
    }
  }, [teams, selectedTeam, isDeployKeyMode]);

  useEffect(() => {
    if (isDeployKeyMode) return;

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
    isDeployKeyMode,
  ]);

  useEffect(() => {
    if (isDeployKeyMode) return;

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
  }, [deployments, selectedDeployment, selectedProject, isDeployKeyMode]);

  // Handle loading state for deployments
  useEffect(() => {
    if (isDeployKeyMode) return;

    if (
      selectedProject &&
      deploymentsLoading === true &&
      deployments.length === 0
    ) {
      // Deployments are still loading - keep existing selection but mark as not loaded yet
      // This prevents showing "No results found" during loading
      setIsInitialLoad(true);
    }
  }, [
    selectedProject,
    deploymentsLoading,
    deployments.length,
    isDeployKeyMode,
  ]);

  useEffect(() => {
    if (isDeployKeyMode) return;

    if (selectedProject && session?.accessToken) {
      loadDeployments(selectedProject.id);
    }
  }, [
    selectedProject?.id,
    loadDeployments,
    session?.accessToken,
    isDeployKeyMode,
  ]);

  useEffect(() => {
    if (isDeployKeyMode) return;

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
  }, [
    deployments,
    selectedDeployment,
    selectedProject,
    deploymentsLoading,
    isDeployKeyMode,
  ]);

  // Get filtered nav items based on auth mode
  const filteredNavItems = useMemo(
    () => getFilteredNavItems(isDeployKeyMode),
    [isDeployKeyMode],
  );

  // Register global hotkeys for settings and navigation
  // IMPORTANT: Use NAV_ITEMS (constant length) for hotkeys to maintain consistent hook count
  // useGlobalHotkeys calls useHotkeys in a loop, so array length must be constant
  // Note: ⌘K is handled by CommandPaletteProvider internally
  const globalHotkeys = useMemo<HotkeyDefinition[]>(
    () => [
      {
        keys: ["ctrl+,", "meta+,"],
        action: () => navigate("/settings"),
        description: "Open settings",
        enableOnFormTags: true,
      },
      ...NAV_ITEMS.slice(0, 8).map(
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
    setAuthModeState(null);
    setDeployKeyAuthConfig(null);
    await clearAllAuthData();
  }, []);

  const startDeviceAuth = useCallback(async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    pollAbortRef.current = false;

    try {
      console.log("[Auth] Starting device authorization...");
      const deviceAuth = await startDeviceAuthorization();
      console.log("[Auth] Got device auth response:", deviceAuth.user_code);
      setUserCode(deviceAuth.user_code);
      const url = deviceAuth.verification_uri_complete;

      if (isTauri()) {
        console.log("[Auth] Opening URL in browser:", url);
        const { open } = await import("@tauri-apps/plugin-shell");
        open(url);
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }

      console.log("[Auth] Polling for device token...");
      const tokens = await pollForDeviceToken(
        deviceAuth,
        undefined,
        () => pollAbortRef.current,
      );
      if (!tokens) throw new Error("Authentication expired or cancelled");

      console.log("[Auth] Got tokens, exchanging for dashboard session...");
      const dashboardSession = await exchangeForDashboardToken(
        tokens.access_token,
      );
      console.log("[Auth] Got dashboard session, saving...");
      setSession(dashboardSession);
      await saveAccessToken(dashboardSession.accessToken);
      await saveAuthMode("oauth");
      setAuthModeState("oauth");
      setUserCode(null);
      setIsTransitioning(true);
      console.log("[Auth] Authentication complete!");
    } catch (err) {
      console.error("[Auth] Authentication failed:", err);
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

  // Handle deploy key connection
  const handleDeployKeyConnect = useCallback(
    async (config: DeployKeyConfig) => {
      try {
        const authConfig: DeployKeyAuthConfig = {
          deployKey: config.deployKey,
          deploymentUrl: config.deploymentUrl,
          deploymentName: config.deploymentName,
        };

        // Save to storage
        await saveDeployKeyAuthConfig(authConfig);
        await saveAuthMode("deployKey");

        // Update state
        setDeployKeyAuthConfig(authConfig);
        setAuthModeState("deployKey");
        setIsTransitioning(true);

        console.log(
          `[App] Connected via deploy key to ${config.deploymentName}`,
        );
      } catch (error) {
        console.error("[App] Failed to save deploy key config:", error);
        setAuthError(
          error instanceof Error ? error.message : "Failed to connect",
        );
      }
    },
    [],
  );

  const onNavigate = useCallback((path: string) => navigate(path), [navigate]);

  // Check connection status - include deploy key mode
  const isConnected = Boolean(
    isDeployKeyMode ||
      session?.accessToken ||
      (deployUrl && deployKey && manualConnected),
  );

  const headerUser: User | null = user
    ? {
        id: 0,
        name: user.name || "",
        email: user.email || "",
        profilePictureUrl: user.profilePictureUrl,
      }
    : null;

  // Auth token for API calls
  const authToken =
    isDeployKeyMode && deployKeyAuthConfig
      ? deployKeyAuthConfig.deployKey
      : (session?.accessToken ?? deployKey ?? null);

  // Deploy URL for API calls
  const effectiveDeployUrl =
    isDeployKeyMode && deployKeyAuthConfig
      ? deployKeyAuthConfig.deploymentUrl
      : deployUrl;

  // In deploy key mode, we skip project selection and show app directly
  const showProjectSelector = !isDeployKeyMode && !selectedProject;

  const mainAppContent = isConnected ? (
    <ProjectPathProvider
      teamSlug={isDeployKeyMode ? null : selectedTeam?.slug}
      projectSlug={isDeployKeyMode ? null : selectedProject?.slug}
    >
      <GitHubProviderWithConvexProject
        teamSlug={isDeployKeyMode ? null : (selectedTeam?.slug ?? null)}
        projectSlug={isDeployKeyMode ? null : (selectedProject?.slug ?? null)}
      >
        <OnboardingProvider>
          <TerminalProvider>
            <FunctionRunnerProvider>
              <DeploymentProvider
                deployment={effectiveDeployment}
                authToken={authToken}
                accessToken={isDeployKeyMode ? null : session?.accessToken}
                deployUrl={effectiveDeployUrl}
                teamId={isDeployKeyMode ? null : (selectedTeam?.id ?? null)}
                teamSlug={isDeployKeyMode ? null : (selectedTeam?.slug ?? null)}
                projectSlug={
                  isDeployKeyMode ? null : (selectedProject?.slug ?? null)
                }
                fetchFn={tauriFetch}
              >
                <LogStreamProvider
                  deploymentUrl={
                    effectiveDeployment?.url ?? effectiveDeployUrl ?? null
                  }
                  authToken={authToken}
                >
                  <CommandPaletteWithData
                    onDisconnect={handleDisconnect}
                    onOpenAbout={() => setAboutOpen(true)}
                    onToggleSidebar={handleToggleSidebar}
                    onRefreshProjects={
                      isDeployKeyMode
                        ? undefined
                        : () => {
                            if (selectedTeam) {
                              loadProjects(selectedTeam.id);
                            }
                          }
                    }
                    isDeployKeyMode={isDeployKeyMode}
                    onSelectTable={(tableName: string) => {
                      saveActiveTable(tableName);
                      navigate("/data");
                    }}
                  >
                    <OnboardingSync
                      deploymentName={effectiveDeployment?.name}
                      teamSlug={isDeployKeyMode ? null : selectedTeam?.slug}
                      projectSlug={
                        isDeployKeyMode ? null : selectedProject?.slug
                      }
                    />
                    <AppShell
                      theme={theme}
                      navItems={filteredNavItems}
                      currentPath={location.pathname}
                      onNavigate={onNavigate}
                      onThemeChange={setTheme}
                      onDisconnect={handleDisconnect}
                      onOpenSettings={() => navigate("/settings")}
                      onNavigateToProjectSelector={
                        isDeployKeyMode
                          ? undefined
                          : () => {
                              setSelectedProject(null);
                              setSelectedDeployment(null);
                            }
                      }
                      onRefreshProjects={
                        isDeployKeyMode
                          ? undefined
                          : () => {
                              if (selectedTeam) {
                                loadProjects(selectedTeam.id);
                              }
                            }
                      }
                      sidebarToggleRef={sidebarToggleRef}
                      user={isDeployKeyMode ? null : headerUser}
                      teams={isDeployKeyMode ? [] : teams}
                      projects={isDeployKeyMode ? [] : projects}
                      deployments={isDeployKeyMode ? [] : deployments}
                      selectedTeam={isDeployKeyMode ? null : selectedTeam}
                      selectedProject={isDeployKeyMode ? null : selectedProject}
                      selectedDeployment={effectiveDeployment}
                      subscription={isDeployKeyMode ? null : subscription}
                      invoices={isDeployKeyMode ? [] : invoices}
                      onSelectTeam={
                        isDeployKeyMode
                          ? undefined
                          : (team) => {
                              setSelectedTeam(team);
                              setSelectedProject(null);
                              setSelectedDeployment(null);
                            }
                      }
                      onSelectProject={
                        isDeployKeyMode
                          ? undefined
                          : (project) => {
                              setSelectedProject(project);
                              setSelectedDeployment(null);
                            }
                      }
                      onSelectDeployment={
                        isDeployKeyMode ? undefined : setSelectedDeployment
                      }
                      hideNav={showProjectSelector}
                      teamsLoading={isDeployKeyMode ? false : teamsLoading}
                      deploymentsLoading={
                        isDeployKeyMode ? false : deploymentsLoading
                      }
                      isDeployKeyMode={isDeployKeyMode}
                    >
                      {showProjectSelector ? (
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
                      ) : (
                        <Routes>
                          <Route path="/health" element={<HealthView />} />
                          <Route path="/data" element={<DataView />} />
                          {!isDeployKeyMode && (
                            <>
                              <Route
                                path="/schema"
                                element={<SchemaVisualizerView />}
                              />
                              <Route
                                path="/advisor"
                                element={<PerformanceAdvisorView />}
                              />
                            </>
                          )}
                          <Route
                            path="/functions"
                            element={<FunctionsView />}
                          />
                          <Route path="/files" element={<FilesView />} />
                          <Route
                            path="/schedules"
                            element={<SchedulesView />}
                          />
                          <Route path="/logs" element={<LogsView />} />
                          {!isDeployKeyMode && (
                            <Route
                              path="/marketplace"
                              element={<MarketplaceView />}
                            />
                          )}
                          <Route
                            path="/settings"
                            element={
                              <SettingsView
                                user={
                                  isDeployKeyMode
                                    ? null
                                    : {
                                        name: headerUser?.name || "",
                                        email: headerUser?.email || "",
                                        profilePictureUrl:
                                          headerUser?.profilePictureUrl,
                                      }
                                }
                                teamId={
                                  isDeployKeyMode ? undefined : selectedTeam?.id
                                }
                                isDeployKeyMode={isDeployKeyMode}
                              />
                            }
                          />
                          <Route
                            path="*"
                            element={<Navigate to="/health" replace />}
                          />
                        </Routes>
                      )}
                    </AppShell>
                    <DeploymentNotificationListener />
                    <CommandPalette />
                    <AboutDialog
                      isOpen={aboutOpen}
                      onClose={() => setAboutOpen(false)}
                    />
                  </CommandPaletteWithData>
                </LogStreamProvider>
              </DeploymentProvider>
            </FunctionRunnerProvider>
          </TerminalProvider>
        </OnboardingProvider>
      </GitHubProviderWithConvexProject>
    </ProjectPathProvider>
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
          onDeployKeyConnect={handleDeployKeyConnect}
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
