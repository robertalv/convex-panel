/**
 * Local Schema Hook
 * Reads and parses the local schema.ts file from the project directory
 * Watches for file changes and auto-reloads when schema is updated
 */

import { useState, useEffect, useCallback } from "react";
import { readTextFile, exists } from "@tauri-apps/plugin-fs";
import { toast } from "sonner";
import type { SchemaJSON, TableDefinitionJSON, ValidatorJSON } from "../types";
import { getSchemaFilePath } from "../utils/code-generator";
import { useFileWatcher } from "./useFileWatcher";

export interface LocalSchemaState {
  /** The parsed schema JSON (if successful) */
  schema: SchemaJSON | null;
  /** Raw file content */
  rawContent: string | null;
  /** Whether the schema file exists */
  exists: boolean;
  /** Whether we're currently loading */
  loading: boolean;
  /** Error message if parsing failed */
  error: string | null;
  /** Path to the schema file */
  schemaPath: string | null;
  /** Last time the file was read */
  lastRead: number | null;
}

export interface UseLocalSchemaReturn extends LocalSchemaState {
  /** Refresh the local schema */
  refresh: () => Promise<void>;
  /** Check if the project path is configured */
  hasProjectPath: boolean;
}

interface UseLocalSchemaOptions {
  /** Project path (parent of convex/ directory) */
  projectPath: string | null;
  /** Enable file watching for auto-reload (default: true) */
  enableWatch?: boolean;
  /** Show toast notifications on schema changes (default: true) */
  showToast?: boolean;
}

/**
 * Hook to read and parse the local schema.ts file
 * Watches for file changes and automatically reloads
 */
export function useLocalSchema(
  {
    projectPath,
    enableWatch = true,
    showToast = true,
  }: UseLocalSchemaOptions = { projectPath: null },
): UseLocalSchemaReturn {
  const [state, setState] = useState<LocalSchemaState>({
    schema: null,
    rawContent: null,
    exists: false,
    loading: false,
    error: null,
    schemaPath: null,
    lastRead: null,
  });

  const loadSchema = useCallback(async () => {
    if (!projectPath) {
      setState((s) => ({
        ...s,
        loading: false,
        error: "No project path configured",
        schema: null,
        rawContent: null,
        exists: false,
      }));
      return;
    }

    const schemaPath = getSchemaFilePath(projectPath);

    setState((s) => ({ ...s, loading: true, error: null, schemaPath }));

    try {
      // Check if the file exists
      const fileExists = await exists(schemaPath);
      if (!fileExists) {
        setState((s) => ({
          ...s,
          loading: false,
          exists: false,
          error: "schema.ts file not found",
          schema: null,
          rawContent: null,
        }));
        return;
      }

      // Read the file content
      const content = await readTextFile(schemaPath);

      // Parse the TypeScript content to extract schema
      const schema = parseTypeScriptSchema(content);

      setState({
        schema,
        rawContent: content,
        exists: true,
        loading: false,
        error: null,
        schemaPath,
        lastRead: Date.now(),
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : String(err),
        schema: null,
      }));
    }
  }, [projectPath]);

  // Load on mount and when project path changes
  useEffect(() => {
    loadSchema();
  }, [loadSchema]);

  // Watch for file changes
  useFileWatcher({
    path: enableWatch && projectPath ? getSchemaFilePath(projectPath) : null,
    recursive: false,
    onFileChange: (event) => {
      console.log("[useLocalSchema] File change detected:", event);
      // Auto-reload schema when file changes
      loadSchema().then(() => {
        if (showToast) {
          toast.success("Schema file updated");
        }
      });
    },
  });

  return {
    ...state,
    refresh: loadSchema,
    hasProjectPath: !!projectPath,
  };
}

// ============================================================================
// TypeScript Schema Parser
// ============================================================================

/**
 * Parse a schema.ts file content and extract the schema structure
 * This is a best-effort parser that handles common Convex schema patterns
 */
export function parseTypeScriptSchema(content: string): SchemaJSON {
  const tables: TableDefinitionJSON[] = [];
  let schemaValidation = true;

  // Remove comments for easier parsing
  const cleanContent = removeComments(content);

  // Check for schemaValidation setting
  const validationMatch = cleanContent.match(
    /schemaValidation\s*:\s*(true|false)/,
  );
  if (validationMatch) {
    schemaValidation = validationMatch[1] === "true";
  }

  // Find all table definitions in defineSchema({ ... })
  const tableMatches = findTableDefinitions(cleanContent);

  for (const { tableName, tableContent } of tableMatches) {
    const table = parseTableDefinition(tableName, tableContent);
    tables.push(table);
  }

  return { tables, schemaValidation };
}

/**
 * Remove single-line and multi-line comments
 */
function removeComments(content: string): string {
  // Remove multi-line comments
  let result = content.replace(/\/\*[\s\S]*?\*\//g, "");
  // Remove single-line comments (but not in strings)
  result = result.replace(/\/\/.*$/gm, "");
  return result;
}

/**
 * Find all table definitions in the schema
 */
function findTableDefinitions(
  content: string,
): Array<{ tableName: string; tableContent: string }> {
  const tables: Array<{ tableName: string; tableContent: string }> = [];

  // Pattern for defineSchema({ tableName: defineTable(...) })
  // This handles various formats:
  // - tableName: defineTable(...)
  // - "tableName": defineTable(...)
  // - 'tableName': defineTable(...)
  const tablePattern = /["']?(\w+)["']?\s*:\s*defineTable\s*\(/g;

  let match;
  while ((match = tablePattern.exec(content)) !== null) {
    const tableName = match[1];
    const startIndex = match.index + match[0].length;

    // Find the matching closing paren, accounting for nested parens
    const tableContent = extractBalanced(content, startIndex - 1, "(", ")");
    if (tableContent) {
      tables.push({ tableName, tableContent });
    }
  }

  return tables;
}

/**
 * Extract content between balanced delimiters
 */
function extractBalanced(
  content: string,
  startIndex: number,
  openChar: string,
  closeChar: string,
): string | null {
  let depth = 0;
  let inString = false;
  let stringChar = "";
  let start = -1;

  for (let i = startIndex; i < content.length; i++) {
    const char = content[i];
    const prevChar = i > 0 ? content[i - 1] : "";

    // Handle string literals
    if (!inString && (char === '"' || char === "'" || char === "`")) {
      inString = true;
      stringChar = char;
      continue;
    }

    if (inString && char === stringChar && prevChar !== "\\") {
      inString = false;
      continue;
    }

    if (inString) continue;

    if (char === openChar) {
      if (depth === 0) start = i;
      depth++;
    } else if (char === closeChar) {
      depth--;
      if (depth === 0 && start !== -1) {
        return content.substring(start + 1, i);
      }
    }
  }

  return null;
}

/**
 * Parse a single table definition
 */
function parseTableDefinition(
  tableName: string,
  tableContent: string,
): TableDefinitionJSON {
  const table: TableDefinitionJSON = {
    tableName,
    indexes: [],
    searchIndexes: [],
    vectorIndexes: [],
    documentType: null,
  };

  // Parse the document type (the object passed to defineTable)
  const docType = parseDocumentType(tableContent);
  if (docType) {
    table.documentType = docType;
  }

  // Parse indexes
  table.indexes = parseIndexes(tableContent);
  table.searchIndexes = parseSearchIndexes(tableContent);
  table.vectorIndexes = parseVectorIndexes(tableContent);

  return table;
}

/**
 * Parse the document type from table content
 */
function parseDocumentType(content: string): ValidatorJSON | null {
  // Find the object literal that defines the document type
  // Pattern: { field: v.string(), ... }
  const objectMatch = content.match(/^\s*\{([^}]*)\}/);
  if (!objectMatch) {
    return null;
  }

  const fields = parseFieldDefinitions(objectMatch[1]);
  if (Object.keys(fields).length === 0) {
    return null;
  }

  return {
    type: "object",
    value: fields,
  };
}

/**
 * Parse field definitions from an object literal
 */
function parseFieldDefinitions(
  content: string,
): Record<string, { fieldType: ValidatorJSON; optional: boolean }> {
  const fields: Record<
    string,
    { fieldType: ValidatorJSON; optional: boolean }
  > = {};

  // Pattern: fieldName: v.type() or fieldName: v.optional(v.type())
  const fieldPattern = /(\w+)\s*:\s*(v\.[\w.()[\]<>,\s"'`]+)/g;

  let match;
  while ((match = fieldPattern.exec(content)) !== null) {
    const fieldName = match[1];
    const validatorExpr = match[2];

    const { validator, optional } = parseValidatorExpression(validatorExpr);
    if (validator) {
      fields[fieldName] = { fieldType: validator, optional };
    }
  }

  return fields;
}

/**
 * Parse a validator expression like v.string() or v.optional(v.number())
 */
function parseValidatorExpression(expr: string): {
  validator: ValidatorJSON | null;
  optional: boolean;
} {
  let optional = false;
  let validatorExpr = expr.trim();

  // Check for v.optional(...)
  if (validatorExpr.startsWith("v.optional(")) {
    optional = true;
    const inner = extractBalanced(
      validatorExpr,
      validatorExpr.indexOf("("),
      "(",
      ")",
    );
    if (inner) {
      validatorExpr = inner.trim();
    }
  }

  const validator = parseValidator(validatorExpr);
  return { validator, optional };
}

/**
 * Parse a single validator type
 */
function parseValidator(expr: string): ValidatorJSON | null {
  const trimmed = expr.trim();

  // Basic types
  if (trimmed === "v.string()" || trimmed.startsWith("v.string()")) {
    return { type: "string" };
  }
  if (trimmed === "v.number()" || trimmed.startsWith("v.number()")) {
    return { type: "number" };
  }
  if (trimmed === "v.boolean()" || trimmed.startsWith("v.boolean()")) {
    return { type: "boolean" };
  }
  if (trimmed === "v.null()" || trimmed.startsWith("v.null()")) {
    return { type: "null" };
  }
  if (trimmed === "v.bigint()" || trimmed.startsWith("v.bigint()")) {
    return { type: "bigint" };
  }
  if (trimmed === "v.bytes()" || trimmed.startsWith("v.bytes()")) {
    return { type: "bytes" };
  }
  if (trimmed === "v.any()" || trimmed.startsWith("v.any()")) {
    return { type: "any" };
  }

  // v.id("tableName")
  const idMatch = trimmed.match(/v\.id\s*\(\s*["'`](\w+)["'`]\s*\)/);
  if (idMatch) {
    return { type: "id", tableName: idMatch[1] };
  }

  // v.literal(value)
  const literalMatch = trimmed.match(/v\.literal\s*\(\s*(.+)\s*\)/);
  if (literalMatch) {
    try {
      // Try to parse the literal value
      const value = JSON.parse(literalMatch[1].replace(/'/g, '"'));
      return { type: "literal", value };
    } catch {
      return { type: "literal", value: literalMatch[1] };
    }
  }

  // v.array(v.type())
  const arrayMatch = trimmed.match(/v\.array\s*\(/);
  if (arrayMatch) {
    const inner = extractBalanced(trimmed, trimmed.indexOf("("), "(", ")");
    if (inner) {
      const innerValidator = parseValidator(inner.trim());
      if (innerValidator) {
        return { type: "array", value: innerValidator };
      }
    }
    return { type: "array", value: { type: "any" } };
  }

  // v.object({ ... })
  if (trimmed.startsWith("v.object(")) {
    const inner = extractBalanced(trimmed, trimmed.indexOf("("), "(", ")");
    if (inner) {
      const objectContent = extractBalanced(
        inner,
        inner.indexOf("{") - 1,
        "{",
        "}",
      );
      if (objectContent) {
        const fields = parseFieldDefinitions(objectContent);
        return { type: "object", value: fields };
      }
    }
    return { type: "object", value: {} };
  }

  // v.union(v.type1(), v.type2(), ...)
  if (trimmed.startsWith("v.union(")) {
    const inner = extractBalanced(trimmed, trimmed.indexOf("("), "(", ")");
    if (inner) {
      const unionTypes = parseUnionTypes(inner);
      return { type: "union", value: unionTypes };
    }
    return { type: "union", value: [] };
  }

  // v.record(keys, values)
  if (trimmed.startsWith("v.record(")) {
    const inner = extractBalanced(trimmed, trimmed.indexOf("("), "(", ")");
    if (inner) {
      // Record takes (keys, values) - simplified parsing
      return {
        type: "record",
        keys: { type: "string" },
        values: { fieldType: { type: "any" }, optional: false },
      };
    }
  }

  // Default: treat as any
  return { type: "any" };
}

/**
 * Parse union type arguments
 */
function parseUnionTypes(content: string): ValidatorJSON[] {
  const types: ValidatorJSON[] = [];
  const parts = splitTopLevel(content, ",");

  for (const part of parts) {
    const validator = parseValidator(part.trim());
    if (validator) {
      types.push(validator);
    }
  }

  return types;
}

/**
 * Split string by delimiter, but only at the top level (not inside parens)
 */
function splitTopLevel(content: string, delimiter: string): string[] {
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  let inString = false;
  let stringChar = "";

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const prevChar = i > 0 ? content[i - 1] : "";

    // Handle strings
    if (!inString && (char === '"' || char === "'" || char === "`")) {
      inString = true;
      stringChar = char;
      current += char;
      continue;
    }

    if (inString && char === stringChar && prevChar !== "\\") {
      inString = false;
      current += char;
      continue;
    }

    if (inString) {
      current += char;
      continue;
    }

    // Track depth
    if (char === "(" || char === "{" || char === "[") {
      depth++;
    } else if (char === ")" || char === "}" || char === "]") {
      depth--;
    }

    // Split on delimiter at top level
    if (depth === 0 && char === delimiter) {
      if (current.trim()) {
        parts.push(current.trim());
      }
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

/**
 * Parse regular indexes
 */
function parseIndexes(
  content: string,
): Array<{ indexDescriptor: string; fields: string[] }> {
  const indexes: Array<{ indexDescriptor: string; fields: string[] }> = [];

  // Pattern: .index("name", ["field1", "field2"])
  const indexPattern = /\.index\s*\(\s*["'`](\w+)["'`]\s*,\s*\[([^\]]*)\]/g;

  let match;
  while ((match = indexPattern.exec(content)) !== null) {
    const indexName = match[1];
    const fieldsStr = match[2];

    // Parse field names
    const fields = parseArrayOfStrings(fieldsStr);
    if (fields.length > 0) {
      indexes.push({ indexDescriptor: indexName, fields });
    }
  }

  return indexes;
}

/**
 * Parse search indexes
 */
function parseSearchIndexes(content: string): Array<{
  indexDescriptor: string;
  searchField: string;
  filterFields: string[];
}> {
  const indexes: Array<{
    indexDescriptor: string;
    searchField: string;
    filterFields: string[];
  }> = [];

  // Pattern: .searchIndex("name", { searchField: "field", filterFields: [...] })
  const searchPattern =
    /\.searchIndex\s*\(\s*["'`](\w+)["'`]\s*,\s*\{([^}]+)\}/g;

  let match;
  while ((match = searchPattern.exec(content)) !== null) {
    const indexName = match[1];
    const configStr = match[2];

    // Extract searchField
    const searchFieldMatch = configStr.match(
      /searchField\s*:\s*["'`](\w+)["'`]/,
    );
    const searchField = searchFieldMatch ? searchFieldMatch[1] : "";

    // Extract filterFields
    const filterFieldsMatch = configStr.match(
      /filterFields\s*:\s*\[([^\]]*)\]/,
    );
    const filterFields = filterFieldsMatch
      ? parseArrayOfStrings(filterFieldsMatch[1])
      : [];

    if (searchField) {
      indexes.push({
        indexDescriptor: indexName,
        searchField,
        filterFields,
      });
    }
  }

  return indexes;
}

/**
 * Parse vector indexes
 */
function parseVectorIndexes(content: string): Array<{
  indexDescriptor: string;
  vectorField: string;
  dimensions: number;
  filterFields: string[];
}> {
  const indexes: Array<{
    indexDescriptor: string;
    vectorField: string;
    dimensions: number;
    filterFields: string[];
  }> = [];

  // Pattern: .vectorIndex("name", { vectorField: "field", dimensions: 1536, filterFields: [...] })
  const vectorPattern =
    /\.vectorIndex\s*\(\s*["'`](\w+)["'`]\s*,\s*\{([^}]+)\}/g;

  let match;
  while ((match = vectorPattern.exec(content)) !== null) {
    const indexName = match[1];
    const configStr = match[2];

    // Extract vectorField
    const vectorFieldMatch = configStr.match(
      /vectorField\s*:\s*["'`](\w+)["'`]/,
    );
    const vectorField = vectorFieldMatch ? vectorFieldMatch[1] : "";

    // Extract dimensions
    const dimensionsMatch = configStr.match(/dimensions\s*:\s*(\d+)/);
    const dimensions = dimensionsMatch ? parseInt(dimensionsMatch[1], 10) : 0;

    // Extract filterFields
    const filterFieldsMatch = configStr.match(
      /filterFields\s*:\s*\[([^\]]*)\]/,
    );
    const filterFields = filterFieldsMatch
      ? parseArrayOfStrings(filterFieldsMatch[1])
      : [];

    if (vectorField && dimensions > 0) {
      indexes.push({
        indexDescriptor: indexName,
        vectorField,
        dimensions,
        filterFields,
      });
    }
  }

  return indexes;
}

/**
 * Parse an array of string literals
 */
function parseArrayOfStrings(content: string): string[] {
  const strings: string[] = [];
  const pattern = /["'`](\w+)["'`]/g;

  let match;
  while ((match = pattern.exec(content)) !== null) {
    strings.push(match[1]);
  }

  return strings;
}

export default useLocalSchema;
