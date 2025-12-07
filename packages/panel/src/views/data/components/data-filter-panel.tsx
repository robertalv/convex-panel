import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Info, 
  Fingerprint, 
  ArrowDownAZ,
  ArrowUpAZ,
  Plus,
  X,
  Eye,
  EyeOff,
  Search,
  Clock,
  FileText
} from 'lucide-react';
import type { FilterExpression, FilterClause, TableDefinition } from '../../../types';
import type { SortConfig } from '../../../types/common';
import { operatorOptions, typeOptions } from '../../../utils/constants';
import { Dropdown } from '../../../components/shared';
import { SearchableDropdown } from '../../../components/shared/searchable-dropdown';
import type { SearchableDropdownOption } from '../../../components/shared/searchable-dropdown';

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
  filterHistoryApi: {
    push: (scope: string, state: { filters: FilterExpression; sortConfig: SortConfig | null }) => Promise<void>;
    undo: (scope: string, count?: number) => Promise<{ filters: FilterExpression; sortConfig: SortConfig | null } | null>;
    redo: (scope: string, count?: number) => Promise<{ filters: FilterExpression; sortConfig: SortConfig | null } | null>;
    getStatus: (scope: string) => Promise<{ canUndo: boolean; canRedo: boolean; position: number | null; length: number }>;
    getCurrentState: (scope: string) => Promise<{ filters: FilterExpression; sortConfig: SortConfig | null } | null>;
  };
  /** Optional user ID for scoping filter history. Defaults to 'default' */
  userId?: string;
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
  filterHistoryApi,
  userId = 'default',
}) => {
  // Draft filters - local state that can be applied or cancelled
  const [draftFilters, setDraftFilters] = useState<FilterClause[]>(filters.clauses || []);
  const [draftSortConfig, setDraftSortConfig] = useState<SortConfig | null>(sortConfig);
  
  // Scope for filter history: user:userId:table:tableName
  const filterHistoryScope = `user:${userId}:table:${selectedTable}`;
  const [historyStatus, setHistoryStatus] = useState<{ canUndo: boolean; canRedo: boolean; position: number | null; length: number } | null>(null);
  
  useEffect(() => {
    filterHistoryApi.getStatus(filterHistoryScope)
      .then(setHistoryStatus)
      .catch(() => {
        // Just fail and do nothing
      });
  }, [filterHistoryScope, filterHistoryApi]);
  
  // Load current state from API on mount and when scope changes
  useEffect(() => {
    filterHistoryApi.getCurrentState(filterHistoryScope).then((state) => {
      if (state) {
        setDraftFilters(state.filters.clauses || []);
        setDraftSortConfig(state.sortConfig);
        setFilters(state.filters);
        if (state.sortConfig) {
          setSortConfig(state.sortConfig);
        } else {
          setSortConfig(null);
        }
      }
    }).catch(() => {
      // Just fail and do nothing
    });
  }, [filterHistoryScope, filterHistoryApi, setFilters, setSortConfig]);
  
  // Field visibility state
  const [visibleFields, setVisibleFields] = useState<string[]>(
    propVisibleFields || []
  );

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

  // Prepare sort options for SearchableDropdown
  const sortOptions = React.useMemo<SearchableDropdownOption<string>[]>(() => {
    return availableIndexes.map(index => {
      let icon: React.ReactNode;
      if (index.name === '_creationTime') {
        icon = <Clock size={14} style={{ color: 'var(--color-panel-text-secondary)' }} />;
      } else if (index.name === '_id') {
        icon = <FileText size={14} style={{ color: 'var(--color-panel-text-secondary)' }} />;
      } else {
        icon = <Fingerprint size={14} style={{ color: 'var(--color-panel-text-secondary)' }} />;
      }

      return {
        key: index.name,
        label: (
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 500 }}>{index.label}</span>
            <span style={{ 
              fontSize: '10px', 
              color: 'var(--color-panel-text-muted)',
              fontFamily: 'monospace',
            }}>
              ({index.fields.join(', ')})
            </span>
          </div>
        ),
        value: index.fields[0],
        icon,
        searchValue: `${index.label} ${index.name} ${index.fields.join(' ')}`.toLowerCase(),
      };
    });
  }, [availableIndexes]);

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
  const handleApplyFilters = useCallback(async () => {
    const newFilters: FilterExpression = { clauses: draftFilters.filter(f => f.enabled) };
    setFilters(newFilters);
    if (draftSortConfig) {
      setSortConfig(draftSortConfig);
    } else {
      setSortConfig(null);
    }
    try {
      await filterHistoryApi.push(filterHistoryScope, {
        filters: newFilters,
        sortConfig: draftSortConfig,
      });
      filterHistoryApi.getStatus(filterHistoryScope)
        .then(setHistoryStatus)
        .catch(() => {
          // Just fail and do nothing
        });
    } catch (error) {
      // Just fail and do nothing
    }
    
    // Close the filter panel after applying
    onClose?.();
  }, [draftFilters, draftSortConfig, setFilters, setSortConfig, onClose, filterHistoryApi, filterHistoryScope]);

  const canGoBack = historyStatus?.canUndo ?? false;
  const canGoForward = historyStatus?.canRedo ?? false;

  const handleGoBack = useCallback(async () => {
    if (!canGoBack) return;
    
    try {
      const prevState = await filterHistoryApi.undo(filterHistoryScope, 1);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const newStatus = await filterHistoryApi.getStatus(filterHistoryScope);
      setHistoryStatus(newStatus);
      
      if (prevState) {
        // if we have a previous state, apply it
        setDraftFilters(prevState.filters.clauses || []);
        setDraftSortConfig(prevState.sortConfig);
        setFilters(prevState.filters);
        if (prevState.sortConfig) {
          setSortConfig(prevState.sortConfig);
        } else {
          setSortConfig(null);
        }
      } else {
        // if we moved to position null (before any states)
        // clear filters to show we're at the beginning
        setDraftFilters([]);
        setDraftSortConfig(null);
        setFilters({ clauses: [] });
        setSortConfig(null);
      }
    } catch (error) {
      // Just fail and do nothing
    }
  }, [canGoBack, setFilters, setSortConfig, filterHistoryApi, filterHistoryScope]);

  const handleGoForward = useCallback(async () => {
    if (!canGoForward) return;
    
    try {
      const nextState = await filterHistoryApi.redo(filterHistoryScope, 1);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const newStatus = await filterHistoryApi.getStatus(filterHistoryScope);
      setHistoryStatus(newStatus);
      
      if (nextState) {
        // if we have a next state, apply it
        setDraftFilters(nextState.filters.clauses || []);
        setDraftSortConfig(nextState.sortConfig);
        setFilters(nextState.filters);
        if (nextState.sortConfig) {
          setSortConfig(nextState.sortConfig);
        } else {
          setSortConfig(null);
        }
      }
    } catch (error) {
      // Just fail and do nothing
    }
  }, [canGoForward, setFilters, setSortConfig, filterHistoryApi, filterHistoryScope]);

  const handleRemoveFilter = (index: number) => {
    setDraftFilters(draftFilters.filter((_, i) => i !== index));
  };

  const handleUpdateFilter = (index: number, updates: Partial<FilterClause>) => {
    const updated = draftFilters.map((filter, i) => {
      if (i === index) {
        // If field is being changed, clear the value
        if (updates.field && updates.field !== filter.field) {
          return { ...filter, ...updates, value: '' };
        }
        return { ...filter, ...updates };
      }
      return filter;
    });
    setDraftFilters(updated);
  };

  // Helper to get field type from schema
  const getFieldType = (fieldName: string): string | null => {
    const field = tableSchema?.fields?.find(f => f.fieldName === fieldName);
    if (!field) {
      // Check for special fields
      if (fieldName === '_id') return 'id';
      if (fieldName === '_creationTime') return 'number';
      return null;
    }
    return field.shape?.type || null;
  };

  // Helper to get type indicator based on field type and value
  const getTypeIndicator = (fieldName: string, value: any): { prefix: string; color: string } | null => {
    // First, try to get the field type from schema
    const fieldType = getFieldType(fieldName);
    
    // Build type map from typeOptions with appropriate prefixes and colors
    const getTypeInfo = (type: string): { prefix: string; color: string } | null => {
      // Map type values to short prefixes
      const prefixMap: Record<string, string> = {
        'string': 'str',
        'boolean': 'bool',
        'number': 'num',
        'bigint': 'big',
        'null': 'null',
        'object': 'obj',
        'array': 'arr',
        'id': 'id',
        'bytes': 'bytes',
        'unset': '?',
      };
      
      // Handle Convex-specific numeric types
      if (type === 'float64' || type === 'int64') {
        return { prefix: type === 'float64' ? 'num' : 'int', color: 'var(--color-panel-accent)' };
      }
      
      // Check if type exists in typeOptions
      const typeOption = typeOptions.find(opt => opt.value === type);
      if (typeOption) {
        const prefix = prefixMap[type] || type.slice(0, 3);
        // Color mapping based on type category
        let color = 'var(--color-panel-text-muted)';
        if (type === 'boolean' || type === 'number' || type === 'bigint') {
          color = 'var(--color-panel-accent)';
        } else if (type === 'string') {
          color = 'var(--color-panel-error)';
        }
        return { prefix, color };
      }
      
      return null;
    };
    
    // If we have a field type, prioritize it (especially when value is empty)
    const isEmptyValue = value === null || value === undefined || value === '';
    
    if (fieldType) {
      const typeInfo = getTypeInfo(fieldType);
      if (typeInfo) {
        // If value is empty, always use field type
        if (isEmptyValue) {
          return typeInfo;
        }
        // If value is not empty, still prefer field type but allow value type to override if it's more specific
        return typeInfo;
      }
    }
    
    // Fallback to value type detection only if no field type or value is not empty
    if (isEmptyValue) {
      if (fieldType) {
        const typeInfo = getTypeInfo(fieldType);
        if (typeInfo) return typeInfo;
        return { prefix: fieldType.slice(0, 3) || '?', color: 'var(--color-panel-text-muted)' };
      }
      return null;
    }
    
    const valueType = typeof value;
    
    if (valueType === 'boolean') {
      return { prefix: 'bool', color: 'var(--color-panel-accent)' };
    } else if (valueType === 'number') {
      return { prefix: 'num', color: 'var(--color-panel-accent)' };
    } else if (valueType === 'string') {
      // Only show 'str' if we don't have a field type, or if field type is actually string
      if (fieldType && fieldType !== 'string') {
        // Field type exists and is not string, use field type instead
        const typeInfo = getTypeInfo(fieldType);
        if (typeInfo) return typeInfo;
      }
      return { prefix: 'str', color: 'var(--color-panel-error)' };
    } else if (Array.isArray(value)) {
      return { prefix: 'arr', color: 'var(--color-panel-text-muted)' };
    } else if (valueType === 'object') {
      return { prefix: 'obj', color: 'var(--color-panel-text-muted)' };
    }
    
    return null;
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
        height: '40px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          {/* Navigation History - Full Height */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <button
              type="button"
              onClick={handleGoBack}
              disabled={!canGoBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                padding: 0,
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: canGoBack ? 'pointer' : 'not-allowed',
                color: 'var(--color-panel-text-muted)',
                opacity: canGoBack ? 1 : 0.5,
                flexShrink: 0,
                transition: 'all 0.2s',
                position: 'relative',
                zIndex: 2,
              }}
              onMouseEnter={(e) => {
                if (canGoBack) {
                  e.currentTarget.style.color = 'var(--color-panel-text)';
                  e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                padding: 0,
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: canGoForward ? 'pointer' : 'not-allowed',
                color: 'var(--color-panel-text-muted)',
                opacity: canGoForward ? 1 : 0.5,
                flexShrink: 0,
                transition: 'all 0.2s',
                position: 'relative',
                zIndex: 2,
              }}
              onMouseEnter={(e) => {
                if (canGoForward) {
                  e.currentTarget.style.color = 'var(--color-panel-text)';
                  e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
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
              onClick={(e) => {
                e.stopPropagation();
                setIsFieldVisibilityOpen(!isFieldVisibilityOpen);
              }}
              onMouseDown={(e) => e.stopPropagation()}
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
                onMouseDown={(e) => e.stopPropagation()}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFieldVisibility(field);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    hideAllFields();
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    showAllFields();
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Field Selector */}
              <div style={{ flex: 1 }}>
                <SearchableDropdown
                  selectedValue={draftSortConfig.field}
                  options={sortOptions}
                  onSelect={(field) => handleSetSort(field, draftSortConfig.direction)}
                  placeholder="Select field to sort..."
                  searchPlaceholder="Search fields..."
                  emptyStateText="No fields found"
                  listMaxHeight={300}
                  triggerStyle={{
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: 'var(--color-panel-text)',
                    padding: '6px 12px',
                    minWidth: '100px',
                    height: '28px !important',
                    borderRadius: '6px',
                    backgroundColor: 'var(--color-panel-bg-tertiary)',
                    border: '1px solid var(--color-panel-border)',
                  }}
                />
              </div>
              
              {/* Direction Toggle Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleSortDirection();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: 'var(--color-panel-bg-tertiary)',
                  border: '1px solid var(--color-panel-border)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--color-panel-text)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minWidth: '120px',
                  height: '35px',
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
                {draftSortConfig.direction === 'asc' ? (
                  <ArrowUpAZ size={14} style={{ color: 'var(--color-panel-text-secondary)' }} />
                ) : (
                  <ArrowDownAZ size={14} style={{ color: 'var(--color-panel-text-secondary)' }} />
                )}
                <span style={{ textTransform: 'capitalize' }}>
                  {draftSortConfig.direction === 'asc' ? 'Ascending' : 'Descending'}
                </span>
              </button>
              
              {/* Clear Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveSort();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  padding: '6px',
                  color: 'var(--color-panel-text-muted)',
                  backgroundColor: 'transparent',
                  border: '1px solid transparent',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  height: '28px',
                  width: '28px',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-panel-text)';
                  e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
                  e.currentTarget.style.borderColor = 'var(--color-panel-border)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-panel-text-muted)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
                title="Clear Sort"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <SearchableDropdown
              selectedValue={null}
              options={sortOptions}
              onSelect={(field) => handleSetSort(field, 'desc')}
              placeholder="Select field to sort..."
              searchPlaceholder="Search fields..."
              emptyStateText="No fields found"
              listMaxHeight={300}
            />
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
                alignItems: 'center',
                gap: '6px',
                padding: '8px',
                backgroundColor: 'var(--color-panel-bg-tertiary)',
                border: '1px solid var(--color-panel-border)',
                borderRadius: '6px',
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
              {/* Checkbox */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <input
                  type="checkbox"
                  checked={filter.enabled}
                  onChange={(e) => handleUpdateFilter(index, { enabled: e.target.checked })}
                  style={{
                    appearance: 'none',
                    width: '14px',
                    height: '14px',
                    backgroundColor: filter.enabled ? 'var(--color-panel-error)' : 'var(--color-panel-bg-secondary)',
                    border: filter.enabled ? '1px solid var(--color-panel-error)' : '1px solid var(--color-panel-border)',
                    borderRadius: '3px',
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
                      left: '2px',
                      top: '0px',
                      color: 'var(--color-panel-bg)',
                      fontSize: '10px',
                      pointerEvents: 'none',
                      fontWeight: 'bold',
                      lineHeight: '14px',
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>

              {/* Field Dropdown */}
              <Dropdown
                value={filter.field}
                options={allFields.map(field => ({
                  value: field,
                  label: field,
                }))}
                onChange={(newField) => handleUpdateFilter(index, { field: newField })}
                placeholder="Select field..."
                triggerStyle={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: 'var(--color-panel-text)',
                  padding: '4px 8px',
                  minWidth: '100px',
                  height: '28px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--color-panel-bg-secondary)',
                  border: '1px solid var(--color-panel-border)',
                }}
                dropdownStyle={{
                  maxHeight: '250px',
                }}
              />

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
                minWidth={100}
                maxHeight={250}
                triggerStyle={{
                  fontSize: '11px',
                  minWidth: '80px',
                  height: '28px',
                  padding: '4px 8px',
                }}
              />

              {/* Value Input */}
              {(filter.op === 'isType' || filter.op === 'isNotType') ? (
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
                    fontSize: '11px',
                    height: '28px',
                    padding: '4px 8px',
                    flex: 1,
                    minWidth: '120px',
                  }}
                  dropdownStyle={{
                    maxHeight: '200px',
                  }}
                />
              ) : (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  height: '28px',
                  backgroundColor: 'var(--color-panel-bg-secondary)',
                  border: '1px solid var(--color-panel-border)',
                  borderRadius: '4px',
                  padding: '0 6px',
                  gap: '4px',
                  minWidth: 0,
                }}>
                  {(() => {
                    const typeIndicator = getTypeIndicator(filter.field, filter.value);
                    return typeIndicator ? (
                      <span style={{
                        color: typeIndicator.color,
                        fontSize: '9px',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        padding: '2px 4px',
                        borderRadius: '3px',
                        backgroundColor: 'color-mix(in srgb, var(--color-panel-bg) 60%, transparent)',
                        flexShrink: 0,
                        lineHeight: '1',
                      }}>
                        {typeIndicator.prefix}
                      </span>
                    ) : null;
                  })()}
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
                      minWidth: 0,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.parentElement!.style.borderColor = 'var(--color-panel-accent)';
                      e.currentTarget.parentElement!.style.backgroundColor = 'var(--color-panel-bg)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.parentElement!.style.borderColor = 'var(--color-panel-border)';
                      e.currentTarget.parentElement!.style.backgroundColor = 'var(--color-panel-bg-secondary)';
                    }}
                  />
                </div>
              )}

              {/* Remove Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFilter(index);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  padding: '0 6px',
                  color: 'var(--color-panel-text-muted)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s',
                  flexShrink: 0,
                  height: '28px',
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
                alignItems: 'center',
                gap: '6px',
                padding: '8px',
                backgroundColor: 'var(--color-panel-bg-tertiary)',
                border: '1px solid var(--color-panel-border)',
                borderRadius: '6px',
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
              {/* Checkbox */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <input
                  type="checkbox"
                  checked={filter.enabled}
                  onChange={(e) => handleUpdateFilter(index, { enabled: e.target.checked })}
                  style={{
                    appearance: 'none',
                    width: '14px',
                    height: '14px',
                    backgroundColor: filter.enabled ? 'var(--color-panel-accent)' : 'var(--color-panel-bg-secondary)',
                    border: filter.enabled ? '1px solid var(--color-panel-accent)' : '1px solid var(--color-panel-border)',
                    borderRadius: '3px',
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
                      left: '2px',
                      top: '0px',
                      color: 'var(--color-panel-bg)',
                      fontSize: '10px',
                      pointerEvents: 'none',
                      fontWeight: 'bold',
                      lineHeight: '14px',
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>

              {/* Field Dropdown */}
              <Dropdown
                value={filter.field}
                options={allFields.map(field => ({
                  value: field,
                  label: field,
                }))}
                onChange={(newField) => handleUpdateFilter(index, { field: newField })}
                placeholder="Select field..."
                triggerStyle={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: 'var(--color-panel-text)',
                  padding: '4px 8px',
                  minWidth: '100px',
                  height: '28px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--color-panel-bg-secondary)',
                  border: '1px solid var(--color-panel-border)',
                }}
                dropdownStyle={{
                  maxHeight: '250px',
                }}
              />

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
                minWidth={100}
                maxHeight={250}
                triggerStyle={{
                  fontSize: '11px',
                  minWidth: '80px',
                  height: '28px',
                  padding: '4px 8px',
                }}
              />

              {/* Value Input */}
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                height: '28px',
                backgroundColor: 'var(--color-panel-bg-secondary)',
                border: '1px solid var(--color-panel-border)',
                borderRadius: '4px',
                padding: '0 6px',
                gap: '4px',
                minWidth: 0,
              }}>
                {(() => {
                  const typeIndicator = getTypeIndicator(filter.field, filter.value);
                  return typeIndicator ? (
                    <span style={{
                      color: typeIndicator.color,
                      fontSize: '9px',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      padding: '2px 4px',
                      borderRadius: '3px',
                      backgroundColor: 'color-mix(in srgb, var(--color-panel-bg) 60%, transparent)',
                      flexShrink: 0,
                      lineHeight: '1',
                    }}>
                      {typeIndicator.prefix}
                    </span>
                  ) : null;
                })()}
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
                    minWidth: 0,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.parentElement!.style.borderColor = 'var(--color-panel-accent)';
                    e.currentTarget.parentElement!.style.backgroundColor = 'var(--color-panel-bg)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.parentElement!.style.borderColor = 'var(--color-panel-border)';
                    e.currentTarget.parentElement!.style.backgroundColor = 'var(--color-panel-bg-secondary)';
                  }}
                />
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFilter(index);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  padding: '0 6px',
                  color: 'var(--color-panel-text-muted)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s',
                  flexShrink: 0,
                  height: '28px',
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
            );
          })}

        </div>

        {/* Action Bar */}
        <div style={{ paddingTop: '12px', paddingBottom: '4px' }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
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
              onMouseDown={(e) => e.stopPropagation()}
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
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
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
