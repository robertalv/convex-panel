/**
 * Natural Language Query Utilities
 * Convert AI response to FilterExpression and SortConfig
 */

import type { FilterExpression, FilterClause } from '../types/filters';
import type { SortConfig } from '../types/common';
import type { NaturalLanguageQueryResponse } from './api/aiAnalysis';

/**
 * Map AI operator to FilterClause operator
 */
function mapOperator(
  aiOp: string
): FilterClause['op'] {
  const operatorMap: Record<string, FilterClause['op']> = {
    eq: 'eq',
    neq: 'neq',
    gt: 'gt',
    gte: 'gte',
    lt: 'lt',
    lte: 'lte',
    contains: 'eq', // For now, map contains to eq - we may need to extend FilterClause
    not_contains: 'neq',
    starts_with: 'eq',
    ends_with: 'eq',
  };

  return operatorMap[aiOp] || 'eq';
}

/**
 * Convert AI response to FilterExpression
 */
export function convertToFilterExpression(
  aiResponse: NaturalLanguageQueryResponse,
  availableFields: string[]
): FilterExpression {
  const clauses: FilterClause[] = [];

  for (const filter of aiResponse.filters) {
    // Validate field exists
    if (!availableFields.includes(filter.field)) {
      console.warn(`Field "${filter.field}" not found in available fields. Skipping filter.`);
      continue;
    }

    const op = mapOperator(filter.op);
    
    clauses.push({
      field: filter.field,
      op,
      value: filter.value,
      enabled: true,
    });
  }

  return { clauses };
}

/**
 * Convert AI response to SortConfig
 */
export function convertToSortConfig(
  aiResponse: NaturalLanguageQueryResponse,
  availableFields: string[]
): SortConfig | null {
  if (!aiResponse.sortConfig) {
    return null;
  }

  const { field, direction } = aiResponse.sortConfig;

  // Validate field exists
  if (!availableFields.includes(field)) {
    console.warn(`Sort field "${field}" not found in available fields. Skipping sort.`);
    return null;
  }

  return {
    field,
    direction: direction === 'desc' ? 'desc' : 'asc',
  };
}

/**
 * Get limit from AI response
 */
export function getLimit(aiResponse: NaturalLanguageQueryResponse): number | null {
  return aiResponse.limit;
}

/**
 * Convert full AI response to usable query parameters
 */
export interface ConvertedQueryParams {
  filters: FilterExpression;
  sortConfig: SortConfig | null;
  limit: number | null;
}

export function convertQueryResponse(
  aiResponse: NaturalLanguageQueryResponse,
  availableFields: string[]
): ConvertedQueryParams {
  return {
    filters: convertToFilterExpression(aiResponse, availableFields),
    sortConfig: convertToSortConfig(aiResponse, availableFields),
    limit: getLimit(aiResponse),
  };
}







