import React, { useState, useMemo, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Editor, { BeforeMount, OnMount } from '@monaco-editor/react';
import { FunctionResult as FunctionResultType } from '../../../utils/functionExecution';
import { copyToClipboard } from '../../../utils/toast';
import { useThemeSafe } from '../../../hooks/useTheme';

interface ResultProps {
  result?: FunctionResultType;
  loading?: boolean;
  lastRequestTiming?: {
    startedAt: number;
    endedAt: number;
  };
  requestFilter?: any;
  startCursor?: number;
}

export const Result: React.FC<ResultProps> = ({
  result,
  loading = false,
  lastRequestTiming,
  requestFilter,
  startCursor,
}) => {
  const { theme } = useThemeSafe();
  const [monaco, setMonaco] = useState<Parameters<BeforeMount>[0]>();
  
  const resultString = useMemo(() => {
    if (!result) return '';
    if (result.success) {
      return JSON.stringify(result.value, null, 2);
    }
    return result.errorMessage || 'Unknown error';
  }, [result]);

  const handleCopy = async () => {
    if (resultString) {
      await copyToClipboard(resultString);
    }
  };

  const duration = lastRequestTiming
    ? lastRequestTiming.endedAt - lastRequestTiming.startedAt
    : null;

  const handleEditorWillMount: BeforeMount = (monacoInstance) => {
    setMonaco(monacoInstance);

    const getThemeColor = (varName: string, fallback: string = '#0F1115') => {
      const themeElement = document.querySelector('.cp-theme-dark, .cp-theme-light') || document.documentElement;
      const color = getComputedStyle(themeElement).getPropertyValue(varName).trim();
      return color || fallback;
    };

    const toMonacoColor = (hex: string) => hex.replace('#', '');

    try {
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
          'editor.background': '#00000000',
          'editor.foreground': getThemeColor('--color-panel-text', '#d1d5db'),
          'editor.lineHighlightBackground': '#00000000',
          'editor.selectionBackground': getThemeColor('--color-panel-active', 'rgba(255, 255, 255, 0.1)'),
          'editorCursor.foreground': getThemeColor('--color-panel-text', '#d1d5db'),
        },
      });
    } catch {
      // Theme already defined
    }

    try {
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
          'editor.background': '#00000000',
          'editor.foreground': getThemeColor('--color-panel-text', '#111827'),
          'editor.lineHighlightBackground': '#00000000',
          'editor.selectionBackground': getThemeColor('--color-panel-active', 'rgba(0, 0, 0, 0.1)'),
          'editorCursor.foreground': getThemeColor('--color-panel-text', '#111827'),
        },
      });
    } catch {
      // Theme already defined
    }
  };

  useEffect(() => {
    if (monaco) {
      const monacoTheme = theme === 'light' ? 'convex-light' : 'convex-dark';
      monaco.editor.setTheme(monacoTheme);
    }
  }, [theme, monaco]);

  const monacoTheme = theme === 'light' ? 'convex-light' : 'convex-dark';

  const editorHeight = useMemo(() => {
    if (!resultString) return 200;
    const lineCount = resultString.split('\n').length;
    const calculatedHeight = Math.max(200, Math.min(600, lineCount * 20 + 40));
    return calculatedHeight;
  }, [resultString]);

  return (
    <div
      style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px',
        fontFamily: 'monospace',
        fontSize: '14px',
      }}
    >
        {!result && !loading ? (
          <div
            style={{
              color: '#6b7280',
              fontSize: '14px',
              fontStyle: 'italic',
            }}
          >
            Run this function to produce a result.
          </div>
        ) : loading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#9ca3af',
              fontSize: '14px',
            }}
          >
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Running function...</span>
          </div>
        ) : result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Log Lines */}
            {result.logLines && result.logLines.length > 0 && (
              <>
                {result.logLines.map((log, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#d1d5db',
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: '#6b7280',
                        color: '#fff',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 500,
                        textTransform: 'lowercase',
                      }}
                    >
                      {log.level === 'error' ? 'error' : 'log'}
                    </span>
                    <span style={{ color: log.level === 'error' ? '#ef4444' : '#d1d5db' }}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </>
            )}

            {/* Result Value */}
            {result.success ? (
              <div
                style={{
                  overflow: 'hidden',
                  height: `${editorHeight}px`,
                }}
              >
                <Editor
                  height={`${editorHeight}px`}
                  language="json"
                  theme={monacoTheme}
                  value={resultString}
                  beforeMount={handleEditorWillMount}
                  options={{
                    automaticLayout: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 13,
                    fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                    lineNumbers: 'off',
                    lineNumbersMinChars: 0,
                    scrollbar: {
                      horizontalScrollbarSize: 8,
                      verticalScrollbarSize: 8,
                    },
                    wordWrap: 'on',
                    tabSize: 2,
                    readOnly: true,
                    domReadOnly: true,
                    contextmenu: true,
                    selectOnLineNumbers: false,
                    glyphMargin: false,
                    folding: true,
                    lineDecorationsWidth: 0,
                    renderWhitespace: 'selection',
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                  fontSize: '13px',
                  lineHeight: '1.6',
                }}
              >
                {resultString}
              </div>
            )}
          </div>
        ) : null}
    </div>
  );
};

