/**
 * Schema Diff Utilities
 * Functions for comparing two schema versions and computing diffs
 */

import type {
  SchemaTable,
  SchemaField,
  SchemaIndex,
  SchemaSnapshot,
  SchemaDiff,
  TableDiff,
  FieldDiff,
  IndexDiff,
  DiffSummary,
  DiffStatus,
  SchemaJSON,
} from "../types";
import { parseSchema } from "./schema-parser";

/**
 * Compare two schema snapshots and compute the diff
 */
export function diffSchemas(
  from: SchemaSnapshot,
  to: SchemaSnapshot,
): SchemaDiff {
  const tableDiffs = new Map<string, TableDiff>();

  const fromTables = from.schema.tables;
  const toTables = to.schema.tables;

  // Get all table names from both schemas
  const allTableNames = new Set([...fromTables.keys(), ...toTables.keys()]);

  // Summary counters
  const summary: DiffSummary = {
    tablesAdded: 0,
    tablesRemoved: 0,
    tablesModified: 0,
    tablesUnchanged: 0,
    fieldsAdded: 0,
    fieldsRemoved: 0,
    fieldsModified: 0,
    indexesAdded: 0,
    indexesRemoved: 0,
    indexesModified: 0,
  };

  for (const tableName of allTableNames) {
    const fromTable = fromTables.get(tableName);
    const toTable = toTables.get(tableName);

    const tableDiff = diffTables(tableName, fromTable, toTable);
    tableDiffs.set(tableName, tableDiff);

    // Update summary
    switch (tableDiff.status) {
      case "added":
        summary.tablesAdded++;
        summary.fieldsAdded += tableDiff.fieldDiffs.length;
        summary.indexesAdded += tableDiff.indexDiffs.length;
        break;
      case "removed":
        summary.tablesRemoved++;
        summary.fieldsRemoved += tableDiff.fieldDiffs.length;
        summary.indexesRemoved += tableDiff.indexDiffs.length;
        break;
      case "modified":
        summary.tablesModified++;
        for (const fd of tableDiff.fieldDiffs) {
          if (fd.status === "added") summary.fieldsAdded++;
          if (fd.status === "removed") summary.fieldsRemoved++;
          if (fd.status === "modified") summary.fieldsModified++;
        }
        for (const id of tableDiff.indexDiffs) {
          if (id.status === "added") summary.indexesAdded++;
          if (id.status === "removed") summary.indexesRemoved++;
          if (id.status === "modified") summary.indexesModified++;
        }
        break;
      case "unchanged":
        summary.tablesUnchanged++;
        break;
    }
  }

  return {
    from,
    to,
    tableDiffs,
    summary,
    computedAt: Date.now(),
  };
}

/**
 * Compare two tables and compute the diff
 */
export function diffTables(
  tableName: string,
  fromTable: SchemaTable | undefined,
  toTable: SchemaTable | undefined,
): TableDiff {
  // Table added
  if (!fromTable && toTable) {
    return {
      tableName,
      status: "added",
      fieldDiffs: toTable.fields.map((f) => ({
        fieldName: f.name,
        status: "added" as DiffStatus,
        newField: f,
      })),
      indexDiffs: toTable.indexes.map((i) => ({
        indexName: i.name,
        status: "added" as DiffStatus,
        newIndex: i,
      })),
      newTable: toTable,
    };
  }

  // Table removed
  if (fromTable && !toTable) {
    return {
      tableName,
      status: "removed",
      fieldDiffs: fromTable.fields.map((f) => ({
        fieldName: f.name,
        status: "removed" as DiffStatus,
        oldField: f,
      })),
      indexDiffs: fromTable.indexes.map((i) => ({
        indexName: i.name,
        status: "removed" as DiffStatus,
        oldIndex: i,
      })),
      oldTable: fromTable,
    };
  }

  // Both exist - compare them
  if (fromTable && toTable) {
    const fieldDiffs = diffFields(fromTable.fields, toTable.fields);
    const indexDiffs = diffIndexes(fromTable.indexes, toTable.indexes);

    // Check if anything changed
    const hasFieldChanges = fieldDiffs.some((fd) => fd.status !== "unchanged");
    const hasIndexChanges = indexDiffs.some((id) => id.status !== "unchanged");
    const hasModuleChange = fromTable.module !== toTable.module;
    const hasSystemChange = fromTable.isSystem !== toTable.isSystem;

    const status: DiffStatus =
      hasFieldChanges || hasIndexChanges || hasModuleChange || hasSystemChange
        ? "modified"
        : "unchanged";

    return {
      tableName,
      status,
      fieldDiffs,
      indexDiffs,
      oldTable: fromTable,
      newTable: toTable,
    };
  }

  // Should never happen
  throw new Error(`Invalid state: both tables undefined for ${tableName}`);
}

/**
 * Compare two field arrays and compute the diff
 */
export function diffFields(
  fromFields: SchemaField[],
  toFields: SchemaField[],
): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  const fromFieldMap = new Map(fromFields.map((f) => [f.name, f]));
  const toFieldMap = new Map(toFields.map((f) => [f.name, f]));
  const allFieldNames = new Set([...fromFieldMap.keys(), ...toFieldMap.keys()]);

  for (const fieldName of allFieldNames) {
    const fromField = fromFieldMap.get(fieldName);
    const toField = toFieldMap.get(fieldName);

    if (!fromField && toField) {
      diffs.push({
        fieldName,
        status: "added",
        newField: toField,
      });
    } else if (fromField && !toField) {
      diffs.push({
        fieldName,
        status: "removed",
        oldField: fromField,
      });
    } else if (fromField && toField) {
      const changes = compareFields(fromField, toField);
      if (changes.length > 0) {
        diffs.push({
          fieldName,
          status: "modified",
          oldField: fromField,
          newField: toField,
          changeDescription: changes.join(", "),
        });
      } else {
        diffs.push({
          fieldName,
          status: "unchanged",
          oldField: fromField,
          newField: toField,
        });
      }
    }
  }

  return diffs;
}

/**
 * Compare two fields and return descriptions of what changed
 */
function compareFields(from: SchemaField, to: SchemaField): string[] {
  const changes: string[] = [];

  if (from.type !== to.type) {
    changes.push(`type: ${from.type} -> ${to.type}`);
  }

  if (from.optional !== to.optional) {
    changes.push(to.optional ? "now optional" : "now required");
  }

  if (from.referencedTable !== to.referencedTable) {
    if (!from.referencedTable && to.referencedTable) {
      changes.push(`references ${to.referencedTable}`);
    } else if (from.referencedTable && !to.referencedTable) {
      changes.push(`no longer references ${from.referencedTable}`);
    } else {
      changes.push(
        `reference: ${from.referencedTable} -> ${to.referencedTable}`,
      );
    }
  }

  // Compare array element types
  if (from.arrayElementType || to.arrayElementType) {
    if (!from.arrayElementType && to.arrayElementType) {
      changes.push("added array element type");
    } else if (from.arrayElementType && !to.arrayElementType) {
      changes.push("removed array element type");
    } else if (from.arrayElementType && to.arrayElementType) {
      const elementChanges = compareFields(
        from.arrayElementType,
        to.arrayElementType,
      );
      if (elementChanges.length > 0) {
        changes.push(`array element: ${elementChanges.join(", ")}`);
      }
    }
  }

  // Compare nested fields (for objects)
  if (from.nestedFields || to.nestedFields) {
    const fromNested = from.nestedFields || [];
    const toNested = to.nestedFields || [];
    if (fromNested.length !== toNested.length) {
      changes.push(`nested fields: ${fromNested.length} -> ${toNested.length}`);
    } else {
      // Deep compare nested fields
      const nestedDiffs = diffFields(fromNested, toNested);
      const nestedChanges = nestedDiffs.filter((d) => d.status !== "unchanged");
      if (nestedChanges.length > 0) {
        changes.push(`${nestedChanges.length} nested field(s) changed`);
      }
    }
  }

  // Compare union types
  if (from.unionTypes || to.unionTypes) {
    const fromUnion = from.unionTypes || [];
    const toUnion = to.unionTypes || [];
    if (fromUnion.length !== toUnion.length) {
      changes.push(`union types: ${fromUnion.length} -> ${toUnion.length}`);
    }
  }

  // Compare literal values
  if (from.literalValue !== to.literalValue) {
    changes.push(
      `literal: ${JSON.stringify(from.literalValue)} -> ${JSON.stringify(to.literalValue)}`,
    );
  }

  return changes;
}

/**
 * Compare two index arrays and compute the diff
 */
export function diffIndexes(
  fromIndexes: SchemaIndex[],
  toIndexes: SchemaIndex[],
): IndexDiff[] {
  const diffs: IndexDiff[] = [];
  const fromIndexMap = new Map(fromIndexes.map((i) => [i.name, i]));
  const toIndexMap = new Map(toIndexes.map((i) => [i.name, i]));
  const allIndexNames = new Set([...fromIndexMap.keys(), ...toIndexMap.keys()]);

  for (const indexName of allIndexNames) {
    const fromIndex = fromIndexMap.get(indexName);
    const toIndex = toIndexMap.get(indexName);

    if (!fromIndex && toIndex) {
      diffs.push({
        indexName,
        status: "added",
        newIndex: toIndex,
      });
    } else if (fromIndex && !toIndex) {
      diffs.push({
        indexName,
        status: "removed",
        oldIndex: fromIndex,
      });
    } else if (fromIndex && toIndex) {
      const changes = compareIndexes(fromIndex, toIndex);
      if (changes.length > 0) {
        diffs.push({
          indexName,
          status: "modified",
          oldIndex: fromIndex,
          newIndex: toIndex,
          changeDescription: changes.join(", "),
        });
      } else {
        diffs.push({
          indexName,
          status: "unchanged",
          oldIndex: fromIndex,
          newIndex: toIndex,
        });
      }
    }
  }

  return diffs;
}

/**
 * Compare two indexes and return descriptions of what changed
 */
function compareIndexes(from: SchemaIndex, to: SchemaIndex): string[] {
  const changes: string[] = [];

  if (from.type !== to.type) {
    changes.push(`type: ${from.type} -> ${to.type}`);
  }

  // Compare fields
  const fromFieldsStr = from.fields.join(",");
  const toFieldsStr = to.fields.join(",");
  if (fromFieldsStr !== toFieldsStr) {
    changes.push(`fields: [${fromFieldsStr}] -> [${toFieldsStr}]`);
  }

  // Compare staged status
  if (from.staged !== to.staged) {
    changes.push(to.staged ? "now staged" : "no longer staged");
  }

  // Search index specific
  if (from.searchField !== to.searchField) {
    changes.push(`searchField: ${from.searchField} -> ${to.searchField}`);
  }

  // Vector index specific
  if (from.vectorField !== to.vectorField) {
    changes.push(`vectorField: ${from.vectorField} -> ${to.vectorField}`);
  }

  if (from.dimensions !== to.dimensions) {
    changes.push(`dimensions: ${from.dimensions} -> ${to.dimensions}`);
  }

  // Filter fields
  const fromFiltersStr = (from.filterFields || []).join(",");
  const toFiltersStr = (to.filterFields || []).join(",");
  if (fromFiltersStr !== toFiltersStr) {
    changes.push(`filterFields changed`);
  }

  return changes;
}

/**
 * Create a schema snapshot from raw schema JSON
 */
export function createSnapshot(
  rawSchema: SchemaJSON,
  options: {
    id?: string;
    label: string;
    source: "deployed" | "local" | "git" | "github";
    commitHash?: string;
    commitMessage?: string;
    deploymentId?: string;
  },
): SchemaSnapshot {
  const schema = parseSchema(rawSchema);
  return {
    id: options.id || generateSnapshotId(),
    label: options.label,
    timestamp: Date.now(),
    schema,
    rawSchema,
    source: options.source,
    commitHash: options.commitHash,
    commitMessage: options.commitMessage,
    deploymentId: options.deploymentId,
  };
}

/**
 * Generate a unique snapshot ID
 */
function generateSnapshotId(): string {
  return `snapshot_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get tables that have changes (not unchanged)
 */
export function getChangedTables(diff: SchemaDiff): TableDiff[] {
  return Array.from(diff.tableDiffs.values()).filter(
    (td) => td.status !== "unchanged",
  );
}

/**
 * Get table diff by name
 */
export function getTableDiff(
  diff: SchemaDiff,
  tableName: string,
): TableDiff | undefined {
  return diff.tableDiffs.get(tableName);
}

/**
 * Check if a diff has any changes
 */
export function hasChanges(diff: SchemaDiff): boolean {
  const { summary } = diff;
  return (
    summary.tablesAdded > 0 ||
    summary.tablesRemoved > 0 ||
    summary.tablesModified > 0
  );
}

/**
 * Format diff summary as human-readable string
 */
export function formatDiffSummary(summary: DiffSummary): string {
  const parts: string[] = [];

  if (summary.tablesAdded > 0) {
    parts.push(
      `${summary.tablesAdded} table${summary.tablesAdded > 1 ? "s" : ""} added`,
    );
  }
  if (summary.tablesRemoved > 0) {
    parts.push(
      `${summary.tablesRemoved} table${summary.tablesRemoved > 1 ? "s" : ""} removed`,
    );
  }
  if (summary.tablesModified > 0) {
    parts.push(
      `${summary.tablesModified} table${summary.tablesModified > 1 ? "s" : ""} modified`,
    );
  }

  if (parts.length === 0) {
    return "No changes";
  }

  return parts.join(", ");
}

/**
 * Get the diff status color
 */
export function getDiffStatusColor(status: DiffStatus): string {
  switch (status) {
    case "added":
      return "#22c55e"; // green-500
    case "removed":
      return "#ef4444"; // red-500
    case "modified":
      return "#f59e0b"; // amber-500
    case "unchanged":
    default:
      return "#6b7280"; // gray-500
  }
}

/**
 * Get the diff status background color (with transparency)
 */
export function getDiffStatusBgColor(status: DiffStatus): string {
  switch (status) {
    case "added":
      return "#22c55e20";
    case "removed":
      return "#ef444420";
    case "modified":
      return "#f59e0b20";
    case "unchanged":
    default:
      return "transparent";
  }
}
