import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronDown,
  ChevronUp,
  X,
  Activity,
  Database,
  Code2,
  FileCode,
  CalendarClock,
  ScrollText,
  Settings,
  HelpCircle,
  Sun,
  Moon,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { ConvexLogo } from './icons';
import { AskAI } from './ask-ai';
import { extractDeploymentName, extractProjectName, fetchDeploymentMetadata, fetchProjectInfo } from '../utils/api';
import { DeploymentDisplay } from './shared/deployment-display';
import { ProjectSelector } from './shared/project-selector';
import { GlobalFunctionTester } from './function-runner/global-function-tester';
import { useActiveTab } from '../hooks/useActiveTab';
import { useIsGlobalRunnerShown, useShowGlobalRunner } from '../lib/functionRunner';
import { useFunctionRunnerShortcuts } from '../hooks/useFunctionRunnerShortcuts';
import { TabId } from '../types/tabs';
import { Team, Project, EnvType } from '../types';
import { useThemeSafe } from '../hooks/useTheme';
import { useHasSubscription } from '../hooks/useTeamOrbSubscription';

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

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}

const PANEL_HEIGHT_STORAGE_KEY = 'convex-panel-bottom-sheet-height';
const PANEL_MIN_HEIGHT = 40;
const PANEL_COLLAPSED_HEIGHT = `${PANEL_MIN_HEIGHT}px`;
const PANEL_MAX_HEIGHT_RATIO = 0.9;
const PANEL_DEFAULT_HEIGHT = '60vh';

interface TabDefinition {
  id: TabId;
  icon: React.ReactNode;
  label: string;
}

const TAB_DEFINITIONS: TabDefinition[] = [
  { id: 'health', icon: <Activity size={14} />, label: 'Health' },
  { id: 'data', icon: <Database size={14} />, label: 'Data' },
  { id: 'functions', icon: <Code2 size={14} />, label: 'Functions' },
  { id: 'files', icon: <FileCode size={14} />, label: 'Files' },
  { id: 'schedules', icon: <CalendarClock size={14} />, label: 'Schedules' },
  { id: 'logs', icon: <ScrollText size={14} />, label: 'Logs' },
  { id: 'settings', icon: <Settings size={14} />, label: 'Settings' },
];

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, isActive, onClick }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="cp-sidebar-item-wrapper"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {isActive && <div className="cp-sidebar-active-indicator" />}
      <button
        type="button"
        onClick={onClick}
        className={`cp-sidebar-btn ${isActive ? 'active' : ''}`}
      >
        {icon}
      </button>
      {showTooltip && <div className="cp-tooltip">{label}</div>}
    </div>
  );
};

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
  const [customHeight, setCustomHeight] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(PANEL_HEIGHT_STORAGE_KEY);
      return saved ? parseInt(saved, 10) : null;
    }
    return null;
  });
  
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
        console.debug('Failed to fetch deployment metadata:', error);
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
        console.debug('Failed to fetch project info:', error);
        if (team || project) {
          setProjectInfo({ team, project });
        } else {
          setProjectInfo(null);
        }
      }
    };

    fetchInfo();
  }, [isAuthenticated, deploymentUrl, adminClient, accessToken, teamSlug, projectSlug, team, project]);

  // Project name for future use
  const _projectName = deploymentMetadata?.projectName || providedProjectName || extractProjectName(deploymentUrl) || 'convex-panel';
  void _projectName; // Silence unused warning
  const deploymentName = deploymentMetadata?.deploymentName || extractDeploymentName(deploymentUrl) || 'convex-panel';
  const deploymentType = deploymentMetadata?.deploymentType || providedEnvironment || 'development';
  const environment = deploymentType === 'prod' ? 'production' : deploymentType === 'preview' ? 'preview' : 'development';
  
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
    if (!isAuthenticated) return PANEL_COLLAPSED_HEIGHT;
    if (!isOpen) return PANEL_COLLAPSED_HEIGHT;
    if (customHeight !== null) return `${customHeight}px`;
    return PANEL_DEFAULT_HEIGHT;
  };

  const height = getHeight();

  const headerLeftContent = isAuthenticated ? (
    <>
      <div className="cp-flex cp-items-center cp-gap-2">
        <ConvexLogo width={20} height={20} />
        <ProjectSelector team={projectInfo?.team || team} project={projectInfo?.project || project} />
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
      <button type="button" className="cp-support-btn">
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

  const isPanelExpanded = Boolean(isAuthenticated && isOpen);

  return (
    <div
      className={`cp-bottom-sheet cp-theme-${theme}`}
      style={{
        height,
        transition: isResizing ? 'none' : 'height 0.3s ease',
        userSelect: isResizing ? 'none' : 'auto',
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
                <div className="cp-sidebar">
                  {TAB_DEFINITIONS.map((tab) => (
                    <SidebarItem
                      key={tab.id}
                      icon={tab.icon}
                      label={tab.label}
                      isActive={activeTab === tab.id}
                      onClick={() => handleTabChange(tab.id)}
                    />
                  ))}
                </div>

                <div className="cp-main-content">{children}</div>
              </>
            )}
          </div>

          {!isRunnerShown && isAuthenticated && (
            <div className="cp-floating-btn-wrapper">
              <button
                type="button"
                onClick={() => showGlobalRunner(null, 'click')}
                className="cp-floating-btn"
                title="Run functions (Ctrl+`)"
              >
                fn
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

