import React, { useState, useEffect } from 'react';
import { Play, Search, Pause, CodeXml } from 'lucide-react';
import Editor from '../../components/editor/lazy-monaco-editor';
import type { BeforeMount } from '../../components/editor/lazy-monaco-editor';
import type { ModuleFunction as TypedModuleFunction, FunctionExecutionLog } from '../../types';
import type { ModuleFunction } from '../../utils/api/functionDiscovery';
import { useShowGlobalRunner } from '../../lib/functionRunner';
import { useFunctions } from '../../hooks/useFunctions';
import { getAdminKey } from '../../utils/adminClient';
import { ComponentSelector } from '../../components/component-selector';
import { useComponents } from '../../hooks/useComponents';
import { useFunctionLogStream } from '../../hooks';
import { Card } from '../../components/shared/card';
import { HealthCard } from '../health/components/health-card';
import { useThemeSafe } from '../../hooks/useTheme';
import { EmptyFunctionsState } from './components/empty-functions-state';
import { FunctionExecutionDetailSheet } from './components/function-execution-detail-sheet';
import { fetchUdfExecutionStats, aggregateFunctionStats } from '../../utils/api/metrics';
import { fetchSourceCode } from '../../utils/api/functions';

export interface FunctionsViewProps {
  adminClient: any;
  accessToken: string;
  deployUrl?: string;
  baseUrl?: string;
  useMockData?: boolean;
  onError?: (error: string) => void;
}

type TabType = 'statistics' | 'code' | 'logs';

const STORAGE_KEYS = {
  SEARCH_QUERY: 'convex-panel-functions-search-query',
  SELECTED_FUNCTION: 'convex-panel-functions-selected-function',
};

export const FunctionsView: React.FC<FunctionsViewProps> = ({
  adminClient,
  accessToken,
  deployUrl,
  baseUrl,
  useMockData = false,
  onError,
}) => {
  // Load initial state from localStorage
  const [selectedFunction, setSelectedFunction] = useState<any | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.SEARCH_QUERY) || '';
    }
    return '';
  });
  const [activeTab, setActiveTab] = useState<TabType>('statistics');
  const [monaco, setMonaco] = useState<Parameters<BeforeMount>[0]>();
  const { theme } = useThemeSafe();
  const showGlobalRunner = useShowGlobalRunner();

  const {
    componentNames,
    selectedComponentId,
    selectedComponent,
    setSelectedComponent,
  } = useComponents({
    adminClient,
    useMockData,
  });

  const {
    groupedFunctions,
    isLoading,
    error: functionsError,
  } = useFunctions({
    adminClient,
    useMockData,
    componentId: selectedComponent,
    onError,
  });

  // Statistics data
  const [invocationData, setInvocationData] = useState<number[]>([]);
  const [executionTimeData, setExecutionTimeData] = useState<number[]>([]);
  const [errorData, setErrorData] = useState<number[]>([]);
  const [cacheHitData, setCacheHitData] = useState<number[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  // Code data
  const [sourceCode, setSourceCode] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);

  // Logs data
  const [logs, setLogs] = useState<FunctionExecutionLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [, setLogCursor] = useState<number | string>('now');
  const [selectedExecution, setSelectedExecution] = useState<FunctionExecutionLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const deploymentUrl = deployUrl || baseUrl;
  const adminKey = getAdminKey(adminClient) || accessToken;

  // Save search query to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (searchQuery) {
        localStorage.setItem(STORAGE_KEYS.SEARCH_QUERY, searchQuery);
      } else {
        localStorage.removeItem(STORAGE_KEYS.SEARCH_QUERY);
      }
    }
  }, [searchQuery]);

  // Save selected function identifier to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (selectedFunction) {
        localStorage.setItem(STORAGE_KEYS.SELECTED_FUNCTION, selectedFunction.identifier);
      } else {
        localStorage.removeItem(STORAGE_KEYS.SELECTED_FUNCTION);
      }
    }
  }, [selectedFunction]);

  // Restore selected function from localStorage when functions are loaded
  useEffect(() => {
    if (groupedFunctions.length > 0 && !selectedFunction && typeof window !== 'undefined') {
      const savedFunctionId = localStorage.getItem(STORAGE_KEYS.SELECTED_FUNCTION);
      if (savedFunctionId) {
        // Find the function in the grouped functions
        for (const group of groupedFunctions) {
          const func = group.functions.find(f => f.identifier === savedFunctionId);
          if (func) {
            setSelectedFunction(func);
            break;
          }
        }
      }
    }
  }, [groupedFunctions, selectedFunction]);

  // Expand all paths when grouped functions change
  useEffect(() => {
    if (groupedFunctions.length > 0) {
      const allPaths = new Set(groupedFunctions.map(g => g.path || 'root'));
      setExpandedPaths(allPaths);
    }
  }, [groupedFunctions]);

  // Handle functions error
  useEffect(() => {
    if (functionsError) {
      onError?.(functionsError);
    }
  }, [functionsError, onError]);

  useEffect(() => {
    if (!selectedFunction || !adminClient || useMockData) {
      return;
    }

    if (!deploymentUrl || !accessToken) {
      return;
    }

    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const now = Math.floor(Date.now() / 1000);
        const thirtyMinutesAgo = now - 1800;
        const timeStart = thirtyMinutesAgo;

        // Extract function path for matching
        const getFunctionPath = () => {
          if (selectedFunction.identifier.includes(':')) {
            return selectedFunction.identifier.split(':')[0];
          }
          return selectedFunction.identifier;
        };

        const functionPath = getFunctionPath();

        const adminKey = getAdminKey(adminClient) || accessToken;

        let invData: number[] = Array(30).fill(0);
        let execData: number[] = Array(30).fill(0);
        let cacheData: number[] = Array(30).fill(0);
        let errorData: number[] = Array(30).fill(0);

        if (deploymentUrl && adminKey) {
          try {
            const numBuckets = 30;

            const executionResponse = await fetchUdfExecutionStats(
            deploymentUrl,
              adminKey,
              timeStart * 1000
            ).catch(() => {
              return null;
            });

            if (executionResponse && executionResponse.entries) {
              const aggregated = aggregateFunctionStats(
                executionResponse.entries,
                selectedFunction.identifier,
                selectedFunction.name,
                  functionPath,
                timeStart,
                now,
                numBuckets
              );

              invData = aggregated.invocations;
              errorData = aggregated.errors;
              execData = aggregated.executionTimes;
              cacheData = aggregated.cacheHits;
            }
          } catch (error) {
            // Silently handle errors
          }
        }
        
        setInvocationData(invData);
        setExecutionTimeData(execData);
        setCacheHitData(cacheData);
        setErrorData(errorData);
      } catch (error: any) {
        onError?.(error.message || 'Failed to fetch statistics');
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);
    return () => {
      clearInterval(interval);
    };
  }, [selectedFunction, adminClient, deploymentUrl, accessToken, useMockData, onError]);

  useEffect(() => {
    if (activeTab !== 'code' || !selectedFunction || !deploymentUrl || !accessToken || useMockData) {
      setSourceCode(null);
      return;
    }

    let modulePath = selectedFunction.file?.path || '';
    
    if (!modulePath && selectedFunction.identifier) {
      const parts = selectedFunction.identifier.split(':');
      
      if (parts.length >= 2) {
        modulePath = selectedComponentId && parts.length >= 3 ? parts[1] : parts[0];
      } else {
        modulePath = selectedFunction.identifier;
      }
    }

    if (modulePath && !modulePath.includes('.') && !modulePath.includes(':')) {
      modulePath = `${modulePath}.js`;
    }

    if (!modulePath) {
      setSourceCode(null);
      return;
    }

    setCodeLoading(true);
    fetchSourceCode(deploymentUrl, accessToken, modulePath, selectedComponentId)
      .then((code) => {
        setSourceCode(code);
      })
      .catch(() => {
        setSourceCode(null);
      })
      .finally(() => {
        setCodeLoading(false);
      });
  }, [activeTab, selectedFunction, deploymentUrl, accessToken, useMockData, selectedComponentId]);


  const filteredGroups = groupedFunctions.filter((group) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      group.path.toLowerCase().includes(query) ||
      group.functions.some(
        (f) =>
          f.identifier.toLowerCase().includes(query) ||
          f.name.toLowerCase().includes(query)
      )
    );
  });

  const handleFunctionClick = (func: ModuleFunction) => {
    // Cast function discovery type to the shared types.ModuleFunction shape
    const typedFunc: TypedModuleFunction = {
      name: func.name,
      identifier: func.identifier,
      udfType: func.udfType.toLowerCase() as any,
      visibility: func.visibility,
      file: {
        name: func.file?.path || '',
        path: func.file?.path || '',
      },
    };

    setSelectedFunction(typedFunc);
    setLogs([]);
    setLogCursor('now');
    setSelectedExecution(null);
    setIsDetailOpen(false);
  };

  const handleRunFunction = (func: ModuleFunction | TypedModuleFunction) => {
    showGlobalRunner(func as any);
  };

  const togglePath = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const removeJsExtension = (path: string): string => {
    if (!path) return path;
    return path.endsWith('.js') ? path.slice(0, -3) : path;
  };

  const getFunctionTypeBadgeStyle = (udfType: string): React.CSSProperties => {
    const normalizedType = udfType.toLowerCase();
    const typeMap: Record<string, { bg: string; text: string; border: string }> = {
      'httpaction': { bg: 'rgba(139, 92, 246, 0.1)', text: '#a78bfa', border: 'rgba(139, 92, 246, 0.2)' },
      'query': { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.2)' },
      'mutation': { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.2)' },
      'action': { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e', border: 'rgba(34, 197, 94, 0.2)' },
    };
    const style = typeMap[normalizedType] || typeMap['query'];
    return {
      padding: '0px 2px',
      borderRadius: '6px',
      fontSize: '10px',
      fontWeight: 500,
      border: `1px solid ${style.border}`,
      backgroundColor: style.bg,
      color: style.text,
      textTransform: 'capitalize',
    };
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const generateChartPath = (data: number[]): string => {
    if (!data || data.length === 0) return 'M0 100 L 300 100';
    const maxValue = Math.max(...data, 1);
    const width = 300;
    const height = 100;
    const padding = 5;
    const usableHeight = height - padding * 2;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1 || 1)) * width;
      const percentage = Math.max(0, Math.min(100, (value / maxValue) * 100));
      const y = height - padding - (percentage / 100) * usableHeight;
      return `${x},${y}`;
    });
    
    return `M${points.map((p, i) => i === 0 ? p.split(',')[0] + ' ' + p.split(',')[1] : 'L ' + p).join(' ')}`;
  };

  const getCurrentTimeX = (): number => {
    return 300;
  };

  // Monaco editor setup
  const handleEditorWillMount: BeforeMount = (monacoInstance) => {
    setMonaco(monacoInstance);

    const getThemeColor = (varName: string, fallback: string = '#0F1115') => {
      const themeElement = document.querySelector('.cp-theme-dark, .cp-theme-light') || document.documentElement;
      const color = getComputedStyle(themeElement).getPropertyValue(varName).trim();
      return color || fallback;
    };

    const toMonacoColor = (hex: string) => hex.replace('#', '');

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
        'editor.lineHighlightBackground': getThemeColor('--color-panel-bg-secondary', '#16181D'),
        'editor.selectionBackground': getThemeColor('--color-panel-active', 'rgba(255, 255, 255, 0.1)'),
        'editorCursor.foreground': getThemeColor('--color-panel-text', '#d1d5db'),
        'editorLineNumber.foreground': getThemeColor('--color-panel-text-muted', '#6b7280'),
        'editorLineNumber.activeForeground': getThemeColor('--color-panel-text', '#d1d5db'),
        'editorIndentGuide.background': getThemeColor('--color-panel-border', '#2D313A'),
        'editorIndentGuide.activeBackground': getThemeColor('--color-panel-text-muted', '#6b7280'),
        'editorWhitespace.foreground': getThemeColor('--color-panel-border', '#2D313A'),
      },
    });

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
        'editor.lineHighlightBackground': getThemeColor('--color-panel-bg-secondary', '#f9fafb'),
        'editor.selectionBackground': getThemeColor('--color-panel-active', 'rgba(0, 0, 0, 0.1)'),
        'editorCursor.foreground': getThemeColor('--color-panel-text', '#111827'),
        'editorLineNumber.foreground': getThemeColor('--color-panel-text-muted', '#9ca3af'),
        'editorLineNumber.activeForeground': getThemeColor('--color-panel-text', '#111827'),
        'editorIndentGuide.background': getThemeColor('--color-panel-border', '#e5e7eb'),
        'editorIndentGuide.activeBackground': getThemeColor('--color-panel-text-muted', '#9ca3af'),
        'editorWhitespace.foreground': getThemeColor('--color-panel-border', '#e5e7eb'),
      },
    });
  };

  // Update Monaco theme when theme changes
  useEffect(() => {
    if (monaco) {
      const monacoTheme = theme === 'light' ? 'convex-light' : 'convex-dark';
      monaco.editor.setTheme(monacoTheme);
    }
  }, [theme, monaco]);

  // Determine language from file path
  const getLanguageFromPath = (path: string | undefined): string => {
    if (!path) return 'typescript';
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'json':
        return 'json';
      default:
        return 'typescript';
    }
  };

  const monacoTheme = theme === 'light' ? 'convex-light' : 'convex-dark';

  // Live function log streaming (only when logs tab active and real data)
  const isLogsTabActive = activeTab === 'logs';
  const effectiveIsPaused = isPaused || !isLogsTabActive;
  const {
    logs: streamedLogs,
    isLoading: streamingLoading,
    error: streamingError,
    cursor: streamingCursor,
  } = useFunctionLogStream({
    deploymentUrl,
    authToken: adminKey,
    selectedFunction: selectedFunction as any,
    isPaused: effectiveIsPaused,
    useProgressEvents: false,
    useMockData,
  });

  useEffect(() => {
    if (activeTab === 'logs') {
      setLogs(streamedLogs);
      setLogsLoading(streamingLoading);
      setLogCursor(streamingCursor);
      if (streamingError && onError) {
        onError(streamingError.message);
      }
    }
  }, [activeTab, streamedLogs, streamingLoading, streamingCursor, streamingError, onError]);

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Sidebar List */}
      <div
        style={{
          width: '240px',
          borderRight: '1px solid var(--color-panel-border)',
          backgroundColor: 'var(--color-panel-bg)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {componentNames && componentNames.length > 0 && (
          <div style={{ 
            padding: '8px', 
            borderBottom: '1px solid var(--color-panel-border)',
            backgroundColor: 'var(--color-panel-bg)'
          }}>
            <ComponentSelector
              selectedComponent={selectedComponent || null}
              onSelect={(component) => setSelectedComponent(component)}
              components={componentNames}
            />
          </div>
        )}

        {/* Search Input */}
        <div style={{ 
          padding: '8px', 
          borderBottom: '1px solid var(--color-panel-border)',
          backgroundColor: 'var(--color-panel-bg)'
        }}>
          <div style={{ position: 'relative' }}>
            <Search 
              size={14} 
              style={{ 
                position: 'absolute', 
                left: '10px', 
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-panel-text-muted)',
                pointerEvents: 'none',
                zIndex: 1
              }} 
            />
          <input
            type="text"
            placeholder="Search functions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'var(--color-panel-bg-secondary)',
                border: '1px solid var(--color-panel-border)',
                borderRadius: '8px',
                height: '32px',
                paddingLeft: '32px',
                paddingRight: '12px',
                fontSize: '12px',
                color: 'var(--color-panel-text)',
                outline: 'none',
                transition: 'border-color 0.2s ease, background-color 0.2s ease',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-panel-accent)';
                e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-panel-border)';
                e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-secondary)';
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px', paddingLeft: '8px' }}>
          {isLoading ? (
            <div style={{ color: 'var(--color-panel-text-secondary)', fontSize: '14px', padding: '16px' }}>Loading functions...</div>
          ) : filteredGroups.length === 0 ? (
            <div style={{ color: 'var(--color-panel-text-secondary)', fontSize: '14px', padding: '16px' }}>
              {searchQuery ? 'No functions found' : 'No functions available'}
            </div>
          ) : (
            filteredGroups.map((group) => {
              const isExpanded = expandedPaths.has(group.path);
              const pathName = removeJsExtension(group.path) || 'root';
              return (
                <div key={group.path} style={{ marginBottom: '16px' }}>
                  <div
                    onClick={() => togglePath(group.path)}
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--color-panel-text-muted)',
                      padding: '4px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-panel-text-secondary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-panel-text-muted)'; }}
                  >
                    <span style={{ color: 'var(--color-panel-text-muted)' }}>
                      <CodeXml size={12} />
                    </span>
                    {pathName}
                  </div>
                  {isExpanded && (
                    <div>
                      {group.functions.map((func) => {
                        const isSelected = selectedFunction?.identifier === func.identifier;
                        return (
                          <div
                            key={func.identifier}
                            onClick={() => handleFunctionClick(func)}
                            style={{
                              padding: '4px 8px',
                              marginLeft: '16px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              backgroundColor: isSelected ? 'var(--color-panel-bg-tertiary)' : 'transparent',
                              color: isSelected ? 'var(--color-panel-text)' : 'var(--color-panel-text-secondary)',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                                e.currentTarget.style.color = 'var(--color-panel-text)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
                              }
                            }}
                          >
                            <span style={{ fontSize: '10px', color: 'var(--color-panel-text-muted)', fontFamily: 'monospace', fontStyle: 'italic' }}>fn</span>
                            <span style={{ fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{removeJsExtension(func.name)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-panel-bg)' }}>
        {/* Header */}
        <div
          style={{
            height: '49px',
            borderBottom: '1px solid var(--color-panel-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 8px',
            backgroundColor: 'var(--color-panel-bg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: selectedFunction ? 'var(--color-panel-text)' : 'var(--color-panel-text-muted)' }}>
              {selectedFunction ? selectedFunction.name : 'select a function'}
            </h2>
            {selectedFunction && (
              <>
                <span style={getFunctionTypeBadgeStyle(selectedFunction.udfType)}>
                  {selectedFunction.udfType}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--color-panel-text-muted)', fontFamily: 'monospace' }}>
                  {selectedFunction.identifier.replace(/\.js:/g, ':').replace(/\.js$/g, '')}
                </span>
              </>
            )}
          </div>
          <button
            onClick={() => selectedFunction && handleRunFunction(selectedFunction)}
            disabled={!selectedFunction}
            className="cp-run-function-btn"
            style={{
              opacity: selectedFunction ? 1 : 0.5,
              cursor: selectedFunction ? 'pointer' : 'not-allowed',
            }}
          >
            <Play size={14} style={{ fill: 'currentColor' }} /> Run Function
          </button>
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid var(--color-panel-border)', display: 'flex', alignItems: 'center', paddingLeft: '' }}>
          <button
            onClick={() => setActiveTab('statistics')}
            style={{
              padding: '12px 16px',
              fontSize: '12px',
              fontWeight: 500,
              transition: 'color 0.15s',
              borderBottom: activeTab === 'statistics' ? '2px solid var(--color-panel-accent)' : '2px solid transparent',
              color: activeTab === 'statistics' ? 'var(--color-panel-text)' : 'var(--color-panel-text-muted)',
              backgroundColor: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'statistics') {
                e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'statistics') {
                e.currentTarget.style.color = 'var(--color-panel-text-muted)';
              }
            }}
          >
            Statistics
          </button>
          <button
            onClick={() => setActiveTab('code')}
            style={{
              padding: '12px 16px',
              fontSize: '12px',
              fontWeight: 500,
              transition: 'color 0.15s',
              borderBottom: activeTab === 'code' ? '2px solid var(--color-panel-accent)' : '2px solid transparent',
              color: activeTab === 'code' ? 'var(--color-panel-text)' : 'var(--color-panel-text-muted)',
              backgroundColor: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'code') {
                e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'code') {
                e.currentTarget.style.color = 'var(--color-panel-text-muted)';
              }
            }}
          >
            Code
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            style={{
              padding: '12px 16px',
              fontSize: '12px',
              fontWeight: 500,
              transition: 'color 0.15s',
              borderBottom: activeTab === 'logs' ? '2px solid var(--color-panel-accent)' : '2px solid transparent',
              color: activeTab === 'logs' ? 'var(--color-panel-text)' : 'var(--color-panel-text-muted)',
              backgroundColor: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'logs') {
                e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'logs') {
                e.currentTarget.style.color = 'var(--color-panel-text-muted)';
              }
            }}
          >
            Logs
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selectedFunction ? (
            <>
              {activeTab === 'statistics' && (
                <div style={{ padding: '16px', overflowY: 'auto' }}>
                  {/* Stats Grid - 2x2 layout */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    <HealthCard
                      title="Function Calls"
                      tip="The number of times this function has been called over the last 30 minutes, bucketed by minute."
                      loading={statsLoading}
                      error={null}
                    >
                      <div style={{ height: '100px', display: 'flex', alignItems: 'flex-end', position: 'relative', width: '100%' }}>
                        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="none" viewBox="0 0 300 100">
                          {/* Grid lines */}
                          <line x1="0" y1="25" x2="300" y2="25" stroke="var(--color-panel-border)" strokeDasharray="4" opacity="0.5" />
                          <line x1="0" y1="50" x2="300" y2="50" stroke="var(--color-panel-border)" strokeDasharray="4" opacity="0.5" />
                          <line x1="0" y1="75" x2="300" y2="75" stroke="var(--color-panel-border)" strokeDasharray="4" opacity="0.5" />
                          {/* Current time line (yellow, right edge) */}
                          <line
                            x1={getCurrentTimeX()}
                            y1="0"
                            x2={getCurrentTimeX()}
                            y2="100"
                            stroke="var(--color-panel-warning)"
                            strokeWidth="2"
                            strokeDasharray="3 3"
                            vectorEffect="non-scaling-stroke"
                          />
                          {/* Chart line */}
                          <path d={generateChartPath(invocationData)} stroke="var(--color-panel-info)" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
                        </svg>
                        <div style={{ position: 'absolute', bottom: '4px', right: 0, fontSize: '10px', color: 'var(--color-panel-text-muted)' }}>
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div style={{ position: 'absolute', bottom: '4px', left: 0, fontSize: '10px', color: 'var(--color-panel-text-muted)' }}>
                          {new Date(Date.now() - 30 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </HealthCard>

                    <HealthCard
                      title="Errors"
                      tip="The number of errors this function has encountered over the last 30 minutes, bucketed by minute."
                      loading={statsLoading}
                      error={null}
                    >
                      <div style={{ height: '100px', display: 'flex', alignItems: 'flex-end', position: 'relative', width: '100%' }}>
                        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="none" viewBox="0 0 300 100">
                          {/* Grid lines */}
                          <line x1="0" y1="25" x2="300" y2="25" stroke="var(--color-panel-border)" strokeDasharray="4" opacity="0.5" />
                          <line x1="0" y1="50" x2="300" y2="50" stroke="var(--color-panel-border)" strokeDasharray="4" opacity="0.5" />
                          <line x1="0" y1="75" x2="300" y2="75" stroke="var(--color-panel-border)" strokeDasharray="4" opacity="0.5" />
                          {/* Current time line (yellow, right edge) */}
                          <line
                            x1={getCurrentTimeX()}
                            y1="0"
                            x2={getCurrentTimeX()}
                            y2="100"
                            stroke="var(--color-panel-warning)"
                            strokeWidth="2"
                            strokeDasharray="3 3"
                            vectorEffect="non-scaling-stroke"
                          />
                          {/* Chart line */}
                          <path d={generateChartPath(errorData)} stroke="var(--color-panel-error)" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
                        </svg>
                        <div style={{ position: 'absolute', bottom: '4px', right: 0, fontSize: '10px', color: 'var(--color-panel-text-muted)' }}>
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div style={{ position: 'absolute', bottom: '4px', left: 0, fontSize: '10px', color: 'var(--color-panel-text-muted)' }}>
                          {new Date(Date.now() - 30 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </HealthCard>

                    <HealthCard
                      title="Execution Time"
                      tip="The p50 (median) execution time of this function over the last 30 minutes, bucketed by minute."
                      loading={statsLoading}
                      error={null}
                    >
                      <div style={{ height: '100px', display: 'flex', alignItems: 'flex-end', position: 'relative', width: '100%' }}>
                        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="none" viewBox="0 0 300 100">
                          {/* Grid lines */}
                          <line x1="0" y1="25" x2="300" y2="25" stroke="var(--color-panel-border)" strokeDasharray="4" opacity="0.5" />
                          <line x1="0" y1="50" x2="300" y2="50" stroke="var(--color-panel-border)" strokeDasharray="4" opacity="0.5" />
                          <line x1="0" y1="75" x2="300" y2="75" stroke="var(--color-panel-border)" strokeDasharray="4" opacity="0.5" />
                          {/* Current time line (yellow, right edge) */}
                          <line
                            x1={getCurrentTimeX()}
                            y1="0"
                            x2={getCurrentTimeX()}
                            y2="100"
                            stroke="var(--color-panel-warning)"
                            strokeWidth="2"
                            strokeDasharray="3 3"
                            vectorEffect="non-scaling-stroke"
                          />
                          {/* Chart line */}
                          <path d={generateChartPath(executionTimeData)} stroke="var(--color-panel-success)" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
                        </svg>
                        <div style={{ position: 'absolute', bottom: '4px', right: 0, fontSize: '10px', color: 'var(--color-panel-text-muted)' }}>
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div style={{ position: 'absolute', bottom: '4px', left: 0, fontSize: '10px', color: 'var(--color-panel-text-muted)' }}>
                          {new Date(Date.now() - 30 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </HealthCard>

                    {/* Cache Hit Rate Card - only show for queries */}
                    {selectedFunction.udfType === 'query' ? (
                      <HealthCard
                        title="Cache Hit Rate"
                        tip="The percentage of queries served from cache vs executed fresh, over the last 30 minutes, bucketed by minute."
                        loading={statsLoading}
                        error={null}
                      >
                        <div style={{ height: '100px', display: 'flex', alignItems: 'flex-end', position: 'relative', width: '100%' }}>
                          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="none" viewBox="0 0 300 100">
                            {/* Grid lines */}
                            <line x1="0" y1="25" x2="300" y2="25" stroke="var(--color-panel-border)" strokeDasharray="4" opacity="0.5" />
                            <line x1="0" y1="50" x2="300" y2="50" stroke="var(--color-panel-border)" strokeDasharray="4" opacity="0.5" />
                            <line x1="0" y1="75" x2="300" y2="75" stroke="var(--color-panel-border)" strokeDasharray="4" opacity="0.5" />
                            {/* Current time line (yellow, right edge) */}
                            <line
                              x1={getCurrentTimeX()}
                              y1="0"
                              x2={getCurrentTimeX()}
                              y2="100"
                              stroke="var(--color-panel-warning)"
                              strokeWidth="2"
                              strokeDasharray="3 3"
                              vectorEffect="non-scaling-stroke"
                            />
                            {/* Chart line */}
                            <path d={generateChartPath(cacheHitData)} stroke="var(--color-panel-info)" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
                          </svg>
                          <div style={{ position: 'absolute', bottom: '4px', right: 0, fontSize: '10px', color: 'var(--color-panel-text-muted)' }}>
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div style={{ position: 'absolute', bottom: '4px', left: 0, fontSize: '10px', color: 'var(--color-panel-text-muted)' }}>
                            {new Date(Date.now() - 30 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </HealthCard>
                    ) : (
                      // Empty placeholder for non-query functions to maintain 2x2 grid
                      <div></div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'code' && (
                <div
                  style={{
                    flex: 1,
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    minHeight: 0,
                  }}
                >
                  <Card
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      minHeight: 0,
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0,
                      }}
                    >
                      <div style={{ marginBottom: '16px', flexShrink: 0 }}>
                        <div style={{ fontSize: '14px', color: 'var(--color-panel-text-secondary)', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 600 }}>Path: </span>
                          {selectedFunction.file?.path ? removeJsExtension(selectedFunction.file.path) : 'N/A'}
                        </div>
                        {selectedFunction.args && typeof selectedFunction.args === 'string' && (
                          <div style={{ fontSize: '14px', color: 'var(--color-panel-text-secondary)', marginBottom: '16px' }}>
                            <span style={{ fontWeight: 600 }}>Args Validator: </span>
                            <pre
                              style={{
                                backgroundColor: 'var(--color-panel-code-bg)',
                                padding: '8px',
                                borderRadius: '4px',
                                marginTop: '8px',
                                fontSize: '12px',
                                fontFamily: 'monospace',
                                overflowX: 'auto',
                                color: 'var(--color-panel-text)',
                              }}
                            >
                              {selectedFunction.args}
                            </pre>
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          minHeight: 0,
                          overflow: 'hidden',
                        }}
                      >
                        {codeLoading ? (
                          <div
                            style={{
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--color-panel-text-muted)',
                              fontSize: '14px',
                              padding: '32px',
                              textAlign: 'center',
                            }}
                          >
                            Loading source code...
                          </div>
                        ) : sourceCode && sourceCode !== 'null' ? (
                          <div
                            style={{
                              height: '100%',
                              border: '1px solid var(--color-panel-border)',
                              borderRadius: '4px',
                              overflow: 'hidden',
                            }}
                          >
                            <Editor
                              height="100%"
                              language={getLanguageFromPath(selectedFunction.file?.path)}
                              theme={monacoTheme}
                              value={sourceCode}
                              beforeMount={handleEditorWillMount}
                              options={{
                                automaticLayout: true,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                fontSize: 13,
                                fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                                lineNumbers: 'on',
                                lineNumbersMinChars: 3,
                                scrollbar: {
                                  horizontalScrollbarSize: 8,
                                  verticalScrollbarSize: 8,
                                },
                                wordWrap: 'on',
                                tabSize: 2,
                                readOnly: true,
                                domReadOnly: true,
                                contextmenu: true,
                                selectOnLineNumbers: true,
                                glyphMargin: false,
                                folding: true,
                                lineDecorationsWidth: 10,
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            style={{
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--color-panel-text-muted)',
                              fontSize: '14px',
                              padding: '32px',
                              textAlign: 'center',
                            }}
                          >
                            Source code not available
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {activeTab === 'logs' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
                  <div
                    style={{
                      padding: '8px',
                      borderBottom: '1px solid var(--color-panel-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'var(--color-panel-bg)',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ position: 'relative', flex: 1, marginRight: '16px' }}>
                      <Search
                        style={{
                          position: 'absolute',
                          left: '10px',
                          top: '10px',
                          width: '14px',
                          height: '14px',
                          color: 'var(--color-panel-text-muted)',
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Filter logs..."
                        style={{
                          width: '100%',
                          backgroundColor: 'var(--color-panel-bg-tertiary)',
                          border: '1px solid var(--color-panel-border)',
                          borderRadius: '6px',
                          height: '32px',
                          paddingLeft: '32px',
                          paddingRight: '12px',
                          fontSize: '12px',
                          color: 'var(--color-panel-text)',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <button
                      onClick={() => setIsPaused(!isPaused)}
                      style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        borderRadius: '6px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: isPaused ? 'var(--color-panel-bg-tertiary)' : 'var(--color-panel-accent)',
                        color: isPaused ? 'var(--color-panel-text-secondary)' : 'var(--color-panel-text)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s, color 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        if (isPaused) {
                          e.currentTarget.style.color = 'var(--color-panel-text)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isPaused) {
                          e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
                        }
                      }}
                    >
                      <Pause size={12} /> {isPaused ? 'Resume' : 'Pause'}
                    </button>
                  </div>

                  <div
                    style={{
                      flex: 1,
                      overflow: 'auto',
                      backgroundColor: 'var(--color-panel-bg)',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        borderBottom: '1px solid var(--color-panel-border)',
                        color: 'var(--color-panel-text-muted)',
                        padding: '4px 16px',
                        position: 'sticky',
                        top: 0,
                        backgroundColor: 'var(--color-panel-bg)',
                        zIndex: 10,
                      }}
                    >
                      <div style={{ width: '160px' }}>Timestamp</div>
                      <div style={{ width: '80px' }}>ID</div>
                      <div style={{ width: '128px' }}>Status</div>
                      <div style={{ flex: 1 }}>Function</div>
                    </div>

                    {logsLoading && logs.length === 0 ? (
                      <div style={{ color: 'var(--color-panel-text-muted)', fontSize: '14px', padding: '32px', textAlign: 'center' }}>Loading logs...</div>
                    ) : logs.length === 0 ? (
                      <div style={{ color: 'var(--color-panel-text-muted)', fontSize: '14px', padding: '32px', textAlign: 'center' }}>No logs available</div>
                    ) : (
                      logs.map((log, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            padding: '4px 16px',
                            cursor: 'pointer',
                            backgroundColor:
                              selectedExecution?.id === log.id
                                ? 'var(--color-panel-bg-tertiary)'
                                : 'transparent',
                          }}
                          onClick={() => {
                            setSelectedExecution(log);
                            setIsDetailOpen(true);
                          }}
                          onMouseEnter={(e) => {
                            if (selectedExecution?.id !== log.id) {
                              e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedExecution?.id !== log.id) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <div style={{ width: '160px', color: 'var(--color-panel-text-secondary)' }}>{formatTimestamp(log.timestamp)}</div>
                          <div style={{ width: '80px', color: 'var(--color-panel-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span
                              style={{
                                border: '1px solid var(--color-panel-border)',
                                borderRadius: '4px',
                                padding: '0 4px',
                                fontSize: '10px',
                              }}
                            >
                              {log.requestId?.slice(0, 4) || 'N/A'}
                            </span>
                          </div>
                          <div style={{ width: '128px', color: 'var(--color-panel-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {log.success ? (
                              <>
                                <span style={{ color: 'var(--color-panel-success)' }}>200</span>
                                {log.durationMs && (
                                  <span style={{ color: 'var(--color-panel-text-muted)' }}>{log.durationMs.toFixed(0)}ms</span>
                                )}
                              </>
                            ) : log.error ? (
                              <span style={{ color: 'var(--color-panel-error)' }}>Error</span>
                            ) : (
                              <span style={{ color: 'var(--color-panel-text-muted)' }}>-</span>
                            )}
                          </div>
                          <div style={{ flex: 1, color: 'var(--color-panel-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                width: '16px',
                                textAlign: 'center',
                                color: 'var(--color-panel-text-muted)',
                                fontWeight: 700,
                                fontSize: '10px',
                              }}
                            >
                              {log.udfType === 'query' ? 'Q' : log.udfType === 'mutation' ? 'M' : log.udfType === 'action' ? 'A' : 'H'}
                            </span>
                            <span style={{ color: 'var(--color-panel-text-muted)' }}>{log.functionIdentifier}</span>
                            {log.error && (
                              <span style={{ color: 'var(--color-panel-error)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.error}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Detail sheet */}
                  <FunctionExecutionDetailSheet
                    log={selectedExecution}
                    isOpen={isDetailOpen}
                    onClose={() => setIsDetailOpen(false)}
                  />
                </div>
              )}
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
              <EmptyFunctionsState />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
