import React from 'react';
import { Filter, Plus, MoreVertical, EyeOff, Trash2, Edit2, X, ArrowUpDown } from 'lucide-react';
import { FilterExpression, SortConfig } from '../../../types';
import { operatorOptions } from '../../../utils/constants';
import { TooltipAction } from '../../../components/shared/tooltip-action';

export interface TableToolbarProps {
  selectedTable: string;
  documentCount: number;
  onFilterToggle: () => void;
  isFilterOpen: boolean;
  onAddDocument?: () => void;
  onColumnVisibilityToggle?: () => void;
  hiddenFieldsCount?: number;
  selectedCount?: number;
  onDeleteSelected?: () => void;
  onEditSelected?: () => void;
  filters?: FilterExpression;
  sortConfig?: SortConfig | null;
  onRemoveFilter?: (index: number) => void;
  onClearFilters?: () => void;
  onRemoveSort?: () => void;
}

export const TableToolbar: React.FC<TableToolbarProps> = ({
  selectedTable,
  documentCount,
  onFilterToggle,
  isFilterOpen,
  onAddDocument,
  onColumnVisibilityToggle,
  hiddenFieldsCount = 0,
  selectedCount = 0,
  onDeleteSelected,
  onEditSelected,
  filters,
  sortConfig,
  onRemoveFilter,
  onClearFilters,
  onRemoveSort,
}) => {

  const hasSelection = selectedCount > 0;
  const deleteLabel = selectedCount > 1 ? `Delete ${selectedCount} rows` : 'Delete';
  const activeFilters = filters?.clauses?.filter(f => f.enabled) || [];
  const hasActiveFilters = activeFilters.length > 0 || sortConfig !== null;

  return (
    <div style={{
      height: '40px',
      borderBottom: '1px solid var(--color-panel-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 12px',
      backgroundColor: 'var(--color-panel-bg)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          onClick={onFilterToggle}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: isFilterOpen ? 'var(--color-panel-text)' : 'var(--color-panel-text-secondary)',
            backgroundColor: isFilterOpen ? 'var(--color-panel-bg-tertiary)' : 'transparent',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px',
          }}
          onMouseEnter={(e) => {
            if (!isFilterOpen) {
              e.currentTarget.style.color = 'var(--color-panel-text)';
              e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isFilterOpen) {
              e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <Filter size={14} />
          <span style={{ fontSize: '12px', fontWeight: 500 }}>Filter & Sort</span>
        </div>
        
        <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--color-panel-border)', margin: '0 4px' }}></div>
        
        <div style={{ color: 'var(--color-panel-text-muted)', fontSize: '12px', padding: '0 8px' }}>
          {documentCount} {documentCount === 1 ? 'document' : 'documents'}
        </div>

        {/* Active Filters & Sort */}
        {hasActiveFilters && (
          <>
            <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--color-panel-border)', margin: '0 4px' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', maxWidth: '400px', overflow: 'hidden' }}>
              {/* Sort Badge */}
              {sortConfig && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    backgroundColor: 'var(--color-panel-bg-tertiary)',
                    border: '1px solid var(--color-panel-border)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: 'var(--color-panel-text)',
                    fontFamily: 'monospace',
                  }}
                >
                  <ArrowUpDown size={10} style={{ color: 'var(--color-panel-text-muted)' }} />
                  <span>{sortConfig.field}</span>
                  <span style={{ color: 'var(--color-panel-text-muted)' }}>
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                  {onRemoveSort && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveSort();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0',
                        marginLeft: '4px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-panel-text-muted)',
                        borderRadius: '50%',
                        width: '14px',
                        height: '14px',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--color-panel-text)';
                        e.currentTarget.style.backgroundColor = 'var(--color-panel-border)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--color-panel-text-muted)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              )}

              {/* Filter Badges */}
              {activeFilters.map((filter, index) => {
                const filterIndex = filters?.clauses?.findIndex((f, i) => 
                  f.field === filter.field && f.op === filter.op && 
                  JSON.stringify(f.value) === JSON.stringify(filter.value)
                ) ?? index;
                const operatorLabel = operatorOptions.find(op => op.value === filter.op)?.label || filter.op;
                const valueDisplay = typeof filter.value === 'string' 
                  ? filter.value.length > 20 
                    ? filter.value.substring(0, 20) + '...' 
                    : filter.value
                  : JSON.stringify(filter.value).length > 20
                    ? JSON.stringify(filter.value).substring(0, 20) + '...'
                    : JSON.stringify(filter.value);

                return (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      backgroundColor: 'var(--color-panel-bg-tertiary)',
                      border: '1px solid var(--color-panel-border)',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: 'var(--color-panel-text)',
                    }}
                  >
                    <span style={{ fontFamily: 'monospace', color: 'var(--color-panel-text-secondary)' }}>
                      {filter.field}
                    </span>
                    <span style={{ color: 'var(--color-panel-text-muted)' }}>{operatorLabel}</span>
                    <span style={{ fontFamily: 'monospace', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {valueDisplay}
                    </span>
                    {onRemoveFilter && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveFilter(filterIndex);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0',
                          marginLeft: '4px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--color-panel-text-muted)',
                          borderRadius: '50%',
                          width: '14px',
                          height: '14px',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--color-panel-text)';
                          e.currentTarget.style.backgroundColor = 'var(--color-panel-border)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--color-panel-text-muted)';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Clear All Button */}
              {hasActiveFilters && onClearFilters && (
                <button
                  type="button"
                  onClick={onClearFilters}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    backgroundColor: 'transparent',
                    border: '1px solid transparent',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: 'var(--color-panel-text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--color-panel-text)';
                    e.currentTarget.style.borderColor = 'var(--color-panel-border)';
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--color-panel-text-muted)';
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <X size={10} />
                  Clear all
                </button>
              )}
            </div>
          </>
        )}

        {onColumnVisibilityToggle && (
          <>
            <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--color-panel-border)', margin: '0 4px' }}></div>
            {hiddenFieldsCount > 0 ? (
              <button
                type="button"
                onClick={onColumnVisibilityToggle}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  backgroundColor: 'color-mix(in srgb, var(--color-panel-accent) 20%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--color-panel-accent) 50%, transparent)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  color: 'var(--color-panel-text)',
                  fontSize: '11px',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-panel-accent) 30%, transparent)';
                  e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-panel-accent) 70%, transparent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-panel-accent) 20%, transparent)';
                  e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-panel-accent) 50%, transparent)';
                }}
              >
                <EyeOff size={12} />
                <span>{hiddenFieldsCount} hidden {hiddenFieldsCount === 1 ? 'field' : 'fields'}</span>
              </button>
            ) : (
              <TooltipAction
                icon={<EyeOff size={14} />}
                text="Toggle visible fields"
                onClick={onColumnVisibilityToggle}
              />
            )}
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {hasSelection ? (
          <>
            <button
              style={{
                height: '28px',
                padding: '0 12px',
                backgroundColor: 'var(--color-panel-bg-tertiary)',
                border: '1px solid var(--color-panel-border)',
                borderRadius: '4px',
                fontSize: '12px',
                color: 'var(--color-panel-text)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onClick={() => {
                if (selectedCount === 1) {
                  onEditSelected?.();
                }
              }}
            >
              <Edit2 size={12} />
              Edit
            </button>
            <button
              style={{
                height: '28px',
                padding: '0 12px',
                backgroundColor: 'color-mix(in srgb, var(--color-panel-error) 20%, var(--color-panel-bg-tertiary))',
                border: '1px solid var(--color-panel-error)',
                borderRadius: '4px',
                fontSize: '12px',
                color: 'var(--color-panel-text)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background-color 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-panel-error) 30%, var(--color-panel-bg-tertiary))';
                e.currentTarget.style.borderColor = 'var(--color-panel-error)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-panel-error) 20%, var(--color-panel-bg-tertiary))';
                e.currentTarget.style.borderColor = 'var(--color-panel-error)';
              }}
              onClick={() => onDeleteSelected?.()}
            >
              <Trash2 size={12} />
              {deleteLabel}
            </button>
            <button
              style={{
                height: '28px',
                width: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--color-panel-bg-tertiary)',
                border: '1px solid var(--color-panel-border)',
                borderRadius: '4px',
                color: 'var(--color-panel-text)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-panel-border)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
              }}
            >
              <MoreVertical size={14} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onAddDocument?.()}
              style={{
                height: '28px',
                padding: '0 12px',
                backgroundColor: 'var(--color-panel-bg-tertiary)',
                border: '1px solid var(--color-panel-border)',
                borderRadius: '4px',
                fontSize: '12px',
                color: 'var(--color-panel-text)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-panel-border)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
              }}
            >
              <Plus size={14} />
              Add
            </button>
            
            <button
              style={{
                height: '28px',
                width: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--color-panel-bg-tertiary)',
                border: '1px solid var(--color-panel-border)',
                borderRadius: '4px',
                color: 'var(--color-panel-text)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-panel-border)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
              }}
            >
              <MoreVertical size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

