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
} from 'lucide-react';
import { ConvexLogo } from './icons';
import { AskAI } from './ask-ai';
import { extractDeploymentName, extractProjectName, fetchDeploymentMetadata, fetchProjectInfo } from '../utils/api';
import { DeploymentDisplay } from './shared/deployment-display';
import { ProjectSelector } from './shared/project-selector';
import { getStorageItem, setStorageItem } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/constants';
import { GlobalFunctionTester } from './function-runner/global-function-tester';
import { useIsGlobalRunnerShown, useShowGlobalRunner } from '../lib/functionRunner';
import { useFunctionRunnerShortcuts } from '../hooks/useFunctionRunnerShortcuts';
import { TabId } from '../types/tabs';
import { bottomSheetStyles } from '../styles/panelStyles';

interface Team {
  id: string;
  name: string;
  slug: string;
}

interface Project {
  id: string;
  name: string;
  slug: string;
  teamId: string;
}

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onHide?: () => void;
  children?: React.ReactNode;
  projectName?: string;
  deploymentUrl?: string;
  environment?: 'development' | 'production' | 'preview';
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

const {
  rootBase: rootBaseStyle,
  headerBase: headerBaseStyle,
  headerSection: headerSectionStyle,
  supportButton: supportButtonStyle,
  supportButtonHover: supportButtonHoverStyle,
  iconButton: iconButtonStyle,
  iconButtonHover: iconButtonHoverStyle,
  connectButton: connectButtonStyle,
  connectButtonHover: connectButtonHoverStyle,
  resizeHandle: resizeHandleStyle,
  sidebarItemWrapper: sidebarItemWrapperStyle,
  sidebarButtonBase: sidebarButtonBaseStyle,
  sidebarButtonActive: sidebarButtonActiveStyle,
  sidebarButtonHover: sidebarButtonHoverStyle,
  tooltip: tooltipStyle,
  sidebarContainer: sidebarContainerStyle,
  separator: separatorStyle,
  mainContent: mainContentStyle,
  floatingButtonWrapper: floatingButtonWrapperStyle,
  floatingButton: floatingButtonStyle,
  floatingButtonHover: floatingButtonHoverStyle,
} = bottomSheetStyles;

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
  { id: 'health', icon: <Activity size={20} />, label: 'Health' },
  { id: 'data', icon: <Database size={20} />, label: 'Data' },
  { id: 'functions', icon: <Code2 size={20} />, label: 'Functions' },
  { id: 'files', icon: <FileCode size={20} />, label: 'Files' },
  { id: 'schedules', icon: <CalendarClock size={20} />, label: 'Schedules' },
  { id: 'logs', icon: <ScrollText size={20} />, label: 'Logs' },
  { id: 'settings', icon: <Settings size={20} />, label: 'Settings' },
];

interface HoverButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  hoverStyle?: React.CSSProperties;
  style: React.CSSProperties;
}

const HoverButton: React.FC<HoverButtonProps> = ({
  style,
  hoverStyle,
  children,
  onMouseEnter,
  onMouseLeave,
  ...rest
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = (event: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(true);
    onMouseEnter?.(event);
  };

  const handleMouseLeave = (event: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(false);
    onMouseLeave?.(event);
  };

  return (
    <button
      {...rest}
      style={{
        ...style,
        ...(isHovered && hoverStyle ? hoverStyle : {}),
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </button>
  );
};

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, isActive, onClick }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      style={sidebarItemWrapperStyle}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <HoverButton
        type="button"
        onClick={onClick}
        style={{
          ...sidebarButtonBaseStyle,
          ...(isActive ? sidebarButtonActiveStyle : {}),
        }}
        hoverStyle={isActive ? undefined : sidebarButtonHoverStyle}
      >
        {icon}
      </HoverButton>
      {showTooltip && <div style={tooltipStyle}>{label}</div>}
    </div>
  );
};

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  onHide,
  children,
  projectName: providedProjectName,
  deploymentUrl,
  environment: providedEnvironment = 'development',
  isAuthenticated,
  onConnect,
  oauthConfig,
  activeTab: externalActiveTab,
  onTabChange,
  adminClient,
  accessToken,
  teamSlug,
  projectSlug,
  team,
  project,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<TabId>(() => {
    if (typeof window !== 'undefined') {
      const saved = getStorageItem<TabId>(STORAGE_KEYS.ACTIVE_TAB, 'health');
      return saved;
    }
    return 'health';
  });
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

  const projectName = deploymentMetadata?.projectName || providedProjectName || extractProjectName(deploymentUrl) || 'convex-panel';
  const deploymentName = deploymentMetadata?.deploymentName || extractDeploymentName(deploymentUrl) || 'convex-panel';
  const deploymentType = deploymentMetadata?.deploymentType || providedEnvironment || 'development';
  const environment = deploymentType === 'prod' ? 'production' : deploymentType === 'preview' ? 'preview' : 'development';
  
  const handleTabChange = (tab: TabId) => {
    setInternalActiveTab(tab);
    setStorageItem(STORAGE_KEYS.ACTIVE_TAB, tab);
    onTabChange?.(tab);
  };

  useEffect(() => {
    if (activeTab) {
      setStorageItem(STORAGE_KEYS.ACTIVE_TAB, activeTab);
    }
  }, [activeTab]);

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
  const panelStyle: React.CSSProperties = {
    ...rootBaseStyle,
    height,
    transition: isResizing ? 'none' : 'height 0.3s ease',
    userSelect: isResizing ? 'none' : 'auto',
  };

  const headerStyle: React.CSSProperties = {
    ...headerBaseStyle,
    borderBottom: isOpen ? '1px solid #2D313A' : 'none',
  };

  const headerLeftContent = isAuthenticated ? (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
        <HoverButton
          type="button"
          style={connectButtonStyle}
          hoverStyle={connectButtonHoverStyle}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onConnect();
          }}
        >
          Connect
        </HoverButton>
      )}
    </>
  );

  const headerRightContent = (
    <>
      <AskAI />
      <HoverButton type="button" style={supportButtonStyle} hoverStyle={supportButtonHoverStyle}>
        <HelpCircle size={14} /> Support
      </HoverButton>
      <div style={separatorStyle} />
      {isAuthenticated ? (
        <HoverButton type="button" onClick={onClose} style={iconButtonStyle} hoverStyle={iconButtonHoverStyle}>
          {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </HoverButton>
      ) : (
        <HoverButton
          type="button"
          onClick={onHide || onClose}
          style={iconButtonStyle}
          hoverStyle={iconButtonHoverStyle}
        >
          <X size={16} />
        </HoverButton>
      )}
    </>
  );

  const isPanelExpanded = Boolean(isAuthenticated && isOpen);

  return (
    <div style={panelStyle}>
      {isPanelExpanded && (
        <div onMouseDown={handleResizeStart} style={resizeHandleStyle} />
      )}

      <div style={headerStyle}>
        <div style={headerSectionStyle}>{headerLeftContent}</div>
        <div style={headerSectionStyle}>{headerRightContent}</div>
      </div>

      {isPanelExpanded && (
        <>
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {isRunnerShown ? (
              <GlobalFunctionTester
                adminClient={adminClient}
                deploymentUrl={deploymentUrl}
                componentId={null}
              />
            ) : (
              <>
                <div style={sidebarContainerStyle}>
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

                <div style={mainContentStyle}>{children}</div>
              </>
            )}
          </div>

          {!isRunnerShown && isAuthenticated && (
            <div style={floatingButtonWrapperStyle}>
              <HoverButton
                type="button"
                onClick={() => showGlobalRunner(null, 'click')}
                style={floatingButtonStyle}
                hoverStyle={floatingButtonHoverStyle}
                title="Run functions (Ctrl+`)"
              >
                fn
              </HoverButton>
            </div>
          )}
        </>
      )}
    </div>
  );
};

