import React from 'react';
import { Copy } from 'lucide-react';
import { formatValue, getValueColor } from './table/data-table-utils';
import { copyToClipboard } from '../../../utils/toast';

export interface CellViewerProps {
  column: string;
  value: any;
  rowId: string;
}

export const CellViewer: React.FC<CellViewerProps> = ({
  column,
  value,
  rowId,
}) => {
  const isUnset = value === null || value === undefined;
  const formattedValue = formatValue(value);
  const valueColor = getValueColor(value);

  // Determine if the value is a JSON object/array
  const isJsonValue = typeof value === 'object' && value !== null && !(value instanceof Date);
  const jsonString = isJsonValue ? JSON.stringify(value, null, 2) : null;

  const handleCopy = () => {
    const textToCopy = isJsonValue ? jsonString : formattedValue;
    copyToClipboard(textToCopy || '');
  };

  return (
    <div
      style={{
        padding: '20px',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '13px',
              color: 'var(--color-panel-text-muted)',
              marginBottom: '4px',
            }}
          >
            Column
          </div>
          <div
            style={{
              fontSize: '14px',
              color: 'var(--color-panel-text)',
              fontFamily: 'monospace',
              fontWeight: 500,
            }}
          >
            {column}
          </div>
        </div>
        <button
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: 'var(--color-panel-accent)',
            cursor: 'pointer',
            fontSize: '12px',
            padding: '6px 12px',
            borderRadius: '6px',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Copy size={14} />
          <span>Copy</span>
        </button>
      </div>

      {/* Value Content */}
      <div
        style={{
          flex: 1,
          padding: '16px',
          backgroundColor: 'var(--color-panel-bg)',
          borderRadius: '8px',
          border: '1px solid var(--color-panel-border)',
          overflow: 'auto',
        }}
      >
        {isUnset ? (
          <div
            style={{
              color: 'var(--color-panel-text-muted)',
              fontStyle: 'italic',
              fontSize: '14px',
            }}
          >
            unset
          </div>
        ) : isJsonValue ? (
          <pre
            style={{
              margin: 0,
              padding: 0,
              color: 'var(--color-panel-text)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'monospace',
              fontSize: '13px',
              lineHeight: '1.6',
            }}
          >
            {jsonString}
          </pre>
        ) : (
          <div
            style={{
              color: valueColor,
              fontSize: '14px',
              fontFamily: typeof value === 'string' && value.length > 100 ? 'monospace' : 'inherit',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: '1.6',
            }}
          >
            {formattedValue}
          </div>
        )}
      </div>

      {/* Metadata */}
      <div
        style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid var(--color-panel-border)',
          fontSize: '12px',
          color: 'var(--color-panel-text-muted)',
        }}
      >
        <div style={{ marginBottom: '4px' }}>
          <strong>Type:</strong> {typeof value}
          {value instanceof Date && ' (Date)'}
          {isJsonValue && ' (Object/Array)'}
        </div>
        {typeof value === 'string' && (
          <div>
            <strong>Length:</strong> {value.length} characters
          </div>
        )}
        {!isUnset && (
          <div style={{ marginTop: '4px' }}>
            <strong>Document ID:</strong>{' '}
            <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{rowId}</span>
          </div>
        )}
      </div>
    </div>
  );
};

