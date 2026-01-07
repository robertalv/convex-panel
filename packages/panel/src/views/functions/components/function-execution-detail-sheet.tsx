import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Sheet } from '../../../components/shared/sheet';
import type { FunctionExecutionLog } from '../../../types';
import { Card } from '../../../components/shared/card';
import { X, Info, Copy, ChevronUp, ChevronDown, AlertCircle, CheckCircle2, XCircle, Loader2, Lightbulb, Sparkles } from 'lucide-react';
import { TooltipAction } from '../../../components/shared/tooltip-action';
import { analyzeError, getErrorAnalysis, suggestFix, type ErrorAnalysis, type FixSuggestion } from '../../../utils/api/aiAnalysis';
import { handleCopyAIPrompt } from '../../../utils/aiPrompt';

interface FunctionExecutionDetailSheetProps {
  log: FunctionExecutionLog | null;
  isOpen: boolean;
  onClose: () => void;
  container?: HTMLElement | null;
  adminClient?: any;
}

type DetailTab = 'execution' | 'request' | 'functions' | 'analysis';

const formatDateTime = (timestamp: number) => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const formatTimestampWithRelative = (timestamp: number) => {
  if (!timestamp) return { absolute: 'N/A', relative: '' };
  const date = new Date(timestamp);
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
  const absolute = `${month} ${day}, ${hours}:${minutes}:${seconds}.${milliseconds}`;
  
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const relative = diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  
  return { absolute, relative };
};

const formatCompute = (memoryMb?: number, durationMs?: number) => {
  if (!memoryMb || !durationMs) return '0.0000000 GB-hr (0 MB for 0s)';
  const memoryGb = memoryMb / 1024;
  const durationHours = durationMs / (1000 * 60 * 60);
  const gbHours = memoryGb * durationHours;
  const durationSeconds = durationMs / 1000;
  return `${gbHours.toFixed(7)} GB-hr (${memoryMb} MB for ${durationSeconds.toFixed(2)}s)`;
};

const formatBytes = (bytes?: number) => {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
};

const formatDuration = (ms: number) => {
  if (!ms || ms <= 0) return '0ms';
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  const seconds = ms / 1000;
  return `${seconds.toFixed(2)}s`;
};

export const FunctionExecutionDetailSheet: React.FC<FunctionExecutionDetailSheetProps> = ({
  log,
  isOpen,
  onClose,
  container: propContainer,
  adminClient,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('execution');
  const [resourcesExpanded, setResourcesExpanded] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<ErrorAnalysis | null>(null);
  const [fixSuggestion, setFixSuggestion] = useState<FixSuggestion | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showAnalysisTab, setShowAnalysisTab] = useState(false);
  const [, setStreamingAnalysis] = useState<Partial<ErrorAnalysis> | null>(null);
  const [streamingText, setStreamingText] = useState<{ rootCause?: string; suggestions?: string[] }>({});
  const container = propContainer || null;
  const hasLoadedAnalysisRef = useRef(false);

  // Extract log properties safely (hooks must be called before early return)
  const logLines = log?.logLines;
  const requestId = log?.requestId;
  const functionIdentifier = log?.functionIdentifier;
  const startedAt = log?.startedAt;
  const error = log?.error;
  const success = log?.success;

  // Memoize logLines processing to avoid recreating on every render
  const processedLogLines = useMemo(() => {
    if (!logLines) return [];
    return logLines.map((l: any) => typeof l === 'string' ? l : JSON.stringify(l));
  }, [logLines]);

  const hasError = log ? (!success || error) : false;

  // Reset the ref when requestId changes (different execution selected)
  useEffect(() => {
    if (!log) return;
    hasLoadedAnalysisRef.current = false;
    setAiAnalysis(null);
    setFixSuggestion(null);
    setAnalysisError(null);
    setShowAnalysisTab(false);
    setStreamingAnalysis(null);
    setStreamingText({});
  }, [requestId, log]);

  // Load existing analysis if available
  useEffect(() => {
    if (!log || !hasError || !adminClient || !requestId) return;
    // Only load once per requestId to avoid infinite loops
    if (!hasLoadedAnalysisRef.current) {
      hasLoadedAnalysisRef.current = true;
      getErrorAnalysis(adminClient, requestId)
        .then((analysis) => {
          if (analysis) {
            setAiAnalysis(analysis);
            setShowAnalysisTab(true); // Show the analysis tab if analysis exists
            setActiveTab('analysis'); // Automatically switch to analysis tab
            // Get fix suggestion if we have analysis
            if (analysis.rootCause) {
              suggestFix(adminClient, {
                errorMessage: error || '',
                functionPath: functionIdentifier || '',
                timestamp: startedAt || 0,
                stackTrace: undefined, // FunctionExecutionLog doesn't have stackTrace
                logLines: processedLogLines,
                rootCause: analysis.rootCause,
                severity: analysis.severity,
              })
                .then(setFixSuggestion)
                .catch(() => {
                  // Ignore errors getting fix suggestion
                });
            }
          }
        })
        .catch(() => {
          // Ignore errors loading analysis
        });
    }
  }, [hasError, adminClient, requestId, error, functionIdentifier, startedAt, processedLogLines, log]);

  // Fallback: Show analysis tab if aiAnalysis exists (in case the above effect didn't run)
  useEffect(() => {
    if (aiAnalysis && !showAnalysisTab) {
      setShowAnalysisTab(true);
    }
  }, [aiAnalysis, showAnalysisTab]);

  // Stream text word by word - MUST be called before early return (Rules of Hooks)
  const streamText = useCallback(async (text: string, updateFn: (text: string) => void) => {
    const words = text.split(' ');
    let currentText = '';

    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? ' ' : '') + words[i];
      updateFn(currentText);
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 30 + 20));
    }
  }, []);

  if (!isOpen || !log) {
    return null;
  }

  const {
    executionId,
    udfType,
    completedAt,
    durationMs,
    environment,
    usageStats,
    caller,
    identityType,
    returnBytes,
  } = log;

  const timestampInfo = formatTimestampWithRelative(startedAt ?? 0);

  const handleAnalyzeWithAI = async () => {
    if (!adminClient || !hasError) return;

    // Immediately show analysis tab and start analysis
    setShowAnalysisTab(true);
    setActiveTab('analysis');
    setIsAnalyzing(true);
    setAnalysisError(null);
    setStreamingText({});
    setStreamingAnalysis({ errorId: requestId || `error-${startedAt ?? Date.now()}` });

    try {
      const errorId = requestId || `error-${startedAt ?? Date.now()}`;
      
      // Start analysis - this will stream results as they come in
      const analysis = await analyzeError(adminClient, {
        errorId,
        errorMessage: error || 'Unknown error',
        functionPath: functionIdentifier || '',
        timestamp: startedAt ?? Date.now(),
        stackTrace: undefined,
        logLines: processedLogLines,
      });

      // Stream the root cause
      if (analysis.rootCause) {
        await streamText(analysis.rootCause, (text) => {
          setStreamingText((prev) => ({ ...prev, rootCause: text }));
        });
      }

      // Stream suggestions one by one
      if (analysis.suggestions && analysis.suggestions.length > 0) {
        const streamedSuggestions: string[] = [];
        for (let idx = 0; idx < analysis.suggestions.length; idx++) {
          const suggestion = analysis.suggestions[idx];
          await streamText(suggestion, (text) => {
            const updated = [...streamedSuggestions];
            updated[idx] = text;
            setStreamingText((prev) => ({ ...prev, suggestions: updated }));
          });
          streamedSuggestions[idx] = suggestion; // Ensure full text is stored
        }
      }

      // Update with full analysis result after streaming
      setAiAnalysis(analysis);
      setStreamingAnalysis(null);
      setStreamingText({});

      // Get fix suggestion
      if (analysis.rootCause) {
        try {
          const suggestion = await suggestFix(adminClient, {
                errorMessage: error || '',
                functionPath: functionIdentifier || '',
                timestamp: startedAt ?? 0,
            stackTrace: undefined,
            logLines: processedLogLines,
            rootCause: analysis.rootCause,
            severity: analysis.severity,
          });
          setFixSuggestion(suggestion);
        } catch (err) {
          console.error('Failed to get fix suggestion:', err);
        }
      }
    } catch (err: any) {
      setAnalysisError(err?.message || 'Failed to analyze error');
      setStreamingAnalysis(null);
      setStreamingText({});
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sheetContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0px 12px',
          borderBottom: '1px solid var(--color-panel-border)',
          backgroundColor: 'var(--color-panel-bg-secondary)',
          height: '40px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-panel-text-secondary)' }}>
              {timestampInfo.absolute}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--color-panel-text-muted)' }}>
              ({timestampInfo.relative})
            </span>
            {hasError && (
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--color-panel-error)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <AlertCircle size={14} />
                failure
              </span>
            )}
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '6px',
            color: 'var(--color-panel-text-secondary)',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-panel-text)';
            e.currentTarget.style.backgroundColor = 'var(--color-panel-border)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <X size={18} />
        </button>
      </div>

      {hasError && error && (
        <div
          style={{
            margin: '16px',
            padding: '12px',
            backgroundColor: 'var(--color-background-error)',
            border: '1px solid var(--color-border-error)',
            borderRadius: '6px',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-content-error)',
              }}
            >
              Error
            </div>
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--color-content-error)',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {error}
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(error);
            }}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              border: 'none',
              background: 'transparent',
              color: 'var(--color-content-error)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Copy error"
          >
            <Copy size={14} />
          </button>
        </div>
      )}


      {logLines && logLines.length > 0 && (() => {
        const nonEmptyLogLines = logLines.filter((line: string) => {
          if (typeof line === 'string') {
            return line.trim().length > 0;
          }
          return true;
        });

        if (nonEmptyLogLines.length === 0) return null;

        const allLogContent = nonEmptyLogLines
          .map((line: string) => {
            const logContent = typeof line === 'string' 
              ? line.trim()
              : JSON.stringify(line, null, 2);
            return logContent || '';
          })
          .filter(content => content.length > 0)
          .join('\n');

        return (
          <div
            style={{
              margin: '16px',
              padding: '12px',
              backgroundColor: 'var(--color-panel-bg-tertiary)',
              border: '1px solid var(--color-panel-border)',
              borderRadius: '6px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--color-panel-text)',
                }}
              >
                Log Message
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(allLogContent);
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--color-panel-text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '4px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-panel-text)';
                  e.currentTarget.style.backgroundColor = 'var(--color-panel-border)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-panel-text-muted)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Copy log message"
              >
                <Copy size={14} />
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                maxHeight: '400px',
                overflowY: 'auto',
              }}
            >
              {nonEmptyLogLines.map((line: string, index: number) => {
                const logContent = typeof line === 'string' 
                  ? line.trim()
                  : JSON.stringify(line, null, 2);
                
                if (!logContent || logContent.length === 0) return null;

                return (
                  <div
                    key={index}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'var(--color-panel-bg-tertiary)',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      color: 'var(--color-panel-text-secondary)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      position: 'relative',
                    }}
                  >
                    {logContent}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div
        style={{
          borderBottom: '1px solid var(--color-panel-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex' }}>
          {(['execution', 'request', 'functions'] as DetailTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 16px',
                fontSize: 12,
                fontWeight: 500,
                border: 'none',
                borderBottom:
                  activeTab === tab
                    ? '2px solid var(--color-panel-accent)'
                    : '2px solid transparent',
                backgroundColor: 'transparent',
                color:
                  activeTab === tab
                    ? 'var(--color-panel-text)'
                    : 'var(--color-panel-text-muted)',
                cursor: 'pointer',
              }}
            >
              {tab === 'execution'
                ? 'Execution'
                : tab === 'request'
                ? 'Request'
                : 'Functions Called'}
            </button>
          ))}
          {showAnalysisTab && (
            <button
              onClick={() => setActiveTab('analysis')}
              style={{
                padding: '10px 16px',
                fontSize: 12,
                fontWeight: 500,
                border: 'none',
                borderBottom:
                  activeTab === 'analysis'
                    ? '2px solid var(--color-panel-accent)'
                    : '2px solid transparent',
                backgroundColor: 'transparent',
                color:
                  activeTab === 'analysis'
                    ? 'var(--color-panel-text)'
                    : 'var(--color-panel-text-muted)',
                cursor: 'pointer',
              }}
            >
              Analysis
            </button>
          )}
        </div>
        {hasError && adminClient && !showAnalysisTab && (
          <button
            onClick={handleAnalyzeWithAI}
            disabled={isAnalyzing}
            style={{
              padding: '6px 12px',
              marginRight: '12px',
              fontSize: 11,
              fontWeight: 500,
              border: 'none',
              borderRadius: '8px',
              backgroundColor: 'var(--color-panel-bg-secondary)',
              color: 'var(--color-panel-text)',
              cursor: isAnalyzing ? 'not-allowed' : 'pointer',
              opacity: isAnalyzing ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isAnalyzing) {
                e.currentTarget.style.backgroundColor = 'var(--color-panel-border)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isAnalyzing) {
                e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-secondary)';
              }
            }}
            title="Analyze with AI"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Analyze
              </>
            )}
          </button>
        )}
      </div>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 16,
        }}
      >
        {activeTab === 'execution' && (
          <Card>
            <div style={{ fontSize: 12 }}>
              <div
                style={{
                  marginBottom: 12,
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr',
                  rowGap: 6,
                }}
              >
                <span style={{ color: 'var(--color-panel-text-muted)' }}>
                  Execution ID
                </span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    color: 'var(--color-panel-text-secondary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: 200,
                    display: 'inline-block',
                  }}
                  title={executionId}
                >
                  {executionId}
                </span>

                <span style={{ color: 'var(--color-panel-text-muted)' }}>
                  Function
                </span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    color: 'var(--color-panel-text-secondary)',
                  }}
                >
                  {functionIdentifier}
                </span>

                <span style={{ color: 'var(--color-panel-text-muted)' }}>
                  Type
                </span>
                <span
                  style={{
                    textTransform: 'capitalize',
                    color: 'var(--color-panel-text-secondary)',
                  }}
                >
                  {udfType.charAt(0).toUpperCase() + udfType.slice(1)}
                </span>

                <span style={{ color: 'var(--color-panel-text-muted)' }}>
                  Started at
                </span>
                <span style={{ color: 'var(--color-panel-text-secondary)' }}>
                  {formatDateTime(startedAt ?? 0)}
                </span>

                <span style={{ color: 'var(--color-panel-text-muted)' }}>
                  Completed at
                </span>
                <span style={{ color: 'var(--color-panel-text-secondary)' }}>
                  {formatDateTime(completedAt)}
                </span>

                <span style={{ color: 'var(--color-panel-text-muted)' }}>
                  Duration
                </span>
                <span style={{ color: 'var(--color-panel-text-secondary)' }}>
                  {formatDuration(durationMs ?? 0)}
                </span>

                <span style={{ color: 'var(--color-panel-text-muted)' }}>
                  Environment
                </span>
                <span style={{ color: 'var(--color-panel-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {environment || 'Convex'}
                  <TooltipAction
                    icon={<Info size={12} style={{ color: 'var(--color-panel-text-muted)' }} />}
                    text="The runtime environment where this function executed"
                  />
                </span>
              </div>

              <div
                style={{
                  marginTop: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    color: 'var(--color-panel-text)',
                  }}
                >
                  Resources Used
                </div>
                <button
                  onClick={() => setResourcesExpanded(!resourcesExpanded)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--color-panel-text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {resourcesExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {resourcesExpanded && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    fontSize: 12,
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: 'var(--color-panel-text-muted)',
                        marginBottom: 2,
                      }}
                    >
                      Compute
                    </div>
                    <div
                      style={{
                        color: 'var(--color-panel-text-secondary)',
                      }}
                    >
                      {formatCompute(usageStats?.memory_used_mb, durationMs ?? 0)}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        color: 'var(--color-panel-text-muted)',
                        marginBottom: 2,
                      }}
                    >
                      DB Bandwidth
                    </div>
                    <div
                      style={{
                        color: 'var(--color-panel-text-secondary)',
                      }}
                    >
                      {`Accessed ${usageStats?.database_read_documents || 0} documents, ${formatBytes(
                        usageStats?.database_read_bytes,
                      )} read, ${formatBytes(usageStats?.database_write_bytes)} written`}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        color: 'var(--color-panel-text-muted)',
                        marginBottom: 2,
                      }}
                    >
                      File Bandwidth
                    </div>
                    <div
                      style={{
                        color: 'var(--color-panel-text-secondary)',
                      }}
                    >
                      {`${formatBytes(usageStats?.storage_read_bytes)} read, ${formatBytes(
                        usageStats?.storage_write_bytes,
                      )} written`}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        color: 'var(--color-panel-text-muted)',
                        marginBottom: 2,
                      }}
                    >
                      Vector Bandwidth
                    </div>
                    <div
                      style={{
                        color: 'var(--color-panel-text-secondary)',
                      }}
                    >
                      {`${formatBytes(usageStats?.vector_index_read_bytes)} read, ${formatBytes(
                        usageStats?.vector_index_write_bytes,
                      )} written`}
                    </div>
                  </div>
                </div>
              )}

              {returnBytes != null && (
                <div
                  style={{
                    marginTop: 16,
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr',
                    rowGap: 6,
                  }}
                >
                  <span style={{ color: 'var(--color-panel-text-muted)' }}>
                    Return Size
                  </span>
                  <span style={{ color: 'var(--color-panel-text-secondary)' }}>
                    {formatBytes(returnBytes)} returned
                  </span>
                </div>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'request' && (
          <Card>
            <div style={{ fontSize: 12 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr',
                  rowGap: 6,
                  marginBottom: 12,
                }}
              >
                <span style={{ color: 'var(--color-panel-text-muted)' }}>
                  Request ID
                </span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    color: 'var(--color-panel-text-secondary)',
                    // Truncate the requestId with ellipsis if too long
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: 200,
                    display: 'inline-block',
                  }}
                  title={requestId}
                >
                  {requestId}
                </span>

                <span style={{ color: 'var(--color-panel-text-muted)' }}>
                  Started at
                </span>
                <span style={{ color: 'var(--color-panel-text-secondary)' }}>
                  {formatDateTime(startedAt ?? 0)}
                </span>

                <span style={{ color: 'var(--color-panel-text-muted)' }}>
                  Completed at
                </span>
                <span style={{ color: 'var(--color-panel-text-secondary)' }}>
                  {formatDateTime(completedAt)}
                </span>

                <span style={{ color: 'var(--color-panel-text-muted)' }}>
                  Duration
                </span>
                <span style={{ color: 'var(--color-panel-text-secondary)' }}>
                  {formatDuration(durationMs ?? 0)}
                </span>

                <span style={{ color: 'var(--color-panel-text-muted)' }}>
                  Identity
                </span>
                <span style={{ color: 'var(--color-panel-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {identityType || 'Unknown'}
                  <TooltipAction
                    icon={<Info size={12} style={{ color: 'var(--color-panel-text-muted)' }} />}
                    text="The identity that executed this function"
                  />
                </span>

                <span style={{ color: 'var(--color-panel-text-muted)' }}>
                  Caller
                </span>
                <span style={{ color: 'var(--color-panel-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {caller || 'Websocket'}
                  <TooltipAction
                    icon={<Info size={12} style={{ color: 'var(--color-panel-text-muted)' }} />}
                    text="What triggered this function execution"
                  />
                </span>

                <span style={{ color: 'var(--color-panel-text-muted)' }}>
                  Environment
                </span>
                <span style={{ color: 'var(--color-panel-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {environment || 'Convex'}
                  <TooltipAction
                    icon={<Info size={12} style={{ color: 'var(--color-panel-text-muted)' }} />}
                    text="The runtime environment where this function executed"
                  />
                </span>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'functions' && (
          <div style={{ fontSize: 12 }}>
            <div
              style={{
                marginBottom: 12,
                color: 'var(--color-panel-text-secondary)',
                fontSize: 12,
              }}
            >
              This is an outline of the functions called in this request.
            </div>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  height: '28px',
                  alignItems: 'center',
                  borderRadius: '6px',
                  border: '1px solid var(--color-panel-border)',
                  backgroundColor: 'var(--color-panel-bg-secondary)',
                }}
              >
                <div style={{ display: 'flex', height: '100%', alignItems: 'center' }}></div>
                <div
                  style={{
                    display: 'flex',
                    flexShrink: 0,
                    alignItems: 'center',
                    gap: '4px',
                    paddingLeft: '8px',
                  }}
                >
                  {hasError ? (
                    <XCircle
                      size={16}
                      style={{ color: 'var(--color-panel-error)' }}
                      aria-label="Function call failed"
                    />
                  ) : (
                    <CheckCircle2
                      size={16}
                      style={{ color: 'var(--color-panel-success)' }}
                      aria-label="Function call succeeded"
                    />
                  )}
                  <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '4px' }}>
                    {(() => {
                      const funcId = log.functionIdentifier;
                      if (!funcId) return <span style={{ color: 'var(--color-panel-text)' }}>Unknown</span>;
                      const parts = funcId.split(':');
                      if (parts.length > 1) {
                        return (
                          <>
                            <span style={{ color: 'var(--color-panel-text-secondary)' }}>
                              {parts[0]}:
                            </span>
                            <span style={{ color: 'var(--color-panel-text)' }}>
                              {parts.slice(1).join(':')}
                            </span>
                          </>
                        );
                      }
                      return (
                        <span style={{ color: 'var(--color-panel-text)' }}>
                          {funcId}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <span
                  style={{
                    marginLeft: '4px',
                    color: 'var(--color-panel-text-secondary)',
                  }}
                >
                  ({formatDuration(durationMs)})
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <Card>
            <div style={{ fontSize: 12 }}>
              {!adminClient ? (
                <div style={{ color: 'var(--color-panel-text-muted)', padding: '16px' }}>
                  Admin client is required for AI analysis.
                </div>
              ) : !hasError ? (
                <div style={{ color: 'var(--color-panel-text-muted)', padding: '16px' }}>
                  AI analysis is only available for failed function executions.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Loading State - Show when analyzing */}
                  {isAnalyzing && (
                    <div
                      style={{
                        padding: '16px',
                        textAlign: 'center',
                        color: 'var(--color-panel-text-muted)',
                      }}
                    >
                      <Loader2 
                        size={16} 
                        style={{ 
                          animation: 'spin 1s linear infinite',
                          margin: '0 auto 8px',
                          display: 'block'
                        }} 
                      />
                      <div 
                        style={{ 
                          fontSize: '12px', 
                          marginBottom: '12px',
                          fontWeight: 500,
                          color: 'var(--color-panel-text)',
                          background: 'linear-gradient(90deg, var(--color-panel-text) 0%, var(--color-panel-text-muted) 50%, var(--color-panel-text) 100%)',
                          backgroundSize: '200% 100%',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          animation: 'shimmer 2s ease-in-out infinite',
                        }}
                      >
                        Thinking...
                      </div>
                      {streamingText.rootCause && (
                        <div style={{ 
                          textAlign: 'left',
                          padding: '12px',
                          backgroundColor: 'var(--color-panel-bg-secondary)',
                          border: '1px solid var(--color-panel-border)',
                          borderRadius: '6px',
                          marginTop: '12px',
                        }}>
                          <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-panel-text)', marginBottom: '4px' }}>
                            Root Cause
                          </div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: 'var(--color-panel-text-secondary)', 
                            lineHeight: '1.5',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}>
                            {streamingText.rootCause}
                            <span style={{ 
                              display: 'inline-block',
                              width: '2px',
                              height: '14px',
                              backgroundColor: 'var(--color-panel-text-secondary)',
                              marginLeft: '2px',
                              animation: 'blink 1s step-end infinite',
                              verticalAlign: 'baseline',
                            }} />
                          </div>
                        </div>
                      )}
                      {streamingText.suggestions && streamingText.suggestions.length > 0 && (
                        <div style={{ 
                          textAlign: 'left',
                          padding: '12px',
                          backgroundColor: 'var(--color-panel-bg-secondary)',
                          border: '1px solid var(--color-panel-border)',
                          borderRadius: '6px',
                          marginTop: '12px',
                        }}>
                          <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-panel-text)', marginBottom: '4px' }}>
                            Suggestions
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: 'var(--color-panel-text-secondary)' }}>
                            {streamingText.suggestions.map((suggestion, i) => (
                              <li key={i} style={{ marginBottom: '4px' }}>
                                {suggestion}
                                {i === streamingText.suggestions!.length - 1 && (
                                  <span style={{ 
                                    display: 'inline-block',
                                    width: '2px',
                                    height: '12px',
                                    backgroundColor: 'var(--color-panel-text-secondary)',
                                    marginLeft: '2px',
                                    animation: 'blink 1s step-end infinite',
                                    verticalAlign: 'baseline',
                                  }} />
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Re-analyze Button - Show when not analyzing and no results */}
                  {!isAnalyzing && (!aiAnalysis || analysisError) && (
                    <div
                      style={{
                        padding: '16px',
                        backgroundColor: 'var(--color-panel-bg-secondary)',
                        border: '1px solid var(--color-panel-border)',
                        borderRadius: '6px',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ marginBottom: '12px', color: 'var(--color-panel-text)', fontSize: '12px' }}>
                        {aiAnalysis ? 'Re-analyze this error with AI' : 'Click the button below to analyze this error with AI'}
                      </div>
                      <button
                        onClick={handleAnalyzeWithAI}
                        disabled={isAnalyzing}
                        style={{
                          padding: '8px 16px',
                          fontSize: '12px',
                          fontWeight: 500,
                          border: 'none',
                          borderRadius: '6px',
                          backgroundColor: 'var(--color-panel-accent)',
                          color: '#fff',
                          cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                          opacity: isAnalyzing ? 0.5 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          margin: '0 auto',
                        }}
                      >
                        {aiAnalysis ? 'Re-analyze' : 'Analyze with AI'}
                      </button>
                    </div>
                  )}

                  {/* Error State */}
                  {analysisError && (
                    <div
                      style={{
                        padding: '12px',
                        backgroundColor: 'var(--color-background-error)',
                        border: '1px solid var(--color-border-error)',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: 'var(--color-content-error)',
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>Analysis Error</div>
                      <div>{analysisError}</div>
                    </div>
                  )}

                  {/* Analysis Results */}
                  {aiAnalysis && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Re-analyze and Copy buttons at top of results */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={async () => {
                            await handleCopyAIPrompt({
                              analysis: aiAnalysis,
                              functionPath: functionIdentifier || undefined,
                              errorMessage: error || undefined,
                              errorId: requestId || undefined,
                            });
                          }}
                          style={{
                            padding: '6px 12px',
                            fontSize: '11px',
                            fontWeight: 500,
                            border: '1px solid var(--color-panel-border)',
                            borderRadius: '6px',
                            backgroundColor: 'transparent',
                            color: 'var(--color-panel-text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--color-panel-text)';
                            e.currentTarget.style.borderColor = 'var(--color-panel-accent)';
                            e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--color-panel-text-muted)';
                            e.currentTarget.style.borderColor = 'var(--color-panel-border)';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          title="Copy AI prompt for Cursor/VSCode"
                        >
                          <Sparkles size={12} />
                          Copy Analysis
                        </button>
                        <button
                          onClick={handleAnalyzeWithAI}
                          disabled={isAnalyzing}
                          style={{
                            padding: '6px 12px',
                            fontSize: '11px',
                            fontWeight: 500,
                            border: '1px solid var(--color-panel-border)',
                            borderRadius: '6px',
                            backgroundColor: 'transparent',
                            color: 'var(--color-panel-text)',
                            cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                            opacity: isAnalyzing ? 0.5 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            if (!isAnalyzing) {
                              e.currentTarget.style.backgroundColor = 'var(--color-panel-border)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isAnalyzing) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Sparkles size={12} />
                              Re-analyze
                            </>
                          )}
                        </button>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-panel-text)', marginBottom: '4px' }}>
                          Root Cause
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-panel-text-secondary)', lineHeight: '1.5', marginBottom: '4px' }}>
                          {aiAnalysis.rootCause}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--color-panel-text-muted)' }}>
                          Confidence: {Math.round(aiAnalysis.confidence * 100)}% | Severity: {aiAnalysis.severity}
                        </div>
                      </div>

                      {aiAnalysis.suggestions.length > 0 && (
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-panel-text)', marginBottom: '4px' }}>
                            Suggestions
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: 'var(--color-panel-text-secondary)' }}>
                            {aiAnalysis.suggestions.map((suggestion, i) => (
                              <li key={i} style={{ marginBottom: '4px' }}>
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {fixSuggestion && (
                        <div
                          style={{
                            padding: '12px',
                            backgroundColor: 'var(--color-panel-bg-secondary)',
                            border: '1px solid var(--color-panel-border)',
                            borderRadius: '6px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                            <Lightbulb size={14} style={{ color: 'var(--color-panel-accent)' }} />
                            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-panel-text)' }}>
                              Fix Suggestion
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-panel-text-secondary)', marginBottom: '8px', lineHeight: '1.5' }}>
                            {fixSuggestion.suggestion}
                          </div>
                          {fixSuggestion.codeExample && (
                            <div
                              style={{
                                marginTop: '8px',
                                padding: '8px',
                                backgroundColor: 'var(--color-panel-bg-tertiary)',
                                borderRadius: '4px',
                                fontFamily: 'monospace',
                                fontSize: '10px',
                                color: 'var(--color-panel-text-secondary)',
                                whiteSpace: 'pre-wrap',
                              }}
                            >
                              {fixSuggestion.codeExample}
                            </div>
                          )}
                          {fixSuggestion.documentationLinks.length > 0 && (
                            <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--color-panel-text-muted)' }}>
                              Documentation: {fixSuggestion.documentationLinks.join(', ')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        @keyframes blink {
          0%, 50% {
            opacity: 1;
          }
          51%, 100% {
            opacity: 0;
          }
        }
      `}</style>
      <Sheet
        isOpen={isOpen}
        onClose={onClose}
        width="420px"
        container={container}
      >
        {sheetContent}
      </Sheet>
    </>
  );
};


