import { useState, useRef, useEffect } from 'react';
import { Sparkles, Settings as SettingsIcon, Check, ChevronDown, Sun, Moon, LogOut } from 'lucide-react';
import { useThemeSafe } from '../hooks/useTheme';
import { ConvexLogo } from './ConvexLogo';
import type { Team, Project, Deployment, User } from "@convex-panel/shared";

export interface DesktopHeaderProps {
    user: User | null;
    teams: Team[];
    projects: Project[];
    deployments: Deployment[];
    selectedTeam: Team | null;
    selectedProject: Project | null;
    selectedDeployment: Deployment | null;
    onSelectProject: (team: Team, project: Project) => void;
    onSelectTeam: (team: Team) => void;
    onSelectDeployment: (deployment: Deployment) => void;
    onDisconnect: () => void;
}

export function DesktopHeader({
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
    onDisconnect
}: DesktopHeaderProps) {
    const { theme, toggleTheme } = useThemeSafe();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
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
        return parts.length > 0 ? parts.join(' / ') : 'Select Context';
    };

    // Get user initials for avatar
    const getUserInitials = () => {
        if (user?.name) {
            return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        if (user?.email) {
            return user.email[0].toUpperCase();
        }
        return '?';
    };

    return (
        <>
            <style>{`
                .cp-desktop-header {
                    -webkit-app-region: drag;
                }
                /* Content layer needs pointer-events none to allow drag through */
                .cp-desktop-header-content {
                    pointer-events: none;
                }
                /* Layout sections need pointer-events none */
                .cp-desktop-header-left,
                .cp-desktop-header-center,
                .cp-desktop-header-right {
                    pointer-events: none;
                }
                /* Interactive elements get pointer-events back */
                .cp-desktop-header button,
                .cp-desktop-header input,
                .cp-desktop-header select,
                .cp-desktop-header a,
                .cp-desktop-header .cp-no-drag,
                .cp-desktop-header .cp-interactive {
                    pointer-events: auto !important;
                    -webkit-app-region: no-drag;
                }
            `}</style>
            <div
                className="cp-desktop-header"
                data-tauri-drag-region
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '52px',
                    borderBottom: '1px solid var(--color-panel-border)',
                    color: 'var(--color-panel-text)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    background: 'var(--color-panel-bg)',
                    zIndex: 50,
                }}
            >
                {/* Content Layer - pointer-events none to allow drag through */}
                <div
                    className="cp-desktop-header-content"
                    style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    {/* Left Section: Logo */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '84px', /* Space for macOS traffic lights */
                        height: '100%',
                    }}>
                        <div className="cp-no-drag" style={{
                            display: 'flex',
                            alignItems: 'center',
                            opacity: 0.9,
                        }}>
                            <ConvexLogo width={24} height={24} />
                        </div>
                    </div>

                    {/* Center Section: Context Dropdown */}
                    <div style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                    }}>
                        <div
                            ref={dropdownRef}
                            className="cp-no-drag"
                            style={{
                                position: 'relative',
                            }}
                        >
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: 'var(--color-panel-bg-secondary)',
                                    border: '1px solid var(--color-panel-border)',
                                    color: 'var(--color-panel-text)',
                                    cursor: 'pointer',
                                    padding: '6px 16px',
                                    borderRadius: '6px',
                                    transition: 'all 0.2s',
                                    minWidth: '200px',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <span style={{
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '300px',
                                }}>{getContextString()}</span>
                                <ChevronDown size={12} style={{ opacity: 0.5 }} />
                            </button>

                            {/* Dropdown Menu */}
                            {dropdownOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    marginTop: '8px',
                                    zIndex: 100,
                                    background: 'var(--color-panel-bg)',
                                    border: '1px solid var(--color-panel-border)',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    minWidth: '300px',
                                    maxHeight: '80vh',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}>
                                    {/* Teams Section */}
                                    <div style={{ padding: '8px 0', borderBottom: '1px solid var(--color-panel-border)' }}>
                                        <div style={{
                                            padding: '4px 12px',
                                            fontSize: '11px',
                                            color: 'var(--color-panel-text-muted)',
                                            textTransform: 'uppercase',
                                            fontWeight: 600,
                                            letterSpacing: '0.5px',
                                        }}>Teams</div>
                                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            {teams.map(team => (
                                                <button
                                                    key={team.id}
                                                    onClick={() => onSelectTeam(team)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        width: '100%',
                                                        padding: '8px 12px',
                                                        color: selectedTeam?.id === team.id ? 'var(--color-panel-accent)' : 'var(--color-panel-text)',
                                                        background: selectedTeam?.id === team.id ? 'var(--color-panel-bg-secondary)' : 'transparent',
                                                        border: 'none',
                                                        textAlign: 'left',
                                                        cursor: 'pointer',
                                                        gap: '8px',
                                                        fontSize: '13px',
                                                    }}
                                                >
                                                    <div style={{
                                                        width: '18px',
                                                        height: '18px',
                                                        fontSize: '9px',
                                                        background: 'var(--color-panel-accent)',
                                                        color: 'white',
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}>
                                                        {team.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span style={{ flex: 1 }}>{team.name}</span>
                                                    {selectedTeam?.id === team.id && <Check size={14} />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Projects Section */}
                                    {selectedTeam && (
                                        <div style={{ padding: '8px 0', borderBottom: '1px solid var(--color-panel-border)' }}>
                                            <div style={{
                                                padding: '4px 12px',
                                                fontSize: '11px',
                                                color: 'var(--color-panel-text-muted)',
                                                textTransform: 'uppercase',
                                                fontWeight: 600,
                                                letterSpacing: '0.5px',
                                            }}>Projects</div>
                                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                {projects.length > 0 ? (
                                                    projects.map(project => (
                                                        <button
                                                            key={project.id}
                                                            onClick={() => onSelectProject(selectedTeam, project)}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                width: '100%',
                                                                padding: '8px 12px',
                                                                color: selectedProject?.id === project.id ? 'var(--color-panel-accent)' : 'var(--color-panel-text)',
                                                                background: selectedProject?.id === project.id ? 'var(--color-panel-bg-secondary)' : 'transparent',
                                                                border: 'none',
                                                                textAlign: 'left',
                                                                cursor: 'pointer',
                                                                gap: '8px',
                                                                fontSize: '13px',
                                                            }}
                                                        >
                                                            <span style={{ flex: 1 }}>{project.name}</span>
                                                            {selectedProject?.id === project.id && <Check size={14} />}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div style={{
                                                        padding: '8px 12px',
                                                        color: 'var(--color-panel-text-muted)',
                                                        fontSize: '13px',
                                                        fontStyle: 'italic',
                                                    }}>No projects found</div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Deployments Section */}
                                    {selectedProject && (
                                        <div style={{ padding: '8px 0' }}>
                                            <div style={{
                                                padding: '4px 12px',
                                                fontSize: '11px',
                                                color: 'var(--color-panel-text-muted)',
                                                textTransform: 'uppercase',
                                                fontWeight: 600,
                                                letterSpacing: '0.5px',
                                            }}>Deployments</div>
                                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                {deployments.length > 0 ? (
                                                    deployments.map(deployment => (
                                                        <button
                                                            key={deployment.id}
                                                            onClick={() => {
                                                                onSelectDeployment(deployment);
                                                                setDropdownOpen(false);
                                                            }}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                width: '100%',
                                                                padding: '8px 12px',
                                                                color: selectedDeployment?.id === deployment.id ? 'var(--color-panel-accent)' : 'var(--color-panel-text)',
                                                                background: selectedDeployment?.id === deployment.id ? 'var(--color-panel-bg-secondary)' : 'transparent',
                                                                border: 'none',
                                                                textAlign: 'left',
                                                                cursor: 'pointer',
                                                                gap: '8px',
                                                                fontSize: '13px',
                                                            }}
                                                        >
                                                            <span style={{ flex: 1 }}>{deployment.name}</span>
                                                            <span style={{
                                                                fontSize: '10px',
                                                                padding: '2px 6px',
                                                                borderRadius: '4px',
                                                                background: 'var(--color-panel-bg-tertiary)',
                                                                color: 'var(--color-panel-text-muted)',
                                                            }}>{deployment.deploymentType}</span>
                                                            {selectedDeployment?.id === deployment.id && <Check size={14} />}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div style={{
                                                        padding: '8px 12px',
                                                        color: 'var(--color-panel-text-muted)',
                                                        fontSize: '13px',
                                                        fontStyle: 'italic',
                                                    }}>No deployments found</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Section: Tools & User */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        paddingRight: '12px',
                        height: '100%',
                        gap: '6px',
                    }}>
                        <button
                            className="cp-no-drag"
                            title="AI Assistant"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--color-panel-text-muted)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                            }}
                        >
                            <Sparkles size={16} />
                        </button>

                        <button
                            className="cp-no-drag"
                            title="Settings"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--color-panel-text-muted)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                            }}
                        >
                            <SettingsIcon size={16} />
                        </button>

                        <button
                            className="cp-no-drag"
                            onClick={toggleTheme}
                            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--color-panel-text-muted)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                            }}
                        >
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </button>

                        <div style={{
                            width: '1px',
                            height: '18px',
                            background: 'var(--color-panel-border)',
                            margin: '0 4px',
                            opacity: 0.6,
                        }} />

                        {/* User Menu */}
                        <div
                            ref={userMenuRef}
                            className="cp-no-drag"
                            style={{
                                position: 'relative',
                            }}
                        >
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '6px',
                                }}
                            >
                                {(user?.avatarUrl || user?.profilePictureUrl) ? (
                                    <img
                                        src={user.avatarUrl || user.profilePictureUrl}
                                        alt={user.name || 'User'}
                                        style={{
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '50%',
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        background: 'var(--color-panel-accent)',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                    }}>
                                        {getUserInitials()}
                                    </div>
                                )}
                            </button>

                            {userMenuOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: '8px',
                                    zIndex: 100,
                                    background: 'var(--color-panel-bg)',
                                    border: '1px solid var(--color-panel-border)',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    minWidth: '200px',
                                }}>
                                    {/* User Info */}
                                    <div style={{
                                        padding: '12px',
                                        borderBottom: '1px solid var(--color-panel-border)'
                                    }}>
                                        <div style={{
                                            fontWeight: 600,
                                            fontSize: '14px',
                                            color: 'var(--color-panel-text)',
                                            marginBottom: '2px',
                                        }}>
                                            {user?.name || 'User'}
                                        </div>
                                        <div style={{
                                            fontSize: '12px',
                                            color: 'var(--color-panel-text-muted)',
                                        }}>
                                            {user?.email || ''}
                                        </div>
                                    </div>

                                    {/* Logout */}
                                    <button
                                        onClick={() => {
                                            setUserMenuOpen(false);
                                            onDisconnect();
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            width: '100%',
                                            padding: '10px 12px',
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--color-panel-error)',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            textAlign: 'left',
                                        }}
                                    >
                                        <LogOut size={14} />
                                        <span>Sign Out</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
