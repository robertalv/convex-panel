import React, { useEffect, useMemo } from 'react';
import { Link2 } from 'lucide-react';
import { Tooltip } from '../../../../components/shared/tooltip';
import { DocumentPreview } from '../document-preview';
import { isConvexId, createDocumentLink } from './data-table-utils';

export interface InlineCellEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  editorRef: React.RefObject<HTMLDivElement>;
  cellWidth: number;
  error?: string | null;
  linkTable?: string;
  adminClient?: any;
  deploymentUrl?: string;
  componentId?: string | null;
  onNavigateToTable?: (tableName: string, documentId: string) => void;
  accessToken?: string;
  teamSlug?: string;
  projectSlug?: string;
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
  onNavigateToTable,
  accessToken,
  teamSlug,
  projectSlug,
}) => {
  // Expand the editor to be wider than the cell, but cap at max width
  const MAX_EDITOR_WIDTH = 600;
  const expandedWidth = Math.min(Math.max(cellWidth * 1.5, 300), MAX_EDITOR_WIDTH);
  const isConvexIdValue = isConvexId(value);
  const showLinkPreview = linkTable && isConvexIdValue;
  
  // Create dashboard link for the document
  const dashboardLink = useMemo(() => {
    if (!linkTable || !isConvexIdValue || !deploymentUrl) return null;
    return createDocumentLink(deploymentUrl, linkTable, value, componentId || null, teamSlug, projectSlug, accessToken);
  }, [deploymentUrl, linkTable, value, componentId, teamSlug, projectSlug, accessToken]);
  
  // Auto-resize textarea based on content, but respect maxHeight
  const MAX_TEXTAREA_HEIGHT = 200;
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const newHeight = Math.min(Math.max(inputRef.current.scrollHeight, 20), MAX_TEXTAREA_HEIGHT);
      inputRef.current.style.height = `${newHeight}px`;
    }
  }, [value, inputRef]);
  
  return (
    <div
      ref={editorRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${expandedWidth}px`,
        maxWidth: `${MAX_EDITOR_WIDTH}px`,
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
      <div style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1 }}>
        <textarea
          ref={inputRef}
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
            resize: 'none',
            overflowWrap: 'break-word',
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            textDecoration: error ? 'underline wavy' : 'none',
            textDecorationColor: error ? 'var(--color-panel-error)' : 'transparent',
            lineHeight: '1.4',
            overflowY: 'auto',
            maxHeight: '200px',
          }}
          placeholder={isSaving ? 'Saving...' : ''}
          rows={1}
        />
        {showLinkPreview && (
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            <Tooltip
              content={
                <DocumentPreview
                  documentId={value}
                  tableName={linkTable}
                  adminClient={adminClient}
                  deploymentUrl={deploymentUrl}
                  componentId={componentId}
                  isEditing={true}
                  onNavigateToTable={onNavigateToTable}
                  accessToken={accessToken}
                  teamSlug={teamSlug}
                  projectSlug={projectSlug}
                />
              }
              placement="right"
              maxWidth="500px"
              delay={300}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  // Prefer in-app navigation if callback is provided
                  if (onNavigateToTable && linkTable) {
                    onNavigateToTable(linkTable, value);
                  } else if (dashboardLink) {
                    // Fallback to external dashboard link only if navigation callback not available
                    window.open(dashboardLink, '_blank', 'noopener,noreferrer');
                  }
                }}
                onMouseEnter={(e) => {
                  const icon = e.currentTarget.querySelector('svg');
                  if (icon) {
                    icon.style.color = 'var(--color-panel-accent)';
                  }
                }}
                onMouseLeave={(e) => {
                  const icon = e.currentTarget.querySelector('svg');
                  if (icon) {
                    icon.style.color = 'var(--color-panel-text-secondary)';
                  }
                }}
              >
                <Link2
                  size={14}
                  style={{
                    color: 'var(--color-panel-text-secondary)',
                    transition: 'color 0.2s ease',
                  }}
                />
              </div>
            </Tooltip>
          </div>
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

