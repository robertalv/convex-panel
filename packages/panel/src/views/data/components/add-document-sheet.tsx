import React, { useEffect, useState, useRef, useCallback } from 'react';
import { AddDocumentPanel } from './add-document-panel';
import { Sheet } from '../../../components/shared/sheet';
import { SchemaPanelContent } from './schema-panel-content';
import type { TableSchema, TableField } from '../../../types';

export interface AddDocumentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTable: string;
  tableSchema?: TableSchema;
  componentId?: string | null;
  adminClient?: any;
  onDocumentAdded?: () => void;
  container?: HTMLElement | null;
}

export const AddDocumentSheet: React.FC<AddDocumentSheetProps> = ({
  isOpen,
  onClose,
  selectedTable,
  tableSchema,
  componentId,
  adminClient,
  onDocumentAdded,
  container: providedContainer,
}) => {
  const [isSchemaOpen, setIsSchemaOpen] = useState(false);
  const [sheetContainer, setSheetContainer] = useState<HTMLElement | null>(null);
  const insertFieldRef = useRef<((fieldName: string) => void) | null>(null);
  const getEditorContentRef = useRef<(() => string) | null>(null);
  
  const mainContentRef = useCallback((node: HTMLDivElement | null) => {
    if (node && isOpen) {
      setSheetContainer(node);
    } else {
      setSheetContainer(null);
    }
  }, [isOpen]);
  
  const getFieldsInEditor = useCallback(() => {
    if (!getEditorContentRef.current) return new Set<string>();
    try {
      const content = getEditorContentRef.current();
      const fields = new Set<string>();
      
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
  
  const [fieldsInEditor, setFieldsInEditor] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    if (isSchemaOpen) {
      setFieldsInEditor(getFieldsInEditor());
      const interval = setInterval(() => {
        setFieldsInEditor(getFieldsInEditor());
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isSchemaOpen, getFieldsInEditor]);

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

  const handleFieldClick = useCallback((fieldName: string) => {
    if (insertFieldRef.current) {
      insertFieldRef.current(fieldName);
      setTimeout(() => {
        setFieldsInEditor(getFieldsInEditor());
      }, 100);
    }
  }, [getFieldsInEditor]);

  return (
    <>
      {/* Main Sheet - Uses Sheet component for proper container handling */}
      {/* Key ensures re-render when container changes to handle portal correctly */}
      <Sheet
        key={providedContainer ? 'with-container' : 'no-container'}
        isOpen={isOpen}
        onClose={onClose}
        width="600px"
        container={providedContainer}
      >
        <div
          ref={mainContentRef}
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: 'var(--color-panel-bg)',
            position: 'relative',
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
      </Sheet>

      {/* Schema Panel Sheet - Renders inside the main content container */}
      {isSchemaOpen && tableSchema && tableSchema.fields && tableSchema.fields.length > 0 && (
        <Sheet
          isOpen={isSchemaOpen}
          onClose={() => setIsSchemaOpen(false)}
          width="320px"
          container={sheetContainer}
        >
          <SchemaPanelContent
            tableSchema={tableSchema}
            fieldsInEditor={fieldsInEditor}
            shapeToValidatorFormat={shapeToValidatorFormat}
            onClose={() => setIsSchemaOpen(false)}
            onFieldClick={handleFieldClick}
          />
        </Sheet>
      )}
    </>
  );
};

