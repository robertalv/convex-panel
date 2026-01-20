import React, { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Download,
  Check,
  AlertCircle,
  Loader2,
  ChevronDown,
  Copy,
  ExternalLink,
} from "lucide-react";
import { usePortalEnvironment } from "../../../contexts/portal-context";
import { useThemeSafe } from "../../../hooks/useTheme";
import type { MarketplaceComponent } from "../hooks/useMarketplaceComponents";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export interface InstallStep {
  id: string;
  name: string;
  description: string;
  status: "pending" | "running" | "success" | "error" | "skipped";
  output?: string;
  error?: string;
}

export interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  component: MarketplaceComponent;
  projectPath: string | null;
  /** Function to run the installation - provided by desktop app */
  onInstall?: (options: {
    packageName: string;
    componentId: string;
    projectPath: string;
    packageManager: PackageManager;
    autoConfigureConfig: boolean;
    onStepUpdate: (steps: InstallStep[]) => void;
  }) => Promise<{ success: boolean; error?: string }>;
  /** Detected package manager from lock files */
  detectedPackageManager?: PackageManager | null;
}

const PACKAGE_MANAGERS: { value: PackageManager; label: string }[] = [
  { value: "npm", label: "npm" },
  { value: "pnpm", label: "pnpm" },
  { value: "yarn", label: "Yarn" },
  { value: "bun", label: "Bun" },
];

export const InstallModal: React.FC<InstallModalProps> = ({
  isOpen,
  onClose,
  component,
  projectPath,
  onInstall,
  detectedPackageManager,
}) => {
  const { container: portalContainer, ownerDocument } = usePortalEnvironment();
  const portalTarget = portalContainer ?? ownerDocument?.body ?? null;
  const { theme } = useThemeSafe();

  const [packageManager, setPackageManager] = useState<PackageManager>(
    detectedPackageManager || "npm",
  );
  const [autoConfigureConfig, setAutoConfigureConfig] = useState(true);
  const [showPmDropdown, setShowPmDropdown] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSteps, setInstallSteps] = useState<InstallStep[]>([]);
  const [installComplete, setInstallComplete] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Update package manager when detected one changes
  useEffect(() => {
    if (detectedPackageManager) {
      setPackageManager(detectedPackageManager);
    }
  }, [detectedPackageManager]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsInstalling(false);
      setInstallSteps([]);
      setInstallComplete(false);
      setInstallError(null);
    }
  }, [isOpen]);

  const getInstallCommand = useCallback(() => {
    const pkg = component.npmPackage;
    switch (packageManager) {
      case "npm":
        return `npm install ${pkg}`;
      case "pnpm":
        return `pnpm add ${pkg}`;
      case "yarn":
        return `yarn add ${pkg}`;
      case "bun":
        return `bun add ${pkg}`;
      default:
        return `npm install ${pkg}`;
    }
  }, [packageManager, component.npmPackage]);

  const handleCopyCommand = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getInstallCommand());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [getInstallCommand]);

  const handleInstall = useCallback(async () => {
    if (!projectPath || !onInstall) return;

    setIsInstalling(true);
    setInstallError(null);
    setInstallSteps([
      {
        id: "install-package",
        name: "Install Package",
        description: `Installing ${component.npmPackage}...`,
        status: "pending",
      },
      ...(autoConfigureConfig
        ? [
            {
              id: "update-config",
              name: "Update Config",
              description: "Updating convex.config.ts...",
              status: "pending" as const,
            },
          ]
        : []),
    ]);

    try {
      const result = await onInstall({
        packageName: component.npmPackage,
        componentId: component.id,
        projectPath,
        packageManager,
        autoConfigureConfig,
        onStepUpdate: setInstallSteps,
      });

      if (result.success) {
        setInstallComplete(true);
      } else {
        setInstallError(result.error || "Installation failed");
      }
    } catch (error) {
      setInstallError(
        error instanceof Error ? error.message : "Installation failed",
      );
    } finally {
      setIsInstalling(false);
    }
  }, [projectPath, onInstall, component, packageManager, autoConfigureConfig]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isInstalling) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, isInstalling, onClose]);

  if (!isOpen || !portalTarget) return null;

  const canInstall = projectPath && onInstall;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={isInstalling ? undefined : onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 100000,
          animation: "fadeIn 0.2s ease-out",
        }}
      />

      {/* Dialog */}
      <div
        className={`cp-theme-${theme}`}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "480px",
          maxWidth: "90vw",
          maxHeight: "90vh",
          backgroundColor: "var(--color-panel-bg)",
          border: "1px solid var(--color-panel-border)",
          borderRadius: "12px",
          zIndex: 100001,
          boxShadow: "0 8px 32px var(--color-panel-shadow)",
          animation: "popupSlideIn 0.3s ease-out",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--color-panel-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Download
              size={20}
              style={{ color: "var(--color-panel-accent)" }}
            />
            <h2
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--color-panel-text)",
              }}
            >
              Install {component.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isInstalling}
            style={{
              background: "none",
              border: "none",
              cursor: isInstalling ? "not-allowed" : "pointer",
              padding: "4px",
              borderRadius: "4px",
              color: "var(--color-panel-text-muted)",
              opacity: isInstalling ? 0.5 : 1,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: "20px",
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Install Command Preview */}
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
              Install Command
            </label>
            <div
              style={{
                backgroundColor: "var(--color-panel-bg-tertiary)",
                borderRadius: "8px",
                padding: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid var(--color-panel-border)",
              }}
            >
              <code
                style={{
                  fontSize: "13px",
                  fontFamily: "monospace",
                  color: "var(--color-panel-text)",
                }}
              >
                {getInstallCommand()}
              </code>
              <button
                onClick={handleCopyCommand}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  color: copied
                    ? "var(--color-panel-success)"
                    : "var(--color-panel-text-muted)",
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Package Manager Selector */}
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
              Package Manager
              {detectedPackageManager && (
                <span style={{ fontWeight: 400, marginLeft: "8px" }}>
                  (detected: {detectedPackageManager})
                </span>
              )}
            </label>
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowPmDropdown(!showPmDropdown)}
                disabled={isInstalling}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  backgroundColor: "var(--color-panel-bg-secondary)",
                  border: "1px solid var(--color-panel-border)",
                  borderRadius: "8px",
                  color: "var(--color-panel-text)",
                  fontSize: "14px",
                  cursor: isInstalling ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>
                  {PACKAGE_MANAGERS.find((pm) => pm.value === packageManager)
                    ?.label || packageManager}
                </span>
                <ChevronDown size={16} />
              </button>
              {showPmDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: "4px",
                    backgroundColor: "var(--color-panel-bg-secondary)",
                    border: "1px solid var(--color-panel-border)",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px var(--color-panel-shadow)",
                    zIndex: 10,
                    overflow: "hidden",
                  }}
                >
                  {PACKAGE_MANAGERS.map((pm) => (
                    <button
                      key={pm.value}
                      onClick={() => {
                        setPackageManager(pm.value);
                        setShowPmDropdown(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        backgroundColor:
                          packageManager === pm.value
                            ? "var(--color-panel-bg-tertiary)"
                            : "transparent",
                        border: "none",
                        color: "var(--color-panel-text)",
                        fontSize: "14px",
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>{pm.label}</span>
                      {packageManager === pm.value && (
                        <Check
                          size={16}
                          style={{ color: "var(--color-panel-success)" }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Auto Configure Checkbox */}
          {canInstall && (
            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: isInstalling ? "not-allowed" : "pointer",
                  opacity: isInstalling ? 0.5 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={autoConfigureConfig}
                  onChange={(e) => setAutoConfigureConfig(e.target.checked)}
                  disabled={isInstalling}
                  style={{
                    width: "16px",
                    height: "16px",
                    accentColor: "var(--color-panel-accent)",
                  }}
                />
                <span
                  style={{
                    fontSize: "14px",
                    color: "var(--color-panel-text)",
                  }}
                >
                  Automatically update convex.config.ts
                </span>
              </label>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--color-panel-text-muted)",
                  marginTop: "6px",
                  marginLeft: "26px",
                }}
              >
                Adds the import and app.use() statement for you
              </p>
            </div>
          )}

          {/* Installation Progress */}
          {installSteps.length > 0 && (
            <div
              style={{
                backgroundColor: "var(--color-panel-bg-secondary)",
                borderRadius: "8px",
                padding: "16px",
                border: "1px solid var(--color-panel-border)",
              }}
            >
              <h4
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--color-panel-text)",
                }}
              >
                Installation Progress
              </h4>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {installSteps.map((step) => (
                  <div
                    key={step.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                    }}
                  >
                    <div style={{ flexShrink: 0, marginTop: "2px" }}>
                      {step.status === "pending" && (
                        <div
                          style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            border: "2px solid var(--color-panel-border)",
                          }}
                        />
                      )}
                      {step.status === "running" && (
                        <Loader2
                          size={16}
                          style={{
                            color: "var(--color-panel-accent)",
                            animation: "spin 1s linear infinite",
                          }}
                        />
                      )}
                      {step.status === "success" && (
                        <Check
                          size={16}
                          style={{ color: "var(--color-panel-success)" }}
                        />
                      )}
                      {step.status === "error" && (
                        <AlertCircle
                          size={16}
                          style={{ color: "var(--color-panel-error)" }}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "var(--color-panel-text)",
                        }}
                      >
                        {step.name}
                      </div>
                      {step.error && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--color-panel-error)",
                            marginTop: "4px",
                          }}
                        >
                          {step.error}
                        </div>
                      )}
                      {step.output && (
                        <pre
                          style={{
                            fontSize: "11px",
                            color: "var(--color-panel-text-muted)",
                            marginTop: "4px",
                            whiteSpace: "pre-wrap",
                            fontFamily: "monospace",
                            maxHeight: "100px",
                            overflow: "auto",
                          }}
                        >
                          {step.output}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Message */}
          {installComplete && (
            <div
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--color-panel-success) 10%, transparent)",
                borderRadius: "8px",
                padding: "16px",
                border: "1px solid var(--color-panel-success)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "8px",
                }}
              >
                <Check
                  size={20}
                  style={{ color: "var(--color-panel-success)" }}
                />
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--color-panel-success)",
                  }}
                >
                  Installation Complete!
                </span>
              </div>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--color-panel-text-secondary)",
                  margin: 0,
                }}
              >
                {component.title} has been installed and configured.
              </p>
              {component.repoUrl && (
                <a
                  href={component.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "13px",
                    color: "var(--color-panel-accent)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    marginTop: "8px",
                  }}
                >
                  View documentation <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}

          {/* Error Message */}
          {installError && (
            <div
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--color-panel-error) 10%, transparent)",
                borderRadius: "8px",
                padding: "16px",
                border: "1px solid var(--color-panel-error)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "8px",
                }}
              >
                <AlertCircle
                  size={20}
                  style={{ color: "var(--color-panel-error)" }}
                />
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--color-panel-error)",
                  }}
                >
                  Installation Error
                </span>
              </div>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--color-panel-text-secondary)",
                  margin: 0,
                }}
              >
                {installError}
              </p>
            </div>
          )}

          {/* No Project Path Warning */}
          {!projectPath && (
            <div
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--color-panel-warning) 10%, transparent)",
                borderRadius: "8px",
                padding: "16px",
                border: "1px solid var(--color-panel-warning)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <AlertCircle
                  size={20}
                  style={{ color: "var(--color-panel-warning)" }}
                />
                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--color-panel-text)",
                  }}
                >
                  Set your project folder to enable automatic installation
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid var(--color-panel-border)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
          }}
        >
          <button
            onClick={onClose}
            disabled={isInstalling}
            style={{
              padding: "10px 16px",
              fontSize: "14px",
              fontWeight: 500,
              backgroundColor: "transparent",
              border: "1px solid var(--color-panel-border)",
              borderRadius: "8px",
              color: "var(--color-panel-text)",
              cursor: isInstalling ? "not-allowed" : "pointer",
              opacity: isInstalling ? 0.5 : 1,
            }}
          >
            {installComplete ? "Close" : "Cancel"}
          </button>
          {canInstall && !installComplete && (
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: 500,
                backgroundColor: "var(--color-panel-accent)",
                border: "none",
                borderRadius: "8px",
                color: "white",
                cursor: isInstalling ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                opacity: isInstalling ? 0.7 : 1,
              }}
            >
              {isInstalling ? (
                <>
                  <Loader2
                    size={16}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  Installing...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Install
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popupSlideIn {
          from { opacity: 0; transform: translate(-50%, -48%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>,
    portalTarget,
  );
};
