import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

/**
 * Package manager types
 */
export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export interface PackageManagerConfig {
  name: PackageManager;
  displayName: string;
  installCommand: string;
  addCommand: string;
  lockFile: string;
}

const STORAGE_KEY_PREFIX = "convex-panel-package-manager";

interface PackageManagerContextValue {
  /** Currently selected package manager */
  packageManager: PackageManager;
  /** Set the package manager */
  setPackageManager: (pm: PackageManager) => void;
  /** Package manager auto-detected from lock files */
  detectedPackageManager: PackageManager | null;
  /** Whether detection is in progress */
  isDetecting: boolean;
  /** Re-detect package manager from project files */
  detectPackageManager: () => Promise<void>;
  /** Get the install command for a package */
  getInstallCommand: (packageName: string) => string;
  /** Get the config for the current package manager */
  config: PackageManagerConfig;
}

const CONFIGS: Record<PackageManager, PackageManagerConfig> = {
  npm: {
    name: "npm",
    displayName: "npm",
    installCommand: "npm install",
    addCommand: "npm install",
    lockFile: "package-lock.json",
  },
  pnpm: {
    name: "pnpm",
    displayName: "pnpm",
    installCommand: "pnpm install",
    addCommand: "pnpm add",
    lockFile: "pnpm-lock.yaml",
  },
  yarn: {
    name: "yarn",
    displayName: "Yarn",
    installCommand: "yarn install",
    addCommand: "yarn add",
    lockFile: "yarn.lock",
  },
  bun: {
    name: "bun",
    displayName: "Bun",
    installCommand: "bun install",
    addCommand: "bun add",
    lockFile: "bun.lockb",
  },
};

const PackageManagerContext = createContext<PackageManagerContextValue | null>(
  null,
);

export function usePackageManager() {
  const context = useContext(PackageManagerContext);
  if (!context) {
    throw new Error(
      "usePackageManager must be used within PackageManagerProvider",
    );
  }
  return context;
}

export function usePackageManagerOptional() {
  return useContext(PackageManagerContext);
}

interface PackageManagerProviderProps {
  children: ReactNode;
  projectPath: string | null;
  teamSlug?: string | null;
  projectSlug?: string | null;
}

/**
 * Detect package manager from lock files in the project directory
 */
async function detectPackageManagerFromLockFiles(
  projectPath: string,
): Promise<PackageManager | null> {
  try {
    const { exists } = await import("@tauri-apps/plugin-fs");

    // Check in order of preference: bun, pnpm, yarn, npm
    const lockFiles: Array<{ file: string; pm: PackageManager }> = [
      { file: "bun.lockb", pm: "bun" },
      { file: "pnpm-lock.yaml", pm: "pnpm" },
      { file: "yarn.lock", pm: "yarn" },
      { file: "package-lock.json", pm: "npm" },
    ];

    for (const { file, pm } of lockFiles) {
      const lockFileExists = await exists(`${projectPath}/${file}`, {
        baseDir: null as any,
      });

      if (lockFileExists) {
        return pm;
      }
    }

    return null;
  } catch (error) {
    console.error("Error detecting package manager:", error);
    return null;
  }
}

export function PackageManagerProvider({
  children,
  projectPath,
  teamSlug,
  projectSlug,
}: PackageManagerProviderProps) {
  // Create a project-scoped storage key
  const storageKey =
    teamSlug && projectSlug
      ? `${STORAGE_KEY_PREFIX}:${teamSlug}/${projectSlug}`
      : null;

  const [packageManager, setPackageManagerState] =
    useState<PackageManager>("npm");
  const [detectedPackageManager, setDetectedPackageManager] =
    useState<PackageManager | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  // Load saved preference from storage
  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey) as PackageManager | null;
      if (saved && CONFIGS[saved]) {
        setPackageManagerState(saved);
      }
    }
  }, [storageKey]);

  // Save preference to storage when it changes
  useEffect(() => {
    if (storageKey && packageManager) {
      localStorage.setItem(storageKey, packageManager);
    }
  }, [packageManager, storageKey]);

  // Auto-detect package manager when project path changes
  const detectPackageManager = useCallback(async () => {
    if (!projectPath) {
      setDetectedPackageManager(null);
      return;
    }

    setIsDetecting(true);
    try {
      const detected = await detectPackageManagerFromLockFiles(projectPath);
      setDetectedPackageManager(detected);

      // If we haven't set a preference yet, use the detected one
      if (detected && !localStorage.getItem(storageKey || "")) {
        setPackageManagerState(detected);
      }
    } catch (error) {
      console.error("Error detecting package manager:", error);
    } finally {
      setIsDetecting(false);
    }
  }, [projectPath, storageKey]);

  // Detect on mount and when project path changes
  useEffect(() => {
    detectPackageManager();
  }, [detectPackageManager]);

  const setPackageManager = useCallback((pm: PackageManager) => {
    setPackageManagerState(pm);
  }, []);

  const getInstallCommand = useCallback(
    (packageName: string) => {
      const config = CONFIGS[packageManager];
      return `${config.addCommand} ${packageName}`;
    },
    [packageManager],
  );

  const config = CONFIGS[packageManager];

  const value: PackageManagerContextValue = {
    packageManager,
    setPackageManager,
    detectedPackageManager,
    isDetecting,
    detectPackageManager,
    getInstallCommand,
    config,
  };

  return (
    <PackageManagerContext.Provider value={value}>
      {children}
    </PackageManagerContext.Provider>
  );
}
