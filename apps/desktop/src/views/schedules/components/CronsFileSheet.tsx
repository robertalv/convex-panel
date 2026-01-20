/**
 * CronsFileSheet
 * Sheet component for viewing crons.js/crons.ts source code
 */

import { useState, useCallback, useEffect } from "react";
import { Copy, Check, AlertCircle } from "lucide-react";
import Editor, { type BeforeMount } from "@monaco-editor/react";
import { ResizableSheet } from "@/views/data/components/ResizableSheet";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/theme-context";
import { useDeployment } from "@/contexts/deployment-context";
import { toast } from "sonner";
import { fetchSourceCode } from "@convex-panel/shared/api";

interface CronsFileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cronsModulePath: string | null;
}

// Monaco editor options for code display (read-only)
const editorOptions = {
  readOnly: true,
  automaticLayout: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbers: "on" as const,
  lineNumbersMinChars: 3,
  lineDecorationsWidth: 0,
  overviewRulerBorder: false,
  renderLineHighlight: "none" as const,
  fontSize: 12,
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  tabSize: 2,
  wordWrap: "on" as const,
  folding: true,
  scrollbar: {
    vertical: "auto" as const,
    horizontal: "auto" as const,
    verticalScrollbarSize: 8,
    horizontalScrollbarSize: 8,
  },
  padding: { top: 12, bottom: 12 },
};

export function CronsFileSheet({
  isOpen,
  onClose,
  cronsModulePath,
}: CronsFileSheetProps) {
  const [sourceCode, setSourceCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { resolvedTheme } = useTheme();
  const { deploymentUrl, authToken } = useDeployment();

  // Fetch source code when sheet opens
  useEffect(() => {
    if (!isOpen || !cronsModulePath || !deploymentUrl || !authToken) {
      return;
    }

    const loadSourceCode = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const code = await fetchSourceCode(
          deploymentUrl,
          authToken,
          cronsModulePath,
          null, // No componentId for now
        );

        if (code) {
          setSourceCode(code);
        } else {
          setError(
            "Unable to display source code. Source maps may not be included in this deployment.",
          );
        }
      } catch (err: any) {
        console.error("Failed to fetch crons source code:", err);
        setError(err.message || "Failed to load source code");
      } finally {
        setIsLoading(false);
      }
    };

    loadSourceCode();
  }, [isOpen, cronsModulePath, deploymentUrl, authToken]);

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

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(sourceCode);
      toast.success("Source code copied to clipboard");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy source code");
    }
  }, [sourceCode]);

  if (!isOpen || !cronsModulePath) return null;

  // Determine language from file extension
  const language = cronsModulePath.endsWith(".ts")
    ? "typescript"
    : "javascript";

  return (
    <div className="absolute right-0 top-0 bottom-0 z-50">
      <ResizableSheet
        id="crons-file"
        title="Crons File"
        subtitle={cronsModulePath}
        onClose={onClose}
        side="right"
        defaultWidth={700}
        minWidth={500}
        maxWidth={1200}
        headerActions={
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={!sourceCode || isLoading}
          >
            {copied ? (
              <>
                <Check size={14} />
                Copied
              </>
            ) : (
              <>
                <Copy size={14} />
                Copy
              </>
            )}
          </Button>
        }
      >
        <div className="flex h-full flex-col overflow-hidden">
          {/* Loading State */}
          {isLoading && (
            <div className="flex-1 flex items-center justify-center bg-surface-base">
              <div className="text-sm text-text-muted">
                Loading source code...
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center bg-surface-base p-8 text-center">
              <AlertCircle size={48} className="text-error-base mb-4" />
              <div className="text-sm text-error-base font-medium mb-2">
                Failed to Load Source Code
              </div>
              <div className="text-xs text-text-muted">{error}</div>
            </div>
          )}

          {/* Code Editor */}
          {!isLoading && !error && sourceCode && (
            <div
              className="flex-1 overflow-hidden"
              style={{ backgroundColor: "var(--color-surface-base)" }}
            >
              <Editor
                height="100%"
                language={language}
                value={sourceCode}
                theme={
                  resolvedTheme === "dark" ? "convex-dark" : "convex-light"
                }
                options={editorOptions}
                beforeMount={handleEditorWillMount}
                loading={
                  <div
                    className="flex items-center justify-center h-full"
                    style={{
                      backgroundColor: "var(--color-surface-raised)",
                    }}
                  >
                    <span
                      className="text-xs"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Loading editor...
                    </span>
                  </div>
                }
              />
            </div>
          )}
        </div>
      </ResizableSheet>
    </div>
  );
}
