import type { PackageManager } from "@convex-panel/registry";

/**
 * Detect package manager from lock files in the project directory
 */
export async function detectPackageManagerFromLockFiles(
  projectPath: string,
): Promise<PackageManager | null> {
  try {
    const { exists } = await import("@tauri-apps/plugin-fs");

    const lockFiles: Array<{ file: string; pm: PackageManager }> = [
      { file: "bun.lockb", pm: "bun" },
      { file: "pnpm-lock.yaml", pm: "pnpm" },
      { file: "yarn.lock", pm: "yarn" },
      { file: "package-lock.json", pm: "npm" },
    ];

    for (const { file, pm } of lockFiles) {
      const lockFileExists = await exists(`${projectPath}/${file}`, {
        baseDir: null as unknown as undefined,
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
