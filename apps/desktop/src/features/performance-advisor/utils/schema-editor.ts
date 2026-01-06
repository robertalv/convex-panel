/**
 * Schema File Editor Utility
 * Reads and modifies the schema.ts file directly using Tauri FS plugin
 */

import { readTextFile, writeTextFile, exists } from "@tauri-apps/plugin-fs";
import type { WarningAction } from "../../schema-visualizer/types";
import {
  findTableDefinitionInSchema,
  insertIndexIntoSchema,
  getSchemaFilePath,
} from "../../schema-visualizer/utils/code-generator";

/**
 * Result of a schema file operation
 */
export interface SchemaEditResult {
  success: boolean;
  message: string;
  newContent?: string;
}

/**
 * Read the schema.ts file content
 */
export async function readSchemaFile(
  projectPath: string,
): Promise<string | null> {
  const schemaPath = getSchemaFilePath(projectPath);
  try {
    const content = await readTextFile(schemaPath);
    return content;
  } catch (err) {
    console.error("Failed to read schema file:", err);
    return null;
  }
}

/**
 * Write content to the schema.ts file
 */
export async function writeSchemaFile(
  projectPath: string,
  content: string,
): Promise<boolean> {
  const schemaPath = getSchemaFilePath(projectPath);
  try {
    await writeTextFile(schemaPath, content);
    return true;
  } catch (err) {
    console.error("Failed to write schema file:", err);
    return false;
  }
}

/**
 * Check if the schema file exists
 */
export async function schemaFileExists(projectPath: string): Promise<boolean> {
  const schemaPath = getSchemaFilePath(projectPath);
  try {
    return await exists(schemaPath);
  } catch (err) {
    console.error("Failed to check schema file:", err);
    return false;
  }
}

/**
 * Apply a fix action to the schema file
 */
export async function applyFixToSchema(
  projectPath: string,
  tableName: string,
  action: WarningAction,
): Promise<SchemaEditResult> {
  // Read current schema content
  const schemaContent = await readSchemaFile(projectPath);
  if (!schemaContent) {
    return {
      success: false,
      message:
        "Could not read schema.ts file. Make sure the project path is set correctly.",
    };
  }

  let newContent: string | null = null;

  switch (action.type) {
    case "add-index":
    case "add-compound-index":
      if (!action.codeSnippet) {
        return {
          success: false,
          message: "No code snippet available for this action.",
        };
      }
      newContent = insertIndexIntoSchema(
        schemaContent,
        tableName,
        action.codeSnippet,
      );
      break;

    case "remove-index":
      // For remove-index, we need to find and remove the index line
      if (!action.indexName) {
        return {
          success: false,
          message: "No index name specified for removal.",
        };
      }
      newContent = removeIndexFromSchema(
        schemaContent,
        tableName,
        action.indexName,
      );
      break;

    case "define-schema":
      // For define-schema, we add a new table definition
      if (!action.codeSnippet) {
        return {
          success: false,
          message: "No code snippet available for this action.",
        };
      }
      newContent = addTableToSchema(schemaContent, action.codeSnippet);
      break;

    default:
      return {
        success: false,
        message: `Action type "${action.type}" cannot be auto-applied.`,
      };
  }

  if (!newContent) {
    return {
      success: false,
      message: `Could not find table "${tableName}" in schema.ts. Make sure the table is defined in the schema.`,
    };
  }

  // Write the modified content
  const writeSuccess = await writeSchemaFile(projectPath, newContent);
  if (!writeSuccess) {
    return {
      success: false,
      message: "Failed to write changes to schema.ts file.",
    };
  }

  return {
    success: true,
    message: `Successfully applied fix to ${tableName} in schema.ts. Run \`npx convex dev\` to deploy changes.`,
    newContent,
  };
}

/**
 * Remove an index from the schema file
 */
function removeIndexFromSchema(
  schemaContent: string,
  _tableName: string,
  indexName: string,
): string | null {
  // Find patterns like: .index("indexName", [...])
  const indexPattern = new RegExp(
    `\\.index\\s*\\(\\s*["'\`]${escapeRegex(indexName)}["'\`]\\s*,\\s*\\[[^\\]]*\\]\\s*\\)`,
    "g",
  );

  // Check if the index exists in the schema
  if (!indexPattern.test(schemaContent)) {
    return null;
  }

  // Remove the index
  return schemaContent.replace(indexPattern, "");
}

/**
 * Add a new table to the schema
 */
function addTableToSchema(
  schemaContent: string,
  tableCode: string,
): string | null {
  // Find the defineSchema call and its tables object
  const schemaPattern = /defineSchema\s*\(\s*\{/;
  const match = schemaPattern.exec(schemaContent);

  if (!match) {
    return null;
  }

  // Find the position after the opening brace
  const insertPos = match.index + match[0].length;

  // Insert the new table definition
  const before = schemaContent.slice(0, insertPos);
  const after = schemaContent.slice(insertPos);

  return `${before}\n${tableCode}\n${after}`;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Get a preview of what changes will be made
 */
export function previewSchemaChange(
  schemaContent: string,
  tableName: string,
  action: WarningAction,
): { before: string; after: string } | null {
  const tableLocation = findTableDefinitionInSchema(schemaContent, tableName);
  if (!tableLocation) {
    return null;
  }

  const before = tableLocation.content;

  switch (action.type) {
    case "add-index":
    case "add-compound-index": {
      if (!action.codeSnippet) return null;
      const after = insertIndexIntoSchema(
        schemaContent,
        tableName,
        action.codeSnippet,
      );
      if (!after) return null;
      const afterLocation = findTableDefinitionInSchema(after, tableName);
      return {
        before,
        after: afterLocation?.content || before,
      };
    }
    default:
      return null;
  }
}

/**
 * Validate that the project path contains a valid Convex project
 */
export async function validateConvexProject(projectPath: string): Promise<{
  valid: boolean;
  hasSchema: boolean;
  message: string;
}> {
  try {
    // Check for convex directory
    const convexDirExists = await exists(`${projectPath}/convex`);

    if (!convexDirExists) {
      return {
        valid: false,
        hasSchema: false,
        message: "No 'convex' directory found in project.",
      };
    }

    // Check for schema.ts
    const hasSchema = await schemaFileExists(projectPath);

    return {
      valid: true,
      hasSchema,
      message: hasSchema
        ? "Valid Convex project with schema.ts"
        : "Valid Convex project, but no schema.ts found",
    };
  } catch (err) {
    return {
      valid: false,
      hasSchema: false,
      message: `Error validating project: ${err}`,
    };
  }
}
