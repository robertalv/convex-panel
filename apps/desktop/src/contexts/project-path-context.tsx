import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

const STORAGE_KEY_PREFIX = "convex-panel-project-path";

interface ProjectPathContextValue {
  projectPath: string | null;
  setProjectPath: (path: string | null) => void;
  selectProjectDirectory: () => Promise<void>;
  clearProjectPath: () => void;
  isValidating: boolean;
  validationError: string | null;
}

const ProjectPathContext = createContext<ProjectPathContextValue | null>(null);

export function useProjectPath() {
  const context = useContext(ProjectPathContext);
  if (!context) {
    throw new Error("useProjectPath must be used within ProjectPathProvider");
  }
  return context;
}

export function useProjectPathOptional() {
  return useContext(ProjectPathContext);
}

interface ProjectPathProviderProps {
  children: ReactNode;
  teamSlug?: string | null;
  projectSlug?: string | null;
}

/**
 * Validates if a directory is a Convex project by checking for convex/ directory
 */
async function validateConvexProject(
  path: string,
): Promise<{ valid: boolean; error?: string }> {
  try {
    const { exists } = await import("@tauri-apps/plugin-fs");

    const convexDirExists = await exists(`${path}/convex`, {
      baseDir: null as any,
    });

    if (!convexDirExists) {
      return {
        valid: false,
        error:
          "This folder doesn't appear to be a Convex project. Make sure it contains a 'convex' directory.",
      };
    }

    return { valid: true };
  } catch (error) {
    console.error("Error validating Convex project:", error);
    return {
      valid: false,
      error: "Failed to validate project directory. Please try again.",
    };
  }
}

export function ProjectPathProvider({
  children,
  teamSlug,
  projectSlug,
}: ProjectPathProviderProps) {
  // Create a project-scoped storage key
  const storageKey =
    teamSlug && projectSlug
      ? `${STORAGE_KEY_PREFIX}:${teamSlug}/${projectSlug}`
      : null;

  console.log("[ProjectPathProvider] Props:", {
    teamSlug,
    projectSlug,
    storageKey,
  });

  const [projectPath, setProjectPathState] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load the path from storage when storage key changes (project changes)
  useEffect(() => {
    console.log("[ProjectPathProvider] Loading from storage, key:", storageKey);
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      console.log("[ProjectPathProvider] Loaded path:", saved);
      setProjectPathState(saved || null);
    } else {
      console.log("[ProjectPathProvider] No storage key, clearing path");
      setProjectPathState(null);
    }
    setIsInitialized(true);
  }, [storageKey]);

  // Save path to storage when it changes
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    console.log(
      "[ProjectPathProvider] Save effect - storageKey:",
      storageKey,
      "projectPath:",
      projectPath,
    );
    if (!storageKey) {
      console.log("[ProjectPathProvider] No storage key, skipping save");
      return;
    }

    if (projectPath) {
      console.log(
        "[ProjectPathProvider] Saving path to localStorage:",
        projectPath,
      );
      localStorage.setItem(storageKey, projectPath);
    } else {
      console.log("[ProjectPathProvider] Removing path from localStorage");
      localStorage.removeItem(storageKey);
    }
  }, [projectPath, storageKey, isInitialized]);

  const setProjectPath = useCallback(async (path: string | null) => {
    console.log("[ProjectPathProvider] setProjectPath called with:", path);
    if (!path) {
      setProjectPathState(null);
      setValidationError(null);
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    const validation = await validateConvexProject(path);
    console.log("[ProjectPathProvider] Validation result:", validation);

    setIsValidating(false);

    if (validation.valid) {
      console.log(
        "[ProjectPathProvider] Validation passed, setting path:",
        path,
      );
      setProjectPathState(path);
      setValidationError(null);
    } else {
      console.log("[ProjectPathProvider] Validation failed:", validation.error);
      setValidationError(validation.error || "Invalid project directory");
    }
  }, []);

  const selectProjectDirectory = useCallback(async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Convex Project Folder",
      });

      if (selected && typeof selected === "string") {
        await setProjectPath(selected);
      }
    } catch (error) {
      console.error("Failed to open directory picker:", error);
      setValidationError("Failed to open directory picker. Please try again.");
    }
  }, [setProjectPath]);

  const clearProjectPath = useCallback(() => {
    setProjectPathState(null);
    setValidationError(null);
  }, []);

  const value: ProjectPathContextValue = {
    projectPath,
    setProjectPath,
    selectProjectDirectory,
    clearProjectPath,
    isValidating,
    validationError,
  };

  return (
    <ProjectPathContext.Provider value={value}>
      {children}
    </ProjectPathContext.Provider>
  );
}
