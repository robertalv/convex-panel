/**
 * Filter-related types
 */

import React from 'react';
import type { ThemeClasses } from './common';

export interface MenuPosition {
  top: number;
  left: number;
}

export interface FilterClause {
  field: string;
  op: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'isType' | 'isNotType';
  value: any;
  enabled: boolean;
}

export interface FilterExpression {
  clauses: FilterClause[];
}

export interface FilterMenuState {
  isOpen: boolean;
  position: MenuPosition;
  editingFilter?: FilterClause;
  field?: string;
}

export interface FilterMenuProps {
  field: string;
  position: MenuPosition;
  onApply: (filter: FilterClause) => void;
  onClose: () => void;
  existingFilter?: FilterClause;
  theme?: ThemeClasses;
}

export interface FilterDebugProps {
  filters: FilterExpression;
  selectedTable: string;
}

export interface ActiveFiltersProps {
  filters: FilterExpression;
  onRemove: (field: string) => void;
  onClearAll: () => void;
  selectedTable: string;
  theme?: ThemeClasses;
  onEdit?: (e: React.MouseEvent, field: string) => void;
}

export interface UseFiltersProps {
  onFilterApply: (filter: FilterClause) => void;
  onFilterRemove: (field: string) => void;
  onFilterClear: () => void;
  selectedTable: string;
  initialFilters?: FilterExpression;
}

export interface UseFiltersReturn {
  filters: FilterExpression;
  filterMenuField: string | null;
  filterMenuPosition: MenuPosition | null;
  handleFilterButtonClick: (e: React.MouseEvent, header: string) => void;
  handleFilterApply: (filter: FilterClause) => void;
  handleFilterRemove: (field: string) => void;
  clearFilters: () => void;
  closeFilterMenu: () => void;
  setFilters: React.Dispatch<React.SetStateAction<FilterExpression>>;
}

export type FilterOperation = 
  | 'equals' 
  | 'not_equals' 
  | 'contains' 
  | 'not_contains' 
  | 'starts_with' 
  | 'ends_with' 
  | 'greater_than' 
  | 'less_than' 
  | 'greater_than_equal' 
  | 'less_than_equal' 
  | 'is_empty' 
  | 'is_not_empty';

