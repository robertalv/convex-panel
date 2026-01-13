/**
 * RawView Component
 * Full Monaco editor view for raw JSON editing of documents
 * Allows editing multiple documents as a JSON array
 */

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Loader2, Save, AlertCircle, RefreshCw } from "lucide-react";
import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import { useTheme } from "@/contexts/theme-context";
import type { TableDocument } from "../../types";

interface RawViewProps {
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
  onBulkUpdate?: (documents: Record<string, any>[]) => Promise<void>;
}

// Monaco editor options
const editorOptions = {
  automaticLayout: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbers: "on" as const,
  lineNumbersMinChars: 4,
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
  foldingStrategy: "auto" as const,
  scrollbar: {
    vertical: "auto" as const,
    horizontal: "auto" as const,
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
  },
  padding: { top: 12, bottom: 12 },
};

function validateDocuments(text: string): {
  valid: boolean;
  error?: string;
  value?: Record<string, any>[];
} {
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      return { valid: false, error: "Documents must be a JSON array" };
    }
    for (let i = 0; i < parsed.length; i++) {
      if (typeof parsed[i] !== "object" || parsed[i] === null) {
        return { valid: false, error: `Item at index ${i} must be an object` };
      }
      if (!parsed[i]._id) {
        return { valid: false, error: `Document at index ${i} is missing _id` };
      }
    }
    return { valid: true, value: parsed };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid JSON";
    return { valid: false, error: message };
  }
}

export function RawView({
  documents,
  isLoading,
  isLoadingMore,
  hasMore,
  observerTarget,
  onPatchDocument,
}: RawViewProps) {
  const { resolvedTheme } = useTheme();
  const [editorContent, setEditorContent] = useState<string>("");
  const [originalContent, setOriginalContent] = useState<string>("");
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const saveRef = useRef<() => void>(() => {});
  const editorRef = useRef<any>(null);
  const originalDocumentsRef = useRef<TableDocument[]>([]);
  const isRestoringProtectedFields = useRef(false);

  // Format documents as JSON
  const formattedDocuments = useMemo(() => {
    return JSON.stringify(documents, null, 2);
  }, [documents]);

  // Update editor content when documents change (only if no pending changes)
  useEffect(() => {
    if (!hasChanges) {
      setEditorContent(formattedDocuments);
      setOriginalContent(formattedDocuments);
      originalDocumentsRef.current = documents;
    }
  }, [formattedDocuments, hasChanges, documents]);

  // Check if protected fields were modified and get restored content
  const checkAndRestoreProtectedFields = useCallback((content: string): {
    needsRestore: boolean;
    restoredContent: string;
  } => {
    if (isRestoringProtectedFields.current) {
      return { needsRestore: false, restoredContent: content };
    }
    
    try {
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed)) {
        return { needsRestore: false, restoredContent: content };
      }

      const originalDocs = originalDocumentsRef.current;
      let needsRestore = false;
      const restored = parsed.map((doc: any) => {
        if (!doc || typeof doc !== "object" || !doc._id) return doc;
        
        const originalDoc = originalDocs.find((d) => d._id === doc._id);
        if (!originalDoc) return doc;

        const restoredDoc = { ...doc };
        
        // Restore _id if it was changed
        if (doc._id !== originalDoc._id) {
          restoredDoc._id = originalDoc._id;
          needsRestore = true;
        }
        
        // Restore _creationTime if it was changed
        if (doc._creationTime !== originalDoc._creationTime) {
          restoredDoc._creationTime = originalDoc._creationTime;
          needsRestore = true;
        }
        
        return restoredDoc;
      });

      if (needsRestore) {
        const restoredContent = JSON.stringify(restored, null, 2);
        return { needsRestore: true, restoredContent };
      }
      
      return { needsRestore: false, restoredContent: content };
    } catch {
      return { needsRestore: false, restoredContent: content };
    }
  }, []);

  // Track changes
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (isRestoringProtectedFields.current) return;
      
      const newValue = value || "[]";
      setEditorContent(newValue);
      setHasChanges(newValue !== originalContent);
      setError(null);
      setSaveSuccess(false);
    },
    [originalContent],
  );

  // Save changes
  const handleSave = useCallback(async () => {
    if (!onPatchDocument || !hasChanges) return;

    const validation = validateDocuments(editorContent);
    if (!validation.valid) {
      setError(validation.error || "Invalid JSON");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const editedDocs = validation.value!;
      const originalDocs = JSON.parse(originalContent) as TableDocument[];

      // Find changed documents
      const changedDocs: { id: string; fields: Record<string, any> }[] = [];

      for (const editedDoc of editedDocs) {
        const originalDoc = originalDocs.find((d) => d._id === editedDoc._id);
        if (!originalDoc) continue;

        // Compare and find changed fields
        const changes: Record<string, any> = {};
        let hasFieldChanges = false;

        for (const [key, value] of Object.entries(editedDoc)) {
          // Skip system fields
          if (key === "_id" || key === "_creationTime") continue;

          if (JSON.stringify(value) !== JSON.stringify(originalDoc[key])) {
            changes[key] = value;
            hasFieldChanges = true;
          }
        }

        if (hasFieldChanges) {
          changedDocs.push({ id: editedDoc._id, fields: changes });
        }
      }

      // Apply changes
      for (const { id, fields } of changedDocs) {
        await onPatchDocument(id, fields);
      }

      // Update original content to match saved state
      setOriginalContent(editorContent);
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save changes";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }, [editorContent, originalContent, onPatchDocument, hasChanges]);

  // Keep saveRef updated
  useEffect(() => {
    saveRef.current = handleSave;
  }, [handleSave]);

  // Reset changes
  const handleReset = useCallback(() => {
    setEditorContent(originalContent);
    setHasChanges(false);
    setError(null);
  }, [originalContent]);

  // Configure Monaco before mount
  const handleEditorWillMount: BeforeMount = useCallback((monaco: any) => {
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

  // Handle editor mount
  const handleEditorDidMount: OnMount = useCallback(
    (editor: any, monaco: any) => {
      editorRef.current = editor;
      
      // Add Cmd+S keybinding to save
      editor.addAction({
        id: "saveChanges",
        label: "Save Changes",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
        run: () => {
          saveRef.current?.();
        },
      });

      // Listen to model content changes to prevent editing protected fields
      const model = editor.getModel();
      if (model) {
        const disposable = model.onDidChangeContent(() => {
          if (isRestoringProtectedFields.current) return;
          
          const currentValue = model.getValue();
          const { needsRestore, restoredContent } = checkAndRestoreProtectedFields(currentValue);
          
          if (needsRestore) {
            // Protected fields were modified, restore them
            isRestoringProtectedFields.current = true;
            editor.executeEdits("restore-protected-fields", [
              {
                range: model.getFullModelRange(),
                text: restoredContent,
              },
            ]);
            // Update state to reflect restored content
            setEditorContent(restoredContent);
            setHasChanges(restoredContent !== originalContent);
            setTimeout(() => {
              isRestoringProtectedFields.current = false;
            }, 0);
          }
        });
        
        // Cleanup on unmount
        return () => {
          disposable.dispose();
        };
      }
    },
    [checkAndRestoreProtectedFields],
  );

  if (isLoading && documents.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-full"
        style={{ color: "var(--color-text-muted)" }}
      >
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2 text-sm">Loading documents...</span>
      </div>
    );
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
    <div className="flex flex-col h-full">
      {/* Header with save/reset actions */}
      <div
        className="flex items-center justify-between px-4 py-2 flex-shrink-0"
        style={{
          backgroundColor: "var(--color-surface-raised)",
          borderBottom: "1px solid var(--color-border-base)",
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-medium"
            style={{ color: "var(--color-text-muted)" }}
          >
            {documents.length} document{documents.length !== 1 ? "s" : ""}
          </span>
          {hasMore && (
            <span
              className="text-xs"
              style={{ color: "var(--color-text-subtle)" }}
            >
              (scroll to load more)
            </span>
          )}
          {hasChanges && (
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{
                backgroundColor: "var(--color-warning-base-alpha)",
                color: "var(--color-warning-base)",
              }}
            >
              Unsaved changes
            </span>
          )}
          {saveSuccess && (
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{
                backgroundColor:
                  "var(--color-success-base-alpha, rgba(34, 197, 94, 0.1))",
                color: "var(--color-success-base, #22c55e)",
              }}
            >
              Saved!
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs"
            style={{ color: "var(--color-text-subtle)" }}
          >
            Cmd+S to save
          </span>
          {hasChanges && (
            <>
              <button
                onClick={handleReset}
                disabled={isSaving}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors hover:bg-[var(--color-surface-base)]"
                style={{ color: "var(--color-text-muted)" }}
              >
                <RefreshCw size={12} />
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !!error}
                className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded transition-colors"
                style={{
                  backgroundColor: "var(--color-brand-base)",
                  color: "white",
                  opacity: isSaving || error ? 0.6 : 1,
                }}
              >
                {isSaving ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Save size={12} />
                )}
                Save
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          className="flex items-center gap-2 px-4 py-2 text-xs flex-shrink-0"
          style={{
            backgroundColor: "var(--color-error-base-alpha)",
            color: "var(--color-error-base)",
          }}
        >
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Monaco Editor */}
      <div
        className="flex-1 min-h-0 overflow-hidden"
        style={{ backgroundColor: "var(--color-background-base)" }}
      >
        <Editor
          height="100%"
          defaultLanguage="json"
          value={editorContent}
          theme={resolvedTheme === "dark" ? "convex-dark" : "convex-light"}
          options={editorOptions}
          beforeMount={handleEditorWillMount}
          onMount={handleEditorDidMount}
          onChange={handleEditorChange}
          loading={
            <div
              className="flex items-center justify-center h-full"
              style={{
                backgroundColor: "var(--color-background-base)",
              }}
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              <span
                className="ml-2 text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
                Loading editor...
              </span>
            </div>
          }
        />
      </div>

      {/* Infinite scroll trigger (hidden but functional) */}
      {hasMore && (
        <div
          ref={observerTarget}
          className="h-1"
          style={{ visibility: "hidden" }}
        >
          {isLoadingMore && <span>Loading more...</span>}
        </div>
      )}
    </div>
  );
}

export default RawView;
