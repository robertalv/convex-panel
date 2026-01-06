import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Table2, Database, X, ChevronRight, ChevronDown } from 'lucide-react';
import type { TableDefinition } from '../../../types';
import type { RecentlyViewedTable } from '../../../types/tables';
import { ComponentSelector } from '../../../components/component-selector';
import { validateConvexIdentifier } from '../../../utils/validation';
import { callConvexMutation } from '../../../utils/api/helpers';
import { getRecentlyViewedTables } from '../../../utils/storage';

/**
 * Tree item component - matches SchemaTreeSidebar exactly
 */
interface TreeItemProps {
  label: string;
  icon?: React.ReactNode;
  depth: number;
  isExpanded?: boolean;
  isExpandable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onToggle?: () => void;
  rightContent?: React.ReactNode;
  className?: string;
}

function TreeItem({
  label,
  icon,
  depth,
  isExpanded,
  isExpandable,
  isSelected,
  onClick,
  onToggle,
  rightContent,
  className = "",
}: TreeItemProps) {
  const paddingLeft = 12 + depth * 16;

  return (
    <div
      className={`flex items-center h-7 cursor-pointer text-xs transition-colors ${className}`}
      style={{
        paddingLeft,
        backgroundColor: isSelected
          ? "var(--color-surface-raised)"
          : "transparent",
        color: isSelected
          ? "var(--color-text-base)"
          : "var(--color-text-muted)",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = "var(--color-surface-raised)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = "transparent";
        }
      }}
      onClick={(e) => {
        if (isExpandable && onToggle) {
          onToggle();
        }
        onClick?.();
        e.stopPropagation();
      }}
    >
      {isExpandable && (
        <span
          className="w-4 h-4 flex items-center justify-center mr-1"
          style={{ color: "var(--color-text-muted)" }}
        >
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
      )}
      {!isExpandable && <span className="w-4 mr-1" />}
      {icon && <span className="mr-2 shrink-0">{icon}</span>}
      <span className="flex-1 truncate">{label}</span>
      {rightContent && (
        <span className="mr-2" style={{ color: "var(--color-text-muted)" }}>
          {rightContent}
        </span>
      )}
    </div>
  );
}

export interface TableSidebarProps {
  tables: TableDefinition;
  selectedTable: string;
  setSelectedTable: (tableName: string) => void;
  isLoading: boolean;
  selectedComponent?: string | null;
  onComponentSelect?: (component: string | null) => void;
  availableComponents?: string[];
  convexUrl?: string;
  accessToken?: string;
  adminClient?: any;
  componentId?: string | null;
  onTableCreated?: () => void;
  /** Optional snapshot of table names to compare against (for showing new table indicators) */
  snapshotTableNames?: Set<string> | string[];
}

export const TableSidebar: React.FC<TableSidebarProps> = ({
  tables,
  selectedTable,
  setSelectedTable,
  isLoading,
  selectedComponent,
  onComponentSelect,
  availableComponents,
  convexUrl,
  accessToken,
  adminClient,
  componentId,
  onTableCreated,
  snapshotTableNames,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [newTableName, setNewTableName] = useState<string | undefined>(undefined);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedTable[]>([]);
  const [expanded, setExpanded] = useState({
    recentlyViewed: true,
    tables: true,
  });

  // Convert snapshot table names to Set for efficient lookup
  const snapshotTableSet = useMemo(() => {
    if (!snapshotTableNames) return null;
    if (snapshotTableNames instanceof Set) return snapshotTableNames;
    return new Set(snapshotTableNames);
  }, [snapshotTableNames]);

  // Determine if a table is new (not in snapshot)
  const isTableNew = useMemo(() => {
    if (!snapshotTableSet) return () => false;
    return (tableName: string) => !snapshotTableSet.has(tableName);
  }, [snapshotTableSet]);

  // Load and filter recently viewed tables
  useEffect(() => {
    const recent = getRecentlyViewedTables();
    // Filter to only show tables that exist in current tables object
    const validRecent = recent.filter(rv => tables[rv.name]);
    setRecentlyViewed(validRecent);
  }, [tables, selectedTable]);

  // Filter and sort tables based on search query
  const filteredTables = Object.keys(tables)
    .filter(tableName =>
      tableName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    // Sort alphabetically (case-insensitive)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  // Filter recently viewed tables based on search query
  const filteredRecentlyViewed = recentlyViewed
    .filter(rv => {
      if (!searchQuery) return true;
      return rv.name.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .slice(0, 5); // Limit to top 5 most recent

  // Validate table name
  const validationError = validateConvexIdentifier(
    newTableName || '',
    'Table name'
  );

  // Check if table already exists
  const tableExists = newTableName ? Object.keys(tables).includes(newTableName) : false;

  // Handle create table
  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTableName || validationError || tableExists) {
      return;
    }

    if (!convexUrl || !accessToken) {
      setCreateError('Missing deployment URL or access token');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const normalizedComponentId = componentId === 'app' || componentId === null ? null : componentId;

      // Try using adminClient mutation first (preferred method)
      if (adminClient) {
        try {
          await adminClient.mutation(
            '_system/frontend/createTable:default' as any,
            {
              table: newTableName,
              componentId: normalizedComponentId,
            }
          );
        } catch (adminError: any) {
          // If adminClient fails, fall back to HTTP API
          console.warn('Admin client mutation failed, trying HTTP API:', adminError);
          await callConvexMutation(
            convexUrl,
            accessToken,
            '_system/frontend/createTable:default',
            {
              table: newTableName,
              componentId: normalizedComponentId,
            }
          );
        }
      } else {
        // Use HTTP API directly
        await callConvexMutation(
          convexUrl,
          accessToken,
          '_system/frontend/createTable:default',
          {
            table: newTableName,
            componentId: normalizedComponentId,
          }
        );
      }

      // Success - refresh tables and select the new table
      setNewTableName(undefined);
      if (onTableCreated) {
        onTableCreated();
      }
      // Select the newly created table
      setSelectedTable(newTableName);
    } catch (error: any) {
      let errorMessage = 'Failed to create table';
      
      if (error?.data) {
        errorMessage = error.data;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setCreateError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{
        width: '240px',
        borderRight: '1px solid var(--color-border-base)',
        backgroundColor: 'var(--color-surface-base)',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Component Selector */}
      {availableComponents && availableComponents.length > 1 && (
        <div
          className="p-2"
          style={{ borderBottom: '1px solid var(--color-border-base)' }}
        >
          <ComponentSelector
            selectedComponent={selectedComponent || null}
            onSelect={onComponentSelect || (() => {})}
            components={availableComponents}
          />
        </div>
      )}

      {/* Search Input */}
      <div
        className="p-2"
        style={{ borderBottom: '1px solid var(--color-border-base)' }}
      >
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--color-text-muted)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tables..."
            className="w-full pl-8 pr-8 py-1.5 text-xs rounded-md focus:outline-none"
            style={{
              backgroundColor: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border-base)',
              color: 'var(--color-text-base)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-text-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-text-base)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-muted)';
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Table List */}
      <div
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent"
        style={{ scrollbarColor: "var(--color-border-strong) transparent" }}
      >
        {/* Recently Viewed Section */}
        {!isLoading && filteredRecentlyViewed.length > 0 && (
          <>
            <TreeItem
              label="Recently Viewed"
              icon={
                <Database size={14} style={{ color: "var(--color-text-muted)" }} />
              }
              depth={0}
              isExpandable
              isExpanded={expanded.recentlyViewed}
              onToggle={() => setExpanded(prev => ({ ...prev, recentlyViewed: !prev.recentlyViewed }))}
              rightContent={
                <span className="text-[10px]">{filteredRecentlyViewed.length}</span>
              }
            />
            {expanded.recentlyViewed && filteredRecentlyViewed.map((rv) => {
              const isSelected = selectedTable === rv.name;
              const isNew = isTableNew(rv.name);
              return (
                <TreeItem
                  key={rv.name}
                  label={rv.name}
                  icon={
                    <Table2
                      size={12}
                      style={{ color: "var(--color-info-base)" }}
                    />
                  }
                  depth={0}
                  isSelected={isSelected}
                  onClick={() => setSelectedTable(rv.name)}
                  className="font-mono"
                  rightContent={
                    isNew ? (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
                        style={{
                          backgroundColor: "color-mix(in srgb, #22c55e 20%, transparent)",
                          color: "#22c55e",
                        }}
                        title="New table (not in snapshot)"
                      >
                        NEW
                      </span>
                    ) : undefined
                  }
                />
              );
            })}
          </>
        )}

        {/* Main Table List */}
        {isLoading ? (
          <div
            className="px-3 py-2 text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            Loading tables...
          </div>
        ) : filteredTables.length === 0 ? (
          <div
            className="px-3 py-2 text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            {searchQuery ? "No tables found" : "No tables available"}
          </div>
        ) : (
          <>
            <TreeItem
              label="Tables"
              icon={
                <Database size={14} style={{ color: "var(--color-text-muted)" }} />
              }
              depth={0}
              isExpandable
              isExpanded={expanded.tables}
              onToggle={() => setExpanded(prev => ({ ...prev, tables: !prev.tables }))}
              rightContent={
                <span className="text-[10px]">{filteredTables.length}</span>
              }
            />
            {expanded.tables && filteredTables.map((tableName) => {
              const isSelected = selectedTable === tableName;
              const isNew = isTableNew(tableName);
              return (
                <TreeItem
                  key={tableName}
                  label={tableName}
                  icon={
                    <Table2
                      size={12}
                      style={{ color: "var(--color-info-base)" }}
                    />
                  }
                  depth={0}
                  isSelected={isSelected}
                  onClick={() => setSelectedTable(tableName)}
                  className="font-mono"
                  rightContent={
                    isNew ? (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
                        style={{
                          backgroundColor: "color-mix(in srgb, #22c55e 20%, transparent)",
                          color: "#22c55e",
                        }}
                        title="New table (not in snapshot)"
                      >
                        NEW
                      </span>
                    ) : undefined
                  }
                />
              );
            })}
          </>
        )}
      </div>

      {/* Create Table Section */}
      <div
        className="p-2"
        style={{ borderTop: '1px solid var(--color-border-base)' }}
      >
        {newTableName !== undefined ? (
          <form
            onSubmit={handleCreateTable}
            className="flex flex-col gap-1.5"
          >
            <input
              type="text"
              autoFocus
              placeholder="Untitled table"
              value={newTableName}
              onChange={(e) => {
                setNewTableName(e.target.value);
                setCreateError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setNewTableName(undefined);
                  setCreateError(null);
                }
              }}
              className="w-full px-3 py-1.5 text-xs rounded-md focus:outline-none font-mono"
              style={{
                backgroundColor: 'var(--color-surface-raised)',
                border: createError || tableExists
                  ? '1px solid var(--color-error-base)'
                  : '1px solid var(--color-border-base)',
                color: 'var(--color-text-base)',
                transition: 'border-color 0.2s ease, background-color 0.2s ease',
              }}
              onFocus={(e) => {
                if (!createError && !tableExists) {
                  e.currentTarget.style.borderColor = 'var(--color-info-base)';
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-overlay)';
                }
              }}
              onBlur={(e) => {
                if (!createError && !tableExists) {
                  e.currentTarget.style.borderColor = 'var(--color-border-base)';
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)';
                }
              }}
            />
            {(validationError || tableExists || createError) && (
              <div
                className="text-[10px] px-1"
                style={{
                  color: 'var(--color-error-base)',
                  lineHeight: '14px',
                  minHeight: '14px',
                }}
              >
                {tableExists
                  ? `Table "${newTableName}" already exists.`
                  : createError
                  ? createError
                  : validationError}
              </div>
            )}
            <div className="flex gap-2 justify-end mt-1">
              <button
                type="button"
                onClick={() => {
                  setNewTableName(undefined);
                  setCreateError(null);
                }}
                className="px-3 py-1 text-xs font-medium rounded transition-colors"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid var(--color-border-base)',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-base)';
                  e.currentTarget.style.borderColor = 'var(--color-border-strong)';
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                  e.currentTarget.style.borderColor = 'var(--color-border-base)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newTableName || !!validationError || tableExists || isCreating}
                className="px-3 py-1 text-xs font-medium rounded transition-opacity"
                style={{
                  backgroundColor: (!newTableName || !!validationError || tableExists || isCreating)
                    ? 'var(--color-surface-raised)'
                    : 'var(--color-info-base)',
                  border: 'none',
                  color: (!newTableName || !!validationError || tableExists || isCreating)
                    ? 'var(--color-text-muted)'
                    : 'white',
                  cursor: (!newTableName || !!validationError || tableExists || isCreating)
                    ? 'not-allowed'
                    : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!(!newTableName || !!validationError || tableExists || isCreating)) {
                    e.currentTarget.style.opacity = '0.9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(!newTableName || !!validationError || tableExists || isCreating)) {
                    e.currentTarget.style.opacity = '1';
                  }
                }}
              >
                {isCreating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setNewTableName('')}
            className="flex items-center gap-2 w-full text-xs font-medium transition-colors"
            style={{
              color: 'var(--color-text-muted)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-text-base)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-muted)';
            }}
          >
            <Plus size={14} />
            Create Table
          </button>
        )}
      </div>

      {/* Stats footer */}
      {!isLoading && Object.keys(tables).length > 0 && (
        <div
          className="p-2 text-[10px] flex items-center justify-between"
          style={{
            borderTop: '1px solid var(--color-border-base)',
            color: 'var(--color-text-muted)',
          }}
        >
          <span>{Object.keys(tables).length} table{Object.keys(tables).length !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
};

