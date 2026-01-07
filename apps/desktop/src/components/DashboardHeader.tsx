import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Settings as SettingsIcon,
  Check,
  ChevronDown,
} from "lucide-react";
import { Project, Team, Deployment } from "@/types/desktop";
import { ConvexLogo } from "@/components/ui/ConvexLogo";
import { UserMenu } from "@/components/layout/UserMenu";

export interface DashboardHeaderProps {
  user: { name?: string; email?: string; profilePictureUrl?: string } | null;
  teams: Team[];
  projects: Project[];
  deployments: Deployment[];
  selectedTeam: Team | null;
  selectedProject: Project | null;
  selectedDeployment: Deployment | null;
  onSelectProject: (team: Team, project: Project) => void;
  onSelectTeam: (team: Team) => void;
  onSelectDeployment: (deployment: Deployment) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  onThemeToggle: () => void;
  onDisconnect: () => void;
}

export function DashboardHeader({
  user,
  projects,
  teams,
  deployments,
  selectedProject,
  selectedTeam,
  selectedDeployment,
  onSelectProject,
  onSelectTeam,
  onSelectDeployment,
  isDarkMode,
  onThemeToggle,
  onDisconnect,
}: DashboardHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper to get formatted context string
  const getContextString = () => {
    const parts = [];
    if (selectedTeam) parts.push(selectedTeam.name);
    if (selectedProject) parts.push(selectedProject.name);
    if (selectedDeployment) parts.push(selectedDeployment.name);
    return parts.length > 0 ? parts.join(" / ") : "Select Context";
  };

  return (
    <div className="dashboard-header-container" data-tauri-drag-region>
      {/* Header Content - Draggable by default, interactive elements marked as no-drag */}
      <div className="header-content-layer">
        {/* Left Section: Logo */}
        <div className="header-left">
          <div className="logo-section">
            <ConvexLogo className="header-logo" />
          </div>
        </div>

        {/* Center Section: Context Dropdown */}
        <div className="header-center">
          <div className="context-selector-container" ref={dropdownRef}>
            <button
              className={`context-select-btn ${dropdownOpen ? "active" : ""}`}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <span className="context-text">{getContextString()}</span>
              <ChevronDown size={12} className="chevron" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="dropdown-menu context-menu">
                {/* Teams Section */}
                <div className="dropdown-section">
                  <div className="section-label">Teams</div>
                  <div className="menu-list">
                    {teams.map((team) => (
                      <button
                        key={team.id}
                        className={`menu-item ${selectedTeam?.id === team.id ? "selected" : ""}`}
                        onClick={() => {
                          onSelectTeam(team);
                        }}
                      >
                        <div className="team-avatar small">
                          {team.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="item-name">{team.name}</span>
                        {selectedTeam?.id === team.id && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Projects Section */}
                {selectedTeam && (
                  <div className="dropdown-section">
                    <div className="section-label">Projects</div>
                    <div className="menu-list">
                      {projects.length > 0 ? (
                        projects.map((project) => (
                          <button
                            key={project.id}
                            className={`menu-item ${selectedProject?.id === project.id ? "selected" : ""}`}
                            onClick={() => {
                              onSelectProject(selectedTeam, project);
                            }}
                          >
                            <span className="item-name">{project.name}</span>
                            {selectedProject?.id === project.id && (
                              <Check size={14} />
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="empty-item">No projects found</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Deployments Section */}
                {selectedProject && (
                  <div className="dropdown-section">
                    <div className="section-label">Deployments</div>
                    <div className="menu-list">
                      {deployments.length > 0 ? (
                        deployments.map((deployment) => (
                          <button
                            key={deployment.id}
                            className={`menu-item ${selectedDeployment?.id === deployment.id ? "selected" : ""}`}
                            onClick={() => {
                              onSelectDeployment(deployment);
                              setDropdownOpen(false); // Close on final selection
                            }}
                          >
                            <span className="item-name">{deployment.name}</span>
                            <span className="deployment-type-badge">
                              {deployment.deploymentType}
                            </span>
                            {selectedDeployment?.id === deployment.id && (
                              <Check size={14} />
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="empty-item">No deployments found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Tools & User */}
        <div className="header-right">
          <button className="tool-btn" title="AI Assistant">
            <Sparkles size={16} />
          </button>

          <button className="tool-btn" title="Settings">
            <SettingsIcon size={16} />
          </button>

          <div className="divider-vertical"></div>

          <UserMenu
            user={user}
            onLogout={onDisconnect}
            onThemeToggle={onThemeToggle}
            theme={isDarkMode ? "dark" : "light"}
          />
        </div>
      </div>

      <style>{`
                .dashboard-header-container {
                    position: relative;
                    width: 100%;
                    height: 52px;
                    border-bottom: 1px solid var(--border);
                    color: var(--text);
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    background: var(--bg);
                    z-index: 50;
                    -webkit-app-region: drag;
                }

                /* Content Container - pointer-events none to allow drag through */
                .header-content-layer {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    pointer-events: none;
                }

                /* Layout Sections - also need pointer-events none */
                .header-left {
                    display: flex;
                    align-items: center;
                    padding-left: 84px; /* Space for traffic lights */
                    height: 100%;
                    pointer-events: none;
                }

                .header-center {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    pointer-events: none;
                }

                .header-right {
                    display: flex;
                    align-items: center;
                    padding-right: 12px;
                    height: 100%;
                    gap: 6px;
                    pointer-events: none;
                }

                /* Interactive Elements - RE-ENABLE POINTER EVENTS */
                button, .logo-section, .dropdown-menu, input, .user-menu-container, .context-selector-container {
                    pointer-events: auto !important;
                    -webkit-app-region: no-drag;
                }
                
                /* Ensure all clickable items have pointer events */
                .tool-btn, .context-select-btn, .menu-item, .copy-code-btn {
                    pointer-events: auto !important;
                    -webkit-app-region: no-drag;
                }

                /* Logo */
                .logo-section {
                    display: flex;
                    align-items: center;
                    opacity: 0.9;
                }
                .header-logo { width: 24px; height: 24px; }

                /* Context Selector */
                .context-select-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border);
                    color: var(--text);
                    cursor: pointer;
                    padding: 6px 16px;
                    border-radius: 6px;
                    transition: all 0.2s;
                    min-width: 200px;
                    justify-content: space-between;
                }
                .context-select-btn:hover, .context-select-btn.active {
                    background: var(--bg-tertiary);
                    border-color: var(--border-hover);
                }
                .context-text {
                    font-size: 13px;
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 300px;
                }
                .chevron { opacity: 0.5; }

                /* Tools */
                .tool-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    background: transparent;
                    border: none;
                    color: var(--text-muted);
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .tool-btn:hover {
                    color: var(--text);
                    background: var(--bg-secondary);
                }

                /* Dropdowns */
                .dropdown-menu {
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    margin-top: 8px;
                    z-index: 100;
                    background: var(--bg);
                    border: 1px solid var(--border);
                    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
                    border-radius: 8px;
                    overflow: hidden;
                    min-width: 300px;
                    max-height: 80vh;
                    display: flex;
                    flex-direction: column;
                }
                
                .dropdown-section {
                    padding: 8px 0;
                    border-bottom: 1px solid var(--border);
                }
                .dropdown-section:last-child { border-bottom: none; }

                .section-label {
                    padding: 4px 12px;
                    font-size: 11px;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }

                .menu-list {
                    max-height: 200px;
                    overflow-y: auto;
                }

                .menu-item {
                    display: flex;
                    align-items: center;
                    width: 100%;
                    padding: 8px 12px;
                    color: var(--text);
                    background: transparent;
                    border: none;
                    text-align: left;
                    cursor: pointer;
                    gap: 8px;
                    font-size: 13px;
                    transition: background 0.15s;
                }
                .menu-item:hover { background: var(--bg-secondary); }
                .menu-item.selected { background: var(--bg-secondary); color: var(--accent); }
                
                .empty-item {
                    padding: 8px 12px;
                    color: var(--text-muted);
                    font-size: 13px;
                    font-style: italic;
                }

                .team-avatar.small { 
                    width: 18px; 
                    height: 18px; 
                    font-size: 9px; 
                    background: var(--accent); 
                    color: white; 
                    border-radius: 4px; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                }

                .deployment-type-badge {
                    font-size: 10px;
                    padding: 2px 6px;
                    border-radius: 4px;
                    background: var(--bg-tertiary);
                    color: var(--text-muted);
                    margin-left: auto;
                    margin-right: 4px;
                }

                .divider-vertical {
                    width: 1px;
                    height: 18px;
                    background: var(--border);
                    margin: 0 4px;
                    opacity: 0.6;
                }
            `}</style>
    </div>
  );
}
