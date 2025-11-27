import React from 'react';
import { Filter, Plus, MoreVertical, EyeOff } from 'lucide-react';

export interface TableToolbarProps {
  selectedTable: string;
  documentCount: number;
  onFilterToggle: () => void;
  isFilterOpen: boolean;
  onColumnVisibilityToggle?: () => void;
  hiddenFieldsCount?: number;
}

export const TableToolbar: React.FC<TableToolbarProps> = ({
  selectedTable,
  documentCount,
  onFilterToggle,
  isFilterOpen,
  onColumnVisibilityToggle,
  hiddenFieldsCount = 0,
}) => {

  return (
    <div style={{
      height: '40px',
      borderBottom: '1px solid #2D313A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 12px',
      backgroundColor: '#0F1115',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          onClick={onFilterToggle}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: isFilterOpen ? '#fff' : '#9ca3af',
            backgroundColor: isFilterOpen ? '#1C1F26' : 'transparent',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px',
          }}
          onMouseEnter={(e) => {
            if (!isFilterOpen) {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.backgroundColor = '#1C1F26';
            }
          }}
          onMouseLeave={(e) => {
            if (!isFilterOpen) {
              e.currentTarget.style.color = '#9ca3af';
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <Filter size={14} />
          <span style={{ fontSize: '12px', fontWeight: 500 }}>Filter & Sort</span>
        </div>
        
        <div style={{ width: '1px', height: '16px', backgroundColor: '#2D313A', margin: '0 4px' }}></div>
        
        <div style={{ color: '#6b7280', fontSize: '12px', padding: '0 8px' }}>
          {documentCount} {documentCount === 1 ? 'document' : 'documents'}
        </div>

        {onColumnVisibilityToggle && (
          <>
            <div style={{ width: '1px', height: '16px', backgroundColor: '#2D313A', margin: '0 4px' }}></div>
            <button
              type="button"
              onClick={onColumnVisibilityToggle}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#9ca3af',
                fontSize: '12px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.backgroundColor = '#1C1F26';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#9ca3af';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <EyeOff size={14} />
              <span>Hide</span>
            </button>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          style={{
            height: '28px',
            padding: '0 12px',
            backgroundColor: '#1C1F26',
            border: '1px solid #2D313A',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2D313A';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1C1F26';
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
            backgroundColor: '#1C1F26',
            border: '1px solid #2D313A',
            borderRadius: '4px',
            color: '#fff',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2D313A';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1C1F26';
          }}
        >
          <MoreVertical size={14} />
        </button>
      </div>
    </div>
  );
};

