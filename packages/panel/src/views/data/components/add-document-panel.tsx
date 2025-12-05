import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Plus, AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react';
import { ObjectEditor } from '../../../components/editor';
import { insertDocuments } from '../../../utils/api/documents';
import { toast } from 'sonner';
import type { TableSchema, TableField } from '../../../types';
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

// Helper to extract the actual type from a field shape
const getFieldType = (field: { shape: any }): string => {
  // Normalize type to lowercase (API returns capitalized types like 'String', 'Boolean')
  const normalizeType = (type: string | undefined): string => {
    if (!type) return 'any';
    const lower = type.toLowerCase();
    // Map common capitalized types
    if (lower === 'string' || lower === 'boolean' || lower === 'number' || 
        lower === 'array' || lower === 'object' || lower === 'float64' || 
        lower === 'int64' || lower === 'bytes' || lower === 'id' || lower === 'any') {
      return lower;
    }
    return lower;
  };
  
  // If the type is 'optional', we need to look at the nested shape
  if (field.shape?.type === 'optional' && field.shape?.shape?.type) {
    return normalizeType(field.shape.shape.type);
  }
  // Check direct type first (handle both 'Boolean' and 'boolean')
  if (field.shape?.type) {
    const directType = normalizeType(field.shape.type);
    if (directType !== 'optional') {
      return directType;
    }
  }
  // Check nested shape type (for wrapped types)
  if (field.shape?.shape?.type) {
    return normalizeType(field.shape.shape.type);
  }
  return 'any';
};

// Generate default document value from schema
// Note: Since the schema API doesn't correctly identify optional fields,
// we include all non-system fields. Users can remove optional fields manually.
const getDefaultDocument = (tableSchema?: TableSchema): GenericDocument => {
  if (tableSchema && tableSchema.fields && tableSchema.fields.length > 0) {
    const defaultDoc: GenericDocument = {};
    
    // Include all non-system fields
    // TODO: Once schema API correctly identifies optional fields, filter them out
    const fieldsToInclude = tableSchema.fields.filter(field => {
      // Exclude system fields
      return !field.fieldName.startsWith('_');
    });
    
    fieldsToInclude.forEach(field => {
        let exampleValue: Value;
        
        // Get the actual type using helper function
        const fieldType = getFieldType(field);
        
        // Check for ID/reference fields first (by tableName property)
        if (field.shape.tableName || field.shape.shape?.tableName) {
          exampleValue = ''; // Reference field (ID)
        } 
        // Check for boolean type - check all possible locations
        else if (fieldType === 'boolean' || 
                 field.shape?.type === 'Boolean' ||
                 field.shape?.type === 'boolean' || 
                 field.shape?.shape?.type === 'boolean' ||
                 field.shape?.shape?.type === 'Boolean') {
          exampleValue = false;
        } 
        // Check for number types
        else if (fieldType === 'number' || fieldType === 'float64') {
          exampleValue = 0;
        } 
        // Check for array type
        else if (fieldType === 'array') {
          exampleValue = [];
        } 
        // Check for object type
        else if (fieldType === 'object') {
          // For nested objects, try to generate nested structure if fields are available
          if (field.shape.fields && field.shape.fields.length > 0) {
            const nestedObj: GenericDocument = {};
            field.shape.fields
              .filter(nestedField => 
                !nestedField.fieldName.startsWith('_') &&
                nestedField.optional !== true // Only include required nested fields
              )
              .forEach(nestedField => {
                const nestedFieldType = getFieldType(nestedField);
                
                if (nestedFieldType === 'boolean') {
                  nestedObj[nestedField.fieldName] = false;
                } else if (nestedFieldType === 'number' || nestedFieldType === 'float64') {
                  nestedObj[nestedField.fieldName] = 0;
                } else if (nestedFieldType === 'array') {
                  nestedObj[nestedField.fieldName] = [];
                } else {
                  nestedObj[nestedField.fieldName] = '';
                }
              });
            exampleValue = Object.keys(nestedObj).length > 0 ? nestedObj : {};
          } else {
            exampleValue = {};
          }
        } 
        // Check for bytes type
        else if (fieldType === 'bytes') {
          exampleValue = '';
        } 
        // Default to empty string for strings and other types
        else {
          exampleValue = '';
        }
        
        defaultDoc[field.fieldName] = exampleValue;
      });
    
    if (Object.keys(defaultDoc).length > 0) {
      return defaultDoc;
    }
  }
  
  // Return empty object if no required fields, which will be formatted as empty object template
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
}) => {
  const defaultDocument = useMemo(() => getDefaultDocument(tableSchema), [tableSchema]);
  
  // Initialize value with default document immediately
  const initialValue = useMemo(() => {
    if (selectedTable && defaultDocument) {
      return [defaultDocument];
    }
    return undefined;
  }, [selectedTable, defaultDocument]);

  const [value, setValue] = useState<Value | undefined>(initialValue);
  const [documents, setDocuments] = useState<GenericDocument[]>(() => {
    if (!initialValue) return [];
    if (Array.isArray(initialValue)) {
      return initialValue.filter((item): item is GenericDocument => isPlainObject(item));
    }
    return isPlainObject(initialValue) ? [initialValue] : [];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isInvalidObject, setIsInvalidObject] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [syntaxErrors, setSyntaxErrors] = useState<string[]>([]);
  const [showProblems, setShowProblems] = useState(false);
  const [editorContent, setEditorContent] = useState<string>('');
  const randomNumberRef = useRef<number>(Math.random());

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

  // Validate a value against a field schema
  const validateFieldValue = useCallback((value: any, field: TableField, fieldPath: string = ''): string[] => {
    const errors: string[] = [];
    const shape = field.shape;
    if (!shape) return errors;

    // Check if shape itself is optional (shape.type === 'optional')
    const shapeAny = shape as any;
    let isOptional = field.optional;
    let currentShape: any = shape;

    // Check if shape itself is optional
    if (shape.type === 'optional' && shapeAny.shape) {
      isOptional = true;
      currentShape = shapeAny.shape;
    } else if (shapeAny.shape) {
      // Check nested shape
      currentShape = shapeAny.shape;
      if (currentShape.type === 'optional' && (currentShape as any).shape) {
        isOptional = true;
        currentShape = (currentShape as any).shape;
      }
    }

    // If value is undefined/null and field is optional, it's valid
    if ((value === undefined || value === null) && isOptional) {
      return errors;
    }

    // If value is undefined/null and field is required, it's invalid
    if ((value === undefined || value === null) && !isOptional) {
      errors.push(`Type '${value === null ? 'null' : 'undefined'}' is not assignable to required field '${fieldPath || field.fieldName}'`);
      return errors;
    }

    // Handle union types - check both shape and currentShape
    let unionValue: any[] | null = null;
    
    // Check if shape itself is union
    if (shape.type === 'union' && shapeAny.value && Array.isArray(shapeAny.value)) {
      unionValue = shapeAny.value;
    }
    // Check if currentShape is union
    else if (currentShape.type === 'union') {
      const currentShapeAny = currentShape as any;
      if (currentShapeAny.value && Array.isArray(currentShapeAny.value)) {
        unionValue = currentShapeAny.value;
      }
    }
    
    if (unionValue) {
      const isValid = unionValue.some((item: any) => {
        if (item.type === 'literal') {
          return value === item.value;
        }
        // For other union types, we'd need to validate recursively
        return true; // Simplified for now
      });
      
      if (!isValid) {
        const literalValues = unionValue
          .filter((item: any) => item.type === 'literal')
          .map((item: any) => `"${item.value}"`)
          .join(', ');
        
        if (literalValues) {
          const unionParts = unionValue
            .filter((item: any) => item.type === 'literal')
            .map((item: any) => `v.literal("${item.value}")`)
            .join(',\n      ');
          errors.push(`Type '${typeof value === 'string' ? `"${value}"` : typeof value}' is not assignable to:\nv.union(\n      ${unionParts}\n    )`);
        } else {
          errors.push(`Type '${typeof value}' is not assignable to union type`);
        }
      }
    }
    // Handle literal types
    else if (currentShape.type === 'literal') {
      const currentShapeAny = currentShape as any;
      if (value !== currentShapeAny.value) {
        errors.push(`Type '${typeof value === 'string' ? `"${value}"` : typeof value}' is not assignable to: v.literal("${currentShapeAny.value}")`);
      }
    }
    // Handle ID types
    else if (currentShape.type === 'id' || currentShape.tableName || shape.tableName) {
      if (typeof value !== 'string' || !value.match(/^[a-zA-Z0-9_-]+$/)) {
        const tableName = currentShape.tableName || shape.tableName || '';
        errors.push(`Type '${typeof value}' is not assignable to: v.id("${tableName}")`);
      }
    }
    // Handle boolean types - normalize capitalized types
    else if (currentShape.type === 'boolean' || currentShape.type === 'Boolean') {
      if (typeof value !== 'boolean') {
        errors.push(`Type '${typeof value}' is not assignable to: v.boolean()`);
      }
    }
    // Handle number types
    else if (currentShape.type === 'number' || currentShape.type === 'float64' || currentShape.type === 'Number') {
      if (typeof value !== 'number' || isNaN(value)) {
        errors.push(`Type '${typeof value}' is not assignable to: v.number()`);
      }
    }
    // Handle string types - normalize capitalized types
    else if (currentShape.type === 'string' || currentShape.type === 'String') {
      if (typeof value !== 'string') {
        errors.push(`Type '${typeof value}' is not assignable to: v.string()`);
      }
    }
    // Handle array types
    else if (currentShape.type === 'array') {
      const currentShapeAny = currentShape as any;
      if (!Array.isArray(value)) {
        errors.push(`Type '${typeof value}' is not assignable to: v.array(...)`);
      } else if (currentShapeAny.value) {
        // Validate array elements
        value.forEach((item, index) => {
          const elementErrors = validateFieldValue(item, { fieldName: `${fieldPath}[${index}]`, optional: false, shape: currentShapeAny.value } as TableField, `${fieldPath}[${index}]`);
          errors.push(...elementErrors);
        });
      }
    }
    // Handle object types
    else if (currentShape.type === 'object') {
      const currentShapeAny = currentShape as any;
      if (!isPlainObject(value)) {
        errors.push(`Type '${typeof value}' is not assignable to: v.object({...})`);
      } else if (currentShapeAny.fields) {
        // Validate object fields
        currentShapeAny.fields.forEach((f: TableField) => {
          const fieldValue = (value as Record<string, any>)[f.fieldName];
          const fieldErrors = validateFieldValue(fieldValue, f, fieldPath ? `${fieldPath}.${f.fieldName}` : f.fieldName);
          errors.push(...fieldErrors);
        });
      }
    }

    return errors;
  }, []);

  // Validate documents against schema
  const validateDocuments = useCallback((docs: GenericDocument[]): string[] => {
    if (!tableSchema || !tableSchema.fields) return [];
    
    const errors: string[] = [];
    
    docs.forEach((doc, docIndex) => {
      const docPrefix = docs.length > 1 ? `[${docIndex}]` : '';
      
      tableSchema.fields.forEach((field) => {
        // Skip system fields
        if (field.fieldName.startsWith('_')) return;
        
        const value = doc[field.fieldName];
        const fieldErrors = validateFieldValue(value, field, `${docPrefix}.${field.fieldName}`);
        errors.push(...fieldErrors);
      });
    });
    
    return errors;
  }, [tableSchema, validateFieldValue]);

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
        
        // Validate against schema
        const validationErrors = validateDocuments(docsArray);
        if (validationErrors.length > 0) {
          setIsInvalidObject(true);
          // Store validation errors for display
          setValidationErrors(validationErrors);
        } else {
          setIsInvalidObject(false);
          setValidationErrors([]);
        }
      } else {
        setDocuments([]);
        setIsInvalidObject(false);
        setValidationErrors([]);
      }
    },
    [validateDocuments]
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

      // Ensure we're using the correct table reference
      if (!selectedTable) {
        throw new Error('No table selected');
      }

      // The backend mutation (_system/frontend/addDocument) will validate documents
      // against the schema for the specified table and componentId.
      // If validation fails, it will throw a ConvexError with the validation message in error.data
      await insertDocuments(selectedTable, cleanDocuments, adminClient, componentId || null);

      setSuccess(true);
      toast.success(`Successfully added ${cleanDocuments.length} document${cleanDocuments.length > 1 ? 's' : ''} to ${selectedTable}`);
      
      // Call onDocumentAdded callback and close the sheet
      if (onDocumentAdded) {
        onDocumentAdded();
      }
      
      // Close the sheet after a short delay to show success message
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      // Extract detailed error message
      let errorMessage = 'Failed to insert documents';
      
      if (err?.data) {
        // ConvexError with data field (schema validation errors)
        errorMessage = err.data;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
      setSubmitErrorMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [adminClient, documents, selectedTable, componentId, disabled, defaultDocument, onDocumentAdded, onClose]);

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
          onError={(errors) => {
            // Syntax errors from the editor
            setIsInvalidObject(errors.length > 0);
            // Store syntax errors separately - validation errors are handled in onChange
            setSyntaxErrors(errors);
          }}
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
              padding: '12px 16px',
              borderRadius: '6px',
              backgroundColor: 'color-mix(in srgb, var(--color-panel-error) 10%, transparent)',
              border: '1px solid var(--color-panel-error)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              color: 'var(--color-panel-error)',
              fontSize: '13px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <AlertCircle size={16} />
              <span>{validationMessage}</span>
              {(validationErrors.length > 0 || syntaxErrors.length > 0) && (
                <span style={{ fontSize: '11px', opacity: 0.8 }}>
                  ({validationErrors.length + syntaxErrors.length} {(validationErrors.length + syntaxErrors.length) === 1 ? 'problem' : 'problems'})
                </span>
              )}
            </div>
            {(validationErrors.length > 0 || syntaxErrors.length > 0) && (
              <button
                onClick={() => setShowProblems(!showProblems)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--color-panel-error)',
                  background: 'transparent',
                  color: 'var(--color-panel-error)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-panel-error) 20%, transparent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {showProblems ? 'Hide Problems' : 'View Problems'}
              </button>
            )}
          </div>
        )}
        {showProblems && (validationErrors.length > 0 || syntaxErrors.length > 0) && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--color-panel-bg-secondary)',
              border: '1px solid var(--color-panel-border)',
              borderRadius: '6px',
              maxHeight: '200px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {syntaxErrors.map((errorMsg, index) => (
              <div
                key={`syntax-${index}`}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'var(--color-panel-bg-tertiary)',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: 'var(--color-panel-text)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {errorMsg}
              </div>
            ))}
            {validationErrors.map((errorMsg, index) => (
              <div
                key={`validation-${index}`}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'var(--color-panel-bg-tertiary)',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: 'var(--color-panel-text)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {errorMsg}
              </div>
            ))}
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
