import React, { useEffect, useState, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { AddDocumentPanel } from './add-document-panel';
import type { TableSchema } from '../../../types';

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
                    <div style={{ fontSize: '11px', color: 'var(--color-panel-text-secondary)' }}>
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
            onInsertField={insertFieldRef}
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

