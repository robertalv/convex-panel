import { useState, useEffect, useCallback } from "react";
import { useGitHubOptional } from "../contexts/github-context";
import { useDeployment } from "../contexts/deployment-context";
import { useProjectPath } from "../contexts/project-path-context";
import {
  readDeployKeyFromEnvLocal,
  validateDeployKey,
  doesKeyMatchDeployment,
} from "../lib/envFile";
import { createDeployKey } from "@convex-panel/shared/api";
import {
  saveDeploymentKey,
  loadDeploymentKey,
  getOAuthTokenFromStorage,
} from "../lib/secureStorage";

interface UseOnboardingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  deploymentName?: string;
}

interface UseOnboardingDialogReturn {
  // Project path
  selectedPath: string | null;
  projectPathError: string | null;
  handleSelectDirectory: () => Promise<void>;

  // Deploy key state
  envLocalKey: string | null;
  envLocalKeyMatchesDeployment: boolean;
  isGeneratingKey: boolean;
  keyError: string | null;
  manualKey: string;
  showManualEntry: boolean;
  generatedKey: string | null;
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
  const {
    projectPath,
    setProjectPath,
    validationError: contextValidationError,
  } = useProjectPath();
  const github = useGitHubOptional();
  const deployment = useDeployment();

  // Use context projectPath as source of truth for selectedPath
  const [selectedPath, setSelectedPath] = useState<string | null>(projectPath);
  const [envLocalKey, setEnvLocalKey] = useState<string | null>(null);
  const [envLocalKeyMatchesDeployment, setEnvLocalKeyMatchesDeployment] =
    useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [manualKey, setManualKey] = useState("");
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  // Sync selectedPath with context projectPath
  useEffect(() => {
    console.log(
      "[useOnboardingDialog] Syncing selectedPath with projectPath:",
      projectPath,
    );
    setSelectedPath(projectPath);
  }, [projectPath]);

  // Initialize/reset state when dialog opens
  useEffect(() => {
    const validateAndSetPath = async () => {
      if (!isOpen) return;

      setKeyError(null);
      setManualKey("");
      setShowManualEntry(false);

      // Try to load cached deployment key
      if (deploymentName) {
        try {
          const cachedKey = await loadDeploymentKey(deploymentName);
          if (cachedKey) {
            const validation = validateDeployKey(cachedKey, deploymentName);
            if (validation.valid) {
              console.log(
                "[useOnboardingDialog] Loaded cached key for",
                deploymentName,
              );
              setGeneratedKey(cachedKey);
            } else {
              setGeneratedKey(null);
            }
          } else {
            setGeneratedKey(null);
          }
        } catch (err) {
          console.warn("[useOnboardingDialog] Failed to load cached key:", err);
          setGeneratedKey(null);
        }
      } else {
        setGeneratedKey(null);
      }

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
    console.log("[useOnboardingDialog] handleGenerateKey called");
    console.log("[useOnboardingDialog] Props:", {
      deploymentName,
    });
    console.log("[useOnboardingDialog] Deployment state:", {
      deployment: deployment?.deployment,
      deploymentNameFromContext: deployment?.deployment?.name,
      hasAccessToken: !!deployment?.accessToken,
      accessToken: deployment?.accessToken ? "exists" : "null",
      cliDeployKeyLoading: deployment?.cliDeployKeyLoading,
      cliDeployKey: deployment?.cliDeployKey ? "exists" : "null",
      fetchFn: typeof deployment?.fetchFn === "function" ? "exists" : "null",
    });

    // Use deploymentName from props if available, otherwise fall back to context
    const targetDeploymentName = deploymentName || deployment?.deployment?.name;

    if (!targetDeploymentName) {
      console.error("[useOnboardingDialog] No deployment name available");
      setKeyError("No deployment selected. Please select a deployment first.");
      setIsGeneratingKey(false);
      return;
    }

    // Try to get access token from deployment context, or fall back to localStorage
    let accessToken = deployment?.accessToken;
    if (!accessToken) {
      console.log(
        "[useOnboardingDialog] Access token not in context, trying localStorage...",
      );
      accessToken = getOAuthTokenFromStorage();
    }

    if (!accessToken) {
      console.error("[useOnboardingDialog] No access token available");
      setKeyError(
        "No access token available. Please reconnect to your account.",
      );
      setIsGeneratingKey(false);
      return;
    }

    console.log(
      "[useOnboardingDialog] Using access token:",
      accessToken ? "exists" : "null",
    );

    if (!deployment?.fetchFn) {
      console.error("[useOnboardingDialog] No fetch function available");
      setKeyError("Network error. Please try again.");
      setIsGeneratingKey(false);
      return;
    }

    setIsGeneratingKey(true);
    setKeyError(null);

    try {
      console.log("[useOnboardingDialog] Creating deploy key directly...");
      const projectId = deployment?.deployment?.projectId;
      const keyName = projectId
        ? `cp-${projectId}-${Date.now()}`
        : `cp-desktop-${Date.now()}`;

      console.log("[useOnboardingDialog] Calling createDeployKey with:", {
        deploymentName: targetDeploymentName,
        keyName,
      });

      const result = await createDeployKey(
        accessToken,
        targetDeploymentName,
        keyName,
        deployment.fetchFn,
      );

      console.log("[useOnboardingDialog] Deploy key created successfully");

      // Store the key in local state for display
      setGeneratedKey(result.key);

      // Save the key to the deployment context
      if (deployment.setManualDeployKey) {
        await deployment.setManualDeployKey(result.key, targetDeploymentName);
        console.log("[useOnboardingDialog] Key saved to deployment context");
      }

      // Also save to localStorage for persistence
      try {
        await saveDeploymentKey(targetDeploymentName, result.key, {
          projectId: deployment?.deployment?.projectId,
          teamId: deployment?.teamId ?? undefined,
        });
        console.log("[useOnboardingDialog] Key saved to localStorage");
      } catch (saveError) {
        console.warn(
          "[useOnboardingDialog] Failed to save key to localStorage:",
          saveError,
        );
        // Don't fail the whole operation if localStorage save fails
      }

      console.log(
        "[useOnboardingDialog] Key generation completed successfully!",
      );
    } catch (err) {
      console.error("[useOnboardingDialog] Error generating key:", err);
      setKeyError(
        err instanceof Error ? err.message : "Failed to generate key",
      );
    } finally {
      console.log("[useOnboardingDialog] Setting isGeneratingKey to false");
      setIsGeneratingKey(false);
    }
  }, [deployment, deploymentName]);

  const handleUseEnvLocalKey = useCallback(async () => {
    if (!envLocalKey) return;
    try {
      setGeneratedKey(envLocalKey);
      await deployment.setManualDeployKey(envLocalKey, deploymentName);
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : "Failed to use key");
    }
  }, [envLocalKey, deployment, deploymentName]);

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
      setGeneratedKey(trimmedKey);
      await deployment.setManualDeployKey(trimmedKey, deploymentName);
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

  return {
    selectedPath,
    projectPathError: contextValidationError,
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
  };
}
