/**
 * DocumentEditor Component
 * Shared component for adding and editing documents with Monaco JSON editor
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { Save, AlertCircle, Loader2 } from "lucide-react";
import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import { useTheme } from "@/contexts/ThemeContext";
import type { TableSchema } from "@convex-panel/shared";
import { ResizableSheet } from "./ResizableSheet";

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

// Monaco editor options for JSON editing
const editorOptions = {
  automaticLayout: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbers: "on" as const,
  lineNumbersMinChars: 3,
  lineDecorationsWidth: 0,
  overviewRulerBorder: false,
  contextmenu: true,
  bracketPairColorization: { enabled: true },
  guides: { bracketPairs: true, indentation: true },
  renderLineHighlight: "line" as const,
  fontSize: 13,
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  tabSize: 2,
  insertSpaces: true,
  wordWrap: "on" as const,
  folding: true,
  scrollbar: {
    vertical: "auto" as const,
    horizontal: "auto" as const,
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
  },
  padding: { top: 12, bottom: 12 },
};

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

  const { resolvedTheme } = useTheme();
  const saveRef = useRef<() => void>(() => {});

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

  // Keep saveRef updated
  useEffect(() => {
    saveRef.current = handleSave;
  }, [handleSave]);

  // Handle text change with live validation
  const handleEditorChange = useCallback((value: string | undefined) => {
    const newValue = value || "";
    setDocumentText(newValue);

    // Clear error when user starts typing
    if (newValue.trim() === "") {
      setError(null);
    } else {
      // Validate but only show error if it's egregiously wrong
      const validation = validateJSON(newValue);
      if (!validation.valid && newValue.trim().length > 2) {
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

  // Configure Monaco before it mounts
  const handleEditorWillMount: BeforeMount = useCallback((monaco: any) => {
    // Define custom themes with transparent background
    monaco.editor.defineTheme("convex-light", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#00000000",
      },
    });

    monaco.editor.defineTheme("convex-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#00000000",
      },
    });
  }, []);

  // Handle editor mount - add keybindings
  const handleEditorDidMount: OnMount = useCallback(
    (editor: any, monaco: any) => {
      // Add Cmd+Enter keybinding to save
      editor.addAction({
        id: "saveDocument",
        label: "Save Document",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        run: () => {
          saveRef.current?.();
        },
      });

      // Add Cmd+S keybinding to save
      editor.addAction({
        id: "saveDocumentCmdS",
        label: "Save Document",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
        run: () => {
          saveRef.current?.();
        },
      });

      // Focus the editor
      editor.focus();
    },
    [],
  );

  const title =
    mode === "add" ? `Add document to ${tableName}` : `Edit document`;

  // Build schema hint text
  const schemaHint =
    schema?.fields && schema.fields.length > 0
      ? schema.fields
          .filter(
            (f) => f.fieldName !== "_id" && f.fieldName !== "_creationTime",
          )
          .map((f) => `${f.fieldName}${f.optional ? "?" : ""}`)
          .join(", ")
      : null;

  return (
    <ResizableSheet
      id="document-editor"
      title={title}
      onClose={onClose}
      defaultWidth={400}
      minWidth={350}
      maxWidth={700}
    >
      {/* Schema hint */}
      {schemaHint && (
        <div
          className="px-4 h-[37px] flex items-center text-xs"
          style={{
            backgroundColor: "var(--color-surface-raised)",
            borderBottom: "1px solid var(--color-border-base)",
            color: "var(--color-text-muted)",
          }}
        >
          <span className="font-medium">Fields:</span> {schemaHint}
        </div>
      )}

      {/* Editor hint */}
      <div
        className="flex items-center justify-between px-4 py-2 flex-shrink-0"
        style={{
          backgroundColor: "var(--color-surface-raised)",
          borderBottom: "1px solid var(--color-border-base)",
        }}
      >
        <span
          className="text-xs font-medium"
          style={{ color: "var(--color-text-muted)" }}
        >
          JSON Document
        </span>
        <span className="text-xs" style={{ color: "var(--color-text-subtle)" }}>
          Cmd+Enter to save
        </span>
      </div>

      {/* Monaco Editor */}
      <div
        className="flex-1 min-h-0 overflow-hidden"
        style={{ backgroundColor: "var(--color-background-raised)" }}
      >
        <Editor
          height="100%"
          defaultLanguage="json"
          value={documentText}
          theme={resolvedTheme === "dark" ? "convex-dark" : "convex-light"}
          options={editorOptions}
          beforeMount={handleEditorWillMount}
          onMount={handleEditorDidMount}
          onChange={handleEditorChange}
          loading={
            <div
              className="flex items-center justify-center h-full"
              style={{
                backgroundColor: "var(--color-background-raised)",
              }}
            >
              <span
                className="text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
                Loading editor...
              </span>
            </div>
          }
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
    </ResizableSheet>
  );
}

export default DocumentEditor;
