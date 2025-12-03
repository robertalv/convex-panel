import React, { useMemo } from 'react';
import type { TableDefinition } from '../../../types';
import { Card } from '../../../components/shared/card';

export interface SchemaViewProps {
  tableName: string;
  tableSchema?: TableDefinition[string];
}

export const SchemaView: React.FC<SchemaViewProps> = ({ tableName, tableSchema }) => {
  const schemaCode = useMemo(() => {
    if (!tableSchema) {
      return `// No schema available for table "${tableName}"`;
    }

    const fields = tableSchema.fields || [];
    
    let code = `import { defineSchema, defineTable } from "convex/server";\n`;
    code += `import { v } from "convex/values";\n\n`;
    code += `export default defineSchema({\n`;
    code += `  // Other tables here...\n\n`;
    code += `  ${tableName}: defineTable({\n`;

    fields.forEach((field) => {
      const fieldName = field.fieldName;
      const optional = field.optional ? 'optional(' : '';
      const closingParen = field.optional ? ')' : '';
      
      let typeDef = '';
      
      if (field.shape) {
        if (field.shape.type === 'id' && field.shape.tableName) {
          typeDef = `v.id("${field.shape.tableName}")`;
        } else if (field.shape.type === 'string') {
          typeDef = 'v.string()';
        } else if (field.shape.type === 'number') {
          typeDef = 'v.number()';
        } else if (field.shape.type === 'boolean') {
          typeDef = 'v.boolean()';
        } else if (field.shape.type === 'float64') {
          typeDef = 'v.float64()';
        } else if (field.shape.type === 'int64') {
          typeDef = 'v.int64()';
        } else if (field.shape.type === 'any') {
          typeDef = 'v.any()';
        } else if (field.shape.type === 'union') {
          // Union types - try to infer from shape if available
          // For now, use any() as we don't have direct access to union values
          typeDef = 'v.any()';
        } else {
          typeDef = 'v.any()';
        }
      } else {
        typeDef = 'v.any()';
      }

      code += `    ${fieldName}: ${optional}${typeDef}${closingParen},\n`;
    });

    code += `  })\n`;

    // Add indexes if they exist
    const indexFields = fields.filter((f) => f.fieldName.startsWith('by_'));
    if (indexFields.length > 0) {
      indexFields.forEach((indexField) => {
        const indexName = indexField.fieldName;
        const baseField = indexName.replace('by_', '');
        code += `    .index("${indexName}", ["${baseField}"])\n`;
      });
    }

    code += `});\n`;

    return code;
  }, [tableName, tableSchema]);

  return (
    <div
      style={{
        padding: '20px',
        height: '100%',
        overflow: 'auto',
        backgroundColor: 'var(--color-panel-bg-secondary)',
      }}
    >
      <Card
        title="Schema"
        style={{
          maxWidth: '100%',
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
              backgroundColor: 'var(--color-panel-bg-secondary)',
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
            backgroundColor: 'var(--color-panel-bg-secondary)',
            borderRadius: '6px',
            padding: '12px 14px',
            fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
            fontSize: '12px',
            lineHeight: 1.6,
            color: 'var(--color-panel-text)',
            overflow: 'auto',
            whiteSpace: 'pre',
          }}
        >
          <code>{schemaCode}</code>
        </div>
      </Card>
    </div>
  );
};
