import React, { useState, useEffect, useMemo } from 'react';
import { X, Play, Settings, Code as CodeIcon, Copy, ArrowLeft, ArrowRight, Maximize2, Minimize2, Columns, Rows } from 'lucide-react';
import { copyToClipboard } from '../../utils/toast';
import type { ModuleFunction } from '../../utils/api/functionDiscovery';
import { useFunctionResult } from '../../hooks/useFunctionResult';
import { useFunctionEditor } from '../../hooks/useFunctionEditor';
import { Result } from './result';
import { QueryResult } from './query-result';
import { useRunHistory } from '../../hooks/useRunHistory';
import type { RunHistoryItem } from '../../hooks/useRunHistory';
import { ComponentSelector } from '../component-selector';
import { FunctionSelector } from './function-selector';
import { useThemeSafe } from '../../hooks/useTheme';
import type { Value } from 'convex/values';
import type { CustomQuery } from '../../types/functions';
import type { ExecutableUdfType } from '../../types/convex';
import { ObjectEditor } from '../editor';

// Type definition for ValidatorJSON (simplified version of Convex's ValidatorJSON)
type ValidatorJSON = {
  type: string;
  value?: any;
  optional?: boolean;
  fieldType?: ValidatorJSON;
  keys?: ValidatorJSON;
  values?: { fieldType: ValidatorJSON };
};

// Generate default value from a validator JSON (similar to Convex's defaultValueForValidator)
const defaultValueForValidator = (validator: ValidatorJSON): Value | undefined => {
  switch (validator.type) {
    case 'null':
      return null;
    case 'string':
      return '';
    case 'boolean':
      return false;
    case 'number':
    case 'float64':
      return 0;
    case 'bigint':
      return BigInt(0);
    case 'bytes':
      return '';
    case 'any':
      return {};
    case 'literal':
      return validator.value;
    case 'id':
      return '';
    case 'object':
      if (!validator.value) {
        return {};
      }
      return Object.fromEntries(
        Object.entries(validator.value)
          .map(([fieldName, objectField]: [string, any]) => [
            fieldName,
            objectField.optional
              ? undefined
              : defaultValueForValidator(objectField.fieldType || objectField),
          ])
          .filter((d) => d !== undefined && d[1] !== undefined)
      );
    case 'union':
      if (!validator.value || validator.value.length === 0) {
        return null;
      }
      return defaultValueForValidator(validator.value[0]);
    case 'record':
      return {};
    case 'array':
      return [];
    default:
      return {};
  }
};

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
  isVertical?: boolean;
  setIsVertical?: (vertical: boolean) => void;
  isExpanded?: boolean;
  setIsExpanded?: (expanded: boolean) => void;
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
  isVertical,
  setIsVertical,
  isExpanded,
  setIsExpanded,
}) => {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(propComponentId || 'app');
  const [selectedFunction, setSelectedFunction] = useState<ModuleFunction | CustomQuery | null>(propSelectedFunction || null);
  const [args, setArgs] = useState<Record<string, Value>>({});
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<any>(null);
  const [runHistoryItem, setRunHistoryItem] = useState<RunHistoryItem | undefined>();
  const [historyIndex, setHistoryIndex] = useState(0);
  const [argsError, setArgsError] = useState<string[]>([]);
  const [isVerticalLayout, setIsVerticalLayout] = useState(isVertical ?? false);
  const [isFullscreen, setIsFullscreen] = useState(isExpanded ?? false);
  const [isResizingOutput, setIsResizingOutput] = useState(false);
  const { theme: _theme } = useThemeSafe();

  useEffect(() => {
    if (typeof isVertical === 'boolean') {
      setIsVerticalLayout(isVertical);
    }
  }, [isVertical]);

  useEffect(() => {
    if (typeof isExpanded === 'boolean') {
      setIsFullscreen(isExpanded);
    }
  }, [isExpanded]);

  const handleExpandedToggle = () => {
    const next = !isFullscreen;
    setIsFullscreen(next);
    setIsExpanded?.(next);
  };

  useEffect(() => {
    if (!isResizingOutput) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isVerticalLayout) return;
      
      // Get the function runner container
      const runnerContainer = document.querySelector('.cp-function-runner') as HTMLElement;
      if (!runnerContainer) return;

      const containerRect = runnerContainer.getBoundingClientRect();
      const containerHeight = containerRect.height;
      
      // Calculate new output height from bottom of container
      const newOutputHeight = containerRect.bottom - e.clientY;
      
      // Clamp between min (200px) and max (80% of container)
      const minHeight = 200;
      const maxHeight = containerHeight * 0.8;
      const clampedHeight = Math.max(minHeight, Math.min(newOutputHeight, maxHeight));
      
      localStorage.setItem('convex-panel-function-runner-output-height', clampedHeight.toString());
    };

    const handleMouseUp = () => {
      setIsResizingOutput(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingOutput, isVerticalLayout]);

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
        
        // If the function has an identifier but no componentId, include it
        if (fn.identifier && fn.identifier.includes(':')) {
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
      // Generate default arguments from function's args validator
      if (!('type' in fn) && fn.args) {
        try {
          const argsValidator = JSON.parse(fn.args) as ValidatorJSON;
          const defaultArgs = defaultValueForValidator(argsValidator) as Record<string, Value> | undefined;
          setArgs(defaultArgs || {});
        } catch (e) {
          // If parsing fails, use empty object
          setArgs({});
        }
      } else {
        setArgs({});
      }
    }
  };

  const isCustomQuery = selectedFunction && 'type' in selectedFunction && selectedFunction.type === 'customQuery';
  const moduleFunction = !isCustomQuery ? (selectedFunction as ModuleFunction | null) : null;
  const currentComponentId = selectedComponent === 'app' ? null : selectedComponent;

  // Generate default arguments when function changes (as a fallback for prop changes)
  useEffect(() => {
    if (moduleFunction && moduleFunction.args && !runHistoryItem) {
      try {
        const argsValidator = JSON.parse(moduleFunction.args) as ValidatorJSON;
        const defaultArgs = defaultValueForValidator(argsValidator) as Record<string, Value> | undefined;
        if (defaultArgs && Object.keys(defaultArgs).length > 0) {
          setArgs(defaultArgs);
        } else {
          setArgs({});
        }
      } catch (e) {
        // If parsing fails, use empty object
        setArgs({});
      }
    } else if (!moduleFunction && !isCustomQuery && !runHistoryItem) {
      // Clear args when no function is selected (only if not restoring from history)
      setArgs({});
    }
  }, [moduleFunction?.identifier, moduleFunction?.componentId, moduleFunction?.args, runHistoryItem, isCustomQuery]);

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

  const layoutDirection = isVerticalLayout ? 'column' : 'row';

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    minHeight: (isFullscreen || isVerticalLayout) ? undefined : '24rem',
    maxHeight: (isFullscreen || isVerticalLayout) ? undefined : '24rem',
    backgroundColor: 'var(--color-panel-bg-secondary)',
    flex: (isFullscreen || isVerticalLayout) ? 1 : undefined,
    minWidth: isVerticalLayout ? undefined : '450px',
    flexShrink: 0,
  };

  return (
    <div
      className="cp-function-runner"
      style={containerStyle}
    >
      {/* Runner content area */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        overflow: 'hidden', 
        flexDirection: layoutDirection, 
        gap: 0,
        position: 'relative',
        borderTop: !isVerticalLayout ? '1px solid var(--color-panel-border)' : 'none',
      }}>
        {/* Left Pane: Function Input */}
        <div
          style={{
            width: isVerticalLayout ? '100%' : '650px',
            display: 'flex',
            flexDirection: 'column',
            borderRight: isVerticalLayout ? 'none' : '1px solid var(--color-panel-border)',
            borderBottom: isVerticalLayout ? '1px solid var(--color-panel-border)' : 'none',
            borderTop: isVerticalLayout && isFullscreen ? '1px solid var(--color-panel-border)' : 'none',
            backgroundColor: 'var(--color-panel-bg)',
            flexShrink: 0,
            flex: isVerticalLayout ? 1 : undefined,
            minHeight: 0,
            overflow: 'hidden',
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
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-panel-text)' }}>
              Function Input
            </span>
            {isVerticalLayout && (
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
                  onClick={() => {
                    const next = !isVerticalLayout;
                    setIsVerticalLayout(next);
                    setIsVertical?.(next);
                  }}
                  title={isVerticalLayout ? 'Align horizontally' : 'Align vertically'}
                  type="button"
                >
                  {isVerticalLayout ? (
                    <Columns style={{ width: '14px', height: '14px' }} />
                  ) : (
                    <Rows style={{ width: '14px', height: '14px' }} />
                  )}
                </button>
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
                  onClick={handleExpandedToggle}
                  title={isFullscreen ? 'Exit full screen' : 'Expand'}
                  type="button"
                >
                  {isFullscreen ? (
                    <Minimize2 style={{ width: '14px', height: '14px' }} />
                  ) : (
                    <Maximize2 style={{ width: '14px', height: '14px' }} />
                  )}
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
            )}
          </div>

          <div
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              overflowY: 'auto',
              flex: 1,
              minHeight: 0,
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
                      onClick={() => {
                        if (moduleFunction) {
                          if (typeof window !== 'undefined') {
                            localStorage.setItem('convex-panel-functions-selected-function', moduleFunction.identifier);
                            localStorage.setItem('convex-panel-functions-view-code-tab', 'true');
                            window.dispatchEvent(new CustomEvent('convex-panel-navigate-to-functions-code', {
                              detail: { functionIdentifier: moduleFunction.identifier }
                            }));
                          }
                        }
                      }}
                      disabled={!moduleFunction}
                      style={{
                        padding: '4px',
                        borderRadius: '4px',
                        border: 'none',
                        background: 'transparent',
                        color: moduleFunction ? 'var(--color-panel-text-muted)' : 'var(--color-panel-text-muted)',
                        opacity: moduleFunction ? 1 : 0.5,
                        cursor: moduleFunction ? 'pointer' : 'not-allowed',
                      }}
                      onMouseEnter={(e) => {
                        if (moduleFunction) {
                          e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      title={moduleFunction ? 'View function code' : 'Select a function to view code'}
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
                    key={`${moduleFunction?.identifier || 'no-function'}-${moduleFunction?.componentId || 'no-component'}`}
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
                    path={`function-arguments-${moduleFunction?.identifier || 'no-function'}`}
                    language="json"
                    showLineNumbers={true}
                    fullHeight
                    indentTopLevel={true}
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
            borderTop: isVerticalLayout ? '1px solid var(--color-panel-border)' : 'none',
            overflow: 'hidden',
            minHeight: 0,
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
              position: 'relative',
              zIndex: 10,
              flexShrink: 0,
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
            {!isVerticalLayout && (
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
                  onClick={() => {
                    const next = !isVerticalLayout;
                    setIsVerticalLayout(next);
                    setIsVertical?.(next);
                  }}
                  title={isVerticalLayout ? 'Align horizontally' : 'Align vertically'}
                  type="button"
                >
                  {isVerticalLayout ? (
                    <Columns style={{ width: '14px', height: '14px' }} />
                  ) : (
                    <Rows style={{ width: '14px', height: '14px' }} />
                  )}
                </button>
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
                  onClick={handleExpandedToggle}
                  title={isFullscreen ? 'Exit full screen' : 'Expand'}
                  type="button"
                >
                  {isFullscreen ? (
                    <Minimize2 style={{ width: '14px', height: '14px' }} />
                  ) : (
                    <Maximize2 style={{ width: '14px', height: '14px' }} />
                  )}
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
            )}
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
              />
            ) : moduleFunction && moduleFunction.udfType === 'query' ? (
              <QueryResult
                result={currentResult}
                loading={isRunning}
              />
            ) : currentResult ? (
              <Result
                result={currentResult}
                loading={isRunning}
              />
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
