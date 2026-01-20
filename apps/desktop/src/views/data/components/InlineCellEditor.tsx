/**
 * InlineCellEditor Component
 * Inline editor overlay for cell editing in the table view
 * Styled to match @packages/panel inline-cell-editor.tsx
 */

import React, { useEffect } from "react";
import { isConvexId } from "../utils/formatters";

export interface InlineCellEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  editorRef: React.RefObject<HTMLDivElement | null>;
  cellWidth: number;
  error?: string | null;
  linkTable?: string;
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
}) => {
  // Expand the editor to be wider than the cell, but cap at max width
  const MAX_EDITOR_WIDTH = 600;
  const expandedWidth = Math.min(
    Math.max(cellWidth * 1.5, 300),
    MAX_EDITOR_WIDTH,
  );
  const isConvexIdValue = isConvexId(value);
  const showLinkHint = linkTable && isConvexIdValue;

  // Auto-resize textarea based on content, but respect maxHeight
  const MAX_TEXTAREA_HEIGHT = 200;
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      const newHeight = Math.min(
        Math.max(inputRef.current.scrollHeight, 20),
        MAX_TEXTAREA_HEIGHT,
      );
      inputRef.current.style.height = `${newHeight}px`;
    }
  }, [value, inputRef]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [inputRef]);

  return (
    <div
      ref={editorRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: `${expandedWidth}px`,
        maxWidth: `${MAX_EDITOR_WIDTH}px`,
        minHeight: "100%",
        zIndex: 1000,
        backgroundColor: "var(--color-surface-raised)",
        border: error
          ? "1px solid var(--color-error-base)"
          : "1px solid var(--color-brand-base)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        justifyContent: "space-between",
        padding: "8px 12px",
        gap: "4px",
      }}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
          flex: 1,
        }}
      >
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!error) {
                onSave();
              }
            } else if (e.key === "Escape") {
              e.preventDefault();
              onCancel();
            }
          }}
          disabled={isSaving}
          style={{
            width: "100%",
            backgroundColor: "transparent",
            border: "none",
            outline: "none",
            color: error ? "var(--color-error-base)" : "var(--color-text-base)",
            fontSize: "12px",
            fontFamily: "ui-monospace, monospace",
            padding: 0,
            flex: 1,
            minHeight: "20px",
            resize: "none",
            overflowWrap: "break-word",
            wordWrap: "break-word",
            whiteSpace: "pre-wrap",
            textDecoration: error ? "underline wavy" : "none",
            textDecorationColor: error
              ? "var(--color-error-base)"
              : "transparent",
            lineHeight: "1.4",
            overflowY: "auto",
            maxHeight: "200px",
          }}
          placeholder={isSaving ? "Saving..." : ""}
          rows={1}
        />
        {showLinkHint && (
          <div
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              fontSize: "10px",
              color: "var(--color-text-muted)",
              whiteSpace: "nowrap",
            }}
          >
            → {linkTable}
          </div>
        )}
      </div>
      <div
        style={{
          display: "flex",
          width: "100%",
          flexDirection: "column",
          gap: "4px",
          paddingBottom: "4px",
          paddingRight: "0px",
        }}
      >
        {error && (
          <div
            style={{
              fontSize: "11px",
              color: "var(--color-error-base)",
              fontFamily: "ui-monospace, monospace",
              padding: "4px 0",
              wordBreak: "break-word",
            }}
          >
            {error.length > 80 ? `${error.slice(0, 80)}...` : error}
          </div>
        )}
        <div
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "16px",
            fontSize: "11px",
            color: "var(--color-text-muted)",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          <span>
            <span style={{ fontWeight: 600, color: "var(--color-text-base)" }}>
              Esc
            </span>{" "}
            to cancel
          </span>
          <span>
            <span style={{ fontWeight: 600, color: "var(--color-text-base)" }}>
              ⏎
            </span>{" "}
            to save
          </span>
        </div>
      </div>
    </div>
  );
};

export default InlineCellEditor;
