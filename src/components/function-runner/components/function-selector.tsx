import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Search, Code as CodeIcon } from 'lucide-react';
import { ModuleFunction } from '../../../utils/functionDiscovery';
import { CustomQuery } from '../function-runner';

interface FunctionSelectorProps {
  selectedFunction: ModuleFunction | CustomQuery | null;
  onSelect: (fn: ModuleFunction | CustomQuery) => void;
  functions: ModuleFunction[];
  componentId?: string | null;
}

export const FunctionSelector: React.FC<FunctionSelectorProps> = ({
  selectedFunction,
  onSelect,
  functions,
  componentId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debug logging
  useEffect(() => {
    console.log('[FunctionSelector] Props:', {
      functionsCount: functions.length,
      functions: functions,
      componentId,
      selectedFunction,
    });
  }, [functions, componentId, selectedFunction]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filter functions by componentId and search query
  // Component functions have identifiers like: "componentName:moduleName:functionName" or "componentName:functionName"
  // App functions have identifiers like: "moduleName:functionName" (no component prefix)
  // When componentId is 'app' or null, show functions with componentId === null AND identifier doesn't start with component:
  // Otherwise, show functions matching the specific componentId OR identifier starting with componentName:
  const filteredFunctions = functions.filter((fn: ModuleFunction) => {
    const normalizedComponentId = componentId === 'app' ? null : componentId;
    
    // Component matching: check both componentId and identifier pattern
    let matchesComponent = false;
    if (!normalizedComponentId) {
      // App-level: must have componentId === null AND identifier shouldn't start with component:
      matchesComponent = fn.componentId === null || fn.componentId === undefined;
      // Also check identifier pattern - if it starts with a component prefix, exclude it
      if (matchesComponent && fn.identifier && fn.identifier.includes(':')) {
        // We can't definitively check all components here, so we rely on componentId
        // But if componentId is null, we assume it's an app function
      }
    } else {
      // Component-specific: match by identifier pattern FIRST (most reliable), then componentId
      // Component functions have identifiers like: "componentName:moduleName:functionName"
      matchesComponent = 
        (!!fn.identifier && fn.identifier.startsWith(`${normalizedComponentId}:`)) ||
        fn.componentId === normalizedComponentId;
    }
    
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (fn.name || '').toLowerCase().includes(searchLower) ||
      (fn.identifier || '').toLowerCase().includes(searchLower);
    const result = matchesComponent && matchesSearch;
    
    // Debug logging for filtering
    if (!result) {
      console.log('[FunctionSelector] Function filtered out:', {
        name: fn.name,
        identifier: fn.identifier,
        componentId: fn.componentId,
        matchesComponent,
        matchesSearch,
        searchQuery,
        currentComponentId: componentId,
        normalizedComponentId,
      });
    }
    
    return result;
  });

  // Debug logging for filtered results
  useEffect(() => {
    console.log('[FunctionSelector] Filtered functions:', {
      totalFunctions: functions.length,
      filteredCount: filteredFunctions.length,
      componentId,
      searchQuery,
      filteredFunctions: filteredFunctions.map(f => ({
        name: f.name,
        identifier: f.identifier,
        componentId: f.componentId,
      })),
    });
  }, [functions.length, filteredFunctions.length, componentId, searchQuery]);

  // Create options array with Custom Query first
  const customQueryOption: CustomQuery = { type: 'customQuery', table: null, componentId };
  const options: (ModuleFunction | CustomQuery)[] = [customQueryOption, ...filteredFunctions];

  // Debug logging for options
  useEffect(() => {
    console.log('[FunctionSelector] Options array:', {
      totalOptions: options.length,
      options: options.map((opt, idx) => ({
        index: idx,
        isCustomQuery: 'type' in opt && opt.type === 'customQuery',
        name: 'type' in opt ? 'Custom test query' : (opt as ModuleFunction).name,
        identifier: 'type' in opt ? 'custom-query' : (opt as ModuleFunction).identifier,
      })),
    });
  }, [options.length]);

  const displayValue = selectedFunction
    ? 'type' in selectedFunction && selectedFunction.type === 'customQuery'
      ? 'Custom test query'
      : (selectedFunction as ModuleFunction).name || (selectedFunction as ModuleFunction).identifier
    : 'Select function...';

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '-webkit-fill-available',
          height: '36px',
          padding: '0 12px',
          backgroundColor: '#16181D',
          border: isOpen ? '1px solid #3B82F6' : '1px solid #2D313A',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'border-color 0.2s',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = '#999';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = '#2D313A';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#e5e7eb' }}>
          <span>{displayValue}</span>
        </div>
        {isOpen ? (
          <ChevronUp style={{ width: '14px', height: '14px', color: '#999' }} />
        ) : (
          <ChevronDown style={{ width: '14px', height: '14px', color: '#999' }} />
        )}
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            backgroundColor: '#0F1115',
            border: '1px solid #2D313A',
            borderRadius: '6px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            maxHeight: '250px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search */}
          <div style={{ width: '-webkit-fill-available', padding: '8px', borderBottom: '1px solid #2D313A' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={12}
                style={{
                  position: 'absolute',
                  left: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6b7280',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Search functions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsOpen(false);
                    setSearchQuery('');
                  }
                }}
                autoFocus
                style={{
                  width: '-webkit-fill-available',
                  backgroundColor: '#16181D',
                  border: '1px solid #2D313A',
                  borderRadius: '4px',
                  height: '28px',
                  paddingLeft: '28px',
                  paddingRight: '8px',
                  fontSize: '12px',
                  color: '#fff',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3B82F6';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#2D313A';
                }}
              />
            </div>
          </div>

          {/* Options */}
          <div style={{ 
            maxHeight: '350px', 
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            minHeight: 0,
          }}>
            {options.length > 0 ? (
              options.map((fn, index) => {
                const isCustomQuery = 'type' in fn && fn.type === 'customQuery';
                const fnIdentifier = isCustomQuery ? 'custom-query' : (fn as ModuleFunction).identifier;
                const isSelected =
                  selectedFunction &&
                  (isCustomQuery
                    ? 'type' in selectedFunction && selectedFunction.type === 'customQuery'
                    : !('type' in selectedFunction) &&
                      (selectedFunction as ModuleFunction).identifier === fnIdentifier);

                return (
                  <div
                    key={isCustomQuery ? 'custom-query' : fnIdentifier || index}
                    onClick={() => {
                      onSelect(fn);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    style={{
                      padding: '8px 12px',
                      fontSize: '14px',
                      color: isSelected ? '#fff' : '#d1d5db',
                      backgroundColor: isSelected ? '#2D313A' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#1C1F26';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <CodeIcon style={{ width: '14px', height: '14px', color: '#999' }} />
                    <span>
                      {isCustomQuery 
                        ? 'Custom test query' 
                        : (fn as ModuleFunction).name || fnIdentifier}
                    </span>
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  padding: '12px',
                  fontSize: '12px',
                  color: '#9ca3af',
                  textAlign: 'center',
                }}
              >
                No functions found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

