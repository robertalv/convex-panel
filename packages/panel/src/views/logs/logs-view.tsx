import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Pause,
  Play,
  X,
  Copy,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  Clock,
  CheckCircle2,
  ArrowUp,
} from 'lucide-react';
import { FixedSizeList } from 'react-window';
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
import { copyToClipboard } from '../../utils/toast';

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

const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  if (hours > 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  if (minutes > 0) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  return 'Just now';
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
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
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
  const [hoveredLogIndex, setHoveredLogIndex] = useState<number | null>(null);
  const [functions, setFunctions] = useState<ModuleFunction[]>([]);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const logsContainerRef = React.useRef<HTMLDivElement>(null);
  const logsListRef = React.useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState(600);

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
    isPaused,
    setIsPaused,
    clearLogs,
  } = useLogs({
    convexUrl: convexUrl || baseUrl,
    accessToken,
    useMockData,
    onError,
    functionId: functionIdForApi,
  });

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

  // Calculate list height based on container
  React.useEffect(() => {
    const updateHeight = () => {
      // Calculate available height: container height minus header and search
      if (logsContainerRef.current) {
        const containerRect = logsContainerRef.current.getBoundingClientRect();
        // Approximate header + search + table header heights
        const headerHeight = 40; // logsViewStyles.header height
        const searchHeight = 60; // approximate search container height
        const tableHeaderHeight = 40; // approximate table header height
        const availableHeight = containerRect.height - headerHeight - searchHeight - tableHeaderHeight;
        if (availableHeight > 0) {
          setListHeight(availableHeight);
        }
      }
    };

    // Use a small delay to ensure the DOM is ready
    const timeoutId = setTimeout(updateHeight, 0);
    const resizeObserver = new ResizeObserver(updateHeight);
    
    // Observe the parent container
    if (logsContainerRef.current) {
      resizeObserver.observe(logsContainerRef.current);
    }

    // Also update when window resizes
    window.addEventListener('resize', updateHeight);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  // Memoized log row renderer
  const LogRow = React.memo(({ index, style, data }: { index: number; style: React.CSSProperties; data: any }) => {
    const log = data.logs[index];
    const functions = data.functions;
    const hoveredLogIndex = data.hoveredLogIndex;
    const selectedLog = data.selectedLog;
    const setHoveredLogIndex = data.setHoveredLogIndex;
    const setSelectedLog = data.setSelectedLog;
    const setIsSheetOpen = data.setIsSheetOpen;

    const requestId = log.function?.request_id || '';
    const shortId = requestId ? requestId.slice(0, 4) : '-';
    const status = log.status || (log.function?.cached ? 'cached' : undefined);
    const executionTime = log.execution_time_ms
      ? `${Math.round(log.execution_time_ms)}ms`
      : undefined;

    // Determine status display - show status code for success, status text for others
    const statusDisplay = status === 'success' 
      ? (log.raw?.statusCode || '200')
      : status === 'error' || status === 'failure'
      ? 'failure'
      : status || '';

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

    // Determine log type color for badge
    let logTypeBadgeStyle: React.CSSProperties = {
      backgroundColor: 'var(--color-panel-bg-tertiary)',
      color: 'var(--color-panel-text-secondary)',
    };
    if (functionType === 'query') {
      logTypeBadgeStyle = { backgroundColor: '#1e3a5f', color: '#60a5fa' };
    } else if (functionType === 'mutation') {
      logTypeBadgeStyle = { backgroundColor: '#2d1b4e', color: '#a78bfa' };
    } else if (functionType === 'action') {
      logTypeBadgeStyle = { backgroundColor: '#4a2c1a', color: '#fb923c' };
    } else if (log.topic === 'http') {
      logTypeBadgeStyle = { backgroundColor: '#3d2f0f', color: '#fbbf24' };
    }
    
    // Get the icon based on function type
    const logTypeIcon = functionType === 'query' ? 'Q' 
      : functionType === 'mutation' ? 'M'
      : functionType === 'action' ? 'A'
      : log.topic === 'http' ? 'H'
      : 'L';

    const isHovered = hoveredLogIndex === index;
    const isError = status === 'error' || status === 'failure' || !!log.error_message;
    const isSelected = selectedLog && 
      selectedLog.timestamp === log.timestamp && 
      selectedLog.function?.request_id === log.function?.request_id;

    return (
      <div
        className="cp-logs-row"
        style={{
          ...style,
          height: style.height || 36,
          maxHeight: style.height || 36,
          overflow: 'hidden',
          ...(isSelected
            ? {
                backgroundColor:
                  'color-mix(in srgb, var(--color-panel-accent) 15%, transparent)',
                borderLeft: '3px solid var(--color-panel-accent)',
              }
            : isHovered && isError && !isSelected
            ? {
                backgroundColor:
                  'color-mix(in srgb, var(--color-panel-error) 25%, transparent)',
                color: 'var(--color-panel-error)',
              }
            : isHovered && !isError && !isSelected
            ? {
                backgroundColor: 'var(--color-panel-hover)',
              }
            : {}),
          ...(isError && !isSelected && !isHovered
            ? {
                backgroundColor:
                  'color-mix(in srgb, var(--color-panel-error) 15%, transparent)',
                color: 'var(--color-panel-error)',
              }
            : {}),
          cursor: 'pointer',
        }}
        onMouseEnter={() => setHoveredLogIndex(index)}
        onMouseLeave={() => setHoveredLogIndex(null)}
        onClick={() => {
          setSelectedLog(log);
          setIsSheetOpen(true);
        }}
      >
        <div
          className="cp-logs-timestamp"
          style={isError ? { color: 'var(--color-panel-error)' } : undefined}
        >
          {formatTimestamp(log.timestamp)}
        </div>
        <div
          className="cp-logs-id"
          style={isError ? { color: 'var(--color-panel-error)' } : undefined}
        >
          {shortId !== '-' && (
            <span
              className="cp-logs-id-badge"
              style={
                isError
                  ? {
                      border:
                        '1px solid color-mix(in srgb, var(--color-panel-error) 50%, transparent)',
                      backgroundColor:
                        'color-mix(in srgb, var(--color-panel-error) 10%, transparent)',
                      color: 'var(--color-panel-error)',
                    }
                  : undefined
              }
            >
              {shortId}
            </span>
          )}
        </div>
        <div className="cp-logs-status">
          {statusDisplay && (
            <span style={isError ? { color: 'var(--color-panel-error)' } : status === 'success' ? { color: 'var(--color-panel-success)' } : { color: 'var(--color-panel-text-secondary)' }}>
              {statusDisplay}
            </span>
          )}
          {executionTime && (
            <span
              className="cp-logs-execution-time"
              style={{
                ...(isError ? { color: 'var(--color-panel-error)' } : {}),
                marginLeft: '8px',
              }}
            >
              {executionTime}
            </span>
          )}
        </div>
        <div
          className="cp-logs-function"
          style={isError ? { color: 'var(--color-panel-error)' } : undefined}
        >
          <span
            className="cp-logs-logtype"
            style={{
              ...logTypeBadgeStyle,
              ...(isError
                ? {
                    backgroundColor:
                      'color-mix(in srgb, var(--color-panel-error) 20%, transparent)',
                    color: 'var(--color-panel-error)',
                  }
                : {}),
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '11px',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '20px',
            }}
          >
            {logTypeIcon}
          </span>
          {functionIdentifier && (
            <span
              className="cp-logs-function-path"
              style={{
                color: isError
                  ? 'var(--color-panel-error)'
                  : 'var(--color-panel-text-muted)',
                marginRight: '4px',
                fontFamily: 'monospace',
              }}
            >
              {functionIdentifier}:
            </span>
          )}
          <span
            className="cp-logs-function-path"
            style={{
              ...(isError ? { color: 'var(--color-panel-error)' } : {}),
              fontFamily: 'monospace',
            }}
          >
            {displayFunctionName}
          </span>
          {isError && log.error_message && (
            <span
              className="cp-logs-message"
              style={{
                marginLeft: '8px',
                color: 'var(--color-panel-error)',
                fontSize: '11px',
                opacity: 0.9,
                fontFamily: 'monospace',
                flex: 1,
                minWidth: 0,
              }}
            >
              • {log.error_message}
            </span>
          )}
        </div>
      </div>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison function for better performance
    const prevLog = prevProps.data.logs[prevProps.index];
    const nextLog = nextProps.data.logs[nextProps.index];
    const prevHovered = prevProps.data.hoveredLogIndex === prevProps.index;
    const nextHovered = nextProps.data.hoveredLogIndex === nextProps.index;
    const prevSelected = prevProps.data.selectedLog && 
      prevProps.data.selectedLog.timestamp === prevLog.timestamp && 
      prevProps.data.selectedLog.function?.request_id === prevLog.function?.request_id;
    const nextSelected = nextProps.data.selectedLog && 
      nextProps.data.selectedLog.timestamp === nextLog.timestamp && 
      nextProps.data.selectedLog.function?.request_id === nextLog.function?.request_id;
    
    return (
      prevProps.index === nextProps.index &&
      prevLog.timestamp === nextLog.timestamp &&
      prevLog.function?.request_id === nextLog.function?.request_id &&
      prevLog.error_message === nextLog.error_message &&
      prevHovered === nextHovered &&
      prevSelected === nextSelected &&
      prevProps.style === nextProps.style
    );
  });

  LogRow.displayName = 'LogRow';

  return (
    <div
      ref={logsContainerRef}
      className="cp-logs-container"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Header */}
      <div className="cp-logs-header">
        <h2 className="cp-logs-header-title">Logs</h2>
        <div
          className="cp-logs-header-buttons"
          style={{ position: 'relative', zIndex: 1, gap: '8px', marginRight: '-8px' }}
        >
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
          <MultiSelectFunctionSelector
            selectedFunctions={selectedFunctions}
            onSelect={(fns) => setSelectedFunctions(fns)}
            functions={functions}
            componentId={selectedComponent}
          />
          <MultiSelectLogTypeSelector
            selectedLogTypes={selectedLogTypes}
            onSelect={(logTypes: string[] | MultiSelectValue) => setSelectedLogTypes(logTypes as string[])}
          />
        </div>
      </div>

      {/* Search */}
      <div className="cp-logs-search">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
          <div style={{ flex: 1 }}>
            <div className="cp-search-wrapper">
              <Search className="cp-search-icon" />
            <input
              type="text"
              placeholder="Filter logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="cp-search-input"
            />
            </div>
          </div>
          <button
            onClick={clearLogs}
            className="cp-logs-header-button"
          >
            Clear Logs
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="cp-logs-table" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div
          className="cp-logs-table-header"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginRight: '8px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div className="cp-logs-table-header-cell" style={{ width: '160px' }}>Timestamp</div>
            <div className="cp-logs-table-header-cell" style={{ width: '80px' }}>ID</div>
            <div className="cp-logs-table-header-cell" style={{ width: '128px' }}>Status</div>
            <div className="cp-logs-table-header-cell" style={{ flex: 1 }}>Function</div>
          </div>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`cp-logs-pause-btn${isPaused ? ' cp-logs-pause-btn-paused' : ''}`}
            style={{ padding: '8px 16px', borderRadius: '8px' }}
          >
            {isPaused ? (
              <>
                <Play style={{ width: '12px', height: '12px' }} /> Resume
              </>
            ) : (
              <>
                <Pause style={{ width: '12px', height: '12px' }} /> Pause
              </>
            )}
          </button>
        </div>

        {/* Logs */}
        {isLoading && logs.length === 0 ? (
          <div className="cp-logs-loading">
            <div className="cp-logs-loading-text">Loading logs...</div>
          </div>
        ) : error && logs.length === 0 ? (
          <div className="cp-logs-error">
            <div className="cp-logs-error-text">
              Error loading logs: {error instanceof Error ? error.message : String(error)}
            </div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="cp-logs-empty">
            <div className="cp-logs-empty-text">
              {searchQuery || (selectedComponents !== 'all' && (selectedComponents as string[]).length < componentNames.length) || selectedFunctions.length > 0 || selectedLogTypes.length < 6
                ? 'No logs match your filters'
                : 'No logs yet'}
            </div>
          </div>
        ) : (
          <div ref={logsListRef} style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
            {listHeight > 0 && (
              <FixedSizeList
                height={listHeight}
                itemCount={filteredLogs.length}
                itemSize={36}
                width="100%"
                itemData={{
                  logs: filteredLogs,
                  functions,
                  hoveredLogIndex,
                  selectedLog,
                  setHoveredLogIndex,
                  setSelectedLog,
                  setIsSheetOpen,
                }}
              >
                {LogRow}
              </FixedSizeList>
            )}
          </div>
        )}
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
        {selectedLog && <LogDetailContent log={selectedLog} />}
      </Sheet>
    </div>
  );
};

type DetailTab = 'execution' | 'request' | 'functions';

const LogDetailContent: React.FC<{ log: LogEntry }> = ({ log }) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('execution');
  const [isResourcesExpanded, setIsResourcesExpanded] = useState(true);
  const status = log.status || (log.function?.cached ? 'cached' : undefined);
  const isError = status === 'error' || status === 'failure' || !!log.error_message;
  const executionId = log.function?.request_id || log.raw?.execution_id || 'N/A';
  const functionPath = log.function?.path || log.topic || 'Unknown';
  const functionType = log.function?.type || 'Unknown';
  const startedAt = log.timestamp;
  const completedAt = log.timestamp + (log.execution_time_ms || 0);
  const duration = log.execution_time_ms || 0;
  const usage = log.usage || log.raw?.usage_stats;
  const environment = log.raw?.environment || 'Convex';
  const returnBytes = log.raw?.return_bytes || log.raw?.returnBytes;
  const identity = log.raw?.identity || 'Admin';
  const caller = log.raw?.caller || 'HTTP API';
  
  // Calculate compute (GB-hr and MB for duration)
  const computeMemoryMB = usage?.action_memory_used_mb || log.raw?.usage_stats?.memory_used_mb || 0;
  const durationSeconds = duration / 1000;
  const computeGBHr = (computeMemoryMB * durationSeconds) / (1024 * 3600);
  const computeDisplay = `${computeGBHr.toFixed(7)} GB-hr (${computeMemoryMB} MB for ${durationSeconds.toFixed(2)}s)`;
  
  // Get document count
  const documentCount = usage?.database_read_documents || log.raw?.usage_stats?.database_read_documents || 0;
  
  // Get functions called (nested function calls)
  // If no nested functions, show the current function itself
  const functionsCalled = log.raw?.functions_called || log.raw?.functionsCalled || 
    (log.function?.path ? [{
      path: log.function.path,
      execution_time_ms: duration,
      success: status === 'success' || status !== 'error',
      error: log.error_message
    }] : []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header with timestamp and status */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-panel-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-panel-text)' }}>
              {formatTimestamp(log.timestamp)} ({formatRelativeTime(log.timestamp)})
            </div>
            <div style={{ fontSize: '12px', color: isError ? 'var(--color-panel-error)' : 'var(--color-panel-success)', marginTop: '4px' }}>
              {status || 'unknown'}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message Section */}
      {isError && log.error_message && (
        <div style={{
          margin: '16px 20px',
          padding: '12px',
          backgroundColor: 'color-mix(in srgb, var(--color-panel-error) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--color-panel-error) 30%, transparent)',
          borderRadius: '4px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-panel-error)' }}>Error</div>
            <button
              onClick={() => copyToClipboard(log.error_message || '')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: 'var(--color-panel-error)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Copy size={14} />
            </button>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-panel-error)', fontFamily: 'monospace' }}>
            {log.error_message}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-panel-border)' }}>
        {(['execution', 'request', 'functions'] as DetailTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 16px',
              fontSize: '12px',
              fontWeight: activeTab === tab ? 600 : 500,
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--color-panel-accent)' : '2px solid transparent',
              backgroundColor: activeTab === tab 
                ? 'linear-gradient(to bottom, rgba(255, 255, 255, 0.05), transparent)' 
                : 'transparent',
              color: activeTab === tab ? 'var(--color-panel-text)' : 'var(--color-panel-text-muted)',
              cursor: 'pointer',
              textTransform: 'capitalize',
              position: 'relative',
            }}
          >
            {tab === 'functions' ? 'Functions Called' : tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0' }}>
        {activeTab === 'execution' && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <DetailRow label="Execution ID" value={executionId} />
            <DetailRow label="Function" value={functionPath} />
            <DetailRow label="Type" value={functionType} />
            <DetailRow label="Started at" value={formatDateTime(startedAt)} />
            <DetailRow label="Completed at" value={formatDateTime(completedAt)} />
            <DetailRow label="Duration" value={`${duration}ms`} />
            <DetailRow 
              label="Environment" 
              value={environment} 
              withHelp 
              helpText="This function was executed in Convex's isolated environment."
            />
            
            {/* Resources Used */}
            <div style={{ borderTop: '1px solid var(--color-panel-border)', marginTop: '8px' }}>
              <button
                onClick={() => setIsResourcesExpanded(!isResourcesExpanded)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '12px 20px',
                  marginBottom: isResourcesExpanded ? '0' : '0',
                  color: 'var(--color-panel-text)',
                  fontSize: '12px',
                  fontWeight: 600,
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <Clock size={14} style={{ color: 'var(--color-panel-text-muted)' }} />
                Resources Used
                {isResourcesExpanded ? (
                  <ChevronUp size={14} style={{ color: 'var(--color-panel-text-muted)', marginLeft: 'auto' }} />
                ) : (
                  <ChevronDown size={14} style={{ color: 'var(--color-panel-text-muted)', marginLeft: 'auto' }} />
                )}
              </button>
              {isResourcesExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <DetailRow 
                    label="Compute" 
                    value={computeDisplay} 
                    withHelp 
                    small 
                    helpText="Only compute from Actions incur additional cost. Query/Mutation compute are included."
                  />
                  <DetailRow 
                    label="DB Bandwidth" 
                    value={
                      <span>
                        Accessed <strong>{documentCount}</strong> {documentCount === 1 ? 'document' : 'documents'}, <strong>{formatBytes(usage?.database_read_bytes || 0)}</strong> read, <strong>{formatBytes(usage?.database_write_bytes || 0)}</strong> written
                      </span>
                    }
                    small
                  />
                  <DetailRow 
                    label="File Bandwidth" 
                    value={
                      <span>
                        <strong>{formatBytes(usage?.file_storage_read_bytes || 0)}</strong> read, <strong>{formatBytes(usage?.file_storage_write_bytes || 0)}</strong> written
                      </span>
                    }
                    small
                  />
                  <DetailRow 
                    label="Vector Bandwidth" 
                    value={
                      <span>
                        <strong>{formatBytes(usage?.vector_storage_read_bytes || 0)}</strong> read, <strong>{formatBytes(usage?.vector_storage_write_bytes || 0)}</strong> written
                      </span>
                    }
                    small
                    noBorder={returnBytes === undefined}
                  />
                  <DetailRow 
                    label="Return Size" 
                    value={<span><strong>{formatBytes(returnBytes || 0)}</strong> returned</span>} 
                    withHelp 
                    small 
                    noBorder 
                    helpText="Bandwidth from sending the return value of a function call to the user does not incur costs."
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'request' && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <DetailRow label="Request ID" value={log.function?.request_id || 'N/A'} />
            <DetailRow label="Started at" value={formatDateTime(startedAt)} />
            <DetailRow label="Completed at" value={formatDateTime(completedAt)} />
            <DetailRow label="Duration" value={`${duration}ms`} />
            <DetailRow 
              label="Identity" 
              value={identity} 
              withHelp 
              helpText="This request was initiated by a Convex Developer with access to this deployment."
            />
            <DetailRow 
              label="Caller" 
              value={caller} 
              withHelp={caller === 'WebSocket'}
              helpText={caller === 'WebSocket' ? "This function was called through a websocket connection." : undefined}
            />
            <DetailRow 
              label="Environment" 
              value={environment} 
              withHelp 
              helpText="This function was executed in Convex's isolated environment."
            />
            
            {/* Resources Used */}
            <div style={{ borderTop: '1px solid var(--color-panel-border)', marginTop: '8px' }}>
              <button
                onClick={() => setIsResourcesExpanded(!isResourcesExpanded)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '12px 20px',
                  marginBottom: isResourcesExpanded ? '0' : '0',
                  color: 'var(--color-panel-text)',
                  fontSize: '12px',
                  fontWeight: 600,
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <Clock size={14} style={{ color: 'var(--color-panel-text-muted)' }} />
                Resources Used
                {isResourcesExpanded ? (
                  <ChevronUp size={14} style={{ color: 'var(--color-panel-text-muted)', marginLeft: 'auto' }} />
                ) : (
                  <ChevronDown size={14} style={{ color: 'var(--color-panel-text-muted)', marginLeft: 'auto' }} />
                )}
              </button>
              {isResourcesExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <DetailRow 
                    label="Compute" 
                    value={computeDisplay} 
                    withHelp 
                    small 
                    helpText="Only compute from Actions incur additional cost. Query/Mutation compute are included."
                  />
                  <DetailRow 
                    label="DB Bandwidth" 
                    value={
                      <span>
                        Accessed <strong>{documentCount}</strong> {documentCount === 1 ? 'document' : 'documents'}, <strong>{formatBytes(usage?.database_read_bytes || 0)}</strong> read, <strong>{formatBytes(usage?.database_write_bytes || 0)}</strong> written
                      </span>
                    }
                    small
                  />
                  <DetailRow 
                    label="File Bandwidth" 
                    value={
                      <span>
                        <strong>{formatBytes(usage?.file_storage_read_bytes || 0)}</strong> read, <strong>{formatBytes(usage?.file_storage_write_bytes || 0)}</strong> written
                      </span>
                    }
                    small
                  />
                  <DetailRow 
                    label="Vector Bandwidth" 
                    value={
                      <span>
                        <strong>{formatBytes(usage?.vector_storage_read_bytes || 0)}</strong> read, <strong>{formatBytes(usage?.vector_storage_write_bytes || 0)}</strong> written
                      </span>
                    }
                    small
                    noBorder={returnBytes === undefined}
                  />
                  <DetailRow 
                    label="Return Size" 
                    value={<span><strong>{formatBytes(returnBytes || 0)}</strong> returned</span>} 
                    withHelp 
                    small 
                    noBorder 
                    helpText="Bandwidth from sending the return value of a function call to the user does not incur costs."
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'functions' && (
          <div style={{ padding: '20px' }}>
            <div style={{ 
              color: 'var(--color-panel-text-muted)', 
              fontSize: '12px', 
              marginBottom: '16px' 
            }}>
              This is an outline of the functions called in this request.
            </div>
            {functionsCalled.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {functionsCalled.map((func: any, index: number) => {
                  const funcPath = func.path || func.identifier || func.function || 'Unknown';
                  const pathParts = funcPath.split(':');
                  const component = pathParts.length > 1 ? pathParts[0] : '';
                  const functionName = pathParts.length > 1 ? pathParts[1] : funcPath;
                  const execTime = func.execution_time_ms || func.executionTimeMs || func.duration || 0;
                  const isSuccess = func.success !== false && !func.error;
                  
                  return (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        backgroundColor: 'color-mix(in srgb, var(--color-panel-warning) 10%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--color-panel-warning) 20%, transparent)',
                        borderRadius: '8px',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                      }}
                    >
                      {isSuccess ? (
                        <CheckCircle2 size={16} style={{ color: 'var(--color-panel-success)', flexShrink: 0 }} />
                      ) : (
                        <X size={16} style={{ color: 'var(--color-panel-error)', flexShrink: 0 }} />
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                        {component && (
                          <span style={{ color: 'var(--color-panel-text-muted)' }}>
                            {component}:
                          </span>
                        )}
                        <span style={{ color: 'var(--color-panel-text)', fontWeight: 500 }}>
                          {functionName}
                        </span>
                        {execTime > 0 && (
                          <span style={{ color: 'var(--color-panel-text-muted)', marginLeft: '4px' }}>
                            ({execTime}ms)
                          </span>
                        )}
                      </div>
                      <ArrowUp size={14} style={{ color: 'var(--color-panel-text-muted)', flexShrink: 0 }} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ 
                color: 'var(--color-panel-text-muted)', 
                fontSize: '12px' 
              }}>
                No functions called
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const DetailRow: React.FC<{ 
  label: string; 
  value: string | React.ReactNode; 
  withHelp?: boolean;
  small?: boolean;
  noBorder?: boolean;
  helpText?: string;
}> = ({ label, value, withHelp, small, noBorder, helpText }) => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'flex-start', 
    gap: '8px',
    padding: '12px 20px',
    borderBottom: noBorder ? 'none' : '1px solid var(--color-panel-border)',
  }}>
    <div style={{ 
      fontSize: small ? '11px' : '12px', 
      color: 'var(--color-panel-text-muted)', 
      minWidth: '120px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    }}>
      {label}
      {withHelp && helpText && (
        <TooltipAction 
          icon={<HelpCircle size={12} style={{ opacity: 0.6, color: 'var(--color-panel-text-muted)' }} />} 
          text={helpText} 
        />
      )}
      {withHelp && !helpText && (
        <HelpCircle size={12} style={{ opacity: 0.6, color: 'var(--color-panel-text-muted)' }} />
      )}
    </div>
    <div style={{ 
      fontSize: small ? '11px' : '12px', 
      color: 'var(--color-panel-text)', 
      fontFamily: 'monospace',
      flex: 1,
      wordBreak: 'break-word',
    }}>
      {value}
    </div>
  </div>
);
