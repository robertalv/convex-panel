/**
 * SchemaCodeViewer Component
 * Read-only Monaco editor for displaying schema code
 * Based on RawView but simplified for read-only display
 */

import { useCallback } from "react";
import Editor, { type BeforeMount } from "@monaco-editor/react";
import { useTheme } from "@/contexts/theme-context";
import { Loader2 } from "lucide-react";

export interface SchemaCodeViewerProps {
  /** Code content to display */
  content: string;
  /** Language for syntax highlighting */
  language?: string;
  /** Whether to show line numbers */
  showLineNumbers?: boolean;
}

// Monaco editor options for read-only display
const editorOptions = {
  readOnly: true,
  automaticLayout: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbers: "on" as const,
  lineNumbersMinChars: 4,
  lineDecorationsWidth: 0,
  overviewRulerBorder: false,
  contextmenu: false,
  bracketPairColorization: { enabled: true },
  guides: { bracketPairs: true, indentation: true },
  renderLineHighlight: "none" as const,
  fontSize: 13,
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  tabSize: 2,
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

export function SchemaCodeViewer({
  content,
  language = "typescript",
  showLineNumbers = true,
}: SchemaCodeViewerProps) {
  const { resolvedTheme } = useTheme();

  // Configure Monaco themes before mount
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

  return (
    <div
      className="flex-1 min-h-0 overflow-hidden h-full"
      style={{ backgroundColor: "var(--color-background-base)" }}
    >
      <Editor
        height="100%"
        defaultLanguage={language}
        value={content}
        theme={resolvedTheme === "dark" ? "convex-dark" : "convex-light"}
        options={{
          ...editorOptions,
          lineNumbers: showLineNumbers ? "on" : "off",
        }}
        beforeMount={handleEditorWillMount}
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
  );
}

export default SchemaCodeViewer;
