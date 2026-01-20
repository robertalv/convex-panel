/**
 * Convex Config Updater Service
 * Handles updating convex.config.ts to add component imports and usage
 */

import { exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import {
  getComponentVarName,
  getComponentConfigImport,
} from "./component-installer";

export interface UpdateConfigResult {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Find the convex config file path
 */
async function findConvexConfigPath(
  projectPath: string,
): Promise<string | null> {
  const possiblePaths = [
    `${projectPath}/convex/convex.config.ts`,
    `${projectPath}/convex/convex.config.js`,
  ];

  for (const path of possiblePaths) {
    try {
      const fileExists = await exists(path, { baseDir: null as any });
      if (fileExists) {
        return path;
      }
    } catch {
      // Continue to next path
    }
  }

  return null;
}

/**
 * Check if a component is already imported in the config
 */
function isComponentAlreadyImported(
  content: string,
  npmPackage: string,
): boolean {
  // Check for various import patterns
  const patterns = [
    new RegExp(`from\\s+["']${escapeRegex(npmPackage)}/convex\\.config`),
    new RegExp(`from\\s+["']${escapeRegex(npmPackage)}["']`),
    new RegExp(`require\\(["']${escapeRegex(npmPackage)}`),
  ];

  return patterns.some((pattern) => pattern.test(content));
}

/**
 * Check if app.use() is already called for this component
 */
function isComponentAlreadyUsed(content: string, varName: string): boolean {
  // Check for app.use(varName) or app.use(varName, ...)
  const pattern = new RegExp(`app\\.use\\(\\s*${escapeRegex(varName)}[\\s,)]`);
  return pattern.test(content);
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Generate the import statement for a component
 */
function generateImportStatement(varName: string, npmPackage: string): string {
  const importPath = getComponentConfigImport(npmPackage);
  return `import ${varName} from "${importPath}";`;
}

/**
 * Generate the app.use() statement for a component
 */
function generateUseStatement(varName: string): string {
  return `app.use(${varName});`;
}

/**
 * Update the convex.config.ts file to add component import and usage
 */
export async function updateConvexConfig(
  projectPath: string,
  componentId: string,
  npmPackage: string,
): Promise<UpdateConfigResult> {
  try {
    // Find the config file
    const configPath = await findConvexConfigPath(projectPath);
    if (!configPath) {
      return {
        success: false,
        error:
          "Could not find convex.config.ts or convex.config.js. Please create it first.",
      };
    }

    // Read the current content
    const content = await readTextFile(configPath, { baseDir: null as any });
    const varName = getComponentVarName(componentId);

    // Check if already imported
    if (isComponentAlreadyImported(content, npmPackage)) {
      return {
        success: true,
        message: `Component ${componentId} is already imported in convex.config`,
      };
    }

    // Check if already used
    if (isComponentAlreadyUsed(content, varName)) {
      return {
        success: true,
        message: `Component ${componentId} is already configured in convex.config`,
      };
    }

    // Generate the new statements
    const importStatement = generateImportStatement(varName, npmPackage);
    const useStatement = generateUseStatement(varName);

    // Update the content
    let updatedContent = content;

    // 1. Add import statement after the last import or at the top
    const lastImportMatch = content.match(/^import\s+.*?;?\s*$/gm);
    if (lastImportMatch && lastImportMatch.length > 0) {
      // Find the position after the last import
      const lastImport = lastImportMatch[lastImportMatch.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertPosition = lastImportIndex + lastImport.length;

      updatedContent =
        content.slice(0, insertPosition) +
        "\n" +
        importStatement +
        content.slice(insertPosition);
    } else {
      // No imports found, add at the top
      updatedContent = importStatement + "\n\n" + content;
    }

    // 2. Add app.use() before "export default app"
    const exportDefaultPattern = /export\s+default\s+app\s*;?/;
    const exportMatch = updatedContent.match(exportDefaultPattern);

    if (exportMatch && exportMatch.index !== undefined) {
      const insertPosition = exportMatch.index;
      updatedContent =
        updatedContent.slice(0, insertPosition) +
        useStatement +
        "\n" +
        updatedContent.slice(insertPosition);
    } else {
      // No "export default app" found, try to find just "export default"
      const genericExportPattern = /export\s+default/;
      const genericMatch = updatedContent.match(genericExportPattern);

      if (genericMatch && genericMatch.index !== undefined) {
        const insertPosition = genericMatch.index;
        updatedContent =
          updatedContent.slice(0, insertPosition) +
          useStatement +
          "\n" +
          updatedContent.slice(insertPosition);
      } else {
        // Append at the end as a fallback
        updatedContent =
          updatedContent.trimEnd() + "\n\n" + useStatement + "\n";
      }
    }

    // Write the updated content
    await writeTextFile(configPath, updatedContent, { baseDir: null as any });

    return {
      success: true,
      message: `Added ${varName} to ${configPath.split("/").pop()}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Generate manual instructions for adding a component to convex.config.ts
 */
export function generateManualInstructions(
  componentId: string,
  npmPackage: string,
): string {
  const varName = getComponentVarName(componentId);
  const importPath = getComponentConfigImport(npmPackage);

  return `
Add the following to your convex/convex.config.ts:

1. Add this import at the top of the file:
   import ${varName} from "${importPath}";

2. Add this line before "export default app;":
   app.use(${varName});

Example:
\`\`\`typescript
import { defineApp } from "convex/server";
import ${varName} from "${importPath}";

const app = defineApp();
app.use(${varName});

export default app;
\`\`\`
`.trim();
}
