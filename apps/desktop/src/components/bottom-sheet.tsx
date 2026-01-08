import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Sun,
  Moon,
  Sparkles,
  ExternalLink,
  BookOpen,
  MessageCircle,
} from "lucide-react";
import { ConvexLogo } from "./icons";
import { AskAI } from "./ask-ai";
import { setStorageItem } from "../utils/storage";
import { STORAGE_KEYS } from "../utils/constants";
import { DeploymentDisplay } from "./shared/deployment-display";
import { ProjectSelector } from "./shared/project-selector";
import { GlobalFunctionTester } from "./function-runner/global-function-tester";
import { GlobalSheet } from "./shared/global-sheet";
import { Sidebar } from "./sidebar";
import { useActiveTab } from "../hooks/useActiveTab";
import {
  useIsGlobalRunnerShown,
  useShowGlobalRunner,
} from "../lib/functionRunner";
import { useFunctionRunnerShortcuts } from "../hooks/useFunctionRunnerShortcuts";
import { useGlobalLocalStorage } from "../hooks/useGlobalLocalStorage";
import type { TabId } from "@convex-panel/shared";
import type { Team, Project, EnvType } from "@convex-panel/shared";
import { useThemeSafe } from "../hooks/useTheme";
import { useHasSubscription } from "../hooks/useTeamOrbSubscription";
import { SupportPopup } from "./support-popup";
import { SetupInstructions } from "./setup-instructions";
import { fetchDeploymentMetadata } from "../utils/api";
import { extractDeploymentName, extractProjectName } from "../utils/api";
import { fetchProjectInfo } from "../utils/api";
import { useIsDeploymentPaused } from "../hooks/usePaginatedScheduledJobs";
import { ChatbotSheet } from "./chatbot-sheet";
import { useDataViewState } from "../contexts/data-view-context";

// Wrapper component that subscribes to DataViewContext for chatbot
// This isolates the context subscription from BottomSheet to prevent re-renders
interface ChatbotSheetWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  adminClient?: any;
  accessToken?: string;
  deploymentUrl?: string;
  onTabChange?: (tab: TabId) => void;
  container: HTMLElement | null;
  activeTab?: TabId;
}

const ChatbotSheetWrapper: React.FC<ChatbotSheetWrapperProps> = React.memo(
  ({
    isOpen,
    onClose,
    adminClient,
    accessToken,
    deploymentUrl,
    onTabChange,
    container,
    activeTab,
  }) => {
    const dataViewState = useDataViewState();

    const currentTable = useMemo(() => {
      return activeTab === "data" ? dataViewState.selectedTable : null;
    }, [activeTab, dataViewState.selectedTable]);

    const availableFields = useMemo(() => {
      return activeTab === "data" ? dataViewState.availableFields : [];
    }, [activeTab, dataViewState.availableFields]);

    const isInDataView = activeTab === "data";

    if (!deploymentUrl || !accessToken) {
      return null;
    }

    return (
      <ChatbotSheet
        isOpen={isOpen}
        onClose={onClose}
        adminClient={adminClient}
        accessToken={accessToken}
        convexUrl={deploymentUrl}
        onTabChange={onTabChange}
        container={container}
        currentTable={currentTable}
        availableFields={availableFields}
        isInDataView={isInDataView}
      />
    );
  },
);

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  projectName?: string;
  deploymentUrl?: string;
  environment?: EnvType;
  isAuthenticated?: boolean;
  onConnect?: () => void;
  onLogout?: () => void;
  oauthConfig?: any;
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
  adminClient?: any;
  accessToken?: string;
  isOAuthToken?: boolean;
  teamSlug?: string;
  projectSlug?: string;
  team?: Team;
  project?: Project;
  /** When true, the panel fills the entire viewport. Useful for desktop apps. */
  fullscreen?: boolean;
  headerVisible?: boolean;
  customHeader?: React.ReactNode;
}

// Floating button for function runner
interface FloatingButtonsProps {
  isAuthenticated?: boolean;
  isRunnerShown: boolean;
  showGlobalRunner: (
    selected: null,
    autoRun?: boolean,
    vertical?: boolean,
  ) => void;
}

const FloatingButtons: React.FC<FloatingButtonsProps> = React.memo(
  ({ isAuthenticated, isRunnerShown, showGlobalRunner }) => {
    // Don't show if not authenticated
    if (!isAuthenticated) return null;

    // Don't show if runner is open
    if (isRunnerShown) return null;

    return (
      <div className="cp-floating-btn-wrapper">
        <button
          type="button"
          onClick={() => showGlobalRunner(null)}
          className="cp-floating-btn"
          title="Run functions (Ctrl+`)"
        >
          fn
        </button>
      </div>
    );
  },
);

const PANEL_HEIGHT_STORAGE_KEY = "convex-panel-bottom-sheet-height";
const PANEL_MIN_HEIGHT = 40;
const PANEL_COLLAPSED_HEIGHT = `${PANEL_MIN_HEIGHT}px`;
const PANEL_MAX_HEIGHT_RATIO = 0.9;
const PANEL_DEFAULT_HEIGHT = "60vh";

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  projectName: providedProjectName,
  deploymentUrl,
  environment: providedEnvironment = "development",
  isAuthenticated,
  onConnect,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onLogout: _onLogout,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  oauthConfig: _oauthConfig,
  activeTab: externalActiveTab,
  onTabChange,
  adminClient,
  accessToken,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isOAuthToken: _isOAuthToken,
  teamSlug,
  projectSlug,
  team,
  project,
  fullscreen = false,
  headerVisible = true,
  customHeader,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useActiveTab();
  const activeTab = externalActiveTab ?? internalActiveTab;
  const [isResizing, setIsResizing] = useState(false);
  const [isSupportPopupOpen, setIsSupportPopupOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [customHeight, setCustomHeight] = useState<number | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(PANEL_HEIGHT_STORAGE_KEY);
      return saved ? parseInt(saved, 10) : null;
    }
    return null;
  });
  const [sheetContainer, setSheetContainer] = useState<HTMLElement | null>(
    null,
  );

  const isPanelExpanded = Boolean(isOpen);

  const mainContentRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node && isPanelExpanded) {
        setSheetContainer(node);
      } else {
        setSheetContainer(null);
      }
    },
    [isPanelExpanded],
  );

  useEffect(() => {}, [sheetContainer]);

  const [deploymentMetadata, setDeploymentMetadata] = useState<{
    deploymentName?: string;
    projectName?: string;
    deploymentType?: "dev" | "prod" | "preview";
    kind?: "cloud" | "local";
  } | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  const [projectInfo, setProjectInfo] = useState<{
    team?: {
      id: string;
      name: string;
      slug: string;
    };
    project?: {
      id: string;
      name: string;
      slug: string;
      teamId: string;
    };
  } | null>(null);
  const [isLoadingProjectInfo, setIsLoadingProjectInfo] = useState(false);

  const isDeploymentPaused = useIsDeploymentPaused(adminClient);
  const deploymentState =
    isDeploymentPaused === true
      ? "paused"
      : isDeploymentPaused === false
        ? "running"
        : null;

  useEffect(() => {
    if (!isAuthenticated || !deploymentUrl) {
      setDeploymentMetadata(null);
      setIsLoadingMetadata(false);
      return;
    }

    const fetchMetadata = async () => {
      setIsLoadingMetadata(true);
      try {
        const metadata = await fetchDeploymentMetadata(
          adminClient,
          deploymentUrl,
          accessToken,
        );
        setDeploymentMetadata(metadata);
      } catch (error) {
        setDeploymentMetadata({
          deploymentName: extractDeploymentName(deploymentUrl),
          projectName: extractProjectName(deploymentUrl),
          deploymentType: "dev",
          kind: "cloud",
        });
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    fetchMetadata();
  }, [isAuthenticated, deploymentUrl, adminClient, accessToken]);

  useEffect(() => {
    if (!isAuthenticated || !deploymentUrl) {
      setProjectInfo(null);
      setIsLoadingProjectInfo(false);
      return;
    }

    const fetchInfo = async () => {
      setIsLoadingProjectInfo(true);
      try {
        const info = await fetchProjectInfo(
          adminClient,
          deploymentUrl,
          accessToken,
          teamSlug,
          projectSlug,
        );
        setProjectInfo(info);
      } catch (error) {
        if (team || project) {
          setProjectInfo({ team, project });
        } else {
          setProjectInfo(null);
        }
      } finally {
        setIsLoadingProjectInfo(false);
      }
    };

    fetchInfo();
  }, [
    isAuthenticated,
    deploymentUrl,
    adminClient,
    accessToken,
    teamSlug,
    projectSlug,
    team,
    project,
  ]);

  // useEffect(() => {
  //   if (!isAuthenticated || !deploymentUrl || !adminClient) {
  //     setDeploymentState(null);
  //     return;
  //   }

  //   // Check if dependencies actually changed
  //   const currentDeps = { deploymentUrl, accessToken: accessToken?.substring(0, 20) };
  //   const prevDeps = prevDepsRef.current;
  //   const depsChanged = prevDeps.deploymentUrl !== currentDeps.deploymentUrl ||
  //                       prevDeps.accessToken !== currentDeps.accessToken;

  //   // Update ref with current deps
  //   prevDepsRef.current = currentDeps;

  //   let isMounted = true;
  //   let intervalId: NodeJS.Timeout | null = null;

  //   const fetchDeploymentState = async () => {
  //     if (!isMounted || deploymentStateFetchRef.current.isFetching) return;

  //     // Throttle: don't fetch if we fetched less than 1 second ago (unless forced)
  //     const now = Date.now();
  //     const timeSinceLastFetch = now - deploymentStateFetchRef.current.lastFetch;
  //     if (timeSinceLastFetch < 1000) {
  //       return;
  //     }

  //     deploymentStateFetchRef.current.isFetching = true;
  //     deploymentStateFetchRef.current.lastFetch = now;

  //     try {
  //       const clientInfo = getAdminClientInfo(adminClient, deploymentUrl);

  //       if (!isMounted) {
  //         deploymentStateFetchRef.current.isFetching = false;
  //         return;
  //       }

  //       const { deploymentUrl: finalDeploymentUrl, adminKey } = clientInfo;
  //       const finalAdminKey = accessToken || adminKey;

  //       if (!finalDeploymentUrl || !finalAdminKey) {
  //         deploymentStateFetchRef.current.isFetching = false;
  //         return;
  //       }

  //       const state = await getConvexDeploymentState(finalDeploymentUrl, finalAdminKey);

  //       if (!isMounted) {
  //         deploymentStateFetchRef.current.isFetching = false;
  //         return;
  //       }

  //       setDeploymentState(state.state);
  //       deploymentStateFetchRef.current.isFetching = false;
  //     } catch (error) {
  //       if (!isMounted) {
  //         deploymentStateFetchRef.current.isFetching = false;
  //         return;
  //       }
  //       setDeploymentState(null);
  //       deploymentStateFetchRef.current.isFetching = false;
  //     }
  //   };

  //   // Check for immediate state changes (triggered by pause-deployment component)
  //   const checkForStateChange = () => {
  //     if (!isMounted) return;
  //     const lastChange = getStorageItem<number>(STORAGE_KEYS.DEPLOYMENT_STATE_CHANGED, 0);
  //     const now = Date.now();
  //     // If state was changed within the last 10 seconds, refresh immediately
  //     if (lastChange > 0 && (now - lastChange) < 10000) {
  //       deploymentStateFetchRef.current.lastFetch = 0; // Force fetch
  //       fetchDeploymentState();
  //     }
  //   };

  //   // Listen for custom deployment state change events for immediate updates
  //   const handleDeploymentStateChange = () => {
  //     if (!isMounted) return;
  //     deploymentStateFetchRef.current.lastFetch = 0; // Force fetch
  //     fetchDeploymentState();
  //   };

  //   // Only fetch on initial mount or when deps actually change
  //   if (depsChanged || deploymentStateFetchRef.current.lastFetch === 0) {
  //     fetchDeploymentState();
  //   }

  //   // Check for immediate state changes
  //   checkForStateChange();

  //   // Listen for custom events
  //   window.addEventListener('deploymentStateChanged', handleDeploymentStateChange);

  //   // Poll every 5 seconds (reduced from 2 seconds to reduce load)
  //   intervalId = setInterval(() => {
  //     if (!isMounted) return;
  //     checkForStateChange();
  //     fetchDeploymentState();
  //   }, 5000);

  //   return () => {
  //     isMounted = false;
  //     deploymentStateFetchRef.current.isFetching = false;
  //     if (intervalId) {
  //       clearInterval(intervalId);
  //     }
  //     window.removeEventListener('deploymentStateChanged', handleDeploymentStateChange);
  //   };
  // }, [isAuthenticated, deploymentUrl, adminClient, accessToken]);

  const handleSettingsClick = () => {
    if (onTabChange) {
      onTabChange("settings");
    } else {
      setInternalActiveTab("settings");
    }
    setStorageItem(STORAGE_KEYS.SETTINGS_SECTION, "pause-deployment");
  };

  const projectName = useMemo(() => {
    return (
      deploymentMetadata?.projectName ||
      providedProjectName ||
      extractProjectName(deploymentUrl) ||
      "convex-panel"
    );
  }, [deploymentMetadata?.projectName, providedProjectName, deploymentUrl]);

  const deploymentName = useMemo(() => {
    return (
      deploymentMetadata?.deploymentName ||
      extractDeploymentName(deploymentUrl) ||
      "convex-panel"
    );
  }, [deploymentMetadata?.deploymentName, deploymentUrl]);

  const deploymentType =
    deploymentMetadata?.deploymentType || providedEnvironment || "development";
  const environment =
    deploymentType === "prod"
      ? "production"
      : deploymentType === "preview"
        ? "preview"
        : "development";

  const projectWithName = useMemo(() => {
    const baseProject = projectInfo?.project || project;
    if (baseProject) {
      const hasValidName =
        baseProject.name &&
        typeof baseProject.name === "string" &&
        baseProject.name.trim().length > 0;
      const finalName = hasValidName ? baseProject.name : projectName;
      return {
        ...baseProject,
        name: finalName,
      };
    }
    if (projectName && projectName !== "convex-panel") {
      return {
        id: deploymentName || "",
        name: projectName,
        slug: projectName,
        teamId: projectInfo?.team?.id || team?.id || "",
      };
    }
    return undefined;
  }, [projectInfo, project, projectName, deploymentName, team]);

  const handleTabChange = (tab: TabId) => {
    setInternalActiveTab(tab);
    onTabChange?.(tab);
  };

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newHeight = window.innerHeight - e.clientY;
      const clampedHeight = Math.max(
        PANEL_MIN_HEIGHT,
        Math.min(newHeight, window.innerHeight * PANEL_MAX_HEIGHT_RATIO),
      );
      setCustomHeight(clampedHeight);
      localStorage.setItem(PANEL_HEIGHT_STORAGE_KEY, clampedHeight.toString());
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const isRunnerShown = useIsGlobalRunnerShown();
  const showGlobalRunner = useShowGlobalRunner();
  const [isGlobalRunnerVertical, setIsGlobalRunnerVertical] =
    useGlobalLocalStorage("functionRunnerOrientation", false);
  const [isRunnerExpanded, setIsRunnerExpanded] = useState(false);

  useFunctionRunnerShortcuts();

  const getHeight = () => {
    // In fullscreen mode, always use 100vh
    if (fullscreen) return "100vh";
    const minHeight = PANEL_COLLAPSED_HEIGHT;
    if (!isOpen) return minHeight;
    if (customHeight !== null) return `${customHeight}px`;
    return PANEL_DEFAULT_HEIGHT;
  };

  const height = getHeight();
  const finalHeight = fullscreen
    ? "100vh"
    : height === "0px" || !height
      ? PANEL_COLLAPSED_HEIGHT
      : height;

  const isProjectSelectorLoading =
    isAuthenticated && (isLoadingMetadata || isLoadingProjectInfo);

  const headerLeftContent = isAuthenticated ? (
    <>
      <div className="cp-flex cp-items-center cp-gap-2">
        <ConvexLogo width={30} height={30} />
        <ProjectSelector
          team={projectInfo?.team || team}
          project={projectWithName}
          loading={isProjectSelectorLoading}
        />
      </div>
      <DeploymentDisplay
        environment={environment}
        deploymentName={deploymentName}
        kind={deploymentMetadata?.kind || "cloud"}
        teamSlug={teamSlug}
        projectSlug={projectSlug}
        loading={isLoadingMetadata}
      />
    </>
  ) : (
    <>
      <ConvexLogo width={30} height={30} />
      {onConnect && (
        <button
          type="button"
          className="cp-connect-btn"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onConnect();
          }}
        >
          Connect
        </button>
      )}
    </>
  );

  const { theme, toggleTheme } = useThemeSafe();

  const teamId = projectInfo?.team?.id || team?.id;
  const teamIdNumber = teamId
    ? typeof teamId === "string"
      ? parseInt(teamId, 10)
      : teamId
    : undefined;
  const hasSubscription = useHasSubscription(teamIdNumber);

  const showUpgradeButton = isAuthenticated && hasSubscription === false;

  const handleUpgradeClick = () => {
    window.open(
      "https://convex.dev/referral/IDYLCO2615",
      "_blank",
      "noopener,noreferrer",
    );
  };

  const headerRightContent = (
    <>
      {!isAuthenticated && (
        <button
          type="button"
          className="cp-support-btn"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsInstructionsOpen(true);
          }}
          title="View setup instructions"
        >
          <BookOpen size={14} /> Instructions
        </button>
      )}
      {showUpgradeButton && (
        <button
          type="button"
          onClick={handleUpgradeClick}
          className="cp-btn cp-btn-primary"
        >
          <Sparkles size={14} />
          <span>Upgrade to Pro</span>
          <ExternalLink size={12} />
        </button>
      )}
      <AskAI />
      <button
        type="button"
        className="cp-support-btn"
        onClick={() => setIsSupportPopupOpen(true)}
      >
        <HelpCircle size={14} /> Support
      </button>
      {isAuthenticated && (
        <button
          type="button"
          className="cp-support-btn"
          onClick={() => setIsChatbotOpen(true)}
          title="AI Assistant"
        >
          <MessageCircle size={14} />
          Assistant
        </button>
      )}
      <button
        type="button"
        onClick={toggleTheme}
        className="cp-theme-toggle-btn"
        title={
          theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
        }
      >
        {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
      </button>
      {/* TODO: Add user menu back in later, will have configuration
        for menu bar, floating button, etc.
      */}
      {/* {isAuthenticated && isOAuthToken && (
        <UserMenu
          accessToken={accessToken}
          teamSlug={teamSlug}
          projectSlug={projectSlug}
          onLogout={onLogout}
        />
      )} */}

      {/* Hide collapse button in fullscreen mode - not needed */}
      {isAuthenticated && !fullscreen && (
        <>
          <div className="cp-separator" />
          <button
            type="button"
            onClick={onClose}
            className="cp-icon-btn cp-theme-toggle-btn"
          >
            {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </>
      )}
    </>
  );

  const handleChatbotClose = useCallback(() => setIsChatbotOpen(false), []);

  return (
    <div
      className={`cp-bottom-sheet cp-theme-${theme}${fullscreen ? " cp-fullscreen" : ""}`}
      style={{
        height: finalHeight,
        minHeight: fullscreen ? "100vh" : PANEL_COLLAPSED_HEIGHT,
        transition: isResizing ? "none" : "height 0.3s ease",
        userSelect: isResizing ? "none" : "auto",
        position: "fixed",
        top: fullscreen ? 0 : undefined,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99998,
        display: "flex",
        flexDirection: "column",
        visibility: "visible",
        opacity: 1,
        pointerEvents: "auto",
      }}
    >
      {/* Resize handle - hidden in fullscreen mode */}
      {isPanelExpanded && !fullscreen && (
        <div
          onMouseDown={handleResizeStart}
          className="cp-resize-handle"
          style={{
            backgroundColor: isResizing
              ? "var(--color-panel-accent, #6366f1)"
              : "transparent",
          }}
          onMouseEnter={(e) => {
            if (!isResizing) {
              e.currentTarget.style.backgroundColor =
                "var(--color-panel-accent, #6366f1)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isResizing) {
              e.currentTarget.style.backgroundColor = "transparent";
            }
          }}
        />
      )}
      {headerVisible &&
        (customHeader ? (
          <div
            className="cp-header-custom"
            style={{
              borderBottom: isOpen ? "1px solid var(--border)" : "none",
            }}
          >
            {customHeader}
          </div>
        ) : (
          <div
            className="cp-header"
            style={{ borderBottom: isOpen ? undefined : "none" }}
          >
            <div className="cp-header-section cp-header-section--left">
              {headerLeftContent}
            </div>
            <div className="cp-header-section cp-header-section--right">
              {headerRightContent}
            </div>
          </div>
        ))}
      {isPanelExpanded && (
        <>
          <div className="cp-flex cp-flex-1 cp-overflow-hidden">
            <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

            <div
              className="cp-main-content"
              ref={mainContentRef}
              style={{
                display: "flex",
                flexDirection: !isGlobalRunnerVertical ? "column" : "row",
                flex: 1,
                overflow: "hidden",
                minHeight: 0,
                width: "100%",
                position: "relative",
              }}
            >
              {/* Main content area - hidden when runner is expanded */}
              <div
                style={{
                  height: isRunnerExpanded && isRunnerShown ? 0 : undefined,
                  width: isRunnerExpanded && isRunnerShown ? 0 : undefined,
                  flex: isRunnerExpanded && isRunnerShown ? 0 : 1,
                  overflow:
                    isRunnerExpanded && isRunnerShown ? "hidden" : "auto",
                  minHeight: 0,
                  minWidth: 0,
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Deployment Paused Banner */}
                {isAuthenticated && deploymentState === "paused" && (
                  <div
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      color: "#f87171",
                      padding: "12px 24px",
                      textAlign: "center",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <span>
                      This deployment is paused. Resume your deployment on
                      the{" "}
                    </span>
                    <button
                      type="button"
                      onClick={handleSettingsClick}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#60a5fa",
                        textDecoration: "underline",
                        cursor: "pointer",
                        padding: 0,
                        fontSize: "14px",
                        fontWeight: 500,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#93c5fd";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#60a5fa";
                      }}
                    >
                      settings
                    </button>
                    <span> page.</span>
                  </div>
                )}
                {children}
                {isPanelExpanded && <GlobalSheet container={sheetContainer} />}
              </div>

              {/* Function Runner - always rendered when shown, positioned at bottom */}
              {isRunnerShown && (
                <GlobalFunctionTester
                  adminClient={adminClient}
                  deploymentUrl={deploymentUrl}
                  componentId={null}
                  isVertical={isGlobalRunnerVertical}
                  setIsVertical={setIsGlobalRunnerVertical}
                  isExpanded={isRunnerExpanded}
                  setIsExpanded={setIsRunnerExpanded}
                  container={sheetContainer}
                />
              )}
            </div>
          </div>

          {/* Floating button for function runner */}
          <FloatingButtons
            isAuthenticated={isAuthenticated}
            isRunnerShown={isRunnerShown}
            showGlobalRunner={showGlobalRunner}
          />
        </>
      )}

      {/* Support Popup */}
      <SupportPopup
        isOpen={isSupportPopupOpen}
        onClose={() => setIsSupportPopupOpen(false)}
        hasProAccess={hasSubscription === true}
      />

      {/* Setup Instructions */}
      <SetupInstructions
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
        deploymentUrl={deploymentUrl}
        teamSlug={teamSlug}
        projectSlug={projectSlug}
        accessToken={accessToken}
      />

      {/* Chatbot Sheet - wrapped to isolate DataViewContext subscription */}
      {isAuthenticated && (
        <ChatbotSheetWrapper
          isOpen={isChatbotOpen}
          onClose={handleChatbotClose}
          adminClient={adminClient}
          accessToken={accessToken}
          deploymentUrl={deploymentUrl}
          onTabChange={onTabChange}
          container={sheetContainer}
          activeTab={activeTab}
        />
      )}
    </div>
  );
};
