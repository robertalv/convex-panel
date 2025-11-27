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
import { Dropdown } from '../../../components/shared';

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

  // Initialize visible fields when table changes - show all fields by default
  useEffect(() => {
    if (allFields.length > 0 && selectedTable) {
      // When table changes, reset to show all fields if no explicit prop is provided
      if (propVisibleFields === undefined || propVisibleFields.length === 0) {
        // Default: show all fields when table changes
        const defaultVisible = [...allFields];
        setVisibleFields(defaultVisible);
        onVisibleFieldsChange?.(defaultVisible);
      }
    }
  }, [selectedTable, allFields.length]); // Only on table change

  // Sync visible fields with prop when it changes externally (but not on table change)
  useEffect(() => {
    if (propVisibleFields !== undefined && selectedTable) {
      // Always sync with prop, even if empty (empty means all fields hidden)
      // Only update if different to avoid unnecessary re-renders
      if (JSON.stringify(propVisibleFields) !== JSON.stringify(visibleFields)) {
        setVisibleFields(propVisibleFields);
      }
    }
  }, [propVisibleFields, selectedTable]);

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
    
    // Close the filter panel after applying
    onClose?.();
  }, [draftFilters, draftSortConfig, setFilters, setSortConfig, filterHistory, historyIndex, onClose]);

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
        borderBottom: '1px solid var(--color-panel-border)',
        backgroundColor: 'var(--color-panel-bg-secondary)',
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
                color: canGoBack ? 'var(--color-panel-text-muted)' : 'var(--color-panel-text-muted)',
                opacity: canGoBack ? 1 : 0.5,
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
                  e.currentTarget.style.color = 'var(--color-panel-text)';
                  e.currentTarget.style.backgroundColor = 'var(--color-panel-border)';
                }
              }}
              onMouseLeave={(e) => {
                if (canGoBack) {
                  e.currentTarget.style.color = 'var(--color-panel-text-muted)';
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
                color: canGoForward ? 'var(--color-panel-text-muted)' : 'var(--color-panel-text-muted)',
                opacity: canGoForward ? 1 : 0.5,
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
                  e.currentTarget.style.color = 'var(--color-panel-text)';
                  e.currentTarget.style.backgroundColor = 'var(--color-panel-border)';
                }
              }}
              onMouseLeave={(e) => {
                if (canGoForward) {
                  e.currentTarget.style.color = 'var(--color-panel-text-muted)';
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
            color: 'var(--color-panel-text)',
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
              color: 'var(--color-panel-text-secondary)',
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
            color: 'var(--color-panel-text-muted)',
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
                color: hiddenFieldsCount > 0 ? 'var(--color-panel-accent)' : 'var(--color-panel-text-secondary)',
                backgroundColor: hiddenFieldsCount > 0 ? 'color-mix(in srgb, var(--color-panel-accent) 20%, transparent)' : 'transparent',
                border: hiddenFieldsCount > 0 ? '1px solid color-mix(in srgb, var(--color-panel-accent) 50%, transparent)' : '1px solid transparent',
                borderRadius: '6px',
                fontSize: '10px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = hiddenFieldsCount > 0 ? 'color-mix(in srgb, var(--color-panel-accent) 30%, transparent)' : 'var(--color-panel-bg-tertiary)';
                e.currentTarget.style.borderColor = hiddenFieldsCount > 0 ? 'color-mix(in srgb, var(--color-panel-accent) 70%, transparent)' : 'var(--color-panel-border)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = hiddenFieldsCount > 0 ? 'color-mix(in srgb, var(--color-panel-accent) 20%, transparent)' : 'transparent';
                e.currentTarget.style.borderColor = hiddenFieldsCount > 0 ? 'color-mix(in srgb, var(--color-panel-accent) 50%, transparent)' : 'transparent';
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
                  backgroundColor: 'var(--color-panel-bg-tertiary)',
                  border: '1px solid var(--color-panel-border)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 16px var(--color-panel-shadow)',
                  zIndex: 1001,
                  maxHeight: 'min(400px, calc(100vh - 200px))',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
                onClick={(e) => e.stopPropagation()}
              >
              {/* Search */}
              <div style={{ padding: '12px', borderBottom: '1px solid var(--color-panel-border)' }}>
                <div style={{ position: 'relative' }}>
                  <Search
                    size={14}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-panel-text-muted)',
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
                      backgroundColor: 'var(--color-panel-bg-secondary)',
                      border: '1px solid var(--color-panel-border)',
                      borderRadius: '4px',
                      height: '32px',
                      paddingLeft: '32px',
                      paddingRight: '12px',
                      fontSize: '12px',
                      color: 'var(--color-panel-text)',
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-panel-accent)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-panel-border)';
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
                      color: 'var(--color-panel-text)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
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
                        backgroundColor: visibleFields.includes(field) ? 'var(--color-panel-accent)' : 'var(--color-panel-border)',
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
                          backgroundColor: 'var(--color-panel-bg)',
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
                borderTop: '1px solid var(--color-panel-border)',
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
                    border: '1px solid var(--color-panel-border)',
                    borderRadius: '4px',
                    color: 'var(--color-panel-text-secondary)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
                    e.currentTarget.style.color = 'var(--color-panel-text)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
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
                    border: '1px solid var(--color-panel-border)',
                    borderRadius: '4px',
                    color: 'var(--color-panel-text-secondary)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
                    e.currentTarget.style.color = 'var(--color-panel-text)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
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
            color: 'var(--color-panel-text-muted)',
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
              <div style={{ position: 'relative' }} data-sort-dropdown>
                <div
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-panel-bg-tertiary)',
                    border: '1px solid var(--color-panel-border)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: 'var(--color-panel-text)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-panel-text-muted)';
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-active)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-panel-border)';
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Fingerprint size={14} style={{ color: 'var(--color-panel-text-secondary)' }} />
                    <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                      {draftSortConfig.field}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ChevronDown 
                      size={12} 
                      style={{ 
                        color: 'var(--color-panel-text-muted)',
                        transform: isSortDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                      }} 
                    />
                    <X
                      size={12}
                      style={{
                        color: 'var(--color-panel-text-muted)',
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
                        e.currentTarget.style.color = 'var(--color-panel-error)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '0';
                        e.currentTarget.style.color = 'var(--color-panel-text-muted)';
                      }}
                    />
                  </div>
                </div>

                {isSortDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      backgroundColor: 'var(--color-panel-bg-tertiary)',
                      border: '1px solid var(--color-panel-border)',
                      borderRadius: '6px',
                      boxShadow: '0 4px 16px var(--color-panel-shadow)',
                      zIndex: 1000,
                      maxHeight: '300px',
                      overflow: 'auto',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Search */}
                    <div style={{ padding: '8px', borderBottom: '1px solid var(--color-panel-border)' }}>
                      <div style={{ position: 'relative' }}>
                        <Search
                          size={12}
                          style={{
                            position: 'absolute',
                            left: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--color-panel-text-muted)',
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
                            backgroundColor: 'var(--color-panel-bg-secondary)',
                            border: '1px solid var(--color-panel-border)',
                            borderRadius: '4px',
                            height: '28px',
                            paddingLeft: '28px',
                            paddingRight: '8px',
                            fontSize: '12px',
                            color: 'var(--color-panel-text)',
                            outline: 'none',
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-panel-accent)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-panel-border)';
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
                              handleSetSort(index.fields[0], draftSortConfig.direction);
                              setIsSortDropdownOpen(false);
                              setSortSearchQuery('');
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '12px',
                              color: 'var(--color-panel-text)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'background-color 0.2s',
                              backgroundColor: draftSortConfig.field === index.fields[0] 
                                ? 'color-mix(in srgb, var(--color-panel-accent) 20%, transparent)' 
                                : 'transparent',
                            }}
                            onMouseEnter={(e) => {
                              if (draftSortConfig.field !== index.fields[0]) {
                                e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (draftSortConfig.field !== index.fields[0]) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            {index.name === '_creationTime' ? (
                              <Clock size={14} style={{ color: 'var(--color-panel-text-secondary)' }} />
                            ) : index.name === '_id' ? (
                              <FileText size={14} style={{ color: 'var(--color-panel-text-secondary)' }} />
                            ) : (
                              <Fingerprint size={14} style={{ color: 'var(--color-panel-text-secondary)' }} />
                            )}
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 500 }}>{index.label}</div>
                              <div style={{ 
                                fontSize: '10px', 
                                color: 'var(--color-panel-text-muted)',
                                fontFamily: 'monospace',
                                marginTop: '2px',
                              }}>
                                ({index.fields.join(', ')})
                              </div>
                            </div>
                            {draftSortConfig.field === index.fields[0] && (
                              <span style={{ 
                                color: 'var(--color-panel-accent)',
                                fontSize: '12px',
                              }}>✓</span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
              <div
                onClick={handleToggleSortDirection}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: 'var(--color-panel-bg-tertiary)',
                  border: '1px solid var(--color-panel-border)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: 'var(--color-panel-text)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-panel-text-muted)';
                  e.currentTarget.style.backgroundColor = 'var(--color-panel-active)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-panel-border)';
                  e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ArrowDownUp size={14} style={{ color: 'var(--color-panel-text-secondary)' }} />
                  <span style={{ textTransform: 'capitalize' }}>
                    {draftSortConfig.direction === 'asc' ? 'Ascending' : 'Descending'}
                  </span>
                </div>
                <X
                  size={12}
                  style={{
                    color: 'var(--color-panel-text-muted)',
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
                    e.currentTarget.style.color = 'var(--color-panel-text)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0';
                    e.currentTarget.style.color = 'var(--color-panel-text-muted)';
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
                  backgroundColor: 'var(--color-panel-bg-tertiary)',
                  border: '1px solid var(--color-panel-border)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: 'var(--color-panel-text)',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-panel-text-muted)';
                  e.currentTarget.style.backgroundColor = 'var(--color-panel-active)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-panel-border)';
                  e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
                }}
              >
                <span>Select field to sort...</span>
                <ChevronDown size={12} style={{ color: 'var(--color-panel-text-muted)' }} />
              </button>

              {isSortDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    backgroundColor: 'var(--color-panel-bg-tertiary)',
                    border: '1px solid var(--color-panel-border)',
                    borderRadius: '6px',
                    boxShadow: '0 4px 16px var(--color-panel-shadow)',
                    zIndex: 1000,
                    maxHeight: '300px',
                    overflow: 'auto',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Search */}
                  <div style={{ padding: '8px', borderBottom: '1px solid var(--color-panel-border)' }}>
                    <div style={{ position: 'relative' }}>
                      <Search
                        size={12}
                        style={{
                          position: 'absolute',
                          left: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--color-panel-text-muted)',
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
                          backgroundColor: 'var(--color-panel-bg-secondary)',
                          border: '1px solid var(--color-panel-border)',
                          borderRadius: '4px',
                          height: '28px',
                          paddingLeft: '28px',
                          paddingRight: '8px',
                          fontSize: '12px',
                          color: 'var(--color-panel-text)',
                          outline: 'none',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-panel-accent)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-panel-border)';
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
                            color: 'var(--color-panel-text)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'background-color 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {index.name === '_creationTime' ? (
                            <Clock size={14} style={{ color: 'var(--color-panel-text-secondary)' }} />
                          ) : index.name === '_id' ? (
                            <FileText size={14} style={{ color: 'var(--color-panel-text-secondary)' }} />
                          ) : (
                            <Fingerprint size={14} style={{ color: 'var(--color-panel-text-secondary)' }} />
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500 }}>{index.label}</div>
                            <div style={{ 
                              fontSize: '10px', 
                              color: 'var(--color-panel-text-muted)',
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
              color: 'var(--color-panel-text-muted)',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Indexed Filters
            </span>
            <Info size={12} style={{ color: 'var(--color-panel-text-muted)', cursor: 'help' }} />
            <div style={{ height: '1px', backgroundColor: 'var(--color-panel-border)', flex: 1, opacity: 0.5 }} />
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
                gap: '8px',
                padding: '12px',
                backgroundColor: 'var(--color-panel-bg-tertiary)',
                border: '1px solid var(--color-panel-border)',
                borderRadius: '8px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-panel-text-muted)';
                e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-panel-bg-tertiary) 95%, var(--color-panel-bg-secondary))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-panel-border)';
                e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={filter.enabled}
                    onChange={(e) => handleUpdateFilter(index, { enabled: e.target.checked })}
                    style={{
                      appearance: 'none',
                      width: '16px',
                      height: '16px',
                      backgroundColor: filter.enabled ? 'var(--color-panel-error)' : 'var(--color-panel-bg-secondary)',
                      border: filter.enabled ? '1px solid var(--color-panel-error)' : '1px solid var(--color-panel-border)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      position: 'relative',
                      margin: 0,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!filter.enabled) {
                        e.currentTarget.style.borderColor = 'var(--color-panel-error)';
                        e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-panel-bg-secondary) 80%, var(--color-panel-error))';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!filter.enabled) {
                        e.currentTarget.style.borderColor = 'var(--color-panel-border)';
                        e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-secondary)';
                      }
                    }}
                  />
                  {filter.enabled && (
                    <span
                      style={{
                        position: 'absolute',
                        left: '3px',
                        top: '1px',
                        color: 'var(--color-panel-bg)',
                        fontSize: '11px',
                        pointerEvents: 'none',
                        fontWeight: 'bold',
                        lineHeight: '16px',
                      }}
                    >
                      ✓
                    </span>
                  )}
                </div>
                <Dropdown
                  value={filter.field}
                  options={allFields.map(field => ({
                    value: field,
                    label: field,
                  }))}
                  onChange={(newField) => handleUpdateFilter(index, { field: newField })}
                  placeholder="Select field..."
                  triggerStyle={{
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: 'var(--color-panel-text)',
                    padding: '6px 10px',
                    minWidth: '140px',
                    height: '28px',
                    backgroundColor: 'var(--color-panel-bg-secondary)',
                    border: '1px solid var(--color-panel-border)',
                  }}
                  dropdownStyle={{
                    maxHeight: '250px',
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--color-panel-bg-secondary)',
                border: '1px solid var(--color-panel-border)',
                borderRadius: '6px',
                overflow: 'hidden',
                height: '36px',
                boxShadow: '0 1px 3px var(--color-panel-shadow)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-panel-text-muted)';
                e.currentTarget.style.boxShadow = '0 2px 6px var(--color-panel-shadow)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-panel-border)';
                e.currentTarget.style.boxShadow = '0 1px 3px var(--color-panel-shadow)';
              }}
              >
                {/* Operator */}
                <Dropdown<FilterClause['op']>
                  value={filter.op}
                  options={operatorOptions.map(op => ({
                    value: op.value as FilterClause['op'],
                    label: op.label,
                  }))}
                  onChange={(newOp) => {
                    handleUpdateFilter(index, { 
                      op: newOp,
                      value: (newOp === 'isType' || newOp === 'isNotType') && 
                             (filter.op !== 'isType' && filter.op !== 'isNotType')
                        ? '' 
                        : filter.value
                    });
                  }}
                  minWidth={120}
                  maxHeight={250}
                  triggerStyle={{
                    minWidth: '40px',
                  }}
                />

                {/* Value Input */}
                {(filter.op === 'isType' || filter.op === 'isNotType') ? (
                  <div style={{
                    flex: 1,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    <Dropdown
                      value={filter.value || ''}
                      options={[
                        { value: '', label: 'Select type...' },
                        ...typeOptions.map(type => ({
                          value: type.value,
                          label: type.label,
                        })),
                      ]}
                      onChange={(newValue) => handleUpdateFilter(index, { value: newValue })}
                      placeholder="Select type..."
                      triggerStyle={{
                        border: 'none',
                        borderRight: 'none',
                        backgroundColor: 'var(--color-panel-bg-secondary)',
                        fontSize: '11px',
                        height: '100%',
                        flex: 1,
                      }}
                      dropdownStyle={{
                        maxHeight: '200px',
                      }}
                      minWidth={150}
                    />
                  </div>
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
                      backgroundColor: 'var(--color-panel-bg-secondary)',
                      padding: '0 8px',
                      fontSize: '11px',
                      color: 'var(--color-panel-text)',
                      border: 'none',
                      outline: 'none',
                      fontFamily: 'monospace',
                      height: '100%',
                      transition: 'background-color 0.2s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-panel-bg)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-secondary)';
                    }}
                  />
                )}

                <button
                  type="button"
                  onClick={() => handleRemoveFilter(index)}
                  style={{
                    padding: '0 8px',
                    color: 'var(--color-panel-text-muted)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--color-panel-error)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--color-panel-text-muted)';
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
                padding: '16px', 
                color: 'var(--color-panel-text-muted)', 
                fontSize: '12px',
                fontStyle: 'italic',
                textAlign: 'center',
                backgroundColor: 'var(--color-panel-bg-tertiary)',
                border: '1px dashed var(--color-panel-border)',
                borderRadius: '8px',
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
              color: 'var(--color-panel-text-muted)',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Other Filters
            </span>
            <Info size={12} style={{ color: 'var(--color-panel-text-muted)', cursor: 'help' }} />
            <div style={{ height: '1px', backgroundColor: 'var(--color-panel-border)', flex: 1, opacity: 0.5 }} />
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
                gap: '8px',
                padding: '12px',
                backgroundColor: 'var(--color-panel-bg-tertiary)',
                border: '1px solid var(--color-panel-border)',
                borderRadius: '8px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-panel-text-muted)';
                e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-panel-bg-tertiary) 95%, var(--color-panel-bg-secondary))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-panel-border)';
                e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={filter.enabled}
                    onChange={(e) => handleUpdateFilter(index, { enabled: e.target.checked })}
                    style={{
                      appearance: 'none',
                      width: '16px',
                      height: '16px',
                      backgroundColor: filter.enabled ? 'var(--color-panel-accent)' : 'var(--color-panel-bg-secondary)',
                      border: filter.enabled ? '1px solid var(--color-panel-accent)' : '1px solid var(--color-panel-border)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      position: 'relative',
                      margin: 0,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!filter.enabled) {
                        e.currentTarget.style.borderColor = 'var(--color-panel-accent)';
                        e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-panel-bg-secondary) 80%, var(--color-panel-accent))';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!filter.enabled) {
                        e.currentTarget.style.borderColor = 'var(--color-panel-border)';
                        e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-secondary)';
                      }
                    }}
                  />
                  {filter.enabled && (
                    <span
                      style={{
                        position: 'absolute',
                        left: '3px',
                        top: '1px',
                        color: 'var(--color-panel-bg)',
                        fontSize: '11px',
                        pointerEvents: 'none',
                        fontWeight: 'bold',
                        lineHeight: '16px',
                      }}
                    >
                      ✓
                    </span>
                  )}
                </div>
                <Dropdown
                  value={filter.field}
                  options={allFields.map(field => ({
                    value: field,
                    label: field,
                  }))}
                  onChange={(newField) => handleUpdateFilter(index, { field: newField })}
                  placeholder="Select field..."
                  triggerStyle={{
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: 'var(--color-panel-text)',
                    padding: '6px 10px',
                    minWidth: '140px',
                    height: '28px',
                    backgroundColor: 'var(--color-panel-bg-secondary)',
                    border: '1px solid var(--color-panel-border)',
                  }}
                  dropdownStyle={{
                    maxHeight: '250px',
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--color-panel-bg-secondary)',
                border: '1px solid var(--color-panel-border)',
                borderRadius: '6px',
                overflow: 'hidden',
                height: '36px',
                boxShadow: '0 1px 3px var(--color-panel-shadow)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-panel-text-muted)';
                e.currentTarget.style.boxShadow = '0 2px 6px var(--color-panel-shadow)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-panel-border)';
                e.currentTarget.style.boxShadow = '0 1px 3px var(--color-panel-shadow)';
              }}
              >
                {/* Operator */}
                <Dropdown<FilterClause['op']>
                  value={filter.op}
                  options={operatorOptions.map(op => ({
                    value: op.value as FilterClause['op'],
                    label: op.label,
                  }))}
                  onChange={(newOp) => {
                    handleUpdateFilter(index, { 
                      op: newOp,
                      value: (newOp === 'isType' || newOp === 'isNotType') && 
                             (filter.op !== 'isType' && filter.op !== 'isNotType')
                        ? '' 
                        : filter.value
                    });
                  }}
                  minWidth={120}
                  maxHeight={250}
                  triggerStyle={{
                    minWidth: '40px',
                  }}
                />

                {/* Value Input */}
                <div style={{
                  flex: 1,
                  backgroundColor: 'var(--color-panel-bg-secondary)',
                  padding: '0 8px',
                  display: 'flex',
                  alignItems: 'center',
                  height: '100%',
                  overflow: 'hidden',
                }}>
                  {(filter.op === 'eq' || filter.op === 'neq') && (
                    <span style={{
                      color: 'var(--color-panel-error)',
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
                      color: 'var(--color-panel-text)',
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
                    color: 'var(--color-panel-text-muted)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--color-panel-error)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--color-panel-text-muted)';
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
        <div style={{ paddingTop: '12px', paddingBottom: '4px' }}>
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
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--color-panel-text)',
              backgroundColor: 'var(--color-panel-bg-tertiary)',
              border: '1px solid var(--color-panel-border)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 1px 2px var(--color-panel-shadow)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-panel-accent)';
              e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-panel-bg-tertiary) 90%, var(--color-panel-accent))';
              e.currentTarget.style.boxShadow = '0 2px 4px var(--color-panel-shadow)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-panel-border)';
              e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
              e.currentTarget.style.boxShadow = '0 1px 2px var(--color-panel-shadow)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Plus size={16} />
            Add filter
          </button>
        </div>
      </div>

      {/* Footer Actions */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--color-panel-border)',
        backgroundColor: 'var(--color-panel-bg-secondary)',
      }}>
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--color-panel-bg)',
            backgroundColor: 'var(--color-panel-accent)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 6px color-mix(in srgb, var(--color-panel-accent) 20%, transparent)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-panel-accent-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-panel-accent)';
          }}
        >
          Apply Filters
        </button>
      </div>
    </form>
  );
};
