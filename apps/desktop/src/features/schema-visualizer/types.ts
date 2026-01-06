/**
 * Schema Visualizer Types
 * Types for the interactive schema visualization component
 */

// ============================================================================
// Core Schema Types (from Convex)
// ============================================================================

export type ValidatorJSON =
  | { type: "null" }
  | { type: "number" }
  | { type: "bigint" }
  | { type: "boolean" }
  | { type: "string" }
  | { type: "bytes" }
  | { type: "any" }
  | { type: "literal"; value: unknown }
  | { type: "id"; tableName: string }
  | { type: "array"; value: ValidatorJSON }
  | {
      type: "record";
      keys: ValidatorJSON;
      values: { fieldType: ValidatorJSON; optional: boolean };
    }
  | { type: "union"; value: ValidatorJSON[] }
  | {
      type: "object";
      value: Record<string, { fieldType: ValidatorJSON; optional: boolean }>;
    };

export interface IndexDefinition {
  indexDescriptor: string;
  fields: string[];
}

export interface SearchIndexDefinition {
  indexDescriptor: string;
  searchField: string;
  filterFields: string[];
}

export interface VectorIndexDefinition {
  indexDescriptor: string;
  vectorField: string;
  dimensions: number;
  filterFields: string[];
}

export interface TableDefinitionJSON {
  tableName: string;
  indexes: IndexDefinition[];
  searchIndexes: SearchIndexDefinition[];
  vectorIndexes?: VectorIndexDefinition[];
  stagedDbIndexes?: IndexDefinition[];
  stagedSearchIndexes?: SearchIndexDefinition[];
  stagedVectorIndexes?: VectorIndexDefinition[];
  documentType: ValidatorJSON | null;
}

export interface SchemaJSON {
  tables: TableDefinitionJSON[];
  schemaValidation: boolean;
}

// ============================================================================
// Parsed Schema Types (for visualization)
// ============================================================================

export type FieldType =
  | "string"
  | "number"
  | "boolean"
  | "null"
  | "bigint"
  | "bytes"
  | "any"
  | "literal"
  | "id"
  | "array"
  | "object"
  | "record"
  | "union";

export interface SchemaField {
  name: string;
  type: FieldType;
  optional: boolean;
  /** For id fields, the referenced table */
  referencedTable?: string;
  /** For array fields, the element type info */
  arrayElementType?: SchemaField;
  /** For union fields, the possible types */
  unionTypes?: SchemaField[];
  /** For object fields, nested fields */
  nestedFields?: SchemaField[];
  /** For literal fields, the literal value */
  literalValue?: unknown;
  /** Raw validator for display */
  rawValidator?: ValidatorJSON;
}

export interface SchemaIndex {
  name: string;
  fields: string[];
  type: "db" | "search" | "vector";
  staged?: boolean;
  /** For search indexes */
  searchField?: string;
  filterFields?: string[];
  /** For vector indexes */
  vectorField?: string;
  dimensions?: number;
}

export interface SchemaTable {
  name: string;
  fields: SchemaField[];
  indexes: SchemaIndex[];
  /** Number of documents (if available) */
  documentCount?: number;
  /** Whether this is a system table */
  isSystem?: boolean;
  /** Module/category for grouping */
  module?: string;
}

// ============================================================================
// Relationship Types
// ============================================================================

export type RelationshipCardinality =
  | "one-to-one"
  | "one-to-many"
  | "many-to-many";

export interface SchemaRelationship {
  id: string;
  /** Source table name */
  from: string;
  /** Target table name */
  to: string;
  /** Field in source table that references target */
  field: string;
  /** Cardinality of the relationship */
  cardinality: RelationshipCardinality;
  /** Whether the reference is optional */
  optional: boolean;
  /** Whether this is an array of references */
  isArray: boolean;
}

// ============================================================================
// Analysis & Health Types
// ============================================================================

export type HealthWarningType =
  | "missing-index"
  | "circular-dependency"
  | "orphaned-table"
  | "deep-nesting"
  | "wide-table"
  | "no-schema"
  | "unused-index"
  | "redundant-index"
  | "compound-index-suggestion";

export type HealthSeverity = "info" | "warning" | "error";

/**
 * Action types for fixing health warnings
 */
export type WarningActionType =
  | "add-index"
  | "add-compound-index"
  | "define-schema"
  | "remove-index"
  | "split-table"
  | "open-file"
  | "copy-code";

/**
 * Action that can be taken to fix a health warning
 */
export interface WarningAction {
  type: WarningActionType;
  label: string;
  /** Code snippet to add/modify in schema.ts */
  codeSnippet?: string;
  /** Full code for the table definition (for more complex changes) */
  fullTableCode?: string;
  /** Description of what this action will do */
  description: string;
  /** Whether this action can be automatically applied */
  canAutoApply: boolean;
  /** Index name for add-index actions */
  indexName?: string;
  /** Fields for the index */
  indexFields?: string[];
}

export interface HealthWarning {
  id: string;
  type: HealthWarningType;
  severity: HealthSeverity;
  table?: string;
  field?: string;
  message: string;
  suggestion?: string;
  /** Action that can be taken to fix this warning */
  action?: WarningAction;
  /** Impact description - why this matters */
  impact?: string;
  /** Whether this warning has been dismissed */
  dismissed?: boolean;
}

export interface SchemaHealth {
  score: number; // 0-100
  warnings: HealthWarning[];
  tableCount: number;
  relationshipCount: number;
  indexCount: number;
}

// ============================================================================
// Visualization Types
// ============================================================================

export type LayoutAlgorithm =
  | "force-directed"
  | "hierarchical"
  | "circular"
  | "grid";

export interface VisualizationSettings {
  layout: LayoutAlgorithm;
  showFields: boolean;
  showIndexes: boolean;
  showRelationships: boolean;
  showCardinality: boolean;
  colorByModule: boolean;
  highlightedTable?: string;
  searchQuery?: string;
  focusedPath?: string[];
}

export interface TableNodeData {
  table: SchemaTable;
  isHighlighted: boolean;
  isSelected: boolean;
  isFocused: boolean;
  isExpanded: boolean;
  moduleColor?: string;
  health?: HealthWarning[];
  settings: VisualizationSettings;
  onToggleExpand: () => void;
  onSelect: () => void;
  onNavigateToTable: (tableName: string) => void;
}

export interface RelationshipEdgeData {
  relationship: SchemaRelationship;
  isHighlighted: boolean;
  settings: VisualizationSettings;
}

// ============================================================================
// Parsed Schema (complete)
// ============================================================================

export interface ParsedSchema {
  tables: Map<string, SchemaTable>;
  relationships: SchemaRelationship[];
  health: SchemaHealth;
}

// ============================================================================
// Schema Diff Types
// ============================================================================

/** Status of an item in a diff comparison */
export type DiffStatus = "added" | "removed" | "modified" | "unchanged";

/** Source of a schema snapshot */
export type SchemaSource = "deployed" | "local" | "git" | "github";

/** A point-in-time snapshot of a schema for comparison */
export interface SchemaSnapshot {
  /** Unique identifier for this snapshot */
  id: string;
  /** Human-readable label (e.g., "Deployed", "Local", commit hash) */
  label: string;
  /** When this snapshot was taken */
  timestamp: number;
  /** The parsed schema data */
  schema: ParsedSchema;
  /** Raw schema JSON (for storage/comparison) */
  rawSchema: SchemaJSON;
  /** Where this schema came from */
  source: SchemaSource;
  /** Git commit hash (if from git) */
  commitHash?: string;
  /** Git commit message (if from git) */
  commitMessage?: string;
  /** Deployment ID (if from deployed) */
  deploymentId?: string;
}

/** Diff information for a single field */
export interface FieldDiff {
  fieldName: string;
  status: DiffStatus;
  /** The field in the "from" schema (undefined if added) */
  oldField?: SchemaField;
  /** The field in the "to" schema (undefined if removed) */
  newField?: SchemaField;
  /** Description of what changed (for modified fields) */
  changeDescription?: string;
}

/** Diff information for a single index */
export interface IndexDiff {
  indexName: string;
  status: DiffStatus;
  /** The index in the "from" schema (undefined if added) */
  oldIndex?: SchemaIndex;
  /** The index in the "to" schema (undefined if removed) */
  newIndex?: SchemaIndex;
  /** Description of what changed (for modified indexes) */
  changeDescription?: string;
}

/** Diff information for a single table */
export interface TableDiff {
  tableName: string;
  status: DiffStatus;
  /** Field-level diffs (only for modified tables) */
  fieldDiffs: FieldDiff[];
  /** Index-level diffs (only for modified tables) */
  indexDiffs: IndexDiff[];
  /** The table in the "from" schema (undefined if added) */
  oldTable?: SchemaTable;
  /** The table in the "to" schema (undefined if removed) */
  newTable?: SchemaTable;
}

/** Summary statistics for a schema diff */
export interface DiffSummary {
  tablesAdded: number;
  tablesRemoved: number;
  tablesModified: number;
  tablesUnchanged: number;
  fieldsAdded: number;
  fieldsRemoved: number;
  fieldsModified: number;
  indexesAdded: number;
  indexesRemoved: number;
  indexesModified: number;
}

/** Complete diff between two schema snapshots */
export interface SchemaDiff {
  /** The "from" snapshot (older version) */
  from: SchemaSnapshot;
  /** The "to" snapshot (newer version) */
  to: SchemaSnapshot;
  /** Map of table name to table diff */
  tableDiffs: Map<string, TableDiff>;
  /** Summary statistics */
  summary: DiffSummary;
  /** When this diff was computed */
  computedAt: number;
}

/** Diff view mode for visualization */
export type DiffViewMode = "side-by-side" | "unified" | "visual-overlay";

/** Diff mode settings for the visualizer */
export interface DiffModeSettings {
  /** Whether diff mode is enabled */
  enabled: boolean;
  /** Current view mode */
  viewMode: DiffViewMode;
  /** ID of the "from" snapshot */
  fromSnapshotId: string | null;
  /** ID of the "to" snapshot */
  toSnapshotId: string | null;
  /** Whether to show only changed items */
  showOnlyChanges: boolean;
  /** Filter by change type */
  filterStatus: DiffStatus | "all";
}

/** Colors for diff visualization */
export const DIFF_COLORS = {
  added: "#22c55e", // green-500
  removed: "#ef4444", // red-500
  modified: "#f59e0b", // amber-500
  unchanged: "#6b7280", // gray-500
  addedBg: "#22c55e20", // green with transparency
  removedBg: "#ef444420", // red with transparency
  modifiedBg: "#f59e0b20", // amber with transparency
} as const;

// ============================================================================
// Export Types
// ============================================================================

export type ExportFormat = "png" | "svg" | "mermaid" | "plantuml" | "json";

export interface ExportOptions {
  format: ExportFormat;
  includeFields: boolean;
  includeIndexes: boolean;
  includeRelationships: boolean;
  backgroundColor?: string;
}

// ============================================================================
// Module colors for visual grouping
// ============================================================================

export const MODULE_COLORS: Record<string, string> = {
  users: "#3b82f6", // blue
  auth: "#8b5cf6", // purple
  content: "#10b981", // green
  commerce: "#f59e0b", // amber
  analytics: "#ef4444", // red
  messaging: "#06b6d4", // cyan
  storage: "#84cc16", // lime
  default: "#6b7280", // gray
};

// Infer module from table name
export function inferModule(tableName: string): string {
  const lowerName = tableName.toLowerCase();

  if (
    lowerName.includes("user") ||
    lowerName.includes("profile") ||
    lowerName.includes("account")
  ) {
    return "users";
  }
  if (
    lowerName.includes("auth") ||
    lowerName.includes("session") ||
    lowerName.includes("token")
  ) {
    return "auth";
  }
  if (
    lowerName.includes("post") ||
    lowerName.includes("article") ||
    lowerName.includes("comment") ||
    lowerName.includes("content")
  ) {
    return "content";
  }
  if (
    lowerName.includes("order") ||
    lowerName.includes("product") ||
    lowerName.includes("cart") ||
    lowerName.includes("payment")
  ) {
    return "commerce";
  }
  if (
    lowerName.includes("log") ||
    lowerName.includes("event") ||
    lowerName.includes("metric") ||
    lowerName.includes("analytics")
  ) {
    return "analytics";
  }
  if (
    lowerName.includes("message") ||
    lowerName.includes("chat") ||
    lowerName.includes("notification")
  ) {
    return "messaging";
  }
  if (
    lowerName.includes("file") ||
    lowerName.includes("image") ||
    lowerName.includes("document") ||
    lowerName.includes("storage")
  ) {
    return "storage";
  }

  return "default";
}
