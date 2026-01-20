import * as React from "react";
import { useOnboardingDialog } from "../hooks/useOnboardingDialog";
import { ConvexLettering } from "@/components/svg/convex-lettering";
import {
  FolderOpen,
  Github,
  Key,
  Check,
  ExternalLink,
  Loader2,
  RefreshCw,
  FileText,
  ArrowRight,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorDisplay } from "./error-display";
import { getKeyPreview } from "../lib/envFile";
import { getDashboardUrl, openExternalLink } from "../lib/utils";
import { Modal } from "@/components/ui/modal";

interface ProjectOnboardingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  deploymentName?: string;
  teamSlug?: string | null;
  projectSlug?: string | null;
}

export function ProjectOnboardingDialog({
  isOpen,
  onClose,
  onComplete,
  deploymentName,
  teamSlug,
  projectSlug,
}: ProjectOnboardingDialogProps) {
  const {
    selectedPath,
    projectPathError,
    handleSelectDirectory,
    envLocalKey,
    envLocalKeyMatchesDeployment,
    isGeneratingKey,
    keyError,
    manualKey,
    showManualEntry,
    generatedKey,
    setManualKey,
    setShowManualEntry,
    handleGenerateKey,
    handleUseEnvLocalKey,
    handleSaveManualKey,
    handleComplete,
    handleSkip,
    github,
    deployment,
  } = useOnboardingDialog({
    isOpen,
    onClose,
    onComplete,
    deploymentName,
  });

  // Debug logging for GitHub state
  React.useEffect(() => {
    console.log("[ProjectOnboardingDialog] GitHub state:", {
      github: github ? "exists" : "null",
      isAuthenticated: github?.isAuthenticated,
      isLoading: github?.isLoading,
      authStatus: github?.authStatus,
      hasStartAuth: !!github?.startAuth,
      error: github?.error,
    });
  }, [github]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleSkip}
      width="512px"
      height="auto"
      className="project-onboarding-dialog"
      contentClassName="!p-6"
      showCloseButton={false}
    >
      <div
        data-project-scope="onboarding"
        data-deployment-name={deploymentName || undefined}
      >
        {/* Convex Logo at the top */}
        <div className="flex justify-center mb-4">
          <ConvexLettering className="h-6" />
        </div>

        {/* Main card */}
        <div
          className="project-onboarding-dialog__card animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-text-base">Project Setup</h2>
            <p className="text-sm text-text-muted mt-1">
              Configure your project settings
            </p>
          </div>

          {/* Content */}
          <div className="project-onboarding-dialog__content-inner overflow-y-auto max-h-[500px] space-y-4">
            {/* Section 1: Project Folder */}
            <div className="p-4 rounded-xl bg-surface-raised/30 border border-border-base">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                  <FolderOpen size={20} className="text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-base">
                    Project Folder
                  </h3>
                  <p className="text-xs text-text-muted">
                    Select your convex project directory
                  </p>
                </div>
              </div>

              {selectedPath ? (
                <div className="space-y-2">
                  <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-green-500 shrink-0" />
                      <p className="text-xs text-text-muted font-mono truncate flex-1">
                        {selectedPath}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleSelectDirectory}
                    className="text-xs text-brand-base hover:text-brand-hover transition-colors"
                  >
                    Choose a different folder
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleSelectDirectory}
                    className="w-full p-3 rounded-lg border-2 border-dashed border-border-base hover:border-brand-base hover:bg-brand-base/5 transition-all group"
                  >
                    <FolderOpen
                      size={20}
                      className="mx-auto mb-1 text-text-muted group-hover:text-brand-base transition-colors"
                    />
                    <p className="text-xs font-medium text-text-base">
                      Click to browse
                    </p>
                  </button>
                  {projectPathError && (
                    <div className="p-2 rounded-lg bg-error-base/10 border border-error-base/30">
                      <p className="text-xs text-error-base">
                        {projectPathError}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section 2: GitHub */}
            <div className="p-4 rounded-xl bg-surface-raised/30 border border-border-base">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-500/20 to-slate-500/20 flex items-center justify-center">
                  <Github size={20} className="text-text-base" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-base">
                    GitHub
                  </h3>
                  <p className="text-xs text-text-muted">Connect to Github</p>
                </div>
              </div>

              {github?.isAuthenticated ? (
                <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Check size={14} className="text-green-500 shrink-0" />
                      {github.user?.avatar_url && (
                        <img
                          src={github.user.avatar_url}
                          alt={
                            github.user?.login || github.user?.name || "User"
                          }
                          className="w-5 h-5 rounded-full shrink-0"
                        />
                      )}
                      <p className="text-xs text-text-base truncate">
                        Connected as{" "}
                        <span className="font-medium">
                          {github.user?.login || github.user?.name || "User"}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        console.log(
                          "[ProjectOnboardingDialog] Disconnecting GitHub...",
                        );
                        if (github?.logout) {
                          try {
                            await github.logout();
                            console.log(
                              "[ProjectOnboardingDialog] GitHub disconnected successfully",
                            );
                          } catch (error) {
                            console.error(
                              "[ProjectOnboardingDialog] Failed to disconnect GitHub:",
                              error,
                            );
                          }
                        }
                      }}
                      className="text-xs text-text-muted hover:text-text-base transition-colors shrink-0 flex items-center gap-1 px-2 py-1 rounded hover:bg-surface-raised"
                    >
                      <LogOut size={12} />
                      <span>Disconnect</span>
                    </button>
                  </div>
                </div>
              ) : github?.authStatus === "polling" ||
                github?.authStatus === "awaiting_user" ? (
                <div className="space-y-2">
                  <div className="p-2 rounded-lg bg-brand-base/10 border border-brand-base/30 text-center">
                    <p className="text-xs text-text-muted mb-1">
                      Enter code on GitHub:
                    </p>
                    <p className="text-lg font-mono font-bold text-brand-base tracking-wider">
                      {github.deviceCode?.user_code}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      openExternalLink(
                        github.deviceCode?.verification_uri ||
                          "https://github.com/login/device",
                      )
                    }
                    className="w-full flex items-center justify-center gap-2 text-xs text-brand-base hover:text-brand-hover transition-colors"
                  >
                    <ExternalLink size={12} />
                    Open GitHub
                  </button>
                  <div className="flex items-center justify-center gap-2 text-xs text-text-muted">
                    <Loader2 size={12} className="animate-spin" />
                    Waiting for authorization...
                  </div>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  onClick={async () => {
                    console.log(
                      "[ProjectOnboardingDialog] Connect GitHub button clicked",
                    );
                    console.log(
                      "[ProjectOnboardingDialog] GitHub object:",
                      github,
                    );
                    console.log("[ProjectOnboardingDialog] GitHub state:", {
                      exists: !!github,
                      hasStartAuth: !!github?.startAuth,
                      isLoading: github?.isLoading,
                      authStatus: github?.authStatus,
                      isAuthenticated: github?.isAuthenticated,
                      error: github?.error,
                    });

                    if (!github) {
                      console.warn(
                        "[ProjectOnboardingDialog] GitHub context is null/undefined",
                      );
                      return;
                    }

                    if (!github.startAuth) {
                      console.error(
                        "[ProjectOnboardingDialog] github.startAuth is not available",
                      );
                      return;
                    }

                    try {
                      console.log(
                        "[ProjectOnboardingDialog] Calling github.startAuth()...",
                      );
                      await github.startAuth();
                      console.log(
                        "[ProjectOnboardingDialog] github.startAuth() completed successfully",
                      );
                    } catch (error) {
                      console.error(
                        "[ProjectOnboardingDialog] Failed to start GitHub auth:",
                        error,
                      );
                      console.error(
                        "[ProjectOnboardingDialog] Error details:",
                        {
                          message:
                            error instanceof Error
                              ? error.message
                              : String(error),
                          stack:
                            error instanceof Error ? error.stack : undefined,
                          error,
                        },
                      );
                    }
                  }}
                  disabled={github?.isLoading || !github}
                  className="w-full"
                  size="sm"
                >
                  <Github size={14} className="mr-2" />
                  Connect GitHub
                </Button>
              )}
              {github?.error && <ErrorDisplay error={github.error} />}
            </div>

            {/* Section 3: Deploy Key */}
            <div className="p-4 rounded-xl bg-surface-raised/30 border border-border-base">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                  <Key size={20} className="text-green-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-base">
                    Deploy Key
                  </h3>
                  <p className="text-xs text-text-muted">
                    Authenticate CLI commands
                  </p>
                </div>
              </div>

              {/* Check generatedKey first (local state), then fall back to deployment context */}
              {generatedKey ||
              (deployment.cliDeployKey && !deployment.cliDeployKeyLoading) ? (
                <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-green-500 shrink-0" />
                    <p className="text-xs text-text-muted font-mono truncate flex-1">
                      {getKeyPreview(
                        generatedKey || deployment.cliDeployKey || "",
                      )}
                    </p>
                  </div>
                </div>
              ) : deployment.cliDeployKeyLoading || isGeneratingKey ? (
                <div className="p-2 rounded-lg bg-brand-base/10 border border-brand-base/30">
                  <div className="flex items-center gap-2">
                    <Loader2
                      size={14}
                      className="text-brand-base animate-spin shrink-0"
                    />
                    <p className="text-xs text-text-base">
                      Generating deploy key...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Use .env.local key */}
                  {envLocalKey && envLocalKeyMatchesDeployment && (
                    <button
                      onClick={handleUseEnvLocalKey}
                      className="w-full flex items-center gap-2 p-2 rounded-lg bg-surface-raised/50 border border-border-base hover:bg-surface-overlay transition-colors text-left"
                    >
                      <FileText size={14} className="text-blue-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-text-base">
                          Use .env.local key
                        </p>
                        <p className="text-[10px] text-text-muted font-mono truncate">
                          {getKeyPreview(envLocalKey)}
                        </p>
                      </div>
                      <ArrowRight
                        size={12}
                        className="text-text-muted shrink-0"
                      />
                    </button>
                  )}

                  {/* Generate key */}
                  <button
                    onClick={handleGenerateKey}
                    disabled={isGeneratingKey}
                    className="w-full flex items-center gap-2 p-2 rounded-lg bg-surface-raised/50 border border-border-base hover:bg-surface-overlay transition-colors text-left disabled:opacity-50"
                  >
                    {isGeneratingKey ? (
                      <Loader2
                        size={14}
                        className="text-brand-base animate-spin shrink-0"
                      />
                    ) : (
                      <RefreshCw
                        size={14}
                        className="text-brand-base shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-xs font-medium text-text-base">
                        {isGeneratingKey ? "Generating..." : "Generate new key"}
                      </p>
                    </div>
                    <ArrowRight
                      size={12}
                      className="text-text-muted shrink-0"
                    />
                  </button>

                  {/* Get from dashboard */}
                  <button
                    onClick={() =>
                      openExternalLink(
                        getDashboardUrl(teamSlug, projectSlug, deploymentName),
                      )
                    }
                    className="w-full flex items-center gap-2 p-2 rounded-lg bg-surface-raised/50 border border-border-base hover:bg-surface-overlay transition-colors text-left"
                  >
                    <ExternalLink
                      size={14}
                      className="text-purple-500 shrink-0"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-text-base">
                        Get from Dashboard
                      </p>
                    </div>
                    <ExternalLink
                      size={12}
                      className="text-text-muted shrink-0"
                    />
                  </button>

                  {/* Manual entry */}
                  {!showManualEntry ? (
                    <button
                      onClick={() => setShowManualEntry(true)}
                      className="w-full text-xs text-brand-base hover:text-brand-hover transition-colors py-1"
                    >
                      Enter manually
                    </button>
                  ) : (
                    <div className="p-2 rounded-lg bg-surface-raised/50 border border-border-base space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-text-base">
                          Enter Key
                        </p>
                        <button
                          onClick={() => setShowManualEntry(false)}
                          className="text-[10px] text-text-muted hover:text-text-base"
                        >
                          Cancel
                        </button>
                      </div>
                      <textarea
                        value={manualKey}
                        onChange={(e) => setManualKey(e.target.value)}
                        placeholder="prod:my-deployment|ey..."
                        className="w-full h-12 px-2 py-1 text-xs font-mono bg-surface-base border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-base resize-none"
                      />
                      <Button
                        onClick={handleSaveManualKey}
                        disabled={!manualKey.trim()}
                        className="w-full"
                        size="sm"
                      >
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {(keyError || deployment.cliDeployKeyError) && (
                <ErrorDisplay
                  error={keyError || deployment.cliDeployKeyError || ""}
                />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex gap-3 justify-end">
            <Button variant="ghost" onClick={handleSkip}>
              Skip
            </Button>
            <Button onClick={handleComplete}>Done</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default ProjectOnboardingDialog;
