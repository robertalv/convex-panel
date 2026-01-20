import React, { useState } from "react";
import {
  ExternalLink,
  Copy,
  Check,
  Github,
  Package,
  Download,
  X,
  User,
} from "lucide-react";
import { IconButton } from "../../../components/shared";
import { useSheetActionsSafe } from "../../../contexts/sheet-context";
import type { MarketplaceComponent } from "../../components/hooks/useMarketplaceComponents";
import {
  InstallModal,
  type PackageManager,
  type InstallStep,
} from "../../components/components/install-modal";

export interface MarketplaceDetailSheetProps {
  component: MarketplaceComponent;
  /** Project path for installation (desktop only) */
  projectPath?: string | null;
  /** Detected package manager from lock files */
  detectedPackageManager?: PackageManager | null;
  /** Function to run the installation - provided by desktop app */
  onInstall?: (options: {
    packageName: string;
    componentId: string;
    projectPath: string;
    packageManager: PackageManager;
    autoConfigureConfig: boolean;
    onStepUpdate: (steps: InstallStep[]) => void;
  }) => Promise<{ success: boolean; error?: string }>;
}

// Category colors for the gradient header
const CATEGORY_GRADIENTS: Record<string, { from: string; to: string }> = {
  ai: { from: "#8B5CF6", to: "#6366F1" },
  backend: { from: "#06B6D4", to: "#3B82F6" },
  database: { from: "#10B981", to: "#059669" },
  "durable-functions": { from: "#F59E0B", to: "#EF4444" },
  integrations: { from: "#EC4899", to: "#8B5CF6" },
  payments: { from: "#22C55E", to: "#14B8A6" },
};

export const MarketplaceDetailSheet: React.FC<MarketplaceDetailSheetProps> = ({
  component,
  projectPath,
  detectedPackageManager,
  onInstall,
}) => {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const { closeSheet } = useSheetActionsSafe();

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCommand(text);
      setTimeout(() => setCopiedCommand(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const installCommand = `npm install ${component.npmPackage}`;
  const packageUrl = `https://www.npmjs.com/package/${component.npmPackage}`;
  const gradient = CATEGORY_GRADIENTS[component.category] || {
    from: "#6366F1",
    to: "#8B5CF6",
  };

  const formatDownloads = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatCategoryLabel = (category: string): string => {
    return category
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Check if we're in the desktop environment
  const isDesktop = Boolean(onInstall && projectPath);

  return (
    <>
      <div
        style={{
          padding: "0",
          display: "flex",
          flexDirection: "column",
          color: "var(--color-panel-text)",
          height: "100%",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0px 12px",
            borderBottom: "1px solid var(--color-panel-border)",
            backgroundColor: "var(--color-panel-bg-secondary)",
            height: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flex: 1,
              overflow: "hidden",
            }}
          >
            <h1
              style={{
                fontSize: "14px",
                fontWeight: 600,
                margin: 0,
                color: "var(--color-panel-text)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {component.title}
            </h1>
          </div>

          {/* Close Button */}
          <IconButton icon={X} onClick={closeSheet} aria-label="Close sheet" />
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Gradient Header Section */}
          <div
            style={{
              height: "160px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
              marginBottom: "24px",
              position: "relative",
            }}
          >
            {component.image?.src ? (
              <img
                src={component.image.src}
                alt={component.title}
                style={{
                  maxWidth: "80%",
                  maxHeight: "120px",
                  objectFit: "contain",
                }}
              />
            ) : (
              <Package
                size={64}
                style={{
                  color: "rgba(255, 255, 255, 0.9)",
                }}
              />
            )}
          </div>

          {/* Content Section */}
          <div
            style={{
              padding: "0 24px 24px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {/* Title and Meta */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <h2
                  style={{
                    fontSize: "22px",
                    fontWeight: 600,
                    margin: 0,
                    color: "var(--color-panel-text)",
                  }}
                >
                  {component.title}
                </h2>

                {/* Install Button - Only show in desktop with project path */}
                {isDesktop && (
                  <button
                    onClick={() => setShowInstallModal(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 16px",
                      fontSize: "13px",
                      fontWeight: 500,
                      backgroundColor: "var(--color-panel-accent)",
                      border: "none",
                      borderRadius: "8px",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    <Download size={14} />
                    Install
                  </button>
                )}
              </div>

              {/* Category Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--color-panel-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {formatCategoryLabel(component.category)}
                </span>
                {component.weeklyDownloads > 0 && (
                  <>
                    <span
                      style={{
                        color: "var(--color-panel-border)",
                      }}
                    >
                      |
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--color-panel-text-muted)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Download size={12} />
                      {formatDownloads(component.weeklyDownloads)}/week
                    </span>
                  </>
                )}
              </div>

              {/* Author */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {component.author.avatar ? (
                  <img
                    src={component.author.avatar}
                    alt={component.author.username}
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                    }}
                  />
                ) : (
                  <User
                    size={16}
                    style={{ color: "var(--color-panel-text-muted)" }}
                  />
                )}
                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--color-panel-text-secondary)",
                  }}
                >
                  {component.author.username}
                </span>
              </div>
            </div>

            {/* Quick Links */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <a
                href={component.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  color: "var(--color-panel-text-secondary)",
                  textDecoration: "none",
                  transition: "color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--color-panel-text)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color =
                    "var(--color-panel-text-secondary)";
                }}
              >
                <Github size={14} />
                View repo
              </a>
              <a
                href={packageUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  color: "var(--color-panel-text-secondary)",
                  textDecoration: "none",
                  transition: "color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--color-panel-text)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color =
                    "var(--color-panel-text-secondary)";
                }}
              >
                <Package size={14} />
                View package
              </a>
            </div>

            {/* Installation Command */}
            <div>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--color-panel-text-muted)",
                  marginBottom: "8px",
                  display: "block",
                }}
              >
                Install
              </label>
              <div
                style={{
                  backgroundColor: "var(--color-panel-bg-tertiary)",
                  borderRadius: "8px",
                  padding: "12px",
                  border: "1px solid var(--color-panel-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <code
                  style={{
                    fontSize: "13px",
                    fontFamily: "monospace",
                    color: "var(--color-panel-text)",
                    flex: 1,
                    wordBreak: "break-all",
                  }}
                >
                  {installCommand}
                </code>
                <button
                  onClick={() => handleCopy(installCommand)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color:
                      copiedCommand === installCommand
                        ? "var(--color-panel-success)"
                        : "var(--color-panel-text-muted)",
                    transition: "color 0.15s ease",
                  }}
                  title="Copy command"
                >
                  {copiedCommand === installCommand ? (
                    <Check size={16} />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--color-panel-text-muted)",
                  marginBottom: "8px",
                  display: "block",
                }}
              >
                About
              </label>
              <p
                style={{
                  fontSize: "14px",
                  lineHeight: "1.6",
                  color: "var(--color-panel-text-secondary)",
                  margin: 0,
                }}
              >
                {component.description}
              </p>
            </div>

            {/* View on Convex.dev */}
            <div>
              <a
                href={`https://www.convex.dev/components/${component.id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "14px",
                  color: "var(--color-panel-accent)",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = "underline";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = "none";
                }}
              >
                View full details on convex.dev
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Install Modal */}
      <InstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        component={component}
        projectPath={projectPath ?? null}
        detectedPackageManager={detectedPackageManager}
        onInstall={onInstall}
      />
    </>
  );
};
