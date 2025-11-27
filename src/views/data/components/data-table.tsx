import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { TableDocument, TableDefinition } from '../../../types';

export interface DataTableProps {
  selectedTable: string;
  documents: TableDocument[];
  isLoading: boolean;
  tables: TableDefinition;
  visibleFields?: string[];
}

const formatValue = (value: any): string => {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'boolean') {
    return value.toString();
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'string') {
    // Truncate long strings
    if (value.length > 30) {
      return value.substring(0, 30) + '...';
    }
    return value;
  }
  if (value instanceof Date) {
    return value.toLocaleString();
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
};

const getValueColor = (value: any): string => {
  if (typeof value === 'string' && value.length > 20) {
    return '#fff'; // IDs and long strings
  }
  if (typeof value === 'boolean') {
    return '#F3A78C';
  }
  if (typeof value === 'number') {
    return '#F3A78C';
  }
  return '#d1d5db';
};

export const DataTable: React.FC<DataTableProps> = ({
  selectedTable,
  documents,
  isLoading,
  tables,
  visibleFields,
}) => {

  if (!selectedTable) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9ca3af',
        fontSize: '14px',
      }}>
        Select a table to view data
      </div>
    );
  }

  const tableSchema = tables[selectedTable];
  const columns = tableSchema?.fields?.map(field => field.fieldName) || [];
  
  // Always include _id and _creationTime
  const allColumns = ['_id', ...columns, '_creationTime'].filter((col, index, self) => 
    self.indexOf(col) === index
  );

  // Filter columns based on visible fields
  const displayColumns = visibleFields && visibleFields.length > 0
    ? allColumns.filter(col => visibleFields.includes(col))
    : allColumns;

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      minHeight: 0,
      overflow: 'hidden',
    }}>
      {/* Table Area */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        minHeight: 0,
      }}>
        {isLoading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#9ca3af',
            fontSize: '14px',
          }}>
            Loading...
          </div>
        ) : documents.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#9ca3af',
            fontSize: '14px',
          }}>
            No documents found
          </div>
        ) : (
          <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
            <table style={{
              textAlign: 'left',
              borderCollapse: 'collapse',
              tableLayout: 'auto',
              minWidth: '100%',
            }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr style={{
                  borderBottom: '1px solid #2D313A',
                  fontSize: '12px',
                  color: '#6b7280',
                  backgroundColor: '#0F1115',
                }}>
                  <th style={{ width: '32px', padding: '8px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      style={{
                        backgroundColor: '#1C1F26',
                        border: '1px solid #2D313A',
                        borderRadius: '2px',
                        cursor: 'pointer',
                      }}
                    />
                  </th>
                  {displayColumns.map((column, index) => (
                    <th
                      key={column}
                      style={{
                        padding: '8px',
                        fontWeight: 500,
                        borderRight: index === displayColumns.length - 1 ? 'none' : '1px solid #2D313A',
                      }}
                    >
                      {column}
                    </th>
                  ))}
                  <th style={{ padding: '8px' }}></th>
                </tr>
              </thead>
            <tbody style={{ fontSize: '12px', fontFamily: 'monospace', color: '#d1d5db' }}>
              {documents.map((doc: TableDocument, rowIndex: number) => (
                <tr
                  key={doc._id}
                  style={{
                    borderBottom: '1px solid #2D313A',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1C1F26';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      style={{
                        backgroundColor: '#1C1F26',
                        border: '1px solid #2D313A',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        width: '14px',
                        height: '14px',
                      }}
                    />
                  </td>
                  {displayColumns.map((column, colIndex) => {
                    const value = doc[column as keyof TableDocument];
                    return (
                      <td
                        key={column}
                        style={{
                          padding: '8px',
                          borderRight: colIndex === displayColumns.length - 1 ? 'none' : '1px solid #2D313A',
                          color: getValueColor(value),
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatValue(value)}
                      </td>
                    );
                  })}
                  <td style={{ padding: '8px' }}></td>
                </tr>
              ))}
              {/* Empty rows to fill space */}
              {documents.length < 10 && Array.from({ length: 10 - documents.length }).map((_, i) => (
                <tr key={`empty-${i}`} style={{ borderBottom: '1px solid rgba(45, 49, 58, 0.3)' }}>
                  <td style={{ padding: '16px' }} colSpan={displayColumns.length + 2}></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Bottom Toolbar */}
      <div style={{
        height: '40px',
        borderTop: '1px solid #2D313A',
        backgroundColor: '#0F1115',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        flexShrink: 0,
      }}>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#6b7280',
            fontSize: '12px',
            border: '1px solid #2D313A',
            borderRadius: '4px',
            padding: '6px 12px',
            backgroundColor: 'transparent',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.backgroundColor = '#1C1F26';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#6b7280';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <SettingsIcon size={12} />
          Schema
        </button>
      </div>
    </div>
  );
};

