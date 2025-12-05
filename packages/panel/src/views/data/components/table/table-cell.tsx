import React from 'react';
import { MoreVertical, Link2 } from 'lucide-react';
import { Tooltip } from '../../../../components/shared/tooltip';
import { DocumentPreview } from '../document-preview';
import { InlineCellEditor } from './inline-cell-editor';
import { formatValue, getValueColor, isConvexId, createDocumentLink } from './data-table-utils';
import type { ColumnMeta } from './data-table-utils';

export interface TableCellProps {
  column: string;
  value: any;
  width: number;
  columnMeta?: ColumnMeta;
  isHighlighted: boolean;
  isHovered: boolean;
  isMenuOpen: boolean;
  isEditing: boolean;
  isEditable: boolean;
  editingValue: string;
  editingError: string | null;
  isSaving: boolean;
  editInputRef: React.RefObject<HTMLTextAreaElement>;
  editorRef: React.RefObject<HTMLDivElement>;
  adminClient?: any;
  deploymentUrl?: string;
  componentId?: string | null;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onContextMenu: (event: React.MouseEvent) => void;
  onEditingValueChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onMenuClick: (event: React.MouseEvent) => void;
  onNavigateToTable?: (tableName: string, documentId: string) => void;
  accessToken?: string;
  teamSlug?: string;
  projectSlug?: string;
}

export const TableCell: React.FC<TableCellProps> = ({
  column,
  value,
  width,
  columnMeta,
  isHighlighted,
  isHovered,
  isMenuOpen,
  isEditing,
  isEditable,
  editingValue,
  editingError,
  isSaving,
  editInputRef,
  editorRef,
  adminClient,
  deploymentUrl,
  componentId,
  onMouseEnter,
  onMouseLeave,
  onDoubleClick,
  onContextMenu,
  onEditingValueChange,
  onSave,
  onCancel,
  onMenuClick,
  onNavigateToTable,
  accessToken,
  teamSlug,
  projectSlug,
}) => {
  const isUnset = value === null || value === undefined;
  const showLink = columnMeta?.linkTable && column !== '_id' && typeof value === 'string' && isConvexId(value);

  return (
    <td
      style={{
        padding: 0,
        borderRight: '1px solid var(--cp-data-row-border)',
        width,
        minWidth: width,
        maxWidth: width,
        transition: 'background-color 0.35s ease, box-shadow 0.35s ease',
        backgroundColor: isEditing
          ? 'var(--color-panel-bg-secondary)'
          : isHighlighted
            ? 'var(--cp-data-highlight-bg)'
            : isMenuOpen
              ? 'var(--color-panel-active)'
              : isHovered
                ? 'var(--color-panel-hover)'
                : 'transparent',
        boxShadow: isHighlighted
          ? '0 0 0 1px var(--cp-data-highlight-border)'
          : isMenuOpen
            ? '0 0 0 1px var(--color-panel-active)'
            : 'none',
        animation: isHighlighted
          ? 'var(--animate-highlight), var(--animate-highlightBorder)'
          : undefined,
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
    >
      {isEditing ? (
        <InlineCellEditor
          value={editingValue}
          onChange={onEditingValueChange}
          onSave={onSave}
          onCancel={onCancel}
          isSaving={isSaving}
          inputRef={editInputRef}
          editorRef={editorRef}
          cellWidth={width}
          error={editingError}
          linkTable={columnMeta?.linkTable}
          adminClient={adminClient}
          deploymentUrl={deploymentUrl}
          componentId={componentId}
          onNavigateToTable={onNavigateToTable}
          accessToken={accessToken}
          teamSlug={teamSlug}
          projectSlug={projectSlug}
        />
      ) : (
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 12px',
            gap: '8px',
            cursor: isEditable ? 'pointer' : 'default',
            height: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flex: 1,
              minWidth: 0,
            }}
          >
            {showLink && (
              <Tooltip
                content={
                  <DocumentPreview
                    documentId={value}
                    tableName={columnMeta?.linkTable || ''}
                    adminClient={adminClient}
                    deploymentUrl={deploymentUrl}
                    componentId={componentId}
                    onNavigateToTable={onNavigateToTable}
                    accessToken={accessToken}
                    teamSlug={teamSlug}
                    projectSlug={projectSlug}
                  />
                }
                position="right"
                maxWidth={500}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    cursor: 'pointer',
                    width: '18px',
                    height: '18px',
                    minWidth: '18px',
                    minHeight: '18px',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const referencedTable = columnMeta?.linkTable;
                    if (referencedTable) {
                      if (onNavigateToTable) {
                        onNavigateToTable(referencedTable, value);
                      } else {
                        const linkUrl = createDocumentLink(deploymentUrl, referencedTable, value, componentId || null, teamSlug, projectSlug, accessToken);
                        if (linkUrl) {
                          window.open(linkUrl, '_blank', 'noopener,noreferrer');
                        }
                      }
                    }
                  }}
                >
                  <Link2
                    size={14}
                    style={{
                      color: 'var(--color-panel-text-secondary)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--color-panel-accent)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
                    }}
                  />
                </div>
              </Tooltip>
            )}
            <span
              style={{
                color: isUnset ? 'var(--color-panel-text-muted)' : getValueColor(value),
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontStyle: isUnset ? 'italic' : 'normal',
                flex: 1,
                minWidth: 0,
              }}
            >
              {formatValue(value)}
            </span>
          </div>
          {(isHovered || isMenuOpen) && (
            <button
              type="button"
              data-menu-trigger
              onClick={onMenuClick}
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                border: '1px solid var(--color-panel-border)',
                backgroundColor: 'var(--color-panel-bg-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-panel-text)',
                cursor: 'pointer',
              }}
            >
              <MoreVertical 
                size={12}
                color="var(--color-panel-text-secondary)"
              />
            </button>
          )}
        </div>
      )}
    </td>
  );
};

