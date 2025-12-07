import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Pause,
  Play,
  X,
  Copy,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Info,
  AlertCircle,
  XCircle,
  ArrowUp,
} from 'lucide-react';
import { useLogs } from '../../hooks/useLogs';
import type { LogEntry } from '../../types';
import { MultiSelectComponentSelector } from '../../components/function-runner/multi-select-component-selector';
import { MultiSelectFunctionSelector } from '../../components/function-runner/multi-select-function-selector';
import { MultiSelectLogTypeSelector } from '../../components/function-runner/multi-select-log-type-selector';
import type { MultiSelectValue } from '../../types/common';
import { useComponents } from '../../hooks/useComponents';
import { discoverFunctions } from '../../utils/api/functionDiscovery';
import type { ModuleFunction } from '../../utils/api/functionDiscovery';
import type { CustomQuery } from '../../types/functions';
import { Sheet } from '../../components/shared/sheet';
import { TooltipAction } from '../../components/shared/tooltip-action';
import { Card } from '../../components/shared/card';

export interface LogsViewProps {
  convexUrl?: string;
  accessToken: string;
  baseUrl?: string;
  adminClient?: any;
  useMockData?: boolean;
  onError?: (error: string) => void;
}

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const month = date.toLocaleString('default', { month: 'short' });
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const ms = date.getMilliseconds();
  return `${month} ${day}, ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};

const formatDateTime = (timestamp: number): string => {
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

const formatBytes = (bytes?: number): string => {
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

const formatCompute = (memoryMb?: number, durationMs?: number) => {
  if (!memoryMb || !durationMs) return '0.0000000 GB-hr (0 MB for 0s)';
  const memoryGb = memoryMb / 1024;
  const durationHours = durationMs / (1000 * 60 * 60);
  const gbHours = memoryGb * durationHours;
  const durationSeconds = durationMs / 1000;
  return `${gbHours.toFixed(7)} GB-hr (${memoryMb} MB for ${durationSeconds.toFixed(2)}s)`;
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

export const LogsView: React.FC<LogsViewProps> = ({
  convexUrl,
  accessToken,
  baseUrl,
  adminClient,
  useMockData = false,
  onError,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFunctions, setSelectedFunctions] = useState<(ModuleFunction | CustomQuery)[]>([]);
  const [selectedLogTypes, setSelectedLogTypes] = useState<string[]>(['success', 'failure', 'debug', 'log / info', 'warn', 'error']);
  const [functions, setFunctions] = useState<ModuleFunction[]>([]);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const [isScrolledAway, setIsScrolledAway] = useState(false);
  const logsContainerRef = React.useRef<HTMLDivElement>(null);
  const logsListRef = React.useRef<HTMLDivElement>(null);
  const scrollStateRef = React.useRef<{ isScrolledAway: boolean; rafId: number | null }>({
    isScrolledAway: false,
    rafId: null,
  });

  const {
    componentNames,
    selectedComponent,
    setSelectedComponent,
    componentNameToId,
  } = useComponents({
    adminClient,
    useMockData,
  });

  // Initialize with all components selected
  const [selectedComponents, setSelectedComponents] = useState<MultiSelectValue>('all');

  // Update selected components when componentNames change (e.g., on initial load)
  // Initialize with all components selected by default
  useEffect(() => {
    if (componentNames.length > 0) {
      // Only set if we don't have any selected, or if the component list changed significantly
      const currentSelection = selectedComponents === 'all' ? componentNames : (selectedComponents as string[]);
      const hasAllComponents = componentNames.every(name => currentSelection.includes(name));
      if (selectedComponents === 'all' || currentSelection.length === 0 || !hasAllComponents) {
        setSelectedComponents('all');
      }
    }
  }, [componentNames]); // eslint-disable-line react-hooks/exhaustive-deps

  // Determine functionId to pass to useLogs (only if single function selected)
  const functionIdForApi = useMemo(() => {
    if (selectedFunctions.length !== 1) return undefined;
    const selectedFunction = selectedFunctions[0];
    if ('type' in selectedFunction && selectedFunction.type === 'customQuery') {
      return undefined;
    }
    return (selectedFunction as ModuleFunction).identifier;
  }, [selectedFunctions]);

  const {
    logs,
    isLoading,
    error,
    setIsPaused,
    clearLogs,
  } = useLogs({
    convexUrl: convexUrl || baseUrl,
    accessToken,
    useMockData,
    onError,
    functionId: functionIdForApi,
  });

  // Compute effective pause state
  const effectiveIsPaused = manuallyPaused || (isScrolledAway && !isSheetOpen);

  // Sync effective pause state to useLogs hook
  useEffect(() => {
    setIsPaused(effectiveIsPaused);
  }, [effectiveIsPaused, setIsPaused]);

  // Fetch functions
  useEffect(() => {
    if (!adminClient || useMockData) return;

    discoverFunctions(adminClient, useMockData)
      .then((funcs) => {
        setFunctions(funcs);
      })
      .catch((error) => {
        console.error('Error fetching functions:', error);
        setFunctions([]);
      })
  }, [adminClient, useMockData]);

  // Auto-select all functions when functions are loaded or component changes
  useEffect(() => {
    // Only auto-select if no functions are currently selected
    if (functions.length > 0 && selectedFunctions.length === 0) {
      // Use the same filtering logic as MultiSelectFunctionSelector
      // If selectedComponent is null, it means all components are selected, so show 'app' functions
      const normalizedComponentId = selectedComponent === 'app' ? null : selectedComponent;
      
      const filteredFuncs = functions.filter((fn: ModuleFunction) => {
        if (!normalizedComponentId) {
          // Show functions from 'app' (componentId === null or undefined)
          return fn.componentId === null || fn.componentId === undefined;
        } else {
          // Show functions matching the selected component
          return (
            (!!fn.identifier && fn.identifier.startsWith(`${normalizedComponentId}:`)) ||
            fn.componentId === normalizedComponentId
          );
        }
      });
      
      // Select all filtered functions
      if (filteredFuncs.length > 0) {
        setSelectedFunctions(filteredFuncs);
      }
    }
  }, [functions, selectedComponent]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          log.message?.toLowerCase().includes(query) ||
          log.function?.path?.toLowerCase().includes(query) ||
          log.function?.request_id?.toLowerCase().includes(query) ||
          log.error_message?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Filter by component (if component selector is used)
      const componentsArray = selectedComponents === 'all' ? componentNames : (selectedComponents as string[]);
      
      // If no components selected, show all (shouldn't happen, but handle it)
      if (componentsArray.length === 0) {
        return false; // No components selected means show nothing
      }

      // If all components are selected, show all logs
      if (selectedComponents === 'all' || componentsArray.length === componentNames.length) {
        // Show all logs
      } else if (log.function?.path) {
        // Check if log belongs to any selected component
        const pathParts = log.function.path.split(':');
        const componentMatch = pathParts.length > 1 ? pathParts[0] : null;
        
        let matchesAnySelected = false;
        
        for (const selectedComp of componentsArray) {
          if (selectedComp === 'app') {
            // If 'app' is selected, match logs without component prefix
            if (!componentMatch) {
              matchesAnySelected = true;
              break;
            }
          } else {
            // Check component name match
            if (componentMatch === selectedComp) {
              matchesAnySelected = true;
              break;
            }
            
            // Check component ID match
            const componentId = componentNameToId.get(selectedComp);
            if (componentId && componentMatch === componentId) {
              matchesAnySelected = true;
              break;
            }
            
            // Check log's componentId field from raw data
            const logComponentId = (log.raw as any)?.component_id;
            if (logComponentId && (logComponentId === selectedComp || logComponentId === componentId)) {
              matchesAnySelected = true;
              break;
            }
          }
        }
        
        if (!matchesAnySelected) {
          return false;
        }
      } else {
        // Log has no function path - only show if 'app' is selected
        if (!componentsArray.includes('app')) {
          return false;
        }
      }

      // Filter by function(s)
      if (selectedFunctions.length > 0) {
        // Get all available functions for the selected component(s) to check if "all" are selected
        const normalizedComponentId = selectedComponent === 'app' ? null : selectedComponent;
        const availableFunctionsForComponent = functions.filter((fn: ModuleFunction) => {
          if (!normalizedComponentId) {
            return fn.componentId === null || fn.componentId === undefined;
          } else {
            return (
              (!!fn.identifier && fn.identifier.startsWith(`${normalizedComponentId}:`)) ||
              fn.componentId === normalizedComponentId
            );
          }
        });
        
        // If all available functions are selected, show all logs for this component
        const allFunctionsSelected = availableFunctionsForComponent.length > 0 && 
          availableFunctionsForComponent.every(availableFn => 
            selectedFunctions.some(selectedFn => {
              if ('type' in selectedFn) return false;
              return (selectedFn as ModuleFunction).identifier === availableFn.identifier;
            })
          );
        
        if (!allFunctionsSelected) {
          // Check if log matches any selected function
          let matchesAnyFunction = false;
          
          for (const selectedFunction of selectedFunctions) {
            if ('type' in selectedFunction && selectedFunction.type === 'customQuery') {
              // Don't filter by custom query - show all
              matchesAnyFunction = true;
              break;
            }
            const functionIdentifier = (selectedFunction as ModuleFunction).identifier;
            if (functionIdentifier && log.function?.path) {
              // Try exact match first
              if (log.function.path === functionIdentifier) {
                matchesAnyFunction = true;
                break;
              }
              // Try matching without .js extension
              const identifierWithoutJs = functionIdentifier.replace(/\.js:/g, ':').replace(/\.js$/g, '');
              const logPathWithoutJs = log.function.path.replace(/\.js:/g, ':').replace(/\.js$/g, '');
              if (logPathWithoutJs === identifierWithoutJs) {
                matchesAnyFunction = true;
                break;
              }
            }
          }
          
          if (!matchesAnyFunction) {
            return false;
          }
        }
      }

      // Filter by log type(s)
      if (selectedLogTypes.length > 0 && selectedLogTypes.length < 6) {
        // Not all log types selected, need to filter
        let matchesAnyLogType = false;
        
        // Determine log type from log entry
        const status = log.status || (log.function?.cached ? 'cached' : undefined);
        const logLevel = log.log_level?.toLowerCase();
        const hasError = log.error_message || status === 'error' || status === 'failure';
        
        for (const logType of selectedLogTypes) {
          if (logType === 'success' && status === 'success') {
            matchesAnyLogType = true;
            break;
          }
          if (logType === 'failure') {
            // Match failures: status is error/failure, or has error_message
            if (status === 'error' || status === 'failure' || hasError) {
              matchesAnyLogType = true;
              break;
            }
          }
          if (logType === 'debug' && logLevel === 'debug') {
            matchesAnyLogType = true;
            break;
          }
          if (logType === 'log / info') {
            // Match info/log level or logs without explicit level (default to info)
            if (logLevel === 'info' || logLevel === 'log' || (!logLevel && !hasError && status !== 'success' && status !== 'error' && status !== 'failure')) {
              matchesAnyLogType = true;
              break;
            }
          }
          if (logType === 'warn' && (logLevel === 'warn' || logLevel === 'warning')) {
            matchesAnyLogType = true;
            break;
          }
          if (logType === 'error') {
            // Match error log level or error status
            if (logLevel === 'error' || status === 'error' || hasError) {
              matchesAnyLogType = true;
              break;
            }
          }
        }
        
        if (!matchesAnyLogType) {
          return false;
        }
      }

      return true;
    });
  }, [logs, searchQuery, selectedComponents, componentNames, componentNameToId, selectedFunctions, selectedLogTypes]);

  const handleError = (error: Error | string | null) => {
    if (error && onError) {
      onError(error instanceof Error ? error.message : error);
    }
  };

  React.useEffect(() => {
    if (error) {
      handleError(error);
    }
  }, [error, onError]);

  // Handle scroll detection for auto-pause
  const handleLogsScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const scrolledAway = scrollTop > 0;
    
    if (scrollStateRef.current.rafId !== null) {
      cancelAnimationFrame(scrollStateRef.current.rafId);
    }
    
    if (!manuallyPaused && !isSheetOpen && scrollStateRef.current.isScrolledAway !== scrolledAway) {
      scrollStateRef.current.isScrolledAway = scrolledAway;
      
      scrollStateRef.current.rafId = requestAnimationFrame(() => {
        setIsScrolledAway(scrolledAway);
        scrollStateRef.current.rafId = null;
      });
    }
  }, [manuallyPaused, isSheetOpen]);

  // Reset scroll state when sheet closes and user is at top
  useEffect(() => {
    if (!isSheetOpen && logsListRef.current) {
      const scrollTop = logsListRef.current.scrollTop;
      if (scrollTop === 0 && !manuallyPaused) {
        scrollStateRef.current.isScrolledAway = false;
        setIsScrolledAway(false);
      }
    }
  }, [isSheetOpen, manuallyPaused]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (scrollStateRef.current.rafId !== null) {
        cancelAnimationFrame(scrollStateRef.current.rafId);
      }
    };
  }, []);

  // Helper function to process log data for display
  const processLogData = (log: LogEntry) => {
    const requestId = log.function?.request_id || '';
    const shortId = requestId ? requestId.slice(0, 4) : '-';
    const status = log.status || (log.function?.cached ? 'cached' : undefined);
    const executionTime = log.execution_time_ms
      ? `${Math.round(log.execution_time_ms)}ms`
      : undefined;

    // Check for cached result - check multiple sources
    const isCached = log.function?.cached || log.raw?.cachedResult || log.raw?.cached || false;
    
    // Determine if success (not error/failure)
    const isSuccess = status === 'success' || (status !== 'error' && status !== 'failure' && !log.error_message);

    // Parse function path to get identifier and name
    const functionPath = log.function?.path || log.topic || '';
    const pathParts = functionPath.split(':');
    const functionIdentifier = pathParts.length > 1 ? pathParts[0] : '';
    const functionName = pathParts.length > 1 ? pathParts[1] : functionPath;
    
    let displayFunctionName = functionName;
    let matchingFunction: ModuleFunction | undefined;
    if (functionPath && functions.length > 0) {
      matchingFunction = functions.find((fn: ModuleFunction) => {
        const fnIdentifier = fn.identifier.replace(/\.js:/g, ':').replace(/\.js$/g, '');
        const logPath = functionPath.replace(/\.js:/g, ':').replace(/\.js$/g, '');
        return fnIdentifier === logPath || fnIdentifier.endsWith(`:${functionName}`);
      });
      if (matchingFunction && matchingFunction.name) {
        displayFunctionName = matchingFunction.name;
      }
    }
    
    // Determine function type - check multiple sources and normalize
    const rawType = matchingFunction?.udfType 
      || log.function?.type 
      || log.raw?.udfType 
      || log.raw?.udf_type 
      || log.raw?.type;
    
    // Normalize the type (lowercase and trim)
    const normalizedType = rawType ? String(rawType).toLowerCase().trim() : undefined;
    
    // Map to standard types (handle variations like 'httpAction' -> 'action')
    const functionType = normalizedType === 'query' || normalizedType === 'mutation' || normalizedType === 'action'
      ? normalizedType
      : normalizedType === 'httpaction' || normalizedType === 'http_action'
      ? 'action'
      : undefined;
    
    // Get the icon based on function type
    const logTypeIcon = functionType === 'query' ? 'Q' 
      : functionType === 'mutation' ? 'M'
      : functionType === 'action' ? 'A'
      : log.topic === 'http' ? 'H'
      : 'L';

    const isError = status === 'error' || status === 'failure' || !!log.error_message;

    // Get log lines from raw data
    const logLines = log.raw?.logLines || log.raw?.log_lines || log.raw?.log || [];

    return {
      shortId,
      executionTime,
      functionIdentifier,
      displayFunctionName,
      logTypeIcon,
      isError,
      status,
      isSuccess,
      isCached,
      logLines,
    };
  };

  return (
    <div
      ref={logsContainerRef}
      className="cp-logs-container"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Toolbar */}
      <div style={{
        padding: '8px',
        borderBottom: '1px solid var(--color-panel-border)',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        backgroundColor: 'var(--color-panel-bg)',
      }}>
        {componentNames && componentNames.length > 0 && (
          <div style={{ width: '192px' }}>
            <MultiSelectComponentSelector
              selectedComponents={selectedComponents}
              onSelect={(components) => {
                setSelectedComponents(components);
                setSelectedFunctions([]); // Reset functions when component changes
                // Also update the single component selector for compatibility
                const componentsArray = components === 'all' ? componentNames : (components as string[]);
                if (componentsArray.length === 1) {
                  setSelectedComponent(componentsArray[0]);
                } else if (componentsArray.length === 0) {
                  setSelectedComponent(null);
                } else {
                  // Multiple selected - keep the first one for function selector
                  setSelectedComponent(componentsArray[0]);
                }
              }}
              components={componentNames}
            />
          </div>
        )}
        <div style={{ width: '240px' }}>
          <MultiSelectFunctionSelector
            selectedFunctions={selectedFunctions}
            onSelect={(fns) => setSelectedFunctions(fns)}
            functions={functions}
            componentId={selectedComponent}
          />
        </div>
        <div style={{ width: '192px' }}>
          <MultiSelectLogTypeSelector
            selectedLogTypes={selectedLogTypes}
            onSelect={(logTypes: string[] | MultiSelectValue) => setSelectedLogTypes(logTypes as string[])}
          />
        </div>
        <div style={{ flex: 1, maxWidth: '384px' }}>
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
              placeholder="Filter logs..."
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
      </div>

      {/* Logs Table */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'visible' }}>
        <div
          ref={logsListRef}
          onScroll={handleLogsScroll}
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
              padding: '4px 8px',
              position: 'sticky',
              top: 0,
              backgroundColor: 'var(--color-panel-bg)',
              zIndex: 10,
              alignItems: 'center',
            }}
          >
            <div style={{ width: '160px' }}>Timestamp</div>
            <div style={{ width: '80px' }}>ID</div>
            <div style={{ width: '128px' }}>Status</div>
            <div style={{ flex: 1 }}>Function</div>
            <div style={{ flexShrink: 0, marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={clearLogs}
                style={{
                  height: '30px',
                  padding: '8px 16px',
                  fontSize: '11px',
                  borderRadius: '8px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  border: '1px solid var(--color-panel-border)',
                  backgroundColor: 'var(--color-panel-bg-tertiary)',
                  color: 'var(--color-panel-text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-panel-accent)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
                  e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
                }}
              >
                Clear Logs
              </button>
              <button
                onClick={() => {
                  const isCurrentlyPaused = manuallyPaused || (isScrolledAway && !isSheetOpen);
                  if (isCurrentlyPaused) {
                    logsListRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                    setManuallyPaused(false);
                  } else {
                    setManuallyPaused(true);
                  }
                }}
                style={{
                  height: '30px',
                  padding: '8px 16px',
                  fontSize: '11px',
                  borderRadius: '8px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  border: (manuallyPaused || (isScrolledAway && !isSheetOpen)) ? 'none' : '1px solid var(--color-panel-border)',
                  backgroundColor: (manuallyPaused || (isScrolledAway && !isSheetOpen)) ? 'var(--color-panel-accent)' : 'var(--color-panel-bg-tertiary)',
                  color: (manuallyPaused || (isScrolledAway && !isSheetOpen)) ? '#fff' : 'var(--color-panel-text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => {
                  const isCurrentlyPaused = manuallyPaused || (isScrolledAway && !isSheetOpen);
                  if (!isCurrentlyPaused) {
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-accent)';
                    e.currentTarget.style.color = '#fff';
                  } else {
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-accent-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  const isCurrentlyPaused = manuallyPaused || (isScrolledAway && !isSheetOpen);
                  if (!isCurrentlyPaused) {
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
                    e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
                  } else {
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-accent)';
                  }
                }}
              >
                {(manuallyPaused || (isScrolledAway && !isSheetOpen)) ? (
                  <>
                    <Play size={10} /> Go Live{isScrolledAway && !isSheetOpen ? <ArrowUp size={10} /> : ''}
                  </>
                ) : (
                  <>
                    <Pause size={10} /> Pause
                  </>
                )}
              </button>
            </div>
          </div>

          {isLoading && logs.length === 0 ? (
            <div style={{ color: 'var(--color-panel-text-muted)', fontSize: '14px', padding: '32px', textAlign: 'center' }}>Loading logs...</div>
          ) : error && logs.length === 0 ? (
            <div style={{ color: 'var(--color-panel-error)', fontSize: '14px', padding: '32px', textAlign: 'center' }}>
              Error loading logs: {error instanceof Error ? error.message : String(error)}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ color: 'var(--color-panel-text-muted)', fontSize: '14px', padding: '32px', textAlign: 'center' }}>
              {searchQuery || (selectedComponents !== 'all' && (selectedComponents as string[]).length < componentNames.length) || selectedFunctions.length > 0 || selectedLogTypes.length < 6
                ? 'No logs match your filters'
                : 'No logs yet'}
            </div>
          ) : (
            filteredLogs.map((log, i) => {
              const logData = processLogData(log);
              const isRowSelected = selectedLog && 
                selectedLog.timestamp === log.timestamp && 
                selectedLog.function?.request_id === log.function?.request_id;

              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    padding: '4px 16px',
                    cursor: 'pointer',
                    backgroundColor: logData.isError
                      ? 'color-mix(in srgb, var(--color-background-error) 50%, transparent)'
                      : isRowSelected
                      ? 'var(--color-panel-bg-tertiary)'
                      : 'transparent',
                  }}
                  onClick={() => {
                    setSelectedLog(log);
                    setIsSheetOpen(true);
                  }}
                  onMouseEnter={(e) => {
                    if (!isRowSelected) {
                      e.currentTarget.style.backgroundColor = logData.isError
                        ? 'color-mix(in srgb, var(--color-background-error) 60%, transparent)'
                        : 'var(--color-panel-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isRowSelected) {
                      e.currentTarget.style.backgroundColor = logData.isError
                        ? 'color-mix(in srgb, var(--color-background-error) 50%, transparent)'
                        : 'transparent';
                    }
                  }}
                >
                  <div style={{ width: '160px', color: logData.isError ? 'var(--color-panel-error)' : 'var(--color-panel-text-secondary)' }}>
                    {formatTimestamp(log.timestamp)}
                  </div>
                  <div style={{ width: '80px', color: logData.isError ? 'var(--color-panel-error)' : 'var(--color-panel-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {logData.shortId !== '-' && (
                      <span
                        style={{
                          border: logData.isError
                            ? '1px solid var(--color-background-errorSecondary)'
                            : '1px solid var(--color-panel-border)',
                          borderRadius: '6px',
                          padding: '0 4px',
                          fontSize: '10px',
                          backgroundColor: logData.isError
                            ? 'color-mix(in srgb, var(--color-panel-error) 10%, transparent)'
                            : 'transparent',
                          color: logData.isError ? 'var(--color-panel-error)' : 'var(--color-panel-text-muted)',
                          transition: 'border-color 0.2s ease',
                          cursor: 'pointer',
                        }}
                      >
                        {logData.shortId}
                      </span>
                    )}
                  </div>
                  <div style={{ width: '128px', color: logData.isError ? 'var(--color-panel-error)' : 'var(--color-panel-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {logData.isSuccess ? (
                      <>
                        <span style={{ color: 'var(--color-panel-success)' }}>200</span>
                        {logData.isCached ? (
                          <span style={{ color: 'var(--color-panel-success)', fontSize: '11px', fontWeight: 500 }}>(cached)</span>
                        ) : logData.executionTime ? (
                          <span style={{ color: 'var(--color-panel-text-muted)' }}>{logData.executionTime}</span>
                        ) : null}
                      </>
                    ) : logData.isError ? (
                      <>
                        <XCircle size={14} style={{ color: 'var(--color-panel-error)', flexShrink: 0 }} />
                        <span style={{ color: 'var(--color-panel-error)' }}>failure</span>
                        {logData.executionTime && (
                          <span style={{ color: 'var(--color-panel-text-muted)' }}>{logData.executionTime}</span>
                        )}
                      </>
                    ) : (
                      <span style={{ color: 'var(--color-panel-text-muted)' }}>-</span>
                    )}
                  </div>
                  <div style={{ flex: 1, color: logData.isError ? 'var(--color-panel-error)' : 'var(--color-panel-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
                    <span
                      style={{
                        borderRadius: '6px',
                        padding: '0px',
                        fontSize: '10px',
                        backgroundColor: logData.isError
                          ? 'color-mix(in srgb, var(--color-panel-error) 10%, transparent)'
                          : 'var(--color-panel-bg-tertiary)',
                        fontWeight: 700,
                        textAlign: 'center',
                        minWidth: '16px',
                        flexShrink: 0,
                      }}
                    >
                      {logData.logTypeIcon}
                    </span>
                    {logData.functionIdentifier && (
                      <span
                        style={{
                          color: logData.isError
                            ? 'var(--color-panel-error)'
                            : 'var(--color-panel-text-muted)',
                          marginRight: '4px',
                          fontFamily: 'monospace',
                          flexShrink: 0,
                        }}
                      >
                        {logData.functionIdentifier}:
                      </span>
                    )}
                    <span
                      style={{
                        color: 'var(--color-panel-text-muted)',
                        flexShrink: 0,
                        marginRight: '8px',
                      }}
                      title={logData.functionIdentifier ? `${logData.functionIdentifier}:${logData.displayFunctionName}` : logData.displayFunctionName}
                    >
                      {logData.displayFunctionName}
                    </span>
                    {(() => {
                      if (!logData.logLines || !Array.isArray(logData.logLines) || logData.logLines.length === 0) {
                        return null;
                      }
                      
                      const nonEmptyLogLines = logData.logLines.filter((line: any) => {
                        if (line === null || line === undefined) {
                          return false;
                        }
                        
                        if (typeof line === 'string') {
                          const trimmed = line.trim();
                          const isValid = trimmed.length > 0 && 
                                 trimmed !== '{}' && 
                                 trimmed !== '[]' &&
                                 trimmed !== 'null' &&
                                 trimmed !== 'undefined';
                          return isValid;
                        }
                        
                        try {
                          const stringified = JSON.stringify(line);
                          const trimmed = stringified.trim();
                          const isValid = trimmed.length > 2 && 
                                 trimmed !== '{}' && 
                                 trimmed !== '[]' &&
                                 trimmed !== 'null' &&
                                 trimmed !== 'undefined';
                          return isValid;
                        } catch (e) {
                          return false;
                        }
                      });
                      
                      if (nonEmptyLogLines.length === 0) {
                        return null;
                      }
                      
                      const firstLogLine = nonEmptyLogLines[0];
                      let logPreview: string;
                      
                      if (firstLogLine && typeof firstLogLine === 'object' && !Array.isArray(firstLogLine) && firstLogLine.messages && Array.isArray(firstLogLine.messages) && firstLogLine.messages.length > 0) {
                        const firstMessage = firstLogLine.messages[0];
                        if (typeof firstMessage === 'string') {
                          try {
                            const parsed = JSON.parse(firstMessage);
                            logPreview = JSON.stringify(parsed);
                          } catch {
                            logPreview = firstMessage.trim();
                          }
                        } else {
                          logPreview = typeof firstMessage === 'string' ? firstMessage.trim() : JSON.stringify(firstMessage);
                        }
                      } else if (typeof firstLogLine === 'string') {
                        logPreview = firstLogLine.trim();
                      } else {
                        try {
                          logPreview = JSON.stringify(firstLogLine);
                        } catch (e) {
                          return null;
                        }
                      }
                      
                      if (!logPreview || logPreview.length === 0 || 
                          logPreview === '{}' || logPreview === '[]' ||
                          logPreview === 'null' || logPreview === 'undefined') {
                        return null;
                      }
                      
                      return (
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            flex: 1,
                            minWidth: 0,
                            overflow: 'hidden',
                          }}
                        >
                          <span
                            style={{
                              borderRadius: '4px',
                              padding: '2px 4px',
                              fontSize: '10px',
                              backgroundColor: 'var(--color-panel-bg-secondary)',
                              color: 'var(--color-panel-text-secondary)',
                              fontFamily: 'monospace',
                              flexShrink: 0,
                            }}
                          >
                            log
                          </span>
                          <span
                            style={{
                              color: 'var(--color-panel-text-muted)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1,
                              minWidth: 0,
                            }}
                            title={logPreview}
                          >
                            {logPreview}
                          </span>
                        </span>
                      );
                    })()}
                    {log.error_message && (
                      <span
                        style={{
                          color: 'var(--color-panel-error)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          minWidth: 0,
                          marginLeft: '8px',
                        }}
                        title={log.error_message}
                      >
                        {log.error_message}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Log Detail Sheet */}
      <Sheet
        isOpen={isSheetOpen}
        onClose={() => {
          setIsSheetOpen(false);
          setSelectedLog(null);
        }}
        width="480px"
        container={logsContainerRef.current}
      >
        {selectedLog && <LogDetailContent log={selectedLog} onClose={() => {
          setIsSheetOpen(false);
          setSelectedLog(null);
        }} />}
      </Sheet>
    </div>
  );
};

type DetailTab = 'execution' | 'request' | 'functions';

// Helper function to extract and format log content
const formatLogLine = (line: any): string => {
  // If line is an object with a messages array, extract and parse the messages
  if (line && typeof line === 'object' && !Array.isArray(line) && line.messages && Array.isArray(line.messages)) {
    const formattedMessages = line.messages
      .map((msg: any) => {
        if (typeof msg === 'string') {
          try {
            // Try to parse the message as JSON
            const parsed = JSON.parse(msg);
            return JSON.stringify(parsed, null, 2);
          } catch {
            // If parsing fails, return the original string trimmed
            return msg.trim();
          }
        }
        return typeof msg === 'string' ? msg.trim() : JSON.stringify(msg, null, 2);
      })
      .filter((content: string) => content.length > 0);
    
    return formattedMessages.join('\n\n');
  }
  
  // Default behavior: string or JSON.stringify
  if (typeof line === 'string') {
    return line.trim();
  }
  return JSON.stringify(line, null, 2);
};

const LogDetailContent: React.FC<{ log: LogEntry; onClose: () => void }> = ({ log, onClose }) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('execution');
  const [resourcesExpanded, setResourcesExpanded] = useState(true);

  // Extract all fields matching FunctionExecutionLog interface
  const executionId = log.function?.request_id || log.raw?.execution_id || log.raw?.request_id || 'N/A';
  const functionIdentifier = log.function?.path || log.topic || log.raw?.identifier || 'Unknown';
  const udfType = (log.function?.type || log.raw?.udf_type || log.raw?.udfType || 'Unknown').toLowerCase();
  const startedAt = log.timestamp || log.raw?.timestamp || Date.now();
  const completedAt = log.timestamp + (log.execution_time_ms || log.raw?.execution_time || 0);
  const durationMs = log.execution_time_ms || log.raw?.execution_time || 0;
  const environment = log.raw?.environment || 'Convex';
  
  // Extract usage stats - check multiple sources
  const usageStats = log.usage || log.raw?.usage_stats || {
    database_read_bytes: log.raw?.database_read_bytes || 0,
    database_write_bytes: log.raw?.database_write_bytes || 0,
    database_read_documents: log.raw?.database_read_documents || 0,
    storage_read_bytes: log.raw?.storage_read_bytes || log.raw?.file_storage_read_bytes || 0,
    storage_write_bytes: log.raw?.storage_write_bytes || log.raw?.file_storage_write_bytes || 0,
    vector_index_read_bytes: log.raw?.vector_index_read_bytes || log.raw?.vector_storage_read_bytes || 0,
    vector_index_write_bytes: log.raw?.vector_index_write_bytes || log.raw?.vector_storage_write_bytes || 0,
    memory_used_mb: log.raw?.memory_used_mb || log.raw?.action_memory_used_mb || 0,
  };
  
  const requestId = log.function?.request_id || log.raw?.request_id || 'N/A';
  const caller = log.raw?.caller || 'HTTP API';
  const identityType = log.raw?.identity || log.raw?.identity_type || 'Admin';
  const success = (log.status === 'success' || (log.status !== 'error' && log.status !== 'failure' && !log.error_message));
  const error = log.error_message || log.raw?.error || undefined;
  const returnBytes = log.raw?.return_bytes || log.raw?.returnBytes || log.raw?.return_bytes;
  const logLines = log.raw?.log_lines || log.raw?.logLines || log.raw?.log || [];

  const timestampInfo = formatTimestampWithRelative(startedAt);
  const hasError = !success || error;

  return (
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
            maxHeight: '200px',
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-content-error)',
              marginBottom: '8px',
            }}
          >
            Error
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
        const nonEmptyLogLines = logLines.filter((line: any) => {
          if (typeof line === 'string') {
            return line.trim().length > 0;
          }
          return true;
        });

        if (nonEmptyLogLines.length === 0) return null;

        const allLogContent = nonEmptyLogLines
          .map((line: any): string => {
            const logContent = formatLogLine(line);
            return logContent || '';
          })
          .filter((content: string) => content.length > 0)
          .join('\n\n');

        return (
          <div
            style={{
              margin: '16px',
              padding: '12px',
              backgroundColor: 'var(--color-panel-bg-tertiary)',
              border: '1px solid var(--color-panel-border)',
              borderRadius: '6px',
              flexShrink: 0,
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
                maxHeight: '200px',
                overflowY: 'auto',
              }}
            >
              {nonEmptyLogLines.map((line: any, index: number) => {
                const logContent = formatLogLine(line);
                
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
          flexShrink: 0,
        }}
      >
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
                  {formatDateTime(startedAt)}
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
                  {formatDuration(durationMs)}
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
                      {formatCompute(usageStats?.memory_used_mb, durationMs)}
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
                      {`${formatBytes(usageStats?.storage_read_bytes || usageStats?.file_storage_read_bytes)} read, ${formatBytes(
                        usageStats?.storage_write_bytes || usageStats?.file_storage_write_bytes,
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
                      {`${formatBytes(usageStats?.vector_index_read_bytes || usageStats?.vector_storage_read_bytes)} read, ${formatBytes(
                        usageStats?.vector_index_write_bytes || usageStats?.vector_storage_write_bytes,
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
                  {formatDateTime(startedAt)}
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
                  {formatDuration(durationMs)}
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
                      const parts = functionIdentifier.split(':');
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
                          {functionIdentifier}
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
      </div>
    </div>
  );
};

