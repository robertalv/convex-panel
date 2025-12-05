import React, { useMemo, useState } from 'react';
import { X, Copy, Check, ExternalLink } from 'lucide-react';
import type { TableDefinition } from '../../../types';
import { useSheetSafe } from '../../../contexts/sheet-context';
import { copyToClipboard } from '../../../utils/toast';

export interface SchemaSheetProps {
  tableName: string;
  tableSchema?: TableDefinition[string];
  documents?: any[];
}

// Helper function to generate type definition from field shape (from schema-view.tsx)
function generateTypeDef(field: any, depth = 0): string {
  if (!field.shape) {
    return 'v.any()';
  }

  const shapeAny = field.shape as any;
  
  let shape = field.shape;
  if (shapeAny.shape) {
    shape = shapeAny.shape;
  }

  const shapeType = (shape.type?.toLowerCase() || 
                     shape.type || 
                     shapeAny.type?.toLowerCase() || 
                     shapeAny.type || 
                     'any') as string;

  // Handle union types
  if (shapeType === 'union') {
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
        return generateTypeDef({ shape: item }, depth + 1);
      });
      
      if (unionParts.length > 0) {
        return `v.union(${unionParts.join(', ')})`;
      }
    }
    
    if (shapeAny.shapes && Array.isArray(shapeAny.shapes)) {
      const unionTypes = shapeAny.shapes
        .map((variantShape: any) => generateTypeDef({ shape: variantShape }, depth + 1))
        .filter((t: string) => t !== 'v.any()');
      
      if (unionTypes.length > 0) {
        return `v.union(${unionTypes.join(', ')})`;
      }
    }
    
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

  // Handle id types
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

// Generate schema from actual documents (simpler, without optional/union details)
function generateSchemaFromDocuments(tableName: string, documents: any[]): string {
  if (!documents || documents.length === 0) {
    return `import { defineSchema, defineTable } from "convex/server";\nimport { v } from "convex/values";\n\nexport default defineSchema({\n  ${tableName}: defineTable({\n    // No fields found in documents\n  }),\n});`;
  }

  const fieldMap = new Map<string, { type: string; hasValue: boolean }>();
  
  documents.forEach(doc => {
    Object.keys(doc).forEach(key => {
      if (key === '_id' || key === '_creationTime') return;
      
      const value = doc[key];
      let type = 'any';
      
      if (value === null || value === undefined) {
        if (!fieldMap.has(key)) {
          fieldMap.set(key, { type: 'any', hasValue: false });
        }
        return;
      }
      
      if (typeof value === 'string') {
        type = 'string';
      } else if (typeof value === 'number') {
        type = 'number';
      } else if (typeof value === 'boolean') {
        type = 'boolean';
      } else if (Array.isArray(value)) {
        type = 'array';
      } else if (typeof value === 'object') {
        type = 'object';
      }
      
      const existing = fieldMap.get(key);
      if (!existing || !existing.hasValue) {
        fieldMap.set(key, { type, hasValue: true });
      }
    });
  });

  const fields = Array.from(fieldMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fieldName, { type }]) => {
      return `    ${fieldName}: v.${type}(),`;
    });

  let code = `import { defineSchema, defineTable } from "convex/server";\n`;
  code += `import { v } from "convex/values";\n\n`;
  code += `export default defineSchema({\n`;
  code += `  ${tableName}: defineTable({\n`;
  
  if (fields.length === 0) {
    code += `    // No fields found in documents\n`;
  } else {
    code += fields.join('\n') + '\n';
  }
  
  code += `  }),\n`;
  code += `});\n`;

  return code;
}

export const SchemaSheet: React.FC<SchemaSheetProps> = ({ tableName, tableSchema, documents = [] }) => {
  const { closeSheet } = useSheetSafe();
  const [activeTab, setActiveTab] = useState<'saved' | 'generated'>('saved');
  const [copied, setCopied] = useState(false);

  // Generate saved schema (from tableSchema)
  const savedSchemaCode = useMemo(() => {
    if (!tableSchema) {
      return `// No schema available for table "${tableName}"`;
    }

    const systemFields = ['_id', '_creationTime'];
    const fields = (tableSchema.fields || []).filter(
      (field) => !systemFields.includes(field.fieldName)
    );
    
    let code = `import { defineSchema, defineTable } from "convex/server";\n`;
    code += `import { v } from "convex/values";\n\n`;
    code += `export default defineSchema({\n`;
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

    code += `  }),\n`;
    code += `});\n`;

    return code;
  }, [tableName, tableSchema]);

  // Generate schema from documents
  const generatedSchemaCode = useMemo(() => {
    return generateSchemaFromDocuments(tableName, documents);
  }, [tableName, documents]);

  const currentSchemaCode = activeTab === 'saved' ? savedSchemaCode : generatedSchemaCode;

  const handleCopy = async () => {
    const success = await copyToClipboard(currentSchemaCode);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-panel-border)',
          backgroundColor: 'var(--color-panel-bg-secondary)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--color-panel-text)',
          }}
        >
          Schema
        </div>

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
            <X size={20} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0',
          borderBottom: '1px solid var(--color-panel-border)',
          padding: '0 20px',
          backgroundColor: 'var(--color-panel-bg-secondary)',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('saved')}
          style={{
            padding: '12px 0',
            marginRight: '24px',
            fontSize: '14px',
            fontWeight: 500,
            color: activeTab === 'saved' 
              ? 'var(--color-panel-text)' 
              : 'var(--color-panel-text-muted)',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'saved' 
              ? '2px solid var(--color-panel-text)' 
              : '2px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Saved
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('generated')}
          style={{
            padding: '12px 0',
            fontSize: '14px',
            fontWeight: 500,
            color: activeTab === 'generated' 
              ? 'var(--color-panel-text)' 
              : 'var(--color-panel-text-muted)',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'generated' 
              ? '2px solid var(--color-panel-text)' 
              : '2px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Generated
        </button>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Description */}
        <div style={{ marginBottom: '16px' }}>
          {activeTab === 'saved' ? (
            <p
              style={{
                fontSize: '13px',
                color: 'var(--color-panel-text-muted)',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              This is a representation of the schema that is currently being enforced. It is equivalent to your{' '}
              <code
                style={{
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--color-panel-bg-tertiary)',
                  border: '1px solid var(--color-panel-border)',
                }}
              >
                convex/schema.ts
              </code>
              .
            </p>
          ) : (
            <div>
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--color-panel-text-muted)',
                  margin: '0 0 8px 0',
                  lineHeight: 1.5,
                }}
              >
                We've generated a schema based on the data available in your tables.
              </p>
              <a
                href="https://docs.convex.dev/database/schemas"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '13px',
                  color: 'var(--color-panel-text)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                Schema docs
                <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>

        {/* Code Block */}
        <div
          style={{
            position: 'relative',
            backgroundColor: 'var(--color-panel-bg-tertiary)',
            borderRadius: '6px',
            border: '1px solid var(--color-panel-border)',
            overflow: 'hidden',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Copy Button */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 10,
            }}
          >
            <button
              type="button"
              onClick={handleCopy}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                color: 'var(--color-panel-text)',
                backgroundColor: 'var(--color-panel-bg)',
                border: '1px solid var(--color-panel-border)',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-panel-bg)';
              }}
            >
              {copied ? (
                <>
                  <Check size={14} />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Code Content */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '16px',
              fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
              fontSize: '13px',
              lineHeight: 1.6,
              color: 'var(--color-panel-text)',
              whiteSpace: 'pre',
            }}
          >
            <code>{currentSchemaCode}</code>
          </div>
        </div>
      </div>
    </div>
  );
};
