import React, { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import Editor from '../editor/lazy-editor';
import type { FunctionResult as FunctionResultType } from '../../utils/api/functionExecution';
import { useThemeSafe } from '../../hooks/useTheme';
import { getConvexPanelTheme } from '../editor/editor-theme';

interface ResultProps {
  result?: FunctionResultType;
  loading?: boolean;
}

export const Result: React.FC<ResultProps> = ({
  result,
  loading = false,
}) => {
  const { theme } = useThemeSafe();
  
  const resultString = useMemo(() => {
    if (!result) return '';
    if (result.success) {
      return JSON.stringify(result.value, null, 2);
    }
    return result.errorMessage || 'Unknown error';
  }, [result]);

  const hasLogs = !!(result?.logLines && result.logLines.length > 0);

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '16px',
        gap: '12px',
        fontFamily: 'monospace',
        fontSize: '14px',
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
        {!result && !loading ? (
          <div
            style={{
              fontSize: '12px',
              color: 'var(--color-panel-text-muted)',
              fontStyle: 'italic',
              fontFamily: 'monospace',
              padding: '16px',
            }}
          >
            Run this function to produce a result.
          </div>
        ) : loading ? (
          <div
            style={{
              fontSize: '12px',
              color: 'var(--color-panel-text-muted)',
              fontStyle: 'italic',
              fontFamily: 'monospace',
              padding: '16px',
            }}
          >
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Running function...</span>
          </div>
        ) : result ? (
          <>
            {/* Log Lines */}
            {hasLogs && (
              <div
                style={{
                  flexShrink: 0,
                  maxHeight: '35%',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  paddingRight: '8px',
                }}
              >
                {result.logLines!.map((log, index) => (
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
              </div>
            )}

            {/* Result Value */}
            {result.success ? (
              <div style={{ flex: 1, minHeight: 0 }}>
                <Editor
                  height="100%"
                  language="json"
                  theme={getConvexPanelTheme(theme)}
                  value={resultString}
                  options={{
                    scrollBeyondLastLine: false,
                    fontSize: 13,
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
                    glyphMargin: false,
                    folding: true,
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
          </>
        ) : null}
    </div>
  );
};

