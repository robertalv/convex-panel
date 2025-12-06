import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  /** Optional container element to render the sheet inside */
  container?: HTMLElement | null;
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
  container,
}) => {
  // Create filter history API using adminClient
  const filterHistoryApi = useMemo(() => {
    if (!adminClient) return undefined;
    
    return {
      push: async (scope: string, state: { filters: FilterExpression; sortConfig: SortConfig | null }) => {
        await adminClient.mutation('convexPanel:push' as any, {
          scope,
          state,
        });
      },
      undo: async (scope: string, count?: number) => {
        return await adminClient.mutation('convexPanel:undo' as any, {
          scope,
          count,
        });
      },
      redo: async (scope: string, count?: number) => {
        return await adminClient.mutation('convexPanel:redo' as any, {
          scope,
          count,
        });
      },
      getStatus: async (scope: string) => {
        const result = await adminClient.query('convexPanel:getStatus' as any, {
          scope,
        });
        return result || { canUndo: false, canRedo: false, position: null, length: 0 };
      },
      getCurrentState: async (scope: string) => {
        return await adminClient.query('convexPanel:getCurrentState' as any, {
          scope,
        });
      },
    };
  }, [adminClient]);
  // Prevent body scroll when sheet is open (only if not in container)
  useEffect(() => {
    if (!container && isOpen) {
      document.body.style.overflow = 'hidden';
    } else if (!container) {
      document.body.style.overflow = '';
    }
    return () => {
      if (!container) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen, container]);

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

  const isInContainer = Boolean(container);
  const portalTarget = container || document.body;
  const positionType = isInContainer ? 'absolute' : 'fixed';

  const sheetContent = (
    <>
      {/* Backdrop - only show when not in container */}
      {!isInContainer && (
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
      )}

      {/* Sheet */}
      <div
        style={{
          position: positionType,
          top: 0,
          right: 0,
          bottom: 0,
          width: '480px',
          maxWidth: isInContainer ? '50vw' : '90vw',
          backgroundColor: 'var(--color-panel-bg)',
          borderLeft: '1px solid var(--color-panel-border)',
          zIndex: isInContainer ? 1000 : 1000,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isInContainer ? undefined : '-4px 0 24px var(--color-panel-shadow)',
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

  return createPortal(sheetContent, portalTarget);
};

