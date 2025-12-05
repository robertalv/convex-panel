import React, { useEffect, useMemo } from 'react';
import { DataFilterPanel } from './data-filter-panel';
import type { FilterExpression, SortConfig, TableDefinition } from '../../../types';

export interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterExpression;
  setFilters: (filters: FilterExpression) => void;
  sortConfig: SortConfig | null;
  setSortConfig: (sortConfig: SortConfig | null) => void;
  selectedTable: string;
  tables: TableDefinition;
  visibleFields?: string[];
  onVisibleFieldsChange?: (fields: string[]) => void;
  openColumnVisibility?: boolean;
  /** Optional admin client for filter history persistence */
  adminClient?: any;
  /** Optional user ID for scoping filter history */
  userId?: string;
}

export const FilterSheet: React.FC<FilterSheetProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters,
  sortConfig,
  setSortConfig,
  selectedTable,
  tables,
  visibleFields,
  onVisibleFieldsChange,
  openColumnVisibility,
  adminClient,
  userId = 'default',
}) => {
  // Create filter history API using adminClient
  const filterHistoryApi = useMemo(() => {
    if (!adminClient) return undefined;
    
    return {
      push: async (scope: string, state: { filters: FilterExpression; sortConfig: SortConfig | null }) => {
        await adminClient.mutation('filterHistory:push' as any, {
          scope,
          state,
        });
      },
      undo: async (scope: string, count?: number) => {
        return await adminClient.mutation('filterHistory:undo' as any, {
          scope,
          count,
        });
      },
      redo: async (scope: string, count?: number) => {
        return await adminClient.mutation('filterHistory:redo' as any, {
          scope,
          count,
        });
      },
      getStatus: async (scope: string) => {
        const result = await adminClient.query('filterHistory:getStatus' as any, {
          scope,
        });
        return result || { canUndo: false, canRedo: false, position: null, length: 0 };
      },
      getCurrentState: async (scope: string) => {
        return await adminClient.query('filterHistory:getCurrentState' as any, {
          scope,
        });
      },
    };
  }, [adminClient]);
  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'color-mix(in srgb, var(--color-panel-bg) 80%, transparent)',
          zIndex: 999,
          animation: 'fadeIn 0.2s ease-out',
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '480px',
          maxWidth: '90vw',
          backgroundColor: 'var(--color-panel-bg)',
          borderLeft: '1px solid var(--color-panel-border)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 24px var(--color-panel-shadow)',
          animation: 'slideInRight 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Content - Header is inside DataFilterPanel */}
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            backgroundColor: 'var(--color-panel-bg)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <DataFilterPanel
            filters={filters}
            setFilters={setFilters}
            sortConfig={sortConfig}
            setSortConfig={setSortConfig}
            selectedTable={selectedTable}
            tables={tables}
            visibleFields={visibleFields}
            onVisibleFieldsChange={onVisibleFieldsChange}
            onClose={onClose}
            openColumnVisibility={openColumnVisibility}
            filterHistoryApi={filterHistoryApi}
            userId={userId}
          />
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
};

