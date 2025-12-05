import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import type { TableDefinition } from '../../../types';
import { useSheetSafe } from '../../../contexts/sheet-context';

export interface SchemaViewProps {
  tableName: string;
  tableSchema?: TableDefinition[string];
}

// Helper function to generate type definition from field shape
// Based on Convex's displaySchemaFromShape and the shape structure from the API
function generateTypeDef(field: any, depth = 0): string {
  if (!field.shape) {
    return 'v.any()';
  }

  const shapeAny = field.shape as any;
  
  // Get the actual shape - check if there's a nested shape structure
  let shape = field.shape;
  if (shapeAny.shape) {
    shape = shapeAny.shape;
  }

  // Get type from shape, checking multiple possible locations
  const shapeType = (shape.type?.toLowerCase() || 
                     shape.type || 
                     shapeAny.type?.toLowerCase() || 
                     shapeAny.type || 
                     'any') as string;

  // Handle union types first (before checking nested shapes)
  if (shapeType === 'union') {
    // Check if value is an array of union members (from API format)
    if (shapeAny.value && Array.isArray(shapeAny.value)) {
      const unionParts = shapeAny.value.map((item: any) => {
        if (item.type === 'literal' && item.value !== undefined) {
          const value = item.value;
          if (typeof value === 'string') {
            return `v.literal("${value}")`;
          }
          if (typeof value === 'number') {
            return `v.literal(${value})`;
          }
          if (typeof value === 'boolean') {
            return `v.literal(${value})`;
          }
        }
        // Recursively handle other union member types
        return generateTypeDef({ shape: item }, depth + 1);
      });
      
      if (unionParts.length > 0) {
        return `v.union(${unionParts.join(', ')})`;
      }
    }
    
    // Check if shapes array exists (Convex internal format)
    if (shapeAny.shapes && Array.isArray(shapeAny.shapes)) {
      const unionTypes = shapeAny.shapes
        .map((variantShape: any) => generateTypeDef({ shape: variantShape }, depth + 1))
        .filter((t: string) => t !== 'v.any()');
      
      if (unionTypes.length > 0) {
        return `v.union(${unionTypes.join(', ')})`;
      }
    }
    
    // Check if fields array exists (alternative format)
    if (shapeAny.fields && Array.isArray(shapeAny.fields)) {
      const literalValues: string[] = [];
      let hasNonLiteral = false;

      for (const unionField of shapeAny.fields) {
        const fieldShape = unionField.shape || unionField;
        if (fieldShape.type === 'literal' && fieldShape.value !== undefined) {
          const value = fieldShape.value;
          if (typeof value === 'string') {
            literalValues.push(`v.literal("${value}")`);
          } else if (typeof value === 'number') {
            literalValues.push(`v.literal(${value})`);
          } else if (typeof value === 'boolean') {
            literalValues.push(`v.literal(${value})`);
          } else {
            hasNonLiteral = true;
            break;
          }
        } else {
          hasNonLiteral = true;
          break;
        }
      }

      if (!hasNonLiteral && literalValues.length > 0) {
        return `v.union(${literalValues.join(', ')})`;
      }
    }
  }

  // Handle literal types
  if (shapeType === 'literal') {
    if (shapeAny.value !== undefined) {
      const value = shapeAny.value;
      if (typeof value === 'string') {
        return `v.literal("${value}")`;
      }
      if (typeof value === 'number') {
        return `v.literal(${value})`;
      }
      if (typeof value === 'boolean') {
        return `v.literal(${value})`;
      }
    }
  }

  // Handle id types - check multiple possible locations for tableName
  if (shapeType === 'id' || shape.tableName || shapeAny.tableName) {
    const tableName = shape.tableName || shapeAny.tableName || field.shape?.tableName;
    if (tableName) {
      return `v.id("${tableName}")`;
    }
  }

  // Handle primitive types
  if (shapeType === 'string') {
    return 'v.string()';
  }
  if (shapeType === 'number' || shapeType === 'float64') {
    return 'v.number()';
  }
  if (shapeType === 'boolean') {
    return 'v.boolean()';
  }
  if (shapeType === 'int64' || shapeType === 'bigint') {
    return 'v.int64()';
  }
  if (shapeType === 'bytes') {
    return 'v.bytes()';
  }
  if (shapeType === 'null') {
    return 'v.null()';
  }
  if (shapeType === 'any' || shapeType === 'unknown' || shapeType === 'never') {
    return 'v.any()';
  }

  // Handle object types
  if (shapeType === 'object') {
    if (shapeAny.fields && Array.isArray(shapeAny.fields)) {
      const objectFields = shapeAny.fields
        .filter((f: any) => f.fieldName !== '_id' && f.fieldName !== '_creationTime')
        .map((f: any) => {
          const fieldOptional = f.optional ? 'v.optional(' : '';
          const fieldClosingParen = f.optional ? ')' : '';
          const fieldType = generateTypeDef(f, depth + 1);
          return `    ${f.fieldName}: ${fieldOptional}${fieldType}${fieldClosingParen}`;
        })
        .join(',\n');
      
      if (objectFields) {
        return `v.object({\n${objectFields}\n  })`;
      }
      return 'v.object({})';
    }
  }

  // Handle array types
  if (shapeType === 'array') {
    if (shapeAny.shape) {
      const elementType = generateTypeDef({ shape: shapeAny.shape }, depth + 1);
      return `v.array(${elementType})`;
    }
    if (shapeAny.value) {
      const elementType = generateTypeDef({ shape: shapeAny.value }, depth + 1);
      return `v.array(${elementType})`;
    }
    return 'v.array(v.any())';
  }

  // Handle record types
  if (shapeType === 'record') {
    if (shapeAny.keyShape && shapeAny.valueShape) {
      const keyType = generateTypeDef({ shape: shapeAny.keyShape }, depth + 1);
      const valueType = generateTypeDef({ shape: shapeAny.valueShape }, depth + 1);
      return `v.record(${keyType}, ${valueType})`;
    }
  }

  return 'v.any()';
}

export const SchemaView: React.FC<SchemaViewProps> = ({ tableName, tableSchema }) => {
  const { closeSheet } = useSheetSafe();

  const schemaCode = useMemo(() => {
    if (!tableSchema) {
      return `// No schema available for table "${tableName}"`;
    }

    // Filter out system fields that are automatically added by Convex
    const systemFields = ['_id', '_creationTime'];
    const fields = (tableSchema.fields || []).filter(
      (field) => !systemFields.includes(field.fieldName)
    );
    
    let code = `import { defineSchema, defineTable } from "convex/server";\n`;
    code += `import { v } from "convex/values";\n\n`;
    code += `export default defineSchema({\n`;
    code += `  // Other tables here...\n\n`;
    code += `  ${tableName}: defineTable({\n`;

    if (fields.length === 0) {
      code += `    // No fields defined\n`;
    } else {
      fields.forEach((field) => {
        const fieldName = field.fieldName;
        const optional = field.optional ? 'v.optional(' : '';
        const closingParen = field.optional ? ')' : '';
        
        const typeDef = generateTypeDef(field);
        code += `    ${fieldName}: ${optional}${typeDef}${closingParen},\n`;
      });
    }

    code += `  })\n`;

    // Add indexes - look for fields that start with "by_" which are typically index fields
    // But note: actual indexes are defined separately, not as fields
    // For now, we'll skip adding indexes here since we don't have reliable index information
    // Indexes should be fetched separately using the indexes API

    code += `});\n`;

    return code;
  }, [tableName, tableSchema]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--color-panel-bg-secondary)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0px 12px',
          borderBottom: '1px solid var(--color-panel-border)',
          backgroundColor: 'var(--color-panel-bg-secondary)',
          height: '40px',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--color-panel-text)',
          }}
        >
          <span>Schema</span>
        </div>

        {/* Close Button */}
        {closeSheet && (
          <button
            type="button"
            onClick={closeSheet}
            style={{
              padding: '6px',
              color: 'var(--color-panel-text-secondary)',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-panel-text)';
              e.currentTarget.style.backgroundColor = 'var(--color-panel-border)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px',
        }}
      >
        <div style={{ marginBottom: '12px' }}>
          <div
            style={{
              fontSize: '13px',
              color: 'var(--color-panel-text-secondary)',
              marginBottom: '4px',
            }}
          >
            Table
          </div>
          <code
            style={{
              fontFamily: 'monospace',
              fontSize: '13px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: 'var(--color-panel-bg-tertiary)',
              border: '1px solid var(--color-panel-border)',
            }}
          >
            {tableName}
          </code>
          <p
            style={{
              margin: '8px 0 0',
              fontSize: '12px',
              color: 'var(--color-panel-text-muted)',
            }}
          >
            This is the currently enforced schema, equivalent to{' '}
            <code style={{ fontFamily: 'monospace', fontSize: '11px' }}>convex/schema.ts</code>.
          </p>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-panel-bg-tertiary)',
            borderRadius: '6px',
            padding: '12px 14px',
            fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
            fontSize: '12px',
            lineHeight: 1.6,
            color: 'var(--color-panel-text)',
            overflow: 'auto',
            whiteSpace: 'pre',
            border: '1px solid var(--color-panel-border)',
          }}
        >
          <code>{schemaCode}</code>
        </div>
      </div>
    </div>
  );
};
