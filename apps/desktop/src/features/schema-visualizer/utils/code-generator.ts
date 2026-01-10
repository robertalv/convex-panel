/**
 * Code Generator Utility
 * Generates schema.ts code snippets for fixing health warnings
 */

import type {
  SchemaTable,
  SchemaField,
  WarningAction,
  ParsedSchema,
} from "../types";

/**
 * Generate complete schema.ts file content from a ParsedSchema
 * Used for unified diff view
 */
export function generateFullSchemaCode(schema: ParsedSchema): string {
  const lines: string[] = [
    'import { defineSchema, defineTable } from "convex/server";',
    'import { v } from "convex/values";',
    "",
    "export default defineSchema({",
  ];

  // Sort tables alphabetically for consistent output
  const sortedTables = Array.from(schema.tables.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  for (const table of sortedTables) {
    // Skip system tables
    if (table.isSystem) continue;
    lines.push(generateSchemaFromTable(table));
  }

  lines.push("});");
  lines.push(""); // trailing newline

  return lines.join("\n");
}

/**
 * Generate a valid index name from a field name
 */
export function generateIndexName(fieldName: string): string {
  // Convert camelCase or PascalCase to snake_case prefix
  const normalized = fieldName
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toLowerCase();
  return `by_${normalized}`;
}

/**
 * Generate a compound index name from multiple fields
 */
export function generateCompoundIndexName(fields: string[]): string {
  const normalized = fields
    .map((f) =>
      f
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .toLowerCase()
        .replace(/^_+/, ""),
    )
    .join("_and_");
  return `by_${normalized}`;
}

/**
 * Generate code snippet to add a simple index
 */
export function generateAddIndexCode(
  _tableName: string,
  fieldName: string,
  indexName?: string,
): string {
  const name = indexName || generateIndexName(fieldName);
  return `.index("${name}", ["${fieldName}"])`;
}

/**
 * Generate code snippet to add a compound index
 */
export function generateAddCompoundIndexCode(
  _tableName: string,
  fields: string[],
  indexName?: string,
): string {
  const name = indexName || generateCompoundIndexName(fields);
  const fieldsStr = fields.map((f) => `"${f}"`).join(", ");
  return `.index("${name}", [${fieldsStr}])`;
}

/**
 * Generate a basic schema stub for an untyped table
 */
export function generateSchemaStub(tableName: string): string {
  return `  ${tableName}: defineTable({
    // TODO: Add your field definitions here
    // Example:
    // name: v.string(),
    // createdAt: v.number(),
  }),`;
}

/**
 * Generate schema definition from parsed table data
 */
export function generateSchemaFromTable(table: SchemaTable): string {
  const lines: string[] = [];
  lines.push(`  ${table.name}: defineTable({`);

  for (const field of table.fields) {
    if (field.name === "_id" || field.name === "_creationTime") continue;
    if (field.name === "*" && field.type === "any") continue;

    const fieldCode = generateFieldCode(field);
    lines.push(`    ${field.name}: ${fieldCode},`);
  }

  lines.push(`  })`);

  // Add indexes
  for (const index of table.indexes) {
    if (index.name === "by_creation_time" || index.name === "by_id") continue;

    if (index.type === "db") {
      const fieldsStr = index.fields.map((f) => `"${f}"`).join(", ");
      lines.push(`    .index("${index.name}", [${fieldsStr}])`);
    } else if (index.type === "search" && index.searchField) {
      const filterFieldsStr =
        index.filterFields?.map((f) => `"${f}"`).join(", ") || "";
      lines.push(
        `    .searchIndex("${index.name}", { searchField: "${index.searchField}", filterFields: [${filterFieldsStr}] })`,
      );
    } else if (index.type === "vector" && index.vectorField) {
      const filterFieldsStr =
        index.filterFields?.map((f) => `"${f}"`).join(", ") || "";
      lines.push(
        `    .vectorIndex("${index.name}", { vectorField: "${index.vectorField}", dimensions: ${index.dimensions || 1536}, filterFields: [${filterFieldsStr}] })`,
      );
    }
  }

  lines.push(`,`);
  return lines.join("\n");
}

/**
 * Generate field type code
 */
function generateFieldCode(field: SchemaField): string {
  const optional = field.optional ? ".optional()" : "";

  switch (field.type) {
    case "id":
      return `v.id("${field.referencedTable || "unknown"}")${optional}`;

    case "string":
      return `v.string()${optional}`;

    case "number":
      return `v.number()${optional}`;

    case "boolean":
      return `v.boolean()${optional}`;

    case "bigint":
      return `v.int64()${optional}`;

    case "bytes":
      return `v.bytes()${optional}`;

    case "null":
      return `v.null()${optional}`;

    case "any":
      return `v.any()${optional}`;

    case "array":
      if (field.arrayElementType) {
        const elementCode = generateFieldCode({
          ...field.arrayElementType,
          optional: false,
        });
        return `v.array(${elementCode})${optional}`;
      }
      return `v.array(v.any())${optional}`;

    case "object":
      if (field.nestedFields && field.nestedFields.length > 0) {
        const nestedLines = field.nestedFields.map(
          (nf) => `      ${nf.name}: ${generateFieldCode(nf)}`,
        );
        return `v.object({\n${nestedLines.join(",\n")}\n    })${optional}`;
      }
      return `v.object({})${optional}`;

    case "union":
      if (field.unionTypes && field.unionTypes.length > 0) {
        const unionCodes = field.unionTypes.map((ut) =>
          generateFieldCode({ ...ut, optional: false }),
        );
        return `v.union(${unionCodes.join(", ")})${optional}`;
      }
      return `v.any()${optional}`;

    case "literal":
      if (typeof field.literalValue === "string") {
        return `v.literal("${field.literalValue}")${optional}`;
      }
      return `v.literal(${field.literalValue})${optional}`;

    default:
      return `v.any()${optional}`;
  }
}

/**
 * Create a WarningAction for adding an index
 */
export function createAddIndexAction(
  tableName: string,
  fieldName: string,
): WarningAction {
  const indexName = generateIndexName(fieldName);
  const codeSnippet = generateAddIndexCode(tableName, fieldName, indexName);

  return {
    type: "add-index",
    label: "Add Index",
    codeSnippet,
    description: `Add an index on "${fieldName}" to improve query performance when filtering or sorting by this field.`,
    canAutoApply: true,
    indexName,
    indexFields: [fieldName],
  };
}

/**
 * Create a WarningAction for adding a compound index
 */
export function createAddCompoundIndexAction(
  tableName: string,
  fields: string[],
): WarningAction {
  const indexName = generateCompoundIndexName(fields);
  const codeSnippet = generateAddCompoundIndexCode(
    tableName,
    fields,
    indexName,
  );

  return {
    type: "add-compound-index",
    label: "Add Compound Index",
    codeSnippet,
    description: `Add a compound index on [${fields.join(", ")}] to optimize queries that filter on these fields together.`,
    canAutoApply: true,
    indexName,
    indexFields: fields,
  };
}

/**
 * Create a WarningAction for defining a schema
 */
export function createDefineSchemaAction(tableName: string): WarningAction {
  const codeSnippet = generateSchemaStub(tableName);

  return {
    type: "define-schema",
    label: "Define Schema",
    codeSnippet,
    description: `Define a schema for "${tableName}" to enable type safety, validation, and better query performance.`,
    canAutoApply: false, // Requires manual field definition
  };
}

/**
 * Create a WarningAction for removing a redundant index
 */
export function createRemoveIndexAction(
  _tableName: string,
  indexName: string,
  reason: string,
): WarningAction {
  return {
    type: "remove-index",
    label: "Remove Index",
    codeSnippet: `// Remove: .index("${indexName}", [...])`,
    description: `Remove the redundant index "${indexName}". ${reason}`,
    canAutoApply: true,
    indexName,
  };
}

/**
 * Parse schema.ts file content and find the table definition
 */
export function findTableDefinitionInSchema(
  schemaContent: string,
  tableName: string,
): { start: number; end: number; content: string } | null {
  // Look for patterns like:
  // tableName: defineTable({...})
  // or tableName: defineTable({...}).index(...)

  console.log("[findTableDefinitionInSchema] Looking for table:", tableName);

  const tablePattern = new RegExp(
    `(\\s*${tableName}\\s*:\\s*defineTable\\s*\\()`,
    "g",
  );

  const match = tablePattern.exec(schemaContent);
  if (!match) {
    console.error(
      "[findTableDefinitionInSchema] Could not match table pattern for:",
      tableName,
    );
    console.log(
      "[findTableDefinitionInSchema] Schema preview:",
      schemaContent.slice(0, 500),
    );
    return null;
  }

  console.log(
    "[findTableDefinitionInSchema] Found table at index:",
    match.index,
  );

  const start = match.index;
  let depth = 0;
  let inString = false;
  let stringChar = "";
  let end = start;

  // Find the end of the table definition (including chained methods)
  // We start AFTER "defineTable(" so depth starts at 0
  // The first { will make it 1, the closing } will make it 0
  // Then the ) that closes defineTable( will make it -1, which is our signal
  for (let i = match.index + match[0].length; i < schemaContent.length; i++) {
    const char = schemaContent[i];
    const prevChar = schemaContent[i - 1];

    // Handle strings
    if ((char === '"' || char === "'" || char === "`") && prevChar !== "\\") {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
      continue;
    }

    if (inString) continue;

    // Track parentheses depth
    if (char === "(" || char === "{" || char === "[") {
      depth++;
    } else if (char === ")" || char === "}" || char === "]") {
      depth--;
    }

    // When depth goes to -1, we've exited the defineTable(...) call
    if (depth === -1) {
      // We're at the ) that closes defineTable(
      // Check if there's a chained method call
      const rest = schemaContent.slice(i + 1);
      const chainMatch = rest.match(/^\s*\./);
      if (chainMatch) {
        // Continue to include the chained method
        i += chainMatch[0].length;
        depth = 0; // Reset depth for the chained method
        continue;
      }

      // No more chained methods, we're done
      // Look for comma or end of line
      const afterMatch = rest.match(/^\s*[,\n]/);
      if (afterMatch) {
        end = i + 1 + afterMatch[0].length;
      } else {
        end = i + 1;
      }
      break;
    }
  }

  const content = schemaContent.slice(start, end);
  console.log(
    "[findTableDefinitionInSchema] Extracted table definition:",
    content.slice(0, 200),
  );

  return {
    start,
    end,
    content,
  };
}

/**
 * Result of inserting an index into schema
 */
export type SchemaModificationResult = {
  success: boolean;
  modifiedContent: string;
  lineNumber: number; // 1-based line number where the change was made
};

/**
 * Insert an index into a table definition in schema.ts content
 * Returns the modified content and the line number where the index was inserted
 */
export function insertIndexIntoSchema(
  schemaContent: string,
  tableName: string,
  indexCode: string,
): SchemaModificationResult | null {
  console.log("[insertIndexIntoSchema] Inserting index:", {
    tableName,
    indexCode,
  });

  const tableLocation = findTableDefinitionInSchema(schemaContent, tableName);
  if (!tableLocation) {
    console.error("[insertIndexIntoSchema] Table location not found");
    return null;
  }

  const tableContent = tableLocation.content;
  console.log("[insertIndexIntoSchema] Table content:", tableContent);

  // Strategy: Find where to insert by looking for the pattern:
  // defineTable({...})  <- we want to insert after this )
  // OR
  // defineTable({...}).index(...).index(...)  <- we want to insert after the last )

  // First, find the closing ) of defineTable({...})
  // This is the ) that closes the defineTable( call
  let depth = 0;
  let defineTableStart = tableContent.indexOf("defineTable(");
  if (defineTableStart === -1) {
    console.error("[insertIndexIntoSchema] Could not find defineTable(");
    return null;
  }

  // Start after "defineTable("
  let pos = defineTableStart + "defineTable(".length;
  let defineTableEnd = -1;

  // Track depth to find the matching closing paren
  while (pos < tableContent.length) {
    const char = tableContent[pos];

    if (char === "(" || char === "{" || char === "[") {
      depth++;
    } else if (char === ")" || char === "}" || char === "]") {
      depth--;

      // When we hit depth -1, we've found the closing ) of defineTable(
      if (depth === -1) {
        defineTableEnd = pos;
        break;
      }
    }

    pos++;
  }

  if (defineTableEnd === -1) {
    console.error(
      "[insertIndexIntoSchema] Could not find closing ) of defineTable",
    );
    return null;
  }

  console.log(
    "[insertIndexIntoSchema] Found defineTable closing ) at:",
    defineTableEnd,
  );

  // Now look for any chained .index() calls after this position
  let insertOffset = defineTableEnd + 1; // Start after the )

  // Keep matching .index() chains
  let searchPos = insertOffset;
  while (true) {
    const segment = tableContent.slice(searchPos);
    const indexMatch = segment.match(/^\s*\.index\([^)]*\)/);

    if (!indexMatch) {
      break; // No more .index() calls
    }

    searchPos = searchPos + indexMatch[0].length;
    console.log(
      "[insertIndexIntoSchema] Found chained .index() ending at:",
      searchPos,
    );
  }

  insertOffset = searchPos;
  console.log("[insertIndexIntoSchema] Final insertion offset:", insertOffset);
  console.log(
    "[insertIndexIntoSchema] Character at insert:",
    JSON.stringify(tableContent[insertOffset]),
  );

  // Calculate absolute position in the schema content
  const insertPos = tableLocation.start + insertOffset;

  // Insert the index code
  const before = schemaContent.slice(0, insertPos);
  const after = schemaContent.slice(insertPos);

  // Calculate proper indentation by looking at the defineTable line
  const beforeLines = before.split("\n");
  const tableDefLine = beforeLines.find((line) =>
    line.includes(`${tableName}:`),
  );
  const baseIndent = tableDefLine?.match(/^(\s*)/)?.[1] || "";
  const indent = baseIndent + "  "; // Add 2 spaces for chained method

  console.log("[insertIndexIntoSchema] Using indent:", JSON.stringify(indent));

  const modifiedContent = `${before}\n${indent}${indexCode}${after}`;

  // Calculate the line number where the index was inserted
  const lineNumber = before.split("\n").length + 1;

  console.log("[insertIndexIntoSchema] Success! Inserted at line:", lineNumber);

  return {
    success: true,
    modifiedContent,
    lineNumber,
  };
}

/**
 * Get the default schema.ts file path
 */
export function getSchemaFilePath(projectPath: string): string {
  return `${projectPath}/convex/schema.ts`;
}

/**
 * Generate full context for what the fix will do
 */
export function generateFixContext(
  tableName: string,
  action: WarningAction,
): string {
  switch (action.type) {
    case "add-index":
    case "add-compound-index":
      return `This will add the following index to your ${tableName} table in convex/schema.ts:\n\n${action.codeSnippet}\n\nAfter saving, run \`npx convex dev\` to apply the changes.`;

    case "define-schema":
      return `This will add a schema definition for ${tableName} in convex/schema.ts:\n\n${action.codeSnippet}\n\nYou'll need to fill in the field definitions based on your data model.`;

    case "remove-index":
      return `This will remove the index from your ${tableName} table. ${action.description}`;

    default:
      return action.description;
  }
}
