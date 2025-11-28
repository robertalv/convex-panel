import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Plus, AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react';
import Editor, { BeforeMount, OnMount } from '@monaco-editor/react';
import { useThemeSafe } from '../../../hooks/useTheme';
import { insertDocuments } from '../../../utils/functions';
import { toast } from 'sonner';
import { TableSchema } from '../../../types';
import { UpgradePopup } from '../../../components/upgrade-popup';

export interface AddDocumentPanelProps {
  selectedTable: string;
  tableSchema?: TableSchema;
  componentId?: string | null;
  adminClient?: any;
  onClose: () => void;
  onDocumentAdded?: () => void;
  onToggleSchema?: () => void;
  isSchemaOpen?: boolean;
  onInsertField?: React.MutableRefObject<((fieldName: string) => void) | null>;
  onGetEditorContent?: React.MutableRefObject<(() => string) | null>;
}

const defaultDocumentTemplate = (tableName: string, tableSchema?: TableSchema) => {
  if (tableSchema && tableSchema.fields && tableSchema.fields.length > 0) {
    // Use actual field names from schema
    const fieldEntries = tableSchema.fields
      .filter(field => !field.fieldName.startsWith('_')) // Exclude system fields
      .slice(0, 5) // Limit to first 5 fields for readability
      .map(field => {
        const type = field.shape.type || 'any';
        let exampleValue: string;
        
        if (field.shape.tableName) {
          exampleValue = '""'; // Reference field
        } else if (type === 'number') {
          exampleValue = '0';
        } else if (type === 'boolean') {
          exampleValue = 'false';
        } else if (type === 'array') {
          exampleValue = '[]';
        } else if (type === 'object') {
          exampleValue = '{}';
        } else {
          exampleValue = '""';
        }
        
        return `    "${field.fieldName}": ${exampleValue}${field.optional ? '' : ''}`;
      });
    
    if (fieldEntries.length > 0) {
      return `[\n  {\n${fieldEntries.join(',\n')}\n  }\n]`;
    }
  }
  
  // Fallback template
  return `[
  {
    "exampleField": "example value",
    "anotherField": 123
  }
]`;
};

export const AddDocumentPanel: React.FC<AddDocumentPanelProps> = ({
  selectedTable,
  tableSchema,
  componentId,
  adminClient,
  onClose,
  onDocumentAdded,
  onToggleSchema,
  isSchemaOpen = false,
  onInsertField,
  onGetEditorContent,
}) => {
  const { theme } = useThemeSafe();
  const [code, setCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [monaco, setMonaco] = useState<Parameters<BeforeMount>[0]>();
  const editorRef = useRef<any>(null);

  // Initialize code with template
  useEffect(() => {
    if (selectedTable) {
      setCode(defaultDocumentTemplate(selectedTable, tableSchema));
      setError(null);
      setSuccess(false);
    }
  }, [selectedTable, tableSchema]);

  // Define Monaco theme
  const beforeMount: BeforeMount = (monacoInstance) => {
    setMonaco(monacoInstance);
    
    // Helper to get theme color from CSS variable
    const getThemeColor = (varName: string, fallback: string = '#0F1115') => {
      // Try to find an element with the theme class
      const themeElement = document.querySelector('.cp-theme-dark, .cp-theme-light') || document.documentElement;
      const color = getComputedStyle(themeElement).getPropertyValue(varName).trim();
      return color || fallback;
    };

    // Helper to convert hex to Monaco format (without #)
    const toMonacoColor = (hex: string) => hex.replace('#', '');

    // Define convex-dark theme
    monacoInstance.editor.defineTheme('convex-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: toMonacoColor(getThemeColor('--color-panel-text-muted', '#6b7280')), fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c084fc' },
        { token: 'string', foreground: 'fbbf24' },
        { token: 'number', foreground: 'fb923c' },
      ],
      colors: {
        'editor.background': getThemeColor('--color-panel-bg', '#0F1115'),
        'editor.foreground': getThemeColor('--color-panel-text', '#d1d5db'),
        'editor.lineHighlightBackground': 'transparent',
        'editor.lineHighlightBorder': 'transparent',
        'editor.currentLineBackground': 'transparent',
        'editor.currentLineBorder': 'transparent',
        'editor.selectionBackground': getThemeColor('--color-panel-active', 'rgba(255, 255, 255, 0.1)'),
        'editorCursor.foreground': getThemeColor('--color-panel-text', '#d1d5db'),
        'editorLineNumber.foreground': getThemeColor('--color-panel-text-muted', '#6b7280'),
        'editorLineNumber.activeForeground': getThemeColor('--color-panel-text', '#d1d5db'),
        'editorIndentGuide.background': getThemeColor('--color-panel-border', '#2D313A'),
        'editorIndentGuide.activeBackground': getThemeColor('--color-panel-text-muted', '#6b7280'),
        'editorWhitespace.foreground': getThemeColor('--color-panel-border', '#2D313A'),
        'editorError.foreground': getThemeColor('--color-panel-error', '#ef4444'),
        'editorWarning.foreground': getThemeColor('--color-panel-warning', '#eab308'),
      },
    });

    // Define convex-light theme
    monacoInstance.editor.defineTheme('convex-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: toMonacoColor(getThemeColor('--color-panel-text-muted', '#9ca3af')), fontStyle: 'italic' },
        { token: 'keyword', foreground: '7c3aed' },
        { token: 'string', foreground: 'd97706' },
        { token: 'number', foreground: 'ea580c' },
      ],
      colors: {
        'editor.background': getThemeColor('--color-panel-bg', '#ffffff'),
        'editor.foreground': getThemeColor('--color-panel-text', '#111827'),
        'editor.lineHighlightBackground': 'transparent',
        'editor.lineHighlightBorder': 'transparent',
        'editor.currentLineBackground': 'transparent',
        'editor.currentLineBorder': 'transparent',
        'editor.selectionBackground': getThemeColor('--color-panel-active', 'rgba(0, 0, 0, 0.1)'),
        'editorCursor.foreground': getThemeColor('--color-panel-text', '#111827'),
        'editorLineNumber.foreground': getThemeColor('--color-panel-text-muted', '#9ca3af'),
        'editorLineNumber.activeForeground': getThemeColor('--color-panel-text', '#111827'),
        'editorIndentGuide.background': getThemeColor('--color-panel-border', '#e5e7eb'),
        'editorIndentGuide.activeBackground': getThemeColor('--color-panel-text-muted', '#9ca3af'),
        'editorWhitespace.foreground': getThemeColor('--color-panel-border', '#e5e7eb'),
        'editorError.foreground': getThemeColor('--color-panel-error', '#ef4444'),
        'editorWarning.foreground': getThemeColor('--color-panel-warning', '#eab308'),
      },
    });

    const monacoTheme = theme === 'light' ? 'convex-light' : 'convex-dark';
    monacoInstance.editor.setTheme(monacoTheme);
  };

  // Update Monaco theme when theme changes
  useEffect(() => {
    if (monaco) {
      const monacoTheme = theme === 'light' ? 'convex-light' : 'convex-dark';
      monaco.editor.setTheme(monacoTheme);
    }
  }, [theme, monaco]);

  // Function to insert field name into editor
  const insertFieldName = useCallback((fieldName: string) => {
    if (!editorRef.current) return;
    
    const editor = editorRef.current;
    const selection = editor.getSelection();
    const model = editor.getModel();
    
    if (!model || !selection) return;
    
    // Get the full text and cursor position
    const lineNumber = selection.startLineNumber;
    const column = selection.startColumn;
    const lineText = model.getLineContent(lineNumber);
    const beforeCursor = lineText.substring(0, column - 1);
    const afterCursor = lineText.substring(column - 1);
    
    // Get field info for default value
    const field = tableSchema?.fields?.find(f => f.fieldName === fieldName);
    let defaultValue = '""';
    if (field) {
      const type = field.shape.type || 'any';
      if (type === 'number') {
        defaultValue = '0';
      } else if (type === 'boolean') {
        defaultValue = 'false';
      } else if (type === 'array') {
        defaultValue = '[]';
      } else if (type === 'object') {
        defaultValue = '{}';
      } else if (field.shape.tableName) {
        defaultValue = '""'; // Reference field
      }
    }
    
    // Determine what to insert based on context
    let textToInsert = '';
    let needsComma = false;
    
    // Check if we're inside an object (between { and })
    const textBefore = model.getValueInRange({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: lineNumber,
      endColumn: column,
    });
    
    // Count braces to see if we're in an object
    const openBraces = (textBefore.match(/\{/g) || []).length;
    const closeBraces = (textBefore.match(/\}/g) || []).length;
    const isInObject = openBraces > closeBraces;
    
    // Check if there's already content before cursor on this line (excluding whitespace)
    const hasContentBefore = beforeCursor.trim().length > 0 && !beforeCursor.trim().match(/^[\s\{\[\,]*$/);
    
    // Check if there's content after cursor that needs a comma
    const hasContentAfter = afterCursor.trim().length > 0 && !afterCursor.trim().match(/^[\s\]\}]*,?[\s\]\}]*$/);
    
    if (isInObject) {
      // We're inside an object, insert as key-value pair
      if (hasContentBefore && !beforeCursor.trim().endsWith(',') && !beforeCursor.trim().endsWith('{')) {
        // Need to add comma before
        textToInsert = `, "${fieldName}": ${defaultValue}`;
      } else {
        // No comma needed, or we're at the start
        textToInsert = `"${fieldName}": ${defaultValue}`;
      }
      
      // Add comma after if there's more content
      if (hasContentAfter && !afterCursor.trim().startsWith(',')) {
        textToInsert += ',';
      }
    } else {
      // Not in an object, just insert the field name as a string
      if (hasContentBefore && !beforeCursor.trim().endsWith(',') && !beforeCursor.trim().endsWith('[')) {
        textToInsert = `, "${fieldName}"`;
      } else {
        textToInsert = `"${fieldName}"`;
      }
      
      if (hasContentAfter && !afterCursor.trim().startsWith(',')) {
        textToInsert += ',';
      }
    }
    
    // Insert the text
    editor.executeEdits('insert-field', [{
      range: selection,
      text: textToInsert,
    }]);
    
    // Move cursor after inserted text
    const newPosition = {
      lineNumber: lineNumber,
      column: column + textToInsert.length,
    };
    editor.setPosition(newPosition);
    editor.focus();
  }, [tableSchema]);

  // Function to get current editor content
  const getEditorContent = useCallback(() => {
    if (!editorRef.current) return '';
    const model = editorRef.current.getModel();
    return model ? model.getValue() : '';
  }, []);

  // Expose insert function and get content function to parent via ref
  useEffect(() => {
    if (onInsertField) {
      onInsertField.current = insertFieldName;
    }
    if (onGetEditorContent) {
      onGetEditorContent.current = getEditorContent;
    }
    return () => {
      if (onInsertField) {
        onInsertField.current = null;
      }
      if (onGetEditorContent) {
        onGetEditorContent.current = null;
      }
    };
  }, [insertFieldName, onInsertField, getEditorContent, onGetEditorContent]);

  const onMount: OnMount = (editor) => {
    editorRef.current = editor;
    
    // Disable error squiggles for JSON (we'll validate on submit)
    const monaco = editor.getModel()?.getLanguageId();
    if (monaco) {
      // Remove all diagnostics/markers
      editor.deltaDecorations([], []);
    }
    
    // Disable line highlight by updating editor options
    editor.updateOptions({
      renderLineHighlight: 'none',
      hideCursorInOverviewRuler: true,
      overviewRulerLanes: 0,
    });
    
    // Force disable line highlight via CSS if needed
    const editorElement = editor.getContainerDomNode();
    if (editorElement) {
      const style = document.createElement('style');
      style.textContent = `
        .monaco-editor .current-line {
          background: transparent !important;
          border: none !important;
        }
        .monaco-editor .view-line {
          background: transparent !important;
        }
      `;
      editorElement.appendChild(style);
    }
    
    // Focus the editor
    editor.focus();
  };

  const handleSubmit = useCallback(async () => {
    if (!adminClient || !code.trim()) {
      setError('Admin client is not available or document is empty');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // Parse JSON
      let documents: any[];
      try {
        const parsed = JSON.parse(code);
        documents = Array.isArray(parsed) ? parsed : [parsed];
      } catch (parseError) {
        setError('Invalid JSON. Please check your syntax.');
        setIsSubmitting(false);
        return;
      }

      // Validate documents
      if (documents.length === 0) {
        setError('At least one document is required.');
        setIsSubmitting(false);
        return;
      }

      // Remove _id and _creationTime if present (these are system fields)
      documents = documents.map(doc => {
        const { _id, _creationTime, ...rest } = doc;
        return rest;
      });

      // Insert documents
      await insertDocuments(selectedTable, documents, adminClient, componentId || null);

      setSuccess(true);
      toast.success(`Successfully added ${documents.length} document${documents.length > 1 ? 's' : ''} to ${selectedTable}`);
      
      // Reset form after a short delay
      setTimeout(() => {
        setCode(defaultDocumentTemplate(selectedTable, tableSchema));
        setSuccess(false);
        if (onDocumentAdded) {
          onDocumentAdded();
        }
      }, 1500);
    } catch (err: any) {
      // Check if this is an upgrade required error
      if (err?.isUpgradeError || err?.code === 'UPGRADE_REQUIRED' || 
          (err?.message && err.message.includes('unavailable on your plan'))) {
        setShowUpgradePopup(true);
        setError(null);
      } else {
        const errorMessage = err?.message || 'Failed to insert documents';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [adminClient, code, selectedTable, componentId, onDocumentAdded]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--color-panel-bg)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--color-panel-border)',
          backgroundColor: 'var(--color-panel-bg-secondary)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h2
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--color-panel-text)',
              margin: 0,
              lineHeight: '20px',
            }}
          >
            Add new documents to {selectedTable}
          </h2>
          <a
            href="https://docs.convex.dev/database/writing-data"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '12px',
              color: 'var(--color-panel-accent)',
              textDecoration: 'none',
              lineHeight: '16px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            Learn more about editing documents.
          </a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {tableSchema && tableSchema.fields && tableSchema.fields.length > 0 && onToggleSchema && (
            <button
              onClick={onToggleSchema}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-panel-border)',
                background: isSchemaOpen
                  ? 'var(--color-panel-bg-tertiary)'
                  : 'transparent',
                color: isSchemaOpen
                  ? 'var(--color-panel-text)'
                  : 'var(--color-panel-text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isSchemaOpen) {
                  e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                  e.currentTarget.style.color = 'var(--color-panel-text)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSchemaOpen) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
                }
              }}
            >
              <Info size={14} />
              <span>Schema</span>
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: 'var(--color-panel-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-panel-text)';
              e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            flex: 1,
            borderBottom: '1px solid var(--color-panel-border)',
          }}
        >
          <Editor
            height="100%"
            language="json"
            value={code}
            onChange={(value) => {
              setCode(value || '');
              setError(null);
              setSuccess(false);
            }}
            theme={theme === 'light' ? 'convex-light' : 'convex-dark'}
            beforeMount={beforeMount}
            onMount={onMount}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              formatOnPaste: true,
              formatOnType: true,
              readOnly: false,
              domReadOnly: false,
              contextmenu: true,
              automaticLayout: true,
              renderWhitespace: 'none',
              glyphMargin: false,
              folding: false,
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 3,
              padding: { top: 16, bottom: 16 },
              renderLineHighlight: 'none',
              hideCursorInOverviewRuler: true,
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid var(--color-panel-border)',
          backgroundColor: 'var(--color-panel-bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Error/Success Messages */}
        {error && (
          <div
            style={{
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: 'color-mix(in srgb, var(--color-panel-error) 10%, transparent)',
              border: '1px solid var(--color-panel-error)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--color-panel-error)',
              fontSize: '12px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            style={{
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: 'color-mix(in srgb, var(--color-panel-success) 10%, transparent)',
              border: '1px solid var(--color-panel-success)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--color-panel-success)',
              fontSize: '12px',
            }}
          >
            <CheckCircle2 size={16} />
            <span>Documents added successfully!</span>
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid var(--color-panel-border)',
              background: 'var(--color-panel-bg-tertiary)',
              color: 'var(--color-panel-text)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
            }}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !code.trim()}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: isSubmitting || !code.trim()
                ? 'var(--color-panel-bg-tertiary)'
                : 'var(--color-panel-accent)',
              color: isSubmitting || !code.trim()
                ? 'var(--color-panel-text-muted)'
                : 'var(--color-panel-bg)',
              cursor: isSubmitting || !code.trim() ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: isSubmitting || !code.trim()
                ? 'none'
                : '0 2px 8px color-mix(in srgb, var(--color-panel-accent) 20%, transparent)',
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting && code.trim()) {
                e.currentTarget.style.background = 'var(--color-panel-accent-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting && code.trim()) {
                e.currentTarget.style.background = 'var(--color-panel-accent)';
              }
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <Plus size={14} />
                <span>Add Documents</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      {/* Upgrade Popup */}
      <UpgradePopup
        isOpen={showUpgradePopup}
        onClose={() => setShowUpgradePopup(false)}
      />
    </div>
  );
};

