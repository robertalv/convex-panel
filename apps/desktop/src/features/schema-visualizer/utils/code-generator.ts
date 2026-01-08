/**
 * Code Generator Utility
 * Generates schema.ts code snippets for fixing health warnings
 */

import type {
  SchemaTable,
  SchemaField,
  WarningAction,
  ParsedSchema,
} from "@convex-panel/shared";

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

  const tablePattern = new RegExp(
    `(\\s*${tableName}\\s*:\\s*defineTable\\s*\\()`,
    "g",
  );

  const match = tablePattern.exec(schemaContent);
  if (!match) return null;

  const start = match.index;
  let depth = 0;
  let inString = false;
  let stringChar = "";
  let end = start;

  // Find the end of the table definition (including chained methods)
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

    // When we exit the defineTable call, look for chained methods
    if (depth === 0) {
      // Check if there's a chained method call
      const rest = schemaContent.slice(i + 1);
      const chainMatch = rest.match(/^\s*\./);
      if (chainMatch) {
        // Continue to include the chained method
        i += chainMatch[0].length;
        depth = 0;
        continue;
      }

      // Look for comma or end of object
      const afterMatch = rest.match(/^\s*[,\n]/);
      if (afterMatch) {
        end = i + 1 + afterMatch[0].length;
      } else {
        end = i + 1;
      }
      break;
    }
  }

  return {
    start,
    end,
    content: schemaContent.slice(start, end),
  };
}

/**
 * Insert an index into a table definition in schema.ts content
 */
export function insertIndexIntoSchema(
  schemaContent: string,
  tableName: string,
  indexCode: string,
): string | null {
  const tableLocation = findTableDefinitionInSchema(schemaContent, tableName);
  if (!tableLocation) return null;

  // Look for the pattern: defineTable({...}) possibly followed by .index() calls
  // We want to insert before the trailing comma

  // Find the last closing paren that's part of a method chain
  let insertPos = tableLocation.end;

  // Check if there's a trailing comma
  const trailingMatch = schemaContent
    .slice(tableLocation.start, tableLocation.end)
    .match(/\)\s*,?\s*$/);
  if (trailingMatch) {
    insertPos =
      tableLocation.start + tableLocation.content.lastIndexOf(")") + 1;
  }

  // Insert the index code
  const before = schemaContent.slice(0, insertPos);
  const after = schemaContent.slice(insertPos);

  return `${before}\n    ${indexCode}${after}`;
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
