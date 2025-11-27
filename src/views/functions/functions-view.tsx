import React, { useState, useEffect } from 'react';
import { Code2, Play, ChevronDown } from 'lucide-react';
import { discoverFunctions, ModuleFunction, groupFunctionsByPath } from '../../utils/functionDiscovery';
import { useShowGlobalRunner } from '../../lib/functionRunner';
import { CustomQuery } from '../../components/function-runner/function-runner';

export interface FunctionsViewProps {
  adminClient: any;
  accessToken: string;
  useMockData?: boolean;
  onError?: (error: string) => void;
}

export const FunctionsView: React.FC<FunctionsViewProps> = ({
  adminClient,
  accessToken,
  useMockData = false,
  onError,
}) => {
  const [functions, setFunctions] = useState<ModuleFunction[]>([]);
  const [groupedFunctions, setGroupedFunctions] = useState<Array<{ path: string; functions: ModuleFunction[] }>>([]);
  const [selectedFunction, setSelectedFunction] = useState<ModuleFunction | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const showGlobalRunner = useShowGlobalRunner();

  useEffect(() => {
    if (!adminClient) return;

    setIsLoading(true);
    discoverFunctions(adminClient, useMockData)
      .then((funcs) => {
        setFunctions(funcs);
        setGroupedFunctions(groupFunctionsByPath(funcs));
        // Expand all paths by default
        const allPaths = new Set(funcs.map(f => f.file?.path || 'root'));
        setExpandedPaths(allPaths);
      })
      .catch((error) => {
        console.error('Error fetching functions:', error);
        onError?.(error.message || 'Failed to fetch functions');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [adminClient, useMockData, onError]);

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
    setSelectedFunction(func);
  };

  const handleRunFunction = (func: ModuleFunction) => {
    showGlobalRunner(func as any, 'click');
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

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div
        style={{
          width: '300px',
          borderRight: '1px solid #2D313A',
          backgroundColor: '#0F1115',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Search */}
        <div style={{ padding: '12px', borderBottom: '1px solid #2D313A' }}>
          <input
            type="text"
            placeholder="Search functions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#16181D',
              border: '1px solid #2D313A',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#fff',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#5B46DF';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#2D313A';
            }}
          />
        </div>

        {/* Function List */}
        <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
          {isLoading ? (
            <div style={{ padding: '16px', color: '#9ca3af', fontSize: '12px' }}>Loading functions...</div>
          ) : filteredGroups.length === 0 ? (
            <div style={{ padding: '16px', color: '#9ca3af', fontSize: '12px' }}>
              {searchQuery ? 'No functions found' : 'No functions available'}
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.path} style={{ marginBottom: '8px' }}>
                <div
                  onClick={() => togglePath(group.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 8px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#16181D';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <ChevronDown
                    size={12}
                    style={{
                      transform: expandedPaths.has(group.path) ? 'rotate(0deg)' : 'rotate(-90deg)',
                      transition: 'transform 0.2s',
                    }}
                  />
                  {group.path || 'root'}
                </div>
                {expandedPaths.has(group.path) && (
                  <div style={{ paddingLeft: '16px' }}>
                    {group.functions.map((func) => (
                      <div
                        key={func.identifier}
                        onClick={() => handleFunctionClick(func)}
                        style={{
                          padding: '8px 12px',
                          marginBottom: '4px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          color: selectedFunction?.identifier === func.identifier ? '#fff' : '#d1d5db',
                          backgroundColor:
                            selectedFunction?.identifier === func.identifier ? '#1C1F26' : 'transparent',
                          border:
                            selectedFunction?.identifier === func.identifier
                              ? '1px solid #5B46DF'
                              : '1px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (selectedFunction?.identifier !== func.identifier) {
                            e.currentTarget.style.backgroundColor = '#16181D';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedFunction?.identifier !== func.identifier) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        {func.name}
                        <div
                          style={{
                            fontSize: '10px',
                            color: '#6b7280',
                            marginTop: '2px',
                          }}
                        >
                          {func.udfType}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#0F1115' }}>
        {selectedFunction ? (
          <>
            <div
              style={{
                padding: '16px',
                borderBottom: '1px solid #2D313A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#fff',
                    margin: 0,
                    marginBottom: '4px',
                    fontFamily: 'monospace',
                  }}
                >
                  {selectedFunction.identifier}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: '#1C1F26',
                      color: '#9ca3af',
                      textTransform: 'uppercase',
                    }}
                  >
                    {selectedFunction.udfType}
                  </span>
                  {selectedFunction.visibility && (
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: '#1C1F26',
                        color: '#9ca3af',
                      }}
                    >
                      {selectedFunction.visibility.kind}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleRunFunction(selectedFunction)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  backgroundColor: '#5B46DF',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4d3bc2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#5B46DF';
                }}
              >
                <Play size={14} />
                Run Function
              </button>
            </div>
            <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', marginBottom: '8px' }}>
                  Function Details
                </h3>
                <div
                  style={{
                    backgroundColor: '#16181D',
                    border: '1px solid #2D313A',
                    borderRadius: '6px',
                    padding: '12px',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#d1d5db', fontFamily: 'monospace' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ color: '#9ca3af' }}>Path: </span>
                      {selectedFunction.file?.path || 'N/A'}
                    </div>
                    {selectedFunction.args && (
                      <div style={{ marginBottom: '8px' }}>
                        <span style={{ color: '#9ca3af' }}>Args Validator: </span>
                        <pre
                          style={{
                            margin: '4px 0 0 0',
                            padding: '8px',
                            backgroundColor: '#0F1115',
                            borderRadius: '4px',
                            overflow: 'auto',
                          }}
                        >
                          {selectedFunction.args}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '16px',
              color: '#9ca3af',
            }}
          >
            <Code2 size={48} style={{ opacity: 0.5 }} />
            <div style={{ fontSize: '14px' }}>Select a function to view details</div>
            <button
              onClick={() => {
                const customQuery: CustomQuery = { type: 'customQuery', table: null };
                showGlobalRunner(customQuery as any, 'click');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                backgroundColor: '#1C1F26',
                border: '1px solid #2D313A',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2D313A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1C1F26';
              }}
            >
              <Play size={14} />
              Create Custom Query
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

