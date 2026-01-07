import React from 'react';
import { X } from 'lucide-react';
import type { TableSchema, TableField } from '../../../types';

interface SchemaPanelContentProps {
  tableSchema: TableSchema;
  fieldsInEditor: Set<string>;
  shapeToValidatorFormat: (field: TableField) => string;
  onClose: () => void;
  onFieldClick: (fieldName: string) => void;
}

export const SchemaPanelContent: React.FC<SchemaPanelContentProps> = ({
  tableSchema,
  fieldsInEditor,
  shapeToValidatorFormat,
  onClose,
  onFieldClick,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--color-panel-bg)',
      }}
    >
      {/* Schema Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-panel-border)',
          backgroundColor: 'var(--color-panel-bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div>
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--color-panel-text)',
              margin: 0,
              marginBottom: '4px',
            }}
          >
            Table Schema
          </h3>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--color-panel-text-secondary)',
            }}
          >
            {tableSchema.fields.length} {tableSchema.fields.length === 1 ? 'field' : 'fields'}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            padding: '6px',
            borderRadius: '6px',
            border: 'none',
            background: 'transparent',
            color: 'var(--color-panel-text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-panel-text)';
            e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Schema Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {tableSchema.fields
            .filter(field => {
              // Filter out system fields
              return !field.fieldName.startsWith('_');
            })
            .map((field) => {
              const typeLabel = field.shape.tableName 
                ? `reference(${field.shape.tableName})`
                : field.shape.type || 'any';
              const linkTable = field.shape.tableName 
                || field.shape.shape?.tableName
                || field.shape.fields?.find((f) => f.shape.tableName)?.shape.tableName;
              
              // Check if field is already in editor
              const isAlreadyInEditor = fieldsInEditor.has(field.fieldName);
              const isDisabled = isAlreadyInEditor;
              
              return (
                <div
                  key={field.fieldName}
                  onClick={() => {
                    if (!isDisabled) {
                      onFieldClick(field.fieldName);
                    }
                  }}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: isDisabled 
                      ? 'var(--color-panel-bg-secondary)' 
                      : 'var(--color-panel-bg-tertiary)',
                    border: `1px solid ${isDisabled ? 'var(--color-panel-border)' : 'var(--color-panel-border)'}`,
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: isDisabled ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isDisabled) {
                      e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                      e.currentTarget.style.borderColor = 'var(--color-panel-accent)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDisabled) {
                      e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
                      e.currentTarget.style.borderColor = 'var(--color-panel-border)';
                    }
                  }}
                >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--color-panel-text)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {field.fieldName}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: field.optional
                        ? 'color-mix(in srgb, var(--color-panel-warning) 15%, transparent)'
                        : 'color-mix(in srgb, var(--color-panel-success) 15%, transparent)',
                      color: field.optional
                        ? 'var(--color-panel-warning)'
                        : 'var(--color-panel-success)',
                      border: `1px solid ${field.optional ? 'var(--color-panel-warning)' : 'var(--color-panel-success)'}`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {field.optional ? 'Optional' : 'Required'}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-panel-text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>
                    Type:{' '}
                    <span
                      style={{
                        color: linkTable ? 'var(--color-panel-accent)' : 'var(--color-panel-text)',
                        fontFamily: 'monospace',
                      }}
                    >
                      {typeLabel}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: 'var(--color-panel-text-secondary)',
                      fontFamily: 'monospace',
                      backgroundColor: 'var(--color-panel-bg-secondary)',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--color-panel-border)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      maxHeight: '120px',
                      overflowY: 'auto',
                    }}
                  >
                    {shapeToValidatorFormat(field)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};









