import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  ChevronDown, 
  Info, 
  Fingerprint, 
  ArrowDownUp, 
  Plus,
  X,
  ListFilter,
  Eye,
  EyeOff,
  Search,
  Clock,
  FileText
} from 'lucide-react';
import { FilterExpression, FilterClause, SortConfig, TableDefinition } from '../../../types';
import { operatorOptions, typeOptions } from '../../../utils/constants';

export interface DataFilterPanelProps {
  filters: FilterExpression;
  setFilters: (filters: FilterExpression) => void;
  sortConfig: SortConfig | null;
  setSortConfig: (sortConfig: SortConfig | null) => void;
  selectedTable: string;
  tables: TableDefinition;
  visibleFields?: string[];
  onVisibleFieldsChange?: (fields: string[]) => void;
  onClose?: () => void;
  openColumnVisibility?: boolean;
}

// Filter history for navigation
interface FilterHistoryEntry {
  filters: FilterExpression;
  sortConfig: SortConfig | null;
}

export const DataFilterPanel: React.FC<DataFilterPanelProps> = ({
  filters,
  setFilters,
  sortConfig,
  setSortConfig,
  selectedTable,
  tables,
  visibleFields: propVisibleFields,
  onVisibleFieldsChange,
  onClose,
  openColumnVisibility = false,
}) => {
  // Draft filters - local state that can be applied or cancelled
  const [draftFilters, setDraftFilters] = useState<FilterClause[]>(filters.clauses || []);
  const [draftSortConfig, setDraftSortConfig] = useState<SortConfig | null>(sortConfig);
  
  // Filter history for back/forward navigation
  const [filterHistory, setFilterHistory] = useState<FilterHistoryEntry[]>([
    { filters, sortConfig }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Field visibility state
  const [visibleFields, setVisibleFields] = useState<string[]>(
    propVisibleFields || []
  );

  // Check if draft differs from applied filters
  const isDirty = JSON.stringify(draftFilters) !== JSON.stringify(filters.clauses) ||
    JSON.stringify(draftSortConfig) !== JSON.stringify(sortConfig);

  // Sync draft with props when they change externally
  useEffect(() => {
    setDraftFilters(filters.clauses || []);
  }, [filters.clauses]);

  useEffect(() => {
    setDraftSortConfig(sortConfig);
  }, [sortConfig]);

  const tableSchema = tables[selectedTable];
  const availableFields = tableSchema?.fields?.map(field => field.fieldName) || [];
  const allFields = ['_id', ...availableFields, '_creationTime'].filter((col, index, self) =>
    self.indexOf(col) === index
  );

  // Extract indexes from table schema
  // Indexes in Convex are typically defined as fields starting with "by_" followed by field names
  const getAvailableIndexes = () => {
    const indexes: Array<{ name: string; fields: string[]; label: string }> = [];
    
    // Find index fields (fields that start with "by_")
    const indexFields = availableFields.filter(field => field.startsWith('by_'));
    
    indexFields.forEach(field => {
      // Extract the base field name(s) from the index name
      // e.g., "by_userId" -> ["userId"], "by_keyHash" -> ["keyHash"]
      const baseField = field.replace('by_', '');
      
      // Check if this is a composite index (contains multiple fields)
      // For now, we'll treat single-field indexes
      indexes.push({
        name: field,
        fields: [baseField, '_creationTime'], // Composite indexes typically include _creationTime
        label: `by_${baseField}`
      });
    });

    // Add standard sort options (these are always available)
    indexes.unshift({
      name: '_creationTime',
      fields: ['_creationTime'],
      label: 'By creation time'
    });
    indexes.unshift({
      name: '_id',
      fields: ['_id'],
      label: 'By ID'
    });

    return indexes;
  };

  const availableIndexes = getAvailableIndexes();

  // Initialize visible fields if not provided - show all fields by default
  useEffect(() => {
    if (allFields.length > 0) {
      if (propVisibleFields && propVisibleFields.length > 0) {
        // Use provided visible fields, but ensure all fields are available
        setVisibleFields(propVisibleFields);
        onVisibleFieldsChange?.(propVisibleFields);
      } else if (visibleFields.length === 0 || !visibleFields.some(f => allFields.includes(f))) {
        // Default: show all fields when table changes or no fields are visible
        const defaultVisible = [...allFields];
        setVisibleFields(defaultVisible);
        onVisibleFieldsChange?.(defaultVisible);
      }
    }
  }, [selectedTable, allFields.length]); // Only on table change

  // Sync visible fields with prop when it changes externally
  useEffect(() => {
    if (propVisibleFields && propVisibleFields.length > 0) {
      setVisibleFields(propVisibleFields);
    }
  }, [propVisibleFields]);

  // Determine indexed fields (typically _id, _creationTime, and fields with indexes)
  // For now, we'll consider _id and _creationTime as indexed, plus any fields that might be indexed
  const indexedFields = ['_id', '_creationTime'];
  const isIndexedField = (field: string) => indexedFields.includes(field);

  // Field visibility state
  const [isFieldVisibilityOpen, setIsFieldVisibilityOpen] = useState(openColumnVisibility);
  const [fieldSearchQuery, setFieldSearchQuery] = useState('');
  
  // Sort dropdown state
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [sortSearchQuery, setSortSearchQuery] = useState('');

  // Open column visibility when prop changes
  useEffect(() => {
    if (openColumnVisibility) {
      setIsFieldVisibilityOpen(true);
    }
  }, [openColumnVisibility]);

  // Toggle field visibility
  const toggleFieldVisibility = (field: string) => {
    const newVisibleFields = visibleFields.includes(field)
      ? visibleFields.filter(f => f !== field)
      : [...visibleFields, field];
    setVisibleFields(newVisibleFields);
    onVisibleFieldsChange?.(newVisibleFields);
  };

  // Show/hide all fields
  const showAllFields = () => {
    setVisibleFields([...allFields]);
    onVisibleFieldsChange?.(allFields);
  };

  const hideAllFields = () => {
    setVisibleFields([]);
    onVisibleFieldsChange?.([]);
  };

  // Filter fields for search
  const filteredFields = allFields.filter(field =>
    field.toLowerCase().includes(fieldSearchQuery.toLowerCase())
  );

  // Separate filters into indexed and other
  const indexedFilters = draftFilters.filter(f => isIndexedField(f.field));
  const otherFilters = draftFilters.filter(f => !isIndexedField(f.field));

  // Apply filters - add to history and apply
  const handleApplyFilters = useCallback(() => {
    const newFilters: FilterExpression = { clauses: draftFilters.filter(f => f.enabled) };
    setFilters(newFilters);
    if (draftSortConfig) {
      setSortConfig(draftSortConfig);
    } else {
      setSortConfig(null);
    }
    
    // Add to history (only if different from current)
    const currentEntry = filterHistory[historyIndex];
    const isDifferent = JSON.stringify(currentEntry.filters) !== JSON.stringify(newFilters) ||
      JSON.stringify(currentEntry.sortConfig) !== JSON.stringify(draftSortConfig);
    
    if (isDifferent) {
      const newHistory = filterHistory.slice(0, historyIndex + 1);
      newHistory.push({ filters: newFilters, sortConfig: draftSortConfig });
      setFilterHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [draftFilters, draftSortConfig, setFilters, setSortConfig, filterHistory, historyIndex]);

  // Navigation handlers
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < filterHistory.length - 1;

  const handleGoBack = useCallback(() => {
    if (canGoBack) {
      const prevIndex = historyIndex - 1;
      const entry = filterHistory[prevIndex];
      setDraftFilters(entry.filters.clauses || []);
      setDraftSortConfig(entry.sortConfig);
      setHistoryIndex(prevIndex);
      // Apply immediately when navigating
      setFilters(entry.filters);
      if (entry.sortConfig) {
        setSortConfig(entry.sortConfig);
      } else {
        setSortConfig(null);
      }
    }
  }, [canGoBack, historyIndex, filterHistory, setFilters, setSortConfig]);

  const handleGoForward = useCallback(() => {
    if (canGoForward) {
      const nextIndex = historyIndex + 1;
      const entry = filterHistory[nextIndex];
      setDraftFilters(entry.filters.clauses || []);
      setDraftSortConfig(entry.sortConfig);
      setHistoryIndex(nextIndex);
      // Apply immediately when navigating
      setFilters(entry.filters);
      if (entry.sortConfig) {
        setSortConfig(entry.sortConfig);
      } else {
        setSortConfig(null);
      }
    }
  }, [canGoForward, historyIndex, filterHistory, setFilters, setSortConfig]);

  const handleAddFilter = () => {
    const newFilter: FilterClause = {
      field: allFields[0] || '_id',
      op: 'eq',
      value: '',
      enabled: true,
    };
    setDraftFilters([...draftFilters, newFilter]);
  };

  const handleRemoveFilter = (index: number) => {
    setDraftFilters(draftFilters.filter((_, i) => i !== index));
  };

  const handleUpdateFilter = (index: number, updates: Partial<FilterClause>) => {
    const updated = draftFilters.map((filter, i) => 
      i === index ? { ...filter, ...updates } : filter
    );
    setDraftFilters(updated);
  };

  const handleRemoveSort = () => {
    setDraftSortConfig(null);
  };

  const handleSetSort = (field: string, direction: 'asc' | 'desc') => {
    setDraftSortConfig({ field, direction });
  };

  const handleToggleSortDirection = () => {
    if (draftSortConfig) {
      setDraftSortConfig({
        ...draftSortConfig,
        direction: draftSortConfig.direction === 'asc' ? 'desc' : 'asc'
      });
    }
  };

  const getSortFieldLabel = (field: string): string => {
    if (field === '_creationTime') return 'By creation time';
    return `By ${field}`;
  };

  // Handle form submission - apply filters
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleApplyFilters();
  };

  // Auto-apply filters when draft changes (debounced for performance)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const newFilters: FilterExpression = { clauses: draftFilters.filter(f => f.enabled) };
      setFilters(newFilters);
      if (draftSortConfig) {
        setSortConfig(draftSortConfig);
      } else {
        setSortConfig(null);
      }
    }, 500); // Debounce to avoid too many requests

    return () => clearTimeout(timeoutId);
  }, [draftFilters, draftSortConfig, setFilters, setSortConfig]);

  // Close field visibility dropdown on outside click
  useEffect(() => {
    if (!isFieldVisibilityOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-field-visibility]')) {
        setIsFieldVisibilityOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFieldVisibilityOpen]);

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!isSortDropdownOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-sort-dropdown]')) {
        setIsSortDropdownOpen(false);
        setSortSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortDropdownOpen]);

  // Calculate hidden fields count
  const hiddenFieldsCount = allFields.length - visibleFields.length;

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
      }}
    >
      {/* Sidebar Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0px 12px',
        borderBottom: '1px solid #2D313A',
        backgroundColor: '#16181D',
        height: '48px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          {/* Navigation History - Full Height */}
          <div style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: '0px',
            overflow: 'hidden',
            height: '100%',
          }}>
            <button
              type="button"
              onClick={handleGoBack}
              disabled={!canGoBack}
              style={{
                color: canGoBack ? '#6b7280' : '#3d4149',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: canGoBack ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (canGoBack) {
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.backgroundColor = '#2D313A';
                }
              }}
              onMouseLeave={(e) => {
                if (canGoBack) {
                  e.currentTarget.style.color = '#6b7280';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <ArrowLeft size={14} />
            </button>
            <button
              type="button"
              onClick={handleGoForward}
              disabled={!canGoForward}
              style={{
                padding: '0 8px',
                color: canGoForward ? '#6b7280' : '#3d4149',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: canGoForward ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (canGoForward) {
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.backgroundColor = '#2D313A';
                }
              }}
              onMouseLeave={(e) => {
                if (canGoForward) {
                  e.currentTarget.style.color = '#6b7280';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <ArrowRight size={14} />
            </button>
          </div>
          
          {/* Filter & Sort Text */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#d1d5db',
          }}>
            <span>Filter & Sort</span>
          </div>
        </div>

        {/* Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px',
              color: '#9ca3af',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.backgroundColor = '#2D313A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#9ca3af';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Content Scroll Area */}
      <div 
        data-filter-panel
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          position: 'relative',
        }}
      >
        {/* View Options */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
        }}>
          <span style={{
            fontSize: '10px',
            color: '#6b7280',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            View
          </span>
          <div style={{ position: 'relative' }} data-field-visibility>
            <button
              type="button"
              onClick={() => setIsFieldVisibilityOpen(!isFieldVisibilityOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                color: hiddenFieldsCount > 0 ? '#818CF8' : '#9ca3af',
                backgroundColor: hiddenFieldsCount > 0 ? 'rgba(49, 46, 129, 0.2)' : 'transparent',
                border: hiddenFieldsCount > 0 ? '1px solid rgba(49, 46, 129, 0.5)' : '1px solid transparent',
                borderRadius: '6px',
                fontSize: '10px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = hiddenFieldsCount > 0 ? 'rgba(49, 46, 129, 0.3)' : '#1C1F26';
                e.currentTarget.style.borderColor = hiddenFieldsCount > 0 ? 'rgba(49, 46, 129, 0.7)' : '#2D313A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = hiddenFieldsCount > 0 ? 'rgba(49, 46, 129, 0.2)' : 'transparent';
                e.currentTarget.style.borderColor = hiddenFieldsCount > 0 ? 'rgba(49, 46, 129, 0.5)' : 'transparent';
              }}
            >
              <EyeOff size={12} />
              {hiddenFieldsCount > 0 ? (
                <span>{hiddenFieldsCount} hidden {hiddenFieldsCount === 1 ? 'field' : 'fields'}</span>
              ) : (
                <span>Fields</span>
              )}
            </button>

            {/* Field Visibility Dropdown */}
            {isFieldVisibilityOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  width: '320px',
                  backgroundColor: '#0F1115',
                  border: '1px solid #2D313A',
                  borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
                  zIndex: 1001,
                  maxHeight: 'min(400px, calc(100vh - 200px))',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
                onClick={(e) => e.stopPropagation()}
              >
              {/* Search */}
              <div style={{ padding: '12px', borderBottom: '1px solid #2D313A' }}>
                <div style={{ position: 'relative' }}>
                  <Search
                    size={14}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#6b7280',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search fields..."
                    value={fieldSearchQuery}
                    onChange={(e) => setFieldSearchQuery(e.target.value)}
                    style={{
                      width: '-webkit-fill-available',
                      backgroundColor: '#1C1F26',
                      border: '1px solid #2D313A',
                      borderRadius: '4px',
                      height: '32px',
                      paddingLeft: '32px',
                      paddingRight: '12px',
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

              {/* Field List */}
              <div style={{ flex: 1, overflow: 'auto', padding: '4px' }}>
                {filteredFields.map((field) => (
                  <div
                    key={field}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      color: '#d1d5db',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#1C1F26';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    onClick={() => toggleFieldVisibility(field)}
                  >
                    <span>{field}</span>
                    <div
                      style={{
                        width: '36px',
                        height: '20px',
                        backgroundColor: visibleFields.includes(field) ? '#3B82F6' : '#2D313A',
                        borderRadius: '10px',
                        position: 'relative',
                        transition: 'background-color 0.2s',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          backgroundColor: '#fff',
                          borderRadius: '50%',
                          position: 'absolute',
                          top: '2px',
                          left: visibleFields.includes(field) ? '18px' : '2px',
                          transition: 'left 0.2s',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{
                padding: '8px',
                borderTop: '1px solid #2D313A',
                display: 'flex',
                gap: '8px',
              }}>
                <button
                  type="button"
                  onClick={hideAllFields}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    backgroundColor: 'transparent',
                    border: '1px solid #2D313A',
                    borderRadius: '4px',
                    color: '#9ca3af',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1C1F26';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#9ca3af';
                  }}
                >
                  <EyeOff size={14} />
                  Hide All
                </button>
                <button
                  type="button"
                  onClick={showAllFields}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    backgroundColor: 'transparent',
                    border: '1px solid #2D313A',
                    borderRadius: '4px',
                    color: '#9ca3af',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1C1F26';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#9ca3af';
                  }}
                >
                  <Eye size={14} />
                  Show All
                </button>
              </div>
            </div>
            )}
          </div>
        </div>

        {/* Active Sorts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{
            fontSize: '10px',
            color: '#6b7280',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'block',
            marginBottom: '8px',
          }}>
            Sort By
          </span>
          {draftSortConfig ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: '#1C1F26',
                  border: '1px solid #2D313A',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#d1d5db',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#6b7280';
                  e.currentTarget.style.backgroundColor = '#252830';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#2D313A';
                  e.currentTarget.style.backgroundColor = '#1C1F26';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Fingerprint size={14} style={{ color: '#9ca3af' }} />
                  <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                    {draftSortConfig.field}
                  </span>
                </div>
                <X
                  size={12}
                  style={{
                    color: '#6b7280',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    cursor: 'pointer',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveSort();
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0';
                    e.currentTarget.style.color = '#6b7280';
                  }}
                />
              </div>
              <div
                onClick={handleToggleSortDirection}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: '#1C1F26',
                  border: '1px solid #2D313A',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#d1d5db',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#6b7280';
                  e.currentTarget.style.backgroundColor = '#252830';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#2D313A';
                  e.currentTarget.style.backgroundColor = '#1C1F26';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ArrowDownUp size={14} style={{ color: '#9ca3af' }} />
                  <span style={{ textTransform: 'capitalize' }}>
                    {draftSortConfig.direction === 'asc' ? 'Ascending' : 'Descending'}
                  </span>
                </div>
                <X
                  size={12}
                  style={{
                    color: '#6b7280',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    cursor: 'pointer',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveSort();
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0';
                    e.currentTarget.style.color = '#6b7280';
                  }}
                />
              </div>
            </div>
          ) : (
            <div style={{ position: 'relative' }} data-sort-dropdown>
              <button
                type="button"
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#1C1F26',
                  border: '1px solid #2D313A',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#d1d5db',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#6b7280';
                  e.currentTarget.style.backgroundColor = '#252830';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#2D313A';
                  e.currentTarget.style.backgroundColor = '#1C1F26';
                }}
              >
                <span>Select field to sort...</span>
                <ChevronDown size={12} style={{ color: '#6b7280' }} />
              </button>

              {isSortDropdownOpen && (
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
                    maxHeight: '300px',
                    overflow: 'auto',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Search */}
                  <div style={{ padding: '8px', borderBottom: '1px solid #2D313A' }}>
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
                        placeholder="Search..."
                        value={sortSearchQuery}
                        onChange={(e) => setSortSearchQuery(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: '#1C1F26',
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

                  {/* Index Options */}
                  <div style={{ padding: '4px' }}>
                    {availableIndexes
                      .filter(idx => 
                        idx.label.toLowerCase().includes(sortSearchQuery.toLowerCase()) ||
                        idx.name.toLowerCase().includes(sortSearchQuery.toLowerCase())
                      )
                      .map((index) => (
                        <div
                          key={index.name}
                          onClick={() => {
                            handleSetSort(index.fields[0], 'desc');
                            setIsSortDropdownOpen(false);
                            setSortSearchQuery('');
                          }}
                          style={{
                            padding: '8px 12px',
                            fontSize: '12px',
                            color: '#d1d5db',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'background-color 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#1C1F26';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {index.name === '_creationTime' ? (
                            <Clock size={14} style={{ color: '#9ca3af' }} />
                          ) : index.name === '_id' ? (
                            <FileText size={14} style={{ color: '#9ca3af' }} />
                          ) : (
                            <Fingerprint size={14} style={{ color: '#9ca3af' }} />
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500 }}>{index.label}</div>
                            <div style={{ 
                              fontSize: '10px', 
                              color: '#6b7280',
                              fontFamily: 'monospace',
                              marginTop: '2px',
                            }}>
                              ({index.fields.join(', ')})
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Indexed Filters Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{
              fontSize: '10px',
              color: '#6b7280',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Indexed Filters
            </span>
            <Info size={12} style={{ color: '#6b7280', cursor: 'help' }} />
            <div style={{ height: '1px', backgroundColor: '#2D313A', flex: 1, opacity: 0.5 }} />
          </div>

          {indexedFilters.length > 0 && indexedFilters.map((filter) => {
            const index = draftFilters.findIndex(f => 
              f.field === filter.field && f.op === filter.op && 
              JSON.stringify(f.value) === JSON.stringify(filter.value)
            );
            return (
            <div
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={filter.enabled}
                  onChange={(e) => handleUpdateFilter(index, { enabled: e.target.checked })}
                  style={{
                    appearance: 'none',
                    width: '14px',
                    height: '14px',
                    backgroundColor: filter.enabled ? '#EE342F' : '#1C1F26',
                    border: filter.enabled ? '1px solid #EE342F' : '1px solid #2D313A',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    position: 'relative',
                    margin: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!filter.enabled) {
                      e.currentTarget.style.borderColor = '#EE342F';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!filter.enabled) {
                      e.currentTarget.style.borderColor = '#2D313A';
                    }
                  }}
                />
                {filter.enabled && (
                  <span
                    style={{
                      position: 'absolute',
                      left: '2px',
                      top: '2px',
                      color: '#fff',
                      fontSize: '10px',
                      pointerEvents: 'none',
                      fontWeight: 'bold',
                      lineHeight: '14px',
                    }}
                  >
                    ✓
                  </span>
                )}
                <span style={{
                  fontSize: '11px',
                  color: '#9ca3af',
                  fontFamily: 'monospace',
                }}>
                  {filter.field}
                </span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#16181D',
                border: '1px solid #2D313A',
                borderRadius: '6px',
                overflow: 'hidden',
                height: '32px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#6b7280';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#2D313A';
              }}
              >
                {/* Operator */}
                <select
                  value={filter.op}
                  onChange={(e) => {
                    const newOp = e.target.value as FilterClause['op'];
                    handleUpdateFilter(index, { 
                      op: newOp,
                      value: (newOp === 'isType' || newOp === 'isNotType') && 
                             (filter.op !== 'isType' && filter.op !== 'isNotType')
                        ? '' 
                        : filter.value
                    });
                  }}
                  style={{
                    padding: '0 8px',
                    height: '100%',
                    backgroundColor: '#1C1F26',
                    border: 'none',
                    borderRight: '1px solid #2D313A',
                    fontSize: '10px',
                    color: '#d1d5db',
                    cursor: 'pointer',
                    minWidth: '40px',
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    outline: 'none',
                    appearance: 'none',
                    backgroundImage: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#252830';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1C1F26';
                  }}
                >
                  {operatorOptions.map(op => (
                    <option key={op.value} value={op.value} style={{ backgroundColor: '#1C1F26' }}>
                      {op.label}
                    </option>
                  ))}
                </select>

                {/* Value Input */}
                {(filter.op === 'isType' || filter.op === 'isNotType') ? (
                  <select
                    value={filter.value || ''}
                    onChange={(e) => handleUpdateFilter(index, { value: e.target.value })}
                    style={{
                      flex: 1,
                      backgroundColor: '#16181D',
                      padding: '0 8px',
                      fontSize: '11px',
                      color: '#d1d5db',
                      border: 'none',
                      outline: 'none',
                      fontFamily: 'monospace',
                      height: '100%',
                      cursor: 'pointer',
                      appearance: 'none',
                    }}
                  >
                    <option value="" style={{ backgroundColor: '#1C1F26' }}>Select type...</option>
                    {typeOptions.map(type => (
                      <option key={type.value} value={type.value} style={{ backgroundColor: '#1C1F26' }}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={typeof filter.value === 'string' ? filter.value : (filter.value !== undefined ? JSON.stringify(filter.value) : '')}
                    onChange={(e) => {
                      let parsedValue: any = e.target.value;
                      if (e.target.value.trim() !== '') {
                        try {
                          parsedValue = JSON.parse(e.target.value);
                        } catch {
                          parsedValue = e.target.value;
                        }
                      }
                      handleUpdateFilter(index, { value: parsedValue });
                    }}
                    placeholder="Enter value..."
                    style={{
                      flex: 1,
                      backgroundColor: '#16181D',
                      padding: '0 8px',
                      fontSize: '11px',
                      color: '#d1d5db',
                      border: 'none',
                      outline: 'none',
                      fontFamily: 'monospace',
                      height: '100%',
                      transition: 'background-color 0.2s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.backgroundColor = '#0F1115';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.backgroundColor = '#16181D';
                    }}
                  />
                )}

                <button
                  type="button"
                  onClick={() => handleRemoveFilter(index)}
                  style={{
                    padding: '0 8px',
                    color: '#6b7280',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#EE342F';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#6b7280';
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            </div>
            );
          })}
            {indexedFilters.length === 0 && (
              <div style={{ 
                padding: '8px', 
                color: '#6b7280', 
                fontSize: '12px',
                fontStyle: 'italic',
              }}>
                No indexed filters
              </div>
            )}
          </div>

        {/* Other Filters Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{
              fontSize: '10px',
              color: '#6b7280',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Other Filters
            </span>
            <Info size={12} style={{ color: '#6b7280', cursor: 'help' }} />
            <div style={{ height: '1px', backgroundColor: '#2D313A', flex: 1, opacity: 0.5 }} />
          </div>

          {otherFilters.map((filter) => {
            const index = draftFilters.findIndex(f => 
              f.field === filter.field && f.op === filter.op && 
              JSON.stringify(f.value) === JSON.stringify(filter.value)
            );
            return (
            <div
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={filter.enabled}
                  onChange={(e) => handleUpdateFilter(index, { enabled: e.target.checked })}
                  style={{
                    appearance: 'none',
                    width: '14px',
                    height: '14px',
                    backgroundColor: filter.enabled ? '#3B82F6' : '#1C1F26',
                    border: filter.enabled ? '1px solid #3B82F6' : '1px solid #2D313A',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    position: 'relative',
                    margin: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!filter.enabled) {
                      e.currentTarget.style.borderColor = '#3B82F6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!filter.enabled) {
                      e.currentTarget.style.borderColor = '#2D313A';
                    }
                  }}
                />
                {filter.enabled && (
                  <span
                    style={{
                      position: 'absolute',
                      left: '2px',
                      top: '2px',
                      color: '#fff',
                      fontSize: '10px',
                      pointerEvents: 'none',
                      fontWeight: 'bold',
                      lineHeight: '14px',
                    }}
                  >
                    ✓
                  </span>
                )}
                <span style={{
                  fontSize: '11px',
                  color: '#9ca3af',
                  fontFamily: 'monospace',
                }}>
                  {filter.field}
                </span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#16181D',
                border: '1px solid #2D313A',
                borderRadius: '6px',
                overflow: 'hidden',
                height: '32px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#6b7280';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#2D313A';
              }}
              >
                {/* Operator */}
                <button
                  type="button"
                  style={{
                    padding: '0 8px',
                    height: '100%',
                    backgroundColor: '#1C1F26',
                    border: 'none',
                    borderRight: '1px solid #2D313A',
                    fontSize: '10px',
                    color: '#fff',
                    cursor: 'pointer',
                    minWidth: '50px',
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#252830';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1C1F26';
                  }}
                >
                  {operatorOptions.find(op => op.value === filter.op)?.label || filter.op}
                </button>

                {/* Value Input */}
                <div style={{
                  flex: 1,
                  backgroundColor: '#16181D',
                  padding: '0 8px',
                  display: 'flex',
                  alignItems: 'center',
                  height: '100%',
                  overflow: 'hidden',
                }}>
                  {(filter.op === 'eq' || filter.op === 'neq') && (
                    <span style={{
                      color: '#EE342F',
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      letterSpacing: '0.1em',
                      opacity: 0.7,
                      marginRight: '4px',
                    }}>
                      ""
                    </span>
                  )}
                  <input
                    type="text"
                    value={typeof filter.value === 'string' ? filter.value : (filter.value !== undefined ? JSON.stringify(filter.value) : '')}
                    onChange={(e) => {
                      let parsedValue: any = e.target.value;
                      if (e.target.value.trim() !== '') {
                        try {
                          parsedValue = JSON.parse(e.target.value);
                        } catch {
                          parsedValue = e.target.value;
                        }
                      }
                      handleUpdateFilter(index, { value: parsedValue });
                    }}
                    placeholder="Enter value..."
                    style={{
                      flex: 1,
                      backgroundColor: 'transparent',
                      fontSize: '11px',
                      color: '#d1d5db',
                      border: 'none',
                      outline: 'none',
                      fontFamily: 'monospace',
                      height: '100%',
                      marginLeft: (filter.op === 'eq' || filter.op === 'neq') ? '0' : '0',
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveFilter(index)}
                  style={{
                    padding: '0 8px',
                    color: '#6b7280',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#EE342F';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#6b7280';
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            </div>
            );
          })}

        </div>

        {/* Action Bar */}
        <div style={{ paddingTop: '8px' }}>
          <button
            type="button"
            onClick={() => {
              // Add to indexed filters if there are indexed fields available, otherwise to other filters
              const indexedFieldsList = allFields.filter(f => isIndexedField(f));
              const nonIndexedFields = allFields.filter(f => !isIndexedField(f));
              const newFilter: FilterClause = {
                field: indexedFieldsList.length > 0 ? indexedFieldsList[0] : (nonIndexedFields[0] || allFields[0] || '_id'),
                op: 'eq',
                value: '',
                enabled: true,
              };
              setDraftFilters([...draftFilters, newFilter]);
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#9ca3af',
              backgroundColor: 'transparent',
              border: '1px dashed #2D313A',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.borderColor = '#6b7280';
              e.currentTarget.style.backgroundColor = '#1C1F26';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#9ca3af';
              e.currentTarget.style.borderColor = '#2D313A';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Plus size={14} />
            Add filter
          </button>
        </div>
      </div>

      {/* Footer Actions */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #2D313A',
        backgroundColor: '#16181D',
      }}>
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: 500,
            color: '#fff',
            backgroundColor: '#5B46DF',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 6px rgba(91, 70, 223, 0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#4d3bc2';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#5B46DF';
          }}
        >
          Apply Filters
        </button>
      </div>
    </form>
  );
};
