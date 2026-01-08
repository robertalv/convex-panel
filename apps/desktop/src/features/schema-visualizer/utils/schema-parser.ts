/**
 * Schema Parser Utility
 * Parses Convex schema JSON and extracts tables, fields, relationships, and health info
 */

import {
  type SchemaJSON,
  type TableDefinitionJSON,
  type ValidatorJSON,
  type SchemaTable,
  type SchemaField,
  type SchemaIndex,
  type SchemaRelationship,
  type SchemaHealth,
  type HealthWarning,
  type ParsedSchema,
  type FieldType,
  inferModule,
} from "@convex-panel/shared";

import {
  createAddIndexAction,
  createDefineSchemaAction,
  createRemoveIndexAction,
} from "./code-generator";

/**
 * Generate a unique warning ID
 */
let warningIdCounter = 0;
function generateWarningId(
  type: string,
  table?: string,
  field?: string,
): string {
  warningIdCounter++;
  const base = [type, table, field].filter(Boolean).join("-");
  return `${base}-${warningIdCounter}`;
}

/**
 * Parse a ValidatorJSON into a SchemaField
 */
function parseValidator(
  name: string,
  validator: ValidatorJSON,
  optional: boolean,
): SchemaField {
  const field: SchemaField = {
    name,
    type: validator.type as FieldType,
    optional,
    rawValidator: validator,
  };

  switch (validator.type) {
    case "id":
      field.referencedTable = validator.tableName;
      break;

    case "array":
      field.arrayElementType = parseValidator(
        "element",
        validator.value,
        false,
      );
      // Check if array contains id references
      if (validator.value.type === "id") {
        field.referencedTable = validator.value.tableName;
      }
      break;

    case "union":
      field.unionTypes = validator.value.map((v, i) =>
        parseValidator(`variant${i}`, v, false),
      );
      // Check for id references in union
      const idType = validator.value.find((v) => v.type === "id");
      if (idType && idType.type === "id") {
        field.referencedTable = idType.tableName;
      }
      break;

    case "object":
      field.nestedFields = Object.entries(validator.value).map(
        ([fieldName, fieldDef]) =>
          parseValidator(fieldName, fieldDef.fieldType, fieldDef.optional),
      );
      break;

    case "literal":
      field.literalValue = validator.value;
      break;

    default:
      break;
  }

  return field;
}

/**
 * Parse a table definition into a SchemaTable
 */
function parseTable(tableDef: TableDefinitionJSON): SchemaTable {
  const fields: SchemaField[] = [];

  // Parse document type fields
  if (tableDef.documentType) {
    if (tableDef.documentType.type === "object") {
      const objType = tableDef.documentType;
      Object.entries(objType.value).forEach(([fieldName, fieldDef]) => {
        fields.push(
          parseValidator(fieldName, fieldDef.fieldType, fieldDef.optional),
        );
      });
    } else if (tableDef.documentType.type === "any") {
      // Schema-less table
      fields.push({
        name: "*",
        type: "any",
        optional: false,
      });
    }
  }

  // Parse indexes
  const indexes: SchemaIndex[] = [];

  // DB indexes
  tableDef.indexes.forEach((idx) => {
    indexes.push({
      name: idx.indexDescriptor,
      fields: idx.fields,
      type: "db",
      staged: false,
    });
  });

  // Staged DB indexes
  tableDef.stagedDbIndexes?.forEach((idx) => {
    indexes.push({
      name: idx.indexDescriptor,
      fields: idx.fields,
      type: "db",
      staged: true,
    });
  });

  // Search indexes
  tableDef.searchIndexes.forEach((idx) => {
    indexes.push({
      name: idx.indexDescriptor,
      fields: [...idx.filterFields],
      type: "search",
      staged: false,
      searchField: idx.searchField,
      filterFields: idx.filterFields,
    });
  });

  // Staged search indexes
  tableDef.stagedSearchIndexes?.forEach((idx) => {
    indexes.push({
      name: idx.indexDescriptor,
      fields: [...idx.filterFields],
      type: "search",
      staged: true,
      searchField: idx.searchField,
      filterFields: idx.filterFields,
    });
  });

  // Vector indexes
  tableDef.vectorIndexes?.forEach((idx) => {
    indexes.push({
      name: idx.indexDescriptor,
      fields: [...idx.filterFields],
      type: "vector",
      staged: false,
      vectorField: idx.vectorField,
      dimensions: idx.dimensions,
      filterFields: idx.filterFields,
    });
  });

  // Staged vector indexes
  tableDef.stagedVectorIndexes?.forEach((idx) => {
    indexes.push({
      name: idx.indexDescriptor,
      fields: [...idx.filterFields],
      type: "vector",
      staged: true,
      vectorField: idx.vectorField,
      dimensions: idx.dimensions,
      filterFields: idx.filterFields,
    });
  });

  return {
    name: tableDef.tableName,
    fields,
    indexes,
    isSystem: tableDef.tableName.startsWith("_"),
    module: inferModule(tableDef.tableName),
  };
}

/**
 * Extract relationships from tables
 */
function extractRelationships(
  tables: Map<string, SchemaTable>,
): SchemaRelationship[] {
  const relationships: SchemaRelationship[] = [];
  const relationshipIds = new Set<string>();

  tables.forEach((table) => {
    table.fields.forEach((field) => {
      // Direct id reference
      if (field.type === "id" && field.referencedTable) {
        const id = `${table.name}-${field.name}->${field.referencedTable}`;
        if (!relationshipIds.has(id) && tables.has(field.referencedTable)) {
          relationshipIds.add(id);
          relationships.push({
            id,
            from: table.name,
            to: field.referencedTable,
            field: field.name,
            cardinality: field.optional ? "one-to-one" : "one-to-one",
            optional: field.optional,
            isArray: false,
          });
        }
      }

      // Array of id references
      if (
        field.type === "array" &&
        field.arrayElementType?.type === "id" &&
        field.arrayElementType.referencedTable
      ) {
        const id = `${table.name}-${field.name}->${field.arrayElementType.referencedTable}`;
        if (
          !relationshipIds.has(id) &&
          tables.has(field.arrayElementType.referencedTable)
        ) {
          relationshipIds.add(id);
          relationships.push({
            id,
            from: table.name,
            to: field.arrayElementType.referencedTable,
            field: field.name,
            cardinality: "one-to-many",
            optional: field.optional,
            isArray: true,
          });
        }
      }

      // Union containing id reference
      if (field.type === "union" && field.unionTypes) {
        field.unionTypes.forEach((unionType) => {
          if (unionType.type === "id" && unionType.referencedTable) {
            const id = `${table.name}-${field.name}->${unionType.referencedTable}`;
            if (
              !relationshipIds.has(id) &&
              tables.has(unionType.referencedTable)
            ) {
              relationshipIds.add(id);
              relationships.push({
                id,
                from: table.name,
                to: unionType.referencedTable,
                field: field.name,
                cardinality: "one-to-one",
                optional: true, // unions are typically optional
                isArray: false,
              });
            }
          }
        });
      }

      // Check nested objects for id references
      if (field.type === "object" && field.nestedFields) {
        extractNestedRelationships(
          table.name,
          field.name,
          field.nestedFields,
          tables,
          relationships,
          relationshipIds,
        );
      }
    });
  });

  return relationships;
}

/**
 * Recursively extract relationships from nested objects
 */
function extractNestedRelationships(
  tableName: string,
  parentPath: string,
  fields: SchemaField[],
  tables: Map<string, SchemaTable>,
  relationships: SchemaRelationship[],
  relationshipIds: Set<string>,
): void {
  fields.forEach((field) => {
    const fieldPath = `${parentPath}.${field.name}`;

    if (field.type === "id" && field.referencedTable) {
      const id = `${tableName}-${fieldPath}->${field.referencedTable}`;
      if (!relationshipIds.has(id) && tables.has(field.referencedTable)) {
        relationshipIds.add(id);
        relationships.push({
          id,
          from: tableName,
          to: field.referencedTable,
          field: fieldPath,
          cardinality: "one-to-one",
          optional: field.optional,
          isArray: false,
        });
      }
    }

    if (field.type === "object" && field.nestedFields) {
      extractNestedRelationships(
        tableName,
        fieldPath,
        field.nestedFields,
        tables,
        relationships,
        relationshipIds,
      );
    }
  });
}

/**
 * Analyze schema health
 */
function analyzeHealth(
  tables: Map<string, SchemaTable>,
  relationships: SchemaRelationship[],
): SchemaHealth {
  const warnings: HealthWarning[] = [];
  let score = 100;

  // Reset warning ID counter for consistent IDs
  warningIdCounter = 0;

  // Check for orphaned tables (no relationships)
  const tablesWithRelationships = new Set<string>();
  relationships.forEach((rel) => {
    tablesWithRelationships.add(rel.from);
    tablesWithRelationships.add(rel.to);
  });

  tables.forEach((table) => {
    // Skip system tables
    if (table.isSystem) return;

    // Check for orphaned tables
    if (!tablesWithRelationships.has(table.name) && tables.size > 1) {
      warnings.push({
        id: generateWarningId("orphaned-table", table.name),
        type: "orphaned-table",
        severity: "info",
        table: table.name,
        message: `Table "${table.name}" has no relationships to other tables`,
        suggestion:
          "Consider if this table should reference or be referenced by other tables",
        impact:
          "Orphaned tables may indicate incomplete data modeling or unused tables.",
      });
      score -= 2;
    }

    // Check for tables without schema (any type)
    if (table.fields.length === 1 && table.fields[0].type === "any") {
      warnings.push({
        id: generateWarningId("no-schema", table.name),
        type: "no-schema",
        severity: "warning",
        table: table.name,
        message: `Table "${table.name}" has no schema defined`,
        suggestion: "Define a schema to enable type safety and validation",
        impact:
          "Without a schema, you lose type safety, query optimization, and data validation.",
        action: createDefineSchemaAction(table.name),
      });
      score -= 5;
    }

    // Check for wide tables (many fields)
    if (table.fields.length > 20) {
      warnings.push({
        id: generateWarningId("wide-table", table.name),
        type: "wide-table",
        severity: "info",
        table: table.name,
        message: `Table "${table.name}" has ${table.fields.length} fields`,
        suggestion:
          "Consider splitting into multiple tables or using nested objects",
        impact:
          "Wide tables can impact performance and make data harder to manage.",
      });
      score -= 3;
    }

    // Check for missing indexes on foreign key fields
    table.fields.forEach((field) => {
      if (field.type === "id" && field.referencedTable) {
        const hasIndex = table.indexes.some((idx) =>
          idx.fields.includes(field.name),
        );
        if (!hasIndex) {
          warnings.push({
            id: generateWarningId("missing-index", table.name, field.name),
            type: "missing-index",
            severity: "warning",
            table: table.name,
            field: field.name,
            message: `Field "${field.name}" references "${field.referencedTable}" but has no index`,
            suggestion: `Add an index on "${field.name}" to improve query performance`,
            impact:
              "Queries filtering by this field will scan the entire table, causing slow performance.",
            action: createAddIndexAction(table.name, field.name),
          });
          score -= 5;
        }
      }
    });

    // Check for redundant indexes (indexes that are prefixes of other indexes)
    const dbIndexes = table.indexes.filter((idx) => idx.type === "db");
    dbIndexes.forEach((index) => {
      // Check if this index is a prefix of another index
      const isPrefix = dbIndexes.some((other) => {
        if (other.name === index.name) return false;
        if (other.fields.length <= index.fields.length) return false;
        // Check if all fields of this index are a prefix of the other index
        return index.fields.every((field, i) => other.fields[i] === field);
      });

      if (isPrefix) {
        warnings.push({
          id: generateWarningId("redundant-index", table.name, index.name),
          type: "redundant-index",
          severity: "info",
          table: table.name,
          message: `Index "${index.name}" is redundant - it's a prefix of a larger compound index`,
          suggestion: `Consider removing this index to reduce storage overhead`,
          impact:
            "Redundant indexes consume storage and slow down writes without providing query benefits.",
          action: createRemoveIndexAction(
            table.name,
            index.name,
            "A larger compound index already covers these fields.",
          ),
        });
        score -= 2;
      }
    });
  });

  // Check for circular dependencies
  const circularPaths = findCircularDependencies(relationships);
  circularPaths.forEach((path) => {
    warnings.push({
      id: generateWarningId("circular-dependency"),
      type: "circular-dependency",
      severity: "info",
      message: `Circular dependency detected: ${path.join(" -> ")}`,
      suggestion:
        "Circular dependencies are not necessarily bad, but be aware of them",
      impact:
        "Circular references can complicate data loading and may cause issues with cascading operations.",
    });
    score -= 1;
  });

  // Suggest compound indexes for common query patterns
  // Look for tables with multiple foreign keys that might be queried together
  tables.forEach((table) => {
    if (table.isSystem) return;

    const foreignKeyFields = table.fields.filter(
      (f) => f.type === "id" && f.referencedTable,
    );

    // If table has 2+ foreign keys and no compound index covering them
    if (foreignKeyFields.length >= 2) {
      const hasCompoundIndex = table.indexes.some(
        (idx) =>
          idx.type === "db" &&
          idx.fields.length >= 2 &&
          foreignKeyFields.some((fk) => idx.fields.includes(fk.name)),
      );

      if (!hasCompoundIndex) {
        // This is just a suggestion, not a warning - add as low priority info
        // We'll only add this for tables that look like join tables
        const isLikelyJoinTable =
          foreignKeyFields.length >= 2 &&
          table.fields.filter(
            (f) => f.name !== "_id" && f.name !== "_creationTime",
          ).length <= 5;

        if (isLikelyJoinTable) {
          const fieldNames = foreignKeyFields.slice(0, 2).map((f) => f.name);
          warnings.push({
            id: generateWarningId("compound-index-suggestion", table.name),
            type: "compound-index-suggestion",
            severity: "info",
            table: table.name,
            message: `Consider adding a compound index on [${fieldNames.join(", ")}]`,
            suggestion:
              "Compound indexes can speed up queries that filter on multiple fields",
            impact:
              "Queries filtering by both fields will be more efficient with a compound index.",
          });
        }
      }
    }
  });

  // Ensure score doesn't go below 0
  score = Math.max(0, score);

  return {
    score,
    warnings,
    tableCount: tables.size,
    relationshipCount: relationships.length,
    indexCount: Array.from(tables.values()).reduce(
      (sum, t) => sum + t.indexes.length,
      0,
    ),
  };
}

/**
 * Find circular dependencies in relationships
 */
function findCircularDependencies(
  relationships: SchemaRelationship[],
): string[][] {
  const graph = new Map<string, string[]>();

  relationships.forEach((rel) => {
    if (!graph.has(rel.from)) {
      graph.set(rel.from, []);
    }
    graph.get(rel.from)!.push(rel.to);
  });

  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(node: string, path: string[]): void {
    visited.add(node);
    recursionStack.add(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path, neighbor]);
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle
        const cycleStart = path.indexOf(neighbor);
        if (cycleStart !== -1) {
          cycles.push([...path.slice(cycleStart), neighbor]);
        } else {
          cycles.push([...path, neighbor]);
        }
      }
    }

    recursionStack.delete(node);
  }

  graph.forEach((_, node) => {
    if (!visited.has(node)) {
      dfs(node, [node]);
    }
  });

  return cycles;
}

/**
 * Main function to parse schema JSON into visualization-ready data
 */
export function parseSchema(schemaJson: SchemaJSON): ParsedSchema {
  const tables = new Map<string, SchemaTable>();

  // Parse all tables
  schemaJson.tables.forEach((tableDef) => {
    const table = parseTable(tableDef);
    tables.set(table.name, table);
  });

  // Extract relationships
  const relationships = extractRelationships(tables);

  // Analyze health
  const health = analyzeHealth(tables, relationships);

  return {
    tables,
    relationships,
    health,
  };
}

/**
 * Format a field type for display
 */
export function formatFieldType(field: SchemaField): string {
  switch (field.type) {
    case "id":
      return `Id<"${field.referencedTable}">`;
    case "array":
      if (field.arrayElementType) {
        return `${formatFieldType(field.arrayElementType)}[]`;
      }
      return "any[]";
    case "union":
      if (field.unionTypes && field.unionTypes.length <= 3) {
        return field.unionTypes.map(formatFieldType).join(" | ");
      }
      return `union<${field.unionTypes?.length || 0} types>`;
    case "object":
      if (field.nestedFields && field.nestedFields.length <= 2) {
        return `{ ${field.nestedFields.map((f) => f.name).join(", ")} }`;
      }
      return `object<${field.nestedFields?.length || 0} fields>`;
    case "literal":
      if (typeof field.literalValue === "string") {
        return `"${field.literalValue}"`;
      }
      return String(field.literalValue);
    default:
      return field.type;
  }
}

/**
 * Get the display name for a field type (short form)
 */
export function getFieldTypeShort(field: SchemaField): string {
  switch (field.type) {
    case "id":
      return "id";
    case "string":
      return "str";
    case "number":
      return "num";
    case "boolean":
      return "bool";
    case "bigint":
      return "int64";
    case "bytes":
      return "bytes";
    case "null":
      return "null";
    case "any":
      return "any";
    case "array":
      return "[]";
    case "object":
      return "{}";
    case "union":
      return "|";
    case "record":
      return "rec";
    case "literal":
      return "lit";
    default:
      return field.type;
  }
}
