import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Sparkles,
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

type TabId = 'health' | 'data' | 'functions' | 'files' | 'schedules' | 'logs' | 'settings';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, isActive, onClick }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={onClick}
        style={{
          width: '25px',
          height: '25px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          transition: 'all 0.2s',
          backgroundColor: isActive ? '#1C1F26' : 'transparent',
          color: isActive ? '#fff' : '#999',
          border: 'none',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.color = '#d1d5db';
            e.currentTarget.style.backgroundColor = 'rgba(28, 31, 38, 0.5)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.color = '#999';
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        {icon}
      </button>
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            left: '48px',
            padding: '4px 8px',
            backgroundColor: '#2D313A',
            color: '#fff',
            fontSize: '12px',
            borderRadius: '4px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 50,
          }}
        >
          {label}
        </div>
      )}
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
  // Load active tab from localStorage on initialization
  const [internalActiveTab, setInternalActiveTab] = useState<TabId>(() => {
    if (typeof window !== 'undefined') {
      const saved = getStorageItem<TabId>(STORAGE_KEYS.ACTIVE_TAB, 'health');
      return saved;
    }
    return 'health';
  });
  const activeTab = externalActiveTab ?? internalActiveTab;
  const [isMinimized, setIsMinimized] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [customHeight, setCustomHeight] = useState<number | null>(() => {
    // Load saved height from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('convex-panel-bottom-sheet-height');
      return saved ? parseInt(saved, 10) : null;
    }
    return null;
  });
  
  // State for deployment metadata
  const [deploymentMetadata, setDeploymentMetadata] = useState<{
    deploymentName?: string;
    projectName?: string;
    deploymentType?: 'dev' | 'prod' | 'preview';
    kind?: 'cloud' | 'local';
  } | null>(null);

  // State for project info
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

  // Fetch deployment metadata when authenticated and we have the necessary info
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
        // Fall back to extracted values
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

  // Fetch project info when authenticated and we have the necessary info
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
        // Fall back to provided props or extracted values
        if (team || project) {
          setProjectInfo({ team, project });
        } else {
          setProjectInfo(null);
        }
      }
    };

    fetchInfo();
  }, [isAuthenticated, deploymentUrl, adminClient, accessToken, teamSlug, projectSlug, team, project]);

  // Use fetched metadata or fall back to provided/extracted values
  const projectName = deploymentMetadata?.projectName || providedProjectName || extractProjectName(deploymentUrl) || 'convex-panel';
  const deploymentName = deploymentMetadata?.deploymentName || extractDeploymentName(deploymentUrl) || 'convex-panel';
  const deploymentType = deploymentMetadata?.deploymentType || providedEnvironment || 'development';
  const environment = deploymentType === 'prod' ? 'production' : deploymentType === 'preview' ? 'preview' : 'development';
  
  const handleTabChange = (tab: TabId) => {
    setInternalActiveTab(tab);
    // Save to localStorage
    setStorageItem(STORAGE_KEYS.ACTIVE_TAB, tab);
    onTabChange?.(tab);
  };

  // Save activeTab to localStorage when it changes (including external changes)
  useEffect(() => {
    if (activeTab) {
      setStorageItem(STORAGE_KEYS.ACTIVE_TAB, activeTab);
    }
  }, [activeTab]);

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    if (!isAuthenticated) return;
    e.preventDefault();
    setIsResizing(true);
  }, [isAuthenticated]);

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isAuthenticated) return;
      const newHeight = window.innerHeight - e.clientY;
      // Clamp between 40px (header only) and 90vh (almost full screen)
      const clampedHeight = Math.max(40, Math.min(newHeight, window.innerHeight * 0.9));
      setCustomHeight(clampedHeight);
      // Save to localStorage
      localStorage.setItem('convex-panel-bottom-sheet-height', clampedHeight.toString());
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

  const tabs: { id: TabId; icon: React.ReactNode; label: string }[] = [
    { id: 'health', icon: <Activity size={20} />, label: 'Health' },
    { id: 'data', icon: <Database size={20} />, label: 'Data' },
    { id: 'functions', icon: <Code2 size={20} />, label: 'Functions' },
    { id: 'files', icon: <FileCode size={20} />, label: 'Files' },
    { id: 'schedules', icon: <CalendarClock size={20} />, label: 'Schedules' },
    { id: 'logs', icon: <ScrollText size={20} />, label: 'Logs' },
    { id: 'settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  // Function runner state
  const isRunnerShown = useIsGlobalRunnerShown();
  const showGlobalRunner = useShowGlobalRunner();
  
  // Keyboard shortcuts
  useFunctionRunnerShortcuts();

  // When not authenticated, always keep it collapsed (40px height)
  // When authenticated, allow expansion and use custom height if set
  const getHeight = () => {
    if (!isAuthenticated) return '40px';
    if (!isOpen) return '40px';
    if (isMinimized) return '60px';
    if (customHeight !== null) return `${customHeight}px`;
    return '80vh';
  };
  
  const height = getHeight();

  return (
    <div
      style={{
        // CSS containment to isolate styles
        contain: 'style layout paint',
        // Essential properties
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '14px',
        lineHeight: '1.5',
        color: '#fff',
        // Positioning
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: height,
        backgroundColor: '#0F1115',
        borderTop: '1px solid #2D313A',
        borderBottom: 'none',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 99998,
        boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.3)',
        transition: isResizing ? 'none' : 'height 0.3s ease',
        // Ensure no double borders or backgrounds
        borderLeft: 'none',
        borderRight: 'none',
        userSelect: isResizing ? 'none' : 'auto',
        pointerEvents: 'auto',
        // Reset box model to prevent inheritance issues
        margin: 0,
        padding: 0,
        outline: 'none',
      }}
    >
      {/* Invisible Resize Area - Only when authenticated and open */}
      {isAuthenticated && isOpen && (
        <div
          onMouseDown={handleResizeStart}
          style={{
            height: '8px',
            cursor: 'ns-resize',
            backgroundColor: 'transparent',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 10,
          }}
        />
      )}

      {/* Header - Always visible */}
      <div
        style={{
          height: '40px',
          minHeight: '40px',
          borderBottom: isOpen ? '1px solid #2D313A' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          backgroundColor: '#16181D',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isAuthenticated ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ConvexLogo width={20} height={20} />
                <ProjectSelector
                  team={projectInfo?.team || team}
                  project={projectInfo?.project || project}
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onConnect();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#5B46DF',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4d3bc2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#5B46DF'; }}
                >
                  Connect
                </button>
              )}
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {!isAuthenticated ? (
            <>
              <AskAI />
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: '#999',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#999'; }}
              >
                <HelpCircle size={14} /> Support
              </button>
              <div style={{ width: '1px', height: '16px', backgroundColor: '#2D313A' }} />
              <button
                onClick={onHide || onClose}
                style={{
                  padding: '4px',
                  borderRadius: '4px',
                  border: 'none',
                  background: 'transparent',
                  color: '#999',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2D313A';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#999';
                }}
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              <AskAI />
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: '#999',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#999'; }}
              >
                <HelpCircle size={14} /> Support
              </button>
              <div style={{ width: '1px', height: '16px', backgroundColor: '#2D313A' }} />
              <button
                onClick={onClose}
                style={{
                  padding: '4px',
                  borderRadius: '4px',
                  border: 'none',
                  background: 'transparent',
                  color: '#999',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2D313A';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#999';
                }}
              >
                {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
            </>
          )}
        </div>
      </div>

      {isAuthenticated && isOpen && !isMinimized && (
        <>
          {/* Main Area */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {isRunnerShown ? (
              <GlobalFunctionTester
                adminClient={adminClient}
                deploymentUrl={deploymentUrl}
                componentId={null}
              />
            ) : (
              <>
                {/* Sidebar */}
                <div
                  style={{
                    width: '48px',
                    borderRight: '1px solid #2D313A',
                    backgroundColor: '#16181D',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '16px 0',
                    gap: '8px',
                    flexShrink: 0,
                  }}
                >
                  {tabs.map((tab) => (
                    <SidebarItem
                      key={tab.id}
                      icon={tab.icon}
                      label={tab.label}
                      isActive={activeTab === tab.id}
                      onClick={() => handleTabChange(tab.id)}
                    />
                  ))}
                </div>

                {/* Main Content */}
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: '#0F1115' }}>
                  {children}
                </div>
              </>
            )}
          </div>

          {/* Floating 'fn' button */}
          {!isRunnerShown && isAuthenticated && (
            <div
              style={{
                position: 'absolute',
                bottom: '24px',
                right: '24px',
                zIndex: 10,
              }}
            >
              <button
                onClick={() => {
                  if (!isOpen) {
                    // Open the panel first if closed
                    // This would need to be handled by parent
                  }
                  showGlobalRunner(null, 'click');
                }}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#1C1F26',
                  border: '1px solid #2D313A',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontFamily: 'serif',
                  fontStyle: 'italic',
                  fontWeight: 'bold',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  opacity: 0.9,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2D313A';
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1C1F26';
                  e.currentTarget.style.opacity = '0.9';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
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

