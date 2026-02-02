import { useState, useEffect, useMemo } from "react";
import { PauseDeployment, AIAnalysisSettings } from "convex-panel";
import { useDeployment } from "../../contexts/deployment-context";
import { useTheme } from "../../contexts/theme-context";
import { AppearanceSettings } from "./components/appearance-settings";
import { ProfileSettings } from "./components/profile-settings";
import { UrlDeployKey } from "./components/url-deploy-key";
import { DeployKeyUrlReadOnly } from "./components/deploy-key-url-readonly";
import { DesktopIntegrations } from "./components/desktop-integrations";
import { NotificationSettings } from "./components/notification-settings";
import { LogStorageSettings } from "./components/log-storage-settings";
import { AuthenticationSettings } from "./components/authentication-settings";
import { EnvironmentVariables } from "./components/environment-variables";
import { ComponentsSettings } from "./components/components-settings";
import { BackupRestore } from "./components/backup-restore";
import { SelfHostedTest } from "./components/self-hosted-test";

// Combined section types from panel and desktop
export type SettingsSection =
  // Desktop-specific sections
  | "appearance"
  | "profile"
  | "notifications"
  | "integrations"
  | "log-storage"
  // Panel sections (deployment-related)
  | "environment-variables"
  | "url-deploy-key"
  | "authentication"
  | "components"
  | "backup-restore"
  | "pause-deployment"
  | "ai-analysis"
  // Self-hosted deployment testing
  | "self-hosted-test";

interface SidebarSection {
  id: string;
  label: string;
  items: Array<{ id: SettingsSection; label: string; requiresOAuth?: boolean }>;
  /** If true, this entire section requires OAuth (not available in deploy key mode) */
  requiresOAuth?: boolean;
}

const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    id: "app",
    label: "App",
    requiresOAuth: true, // Not available in deploy key mode
    items: [
      { id: "profile", label: "Profile" },
      { id: "appearance", label: "Appearance" },
      { id: "notifications", label: "Notifications" },
    ],
  },
  {
    id: "workspace",
    label: "Workspace",
    requiresOAuth: true, // Not available in deploy key mode
    items: [
      { id: "integrations", label: "Integrations" },
      { id: "log-storage", label: "Log Storage" },
    ],
  },
  {
    id: "deployment",
    label: "Deployment",
    items: [
      { id: "url-deploy-key", label: "URL & Deploy Key" },
      {
        id: "environment-variables",
        label: "Environment Variables",
        requiresOAuth: true,
      },
      { id: "authentication", label: "Authentication", requiresOAuth: true },
      { id: "components", label: "Components", requiresOAuth: true },
      { id: "backup-restore", label: "Backup & Restore", requiresOAuth: true },
      {
        id: "pause-deployment",
        label: "Pause Deployment",
        requiresOAuth: true,
      },
      { id: "ai-analysis", label: "AI Analysis", requiresOAuth: true },
      { id: "self-hosted-test", label: "Self-Hosted Test", requiresOAuth: true },
    ],
  },
];

/**
 * Get filtered sidebar sections based on auth mode
 */
function getFilteredSections(isDeployKeyMode: boolean): SidebarSection[] {
  if (!isDeployKeyMode) {
    return SIDEBAR_SECTIONS;
  }

  return SIDEBAR_SECTIONS.filter((section) => !section.requiresOAuth)
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.requiresOAuth),
    }))
    .filter((section) => section.items.length > 0);
}

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
  teamId?: number;
  teamAccessToken?: string | null;
  /** Whether the app is in deploy key mode (restricted settings) */
  isDeployKeyMode?: boolean;
}

export function SettingsView({
  user,
  teamId,
  teamAccessToken,
  isDeployKeyMode = false,
}: SettingsViewProps) {
  const { theme, setTheme } = useTheme();
  const deployment = useDeployment();

  // Get filtered sections based on auth mode
  const filteredSections = useMemo(
    () => getFilteredSections(isDeployKeyMode),
    [isDeployKeyMode],
  );

  // Get default section (first available section's first item)
  const defaultSection = useMemo(() => {
    if (filteredSections.length > 0 && filteredSections[0].items.length > 0) {
      return filteredSections[0].items[0].id;
    }
    return "url-deploy-key" as SettingsSection;
  }, [filteredSections]);

  const [selectedSection, setSelectedSection] = useState<SettingsSection>(
    () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          // Validate that the saved section is available in current mode
          const isAvailable = filteredSections.some((section) =>
            section.items.some((item) => item.id === saved),
          );
          if (isAvailable) {
            return saved as SettingsSection;
          }
        }
      }
      return defaultSection;
    },
  );

  // Reset to default section if current selection is no longer available
  useEffect(() => {
    const isAvailable = filteredSections.some((section) =>
      section.items.some((item) => item.id === selectedSection),
    );
    if (!isAvailable) {
      setSelectedSection(defaultSection);
    }
  }, [filteredSections, selectedSection, defaultSection]);

  // Save selected section to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, selectedSection);
  }, [selectedSection]);

  // Listen for section changes from command palette (custom event approach)
  useEffect(() => {
    const handleSectionChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ section: string }>;
      const newSection = customEvent.detail.section;

      // Validate that the section is available in current mode
      const isAvailable = filteredSections.some((section) =>
        section.items.some((item) => item.id === newSection),
      );

      if (isAvailable && newSection !== selectedSection) {
        setSelectedSection(newSection as SettingsSection);
      }
    };

    window.addEventListener("settings-section-change", handleSectionChange);

    return () => {
      window.removeEventListener(
        "settings-section-change",
        handleSectionChange,
      );
    };
  }, [selectedSection, filteredSections]);

  const renderSection = () => {
    switch (selectedSection) {
      // Desktop-specific sections (not available in deploy key mode)
      case "appearance":
        if (isDeployKeyMode) return null;
        return <AppearanceSettings theme={theme} onThemeChange={setTheme} />;
      case "profile":
        if (isDeployKeyMode) return null;
        return <ProfileSettings user={user} />;
      case "notifications":
        if (isDeployKeyMode) return null;
        return <NotificationSettings />;
      case "integrations":
        if (isDeployKeyMode) return null;
        return <DesktopIntegrations />;
      case "log-storage":
        if (isDeployKeyMode) return null;
        return <LogStorageSettings />;

      case "environment-variables":
        if (isDeployKeyMode) return null;
        return (
          <EnvironmentVariables
            adminClient={deployment.adminClient}
            accessToken={deployment.authToken ?? undefined}
            deploymentUrl={deployment.deploymentUrl ?? undefined}
          />
        );
      case "url-deploy-key":
        // In deploy key mode, show read-only version
        if (isDeployKeyMode) {
          return <DeployKeyUrlReadOnly />;
        }
        return <UrlDeployKey />;
      case "authentication":
        if (isDeployKeyMode) return null;
        return <AuthenticationSettings />;
      case "components":
        if (isDeployKeyMode) return null;
        return (
          <ComponentsSettings
            adminClient={deployment.adminClient}
            accessToken={deployment.authToken ?? undefined}
            deploymentUrl={deployment.deploymentUrl ?? undefined}
          />
        );
      case "backup-restore":
        if (isDeployKeyMode) return null;
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
        if (isDeployKeyMode) return null;
        return (
          <PauseDeployment
            adminClient={deployment.adminClient}
            accessToken={deployment.authToken ?? undefined}
            deploymentUrl={deployment.deploymentUrl ?? undefined}
          />
        );
      case "ai-analysis":
        if (isDeployKeyMode) return null;
        return (
          <AIAnalysisSettings
            adminClient={deployment.adminClient}
            accessToken={deployment.authToken ?? undefined}
            deploymentUrl={deployment.deploymentUrl ?? undefined}
          />
        );
      case "self-hosted-test":
        if (isDeployKeyMode) return null;
        return <SelfHostedTest />;
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
        {/* Deploy Key Mode Banner */}
        {isDeployKeyMode && (
          <div
            style={{
              padding: "12px",
              borderBottom: "1px solid var(--color-border-base)",
              backgroundColor: "var(--color-surface-overlay)",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--color-text-muted)",
                marginBottom: "4px",
              }}
            >
              Deploy Key Mode
            </div>
            <div
              style={{
                fontSize: "10px",
                color: "var(--color-text-subtle)",
                lineHeight: 1.4,
              }}
            >
              Limited settings available. Sign in with Convex for full access.
            </div>
          </div>
        )}

        {/* Sections */}
        <div
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent"
          style={{ scrollbarColor: "var(--color-border-strong) transparent" }}
        >
          {filteredSections.map((section, index) => (
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
                  ...(index > 0 && {
                    borderTop: "1px solid var(--color-border-base)",
                  }),
                  borderBottom: "1px solid var(--color-border-base)",
                  backgroundColor: "var(--color-surface-overlay)",
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
