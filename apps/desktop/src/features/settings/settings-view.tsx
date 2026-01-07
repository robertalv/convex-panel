import { useState, useEffect } from "react";
import {
  EnvironmentVariables,
  UrlDeployKey,
  Authentication,
  SettingsComponents,
  BackupRestore,
  PauseDeployment,
  AIAnalysisSettings,
} from "convex-panel";
import { useDeployment } from "../../contexts/DeploymentContext";
import { useTheme } from "../../contexts/ThemeContext";
import { AppearanceSettings } from "./components/appearance-settings";
import { ProfileSettings } from "./components/profile-settings";
import { TerminalSettings } from "./components/terminal-settings";
import { DeployKeySettings } from "./components/deploy-key-settings";
import { DesktopIntegrations } from "./components/desktop-integrations";
import { NetworkSettings } from "./components/network-settings";

// Combined section types from panel and desktop
export type SettingsSection =
  // Desktop-specific sections
  | "appearance"
  | "profile"
  | "integrations"
  | "terminal"
  | "deploy-key-sync"
  | "network"
  // Panel sections (deployment-related)
  | "environment-variables"
  | "url-deploy-key"
  | "authentication"
  | "components"
  | "backup-restore"
  | "pause-deployment"
  | "ai-analysis";

interface SidebarSection {
  id: string;
  label: string;
  items: Array<{ id: SettingsSection; label: string }>;
}

const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    id: "app",
    label: "App",
    items: [
      { id: "appearance", label: "Appearance" },
      { id: "profile", label: "Profile" },
    ],
  },
  {
    id: "workspace",
    label: "Workspace",
    items: [
      { id: "integrations", label: "Integrations" },
      { id: "terminal", label: "Terminal" },
      { id: "deploy-key-sync", label: "Deploy Key Sync" },
      { id: "network", label: "Network" },
    ],
  },
  {
    id: "deployment",
    label: "Deployment",
    items: [
      { id: "url-deploy-key", label: "URL & Deploy Key" },
      { id: "environment-variables", label: "Environment Variables" },
      { id: "authentication", label: "Authentication" },
      { id: "components", label: "Components" },
      { id: "backup-restore", label: "Backup & Restore" },
      { id: "pause-deployment", label: "Pause Deployment" },
      { id: "ai-analysis", label: "AI Analysis" },
    ],
  },
];

/**
 * Tree item component - matches SchemaTreeSidebar style
 */
interface TreeItemProps {
  label: string;
  isSelected?: boolean;
  onClick?: () => void;
  rightContent?: React.ReactNode;
  className?: string;
}

function TreeItem({
  label,
  isSelected,
  onClick,
  rightContent,
  className = "",
}: TreeItemProps) {
  return (
    <div
      className={`flex items-center h-7 cursor-pointer text-xs transition-colors ${className}`}
      style={{
        paddingLeft: "12px",
        backgroundColor: isSelected
          ? "var(--color-surface-raised)"
          : "transparent",
        color: isSelected
          ? "var(--color-text-base)"
          : "var(--color-text-muted)",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = "var(--color-surface-raised)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = "transparent";
        }
      }}
      onClick={(e) => {
        onClick?.();
        e.stopPropagation();
      }}
    >
      <span className="flex-1 truncate">{label}</span>
      {rightContent && (
        <span className="mr-2" style={{ color: "var(--color-text-muted)" }}>
          {rightContent}
        </span>
      )}
    </div>
  );
}

const STORAGE_KEY = "convex-panel-settings-section";

export interface SettingsViewProps {
  user: {
    name: string;
    email: string;
    profilePictureUrl?: string | null;
  } | null;
  onLogout: () => void;
  /** Team ID for backup/restore functionality */
  teamId?: number;
  /** Team access token for backup API calls */
  teamAccessToken?: string | null;
}

export function SettingsView({
  user,
  onLogout,
  teamId,
  teamAccessToken,
}: SettingsViewProps) {
  const { theme, setTheme } = useTheme();
  const deployment = useDeployment();

  const [selectedSection, setSelectedSection] = useState<SettingsSection>(
    () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          return saved as SettingsSection;
        }
      }
      return "appearance";
    },
  );

  // Save selected section to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, selectedSection);
  }, [selectedSection]);

  const renderSection = () => {
    switch (selectedSection) {
      // Desktop-specific sections
      case "appearance":
        return <AppearanceSettings theme={theme} onThemeChange={setTheme} />;
      case "profile":
        return <ProfileSettings user={user} onLogout={onLogout} />;
      case "integrations":
        return <DesktopIntegrations />;
      case "terminal":
        return <TerminalSettings />;
      case "deploy-key-sync":
        return <DeployKeySettings />;
      case "network":
        return <NetworkSettings />;

      // Panel sections
      case "environment-variables":
        return (
          <EnvironmentVariables
            adminClient={deployment.adminClient}
            accessToken={deployment.authToken ?? undefined}
            deploymentUrl={deployment.deploymentUrl ?? undefined}
          />
        );
      case "url-deploy-key":
        return (
          <UrlDeployKey
            adminClient={deployment.adminClient}
            accessToken={deployment.authToken ?? undefined}
            deploymentUrl={deployment.deploymentUrl ?? undefined}
          />
        );
      case "authentication":
        return <Authentication adminClient={deployment.adminClient} />;
      case "components":
        return (
          <SettingsComponents
            adminClient={deployment.adminClient}
            accessToken={deployment.authToken ?? undefined}
            deploymentUrl={deployment.deploymentUrl ?? undefined}
          />
        );
      case "backup-restore":
        return (
          <BackupRestore
            adminClient={deployment.adminClient}
            accessToken={deployment.authToken ?? undefined}
            teamAccessToken={teamAccessToken ?? undefined}
            deploymentUrl={deployment.deploymentUrl ?? undefined}
            teamId={teamId}
          />
        );
      case "pause-deployment":
        return (
          <PauseDeployment
            adminClient={deployment.adminClient}
            accessToken={deployment.authToken ?? undefined}
            deploymentUrl={deployment.deploymentUrl ?? undefined}
          />
        );
      case "ai-analysis":
        return (
          <AIAnalysisSettings
            adminClient={deployment.adminClient}
            accessToken={deployment.authToken ?? undefined}
            deploymentUrl={deployment.deploymentUrl ?? undefined}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        backgroundColor: "var(--color-surface-base)",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: "240px",
          borderRight: "1px solid var(--color-border-base)",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--color-surface-base)",
        }}
      >
        {/* Sections */}
        <div
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent"
          style={{ scrollbarColor: "var(--color-border-strong) transparent" }}
        >
          {SIDEBAR_SECTIONS.map((section) => (
            <div key={section.id}>
              {/* Section Header */}
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "var(--color-text-subtle)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  padding: "8px 12px",
                  borderBottom: "1px solid var(--color-border-base)",
                }}
              >
                {section.label}
              </div>
              {/* Section Items */}
              {section.items.map((item) => (
                <TreeItem
                  key={item.id}
                  label={item.label}
                  isSelected={selectedSection === item.id}
                  onClick={() => setSelectedSection(item.id)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {renderSection()}
      </div>
    </div>
  );
}
