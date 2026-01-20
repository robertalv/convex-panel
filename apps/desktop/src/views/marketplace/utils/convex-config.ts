/**
 * Extract component package names from convex.config.ts
 * Parses imports like: import x from "@package/name/convex.config"
 * Returns the package name (e.g., "@package/name")
 */
export function extractComponentPackagesFromConfig(
  configContent: string,
): Set<string> {
  const packages = new Set<string>();

  // Match import statements that import from packages with /convex.config
  // Examples:
  // - import ossStats from "@erquhart/convex-oss-stats/convex.config";
  // - import loops from "@devwithbobby/loops/convex.config";
  // - import { something } from "@package/convex.config.js";
  // - import convexPanel from "../../convex-component/src/component/convex.config.js";
  // This regex matches:
  // - import keyword
  // - any import specifiers (default, named, or mixed) with optional whitespace
  // - from keyword with optional whitespace
  // - quoted string (single or double quotes) containing /convex.config
  const importRegex =
    /import\s+(?:[\w\s{},*]+\s+)?from\s+["']([^"']+\/convex\.config(?:\.(?:js|ts|mjs))?)["']/g;

  let match;
  while ((match = importRegex.exec(configContent)) !== null) {
    const importPath = match[1];

    // Skip relative imports (local components)
    // These start with . or / and are not npm packages
    if (importPath.startsWith(".") || importPath.startsWith("/")) {
      continue;
    }

    // Extract package name by removing /convex.config and any extension
    // e.g., "@erquhart/convex-oss-stats/convex.config" -> "@erquhart/convex-oss-stats"
    // e.g., "@convex-dev/agent/convex.config.js" -> "@convex-dev/agent"
    const packageName = importPath.replace(
      /\/convex\.config(?:\.(?:js|ts|mjs))?$/,
      "",
    );

    // Only add if it looks like an npm package (starts with @ or doesn't contain /)
    if (
      packageName &&
      (packageName.startsWith("@") || !packageName.includes("/"))
    ) {
      packages.add(packageName);
    }
  }

  return packages;
}

/**
 * Read convex.config.ts and extract installed component packages
 */
export async function getInstalledComponentsFromConfig(
  projectPath: string,
): Promise<Set<string>> {
  try {
    const { readTextFile, exists } = await import("@tauri-apps/plugin-fs");

    // Try convex/config.ts first (most common)
    // Also check for monorepo structure (packages/*/convex/convex.config.ts)
    const configPaths = [
      `${projectPath}/convex/convex.config.ts`,
      `${projectPath}/convex/convex.config.js`,
      `${projectPath}/convex.config.ts`,
      `${projectPath}/convex.config.js`,
      // Monorepo patterns
      `${projectPath}/packages/*/convex/convex.config.ts`,
      `${projectPath}/packages/*/convex/convex.config.js`,
    ];

    // First, try direct paths
    for (const configPath of configPaths.slice(0, 4)) {
      const configExists = await exists(configPath, {
        baseDir: null as unknown as undefined,
      });

      if (configExists) {
        const content = await readTextFile(configPath, {
          baseDir: null as unknown as undefined,
        });
        const packages = extractComponentPackagesFromConfig(content);
        console.log(
          `[Marketplace] Found convex.config.ts at ${configPath}, extracted packages:`,
          Array.from(packages),
        );
        return packages;
      }
    }

    // Try to find convex.config.ts in packages/*/convex/ directories
    try {
      const { readDir } = await import("@tauri-apps/plugin-fs");
      const packagesDir = `${projectPath}/packages`;
      const packagesExists = await exists(packagesDir, {
        baseDir: null as unknown as undefined,
      });

      if (packagesExists) {
        const entries = await readDir(packagesDir, {
          baseDir: null as unknown as undefined,
        });

        for (const entry of entries) {
          if (entry.isDirectory) {
            const configPath = `${packagesDir}/${entry.name}/convex/convex.config.ts`;
            const configExists = await exists(configPath, {
              baseDir: null as unknown as undefined,
            });

            if (configExists) {
              const content = await readTextFile(configPath, {
                baseDir: null as unknown as undefined,
              });
              const packages = extractComponentPackagesFromConfig(content);
              console.log(
                `[Marketplace] Found convex.config.ts at ${configPath}, extracted packages:`,
                Array.from(packages),
              );
              return packages;
            }
          }
        }
      }
    } catch (dirError) {
      // Ignore directory read errors, continue
      console.debug("[Marketplace] Could not read packages directory:", dirError);
    }

    console.log(
      `[Marketplace] No convex.config.ts found in project: ${projectPath}`,
    );
    return new Set();
  } catch (error) {
    console.error("Error reading convex.config.ts:", error);
    return new Set();
  }
}
