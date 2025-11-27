import React, { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { FunctionResult as FunctionResultType } from '../../../utils/functionExecution';

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
  const [copied, setCopied] = useState(false);

  const resultString = useMemo(() => {
    if (!result) return '';
    if (result.success) {
      return JSON.stringify(result.value, null, 2);
    }
    return result.errorMessage || 'Unknown error';
  }, [result]);

  const handleCopy = async () => {
    if (resultString) {
      try {
        await navigator.clipboard.writeText(resultString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const duration = lastRequestTiming
    ? lastRequestTiming.endedAt - lastRequestTiming.startedAt
    : null;

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
              <div style={{ color: '#eab308' }}>
                {resultString}
              </div>
            ) : (
              <div
                style={{
                  border: '1px solid #ef4444',
                  borderRadius: '4px',
                  padding: '12px',
                  color: '#ef4444',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
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

