/**
 * Shared Filter Types
 * Types for filter expressions, clauses, and history management
 * Used across desktop and panel packages
 */

// ============================================
// Filter Operator Types
// ============================================

export type FilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "isType"
  | "isNotType";

export type TypeValue =
  | "string"
  | "number"
  | "boolean"
  | "null"
  | "undefined"
  | "object"
  | "array";

// ============================================
// Filter Clause Types
// ============================================

export interface FilterClause {
  id: string;
  field: string;
  op: FilterOperator;
  value: any;
  enabled: boolean;
}

// ============================================
// Index Filter Types (for indexed queries)
// ============================================

export type IndexFilterType = "indexEq" | "indexRange";

export interface IndexFilterClause {
  type: IndexFilterType;
  enabled: boolean;
  value?: any;
  // For range filters
  lowerOp?: "gt" | "gte";
  lowerValue?: any;
  upperOp?: "lt" | "lte";
  upperValue?: any;
}

export interface IndexFilter {
  name: string;
  clauses: IndexFilterClause[];
}

export interface SearchIndexFilter {
  name: string;
  search: string;
  clauses: SearchIndexFilterClause[];
}

export interface SearchIndexFilterClause {
  field: string;
  op?: FilterOperator;
  enabled: boolean;
  value?: any;
}

// ============================================
// Sort Types
// ============================================

export type SortDirection = "asc" | "desc";

export interface SortConfig {
  field: string;
  direction: SortDirection;
}

// Default sort configuration
export const DEFAULT_SORT_FIELD = "_creationTime";
export const DEFAULT_SORT_DIRECTION: SortDirection = "desc";

export function getDefaultSortConfig(): SortConfig {
  return {
    field: DEFAULT_SORT_FIELD,
    direction: DEFAULT_SORT_DIRECTION,
  };
}

// ============================================
// Filter Expression Types
// ============================================

export interface FilterExpression {
  clauses: FilterClause[];
  order?: SortDirection;
  index?: IndexFilter | SearchIndexFilter;
}

// ============================================
// Filter History Types
// ============================================

export interface FilterHistoryEntry {
  filters: FilterExpression;
  timestamp: number;
}

export interface FilterHistoryState {
  history: FilterExpression[];
  currentIndex: number;
}

export const MAX_FILTER_HISTORY = 25;

// ============================================
// Filter Validation Types
// ============================================

export interface FilterValidationError {
  filter: number;
  error: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Generate a unique ID for filter clauses
 */
export function generateFilterId(): string {
  return `filter_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Create an empty filter expression
 */
export function createEmptyFilterExpression(): FilterExpression {
  return {
    clauses: [],
    order: DEFAULT_SORT_DIRECTION,
  };
}

/**
 * Create a new filter clause with default values
 */
export function createNewFilterClause(field: string = "_id"): FilterClause {
  return {
    id: generateFilterId(),
    field,
    op: "eq",
    value: "",
    enabled: true,
  };
}

/**
 * Check if a filter expression has any active filters
 */
export function hasActiveFilters(filters?: FilterExpression): boolean {
  if (!filters) return false;

  // Check regular clauses
  if (filters.clauses.some((c) => c.enabled)) {
    return true;
  }

  // Check index filters
  if (filters.index) {
    if (filters.index.clauses.some((c) => c.enabled)) {
      return true;
    }
    // Check search index
    if ("search" in filters.index && filters.index.search) {
      return true;
    }
  }

  return false;
}

/**
 * Check if an index filter is a search index filter
 */
export function isSearchIndexFilter(
  index: IndexFilter | SearchIndexFilter,
): index is SearchIndexFilter {
  return "search" in index;
}

/**
 * Clear all filters while preserving the index structure
 */
export function clearFilters(filters?: FilterExpression): FilterExpression {
  if (!filters) {
    return createEmptyFilterExpression();
  }

  let clearedIndex: IndexFilter | SearchIndexFilter | undefined;

  if (filters.index) {
    if (isSearchIndexFilter(filters.index)) {
      clearedIndex = {
        ...filters.index,
        search: "",
        clauses: filters.index.clauses.map((c) => ({
          ...c,
          enabled: false,
        })),
      } as SearchIndexFilter;
    } else {
      clearedIndex = {
        ...filters.index,
        clauses: filters.index.clauses.map((c) => ({
          ...c,
          enabled: false,
        })),
      } as IndexFilter;
    }
  }

  return {
    clauses: [],
    order: filters.order,
    index: clearedIndex,
  };
}

/**
 * Count the number of active filters
 */
export function countActiveFilters(filters?: FilterExpression): number {
  if (!filters) return 0;

  let count = filters.clauses.filter((c) => c.enabled).length;

  if (filters.index) {
    count += filters.index.clauses.filter((c) => c.enabled).length;
    if ("search" in filters.index && filters.index.search) {
      count += 1;
    }
  }

  return count;
}

/**
 * Check if two filter expressions are equal
 */
export function areFiltersEqual(
  a?: FilterExpression,
  b?: FilterExpression,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;

  return JSON.stringify(a) === JSON.stringify(b);
}

// ============================================
// Filter Operator Labels
// ============================================

export const FILTER_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: "eq", label: "equals" },
  { value: "neq", label: "not equals" },
  { value: "gt", label: "greater than" },
  { value: "gte", label: "greater or equal" },
  { value: "lt", label: "less than" },
  { value: "lte", label: "less or equal" },
  { value: "isType", label: "is type" },
  { value: "isNotType", label: "is not type" },
];

export const TYPE_OPTIONS: TypeValue[] = [
  "string",
  "number",
  "boolean",
  "null",
  "undefined",
  "object",
  "array",
];
