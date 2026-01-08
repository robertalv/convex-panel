import React from 'react';
import { formatValue, formatTimestamp, getValueColor } from './table/data-table-utils';
import { Tooltip } from '../../../components/shared/tooltip';

export interface CellViewerProps {
  column: string;
  value: any;
  rowId: string;
}

export const CellViewer: React.FC<CellViewerProps> = ({
  column,
  value,
}) => {
  const isUnset = value === null || value === undefined;
  const isCreationTime = column === '_creationTime' && typeof value === 'number';
  const formattedValue = isCreationTime ? formatTimestamp(value) : formatValue(value);
  const valueColor = getValueColor(value);

  const isJsonValue = typeof value === 'object' && value !== null && !(value instanceof Date);
  const jsonString = isJsonValue ? JSON.stringify(value, null, 2) : null;

  return (
    <div
      style={{
        padding: '8px',
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
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
          isCreationTime ? (
            <Tooltip
              content={value.toString()}
              position="top"
              maxWidth={300}
            >
              <div
                style={{
                  color: valueColor,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  lineHeight: '1.6',
                  cursor: 'help',
                }}
              >
                {formattedValue}
              </div>
            </Tooltip>
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
          )
        )}
      </div>

      {/* Metadata */}
      {/* <div
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
      </div> */}
    </div>
  );
};

