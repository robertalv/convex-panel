import React from 'react';
import { ContextMenuEntry } from '../../../../components/shared/context-menu';
import { copyToClipboard } from '../../../../utils/toast';
import { formatValue } from './data-table-utils';
import { DocumentViewer } from '../document-viewer';
import { CellViewer } from '../cell-viewer';
import { FilterExpression, FilterClause } from '../../../../types';

export const buildCellMenuItems = (
  column: string,
  value: any,
  rowId: string,
  onEdit?: (rowId: string, column: string, value: any) => void,
  options?: {
    tableName?: string;
    adminClient?: any;
    deploymentUrl?: string;
    componentId?: string | null;
    onNavigateToTable?: (tableName: string, documentId: string) => void;
    accessToken?: string;
    teamSlug?: string;
    projectSlug?: string;
    filters?: FilterExpression;
    setFilters?: (filters: FilterExpression) => void;
    onDeleteDocument?: (documentId: string) => Promise<void>;
    getDocument?: (documentId: string) => any;
  },
): ContextMenuEntry[] => {
  // Helper to create filter menu items based on value type
  const createFilterItems = (): ContextMenuEntry[] => {
    if (!options?.setFilters || !options?.filters) return [];

    const valueType = typeof value;
    const isNumber = valueType === 'number';
    const isString = valueType === 'string';
    const isBoolean = valueType === 'boolean';
    const isNullish = value === null || value === undefined;

    const handleFilter = (op: FilterClause['op'], filterValue?: any) => {
      if (!options.setFilters || !options.filters) return;

      const existingClauseIndex = options.filters.clauses.findIndex(
        (c) => c.field === column && c.op === op
      );

      let newClauses: FilterClause[];
      
      if (existingClauseIndex >= 0) {
        // Update existing filter
        newClauses = [...options.filters.clauses];
        newClauses[existingClauseIndex] = {
          ...newClauses[existingClauseIndex],
          value: filterValue !== undefined ? filterValue : value,
          enabled: true,
        };
      } else {
        // Add new filter
        newClauses = [
          ...options.filters.clauses,
          {
            field: column,
            op,
            value: filterValue !== undefined ? filterValue : value,
            enabled: true,
          },
        ];
      }

      options.setFilters({ clauses: newClauses });
    };

    const filterItems: ContextMenuEntry[] = [];

    if (isNumber) {
      filterItems.push(
        { label: `equals ${value}`, onClick: () => handleFilter('eq') },
        { label: `not equal ${value}`, onClick: () => handleFilter('neq') },
        { label: `> ${value}`, onClick: () => handleFilter('gt') },
        { label: `< ${value}`, onClick: () => handleFilter('lt') },
        { label: `>= ${value}`, onClick: () => handleFilter('gte') },
        { label: `<= ${value}`, onClick: () => handleFilter('lte') },
        { label: 'is number', onClick: () => handleFilter('isType', 'number') },
        { label: 'is not number', onClick: () => handleFilter('isNotType', 'number') },
      );
    } else if (isString) {
      const displayValue = value.length > 30 ? `${value.substring(0, 30)}...` : value;
      filterItems.push(
        { label: `equals "${displayValue}"`, onClick: () => handleFilter('eq') },
        { label: `not equal "${displayValue}"`, onClick: () => handleFilter('neq') },
        { label: `> "${displayValue}"`, onClick: () => handleFilter('gt') },
        { label: `< "${displayValue}"`, onClick: () => handleFilter('lt') },
        { label: `>= "${displayValue}"`, onClick: () => handleFilter('gte') },
        { label: `<= "${displayValue}"`, onClick: () => handleFilter('lte') },
        { label: 'is string', onClick: () => handleFilter('isType', 'string') },
        { label: 'is not string', onClick: () => handleFilter('isNotType', 'string') },
      );
    } else if (isBoolean) {
      filterItems.push(
        { label: `equals ${value}`, onClick: () => handleFilter('eq') },
        { label: `not equal ${value}`, onClick: () => handleFilter('neq') },
        { label: 'is boolean', onClick: () => handleFilter('isType', 'boolean') },
        { label: 'is not boolean', onClick: () => handleFilter('isNotType', 'boolean') },
      );
    } else if (isNullish) {
      filterItems.push(
        { label: 'is null', onClick: () => handleFilter('eq', null) },
        { label: 'is not null', onClick: () => handleFilter('neq', null) },
      );
    } else {
      // For objects/arrays, just provide equals and not equal
      const displayValue = JSON.stringify(value).substring(0, 30);
      filterItems.push(
        { label: `equals ${displayValue}...`, onClick: () => handleFilter('eq') },
        { label: `not equal ${displayValue}...`, onClick: () => handleFilter('neq') },
      );
    }

    return filterItems;
  };

  return [
  {
    label: `View ${column}`,
    shortcut: 'Space',
    viewing: {
      title: `Viewing ${column}`,
      content: React.createElement(CellViewer, {
        column,
        value,
        rowId,
      }),
      width: '500px',
    },
    onClick: () => {},
  },
  {
    label: `Copy ${column}`,
    shortcut: '⌘C',
    onClick: () => copyToClipboard(formatValue(value)),
  },
  ...(column !== '_id' && column !== '_creationTime' ? [{
    label: `Edit ${column}`,
    shortcut: 'Enter',
    onClick: () => {
      if (onEdit) {
        onEdit(rowId, column, value);
      }
    },
  }] : []),
  { type: 'divider' },
  {
    label: `Filter by ${column}`,
    onClick: () => {},
    submenu: createFilterItems(),
  },
  { type: 'divider' },
  {
    label: 'View document',
    shortcut: '⇧Space',
    viewing: options?.tableName ? {
      title: `Viewing Document: ${rowId}`,
      content: React.createElement(DocumentViewer, {
        documentId: rowId,
        tableName: options.tableName,
        adminClient: options.adminClient,
        deploymentUrl: options.deploymentUrl,
        componentId: options.componentId,
        onNavigateToTable: options.onNavigateToTable,
        accessToken: options.accessToken,
        teamSlug: options.teamSlug,
        projectSlug: options.projectSlug,
      }),
      width: '600px',
    } : undefined,
    onClick: () => {},
  },
  {
    label: 'Copy document',
    shortcut: '⌘⇧C',
    onClick: async () => {
      try {
        let doc: any = null;
        
        // Try to get document from cache first
        if (options?.getDocument) {
          doc = options.getDocument(rowId);
        }
        
        // If not in cache, fetch it
        if (!doc && options?.tableName && options?.adminClient) {
          const normalizedComponentId = options.componentId === 'app' || options.componentId === null ? null : options.componentId;
          const filterString = btoa(JSON.stringify({
            clauses: [{
              op: 'eq',
              field: '_id',
              value: rowId,
              enabled: true,
              id: `_id_${Date.now()}`
            }]
          }));

          const result = await options.adminClient.query(
            "_system/frontend/paginatedTableDocuments:default" as any,
            {
              table: options.tableName,
              componentId: normalizedComponentId,
              filters: filterString,
              paginationOpts: {
                numItems: 1,
                cursor: null,
                id: Date.now(),
              },
            }
          );

          const documents = result?.page || [];
          doc = documents[0];
        }
        
        if (doc) {
          const jsonString = JSON.stringify(doc, null, 2);
          copyToClipboard(jsonString);
        }
      } catch (error) {
        console.error('Error copying document:', error);
      }
    },
  },
  {
    label: 'Delete document',
    destructive: true,
    onClick: () => {
      if (options?.onDeleteDocument) {
        options.onDeleteDocument(rowId);
      }
    },
  },
  ];
};

