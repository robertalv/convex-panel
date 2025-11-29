import React from 'react';
import { Link2 } from 'lucide-react';
import { Tooltip } from '../../../components/shared/tooltip';
import { DocumentPreview } from './document-preview';
import { isConvexId } from './data-table-utils';

export interface InlineCellEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  editorRef: React.RefObject<HTMLDivElement>;
  cellWidth: number;
  error?: string | null;
  linkTable?: string;
  adminClient?: any;
  deploymentUrl?: string;
  componentId?: string | null;
}

export const InlineCellEditor: React.FC<InlineCellEditorProps> = ({ 
  value, 
  onChange, 
  onSave, 
  onCancel, 
  isSaving, 
  inputRef,
  editorRef,
  cellWidth,
  error,
  linkTable,
  adminClient,
  deploymentUrl,
  componentId,
}) => {
  // Expand the editor to be wider than the cell
  const expandedWidth = Math.max(cellWidth * 2, 300);
  const isConvexIdValue = isConvexId(value);
  const showLinkPreview = linkTable && isConvexIdValue;
  
  return (
    <div
      ref={editorRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${expandedWidth}px`,
        minHeight: '100%',
        zIndex: 1000,
        backgroundColor: 'var(--color-panel-bg-secondary)',
        border: error 
          ? '1px solid var(--color-panel-error)' 
          : '1px solid var(--color-panel-accent)',
        boxShadow: '0 4px 12px var(--color-panel-shadow)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        padding: '8px 12px',
        gap: '4px',
      }}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        }
      }}
    >
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (!error) {
                onSave();
              }
            } else if (e.key === 'Escape') {
              e.preventDefault();
              onCancel();
            }
          }}
          disabled={isSaving}
          style={{
            width: '100%',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            color: error ? 'var(--color-panel-error)' : 'var(--color-panel-text)',
            fontSize: '12px',
            fontFamily: 'monospace',
            padding: 0,
            flex: 1,
            minHeight: '20px',
            textDecoration: error ? 'underline wavy' : 'none',
            textDecorationColor: error ? 'var(--color-panel-error)' : 'transparent',
          }}
          placeholder={isSaving ? 'Saving...' : ''}
        />
        {showLinkPreview && (
          <Tooltip
              content={
                <DocumentPreview
                  documentId={value}
                  tableName={linkTable}
                  adminClient={adminClient}
                  deploymentUrl={deploymentUrl}
                  componentId={componentId}
                />
              }
              placement="right"
              maxWidth="500px"
              delay={300}
            >
              <Link2
                size={14}
                style={{
                  color: 'var(--color-panel-text-secondary)',
                  flexShrink: 0,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-panel-accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
                }}
              />
            </Tooltip>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          width: '100%',
          flexDirection: 'column',
          gap: '4px',
          paddingBottom: '4px',
          paddingRight: '0px',
        }}
      >
        {error && (
          <div
            style={{
              fontSize: '11px',
              color: 'var(--color-panel-error)',
              fontFamily: 'monospace',
              padding: '4px 0',
              wordBreak: 'break-word',
            }}
          >
            {error.length > 80 ? `${error.slice(0, 80)}...` : error}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '16px',
            fontSize: '12px',
            color: 'var(--color-panel-text-muted)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <span>
            <span style={{ fontWeight: 600, color: 'var(--color-panel-text)' }}>Esc</span> to cancel
          </span>
          <span>
            <span style={{ fontWeight: 600, color: 'var(--color-panel-text)' }}>⏎</span> to save
          </span>
        </div>
      </div>
    </div>
  );
};

