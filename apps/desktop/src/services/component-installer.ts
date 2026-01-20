/**
 * Component Installer Service
 * Handles installing Convex components via npm/pnpm/yarn/bun
 */

import { Command } from "@tauri-apps/plugin-shell";
import type { PackageManager } from "../contexts/package-manager-context";

/**
 * Installation step status
 */
export type InstallStepStatus =
  | "pending"
  | "running"
  | "success"
  | "error"
  | "skipped";

/**
 * A step in the installation process
 */
export interface InstallStep {
  id: string;
  name: string;
  description: string;
  status: InstallStepStatus;
  output?: string;
  error?: string;
}

/**
 * Installation options
 */
export interface InstallOptions {
  /** npm package name */
  packageName: string;
  /** Component ID (for config naming) */
  componentId: string;
  /** Project directory path */
  projectPath: string;
  /** Package manager to use */
  packageManager: PackageManager;
  /** Whether to auto-configure convex.config.ts */
  autoConfigureConfig: boolean;
  /** Callback for step updates */
  onStepUpdate?: (steps: InstallStep[]) => void;
}

/**
 * Installation result
 */
export interface InstallResult {
  success: boolean;
  steps: InstallStep[];
  error?: string;
}

/**
 * Get the install/add command for a package manager
 */
function getAddCommand(pm: PackageManager): { cmd: string; args: string[] } {
  switch (pm) {
    case "npm":
      return { cmd: "npm", args: ["install"] };
    case "pnpm":
      return { cmd: "pnpm", args: ["add"] };
    case "yarn":
      return { cmd: "yarn", args: ["add"] };
    case "bun":
      return { cmd: "bun", args: ["add"] };
    default:
      return { cmd: "npm", args: ["install"] };
  }
}

/**
 * Run a shell command and return the output
 */
async function runCommand(
  cmd: string,
  args: string[],
  cwd: string,
): Promise<{ success: boolean; stdout: string; stderr: string }> {
  try {
    // For package managers, run through shell to ensure they're found in PATH
    // This is especially important for pnpm which might be installed via npm/pnpm itself
    // and may not be in the direct PATH that Tauri sees
    const packageManagers = ["pnpm", "npm", "yarn", "bun", "npx"];
    const shouldUseShell = packageManagers.includes(cmd);
    
    if (shouldUseShell) {
      // Use shell with -c flag to run the command
      // This ensures the shell's PATH (including ~/.local/bin, etc.) is used
      // Try common shells in order: zsh (macOS default), bash, sh
      // Use command names (not paths) as they're configured in Tauri capabilities
      const shells = ["zsh", "bash", "sh"];
      let lastError: Error | null = null;
      
      for (const shell of shells) {
        try {
          const fullCommand = `${cmd} ${args.join(" ")}`;
          const command = Command.create(shell, ["-c", fullCommand], { cwd });
          const output = await command.execute();

          return {
            success: output.code === 0,
            stdout: output.stdout,
            stderr: output.stderr,
          };
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          // Try next shell
          continue;
        }
      }
      
      // If all shells failed, throw the last error
      throw lastError || new Error("Failed to execute command through any shell");
    } else {
      // Direct command execution for other commands
      const command = Command.create(cmd, args, { cwd });
      const output = await command.execute();

      return {
        success: output.code === 0,
        stdout: output.stdout,
        stderr: output.stderr,
      };
    }
  } catch (error) {
    return {
      success: false,
      stdout: "",
      stderr: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check if a package manager is available
 */
export async function isPackageManagerAvailable(
  pm: PackageManager,
): Promise<boolean> {
  try {
    const result = await runCommand(pm, ["--version"], process.cwd?.() || "/");
    return result.success;
  } catch {
    return false;
  }
}

/**
 * Install a Convex component
 */
export async function installComponent(
  options: InstallOptions,
): Promise<InstallResult> {
  const {
    packageName,
    projectPath,
    packageManager,
    autoConfigureConfig,
    onStepUpdate,
  } = options;

  const steps: InstallStep[] = [
    {
      id: "install-package",
      name: "Install Package",
      description: `Installing ${packageName}...`,
      status: "pending",
    },
  ];

  if (autoConfigureConfig) {
    steps.push({
      id: "update-config",
      name: "Update Config",
      description: "Updating convex.config.ts...",
      status: "pending",
    });
  }

  const updateStep = (stepId: string, updates: Partial<InstallStep>) => {
    const stepIndex = steps.findIndex((s) => s.id === stepId);
    if (stepIndex !== -1) {
      steps[stepIndex] = { ...steps[stepIndex], ...updates };
      onStepUpdate?.([...steps]);
    }
  };

  try {
    // Step 1: Install the npm package
    updateStep("install-package", { status: "running" });

    const { cmd, args } = getAddCommand(packageManager);
    const installResult = await runCommand(
      cmd,
      [...args, packageName],
      projectPath,
    );

    if (!installResult.success) {
      updateStep("install-package", {
        status: "error",
        error: installResult.stderr || "Installation failed",
        output: installResult.stdout,
      });

      return {
        success: false,
        steps,
        error: `Failed to install ${packageName}: ${installResult.stderr}`,
      };
    }

    updateStep("install-package", {
      status: "success",
      output: installResult.stdout,
    });

    // Step 2: Update convex.config.ts (if enabled)
    if (autoConfigureConfig) {
      updateStep("update-config", { status: "running" });

      try {
        // Import the config updater dynamically to avoid circular deps
        const { updateConvexConfig } = await import("./convex-config-updater");
        const configResult = await updateConvexConfig(
          projectPath,
          options.componentId,
          packageName,
        );

        if (!configResult.success) {
          updateStep("update-config", {
            status: "error",
            error: configResult.error || "Failed to update config",
          });

          // Don't fail the entire install if config update fails
          // The package is still installed
          return {
            success: true,
            steps,
            error: `Package installed but config update failed: ${configResult.error}`,
          };
        }

        updateStep("update-config", {
          status: "success",
          output: configResult.message,
        });
      } catch (error) {
        updateStep("update-config", {
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        });

        return {
          success: true,
          steps,
          error: `Package installed but config update failed: ${error}`,
        };
      }
    }

    return {
      success: true,
      steps,
    };
  } catch (error) {
    return {
      success: false,
      steps,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get the npm package name formatted for the component ID
 * e.g., "@convex-dev/rate-limiter" -> "rateLimiter"
 */
export function getComponentVarName(componentId: string): string {
  // Convert kebab-case to camelCase
  return componentId
    .split("-")
    .map((part, index) =>
      index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join("");
}

/**
 * Get the import path for a component's config
 * e.g., "@convex-dev/rate-limiter" -> "@convex-dev/rate-limiter/convex.config.js"
 */
export function getComponentConfigImport(npmPackage: string): string {
  return `${npmPackage}/convex.config.js`;
}
