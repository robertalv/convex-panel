import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { TableDefinition } from '../../../types';

export interface TableSidebarProps {
  tables: TableDefinition;
  selectedTable: string;
  setSelectedTable: (tableName: string) => void;
  isLoading: boolean;
}

export const TableSidebar: React.FC<TableSidebarProps> = ({
  tables,
  selectedTable,
  setSelectedTable,
  isLoading,
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
      borderRight: '1px solid #2D313A',
      backgroundColor: '#0F1115',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Search Input */}
      <div style={{ 
        padding: '12px', 
        borderBottom: '1px solid #2D313A',
        backgroundColor: '#0F1115'
      }}>
        <div style={{ position: 'relative' }}>
          <Search 
            size={14} 
            style={{ 
              position: 'absolute', 
              left: '10px', 
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280',
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
              backgroundColor: '#1C1F26',
              border: '1px solid #2D313A',
              borderRadius: '6px',
              height: '36px',
              paddingLeft: '32px',
              paddingRight: '12px',
              fontSize: '13px',
              color: '#fff',
              outline: 'none',
              transition: 'border-color 0.2s ease, background-color 0.2s ease',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#3B82F6';
              e.currentTarget.style.backgroundColor = '#252932';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#2D313A';
              e.currentTarget.style.backgroundColor = '#1C1F26';
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
          <div style={{ padding: '12px', color: '#9ca3af', fontSize: '12px' }}>
            Loading tables...
          </div>
        ) : filteredTables.length === 0 ? (
          <div style={{ padding: '12px', color: '#9ca3af', fontSize: '12px' }}>
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
                backgroundColor: selectedTable === tableName ? '#1C1F26' : 'transparent',
                color: selectedTable === tableName ? '#fff' : '#9ca3af',
              }}
              onMouseEnter={(e) => {
                if (selectedTable !== tableName) {
                  e.currentTarget.style.backgroundColor = '#1C1F26';
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
      <div style={{ padding: '12px', borderTop: '1px solid #2D313A' }}>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#9ca3af',
            fontSize: '12px',
            fontWeight: 500,
            width: '100%',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#9ca3af';
          }}
        >
          <Plus size={14} />
          Create Table
        </button>
      </div>
    </div>
  );
};

