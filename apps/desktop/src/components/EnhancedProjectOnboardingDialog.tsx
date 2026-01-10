import { useState, useEffect, useCallback } from "react";
import {
  FolderOpen,
  Check,
  ArrowRight,
  ArrowLeft,
  Code2,
  Key,
  Github,
  ExternalLink,
  RefreshCw,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useGitHubOptional } from "../contexts/GitHubContext";
import { useDeployment } from "../contexts/DeploymentContext";
import {
  readDeployKeyFromEnvLocal,
  getKeyPreview,
  validateDeployKey,
  doesKeyMatchDeployment,
} from "../lib/envFile";
import { GradientBackground } from "./shared/GradientBackground";
import { ConvexLettering } from "@/components/ui/ConvexLettering";
import { Button } from "@/components/ui/button";
import { useProjectPath } from "../contexts/ProjectPathContext";

type OnboardingStep = "welcome" | "folder" | "github" | "deploy-key" | "done";

interface EnhancedProjectOnboardingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called when the entire onboarding flow completes */
  onComplete?: () => void;
  /** Deployment name for context */
  deploymentName?: string;
  /** Team/project slugs for dashboard links */
  teamSlug?: string | null;
  projectSlug?: string | null;
}

/**
 * Enhanced project onboarding wizard that guides users through:
 * 1. Understanding the benefits of connecting a folder
 * 2. Selecting their project folder
 * 3. Connecting GitHub (optional)
 * 4. Setting up a deploy key
 */
export function EnhancedProjectOnboardingDialog({
  isOpen,
  onClose,
  onComplete,
  deploymentName,
  teamSlug,
  projectSlug,
}: EnhancedProjectOnboardingDialogProps) {
  const { projectPath, setProjectPath } = useProjectPath();
  const github = useGitHubOptional();
  const deployment = useDeployment();

  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [envLocalKey, setEnvLocalKey] = useState<string | null>(null);
  const [envLocalKeyMatchesDeployment, setEnvLocalKeyMatchesDeployment] =
    useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [manualKey, setManualKey] = useState("");
  const [showManualEntry, setShowManualEntry] = useState(false);

  // Reset state when dialog opens and validate project path matches deployment
  useEffect(() => {
    const validateAndSetPath = async () => {
      if (!isOpen) return;

      setStep("welcome");
      setKeyError(null);
      setManualKey("");
      setShowManualEntry(false);

      // If we have a deployment name, validate that the stored project path
      // actually belongs to this deployment. Only clear if there's a deploy key
      // that doesn't match - if there's no key, allow the folder (user can set it up)
      if (deploymentName && projectPath) {
        try {
          const key = await readDeployKeyFromEnvLocal(projectPath);
          if (key) {
            const matches = doesKeyMatchDeployment(key, deploymentName);
            if (matches) {
              // Path belongs to this deployment, use it
              setSelectedPath(projectPath);
              return;
            }
            // Path has a deploy key for a different deployment, clear it
            setSelectedPath(null);
            setProjectPath(null);
            return;
          }
          // No key in .env.local - allow folder, user can set it up
          setSelectedPath(projectPath);
          return;
        } catch {
          // Error reading .env.local - allow folder, might be valid
          setSelectedPath(projectPath);
          return;
        }
      }

      // No deployment name specified or no project path, just use what we have
      setSelectedPath(projectPath || null);
    };

    validateAndSetPath();
  }, [isOpen, projectPath, deploymentName, setProjectPath]);

  // Load .env.local key when folder is selected and validate it matches deployment
  useEffect(() => {
    const loadEnvKey = async () => {
      if (selectedPath) {
        try {
          const key = await readDeployKeyFromEnvLocal(selectedPath);
          setEnvLocalKey(key);
          // Validate that the key matches the current deployment
          if (key && deploymentName) {
            const matches = doesKeyMatchDeployment(key, deploymentName);
            setEnvLocalKeyMatchesDeployment(matches);
          } else {
            setEnvLocalKeyMatchesDeployment(false);
          }
        } catch {
          setEnvLocalKey(null);
          setEnvLocalKeyMatchesDeployment(false);
        }
      } else {
        setEnvLocalKey(null);
        setEnvLocalKeyMatchesDeployment(false);
      }
    };
    loadEnvKey();
  }, [selectedPath, deploymentName]);

  const handleSelectDirectory = useCallback(async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Project Folder",
      });

      if (selected && typeof selected === "string") {
        setSelectedPath(selected);
        // Save to context
        await setProjectPath(selected);
      }
    } catch (error) {
      console.error("Failed to open directory picker:", error);
    }
  }, [setProjectPath]);

  const handleGenerateKey = useCallback(async () => {
    setIsGeneratingKey(true);
    setKeyError(null);
    try {
      await deployment.regenerateDeployKey();
      // Key generation is async, wait a moment for it to complete
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      setKeyError(
        err instanceof Error ? err.message : "Failed to generate key",
      );
    } finally {
      setIsGeneratingKey(false);
    }
  }, [deployment]);

  const handleUseEnvLocalKey = useCallback(async () => {
    if (!envLocalKey) return;
    try {
      await deployment.setManualDeployKey(envLocalKey);
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : "Failed to use key");
    }
  }, [envLocalKey, deployment]);

  const handleSaveManualKey = useCallback(async () => {
    const trimmedKey = manualKey.trim();
    if (!trimmedKey) {
      setKeyError("Please enter a deploy key");
      return;
    }

    // Validate key format and ensure it matches the current deployment
    const validation = validateDeployKey(trimmedKey, deploymentName);
    if (!validation.valid) {
      setKeyError(validation.error || "Invalid deploy key");
      return;
    }

    try {
      await deployment.setManualDeployKey(trimmedKey);
      setManualKey("");
      setShowManualEntry(false);
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : "Failed to save key");
    }
  }, [manualKey, deployment, deploymentName]);

  const handleComplete = useCallback(() => {
    onComplete?.();
    onClose();
  }, [onComplete, onClose]);

  const handleSkip = useCallback(() => {
    onClose();
  }, [onClose]);

  // Navigation helpers
  const goToStep = (nextStep: OnboardingStep) => {
    setKeyError(null);
    setStep(nextStep);
  };

  const nextStep = () => {
    switch (step) {
      case "welcome":
        goToStep("folder");
        break;
      case "folder":
        goToStep("github");
        break;
      case "github":
        goToStep("deploy-key");
        break;
      case "deploy-key":
        goToStep("done");
        break;
      case "done":
        handleComplete();
        break;
    }
  };

  const prevStep = () => {
    switch (step) {
      case "folder":
        goToStep("welcome");
        break;
      case "github":
        goToStep("folder");
        break;
      case "deploy-key":
        goToStep("github");
        break;
      case "done":
        goToStep("deploy-key");
        break;
    }
  };

  // Build dashboard URL
  const getDashboardUrl = () => {
    if (teamSlug && projectSlug && deploymentName) {
      return `https://dashboard.convex.dev/t/${teamSlug}/${projectSlug}/${deploymentName}/settings`;
    }
    return "https://dashboard.convex.dev";
  };

  const openExternalLink = async (url: string) => {
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      const { open } = await import("@tauri-apps/plugin-shell");
      await open(url);
    } else {
      window.open(url, "_blank");
    }
  };

  if (!isOpen) return null;

  // Step indicators
  const steps: OnboardingStep[] = [
    "welcome",
    "folder",
    "github",
    "deploy-key",
    "done",
  ];
  const currentStepIndex = steps.indexOf(step);

  return (
    <div
      className="project-onboarding-dialog fixed inset-0 z-50 flex items-center justify-center"
      data-project-scope="onboarding"
      data-deployment-name={deploymentName || undefined}
    >
      {/* Backdrop */}
      <div
        className="project-onboarding-dialog__backdrop absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Dialog */}
      <div
        className="project-onboarding-dialog__content relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden shadow-2xl border border-border-base"
        onClick={(e) => e.stopPropagation()}
      >
        <GradientBackground className="!min-h-0">
          <div className="p-6">
            {/* Convex Logo at the top */}
            <div className="flex justify-center mb-4">
              <ConvexLettering className="h-6" />
            </div>

            {/* Main card */}
            <div
              className="project-onboarding-dialog__card animate-fade-up"
              style={{ animationDelay: "100ms" }}
            >
              {/* Step indicators */}
              <div className="project-onboarding-dialog__steps flex items-center justify-center gap-2 mb-6">
                {steps.slice(0, -1).map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i < currentStepIndex
                          ? "bg-green-500"
                          : i === currentStepIndex
                            ? "bg-brand-base"
                            : "bg-surface-overlay"
                      }`}
                    />
                    {i < steps.length - 2 && (
                      <div
                        className={`w-8 h-0.5 transition-colors ${
                          i < currentStepIndex
                            ? "bg-green-500"
                            : "bg-surface-overlay"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Content */}
              <div className="project-onboarding-dialog__content-inner overflow-y-auto max-h-[600px] max-w-[960px]">
                {/* Step 1: Welcome */}
                {step === "welcome" && (
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-base/20 to-purple-500/20 flex items-center justify-center">
                      <Code2 size={32} className="text-brand-base" />
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-text-base">
                        Connect Your Project
                      </h2>
                      <p className="text-sm text-text-muted max-w-sm mx-auto">
                        Link your project folder to unlock powerful features.
                      </p>
                    </div>

                    <div className="space-y-2 text-left">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-raised/50 border border-border-base">
                        <div>
                          <p className="text-sm font-medium text-text-base">
                            Integrated Terminal
                          </p>
                          <p className="text-xs text-text-muted">
                            Run Convex CLI with auto-configured credentials
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-raised/50 border border-border-base">
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                          <Key size={16} className="text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-base">
                            Deploy Key Sync
                          </p>
                          <p className="text-xs text-text-muted">
                            Auto-sync with your project's .env.local
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-raised/50 border border-border-base">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                          <Code2 size={16} className="text-purple-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-base">
                            Cursor MCP
                          </p>
                          <p className="text-xs text-text-muted">
                            Let Cursor AI interact with your backend
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 justify-center pt-2">
                      <Button
                        variant="ghost"
                        onClick={handleSkip}
                        className="text-text-muted"
                      >
                        Skip for now
                      </Button>
                      <Button onClick={nextStep}>
                        Get Started
                        <ArrowRight size={16} className="ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2: Folder Selection */}
                {step === "folder" && (
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                      <FolderOpen size={32} className="text-amber-500" />
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-text-base">
                        Select Project Folder
                      </h2>
                      <p className="text-sm text-text-muted max-w-sm mx-auto">
                        Choose the folder containing your{" "}
                        <code className="text-text-secondary bg-surface-raised px-1 rounded">
                          convex/
                        </code>{" "}
                        directory.
                      </p>
                    </div>

                    {selectedPath ? (
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                          <div className="flex items-center gap-3">
                            <Check
                              size={18}
                              className="text-green-500 shrink-0"
                            />
                            <div className="text-left min-w-0">
                              <p className="text-sm font-medium text-text-base">
                                Folder Selected
                              </p>
                              <p className="text-xs text-text-muted font-mono truncate">
                                {selectedPath}
                              </p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={handleSelectDirectory}
                          className="text-sm text-brand-base hover:text-brand-hover transition-colors"
                        >
                          Choose a different folder
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleSelectDirectory}
                        className="w-full p-5 rounded-xl border-2 border-dashed border-border-base hover:border-brand-base hover:bg-brand-base/5 transition-all group"
                      >
                        <FolderOpen
                          size={28}
                          className="mx-auto mb-2 text-text-muted group-hover:text-brand-base transition-colors"
                        />
                        <p className="text-sm font-medium text-text-base">
                          Click to browse
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          Select your project's root directory
                        </p>
                      </button>
                    )}

                    <div className="flex gap-3 justify-center pt-2">
                      <Button variant="ghost" onClick={prevStep}>
                        <ArrowLeft size={16} className="mr-2" />
                        Back
                      </Button>
                      <Button onClick={nextStep} disabled={!selectedPath}>
                        Continue
                        <ArrowRight size={16} className="ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: GitHub Integration */}
                {step === "github" && (
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-gray-500/20 to-slate-500/20 flex items-center justify-center">
                      <Github size={32} className="text-text-base" />
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-text-base">
                        Connect GitHub
                      </h2>
                      <p className="text-sm text-text-muted max-w-sm mx-auto">
                        Link your GitHub account for schema visualization.
                      </p>
                    </div>

                    {github?.isAuthenticated ? (
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                        <div className="flex items-center gap-3">
                          <Check
                            size={18}
                            className="text-green-500 shrink-0"
                          />
                          <div className="text-left">
                            <p className="text-sm font-medium text-text-base">
                              GitHub Connected
                            </p>
                            <p className="text-xs text-text-muted">
                              Signed in as{" "}
                              {github.user?.login ||
                                github.user?.name ||
                                "User"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : github?.authStatus === "polling" ||
                      github?.authStatus === "awaiting_user" ? (
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-brand-base/10 border border-brand-base/30">
                          <p className="text-sm text-text-base mb-1">
                            Enter this code on GitHub:
                          </p>
                          <p className="text-xl font-mono font-bold text-brand-base tracking-wider">
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
                          className="inline-flex items-center gap-2 text-sm text-brand-base hover:text-brand-hover transition-colors"
                        >
                          <ExternalLink size={14} />
                          Open GitHub to enter code
                        </button>
                        <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
                          <Loader2 size={14} className="animate-spin" />
                          Waiting for authorization...
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Button
                          variant="secondary"
                          onClick={() => github?.startAuth()}
                          disabled={github?.isLoading}
                          className="w-full"
                        >
                          <Github size={16} className="mr-2" />
                          Connect GitHub Account
                        </Button>
                        <p className="text-xs text-text-muted">
                          Optional - you can connect later in Settings
                        </p>
                      </div>
                    )}

                    {github?.error && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                        <AlertCircle
                          size={14}
                          className="text-red-400 mt-0.5 shrink-0"
                        />
                        <span className="text-sm text-red-400">
                          {github.error}
                        </span>
                      </div>
                    )}

                    <div className="flex gap-3 justify-center pt-2">
                      <Button variant="ghost" onClick={prevStep}>
                        <ArrowLeft size={16} className="mr-2" />
                        Back
                      </Button>
                      <Button onClick={nextStep}>
                        {github?.isAuthenticated ? "Continue" : "Skip"}
                        <ArrowRight size={16} className="ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 4: Deploy Key */}
                {step === "deploy-key" && (
                  <div className="space-y-5">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-4">
                        <Key size={32} className="text-green-500" />
                      </div>
                      <h2 className="text-xl font-bold text-text-base">
                        Deploy Key Setup
                      </h2>
                      <p className="text-sm text-text-muted max-w-sm mx-auto mt-1">
                        Authenticate CLI commands for your deployment.
                      </p>
                    </div>

                    {/* Current key status */}
                    {deployment.cliDeployKey &&
                      !deployment.cliDeployKeyLoading && (
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                          <div className="flex items-center gap-3">
                            <Check
                              size={18}
                              className="text-green-500 shrink-0"
                            />
                            <div className="text-left min-w-0 flex-1">
                              <p className="text-sm font-medium text-text-base">
                                Deploy Key Active
                              </p>
                              <p className="text-xs text-text-muted font-mono truncate">
                                {getKeyPreview(deployment.cliDeployKey)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                    {deployment.cliDeployKeyLoading && (
                      <div className="p-3 rounded-lg bg-brand-base/10 border border-brand-base/30">
                        <div className="flex items-center gap-3">
                          <Loader2
                            size={18}
                            className="text-brand-base animate-spin shrink-0"
                          />
                          <p className="text-sm text-text-base">
                            Generating deploy key...
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Options when no key */}
                    {!deployment.cliDeployKey &&
                      !deployment.cliDeployKeyLoading && (
                        <div className="space-y-2">
                          {/* Use .env.local key - only show if key matches current deployment */}
                          {envLocalKey && envLocalKeyMatchesDeployment && (
                            <button
                              onClick={handleUseEnvLocalKey}
                              className="w-full flex items-center gap-3 p-3 rounded-lg bg-surface-raised/50 border border-border-base hover:bg-surface-overlay transition-colors text-left"
                            >
                              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                <FileText size={16} className="text-blue-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-text-base">
                                  Use key from .env.local
                                </p>
                                <p className="text-xs text-text-muted font-mono truncate">
                                  {getKeyPreview(envLocalKey)}
                                </p>
                              </div>
                              <ArrowRight
                                size={14}
                                className="text-text-muted shrink-0"
                              />
                            </button>
                          )}

                          {/* Auto-generate */}
                          <button
                            onClick={handleGenerateKey}
                            disabled={isGeneratingKey}
                            className="w-full flex items-center gap-3 p-3 rounded-lg bg-surface-raised/50 border border-border-base hover:bg-surface-overlay transition-colors text-left disabled:opacity-50"
                          >
                            <div className="w-8 h-8 rounded-lg bg-brand-base/10 flex items-center justify-center shrink-0">
                              {isGeneratingKey ? (
                                <Loader2
                                  size={16}
                                  className="text-brand-base animate-spin"
                                />
                              ) : (
                                <RefreshCw
                                  size={16}
                                  className="text-brand-base"
                                />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-text-base">
                                {isGeneratingKey
                                  ? "Generating..."
                                  : "Generate new key"}
                              </p>
                              <p className="text-xs text-text-muted">
                                Using your OAuth credentials
                              </p>
                            </div>
                            <ArrowRight
                              size={14}
                              className="text-text-muted shrink-0"
                            />
                          </button>

                          {/* Get from dashboard */}
                          <button
                            onClick={() => openExternalLink(getDashboardUrl())}
                            className="w-full flex items-center gap-3 p-3 rounded-lg bg-surface-raised/50 border border-border-base hover:bg-surface-overlay transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                              <ExternalLink
                                size={16}
                                className="text-purple-500"
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-text-base">
                                Get from Dashboard
                              </p>
                              <p className="text-xs text-text-muted">
                                Open Convex Dashboard
                              </p>
                            </div>
                            <ExternalLink
                              size={14}
                              className="text-text-muted shrink-0"
                            />
                          </button>

                          {/* Manual entry toggle */}
                          {!showManualEntry ? (
                            <button
                              onClick={() => setShowManualEntry(true)}
                              className="w-full text-sm text-brand-base hover:text-brand-hover transition-colors py-2"
                            >
                              Enter a key manually
                            </button>
                          ) : (
                            <div className="p-3 rounded-lg bg-surface-raised/50 border border-border-base space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-text-base">
                                  Enter Deploy Key
                                </p>
                                <button
                                  onClick={() => setShowManualEntry(false)}
                                  className="text-xs text-text-muted hover:text-text-base"
                                >
                                  Cancel
                                </button>
                              </div>
                              <textarea
                                value={manualKey}
                                onChange={(e) => {
                                  setManualKey(e.target.value);
                                  setKeyError(null);
                                }}
                                placeholder="prod:my-deployment|ey..."
                                className="w-full h-16 px-3 py-2 text-sm font-mono bg-surface-base border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-base resize-none"
                              />
                              <Button
                                onClick={handleSaveManualKey}
                                disabled={!manualKey.trim()}
                                className="w-full"
                                size="sm"
                              >
                                Save Key
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                    {/* Error display */}
                    {(keyError || deployment.cliDeployKeyError) && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                        <AlertCircle
                          size={14}
                          className="text-red-400 mt-0.5 shrink-0"
                        />
                        <span className="text-sm text-red-400">
                          {keyError || deployment.cliDeployKeyError}
                        </span>
                      </div>
                    )}

                    <div className="flex gap-3 justify-center pt-2">
                      <Button variant="ghost" onClick={prevStep}>
                        <ArrowLeft size={16} className="mr-2" />
                        Back
                      </Button>
                      <Button onClick={nextStep}>
                        {deployment.cliDeployKey ? "Continue" : "Skip"}
                        <ArrowRight size={16} className="ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 5: Done */}
                {step === "done" && (
                  <div className="text-center space-y-5">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                      <Check size={32} className="text-green-500" />
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-text-base">
                        You're All Set!
                      </h2>
                      <p className="text-sm text-text-muted max-w-sm mx-auto">
                        Your project is configured and ready.
                      </p>
                    </div>

                    {/* Summary */}
                    <div className="space-y-2 text-left">
                      {selectedPath && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-raised/50 border border-border-base">
                          <Check
                            size={16}
                            className="text-green-500 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-base">
                              Project Folder
                            </p>
                            <p className="text-xs text-text-muted font-mono truncate">
                              {selectedPath}
                            </p>
                          </div>
                        </div>
                      )}
                      {github?.isAuthenticated && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-raised/50 border border-border-base">
                          <Check
                            size={16}
                            className="text-green-500 shrink-0"
                          />
                          <div>
                            <p className="text-sm font-medium text-text-base">
                              GitHub Connected
                            </p>
                            <p className="text-xs text-text-muted">
                              {github.user?.login || "Connected"}
                            </p>
                          </div>
                        </div>
                      )}
                      {deployment.cliDeployKey && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-raised/50 border border-border-base">
                          <Check
                            size={16}
                            className="text-green-500 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-base">
                              Deploy Key Active
                            </p>
                            <p className="text-xs text-text-muted font-mono truncate">
                              {getKeyPreview(deployment.cliDeployKey)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 justify-center pt-2">
                      <Button onClick={handleComplete}>
                        <Check size={16} className="mr-2" />
                        Done
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Skip link at the bottom */}
              <div className="mt-4 text-center">
                <button
                  onClick={handleSkip}
                  className="text-xs text-text-disabled hover:text-text-muted transition-colors cursor-pointer"
                >
                  Skip setup
                </button>
              </div>
            </div>
          </div>
        </GradientBackground>
      </div>
    </div>
  );
}

export default EnhancedProjectOnboardingDialog;
