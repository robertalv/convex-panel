/**
 * Install Modal Component
 *
 * A modal for installing Convex components with package manager selection,
 * progress tracking, and success/error states.
 */

import { useState, useCallback, useEffect } from "react";
import {
  X,
  Package,
  Check,
  AlertCircle,
  Loader2,
  Copy,
  FolderOpen,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { RegistryComponent, PackageManager } from "@convex-panel/registry";
import { getPackageManagers } from "@convex-panel/registry";
import {
  installComponent,
  type InstallStep,
  type InstallStepStatus,
} from "@/services/component-installer";

interface InstallModalProps {
  component: RegistryComponent;
  projectPath: string | null;
  detectedPackageManager: PackageManager | null;
  onClose: () => void;
  onSelectFolder: () => void;
}

type InstallState = "idle" | "installing" | "success" | "error";

/**
 * Get the install command for display
 */
function getInstallCommand(pm: PackageManager, packageName: string): string {
  switch (pm) {
    case "npm":
      return `npm install ${packageName}`;
    case "pnpm":
      return `pnpm add ${packageName}`;
    case "yarn":
      return `yarn add ${packageName}`;
    case "bun":
      return `bun add ${packageName}`;
    default:
      return `npm install ${packageName}`;
  }
}

/**
 * Step status icon component
 */
function StepStatusIcon({ status }: { status: InstallStepStatus }) {
  switch (status) {
    case "running":
      return <Loader2 size={14} className="animate-spin text-brand-base" />;
    case "success":
      return <Check size={14} className="text-success-base" />;
    case "error":
      return <AlertCircle size={14} className="text-error-base" />;
    case "skipped":
      return <span className="w-3.5 h-3.5 rounded-full bg-surface-overlay" />;
    default:
      return (
        <span className="w-3.5 h-3.5 rounded-full border border-border-muted" />
      );
  }
}

export function InstallModal({
  component,
  projectPath,
  detectedPackageManager,
  onClose,
  onSelectFolder,
}: InstallModalProps) {
  // State
  const [packageManager, setPackageManager] = useState<PackageManager>(
    detectedPackageManager || "npm",
  );
  const [autoConfigureConfig, setAutoConfigureConfig] = useState(true);
  const [installState, setInstallState] = useState<InstallState>("idle");
  const [steps, setSteps] = useState<InstallStep[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Update package manager when detected
  useEffect(() => {
    if (detectedPackageManager) {
      setPackageManager(detectedPackageManager);
    }
  }, [detectedPackageManager]);

  // Get the install command
  const installCommand = getInstallCommand(
    packageManager,
    component.npmPackage,
  );

  // Copy command to clipboard
  const handleCopyCommand = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(installCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, [installCommand]);

  // Handle install
  const handleInstall = useCallback(async () => {
    if (!projectPath) return;

    setInstallState("installing");
    setErrorMessage(null);

    try {
      const result = await installComponent({
        packageName: component.npmPackage,
        componentId: component.id,
        projectPath,
        packageManager,
        autoConfigureConfig,
        onStepUpdate: setSteps,
      });

      if (result.success) {
        setInstallState("success");
      } else {
        setInstallState("error");
        setErrorMessage(result.error || "Installation failed");
      }
    } catch (error) {
      setInstallState("error");
      setErrorMessage(
        error instanceof Error ? error.message : "An unexpected error occurred",
      );
    }
  }, [
    projectPath,
    component.npmPackage,
    component.id,
    packageManager,
    autoConfigureConfig,
  ]);

  // Render based on state
  const renderContent = () => {
    // No project path selected
    if (!projectPath) {
      return (
        <div className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-surface-raised flex items-center justify-center">
            <FolderOpen size={24} className="text-text-muted" />
          </div>
          <h3 className="text-sm font-medium text-text-base mb-2">
            Select a Project Folder
          </h3>
          <p className="text-xs text-text-muted mb-4">
            Choose a project folder to install {component.name} into.
          </p>
          <Button onClick={onSelectFolder} className="w-full">
            Select Folder
          </Button>
        </div>
      );
    }

    // Installing
    if (installState === "installing") {
      return (
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Loader2 size={20} className="animate-spin text-brand-base" />
            <h3 className="text-sm font-medium text-text-base">
              Installing {component.name}...
            </h3>
          </div>

          <div className="space-y-3">
            {steps.map((step) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg",
                  "bg-surface-raised border border-border-muted",
                )}
              >
                <div className="mt-0.5">
                  <StepStatusIcon status={step.status} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-base">
                    {step.name}
                  </div>
                  <div className="text-xs text-text-muted">
                    {step.description}
                  </div>
                  {step.error && (
                    <div className="mt-2 text-xs text-error-base">
                      {step.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Success
    if (installState === "success") {
      return (
        <div className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-success-base/20 flex items-center justify-center">
            <Check size={24} className="text-success-base" />
          </div>
          <h3 className="text-base font-medium text-text-base mb-2">
            Successfully Installed!
          </h3>
          <p className="text-sm text-text-muted mb-6">
            {component.name} has been installed in your project.
          </p>
          <Button onClick={onClose} className="w-full">
            Done
          </Button>
        </div>
      );
    }

    // Error
    if (installState === "error") {
      return (
        <div className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-error-base/20 flex items-center justify-center">
            <AlertCircle size={24} className="text-error-base" />
          </div>
          <h3 className="text-base font-medium text-text-base mb-2">
            Installation Failed
          </h3>
          <p className="text-sm text-text-muted mb-4">
            {errorMessage || "An error occurred during installation."}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => {
                setInstallState("idle");
                setSteps([]);
                setErrorMessage(null);
              }}
              className="flex-1"
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    // Idle - show options
    return (
      <div className="p-6">
        {/* Package info */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border-muted">
          {component.image?.src ? (
            <img
              src={component.image.src}
              alt={component.name}
              className="w-10 h-10 rounded-lg object-contain"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-base/30 to-brand-base/10 flex items-center justify-center">
              <span className="text-lg font-bold text-brand-base">
                {component.name.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium text-text-base">
              {component.name}
            </h3>
            <p className="text-xs text-text-muted">{component.npmPackage}</p>
          </div>
        </div>

        {/* Package manager selection */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-text-muted mb-2">
            Package Manager
          </label>
          <div className="relative">
            <select
              value={packageManager}
              onChange={(e) =>
                setPackageManager(e.target.value as PackageManager)
              }
              className={cn(
                "w-full h-9 pl-3 pr-8 text-sm appearance-none",
                "bg-surface-raised border border-border-muted rounded-lg",
                "text-text-base",
                "focus:outline-none focus:border-border-base",
                "cursor-pointer",
              )}
            >
              {getPackageManagers().map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.name}
                  {detectedPackageManager === pm.id ? " (detected)" : ""}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
          </div>
        </div>

        {/* Install command preview */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-text-muted mb-2">
            Install Command
          </label>
          <div
            className={cn(
              "flex items-center gap-2 p-3",
              "bg-surface-raised border border-border-muted rounded-lg",
              "font-mono text-xs text-text-base",
            )}
          >
            <Package size={14} className="shrink-0 text-text-muted" />
            <code className="flex-1 truncate">{installCommand}</code>
            <button
              onClick={handleCopyCommand}
              className={cn(
                "shrink-0 p-1 rounded",
                "text-text-muted hover:text-text-base hover:bg-surface-overlay",
                "transition-colors",
              )}
              title="Copy to clipboard"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Auto-configure option */}
        <label className="flex items-center gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={autoConfigureConfig}
            onChange={(e) => setAutoConfigureConfig(e.target.checked)}
            className={cn(
              "w-4 h-4 rounded border border-border-muted",
              "bg-surface-raised text-brand-base",
              "focus:ring-2 focus:ring-brand-base focus:ring-offset-2",
              "cursor-pointer",
            )}
          />
          <div>
            <div className="text-sm text-text-base">
              Auto-configure convex.config.ts
            </div>
            <div className="text-xs text-text-muted">
              Automatically add the component to your Convex config
            </div>
          </div>
        </label>

        {/* Project path indicator */}
        <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-surface-raised">
          <FolderOpen size={14} className="text-text-muted" />
          <span className="text-xs text-text-muted truncate flex-1">
            {projectPath}
          </span>
          <button
            onClick={onSelectFolder}
            className="text-xs text-brand-base hover:underline"
          >
            Change
          </button>
        </div>

        {/* Install button */}
        <Button onClick={handleInstall} className="w-full">
          Install {component.name}
        </Button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-md mx-4",
          "bg-surface-base border border-border-muted rounded-xl",
          "shadow-2xl",
          "animate-scale-in",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-muted">
          <h2 className="text-base font-semibold text-text-base">
            Install Component
          </h2>
          <button
            onClick={onClose}
            disabled={installState === "installing"}
            className={cn(
              "p-1.5 rounded-lg",
              "text-text-muted hover:text-text-base",
              "hover:bg-surface-raised transition-colors",
              "disabled:opacity-50 disabled:pointer-events-none",
            )}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </div>
  );
}

export default InstallModal;
