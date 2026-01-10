import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

const STORAGE_KEY = "convex-panel-project-path";

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
}

/**
 * Validates if a directory is a Convex project by checking for convex/ directory
 */
async function validateConvexProject(
  path: string,
): Promise<{ valid: boolean; error?: string }> {
  try {
    const { exists } = await import("@tauri-apps/plugin-fs");

    // Check if convex directory exists
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

export function ProjectPathProvider({ children }: ProjectPathProviderProps) {
  const [projectPath, setProjectPathState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved || null;
  });

  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Persist to localStorage
  useEffect(() => {
    if (projectPath) {
      localStorage.setItem(STORAGE_KEY, projectPath);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [projectPath]);

  const setProjectPath = useCallback(async (path: string | null) => {
    if (!path) {
      setProjectPathState(null);
      setValidationError(null);
      return;
    }

    // Validate the project directory
    setIsValidating(true);
    setValidationError(null);

    const validation = await validateConvexProject(path);

    setIsValidating(false);

    if (validation.valid) {
      setProjectPathState(path);
      setValidationError(null);
    } else {
      setValidationError(validation.error || "Invalid project directory");
      // Don't set the path if validation fails
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
