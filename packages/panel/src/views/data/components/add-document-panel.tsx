import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Plus, AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react';
import { ObjectEditor } from '../../../components/editor';
import { insertDocuments } from '../../../utils/api/documents';
import { toast } from 'sonner';
import type { TableSchema } from '../../../types';
import type { Value } from 'convex/values';

// Helper to check if value is a plain object
function isPlainObject(value: any): value is Record<string, any> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
}

// Helper to omit properties from an object
function omitBy<T extends Record<string, any>>(
  obj: T,
  predicate: (value: any, key: string) => boolean
): Partial<T> {
  const result: Partial<T> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && !predicate(obj[key], key)) {
      result[key] = obj[key];
    }
  }
  return result;
}

export interface AddDocumentPanelProps {
  selectedTable: string;
  tableSchema?: TableSchema;
  componentId?: string | null;
  adminClient?: any;
  onClose: () => void;
  onDocumentAdded?: () => void;
  onToggleSchema?: () => void;
  isSchemaOpen?: boolean;
  onInsertField?: React.MutableRefObject<((fieldName: string) => void) | null>;
  onGetEditorContent?: React.MutableRefObject<(() => string) | null>;
}

// Helper type for generic document
type GenericDocument = Record<string, Value>;

// Helper to check if value is a document or array of documents
function isDocument(
  value: Value | undefined,
  allowMultipleDocuments: boolean,
): value is GenericDocument | GenericDocument[] {
  return (
    isPlainObject(value) ||
    (allowMultipleDocuments &&
      Array.isArray(value) &&
      value.length >= 1 &&
      value.every(isPlainObject))
  );
}

// Generate default document value from schema
const getDefaultDocument = (tableSchema?: TableSchema): GenericDocument => {
  if (tableSchema && tableSchema.fields && tableSchema.fields.length > 0) {
    const defaultDoc: GenericDocument = {};
    
    tableSchema.fields
      .filter(field => !field.fieldName.startsWith('_')) // Exclude system fields
      .forEach(field => {
        const type = field.shape.type || 'any';
        let exampleValue: Value;
        
        // Handle nested types (e.g., shape.shape.type for optional or union types)
        const actualType = field.shape.shape?.type || type;
        
        if (field.shape.tableName || actualType === 'id') {
          exampleValue = ''; // Reference field (ID)
        } else if (actualType === 'number' || actualType === 'float64') {
          exampleValue = 0;
        } else if (actualType === 'boolean') {
          exampleValue = false;
        } else if (actualType === 'array') {
          exampleValue = [];
        } else if (actualType === 'object') {
          // For nested objects, try to generate nested structure if fields are available
          if (field.shape.fields && field.shape.fields.length > 0) {
            const nestedObj: GenericDocument = {};
            field.shape.fields
              .filter(nestedField => !nestedField.fieldName.startsWith('_'))
              .forEach(nestedField => {
                const nestedType = nestedField.shape.type || 'any';
                if (nestedType === 'number' || nestedType === 'float64') {
                  nestedObj[nestedField.fieldName] = 0;
                } else if (nestedType === 'boolean') {
                  nestedObj[nestedField.fieldName] = false;
                } else if (nestedType === 'array') {
                  nestedObj[nestedField.fieldName] = [];
                } else {
                  nestedObj[nestedField.fieldName] = '';
                }
              });
            exampleValue = Object.keys(nestedObj).length > 0 ? nestedObj : {};
          } else {
            exampleValue = {};
          }
        } else if (actualType === 'bytes') {
          exampleValue = '';
        } else {
          // Default to empty string for strings and other types
          exampleValue = '';
        }
        
        defaultDoc[field.fieldName] = exampleValue;
      });
    
    if (Object.keys(defaultDoc).length > 0) {
      return defaultDoc;
    }
  }
  
  // Return empty object if no schema fields, which will be formatted as empty object template
  return {};
};

export const AddDocumentPanel: React.FC<AddDocumentPanelProps> = ({
  selectedTable,
  tableSchema,
  componentId,
  adminClient,
  onClose,
  onDocumentAdded,
  onToggleSchema,
  isSchemaOpen = false,
  onGetEditorContent,
  onInsertField,
}) => {
  const [value, setValue] = useState<Value | undefined>(undefined);
  const [documents, setDocuments] = useState<GenericDocument[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isInvalidObject, setIsInvalidObject] = useState(false);
  const [editorContent, setEditorContent] = useState<string>('');
  const randomNumberRef = useRef<number>(Math.random());

  const defaultDocument = useMemo(() => getDefaultDocument(tableSchema), [tableSchema]);

  useEffect(() => {
    if (selectedTable) {
      const defaultValue = [defaultDocument];
      setValue(defaultValue);
      setDocuments(defaultValue);
      setError(null);
      setSuccess(false);
      setIsInvalidObject(false);
    }
  }, [selectedTable, defaultDocument]);

  const onChange = useCallback(
    (newValue?: Value) => {
      setValue(newValue);
      
      const cleanValue = newValue 
        ? (Array.isArray(newValue)
            ? newValue
            : isPlainObject(newValue)
              ? omitBy(newValue as Record<string, Value>, (_v: Value, k: string) => k.startsWith('_'))
              : newValue)
        : undefined;

      if (isDocument(cleanValue, true)) {
        const docsArray = Array.isArray(cleanValue) ? cleanValue : [cleanValue];
        setDocuments(docsArray);
      } else {
        setDocuments([]);
      }
    },
    []
  );

  let validationError: string | undefined;
  if (isInvalidObject) {
    validationError = 'Please fix the errors above to continue.';
  } else if (!isDocument(value, true)) {
    validationError = 'Please enter a document or an array of documents to continue.';
  } else if (documents.length === 0) {
    validationError = 'At least one document is required.';
  }

  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | undefined>(undefined);
  const validationMessage = validationError ?? submitErrorMessage;

  useEffect(() => {
    setSubmitErrorMessage(undefined);
  }, [validationError, documents]);

  const disabled = validationError !== undefined || isSubmitting;

  const handleSubmit = useCallback(async () => {
    if (disabled || !adminClient) {
      return;
    }

    setSubmitErrorMessage(undefined);
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // Remove system fields from documents
      const cleanDocuments = documents.map(doc => {
        const { _id, _creationTime, ...rest } = doc;
        return rest;
      });

      await insertDocuments(selectedTable, cleanDocuments, adminClient, componentId || null);

      setSuccess(true);
      toast.success(`Successfully added ${cleanDocuments.length} document${cleanDocuments.length > 1 ? 's' : ''} to ${selectedTable}`);
      
      // Reset form after a short delay
      setTimeout(() => {
        const defaultValue = [defaultDocument];
        setValue(defaultValue);
        setDocuments(defaultValue);
        setSuccess(false);
        if (onDocumentAdded) {
          onDocumentAdded();
        }
      }, 1500);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to insert documents';
      setError(errorMessage);
      setSubmitErrorMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [adminClient, documents, selectedTable, componentId, disabled, defaultDocument, onDocumentAdded]);

  const getEditorContent = useCallback(() => {
    return editorContent;
  }, [editorContent]);

  useEffect(() => {
    if (onGetEditorContent) {
      onGetEditorContent.current = getEditorContent;
    }
    return () => {
      if (onGetEditorContent) {
        onGetEditorContent.current = null;
      }
    };
  }, [getEditorContent, onGetEditorContent]);


  console.log("On ", onInsertField);

  return (
    <div
      className="cp-add-document-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--color-panel-bg)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--color-panel-border)',
          backgroundColor: 'var(--color-panel-bg-secondary)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h2
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--color-panel-text)',
              margin: 0,
              lineHeight: '20px',
            }}
          >
            Add new documents to {selectedTable}
          </h2>
          <a
            href="https://docs.convex.dev/dashboard/deployments/data#creating-documents"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '12px',
              color: 'var(--color-panel-accent)',
              textDecoration: 'none',
              lineHeight: '16px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            Learn more about editing documents.
          </a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {tableSchema && tableSchema.fields && tableSchema.fields.length > 0 && onToggleSchema && (
            <button
              onClick={onToggleSchema}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-panel-border)',
                background: isSchemaOpen
                  ? 'var(--color-panel-bg-tertiary)'
                  : 'transparent',
                color: isSchemaOpen
                  ? 'var(--color-panel-text)'
                  : 'var(--color-panel-text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isSchemaOpen) {
                  e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                  e.currentTarget.style.color = 'var(--color-panel-text)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSchemaOpen) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
                }
              }}
            >
              <Info size={14} />
              <span>Schema</span>
            </button>
          )}
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
      </div>

      {/* Editor */}
      <div
        className="cp-add-document-editor"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderBottom: '1px solid var(--color-panel-border)',
        }}
      >
        <ObjectEditor
          key={`${selectedTable}-${randomNumberRef.current}`}
          defaultValue={value}
          onChange={onChange}
          onChangeInnerText={(text) => setEditorContent(text)}
          onError={(errors) => setIsInvalidObject(errors.length > 0)}
          path={`document/${selectedTable}/${randomNumberRef.current}`}
          fullHeight
          autoFocus
          saveAction={handleSubmit}
          showLineNumbers
          language="json"
          indentTopLevel={true}
          className=""
          editorClassname=""
        />
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid var(--color-panel-border)',
          backgroundColor: 'var(--color-panel-bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Error/Success Messages */}
        {error && (
          <div
            style={{
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: 'color-mix(in srgb, var(--color-panel-error) 10%, transparent)',
              border: '1px solid var(--color-panel-error)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--color-panel-error)',
              fontSize: '12px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            style={{
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: 'color-mix(in srgb, var(--color-panel-success) 10%, transparent)',
              border: '1px solid var(--color-panel-success)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--color-panel-success)',
              fontSize: '12px',
            }}
          >
            <CheckCircle2 size={16} />
            <span>Documents added successfully!</span>
          </div>
        )}

        {validationMessage && !error && !success && (
          <div
            style={{
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: 'color-mix(in srgb, var(--color-panel-warning) 10%, transparent)',
              border: '1px solid var(--color-panel-warning)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--color-panel-warning)',
              fontSize: '12px',
            }}
          >
            <AlertCircle size={16} />
            <span>{validationMessage}</span>
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid var(--color-panel-border)',
              background: 'var(--color-panel-bg-tertiary)',
              color: 'var(--color-panel-text)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
            }}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={disabled}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: disabled
                ? 'var(--color-panel-bg-tertiary)'
                : 'var(--color-panel-accent)',
              color: disabled
                ? 'var(--color-panel-text-muted)'
                : 'var(--color-panel-bg)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: disabled
                ? 'none'
                : '0 2px 8px color-mix(in srgb, var(--color-panel-accent) 20%, transparent)',
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.background = 'var(--color-panel-accent-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled) {
                e.currentTarget.style.background = 'var(--color-panel-accent)';
              }
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <Plus size={14} />
                <span>Add Documents</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Spinner animation and Monaco editor styles */}
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .cp-add-document-editor .monaco-editor textarea.ime-text-area {
          position: absolute !important;
          width: 0 !important;
          height: 0 !important;
          opacity: 0 !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          background: transparent !important;
          color: transparent !important;
          resize: none !important;
          pointer-events: none !important;
        }

        .cp-add-document-editor .monaco-editor .native-edit-context {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 0 !important;
          height: 0 !important;
          opacity: 0 !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          background: transparent !important;
          color: transparent !important;
          overflow: hidden !important;
          pointer-events: none !important;
        }

        .cp-add-document-editor .monaco-editor .margin {
          display: none !important;
        }

        .cp-add-document-editor .monaco-editor .monaco-scrollable-element {
          left: 0 !important;
        }

        .cp-add-document-editor .monaco-editor .native-edit-context {
          left: 0 !important;
        }
      `}</style>
    </div>
  );
};
