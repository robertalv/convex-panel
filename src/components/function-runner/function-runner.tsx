import React, { useState, useEffect, useMemo } from 'react';
import { X, Play, Settings, Code as CodeIcon, ChevronDown, Copy, Maximize2, ArrowLeft, ArrowRight, ChevronUp } from 'lucide-react';
import { toast } from '../../utils/toast';
import { ModuleFunction } from '../../utils/functionDiscovery';
import { useFunctionResult } from '../../hooks/useFunctionResult';
import { useFunctionEditor } from '../../hooks/useFunctionEditor';
import { Result } from './components/result';
import { QueryResult } from './components/query-result';
import { useRunHistory, RunHistoryItem } from '../../hooks/useRunHistory';
import { ComponentSelector } from './components/component-selector';
import { FunctionSelector } from './components/function-selector';
import { Value } from 'convex/values';

export type CustomQuery = {
  type: 'customQuery';
  table: string | null;
  componentId?: string | null;
};

export interface FunctionRunnerProps {
  onClose: () => void;
  adminClient: any;
  deploymentUrl?: string;
  selectedFunction?: ModuleFunction | CustomQuery | null;
  componentId?: string | null;
  availableFunctions?: ModuleFunction[];
  availableComponents?: string[];
  componentIdMap?: Map<string, string>; // displayName -> componentId
  onFunctionSelect?: (fn: ModuleFunction | CustomQuery) => void;
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
}) => {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(propComponentId || 'app');
  const [selectedFunction, setSelectedFunction] = useState<ModuleFunction | CustomQuery | null>(propSelectedFunction || null);
  const [args, setArgs] = useState<Record<string, Value>>({});
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<any>(null);
  const [runHistoryItem, setRunHistoryItem] = useState<RunHistoryItem | undefined>();
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);

  // Sync selectedComponent with propComponentId when it changes
  useEffect(() => {
    if (propComponentId !== undefined) {
      setSelectedComponent(propComponentId || 'app');
    }
  }, [propComponentId]);

  // Sync selectedFunction with propSelectedFunction when it changes
  useEffect(() => {
    if (propSelectedFunction !== undefined) {
      setSelectedFunction(propSelectedFunction);
    }
  }, [propSelectedFunction]);

  // Use provided components list (display names) or extract from available functions
  const components = useMemo(() => {
    if (availableComponents && availableComponents.length > 0) {
      return availableComponents;
    }
    // Fallback: extract from functions and use componentId as display name
    const componentSet = new Set<string>(['app']);
    availableFunctions.forEach(fn => {
      if (fn.componentId) {
        // Use shortened version if ID is too long
        const displayName = fn.componentId.length > 20 ? `${fn.componentId.substring(0, 20)}...` : fn.componentId;
        componentSet.add(displayName);
      }
    });
    return Array.from(componentSet).sort();
  }, [availableFunctions, availableComponents]);
  
  // Get the display name for the currently selected component
  const selectedComponentDisplayName = useMemo(() => {
    if (!selectedComponent || selectedComponent === 'app') {
      return 'app';
    }
    // Find the display name for this componentId
    if (componentIdMap) {
      for (const [displayName, id] of componentIdMap.entries()) {
        if (id === selectedComponent) {
          return displayName;
        }
      }
    }
    // Fallback: use shortened version of componentId
    return selectedComponent.length > 20 ? `${selectedComponent.substring(0, 20)}...` : selectedComponent;
  }, [selectedComponent, componentIdMap]);

  // Filter functions by selected component
  // Component functions have identifiers like: "componentName:moduleName:functionName" or "componentName:functionName"
  // App functions have identifiers like: "moduleName:functionName" (no component prefix)
  const filteredFunctions = useMemo(() => {
    if (!selectedComponent || selectedComponent === 'app') {
      // Show app-level functions (no componentId and identifier doesn't start with component name)
      return availableFunctions.filter(fn => {
        // Check both componentId and identifier pattern
        const hasComponentId = fn.componentId !== null && fn.componentId !== undefined;
        if (hasComponentId) return false;
        
        // Also check identifier pattern - if it starts with a known component name, exclude it
        // We'll check this by seeing if the first part of the identifier matches any component
        if (fn.identifier && fn.identifier.includes(':')) {
          const firstPart = fn.identifier.split(':')[0];
          // If first part matches a component name (not 'app'), exclude it
          // We can't check all components here, so we rely on componentId being set
          // But if componentId is null, we assume it's an app function
          return true;
        }
        return true;
      });
    }
    
    // Show functions for the selected component
    // Match by identifier pattern FIRST (most reliable), then by componentId
    // Component functions have identifiers like: "componentName:moduleName:functionName"
    // selectedComponent should be the component name (used in identifiers), not the ID
    const filtered = availableFunctions.filter(fn => {
      // PRIMARY: Check identifier pattern - this is the most reliable method
      // Component functions always have identifiers starting with "componentName:"
      if (fn.identifier && fn.identifier.startsWith(`${selectedComponent}:`)) {
        return true;
      }
      
      // FALLBACK: Check componentId (should be component name, not ID)
      if (fn.componentId === selectedComponent) {
        return true;
      }
      
      return false;
    });
    
    // Debug logging
    console.log('[FunctionRunner] Filtering functions:', {
      selectedComponent,
      totalFunctions: availableFunctions.length,
      filteredCount: filtered.length,
      sampleAvailable: availableFunctions.slice(0, 5).map(f => ({
        identifier: f.identifier,
        componentId: f.componentId,
        name: f.name,
      })),
      sampleFiltered: filtered.slice(0, 5).map(f => ({
        identifier: f.identifier,
        componentId: f.componentId,
        name: f.name,
      })),
      allComponentIds: [...new Set(availableFunctions.map(f => f.componentId).filter(Boolean))],
      identifiersStartingWith: availableFunctions
        .filter(f => f.identifier && f.identifier.startsWith(`${selectedComponent}:`))
        .slice(0, 5)
        .map(f => f.identifier),
    });
    
    return filtered;
  }, [availableFunctions, selectedComponent]);

  // Handle component selection
  // component is a display name, we need to map it to component name (used in identifiers)
  const handleComponentSelect = (component: string | null) => {
    let componentName: string | null = null;
    
    if (component === 'app' || !component) {
      componentName = 'app';
    } else if (componentIdMap) {
      // Map display name to component name (used in identifiers)
      // componentIdMap maps displayName -> componentName (not ID)
      componentName = componentIdMap.get(component) || component;
    } else {
      // Fallback: assume component is already a name
      componentName = component;
    }
    
    console.log('[FunctionRunner] Component selected:', {
      displayName: component,
      componentName,
      availableFunctionsCount: availableFunctions.length,
      sampleIdentifiers: availableFunctions.slice(0, 5).map(f => ({
        identifier: f.identifier,
        componentId: f.componentId,
        name: f.name,
      })),
    });
    
    setSelectedComponent(componentName);
    // Reset function selection when component changes
    setSelectedFunction(null);
    setArgs({});
  };

  // Handle function selection
  const handleFunctionSelect = (fn: ModuleFunction | CustomQuery) => {
    setSelectedFunction(fn);
    if (onFunctionSelect) {
      onFunctionSelect(fn);
    }
    // Reset args when function changes (unless it's from history)
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
    udfType: moduleFunction?.udfType === 'httpAction' ? undefined : (moduleFunction?.udfType as 'query' | 'mutation' | 'action' | undefined),
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

  // Update history index when runHistory changes
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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: '#16181D',
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
            borderRight: '1px solid #2D313A',
            backgroundColor: '#0F1115',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              height: '36px',
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid #2D313A',
              backgroundColor: '#16181D',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#d1d5db' }}>
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
                  <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 500 }}>Arguments</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      style={{
                        padding: '4px',
                        borderRadius: '4px',
                        border: 'none',
                        background: 'transparent',
                        color: '#999',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#2D313A';
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
                        color: historyIndex > 0 ? '#999' : '#3d4149',
                        cursor: historyIndex > 0 ? 'pointer' : 'not-allowed',
                      }}
                      onMouseEnter={(e) => {
                        if (historyIndex > 0) {
                          e.currentTarget.style.backgroundColor = '#2D313A';
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
                        color: historyIndex < runHistory.length - 1 ? '#999' : '#3d4149',
                        cursor: historyIndex < runHistory.length - 1 ? 'pointer' : 'not-allowed',
                      }}
                      onMouseEnter={(e) => {
                        if (historyIndex < runHistory.length - 1) {
                          e.currentTarget.style.backgroundColor = '#2D313A';
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
                    backgroundColor: '#16181D',
                    border: '1px solid #2D313A',
                    borderRadius: '4px',
                    padding: '8px',
                    position: 'relative',
                  }}
                >
                  <textarea
                    value={JSON.stringify(args, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        if (typeof parsed === 'object' && parsed !== null) {
                          setArgs(parsed);
                        }
                      } catch {
                        // Invalid JSON, keep as is
                      }
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: '14px',
                      fontFamily: 'monospace',
                      color: '#eab308',
                      resize: 'none',
                      padding: '8px',
                    }}
                    spellCheck={false}
                    placeholder="{\n  \n}"
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
              borderTop: '1px solid #2D313A',
              backgroundColor: '#0F1115',
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
                    backgroundColor: '#1C1F26',
                    border: '1px solid #2D313A',
                    cursor: 'pointer',
                  }}
                />
                <label
                  htmlFor="asUser"
                  style={{
                    fontSize: '12px',
                    color: '#d1d5db',
                    userSelect: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  Act as a user
                  <Settings style={{ width: '12px', height: '12px', color: '#9ca3af' }} />
                </label>
              </div>
            )}
            <button
              onClick={handleRun}
              disabled={isRunning}
              style={{
                width: '100%',
                height: '36px',
                backgroundColor: isRunning ? '#4d3bc2' : '#5B46DF',
                border: 'none',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: isRunning ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                boxShadow: '0 4px 12px rgba(91, 70, 223, 0.2)',
                opacity: isRunning ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isRunning) {
                  e.currentTarget.style.backgroundColor = '#4d3bc2';
                }
              }}
              onMouseLeave={(e) => {
                if (!isRunning) {
                  e.currentTarget.style.backgroundColor = '#5B46DF';
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
            backgroundColor: '#16181D',
          }}
        >
          <div
            style={{
              height: '36px',
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #2D313A',
              backgroundColor: '#16181D',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#d1d5db' }}>Output</span>
              {currentResult && currentTiming && (
                <>
                  {currentResult.success ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: '#22c55e',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span style={{ color: '#fff', fontSize: '8px' }}>✓</span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#22c55e' }}>Success</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span style={{ color: '#fff', fontSize: '8px', fontWeight: 'bold' }}>×</span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#ef4444' }}>error</span>
                    </div>
                  )}
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                    {currentTiming.endedAt - currentTiming.startedAt < 1000
                      ? `${currentTiming.endedAt - currentTiming.startedAt}ms`
                      : `${((currentTiming.endedAt - currentTiming.startedAt) / 1000).toFixed(2)}s`}
                  </span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
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
              <Copy
                style={{
                  width: '14px',
                  height: '14px',
                  color: '#999',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#999';
                }}
                onClick={async () => {
                  if (currentResult) {
                    const text = currentResult.success
                      ? JSON.stringify(currentResult.value, null, 2)
                      : currentResult.errorMessage || '';
                    try {
                      await navigator.clipboard.writeText(text);
                      toast('success', 'Copied to clipboard');
                    } catch (err) {
                      console.error('Failed to copy:', err);
                      toast('error', 'Failed to copy to clipboard');
                    }
                  }
                }}
              />
              <button
                onClick={onClose}
                style={{
                  padding: '4px',
                  borderRadius: '4px',
                  border: 'none',
                  background: 'transparent',
                  color: '#999',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2D313A';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#999';
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
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
                  color: '#999',
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
