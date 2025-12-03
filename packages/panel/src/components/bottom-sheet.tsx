import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  X,
  HelpCircle,
  Sun,
  Moon,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { ConvexLogo } from './icons';
import { AskAI } from './ask-ai';
import { getAdminClientInfo, validateAdminClientInfo } from '../utils/adminClient';
import { setStorageItem, getStorageItem } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/constants';
import { DeploymentDisplay } from './shared/deployment-display';
import { ProjectSelector } from './shared/project-selector';
import { GlobalFunctionTester } from './function-runner/global-function-tester';
import { GlobalSheet } from './shared/global-sheet';
import { Sidebar } from './sidebar';
import { useActiveTab } from '../hooks/useActiveTab';
import { useIsGlobalRunnerShown, useShowGlobalRunner } from '../lib/functionRunner';
import { useFunctionRunnerShortcuts } from '../hooks/useFunctionRunnerShortcuts';
import type { TabId } from '../types/tabs';
import type { Team, Project, EnvType } from '../types';
import { useThemeSafe } from '../hooks/useTheme';
import { useHasSubscription } from '../hooks/useTeamOrbSubscription';
import { SupportPopup } from './support-popup';
import { fetchDeploymentMetadata } from '../utils/api/deployments';
import { extractDeploymentName, extractProjectName } from '../utils/api/utils';
import { fetchProjectInfo } from '../utils/api/teams';
import { getConvexDeploymentState } from '../utils/api/deployments';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  projectName?: string;
  deploymentUrl?: string;
  environment?: EnvType;
  isAuthenticated?: boolean;
  onConnect?: () => void;
  oauthConfig?: any;
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
  adminClient?: any;
  accessToken?: string;
  teamSlug?: string;
  projectSlug?: string;
  team?: Team;
  project?: Project;
}

const PANEL_HEIGHT_STORAGE_KEY = 'convex-panel-bottom-sheet-height';
const PANEL_MIN_HEIGHT = 40;
const PANEL_COLLAPSED_HEIGHT = `${PANEL_MIN_HEIGHT}px`;
const PANEL_MAX_HEIGHT_RATIO = 0.9;
const PANEL_DEFAULT_HEIGHT = '60vh';

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  projectName: providedProjectName,
  deploymentUrl,
  environment: providedEnvironment = 'development',
  isAuthenticated,
  onConnect,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  oauthConfig: _oauthConfig,
  activeTab: externalActiveTab,
  onTabChange,
  adminClient,
  accessToken,
  teamSlug,
  projectSlug,
  team,
  project,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useActiveTab();
  const activeTab = externalActiveTab ?? internalActiveTab;
  const [isResizing, setIsResizing] = useState(false);
  const [isSupportPopupOpen, setIsSupportPopupOpen] = useState(false);
  const [customHeight, setCustomHeight] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(PANEL_HEIGHT_STORAGE_KEY);
      return saved ? parseInt(saved, 10) : null;
    }
    return null;
  });
  const [sheetContainer, setSheetContainer] = useState<HTMLElement | null>(null);
  
  // Calculate isPanelExpanded early so it can be used in the callback ref
  const isPanelExpanded = Boolean(isAuthenticated && isOpen);
  
  // Callback ref to track the main content container
  const mainContentRef = useCallback((node: HTMLDivElement | null) => {
    if (node && isPanelExpanded) {
      setSheetContainer(node);
    } else {
      setSheetContainer(null);
    }
  }, [isPanelExpanded]);
  
  const [deploymentMetadata, setDeploymentMetadata] = useState<{
    deploymentName?: string;
    projectName?: string;
    deploymentType?: 'dev' | 'prod' | 'preview';
    kind?: 'cloud' | 'local';
  } | null>(null);

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

  const [deploymentState, setDeploymentState] = useState<'running' | 'paused' | null>(null);
  const deploymentStateFetchRef = useRef<{ lastFetch: number; isFetching: boolean }>({ lastFetch: 0, isFetching: false });
  const prevDepsRef = useRef<{ deploymentUrl?: string; accessToken?: string }>({});

  useEffect(() => {
    if (!isAuthenticated || !deploymentUrl) {
      setDeploymentMetadata(null);
      return;
    }

    const fetchMetadata = async () => {
      try {
        const metadata = await fetchDeploymentMetadata(adminClient, deploymentUrl, accessToken);
        setDeploymentMetadata(metadata);
      } catch (error) {
        setDeploymentMetadata({
          deploymentName: extractDeploymentName(deploymentUrl),
          projectName: extractProjectName(deploymentUrl),
          deploymentType: 'dev',
          kind: 'cloud',
        });
      }
    };

    fetchMetadata();
  }, [isAuthenticated, deploymentUrl, adminClient, accessToken]);

  useEffect(() => {
    if (!isAuthenticated || !deploymentUrl) {
      setProjectInfo(null);
      return;
    }

    const fetchInfo = async () => {
      try {
        const info = await fetchProjectInfo(adminClient, deploymentUrl, accessToken, teamSlug, projectSlug);
        setProjectInfo(info);
      } catch (error) {
        if (team || project) {
          setProjectInfo({ team, project });
        } else {
          setProjectInfo(null);
        }
      }
    };

    fetchInfo();
  }, [isAuthenticated, deploymentUrl, adminClient, accessToken, teamSlug, projectSlug, team, project]);

  // Fetch deployment state
  useEffect(() => {
    if (!isAuthenticated || !deploymentUrl || !adminClient) {
      setDeploymentState(null);
      return;
    }

    // Check if dependencies actually changed
    const currentDeps = { deploymentUrl, accessToken: accessToken?.substring(0, 20) };
    const prevDeps = prevDepsRef.current;
    const depsChanged = prevDeps.deploymentUrl !== currentDeps.deploymentUrl || 
                        prevDeps.accessToken !== currentDeps.accessToken;
    
    // Update ref with current deps
    prevDepsRef.current = currentDeps;

    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    const fetchDeploymentState = async () => {
      if (!isMounted || deploymentStateFetchRef.current.isFetching) return;
      
      // Throttle: don't fetch if we fetched less than 1 second ago (unless forced)
      const now = Date.now();
      const timeSinceLastFetch = now - deploymentStateFetchRef.current.lastFetch;
      if (timeSinceLastFetch < 1000) {
        return;
      }

      deploymentStateFetchRef.current.isFetching = true;
      deploymentStateFetchRef.current.lastFetch = now;

      try {
        const clientInfo = getAdminClientInfo(adminClient, deploymentUrl);
        const validationError = validateAdminClientInfo(clientInfo);

        if (!isMounted) {
          deploymentStateFetchRef.current.isFetching = false;
          return;
        }

        if (validationError) {
          deploymentStateFetchRef.current.isFetching = false;
          return;
        }

        const { deploymentUrl: finalDeploymentUrl, adminKey } = clientInfo;
        const finalAdminKey = accessToken || adminKey;

        if (!finalDeploymentUrl || !finalAdminKey) {
          deploymentStateFetchRef.current.isFetching = false;
          return;
        }

        const state = await getConvexDeploymentState(finalDeploymentUrl, finalAdminKey);
        
        if (!isMounted) {
          deploymentStateFetchRef.current.isFetching = false;
          return;
        }
        
        setDeploymentState(state.state);
        deploymentStateFetchRef.current.isFetching = false;
      } catch (error) {
        if (!isMounted) {
          deploymentStateFetchRef.current.isFetching = false;
          return;
        }
        setDeploymentState(null);
        deploymentStateFetchRef.current.isFetching = false;
      }
    };

    // Check for immediate state changes (triggered by pause-deployment component)
    const checkForStateChange = () => {
      if (!isMounted) return;
      const lastChange = getStorageItem<number>(STORAGE_KEYS.DEPLOYMENT_STATE_CHANGED, 0);
      const now = Date.now();
      // If state was changed within the last 10 seconds, refresh immediately
      if (lastChange > 0 && (now - lastChange) < 10000) {
        deploymentStateFetchRef.current.lastFetch = 0; // Force fetch
        fetchDeploymentState();
      }
    };

    // Listen for custom deployment state change events for immediate updates
    const handleDeploymentStateChange = () => {
      if (!isMounted) return;
      deploymentStateFetchRef.current.lastFetch = 0; // Force fetch
      fetchDeploymentState();
    };

    // Only fetch on initial mount or when deps actually change
    if (depsChanged || deploymentStateFetchRef.current.lastFetch === 0) {
      fetchDeploymentState();
    }
    
    // Check for immediate state changes
    checkForStateChange();
    
    // Listen for custom events
    window.addEventListener('deploymentStateChanged', handleDeploymentStateChange);
    
    // Poll every 5 seconds (reduced from 2 seconds to reduce load)
    intervalId = setInterval(() => {
      if (!isMounted) return;
      checkForStateChange();
      fetchDeploymentState();
    }, 5000);
    
    return () => {
      isMounted = false;
      deploymentStateFetchRef.current.isFetching = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
      window.removeEventListener('deploymentStateChanged', handleDeploymentStateChange);
    };
  }, [isAuthenticated, deploymentUrl, adminClient, accessToken]);

  const handleSettingsClick = () => {
    // Navigate to settings tab
    if (onTabChange) {
      onTabChange('settings');
    } else {
      setInternalActiveTab('settings');
    }
    // Set the settings section to pause-deployment
    setStorageItem(STORAGE_KEYS.SETTINGS_SECTION, 'pause-deployment');
  };

  // Calculate project name with fallbacks
  const projectName = useMemo(() => {
    return deploymentMetadata?.projectName || providedProjectName || extractProjectName(deploymentUrl) || 'convex-panel';
  }, [deploymentMetadata?.projectName, providedProjectName, deploymentUrl]);
  
  const deploymentName = useMemo(() => {
    return deploymentMetadata?.deploymentName || extractDeploymentName(deploymentUrl) || 'convex-panel';
  }, [deploymentMetadata?.deploymentName, deploymentUrl]);
  
  const deploymentType = deploymentMetadata?.deploymentType || providedEnvironment || 'development';
  const environment = deploymentType === 'prod' ? 'production' : deploymentType === 'preview' ? 'preview' : 'development';
  
  // Ensure project always has a name for ProjectSelector - reactive to projectInfo changes
  const projectWithName = useMemo(() => {
    // Prioritize project from projectInfo (fetched from API) over prop
    const baseProject = projectInfo?.project || project;
    if (baseProject) {
      // Use the project's name if it exists and is not empty, otherwise fall back to calculated projectName
      // Check if baseProject.name is a valid non-empty string
      const hasValidName = baseProject.name && typeof baseProject.name === 'string' && baseProject.name.trim().length > 0;
      const finalName = hasValidName ? baseProject.name : projectName;
      return {
        ...baseProject,
        name: finalName,
      };
    }
    // If no project exists, create one with the project name
    if (projectName && projectName !== 'convex-panel') {
      return {
        id: deploymentName || '',
        name: projectName,
        slug: projectName,
        teamId: projectInfo?.team?.id || team?.id || '',
      };
    }
    return undefined;
  }, [projectInfo, project, projectName, deploymentName, team]);
  
  const handleTabChange = (tab: TabId) => {
    setInternalActiveTab(tab);
    onTabChange?.(tab);
  };

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    if (!isAuthenticated) return;
    e.preventDefault();
    setIsResizing(true);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isAuthenticated) return;
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

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, isAuthenticated]);

  const isRunnerShown = useIsGlobalRunnerShown();
  const showGlobalRunner = useShowGlobalRunner();
  
  useFunctionRunnerShortcuts();

  const getHeight = () => {
    // Always show at least the collapsed height (40px) so header is always visible
    const minHeight = PANEL_COLLAPSED_HEIGHT;
    if (!isAuthenticated) return minHeight;
    if (!isOpen) return minHeight;
    if (customHeight !== null) return `${customHeight}px`;
    return PANEL_DEFAULT_HEIGHT;
  };

  const height = getHeight();
  // Ensure height is never less than collapsed height
  const finalHeight = height === '0px' || !height ? PANEL_COLLAPSED_HEIGHT : height;

  const headerLeftContent = isAuthenticated ? (
    <>
      <div className="cp-flex cp-items-center cp-gap-2">
        <ConvexLogo width={20} height={20} />
        <ProjectSelector 
          team={projectInfo?.team || team} 
          project={projectWithName}
        />
      </div>
      <DeploymentDisplay
        environment={environment}
        deploymentName={deploymentName}
        kind={deploymentMetadata?.kind || 'cloud'}
        teamSlug={teamSlug}
        projectSlug={projectSlug}
      />
    </>
  ) : (
    <>
      <ConvexLogo width={20} height={20} />
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

  // Get team ID for subscription check
  const teamId = projectInfo?.team?.id || team?.id;
  // Convert string team ID to number if needed, or pass as-is if already a number
  const teamIdNumber = teamId ? (typeof teamId === 'string' ? parseInt(teamId, 10) : teamId) : undefined;
  const hasSubscription = useHasSubscription(teamIdNumber);
  
  // Show upgrade button if authenticated, not loading, and no subscription
  const showUpgradeButton = isAuthenticated && hasSubscription === false;

  const handleUpgradeClick = () => {
    window.open('https://convex.dev/referral/IDYLCO2615', '_blank', 'noopener,noreferrer');
  };

  const headerRightContent = (
    <>
      {showUpgradeButton && (
        <button
          type="button"
          onClick={handleUpgradeClick}
          className="cp-upgrade-btn"
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
      <button
        type="button"
        onClick={toggleTheme}
        className="cp-theme-toggle-btn"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
      </button>
      <div className="cp-separator" />
      {isAuthenticated ? (
        <button type="button" onClick={onClose} className="cp-icon-btn cp-theme-toggle-btn">
          {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      ) : (
        <button type="button" onClick={onClose} className="cp-icon-btn">
          <X size={16} />
        </button>
      )}
    </>
  );

  // Always render the BottomSheet - it should always be visible
  return (
    <div
      className={`cp-bottom-sheet cp-theme-${theme}`}
      style={{
        height: finalHeight,
        minHeight: PANEL_COLLAPSED_HEIGHT,
        transition: isResizing ? 'none' : 'height 0.3s ease',
        userSelect: isResizing ? 'none' : 'auto',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99998,
        display: 'flex',
        flexDirection: 'column',
        visibility: 'visible',
        opacity: 1,
      }}
    >
      {isPanelExpanded && (
        <div onMouseDown={handleResizeStart} className="cp-resize-handle" />
      )}
      <div className="cp-header" style={{ borderBottom: isOpen ? undefined : 'none' }}>
        <div className="cp-header-section">{headerLeftContent}</div>
        <div className="cp-header-section">{headerRightContent}</div>
      </div>

      {isPanelExpanded && (
        <>
          <div className="cp-flex cp-flex-1 cp-overflow-hidden">
            {isRunnerShown ? (
              <GlobalFunctionTester
                adminClient={adminClient}
                deploymentUrl={deploymentUrl}
                componentId={null}
              />
            ) : (
              <>
                <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

                <div className="cp-main-content" ref={mainContentRef} style={{ position: 'relative', overflow: 'hidden' }}>
                    {/* Deployment Paused Banner */}
                    {isAuthenticated && deploymentState === 'paused' && (
                      <div
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          color: '#f87171',
                          padding: '12px 24px',
                          textAlign: 'center',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>This deployment is paused. Resume your deployment on the </span>
                        <button
                          type="button"
                          onClick={handleSettingsClick}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#60a5fa',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: '14px',
                            fontWeight: 500,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#93c5fd';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#60a5fa';
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
              </>
            )}
          </div>

          {!isRunnerShown && isAuthenticated && (
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
          )}
        </>
      )}

      {/* Support Popup */}
      <SupportPopup
        isOpen={isSupportPopupOpen}
        onClose={() => setIsSupportPopupOpen(false)}
        hasProAccess={hasSubscription === true}
      />
    </div>
  );
};

