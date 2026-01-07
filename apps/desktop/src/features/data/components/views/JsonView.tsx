/**
 * JsonView Component
 * Collapsible JSON tree view for documents with inline editing
 * MongoDB Compass-style interface with line numbers and double-click to edit
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { TIMESTAMP_COLOR } from "@convex-panel/shared";
import type { TableDocument } from "../../types";
import { formatTimestamp, isConvexId } from "../../utils/formatters";
import { DocumentActions } from "../DocumentActions";
import { JsonViewSkeleton } from "../skeletons";

// Helper function to get Tailwind class for value color
function getValueColorClass(value: any, isIdField?: boolean): string {
  if (value === null || value === undefined) {
    return "text-[var(--color-text-muted)]";
  }

  // Check for ID fields (yellow)
  if (isIdField || (typeof value === "string" && isConvexId(value))) {
    return "text-yellow-500";
  }

  // Check for date objects
  if (typeof value === "object" && value !== null) {
    if (value.$date) {
      return ""; // Will use inline style with TIMESTAMP_COLOR
    }
  }

  if (typeof value === "string") {
    return "text-[var(--color-text-base)]";
  }
  if (typeof value === "number") {
    return ""; // Will use inline style with TIMESTAMP_COLOR if it's a timestamp
  }
  if (typeof value === "boolean") {
    return "text-yellow-500";
  }
  if (Array.isArray(value)) {
    return "text-purple-500";
  }
  if (typeof value === "object") {
    return "text-[var(--color-text-base)]";
  }
  return "text-[var(--color-text-base)]";
}

interface JsonViewProps {
  documents: TableDocument[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  observerTarget: (node: HTMLDivElement | null) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onEdit?: (documentId: string) => void;
  onClone?: (document: Record<string, any>) => void;
  onDelete?: (documentId: string) => void;
  onPatchDocument?: (
    documentId: string,
    fields: Record<string, any>,
  ) => Promise<void>;
}

interface JsonNodeProps {
  keyName?: string;
  value: any;
  depth: number;
  isLast?: boolean;
  showLineNumbers?: boolean;
  getNextLineNumber: () => number; // Function to get and increment line number
  path?: string; // Full path to this value (e.g., "field.subfield")
  onValueEdit?: (path: string, newValue: any) => Promise<void>; // Callback when value is edited
  documentId?: string; // Document ID for editing
}

function JsonNode({
  keyName,
  value,
  depth,
  isLast = false,
  showLineNumbers = true,
  getNextLineNumber,
  path = "",
  onValueEdit,
  documentId,
}: JsonNodeProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const editInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const indent = depth * 16;
  
  // Get the line number for this node
  const currentLineNumber = getNextLineNumber();
  
  // Build full path for this value
  const currentPath = path ? (keyName ? `${path}.${keyName}` : path) : (keyName || "");

  const isObject =
    value !== null && typeof value === "object" && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isExpandable = isObject || isArray;

  const renderLineNumber = (num: number) => {
    if (!showLineNumbers) return null;
    return (
      <span
        className="select-none text-right pr-3 shrink-0"
        style={{
          color: "var(--color-text-subtle)",
          width: "32px",
          fontSize: "10px",
        }}
      >
        {num}
      </span>
    );
  };

  // Check if this value is editable (not _id or _creationTime)
  const isEditable = onValueEdit && keyName !== "_id" && keyName !== "_creationTime" && 
    (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null);

  // Start editing
  const handleStartEdit = useCallback(() => {
    if (!isEditable) return;
    
    if (typeof value === "string") {
      setEditValue(value); // Just the content, without quotes
    } else if (value === null) {
      setEditValue("null");
    } else {
      setEditValue(String(value));
    }
    setIsEditing(true);
  }, [isEditable, value]);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditValue("");
  }, []);

  // Save edited value
  const handleSaveEdit = useCallback(async () => {
    if (!onValueEdit || !currentPath) return;

    let parsedValue: any = editValue;

    // Parse based on original type
    if (value === null) {
      if (editValue.trim() === "null") {
        parsedValue = null;
      } else {
        // Try to parse as the new type
        if (editValue.trim() === "true") parsedValue = true;
        else if (editValue.trim() === "false") parsedValue = false;
        else if (!isNaN(Number(editValue))) parsedValue = Number(editValue);
        else parsedValue = editValue;
      }
    } else if (typeof value === "string") {
      parsedValue = editValue; // Keep as string
    } else if (typeof value === "number") {
      const num = parseFloat(editValue);
      if (isNaN(num)) return; // Invalid number
      parsedValue = num;
    } else if (typeof value === "boolean") {
      const lower = editValue.toLowerCase();
      if (lower === "true") parsedValue = true;
      else if (lower === "false") parsedValue = false;
      else return; // Invalid boolean
    }

    setIsSaving(true);
    try {
      await onValueEdit(currentPath, parsedValue);
      setIsEditing(false);
    } catch (err) {
      // Error handling - could show error message
      console.error("Failed to save:", err);
    } finally {
      setIsSaving(false);
    }
  }, [onValueEdit, currentPath, editValue, value]);

  // Handle keydown in edit input
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelEdit();
    }
  }, [handleSaveEdit, handleCancelEdit]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      if (editInputRef.current instanceof HTMLInputElement) {
        editInputRef.current.select();
      }
    }
  }, [isEditing]);

  const renderValue = () => {
    if (isEditing && isEditable) {
      // Render editable input
      if (typeof value === "string") {
        return (
          <>
            <span style={{ color: "var(--color-text-muted)" }}>"</span>
            <input
              ref={editInputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
              className="bg-transparent border-none outline-none font-mono text-xs w-fit focus:ring-0 focus:ring-offset-0 focus:outline-none"
              style={{
                color: getValueColorClass(value).includes("text-") 
                  ? undefined 
                  : "var(--color-text-base)",
                width: `${Math.max(100, editValue.length * 7)}px`,
              }}
            />
            <span style={{ color: "var(--color-text-muted)" }}>"</span>
          </>
        );
      } else {
        // For numbers, booleans, null
        return (
          <input
            ref={editInputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            className="bg-transparent border-none outline-none font-mono text-xs w-fit focus:ring-0 focus:ring-offset-0 focus:outline-none"
            style={{
              color: typeof value === "number" 
                ? "rgb(59, 130, 246)" 
                : typeof value === "boolean"
                ? "rgb(234, 179, 8)"
                : "var(--color-text-muted)",
              width: `${Math.max(60, editValue.length * 7)}px`,
            }}
          />
        );
      }
    }

    // Render non-editable value
    if (value === null) {
      return (
        <span 
          className="text-[var(--color-text-muted)]"
          onDoubleClick={handleStartEdit}
          style={{ cursor: isEditable ? "text" : "default" }}
        >
          null
        </span>
      );
    }

    if (value === undefined) {
      return (
        <span className="text-[var(--color-text-muted)]">undefined</span>
      );
    }

    if (typeof value === "boolean") {
      return (
        <span 
          className="text-yellow-500"
          onDoubleClick={handleStartEdit}
          style={{ cursor: isEditable ? "text" : "default" }}
        >
          {value ? "true" : "false"}
        </span>
      );
    }

    if (typeof value === "number") {
      // Check if this is a timestamp (like _creationTime)
      const isTimestamp = keyName === "_creationTime" || 
        keyName?.endsWith("At") || 
        keyName?.endsWith("Time") ||
        (value > 1000000000000 && value < 9999999999999); // Rough timestamp range check
      
      return (
        <span 
          style={{ 
            color: isTimestamp ? TIMESTAMP_COLOR : undefined,
            cursor: isEditable ? "text" : "default" 
          }}
          onDoubleClick={handleStartEdit}
        >
          {value}
        </span>
      );
    }

    if (typeof value === "string") {
      // Check if it looks like a date
      if (
        keyName === "_creationTime" ||
        keyName?.endsWith("At") ||
        keyName?.endsWith("Time")
      ) {
        const timestamp = Number(value);
        if (!isNaN(timestamp) && timestamp > 1000000000000) {
          return (
            <span style={{ color: TIMESTAMP_COLOR }}>
              "{formatTimestamp(timestamp)}"
            </span>
          );
        }
      }
      return (
        <span 
          className={getValueColorClass(value)}
          onDoubleClick={handleStartEdit}
          style={{ cursor: isEditable ? "text" : "default" }}
        >
          "{value.length > 100 ? value.slice(0, 100) + "..." : value}"
        </span>
      );
    }

    return (
      <span 
        className={getValueColorClass(value)}
        onDoubleClick={handleStartEdit}
        style={{ cursor: isEditable ? "text" : "default" }}
      >
        {String(value)}
      </span>
    );
  };

  if (!isExpandable) {
    return (
      <div
        className="flex items-center font-mono text-xs"
        style={{ paddingLeft: showLineNumbers ? 0 : indent }}
      >
        {renderLineNumber(currentLineNumber)}
        <div style={{ paddingLeft: indent }}>
          {keyName !== undefined && (
            <>
              <span style={{ color: "var(--color-brand-base)" }}>
                "{keyName}"
              </span>
              <span style={{ color: "var(--color-text-muted)" }}>: </span>
            </>
          )}
          {renderValue()}
          {!isLast && (
            <span style={{ color: "var(--color-text-muted)" }}>,</span>
          )}
        </div>
      </div>
    );
  }

  const entries = isArray ? value : Object.entries(value);
  const bracket = isArray ? ["[", "]"] : ["{", "}"];
  const isEmpty =
    (isArray && value.length === 0) ||
    (!isArray && Object.keys(value).length === 0);

  if (isEmpty) {
    return (
      <div
        className="flex items-center font-mono text-xs"
        style={{ paddingLeft: showLineNumbers ? 0 : indent }}
      >
        {renderLineNumber(currentLineNumber)}
        <div style={{ paddingLeft: indent }}>
          {keyName !== undefined && (
            <>
              <span style={{ color: "var(--color-brand-base)" }}>
                "{keyName}"
              </span>
              <span style={{ color: "var(--color-text-muted)" }}>: </span>
            </>
          )}
          <span style={{ color: "var(--color-text-muted)" }}>
            {bracket[0]}
            {bracket[1]}
          </span>
          {!isLast && (
            <span style={{ color: "var(--color-text-muted)" }}>,</span>
          )}
        </div>
      </div>
    );
  }

  if (isExpanded) {
    return (
      <div>
        <div
          className="flex items-center font-mono text-xs cursor-pointer hover:bg-[var(--color-surface-raised)]"
          style={{ paddingLeft: showLineNumbers ? 0 : indent }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {renderLineNumber(currentLineNumber)}
          <div className="flex items-center" style={{ paddingLeft: indent }}>
            <span
              className="w-4 h-4 flex items-center justify-center mr-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              {isExpanded ? (
                <ChevronDown size={12} />
              ) : (
                <ChevronRight size={12} />
              )}
            </span>
            {keyName !== undefined && (
              <>
                <span style={{ color: "var(--color-brand-base)" }}>
                  "{keyName}"
                </span>
                <span style={{ color: "var(--color-text-muted)" }}>: </span>
              </>
            )}
            <span style={{ color: "var(--color-text-muted)" }}>
              {bracket[0]}
            </span>
          </div>
        </div>
        {isArray
          ? entries.map((item: any, idx: number) => (
              <JsonNode
                key={`${documentId || 'node'}-array-${currentPath}-${idx}`}
                value={item}
                depth={depth + 1}
                isLast={idx === entries.length - 1}
                showLineNumbers={showLineNumbers}
                getNextLineNumber={getNextLineNumber}
                path={currentPath ? `${currentPath}[${idx}]` : `[${idx}]`}
                onValueEdit={onValueEdit}
                documentId={documentId}
              />
            ))
          : entries.map(([key, val]: [string, any], idx: number) => (
              <JsonNode
                key={`${documentId || 'node'}-${currentPath}-${key}-${idx}`}
                keyName={key}
                value={val}
                depth={depth + 1}
                isLast={idx === entries.length - 1}
                showLineNumbers={showLineNumbers}
                getNextLineNumber={getNextLineNumber}
                path={currentPath}
                onValueEdit={onValueEdit}
                documentId={documentId}
              />
            ))}
        <div
          className="flex items-center font-mono text-xs"
          style={{ paddingLeft: showLineNumbers ? 0 : indent }}
        >
          {renderLineNumber(getNextLineNumber())}
          <div style={{ paddingLeft: indent }}>
            <span className="w-4 h-4 inline-block" />
            <span style={{ color: "var(--color-text-muted)" }}>
              {bracket[1]}
            </span>
            {!isLast && (
              <span style={{ color: "var(--color-text-muted)" }}>,</span>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Collapsed state - only consumes 1 line
  return (
    <div>
      <div
        className="flex items-center font-mono text-xs cursor-pointer hover:bg-[var(--color-surface-raised)]"
        style={{ paddingLeft: showLineNumbers ? 0 : indent }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {renderLineNumber(currentLineNumber)}
        <div className="flex items-center" style={{ paddingLeft: indent }}>
          <span
            className="w-4 h-4 flex items-center justify-center mr-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            {isExpanded ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )}
          </span>
          {keyName !== undefined && (
            <>
              <span style={{ color: "var(--color-brand-base)" }}>
                "{keyName}"
              </span>
              <span style={{ color: "var(--color-text-muted)" }}>: </span>
            </>
          )}
          <span style={{ color: "var(--color-text-muted)" }}>
            {bracket[0]}
            <span className="text-[10px] mx-1">
              {isArray
                ? `${value.length} items`
                : `${Object.keys(value).length} properties`}
            </span>
            {bracket[1]}
          </span>
          {!isLast && (
            <span style={{ color: "var(--color-text-muted)" }}>,</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface DocumentJsonBlockProps {
  document: TableDocument;
  isSelected?: boolean;
  onSelect?: (docId: string) => void;
  onEdit?: (documentId: string) => void;
  onClone?: (document: Record<string, any>) => void;
  onDelete?: (documentId: string) => void;
  onPatchDocument?: (
    documentId: string,
    fields: Record<string, any>,
  ) => Promise<void>;
}

function DocumentJsonBlock({
  document,
  isSelected = false,
  onSelect,
  onEdit,
  onClone,
  onDelete,
  onPatchDocument,
}: DocumentJsonBlockProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const lineNumberRef = useRef(1);

  const handleSelect = useCallback(() => {
    if (onSelect) {
      onSelect(document._id);
    }
  }, [onSelect, document._id]);

  // Handle value edit from JsonNode
  const handleValueEdit = useCallback(async (path: string, newValue: any) => {
    if (!onPatchDocument) return;

    // Parse the path to get the field name
    // Path format: "fieldName" or "fieldName.subfield" etc.
    // For nested paths, we need to update the nested object
    const pathParts = path.split('.');
    const fieldName = pathParts[0];
    
    if (fieldName === "_id" || fieldName === "_creationTime") {
      return; // Can't edit these
    }

    try {
      // For now, only support top-level fields
      // TODO: Support nested field editing
      if (pathParts.length === 1) {
        await onPatchDocument(document._id, {
          [fieldName]: newValue,
        });
      } else {
        // For nested fields, we'd need to merge the nested object
        // This is more complex and would require reading the current value
        console.warn("Nested field editing not yet supported");
      }
    } catch (err) {
      console.error("Failed to update value:", err);
      throw err;
    }
  }, [onPatchDocument, document._id]);

  // Function to get and increment line number
  const getNextLineNumber = useCallback(() => {
    const current = lineNumberRef.current;
    lineNumberRef.current += 1;
    return current;
  }, []);

  // Reset line number when document changes or when expanding
  useEffect(() => {
    if (isExpanded) {
      lineNumberRef.current = 1;
    }
  }, [isExpanded, document._id]);

  // Render JSON content with correct line numbers
  const renderJsonContent = useCallback(() => {
    const entries = Object.entries(document);
    
    // Reset line number for this document
    lineNumberRef.current = 1;
    const openingLineNumber = getNextLineNumber(); // Line 1

    return (
      <div className="py-2 overflow-x-auto">
        <div className="flex items-center font-mono text-xs">
          <span
            className="select-none text-right pr-3 shrink-0"
            style={{
              color: "var(--color-text-subtle)",
              width: "32px",
              fontSize: "10px",
            }}
          >
            {openingLineNumber}
          </span>
          <span style={{ color: "var(--color-text-muted)" }}>{"{"}</span>
        </div>
        {entries.map(([key, value], idx) => (
          <JsonNode
            key={`${document._id}-${key}-${idx}`}
            keyName={key}
            value={value}
            depth={1}
            isLast={idx === entries.length - 1}
            showLineNumbers={true}
            getNextLineNumber={getNextLineNumber}
            path=""
            onValueEdit={onPatchDocument ? handleValueEdit : undefined}
            documentId={document._id}
          />
        ))}
        <div className="flex items-center font-mono text-xs">
          <span
            className="select-none text-right pr-3 shrink-0"
            style={{
              color: "var(--color-text-subtle)",
              width: "32px",
              fontSize: "10px",
            }}
          >
            {getNextLineNumber()}
          </span>
          <span style={{ color: "var(--color-text-muted)" }}>{"}"}</span>
        </div>
      </div>
    );
  }, [document, getNextLineNumber, handleValueEdit, onPatchDocument]);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: isSelected
          ? "var(--color-brand-base-alpha)"
          : "var(--color-surface-base)",
        border: `1px solid ${isHovered ? "var(--color-border-strong)" : "var(--color-border-base)"}`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer"
        style={{ 
          backgroundColor: isSelected
            ? "var(--color-brand-base-alpha)"
            : "var(--color-surface-raised)",
          minHeight: "36px", // Fixed height to prevent growth
        }}
        onClick={() => setIsExpanded(!isExpanded)}
        data-no-edit
      >
        <div className="flex items-center gap-2">
          {/* Checkbox */}
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleSelect}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded cursor-pointer flex-shrink-0"
              style={{ accentColor: "var(--color-brand-base)" }}
            />
          )}
          <span style={{ color: "var(--color-text-muted)" }}>
            {isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </span>
          <span
            className="font-mono text-xs"
            style={{ color: "var(--color-warning-base)" }}
          >
            {document._id}
          </span>
        </div>

        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
          data-no-edit
          style={{
            opacity: isHovered ? 1 : 0,
            visibility: isHovered ? "visible" : "hidden",
            transition: "opacity 0.15s ease",
          }}
        >
          <DocumentActions
            documentId={document._id}
            document={document}
            onEdit={onEdit}
            onClone={onClone}
            onDelete={onDelete}
            size="xs"
          />
        </div>
      </div>

      {/* JSON Content - values are editable inline */}
      {isExpanded && renderJsonContent()}
    </div>
  );
}

export function JsonView({
  documents,
  isLoading,
  isLoadingMore,
  hasMore,
  observerTarget,
  selectedIds,
  onSelectionChange,
  onEdit,
  onClone,
  onDelete,
  onPatchDocument,
}: JsonViewProps) {
  // Handle document selection
  const handleSelectDocument = useCallback(
    (docId: string) => {
      if (selectedIds.includes(docId)) {
        onSelectionChange(selectedIds.filter((id) => id !== docId));
      } else {
        onSelectionChange([...selectedIds, docId]);
      }
    },
    [selectedIds, onSelectionChange],
  );
  if (isLoading && documents.length === 0) {
    return <JsonViewSkeleton />;
  }

  if (documents.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full"
        style={{ color: "var(--color-text-muted)" }}
      >
        <p className="text-sm">No documents found</p>
        <p className="text-xs mt-1">Add a document or adjust your filters</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4">
      <div className="space-y-3">
        {documents.map((doc) => (
          <DocumentJsonBlock
            key={doc._id}
            document={doc}
            isSelected={selectedIds.includes(doc._id)}
            onSelect={handleSelectDocument}
            onEdit={onEdit}
            onClone={onClone}
            onDelete={onDelete}
            onPatchDocument={onPatchDocument}
          />
        ))}

        {/* Infinite scroll trigger */}
        {hasMore && (
          <div
            ref={observerTarget}
            className="flex items-center justify-center py-4"
            style={{ color: "var(--color-text-muted)" }}
          >
            {isLoadingMore && (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-xs">Loading more...</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default JsonView;
