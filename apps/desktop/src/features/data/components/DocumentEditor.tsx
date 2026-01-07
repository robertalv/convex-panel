/**
 * DocumentEditor Component
 * Shared component for adding and editing documents with JSON editor
 */

import { useState, useCallback, useEffect } from "react";
import { X, Save, AlertCircle, Loader2 } from "lucide-react";
import type { TableSchema } from "../types";

interface DocumentEditorProps {
  mode: "add" | "edit";
  tableName: string;
  schema?: TableSchema;
  initialDocument?: Record<string, any> | null;
  onSave: (document: Record<string, any>) => Promise<void>;
  onClose: () => void;
}

function validateJSON(text: string): {
  valid: boolean;
  error?: string;
  value?: any;
} {
  try {
    const parsed = JSON.parse(text);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return { valid: false, error: "Document must be a JSON object" };
    }
    return { valid: true, value: parsed };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid JSON";
    return { valid: false, error: message };
  }
}

function formatDocumentForEdit(doc: Record<string, any>): string {
  // Remove system fields for editing
  const { _id, _creationTime, ...editable } = doc;
  return JSON.stringify(editable, null, 2);
}

function generateDocumentTemplate(schema?: TableSchema): string {
  if (!schema?.fields?.length) {
    return "{\n  \n}";
  }

  const template: Record<string, any> = {};

  for (const field of schema.fields) {
    if (field.fieldName === "_id" || field.fieldName === "_creationTime") {
      continue;
    }

    // Generate a default value based on the type
    switch (field.shape?.type) {
      case "String":
        template[field.fieldName] = "";
        break;
      case "Number":
      case "Float64":
      case "Int64":
        template[field.fieldName] = 0;
        break;
      case "Boolean":
        template[field.fieldName] = false;
        break;
      case "Id":
        template[field.fieldName] = "";
        break;
      case "Array":
        template[field.fieldName] = [];
        break;
      case "Object":
        template[field.fieldName] = {};
        break;
      default:
        if (!field.optional) {
          template[field.fieldName] = null;
        }
    }
  }

  return JSON.stringify(template, null, 2);
}

export function DocumentEditor({
  mode,
  tableName,
  schema,
  initialDocument,
  onSave,
  onClose,
}: DocumentEditorProps) {
  const [documentText, setDocumentText] = useState<string>(() => {
    if (initialDocument) {
      return formatDocumentForEdit(initialDocument);
    }
    return generateDocumentTemplate(schema);
  });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Reset document text when initial document changes
  useEffect(() => {
    if (initialDocument) {
      setDocumentText(formatDocumentForEdit(initialDocument));
    } else {
      setDocumentText(generateDocumentTemplate(schema));
    }
    setError(null);
  }, [initialDocument, schema]);

  // Handle save
  const handleSave = useCallback(async () => {
    const validation = validateJSON(documentText);

    if (!validation.valid) {
      setError(validation.error || "Invalid JSON");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(validation.value);
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save document";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }, [documentText, onSave, onClose]);

  // Handle text change with live validation
  const handleTextChange = useCallback((value: string) => {
    setDocumentText(value);

    // Clear error when user starts typing
    if (value.trim() === "") {
      setError(null);
    } else {
      // Validate but only show error if it's egregiously wrong
      const validation = validateJSON(value);
      if (!validation.valid && value.trim().length > 2) {
        // Only show parsing errors, not structure errors while typing
        if (
          validation.error?.includes("Unexpected") ||
          validation.error?.includes("position")
        ) {
          setError(validation.error);
        } else {
          setError(null);
        }
      } else {
        setError(null);
      }
    }
  }, []);

  const title =
    mode === "add" ? `Add document to ${tableName}` : `Edit document`;

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: "var(--color-surface-base)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{
          borderBottom: "1px solid var(--color-border-base)",
          backgroundColor: "var(--color-surface-raised)",
        }}
      >
        <h3
          className="text-sm font-medium truncate"
          style={{ color: "var(--color-text-base)" }}
        >
          {title}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center w-7 h-7 rounded transition-colors hover:bg-[var(--color-surface-base)]"
          style={{ color: "var(--color-text-muted)" }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Schema hint */}
      {schema?.fields && schema.fields.length > 0 && (
        <div
          className="px-4 py-2 text-xs flex-shrink-0"
          style={{
            backgroundColor: "var(--color-surface-raised)",
            borderBottom: "1px solid var(--color-border-base)",
            color: "var(--color-text-muted)",
          }}
        >
          <span className="font-medium">Fields:</span>{" "}
          {schema.fields
            .filter(
              (f) => f.fieldName !== "_id" && f.fieldName !== "_creationTime",
            )
            .map((f) => `${f.fieldName}${f.optional ? "?" : ""}`)
            .join(", ")}
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 min-h-0 p-4 overflow-hidden">
        <textarea
          value={documentText}
          onChange={(e) => handleTextChange(e.target.value)}
          className="w-full h-full p-3 rounded-md font-mono text-sm resize-none"
          style={{
            backgroundColor: "var(--color-surface-raised)",
            color: "var(--color-text-base)",
            border: `1px solid ${error ? "var(--color-error-base)" : "var(--color-border-base)"}`,
          }}
          placeholder="Enter document JSON..."
          spellCheck={false}
        />
      </div>

      {/* Error message */}
      {error && (
        <div
          className="flex items-center gap-2 px-4 py-2 text-xs flex-shrink-0"
          style={{
            backgroundColor: "var(--color-error-base-alpha)",
            color: "var(--color-error-base)",
            borderTop: "1px solid var(--color-error-base)",
          }}
        >
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Footer */}
      <div
        className="flex items-center justify-end gap-2 px-4 py-3 flex-shrink-0"
        style={{
          borderTop: "1px solid var(--color-border-base)",
          backgroundColor: "var(--color-surface-raised)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded text-xs font-medium transition-colors hover:bg-[var(--color-surface-base)]"
          style={{
            color: "var(--color-text-muted)",
            border: "1px solid var(--color-border-base)",
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !!error}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors"
          style={{
            backgroundColor: "var(--color-brand-base)",
            color: "white",
            opacity: isSaving || error ? 0.6 : 1,
          }}
        >
          {isSaving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save size={14} />
              <span>{mode === "add" ? "Add Document" : "Save Changes"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default DocumentEditor;
