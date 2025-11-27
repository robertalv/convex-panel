import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { TableDefinition } from '../../../types';
import { ComponentSelector } from '../../../components/function-runner/components/component-selector';

export interface TableSidebarProps {
  tables: TableDefinition;
  selectedTable: string;
  setSelectedTable: (tableName: string) => void;
  isLoading: boolean;
  selectedComponent?: string | null;
  onComponentSelect?: (component: string | null) => void;
  availableComponents?: string[];
}

export const TableSidebar: React.FC<TableSidebarProps> = ({
  tables,
  selectedTable,
  setSelectedTable,
  isLoading,
  selectedComponent,
  onComponentSelect,
  availableComponents,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and sort tables based on search query
  const filteredTables = Object.keys(tables)
    .filter(tableName =>
      tableName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    // Sort alphabetically (case-insensitive)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  return (
    <div style={{
      width: '240px',
      borderRight: '1px solid var(--color-panel-border)',
      backgroundColor: 'var(--color-panel-bg)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Component Selector */}
      {availableComponents && availableComponents.length > 0 && (
        <div style={{ 
          padding: '12px', 
          borderBottom: '1px solid var(--color-panel-border)',
          backgroundColor: 'var(--color-panel-bg)'
        }}>
          <ComponentSelector
            selectedComponent={selectedComponent || null}
            onSelect={onComponentSelect || (() => {})}
            components={availableComponents}
          />
        </div>
      )}

      {/* Search Input */}
      <div style={{ 
        padding: '12px', 
        borderBottom: '1px solid var(--color-panel-border)',
        backgroundColor: 'var(--color-panel-bg)'
      }}>
        <div style={{ position: 'relative' }}>
          <Search 
            size={14} 
            style={{ 
              position: 'absolute', 
              left: '10px', 
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-panel-text-muted)',
              pointerEvents: 'none',
              zIndex: 1
            }} 
          />
          <input
            type="text"
            placeholder="Search tables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'var(--color-panel-bg-secondary)',
              border: '1px solid var(--color-panel-border)',
              borderRadius: '6px',
              height: '36px',
              paddingLeft: '32px',
              paddingRight: '12px',
              fontSize: '13px',
              color: 'var(--color-panel-text)',
              outline: 'none',
              transition: 'border-color 0.2s ease, background-color 0.2s ease',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-panel-accent)';
              e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-panel-border)';
              e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-secondary)';
            }}
          />
        </div>
      </div>

      {/* Table List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 0',
      }}>
        {isLoading ? (
          <div style={{ padding: '12px', color: 'var(--color-panel-text-secondary)', fontSize: '12px' }}>
            Loading tables...
          </div>
        ) : filteredTables.length === 0 ? (
          <div style={{ padding: '12px', color: 'var(--color-panel-text-secondary)', fontSize: '12px' }}>
            {searchQuery ? 'No tables found' : 'No tables available'}
          </div>
        ) : (
          filteredTables.map((tableName) => (
            <div
              key={tableName}
              onClick={() => setSelectedTable(tableName)}
              style={{
                padding: '6px 12px',
                margin: '0 8px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontFamily: 'monospace',
                backgroundColor: selectedTable === tableName ? 'var(--color-panel-bg-tertiary)' : 'transparent',
                color: selectedTable === tableName ? 'var(--color-panel-text)' : 'var(--color-panel-text-secondary)',
              }}
              onMouseEnter={(e) => {
                if (selectedTable !== tableName) {
                  e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                  e.currentTarget.style.opacity = '0.5';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedTable !== tableName) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.opacity = '1';
                }
              }}
            >
              <span style={{ fontSize: '12px' }}>{tableName}</span>
            </div>
          ))
        )}
      </div>

      {/* Create Table Button */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--color-panel-border)' }}>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--color-panel-text-secondary)',
            fontSize: '12px',
            fontWeight: 500,
            width: '100%',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-panel-text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
          }}
        >
          <Plus size={14} />
          Create Table
        </button>
      </div>
    </div>
  );
};

