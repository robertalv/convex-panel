import React, { useMemo, useState, useEffect } from 'react';
import { X, Copy, Check, ExternalLink } from 'lucide-react';
import type { TableDefinition } from '../../../types';
import { useSheetSafe } from '../../../contexts/sheet-context';
import { copyToClipboard } from '../../../utils/toast';

export interface SchemaSheetProps {
  tableName: string;
  tableSchema?: TableDefinition[string];
  documents?: any[];
  adminClient?: any;
  componentId?: string | null;
}

type ValidatorJSON =
  | { type: 'null' }
  | { type: 'number' }
  | { type: 'bigint' }
  | { type: 'boolean' }
  | { type: 'string' }
  | { type: 'bytes' }
  | { type: 'any' }
  | { type: 'literal'; value: any }
  | { type: 'id'; tableName: string }
  | { type: 'array'; value: ValidatorJSON }
  | { type: 'record'; keys: ValidatorJSON; values: { fieldType: ValidatorJSON; optional: boolean } }
  | { type: 'union'; value: ValidatorJSON[] }
  | { type: 'object'; value: Record<string, { fieldType: ValidatorJSON; optional: boolean }> };

type Index = {
  indexDescriptor: string;
  fields: string[];
};

type SearchIndex = {
  indexDescriptor: string;
  searchField: string;
  filterFields: string[];
};

type VectorIndex = {
  indexDescriptor: string;
  vectorField: string;
  dimensions: number;
  filterFields: string[];
};

type TableDefinitionJSON = {
  tableName: string;
  indexes: Index[];
  searchIndexes: SearchIndex[];
  vectorIndexes?: VectorIndex[];
  stagedDbIndexes?: Index[];
  stagedSearchIndexes?: SearchIndex[];
  stagedVectorIndexes?: VectorIndex[];
  documentType: ValidatorJSON | null;
};

type SchemaJson = {
  tables: TableDefinitionJSON[];
  schemaValidation: boolean;
};

// Display functions for ValidatorJSON (similar to Convex's format.ts)
function displayValidator(validator: ValidatorJSON): string {
  switch (validator.type) {
    case 'null':
      return 'v.null()';
    case 'number':
      return 'v.float64()';
    case 'bigint':
      return 'v.int64()';
    case 'boolean':
      return 'v.boolean()';
    case 'string':
      return 'v.string()';
    case 'bytes':
      return 'v.bytes()';
    case 'any':
      return 'v.any()';
    case 'literal':
      switch (typeof validator.value) {
        case 'string':
          return `v.literal("${validator.value}")`;
        case 'number':
          return `v.literal(${validator.value})`;
        case 'boolean':
          return `v.literal(${validator.value})`;
        default:
          return `v.literal(${JSON.stringify(validator.value)})`;
      }
    case 'id':
      return `v.id("${validator.tableName}")`;
    case 'array':
      return `v.array(${displayValidator(validator.value)})`;
    case 'record':
      const keyType = displayValidator(validator.keys);
      const valueType = displayObjectFieldSchema(validator.values);
      return `v.record(${keyType}, ${valueType})`;
    case 'union':
      const unionParts = validator.value.map(v => displayValidator(v));
      // If union has multiple parts or any part is long, format on multiple lines
      if (unionParts.length > 2 || unionParts.some(p => p.length > 30)) {
        return `v.union(\n    ${unionParts.join(',\n    ')}\n  )`;
      }
      return `v.union(${unionParts.join(', ')})`;
    case 'object':
      return `v.object(${displayObjectSchema(validator.value)})`;
    default:
      return 'v.any()';
  }
}

function displayObjectFieldSchema(field: { fieldType: ValidatorJSON; optional: boolean }): string {
  const validator = displayValidator(field.fieldType);
  return field.optional ? `v.optional(${validator})` : validator;
}

function displayDocumentType(validator: ValidatorJSON): string {
  if (validator.type === 'object') {
    return displayObjectSchema(validator.value);
  }
  if (validator.type === 'union') {
    return displayValidator(validator);
  }
  return displayValidator(validator);
}

function displayObjectSchema(object: Record<string, { fieldType: ValidatorJSON; optional: boolean }>): string {
  const fields = Object.keys(object)
    .map(key => {
      const valueType = displayObjectFieldSchema(object[key]);
      return `    ${key}: ${valueType}`;
    })
    .join(',\n');
  return `{\n${fields}\n  }`;
}

function displayIndexes(indexes: Index[], type: 'staged' | 'active'): string {
  return indexes
    .map((index) => {
      const fields = `[${index.fields
        .filter((field) => (field.length > 0 ? field[0] !== '_' : true))
        .map((field) => `"${field}"`)
        .join(', ')}]`;
      return type === 'staged'
        ? `.index("${index.indexDescriptor}", { fields: ${fields}, staged: true })`
        : `.index("${index.indexDescriptor}", ${fields})`;
    })
    .join('');
}

function displaySearchIndexes(searchIndexes: SearchIndex[], type: 'staged' | 'active'): string {
  return searchIndexes
    .map((searchIndex) => {
      const filterFieldsStr = searchIndex.filterFields.length > 0
        ? `, filterFields: [${searchIndex.filterFields.map(f => `"${f}"`).join(', ')}]`
        : '';
      const stagedStr = type === 'staged' ? ', staged: true' : '';
      return `.searchIndex("${searchIndex.indexDescriptor}", { searchField: "${searchIndex.searchField}"${filterFieldsStr}${stagedStr} })`;
    })
    .join('');
}

function displayVectorIndexes(vectorIndexes: VectorIndex[], type: 'staged' | 'active'): string {
  return vectorIndexes
    .map((vectorIndex) => {
      const filterFieldsStr = vectorIndex.filterFields.length > 0
        ? `, filterFields: [${vectorIndex.filterFields.map(f => `"${f}"`).join(', ')}]`
        : '';
      const stagedStr = type === 'staged' ? ', staged: true' : '';
      return `.vectorIndex("${vectorIndex.indexDescriptor}", { vectorField: "${vectorIndex.vectorField}", dimensions: ${vectorIndex.dimensions}${filterFieldsStr}${stagedStr} })`;
    })
    .join('');
}

function displayTableDefinition(tableDefinition: TableDefinitionJSON): string {
  const documentType = displayDocumentType(
    tableDefinition.documentType ?? { type: 'any' }
  );
  const indexes = 
    displayIndexes(tableDefinition.indexes, 'active') +
    displayIndexes(tableDefinition.stagedDbIndexes ?? [], 'staged') +
    displaySearchIndexes(tableDefinition.searchIndexes, 'active') +
    displaySearchIndexes(tableDefinition.stagedSearchIndexes ?? [], 'staged') +
    displayVectorIndexes(tableDefinition.vectorIndexes ?? [], 'active') +
    displayVectorIndexes(tableDefinition.stagedVectorIndexes ?? [], 'staged');
  
  if (indexes) {
    return `${tableDefinition.tableName}: defineTable(${documentType}
  )${indexes}`;
  }
  return `${tableDefinition.tableName}: defineTable(${documentType})`;
}

function displaySchema(schema: SchemaJson, tableName: string): string {
  const table = schema.tables.find(t => t.tableName === tableName);
  if (!table) {
    return `// Table "${tableName}" not found in schema`;
  }

  const tableDef = displayTableDefinition(table);
  const schemaOptions = schema.schemaValidation === false ? ', { schemaValidation: false }' : '';
  
  return `import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ${tableDef}${schemaOptions}
});`;
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

export const SchemaSheet: React.FC<SchemaSheetProps> = ({ 
  tableName, 
  tableSchema, 
  documents = [],
  adminClient,
  componentId,
}) => {
  const { closeSheet } = useSheetSafe();
  const [activeTab, setActiveTab] = useState<'saved' | 'generated'>('saved');
  const [copied, setCopied] = useState(false);
  const [schemaJson, setSchemaJson] = useState<SchemaJson | null>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  // Fetch schema from backend
  useEffect(() => {
    const fetchSchema = async () => {
      if (!adminClient || !tableName) {
        return;
      }

      setIsLoadingSchema(true);
      setSchemaError(null);

      try {
        const normalizedComponentId = componentId === 'app' || componentId === null ? null : componentId;
        const schemas = await adminClient.query(
          '_system/frontend/getSchemas:default' as any,
          { componentId: normalizedComponentId }
        );

        if (schemas?.active) {
          const parsed = JSON.parse(schemas.active) as SchemaJson;
          setSchemaJson(parsed);
        } else {
          setSchemaJson(null);
        }
      } catch (err: any) {
        console.error('Error fetching schema:', err);
        setSchemaError(err?.message || 'Failed to fetch schema');
        setSchemaJson(null);
      } finally {
        setIsLoadingSchema(false);
      }
    };

    fetchSchema();
  }, [adminClient, tableName, componentId]);

  // Generate saved schema (from schema JSON if available, otherwise fallback to tableSchema)
  const savedSchemaCode = useMemo(() => {
    // Prefer schema JSON from backend (includes indexes and proper types)
    if (schemaJson) {
      try {
        return displaySchema(schemaJson, tableName);
      } catch (err: any) {
        console.error('Error displaying schema:', err);
        // Fall through to fallback
      }
    }

    // Fallback to tableSchema if schema JSON not available
    if (!tableSchema) {
      if (isLoadingSchema) {
        return '// Loading schema...';
      }
      if (schemaError) {
        return `// Error loading schema: ${schemaError}`;
      }
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
  }, [tableName, tableSchema, schemaJson, isLoadingSchema, schemaError]);

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
