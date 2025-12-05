import React, { useEffect, useState, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { AddDocumentPanel } from './add-document-panel';
import type { TableSchema, TableField } from '../../../types';

export interface AddDocumentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTable: string;
  tableSchema?: TableSchema;
  componentId?: string | null;
  adminClient?: any;
  onDocumentAdded?: () => void;
}

export const AddDocumentSheet: React.FC<AddDocumentSheetProps> = ({
  isOpen,
  onClose,
  selectedTable,
  tableSchema,
  componentId,
  adminClient,
  onDocumentAdded,
}) => {
  const [isSchemaOpen, setIsSchemaOpen] = useState(false);
  const insertFieldRef = useRef<((fieldName: string) => void) | null>(null);
  const getEditorContentRef = useRef<(() => string) | null>(null);
  
  // Get fields already in the editor
  const getFieldsInEditor = useCallback(() => {
    if (!getEditorContentRef.current) return new Set<string>();
    try {
      const content = getEditorContentRef.current();
      const fields = new Set<string>();
      
      // Extract field names from JSON content
      // Match patterns like "fieldName": or "fieldName":
      const fieldPattern = /"([^"]+)":/g;
      let match;
      while ((match = fieldPattern.exec(content)) !== null) {
        fields.add(match[1]);
      }
      
      return fields;
    } catch {
      return new Set<string>();
    }
  }, []);
  
  // State to track fields in editor
  const [fieldsInEditor, setFieldsInEditor] = useState<Set<string>>(new Set());
  
  // Update fields in editor when schema panel is open
  useEffect(() => {
    if (isSchemaOpen) {
      setFieldsInEditor(getFieldsInEditor());
      // Update periodically while panel is open
      const interval = setInterval(() => {
        setFieldsInEditor(getFieldsInEditor());
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isSchemaOpen, getFieldsInEditor]);
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

  const shapeToValidatorFormat = useCallback((field: TableField, depth: number = 0): string => {
    const shape = field.shape;
    if (!shape) return 'v.any()';

    const shapeAny = shape as any;
    let isOptional = field.optional;
    let currentShape: any = shape;

    if (shape.type === 'optional' && shapeAny.shape) {
      isOptional = true;
      currentShape = shapeAny.shape;
    } else if (shapeAny.shape) {
      currentShape = shapeAny.shape;
      if (currentShape.type === 'optional' && (currentShape as any).shape) {
        isOptional = true;
        currentShape = (currentShape as any).shape;
      }
    }

    const currentShapeAny = currentShape as any;

    if (currentShape.type === 'union' && currentShapeAny.value && Array.isArray(currentShapeAny.value)) {
      const unionParts = currentShapeAny.value.map((item: any) => {
        if (item.type === 'literal') {
          return `v.literal("${item.value}")`;
        }
        if (item.type === 'optional' && item.shape) {
          const inner = shapeToValidatorFormat({ fieldName: '', optional: true, shape: item } as TableField, depth + 1);
          return inner.startsWith('v.optional(') ? inner : `v.optional(${inner})`;
        }
        return shapeToValidatorFormat({ fieldName: '', optional: false, shape: item } as TableField, depth + 1);
      });
      const unionStr = `v.union(\n      ${unionParts.join(',\n      ')}\n    )`;
      return isOptional ? `v.optional(${unionStr})` : unionStr;
    }

    if (currentShape.type === 'literal') {
      const literalValue = currentShapeAny.value;
      const literalStr = `v.literal("${literalValue}")`;
      return isOptional ? `v.optional(${literalStr})` : literalStr;
    }

    if (currentShape.type === 'id' || currentShape.tableName || shape.tableName) {
      const tableName = currentShape.tableName || shape.tableName || '';
      const idStr = `v.id("${tableName}")`;
      return isOptional ? `v.optional(${idStr})` : idStr;
    }

    if (currentShape.type === 'object' && currentShapeAny.fields) {
      const fieldParts = currentShapeAny.fields.map((f: TableField) => {
        const fieldValidator = shapeToValidatorFormat(f, depth + 1);
        return `    ${f.fieldName}: ${fieldValidator}`;
      });
      const objectStr = `v.object({\n${fieldParts.join(',\n')}\n  })`;
      return isOptional ? `v.optional(${objectStr})` : objectStr;
    }

    if (currentShape.type === 'array' && currentShapeAny.value) {
      const elementValidator = shapeToValidatorFormat({ fieldName: '', optional: false, shape: currentShapeAny.value } as TableField, depth + 1);
      const arrayStr = `v.array(${elementValidator})`;
      return isOptional ? `v.optional(${arrayStr})` : arrayStr;
    }

    let typeStr = '';
    const normalizedType = currentShape.type?.toLowerCase() || 'any';
    switch (normalizedType) {
      case 'string':
        typeStr = 'v.string()';
        break;
      case 'number':
      case 'float64':
        typeStr = 'v.number()';
        break;
      case 'boolean':
        typeStr = 'v.boolean()';
        break;
      case 'int64':
        typeStr = 'v.int64()';
        break;
      case 'null':
        typeStr = 'v.null()';
        break;
      case 'any':
        typeStr = 'v.any()';
        break;
      case 'bytes':
        typeStr = 'v.bytes()';
        break;
      default:
        typeStr = 'v.any()';
    }

    return isOptional ? `v.optional(${typeStr})` : typeStr;
  }, []);

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

      {/* Schema Panel */}
      {isSchemaOpen && tableSchema && tableSchema.fields && tableSchema.fields.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: '600px',
            bottom: 0,
            width: '320px',
            maxWidth: 'calc(100vw - 600px - 20px)',
            backgroundColor: 'var(--color-panel-bg)',
            borderRight: '1px solid var(--color-panel-border)',
            borderLeft: '1px solid var(--color-panel-border)',
            zIndex: 1001,
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideInFromRight 0.3s ease-out',
          }}
          onClick={(e) => e.stopPropagation()}
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
              onClick={() => setIsSchemaOpen(false)}
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
                        if (!isDisabled && insertFieldRef.current) {
                          insertFieldRef.current(field.fieldName);
                          // Update fields in editor after insertion
                          setTimeout(() => {
                            setFieldsInEditor(getFieldsInEditor());
                          }, 100);
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
      )}

      {/* Sheet */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '600px',
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
        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            backgroundColor: 'var(--color-panel-bg)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <AddDocumentPanel
            selectedTable={selectedTable}
            tableSchema={tableSchema}
            componentId={componentId}
            adminClient={adminClient}
            onClose={onClose}
            onDocumentAdded={onDocumentAdded}
            onToggleSchema={() => setIsSchemaOpen(!isSchemaOpen)}
            isSchemaOpen={isSchemaOpen}
            onGetEditorContent={getEditorContentRef}
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

        @keyframes slideInFromRight {
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

