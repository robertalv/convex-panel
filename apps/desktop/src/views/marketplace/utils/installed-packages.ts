import { getInstalledComponentsFromConfig } from "./convex-config";

/**
 * Check which packages are installed in the project
 * Checks both package.json dependencies and convex.config.ts components
 */
export async function getInstalledPackages(
  projectPath: string,
): Promise<Set<string>> {
  const packages = new Set<string>();

  try {
    const { readTextFile } = await import("@tauri-apps/plugin-fs");
    const packageJsonPath = `${projectPath}/package.json`;
    const content = await readTextFile(packageJsonPath, {
      baseDir: null as unknown as undefined,
    });
    const packageJson = JSON.parse(content);

    for (const dep of Object.keys(packageJson.dependencies || {})) {
      packages.add(dep);
    }
    for (const dep of Object.keys(packageJson.devDependencies || {})) {
      packages.add(dep);
    }
  } catch (error) {
    console.error("Error reading package.json:", error);
  }

  // Also check convex.config.ts for component packages
  const componentPackages = await getInstalledComponentsFromConfig(projectPath);
  componentPackages.forEach((pkg) => packages.add(pkg));

  return packages;
}
