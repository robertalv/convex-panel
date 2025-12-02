import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Play, Settings, Code as CodeIcon, ChevronDown, Copy, Maximize2, ArrowLeft, ArrowRight, ChevronUp } from 'lucide-react';
import { copyToClipboard } from '../../utils/toast';
import { ModuleFunction } from '../../utils/functionDiscovery';
import { useFunctionResult } from '../../hooks/useFunctionResult';
import { useFunctionEditor } from '../../hooks/useFunctionEditor';
import { Result } from './result';
import { QueryResult } from './query-result';
import { useRunHistory, RunHistoryItem } from '../../hooks/useRunHistory';
import { ComponentSelector } from '../component-selector';
import { FunctionSelector } from './function-selector';
import { useThemeSafe } from '../../hooks/useTheme';
import { Value } from 'convex/values';
import { CustomQuery } from '../../types/functions';
import { ExecutableUdfType } from 'src/types/convex';
import { ObjectEditor } from '../editor';

export interface FunctionRunnerProps {
  onClose: () => void;
  adminClient: any;
  deploymentUrl?: string;
  selectedFunction?: ModuleFunction | CustomQuery | null;
  componentId?: string | null;
  availableFunctions?: ModuleFunction[];
  availableComponents?: string[];
  componentIdMap?: Map<string, string>;
  onFunctionSelect?: (fn: ModuleFunction | CustomQuery) => void;
  autoRun?: boolean;
  onAutoRunComplete?: () => void;
}

export const FunctionRunner: React.FC<FunctionRunnerProps> = ({
  onClose,
  adminClient,
  deploymentUrl: propDeploymentUrl,
  selectedFunction: propSelectedFunction,
  componentId: propComponentId,
  availableFunctions = [],
  availableComponents,
  componentIdMap,
  onFunctionSelect,
  autoRun = false,
  onAutoRunComplete,
}) => {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(propComponentId || 'app');
  const [selectedFunction, setSelectedFunction] = useState<ModuleFunction | CustomQuery | null>(propSelectedFunction || null);
  const [args, setArgs] = useState<Record<string, Value>>({});
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<any>(null);
  const [runHistoryItem, setRunHistoryItem] = useState<RunHistoryItem | undefined>();
  const [historyIndex, setHistoryIndex] = useState(0);
  const [argsError, setArgsError] = useState<string[]>([]);
  const { theme } = useThemeSafe();

  useEffect(() => {
    if (propComponentId !== undefined) {
      setSelectedComponent(propComponentId || 'app');
    }
  }, [propComponentId]);

  useEffect(() => {
    if (propSelectedFunction !== undefined) {
      setSelectedFunction(propSelectedFunction);
    }
  }, [propSelectedFunction]);

  const components = useMemo(() => {
    if (availableComponents && availableComponents.length > 0) {
      return availableComponents;
    }
    const componentSet = new Set<string>(['app']);
    availableFunctions.forEach(fn => {
      if (fn.componentId) {
        const displayName = fn.componentId.length > 20 ? `${fn.componentId.substring(0, 20)}...` : fn.componentId;
        componentSet.add(displayName);
      }
    });
    return Array.from(componentSet).sort();
  }, [availableFunctions, availableComponents]);
  
  const selectedComponentDisplayName = useMemo(() => {
    if (!selectedComponent || selectedComponent === 'app') {
      return 'app';
    }
    if (componentIdMap) {
      for (const [displayName, id] of componentIdMap.entries()) {
        if (id === selectedComponent) {
          return displayName;
        }
      }
    }
    return selectedComponent.length > 20 ? `${selectedComponent.substring(0, 20)}...` : selectedComponent;
  }, [selectedComponent, componentIdMap]);

  const filteredFunctions = useMemo(() => {
    if (!selectedComponent || selectedComponent === 'app') {
      return availableFunctions.filter(fn => {
        const hasComponentId = fn.componentId !== null && fn.componentId !== undefined;
        if (hasComponentId) return false;
        
        if (fn.identifier && fn.identifier.includes(':')) {
          const firstPart = fn.identifier.split(':')[0];
          return true;
        }
        return true;
      });
    }
    
    const filtered = availableFunctions.filter(fn => {
      if (fn.identifier && fn.identifier.startsWith(`${selectedComponent}:`)) {
        return true;
      }
      
      if (fn.componentId === selectedComponent) {
        return true;
      }
      
      return false;
    });
    
    return filtered;
  }, [availableFunctions, selectedComponent]);

  const handleComponentSelect = (component: string | null) => {
    let componentName: string | null = null;
    
    if (component === 'app' || !component) {
      componentName = 'app';
    } else if (componentIdMap) {
      componentName = componentIdMap.get(component) || component;
    } else {
      componentName = component;
    }
    
    setSelectedComponent(componentName);
    setSelectedFunction(null);
    setArgs({});
  };

  const handleFunctionSelect = (fn: ModuleFunction | CustomQuery) => {
    setSelectedFunction(fn);
    if (onFunctionSelect) {
      onFunctionSelect(fn);
    }
    if (!runHistoryItem) {
      setArgs({});
    }
  };

  const isCustomQuery = selectedFunction && 'type' in selectedFunction && selectedFunction.type === 'customQuery';
  const moduleFunction = !isCustomQuery ? (selectedFunction as ModuleFunction | null) : null;
  const currentComponentId = selectedComponent === 'app' ? null : selectedComponent;

  const { runHistory } = useRunHistory(
    moduleFunction?.identifier || 'customQuery',
    currentComponentId
  );

  const { result, loading, lastRequestTiming, runFunction } = useFunctionResult({
    adminClient,
    moduleFunction: moduleFunction || null,
    args,
    udfType: moduleFunction?.udfType === 'httpAction' ? undefined : (moduleFunction?.udfType as ExecutableUdfType | undefined),
    componentId: currentComponentId,
    runHistoryItem,
    impersonatedUser: isImpersonating ? impersonatedUser : undefined,
  });

  const editorHookResult = (useFunctionEditor({
    adminClient,
    deploymentUrl: propDeploymentUrl,
    initialTableName: isCustomQuery ? (selectedFunction as CustomQuery).table : null,
    componentId: currentComponentId,
    runHistoryItem,
  }) as unknown) as {
    queryEditor: React.ReactElement;
    code: string;
    setCode: (code: string) => void;
    result: any;
    loading: boolean;
    lastRequestTiming: { startedAt: number; endedAt: number } | undefined;
    runCustomQuery: () => Promise<void>;
  };
  
  const {
    queryEditor,
    result: customQueryResult,
    loading: customQueryLoading,
    lastRequestTiming: customQueryTiming,
    runCustomQuery,
  } = editorHookResult;

  useEffect(() => {
    if (runHistory.length > 0 && historyIndex >= runHistory.length) {
      setHistoryIndex(0);
    }
  }, [runHistory, historyIndex]);

  const handleRun = () => {
    if (isCustomQuery) {
      runCustomQuery();
    } else if (moduleFunction) {
      runFunction();
    }
  };

  const handleSelectHistoryItem = (item: RunHistoryItem, index: number) => {
    setRunHistoryItem(item);
    setHistoryIndex(index);
    if (item.type === 'arguments') {
      setArgs(item.arguments);
    }
  };

  const isRunning = isCustomQuery ? customQueryLoading : loading;
  const currentResult = isCustomQuery ? customQueryResult : result;
  const currentTiming = isCustomQuery ? customQueryTiming : lastRequestTiming;

  useEffect(() => {
    if (autoRun && selectedFunction && !isRunning) {
      const timeoutId = setTimeout(() => {
        if (isCustomQuery) {
          runCustomQuery();
        } else if (moduleFunction) {
          runFunction();
        }

        onAutoRunComplete?.();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [autoRun, selectedFunction, isRunning, isCustomQuery, moduleFunction, runCustomQuery, runFunction, onAutoRunComplete]);

  return (
    <div
      className="cp-function-runner"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: 'var(--color-panel-bg-secondary)',
      }}
    >
      {/* Runner content area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Pane: Function Input */}
        <div
          style={{
            width: '450px',
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--color-panel-border)',
            backgroundColor: 'var(--color-panel-bg)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              height: '36px',
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid var(--color-panel-border)',
              backgroundColor: 'var(--color-panel-bg-secondary)',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-panel-text)' }}>
              Function Input
            </span>
          </div>

          <div
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              overflowY: 'auto',
              flex: 1,
            }}
          >
            {/* Context Selector */}
            <ComponentSelector
              selectedComponent={selectedComponentDisplayName}
              onSelect={handleComponentSelect}
              components={components}
            />

            {/* Function Selector */}
            <FunctionSelector
              selectedFunction={selectedFunction}
              onSelect={handleFunctionSelect}
              functions={filteredFunctions}
              componentId={selectedComponent}
            />

            {/* Arguments - Only show for regular functions, not custom queries */}
            {!isCustomQuery && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '200px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ fontSize: '12px', color: 'var(--color-panel-text-secondary)', fontWeight: 500 }}>
                    Arguments
                    {argsError.length > 0 && (
                      <span style={{ marginLeft: '8px', color: 'var(--color-panel-error)', fontSize: '11px' }}>
                        ({argsError[0]})
                      </span>
                    )}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      style={{
                        padding: '4px',
                        borderRadius: '4px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--color-panel-text-muted)',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <CodeIcon style={{ width: '12px', height: '12px' }} />
                    </button>
                    <button
                      onClick={() => {
                        if (historyIndex > 0) {
                          handleSelectHistoryItem(runHistory[historyIndex - 1], historyIndex - 1);
                        }
                      }}
                      disabled={historyIndex <= 0}
                      style={{
                        padding: '4px',
                        borderRadius: '4px',
                        border: 'none',
                        background: 'transparent',
                        color: historyIndex > 0 ? 'var(--color-panel-text-muted)' : 'var(--color-panel-text-muted)',
                        opacity: historyIndex > 0 ? 1 : 0.5,
                        cursor: historyIndex > 0 ? 'pointer' : 'not-allowed',
                      }}
                      onMouseEnter={(e) => {
                        if (historyIndex > 0) {
                          e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <ArrowLeft style={{ width: '12px', height: '12px' }} />
                    </button>
                    <button
                      onClick={() => {
                        if (historyIndex < runHistory.length - 1) {
                          handleSelectHistoryItem(runHistory[historyIndex + 1], historyIndex + 1);
                        }
                      }}
                      disabled={historyIndex >= runHistory.length - 1}
                      style={{
                        padding: '4px',
                        borderRadius: '4px',
                        border: 'none',
                        background: 'transparent',
                        color: historyIndex < runHistory.length - 1 ? 'var(--color-panel-text-muted)' : 'var(--color-panel-text-muted)',
                        opacity: historyIndex < runHistory.length - 1 ? 1 : 0.5,
                        cursor: historyIndex < runHistory.length - 1 ? 'pointer' : 'not-allowed',
                      }}
                      onMouseEnter={(e) => {
                        if (historyIndex < runHistory.length - 1) {
                          e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <ArrowRight style={{ width: '12px', height: '12px' }} />
                    </button>
                  </div>
                </div>
                <div
                  style={{
                    flex: 1,
                    minHeight: '200px',
                  }}
                >
                  <ObjectEditor
                    defaultValue={args}
                    onChange={(value) => {
                      if (value !== undefined) {
                        setArgs(value as Record<string, Value>);
                      } else {
                        setArgs({});
                      }
                    }}
                    onError={(errors) => {
                      setArgsError(errors);
                    }}
                    path="function-arguments"
                    language="json"
                    showLineNumbers={true}
                    fullHeight
                    className=""
                    editorClassname=""
                  />
                </div>
              </div>
            )}

            {/* Custom Query Editor - Only show for custom queries */}
            {isCustomQuery && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {queryEditor}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: '16px',
              borderTop: '1px solid var(--color-panel-border)',
              backgroundColor: 'var(--color-panel-bg)',
            }}
          >
            {!isCustomQuery && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <input
                  type="checkbox"
                  id="asUser"
                  checked={isImpersonating}
                  onChange={(e) => {
                    setIsImpersonating(e.target.checked);
                    if (!e.target.checked) {
                      setImpersonatedUser(null);
                    }
                  }}
                  style={{
                    borderRadius: '4px',
                    backgroundColor: 'var(--color-panel-bg-tertiary)',
                    border: '1px solid var(--color-panel-border)',
                    cursor: 'pointer',
                  }}
                />
                <label
                  htmlFor="asUser"
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-panel-text)',
                    userSelect: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  Act as a user
                  <Settings style={{ width: '12px', height: '12px', color: 'var(--color-panel-text-secondary)' }} />
                </label>
              </div>
            )}
            <button
              onClick={handleRun}
              disabled={isRunning}
              style={{
                width: '100%',
                height: '36px',
                backgroundColor: isRunning ? 'var(--color-panel-accent-hover)' : 'var(--color-panel-accent)',
                border: 'none',
                color: 'var(--color-panel-bg)',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: isRunning ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                boxShadow: '0 4px 12px color-mix(in srgb, var(--color-panel-accent) 20%, transparent)',
                opacity: isRunning ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isRunning) {
                  e.currentTarget.style.backgroundColor = 'var(--color-panel-accent-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isRunning) {
                  e.currentTarget.style.backgroundColor = 'var(--color-panel-accent)';
                }
              }}
            >
              <Play
                style={{
                  width: '14px',
                  height: '14px',
                  fill: 'currentColor',
                }}
              />
              {isCustomQuery 
                ? 'Run Custom Query' 
                : `Run ${moduleFunction?.udfType || 'action'}`}
            </button>
          </div>
        </div>

        {/* Right Pane: Output */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--color-panel-bg-secondary)',
          }}
        >
          <div
            style={{
              height: '36px',
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--color-panel-border)',
              backgroundColor: 'var(--color-panel-bg-secondary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-panel-text)' }}>Output</span>
              {currentResult && currentTiming && (
                <>
                  {currentResult.success ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--color-panel-success)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span style={{ color: 'var(--color-panel-bg)', fontSize: '8px' }}>✓</span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--color-panel-success)' }}>Success</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--color-panel-error)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span style={{ color: 'var(--color-panel-bg)', fontSize: '8px', fontWeight: 'bold' }}>×</span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--color-panel-error)' }}>error</span>
                    </div>
                  )}
                  <span style={{ fontSize: '12px', color: 'var(--color-panel-text-secondary)' }}>
                    {currentTiming.endedAt - currentTiming.startedAt < 1000
                      ? `${currentTiming.endedAt - currentTiming.startedAt}ms`
                      : `${((currentTiming.endedAt - currentTiming.startedAt) / 1000).toFixed(2)}s`}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--color-panel-text-muted)' }}>
                    {(() => {
                      const now = Date.now();
                      const elapsed = now - currentTiming.endedAt;
                      const seconds = Math.floor(elapsed / 1000);
                      const minutes = Math.floor(seconds / 60);
                      const hours = Math.floor(minutes / 60);
                      
                      if (seconds < 60) {
                        return 'just now';
                      } else if (minutes < 60) {
                        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
                      } else if (hours < 24) {
                        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
                      } else {
                        const days = Math.floor(hours / 24);
                        return `${days} day${days !== 1 ? 's' : ''} ago`;
                      }
                    })()}
                  </span>
                </>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                className="cp-icon-btn"
                style={{
                  padding: '4px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--color-panel-text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = 'var(--color-panel-text)';
                  e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'var(--color-panel-text-muted)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onClick={async () => {
                  if (currentResult) {
                    const text = currentResult.success
                      ? JSON.stringify(currentResult.value, null, 2)
                      : currentResult.errorMessage || '';
                    await copyToClipboard(text);
                  }
                }}
                title="Copy result"
                type="button"
              >
                <Copy
                  style={{
                    width: '14px',
                    height: '14px',
                  }}
                />
              </button>
              <button
                onClick={onClose}
                className="cp-icon-btn"
                style={{
                  padding: '4px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--color-panel-text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = 'var(--color-panel-text)';
                  e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'var(--color-panel-text-muted)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Close"
                type="button"
              >
                <X
                  style={{
                    width: '14px',
                    height: '14px',
                  }}
                />
              </button>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {isCustomQuery ? (
              <Result
                result={customQueryResult}
                loading={customQueryLoading}
                lastRequestTiming={customQueryTiming}
              />
            ) : moduleFunction && moduleFunction.udfType === 'query' ? (
              <QueryResult
                result={currentResult}
                loading={isRunning}
                lastRequestTiming={currentTiming}
              />
            ) : currentResult ? (
              <Result
                result={currentResult}
                loading={isRunning}
                lastRequestTiming={currentTiming}
              />
            ) : (
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--color-panel-text-muted)',
                  fontStyle: 'italic',
                  fontFamily: 'monospace',
                }}
              >
                Run this function to produce a result.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
