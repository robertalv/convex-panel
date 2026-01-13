import { useState, useEffect, useCallback } from "react";
import { useGitHubOptional } from "../contexts/github-context";
import { useDeployment } from "../contexts/deployment-context";
import { useProjectPath } from "../contexts/project-path-context";
import {
  readDeployKeyFromEnvLocal,
  validateDeployKey,
  doesKeyMatchDeployment,
} from "../lib/envFile";
import type { OnboardingStep } from "../components/onboarding/utils";

interface UseOnboardingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  deploymentName?: string;
}

interface UseOnboardingDialogReturn {
  // Step navigation
  step: OnboardingStep;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: OnboardingStep) => void;
  
  // Project path
  selectedPath: string | null;
  handleSelectDirectory: () => Promise<void>;
  
  // Deploy key state
  envLocalKey: string | null;
  envLocalKeyMatchesDeployment: boolean;
  isGeneratingKey: boolean;
  keyError: string | null;
  manualKey: string;
  showManualEntry: boolean;
  setManualKey: (key: string) => void;
  setShowManualEntry: (show: boolean) => void;
  handleGenerateKey: () => Promise<void>;
  handleUseEnvLocalKey: () => Promise<void>;
  handleSaveManualKey: () => Promise<void>;
  
  // Actions
  handleComplete: () => void;
  handleSkip: () => void;
  
  // Context values (to pass to step components)
  github: ReturnType<typeof useGitHubOptional>;
  deployment: ReturnType<typeof useDeployment>;
}

export function useOnboardingDialog({
  isOpen,
  onClose,
  onComplete,
  deploymentName,
}: UseOnboardingDialogProps): UseOnboardingDialogReturn {
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

  // Initialize/reset state when dialog opens
  useEffect(() => {
    const validateAndSetPath = async () => {
      if (!isOpen) return;

      setStep("welcome");
      setKeyError(null);
      setManualKey("");
      setShowManualEntry(false);

      if (deploymentName && projectPath) {
        try {
          const key = await readDeployKeyFromEnvLocal(projectPath);
          if (key) {
            const matches = doesKeyMatchDeployment(key, deploymentName);
            if (matches) {
              setSelectedPath(projectPath);
              return;
            }
            setSelectedPath(null);
            setProjectPath(null);
            return;
          }
          setSelectedPath(projectPath);
          return;
        } catch {
          setSelectedPath(projectPath);
          return;
        }
      }

      setSelectedPath(projectPath || null);
    };

    validateAndSetPath();
  }, [isOpen, projectPath, deploymentName, setProjectPath]);

  // Load env key when selected path changes
  useEffect(() => {
    const loadEnvKey = async () => {
      if (selectedPath) {
        try {
          const key = await readDeployKeyFromEnvLocal(selectedPath);
          setEnvLocalKey(key);
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

  const goToStep = useCallback((nextStep: OnboardingStep) => {
    setKeyError(null);
    setStep(nextStep);
  }, []);

  const nextStep = useCallback(() => {
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
  }, [step, goToStep, handleComplete]);

  const prevStep = useCallback(() => {
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
  }, [step, goToStep]);

  return {
    step,
    nextStep,
    prevStep,
    goToStep,
    selectedPath,
    handleSelectDirectory,
    envLocalKey,
    envLocalKeyMatchesDeployment,
    isGeneratingKey,
    keyError,
    manualKey,
    showManualEntry,
    setManualKey,
    setShowManualEntry,
    handleGenerateKey,
    handleUseEnvLocalKey,
    handleSaveManualKey,
    handleComplete,
    handleSkip,
    github,
    deployment,
  };
}
