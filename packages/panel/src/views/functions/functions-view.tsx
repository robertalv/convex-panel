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

  // Helper function to remove .js extension from file paths
  const removeJsExtension = (path: string): string => {
    if (!path) return path;
    return path.endsWith('.js') ? path.slice(0, -3) : path;
  };

  // Helper function to get badge class for function type
  const getFunctionTypeBadgeClass = (udfType: string): string => {
    const normalizedType = udfType.toLowerCase();
    // Map httpAction to httpaction for CSS class
    const typeMap: Record<string, string> = {
      'httpaction': 'httpaction',
      'query': 'query',
      'mutation': 'mutation',
      'action': 'action',
    };
    return typeMap[normalizedType] || 'query';
  };

  // Using Tailwind CSS classes from src/styles/tailwind.css

  return (
    <div className="cp-functions-container">
      {/* Sidebar */}
      <div className="cp-functions-sidebar">
        {/* Search */}
        <div className="cp-functions-search">
          <input
            type="text"
            placeholder="Search functions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="cp-functions-search-input"
          />
        </div>

        {/* Function List */}
        <div className="cp-functions-list cp-scrollbar">
          {isLoading ? (
            <div className="cp-functions-loading">Loading functions...</div>
          ) : filteredGroups.length === 0 ? (
            <div className="cp-functions-empty">
              {searchQuery ? 'No functions found' : 'No functions available'}
            </div>
          ) : (
            filteredGroups.map((group) => {
              const isExpanded = expandedPaths.has(group.path);
              return (
                <div key={group.path} className="cp-functions-group">
                  <div
                    onClick={() => togglePath(group.path)}
                    className="cp-functions-group-header"
                  >
                    <ChevronDown
                      size={12}
                      style={{
                        transition: 'transform 0.2s',
                        transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                      }}
                    />
                    {removeJsExtension(group.path) || 'root'}
                  </div>
                  {isExpanded && (
                    <div style={{ paddingLeft: '16px' }}>
                      {group.functions.map((func) => {
                        const isSelected = selectedFunction?.identifier === func.identifier;
                        return (
                          <div
                            key={func.identifier}
                            onClick={() => handleFunctionClick(func)}
                            className={`cp-functions-item ${isSelected ? 'selected' : ''}`}
                          >
                            {func.name}
                            <div className={`cp-badge cp-badge-${getFunctionTypeBadgeClass(func.udfType)}`}>{func.udfType}</div>
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
      <div className="cp-functions-main">
        {selectedFunction ? (
          <>
            <div className="cp-functions-header">
              <div>
                <h2 className="cp-functions-title">{selectedFunction.identifier}</h2>
                <div className="cp-flex cp-items-center cp-gap-2" style={{ marginTop: '4px' }}>
                  <span className={`cp-badge cp-badge-${getFunctionTypeBadgeClass(selectedFunction.udfType)}`}>{selectedFunction.udfType}</span>
                  {selectedFunction.visibility && (
                    <span className="cp-functions-badge">{selectedFunction.visibility.kind}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleRunFunction(selectedFunction)}
                className="cp-functions-run-btn"
              >
                <Play size={14} />
                Run Function
              </button>
            </div>
            <div className="cp-functions-content cp-scrollbar">
              <div className="cp-functions-details-section">
                <h3 className="cp-functions-details-title">Function Details</h3>
                <div className="cp-functions-details-card">
                  <div className="cp-functions-details-text">
                    <div className="cp-functions-details-row">
                      <span className="cp-functions-details-label">Path: </span>
                      {selectedFunction.file?.path ? removeJsExtension(selectedFunction.file.path) : 'N/A'}
                    </div>
                    {selectedFunction.args && (
                      <div className="cp-functions-details-row">
                        <span className="cp-functions-details-label">Args Validator: </span>
                        <pre className="cp-functions-code-block">{selectedFunction.args}</pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="cp-functions-empty-state">
            <Code2 size={48} className="cp-functions-empty-icon" />
            <div className="cp-functions-empty-text">Select a function to view details</div>
            <button
              onClick={() => {
                const customQuery: CustomQuery = { type: 'customQuery', table: null };
                showGlobalRunner(customQuery as any, 'click');
              }}
              className="cp-functions-empty-btn"
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

