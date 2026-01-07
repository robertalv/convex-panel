import React from "react";
import { Checkbox } from "../../../../components/shared/checkbox";
import type { TableDocument } from "../../../../types";
import { TableCell } from "./table-cell";
import type { ColumnMeta } from "./data-table-utils";

export interface TableRowProps {
  document: TableDocument;
  columns: string[];
  getColumnWidth: (column: string) => number;
  columnMeta: Record<string, ColumnMeta>;
  selectedDocumentIds: string[];
  isNewRow?: boolean;
  highlightedColumns?: Set<string>;
  hoveredCell: { rowId: string; column: string } | null;
  cellMenuState: {
    rowId: string;
    column: string;
    value: any;
    position: { x: number; y: number };
  } | null;
  editingCell: { rowId: string; column: string; value: any } | null;
  editingValue: string;
  editingError: string | null;
  isSaving: boolean;
  editInputRef: React.RefObject<HTMLTextAreaElement>;
  editorRef: React.RefObject<HTMLDivElement>;
  trailingSpacerWidth: number;
  adminClient?: any;
  deploymentUrl?: string;
  componentId?: string | null;
  onRowSelectionToggle: (id: string) => void;
  onCellHover: (rowId: string, column: string) => void;
  onCellHoverLeave: (rowId: string, column: string) => void;
  onCellDoubleClick: (rowId: string, column: string, value: any) => void;
  onCellContextMenu: (
    event: React.MouseEvent,
    rowId: string,
    column: string,
    value: any,
  ) => void;
  onEditingValueChange: (value: string) => void;
  onSaveEditing: () => void;
  onCancelEditing: () => void;
  onCellMenuClick: (
    event: React.MouseEvent,
    rowId: string,
    column: string,
    value: any,
  ) => void;
  isEditableColumn: (column: string) => boolean;
  onNavigateToTable?: (tableName: string, documentId: string) => void;
  accessToken?: string;
  teamSlug?: string;
  projectSlug?: string;
}

const TableRowComponent: React.FC<TableRowProps> = ({
  document,
  columns,
  getColumnWidth,
  columnMeta,
  selectedDocumentIds,
  isNewRow,
  highlightedColumns,
  hoveredCell,
  cellMenuState,
  editingCell,
  editingValue,
  editingError,
  isSaving,
  editInputRef,
  editorRef,
  trailingSpacerWidth,
  adminClient,
  deploymentUrl,
  componentId,
  onRowSelectionToggle,
  onCellHover,
  onCellHoverLeave,
  onCellDoubleClick,
  onCellContextMenu,
  onEditingValueChange,
  onSaveEditing,
  onCancelEditing,
  onCellMenuClick,
  isEditableColumn,
  onNavigateToTable,
  accessToken,
  teamSlug,
  projectSlug,
}) => {
  const isSelected = selectedDocumentIds.includes(document._id);

  const rowBoxShadow = isNewRow
    ? "0 0 0 0 var(--color-panel-highlight-border)"
    : "none";

  const rowAnimation = isNewRow
    ? "var(--animate-highlight), var(--animate-highlightBorder)"
    : undefined;

  return (
    <tr
      style={{
        borderBottom: "1px solid var(--cp-data-row-border)",
        transition: "background-color 0.35s ease, box-shadow 0.35s ease",
        boxShadow: rowBoxShadow,
        animation: rowAnimation,
        backgroundColor: isSelected
          ? "var(--cp-data-row-selected-bg)"
          : "var(--color-panel-bg)",
      }}
    >
      <td
        style={{
          padding: 0,
          textAlign: "center",
          width: 40,
          minWidth: 40,
          maxWidth: 40,
          position: "sticky",
          left: 0,
          zIndex: 11,
        }}
      >
        <div
          style={{
            width: 40,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRight: "1px solid var(--cp-data-row-border)",
          }}
        >
          <Checkbox
            aria-label={`Select row ${document._id}`}
            size={16}
            containerSize={28}
            checked={isSelected}
            onChange={() => onRowSelectionToggle(document._id)}
          />
        </div>
      </td>
      {columns.map((column) => {
        const value = document[column as keyof TableDocument];
        const width = getColumnWidth(column);
        const isHovered =
          hoveredCell?.rowId === document._id && hoveredCell?.column === column;
        const isMenuOpen =
          cellMenuState?.rowId === document._id &&
          cellMenuState?.column === column;
        const isEditing =
          editingCell?.rowId === document._id && editingCell?.column === column;
        const isEditable = isEditableColumn(column);
        const isHighlighted = highlightedColumns?.has(column) ?? false;

        return (
          <TableCell
            key={column}
            column={column}
            value={value}
            width={width}
            columnMeta={columnMeta[column]}
            isHighlighted={isHighlighted}
            isHovered={isHovered}
            isMenuOpen={isMenuOpen}
            isEditing={isEditing}
            isEditable={isEditable}
            editingValue={editingValue}
            editingError={editingError}
            isSaving={isSaving}
            editInputRef={editInputRef}
            editorRef={editorRef}
            adminClient={adminClient}
            deploymentUrl={deploymentUrl}
            componentId={componentId}
            onMouseEnter={() => onCellHover(document._id, column)}
            onMouseLeave={() => onCellHoverLeave(document._id, column)}
            onDoubleClick={(e) => {
              if (isEditable && !isEditing) {
                e.stopPropagation();
                onCellDoubleClick(document._id, column, value);
              }
            }}
            onContextMenu={(event) =>
              onCellContextMenu(event, document._id, column, value)
            }
            onEditingValueChange={onEditingValueChange}
            onSave={onSaveEditing}
            onCancel={onCancelEditing}
            onMenuClick={(event) => {
              onCellMenuClick(event, document._id, column, value);
            }}
            onNavigateToTable={onNavigateToTable}
            accessToken={accessToken}
            teamSlug={teamSlug}
            projectSlug={projectSlug}
          />
        );
      })}
      <td
        style={{
          padding: "8px",
          width: trailingSpacerWidth,
          borderRight: "1px solid var(--color-panel-border)",
        }}
      ></td>
    </tr>
  );
};

// Memoize TableRow to prevent re-renders when parent re-renders
// but row data hasn't changed
export const TableRow = React.memo(TableRowComponent);
