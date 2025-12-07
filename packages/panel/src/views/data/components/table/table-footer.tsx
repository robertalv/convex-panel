import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import type { TableDefinition } from '../../../../types';
import { useSheetSafe } from '../../../../contexts/sheet-context';
import { SchemaSheet } from '../schema-sheet';

export interface TableFooterProps {
  tableName: string;
  tableSchema?: TableDefinition[string];
  documents?: any[];
  adminClient?: any;
  componentId?: string | null;
}

export const TableFooter: React.FC<TableFooterProps> = ({ 
  tableName, 
  tableSchema, 
  documents,
  adminClient,
  componentId,
}) => {
  const { openSheet } = useSheetSafe();

  const handleOpenSchema = () => {
    openSheet({
      content: (
        <SchemaSheet
          tableName={tableName}
          tableSchema={tableSchema}
          documents={documents}
          adminClient={adminClient}
          componentId={componentId}
        />
      ),
      width: '600px',
    });
  };

  return (
    <div
      style={{
        height: '40px',
        borderTop: '1px solid var(--color-panel-border)',
        backgroundColor: 'var(--color-panel-bg)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        flexShrink: 0,
      }}
    >
      <button
        type="button"
        onClick={handleOpenSchema}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--color-panel-text-muted)',
          fontSize: '12px',
          border: '1px solid var(--color-panel-border)',
          borderRadius: '8px',
          padding: '6px 12px',
          backgroundColor: 'transparent',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--color-panel-text)';
          e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--color-panel-text-muted)';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <SettingsIcon size={12} />
        Schema
      </button>
    </div>
  );
};

