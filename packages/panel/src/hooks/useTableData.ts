import { useState, useEffect, useCallback, useRef } from 'react';
import type { 
  TableDefinition, 
  TableDocument, 
  PaginationOptions, 
  PageArgs, 
  FilterExpression, 
  UseTableDataProps,
  UseTableDataReturn,
  SortConfig
} from '../types';
import { saveActiveTable, getTableFilters, saveTableFilters } from '../utils/storage';
import { fetchTablesFromApi } from '../utils/api/tables';
import { patchDocumentFields } from '../utils/api/documents';
import { mockFetchTablesFromApi } from '../utils/mockData';

export const useTableData = ({
  /**
   * The URL of the Convex instance.
   * Used to configure the connection to the Convex backend.
   * @required
   */
  convexUrl,

  /**
   * Authentication token for accessing Convex API.
   * Required for securing access to data.
   * Should be kept private and not exposed to clients.
   * @required
   */
  accessToken,

  /**
   * Convex admin client instance.
   * Required for making API calls to your Convex backend.
   * Must be initialized and configured before passing.
   * @required
   */
  adminClient,

  /**
   * Error handling callback.
   * Called when errors occur during data fetching or processing.
   * Receives error message string as parameter.
   * @param error Error message
   */
  onError,

  /**
   * Whether to use mock data instead of real API data.
   * Useful for development, testing, and demos.
   * @default false
   */
  useMockData = false,

  /**
   * Optional component ID to filter tables/data by component.
   * If null or 'app', fetches root app tables/data.
   */
  componentId = null,
}: UseTableDataProps): UseTableDataReturn => {
  // Use a ref to track if filters have been loaded from storage
  const filtersLoadedRef = useRef<Record<string, boolean>>({});
  // Add a ref to track the previous table
  const prevTableRef = useRef<string | null>(null);
  // Add a ref to track the current filters
  const filtersRef = useRef<FilterExpression>({ clauses: [] });
  // Add a ref to track the last table we cleared/fetched for to prevent infinite loops
  const lastClearedTableRef = useRef<string | null>(null);
  
  const [tables, setTables] = useState<TableDefinition>({});
  const [selectedTable, setSelectedTableState] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<TableDocument[]>([]);
  const [documentCount, setDocumentCount] = useState<number>(0);
  const [continueCursor, setContinueCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filters, setFilters] = useState<FilterExpression>({ clauses: [] });
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  /**
   * Use a ref to track the last fetch request
   * This helps prevent duplicate requests and ensures consistent filtering
   */
  const lastFetchRef = useRef<{
    tableName: string | null;
    filters: FilterExpression | null;
    cursor: string | null;
    sortConfig: SortConfig | null;
  }>({
    tableName: null,
    filters: null,
    cursor: null,
    sortConfig: null
  });

  /**
   * Use a ref to track loading state
   */
  const loadingTimerRef = useRef<number | null>(null);

  /**
   * Request cache to prevent duplicate calls
   * Maps cache keys to timestamps to expire old entries
   */
  const requestCacheRef = useRef<Map<string, number>>(new Map());
  
  /**
   * Cache expiration time in milliseconds.
   * Keep this shorter than our periodic refresh interval so that
   * real-time polling is never suppressed by the dedupe cache.
   */
  const CACHE_EXPIRY_TIME = 250; // 0.25 seconds
  
  /**
   * Track fetch debounce timers by table name
   * This allows us to debounce repeated requests for the same table
   */
  const debounceTimersRef = useRef<Record<string, number>>({});
  
  /**
   * Debounce time in milliseconds for table data fetches.
   * Kept small so filter/sort changes feel snappy.
   */
  const DEBOUNCE_TIME = 150; // 150ms
  
  /**
   * Function to clean up expired cache entries
   * Using useRef instead of useCallback to avoid circular dependencies
   */
  const cleanupCacheRef = useRef((cache: Map<string, number>) => {
    const now = Date.now();
    Array.from(cache.entries()).forEach(([key, timestamp]) => {
      if (now - timestamp > CACHE_EXPIRY_TIME) {
        cache.delete(key);
      }
    });
  });
  
  /**
   * Wrapper for setSelectedTable that also updates localStorage
   */
  const setSelectedTable = useCallback((tableName: string) => {
    setSelectedTableState(tableName);
    saveActiveTable(tableName);
  }, []);

  /**
   * Fetch all tables from the Convex instance
   */
  const fetchTables = useCallback(async () => {
    setIsLoading(true);
    setError(null);
        
    try {
      // Normalize componentId: 'app' means root (null)
      const normalizedComponentId = componentId === 'app' || componentId === null ? null : componentId;

      // Use mock data if useMockData is true
      const { tables: tableData, selectedTable: newSelectedTable } = useMockData
        ? await mockFetchTablesFromApi()
        : await fetchTablesFromApi({
            convexUrl,
            accessToken,
            adminClient,
            componentId: normalizedComponentId
          });

      setTables(tableData);
      // Set selected table - always ensure we have one selected if tables exist
      if (newSelectedTable) {
        setSelectedTable(newSelectedTable);
      } else if (Object.keys(tableData).length > 0) {
        // If no table was returned but we have tables, select the first one
        // This ensures we always have a table selected to fetch data for
        const firstTable = Object.keys(tableData)[0];
        if (firstTable) {
          console.debug('No selected table returned, selecting first table:', firstTable);
          setSelectedTable(firstTable);
        }
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [convexUrl, accessToken, onError, adminClient, setSelectedTable, useMockData, componentId]);

  /**
   * Fetch table data
   */
  const fetchTableData = useCallback(async (tableName: string, cursor: string | null = null) => {
    if (!tableName) {
      return;
    }
    
    // For real data, we need adminClient
    if (!useMockData && !adminClient) {
      return;
    }
    
    // Clean up expired cache entries
    cleanupCacheRef.current(requestCacheRef.current);
        
    // Generate a unique request ID for logging
    const requestId = Date.now();
    
    // Check if this is a duplicate request
    const lastFetch = lastFetchRef.current;
    const currentFilters = filtersRef.current;
    const filtersJson = JSON.stringify(currentFilters);
    const lastFiltersJson = lastFetch.filters ? JSON.stringify(lastFetch.filters) : null;
    const sortJson = JSON.stringify(sortConfig);
    const lastSortJson = JSON.stringify(lastFetch.sortConfig);
    
    // Create a cache key for deduplication
    const cacheKey = `${tableName}|${cursor || 'null'}|${filtersJson}|${sortJson}`;
    
    // Check the request cache first
    if (requestCacheRef.current.has(cacheKey)) {
      const cacheTime = requestCacheRef.current.get(cacheKey) || 0;
      const now = Date.now();
      
      // If we have a recent cache hit, skip this request
      if (now - cacheTime < CACHE_EXPIRY_TIME) {
        return;
      }
    }
    
    // Add this request to the cache
    requestCacheRef.current.set(cacheKey, Date.now());
    
    // Enhanced deduplication - check if we've already made this exact request recently
    if (
      cursor !== null && // Always allow first page requests to refresh data
      tableName === lastFetch.tableName && 
      cursor === lastFetch.cursor &&
      filtersJson === lastFiltersJson &&
      sortJson === lastSortJson
    ) {
      console.debug(`[${requestId}] Skipping duplicate fetchTableData request:`, {
        tableName,
        cursor,
        filters: currentFilters,
        sortConfig
      });
      setHasMore(false);
      setIsLoadingMore(false);
      return;
    }
    
    // Clear any existing loading timer
    if (loadingTimerRef.current !== null) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
    
    // For filter operations, set loading state immediately
    if (cursor === null) {
      // Don't show loading state when only changing sort config
      const isOnlySortChange = 
        tableName === lastFetch.tableName && 
        filtersJson === lastFiltersJson &&
        sortJson !== lastSortJson;

      if (!isOnlySortChange) {
        // Use a timer to delay showing loading state
        // This prevents flashing for quick operations
        loadingTimerRef.current = window.setTimeout(() => {
          setIsLoading(true);
          loadingTimerRef.current = null;
        }, 150); // Short delay to prevent flashing
      }
    } else if (cursor) {
      setIsLoadingMore(true);
    }
    
    // Update last fetch reference immediately to prevent duplicate calls
    lastFetchRef.current = {
      tableName,
      filters: JSON.parse(JSON.stringify(currentFilters)),
      cursor,
      sortConfig: sortConfig ? { ...sortConfig } : null
    };
    
    setError(null);
    
    try {
      // If using mock data, generate mock documents
      if (useMockData) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Generate mock documents based on the table schema
        let mockDocuments = generateMockDocuments(tableName, cursor === null ? 25 : 10);
        
        // Apply sorting to mock data if sort config is provided
        if (sortConfig) {
          mockDocuments = sortDocuments(mockDocuments, sortConfig);
        }
                
        if (cursor === null) {
          setDocuments(mockDocuments);
        } else {
          setDocuments((prev: TableDocument[]) => [...prev, ...mockDocuments]);
        }
        
        // Set a fake cursor for pagination
        setContinueCursor(cursor === null ? 'mock-cursor-1' : 'mock-cursor-2');
        
        // Simulate having more data for the first page, then no more
        setHasMore(cursor === null);
        
        setDocumentCount((prev: number) => cursor === null ? mockDocuments.length : prev + mockDocuments.length);
        return;
      }
      
      // Real data fetching logic
      const page: PaginationOptions = {
        cursor,
        numItems: 25,
        id: Date.now(),
      };
      
      // Only create filterString if we have filters
      const filterString = currentFilters.clauses.length > 0 
        ? btoa(JSON.stringify({
            clauses: currentFilters.clauses.map(clause => ({
              op: clause.op === 'isType' ? 'type' : 
                  clause.op === 'isNotType' ? 'notype' : 
                  clause.op,
              field: clause.field,
              value: clause.value,
              enabled: true,
              id: `${clause.field}_${Date.now()}`
            }))
          }))
        : null;

      // Normalize componentId: 'app' means root (null)
      const normalizedComponentId = componentId === 'app' || componentId === null ? null : componentId;

      const args: PageArgs = {
        paginationOpts: page,
        table: tableName,
        filters: filterString,
        componentId: normalizedComponentId,
      };

      if (!adminClient) {
        setIsLoading(false);
        setIsLoadingMore(false);
        if (onError) onError("Admin client is not available");
        return;
      }

      const result = await adminClient.query(
        "_system/frontend/paginatedTableDocuments:default" as any,
        args
      );

      if (result.page === null || result.page === undefined) {
        console.error('Received null/undefined page in result:', result);
        throw new Error('Invalid response format');
      }
      
      let newDocuments = result.page || [];
      
      // Apply sorting if sortConfig is provided
      if (sortConfig) {
        newDocuments = sortDocuments(newDocuments, sortConfig);
      }
      
      if (cursor === null) {
        setDocuments(newDocuments);
      } else {
        // For pagination, we need to make sure the new documents are also sorted correctly
        // Use functional update to avoid depending on documents in the callback
        setDocuments((prevDocuments) => {
          const combinedDocuments = [...prevDocuments, ...newDocuments];
          const sortedCombined = sortConfig 
            ? sortDocuments(combinedDocuments, sortConfig)
            : combinedDocuments;
          return sortedCombined;
        });
      }
      
      setContinueCursor(result.continueCursor || null);
      setHasMore(!result.isDone);
      setDocumentCount((prev: number) => cursor === null ? result.page.length : prev + result.page.length);
      
    } catch (err) {
      console.error('Error fetching table data:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      // Clear loading timer if request finishes before timer fires
      if (loadingTimerRef.current !== null) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [adminClient, convexUrl, onError, useMockData, sortConfig, componentId]);

  /**
   * Helper to debounce a table fetch
   */
  const debouncedFetchTableData = useCallback((tableName: string, cursor: string | null = null) => {
    // Clear any existing debounce timer for this table
    if (debounceTimersRef.current[tableName]) {
      clearTimeout(debounceTimersRef.current[tableName]);
    }
    
    // Set a new debounce timer
    debounceTimersRef.current[tableName] = window.setTimeout(() => {
      fetchTableData(tableName, cursor);
      // Clear the timer reference after execution
      delete debounceTimersRef.current[tableName];
    }, DEBOUNCE_TIME);
  }, [fetchTableData]);

  /**
   * Generate mock documents for a table
   */
  const generateMockDocuments = useCallback((tableName: string, count: number) => {
    // If the table doesn't exist in our tables object, create a fallback table definition
    if (!tables[tableName]) {
      console.warn(`Table ${tableName} not found in tables. Using fallback definition.`);
      
      // Generate basic documents with the fallback definition
      const mockDocs: TableDocument[] = [];
      
      for (let i = 0; i < count; i++) {
        mockDocs.push({
          _id: `${Math.random().toString(36).substring(2, 8)}`,
          _creationTime: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
          name: `${tableName} ${i}`,
          description: `This is a fallback document for table ${tableName}`
        });
      }
      
      return mockDocs;
    }
    
    const mockDocs: TableDocument[] = [];
    const fields = tables[tableName].fields;
        
    // Generate realistic IDs like "sx7e0w23m8fx13nk7nzwvtze7x7c2cg3"
    const generateRealisticId = () => {
      return Array.from({ length: 32 }, () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        return chars.charAt(Math.floor(Math.random() * chars.length));
      }).join('');
    };
    
    // Generate realistic timestamps like 1741912427727.3538
    const generateRealisticTimestamp = () => {
      const now = Date.now();
      const randomOffset = Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000); // Random time in the last 30 days
      return (now - randomOffset) + Math.random();
    };
    
    for (let i = 0; i < count; i++) {
      const doc: TableDocument = {
        _id: generateRealisticId(),
        _creationTime: generateRealisticTimestamp(),
      };
      
      // Generate values for each field based on its type and name
      fields.forEach(field => {
        if (field.fieldName === '_id' || field.fieldName === '_creationTime') return;
        
        const fieldType = field.shape.type;
        const fieldName = field.fieldName;
        
        // Skip generating values for fields that are typically undefined
        if (['binaryIndex', 'emailAddresses', 'nextDeltaToken'].includes(fieldName)) {
          doc[fieldName] = undefined;
          return;
        }
        
        try {
          switch (fieldType) {
            case 'string':
              // Generate more realistic values based on field name
              if (fieldName === 'emailAddress') {
                const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'example.com'];
                const domain = domains[Math.floor(Math.random() * domains.length)];
                const username = `user${Math.floor(Math.random() * 1000)}`;
                doc[fieldName] = `${username}@${domain}`;
              } else if (fieldName === 'name') {
                const firstNames = ['Alex', 'Jamie', 'Taylor', 'Jordan', 'Casey', 'Morgan', 'Riley', 'Quinn'];
                const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson'];
                const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
                const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
                doc[fieldName] = `${firstName} ${lastName}`;
              } else if (fieldName === 'provider') {
                const providers = ['google', 'github', 'facebook', 'twitter', 'apple'];
                doc[fieldName] = providers[Math.floor(Math.random() * providers.length)];
              } else if (fieldName === 'id') {
                const ids = ['google', 'github', 'facebook', 'twitter', 'apple'];
                doc[fieldName] = ids[Math.floor(Math.random() * ids.length)];
              } else if (fieldName === 'token' || fieldName === 'refreshToken') {
                // Generate a long random string for tokens
                doc[fieldName] = Array.from({ length: 100 }, () => {
                  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
                  return chars.charAt(Math.floor(Math.random() * chars.length));
                }).join('');
              } else if (fieldName === 'scope') {
                doc[fieldName] = 'openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';
              } else if (fieldName === 'userId') {
                doc[fieldName] = generateRealisticId();
              } else if (fieldName === 'title') {
                const titles = ['My First Post', 'Hello World', 'Introduction', 'Welcome', 'Getting Started', 'Tutorial', 'Guide'];
                doc[fieldName] = titles[Math.floor(Math.random() * titles.length)];
              } else if (fieldName === 'content') {
                doc[fieldName] = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
              } else {
                doc[fieldName] = `Mock ${fieldName} ${i}`;
              }
              break;
            case 'number':
              if (fieldName === 'expiresAt') {
                // Generate a future timestamp
                doc[fieldName] = Date.now() + Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000);
              } else {
                doc[fieldName] = Math.floor(Math.random() * 1000);
              }
              break;
            case 'boolean':
              doc[fieldName] = Math.random() > 0.5;
              break;
            case 'null':
              doc[fieldName] = null;
              break;
            case 'Id':
              doc[fieldName] = generateRealisticId();
              break;
            case 'Array':
              if (field.shape.shape?.type === 'string') {
                const arrayLength = Math.floor(Math.random() * 5);
                doc[fieldName] = Array.from({ length: arrayLength }, (_, j) => `Item ${j}`);
              } else {
                doc[fieldName] = [];
              }
              break;
            case 'object':
              doc[fieldName] = { key: `value-${i}` };
              break;
            default:
              if (field.optional) {
                // Skip optional fields sometimes
                if (Math.random() > 0.7) break;
              }
              doc[fieldName] = `Mock ${fieldType} value`;
          }
        } catch (error) {
          console.error(`Error generating value for field ${fieldName} of type ${fieldType}:`, error);
          // Provide a fallback value
          doc[fieldName] = `Fallback value for ${fieldName}`;
        }
      });
      
      mockDocs.push(doc);
    }
    
    return mockDocs;
  }, [tables]);

  /**
   * Update filtersRef when filters change
   */
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  /**
   * Note: filterHistory is only saved when user clicks "Apply Filter" in the filter sheet
   * Only save after filters have been loaded for the current table to avoid
   * overwriting saved filters during initial load and we're also persisting the filters to the backend.
   */
  useEffect(() => {
    if (selectedTable && filtersLoadedRef.current[selectedTable]) {
      // Save to localStorage (fallback is persistence)
      // filterHistory is only saved when "Apply Filter" is clicked
      saveTableFilters(selectedTable, filters);
    }
  }, [filters, selectedTable]);

  /**
   * Handle table selection: reset state and load saved filters
   * This effect runs when the table changes and prepares for a fresh fetch
   * 
   * Priority:
   * 1. If adminClient is available, load from filterHistory (backend)
   * 2. Otherwise, fall back to localStorage
   */
  useEffect(() => {
    if (selectedTable) {
      const isTableChange = prevTableRef.current !== selectedTable;
      
      if (isTableChange) {
        // Reset filters if they're not already empty
        if (filtersRef.current.clauses.length > 0) {
          setFilters({ clauses: [] });
        }
        prevTableRef.current = selectedTable;
        
        // Load filters from storage if we haven't already loaded them for this table
        if (!filtersLoadedRef.current[selectedTable]) {
          // Priority 1: Load from filterHistory if adminClient is available
          if (adminClient && !useMockData) {
            // Load from filterHistory backend
            // Scope format: user:userId:table:tableName (using 'default' as userId for now)
            const scope = `user:default:table:${selectedTable}`;
            
            adminClient.query('convexPanel:getCurrentState' as any, { scope })
              .then((state: { filters: FilterExpression; sortConfig: SortConfig | null } | null) => {
                if (state) {
                  setFilters(state.filters);
                  if (state.sortConfig) {
                    setSortConfig(state.sortConfig);
                  } else {
                    setSortConfig(null);
                  }
                }
                filtersLoadedRef.current[selectedTable] = true;
              })
              .catch((error: any) => {
                // If filterHistory fails, fall back to localStorage
                console.warn('Failed to load from filterHistory, falling back to localStorage:', error);
                const savedFilters = getTableFilters(selectedTable);
                const currentFiltersJson = JSON.stringify(filtersRef.current);
                const savedFiltersJson = JSON.stringify(savedFilters);
                
                if (currentFiltersJson !== savedFiltersJson) {
                  setFilters(() => savedFilters);
                }
                filtersLoadedRef.current[selectedTable] = true;
              });
          } else {
            // Priority 2: Load from localStorage (fallback when adminClient not available)
            const savedFilters = getTableFilters(selectedTable);
            
            // Only update filters if they're different from current filters
            const currentFiltersJson = JSON.stringify(filtersRef.current);
            const savedFiltersJson = JSON.stringify(savedFilters);
            
            if (currentFiltersJson !== savedFiltersJson) {
              // Use functional update to avoid dependency on setFilters
              setFilters(() => savedFilters);
            }
            
            filtersLoadedRef.current[selectedTable] = true;
          }
        }
      }
    }
  }, [selectedTable, adminClient, useMockData]);
  
  /**
   * Fetch data when selected table changes
   * This effect always fetches fresh data when a table is selected,
   * even if it's the same table (e.g., when clicking back to it)
   * It clears documents and fetches in one atomic operation to avoid flickering
   */
  useEffect(() => {
    if (selectedTable && lastClearedTableRef.current !== selectedTable) {
      // Mark this table as being processed to prevent infinite loops
      lastClearedTableRef.current = selectedTable;
      
      // Reset lastFetchRef to ensure fresh fetch happens
      // This prevents deduplication from blocking the fetch when returning to a table
      lastFetchRef.current = {
        tableName: null,
        filters: null,
        cursor: null,
        sortConfig: null
      };
      
      // Clear documents and fetch in one operation to prevent flickering
      // This ensures documents are cleared right before the fetch starts
      setContinueCursor(null);
      setHasMore(true);
      setDocuments([]);
      
      // Fetch data immediately after clearing
      // Use a microtask to ensure state updates are batched and prevent flickering
      Promise.resolve().then(() => {
        // For mock data, fetch immediately
        if (useMockData) {
          fetchTableData(selectedTable, null);
        } else {
          fetchTableData(selectedTable, null);
        }
      });
    }
  }, [selectedTable, fetchTableData, useMockData]);

  /**
   * Add a dedicated effect to handle filter changes and fetch data
   * Separating the filter effect from the table selection effect to avoid duplicate fetches
   * NOTE: This effect is now primarily for filter/sort changes, not table selection
   * Table selection is handled by the effect above
   */
  useEffect(() => {
    // This effect should only run when filters or sort change, not when table changes
    // Table changes are handled by the effect at line 641-655
    if (selectedTable && (filtersRef.current.clauses.length > 0 || sortConfig)) {
      // For mock data, fetch immediately
      if (useMockData) {
        fetchTableData(selectedTable, null);
      } else {
        // Use debounced fetch for better performance
        debouncedFetchTableData(selectedTable, null);
      }
    }
  }, [filters, sortConfig, selectedTable, fetchTableData, debouncedFetchTableData, useMockData]);

  /**
   * Dedicated effect for sort config changes
   */
  useEffect(() => {
    if (!selectedTable || isLoading || !sortConfig) return;
    
    const prevSortConfig = lastFetchRef.current.sortConfig;
    const sortChanged = JSON.stringify(prevSortConfig) !== JSON.stringify(sortConfig);
    
    if (sortChanged) {
      // For sort changes, we don't need to reset the cursor usually,
      // but if we're changing sort direction/field, it makes sense
      setContinueCursor(null);
      setHasMore(true);
      
      // Use debounced fetch for sort operations
      debouncedFetchTableData(selectedTable, null);
    }
  }, [sortConfig, selectedTable, debouncedFetchTableData, isLoading]);
  
  /**
   * Dedicated effect to handle filter changes 
   */
  useEffect(() => {
    if (!selectedTable || isLoading) return;
    
    // Only fetch if we have filters or if this is a filter clear operation
    const previousFilters = lastFetchRef.current.filters;
    const hadPreviousFilters = previousFilters && Array.isArray(previousFilters.clauses) && previousFilters.clauses.length > 0;
    const filtersChanged = hadPreviousFilters !== (filters.clauses.length > 0) || 
      JSON.stringify(previousFilters?.clauses || []) !== JSON.stringify(filters.clauses || []);
    
    if (filtersChanged) {
      // Reset cursor when filters change
      setContinueCursor(null);
      setHasMore(true);
      
      // Use debounced fetch for filter changes
      debouncedFetchTableData(selectedTable, null);
    }
  }, [filters, selectedTable, debouncedFetchTableData, isLoading]);

  /**
   * Patch fields
   */
  const patchFields = useCallback(async (table: string, ids: string[], fields: Record<string, any>) => {
    // If using mock data, simulate a successful patch
    if (useMockData) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Update the documents in state
      setDocuments(prevDocs => {
        return prevDocs.map(doc => {
          if (ids.includes(doc._id)) {
            return { ...doc, ...fields };
          }
          return doc;
        });
      });
      
      return { success: true };
    }
    
    // Otherwise use the real function
    return patchDocumentFields(table, ids, fields, adminClient);
  }, [adminClient, useMockData]);

  /**
   * Observer target
   */
  const observerTarget = useCallback((node: HTMLDivElement) => {
    // Return early if we've reached the end of the table or if loading
    if (!node || !hasMore || isLoading || isLoadingMore) return;
    
    // If hasMore is false, don't set up the observer at all
    if (!hasMore) {
      return () => {};
    }
    
    const observer = new IntersectionObserver(
      entries => {
        // Only trigger if we still have more data to load
        if (entries[0]?.isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          setIsLoadingMore(true);
          fetchTableData(selectedTable, continueCursor);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, selectedTable, continueCursor, fetchTableData]);

  /**
   * Fetch tables
   */
  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  /**
   * Render field type
   */
  const renderFieldType = (field: any): string => {
    if (field.shape.type === 'Id') {
      return `Id<"${field.shape.tableName}">`;
    }
    if (field.shape.type === 'Array') {
      return `${field.shape.shape?.type}[]`;
    }
    return field.shape.type;
  };

  /**
   * Format value
   */
  const formatValue = (value: any, fieldName?: string): string => {
    if (value === undefined || value === null) {
      return 'unset';
    }

    // Helper function to recursively filter underscore fields
    const filterUnderscoreFields = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(item => {
          if (typeof item === 'object' && item !== null) {
            return filterUnderscoreFields(item);
          }
          return item;
        });
      }
      
      if (typeof obj === 'object' && obj !== null) {
        const filtered: Record<string, any> = {};
        for (const [key, val] of Object.entries(obj)) {
          if (!key.startsWith('_')) {
            filtered[key] = typeof val === 'object' && val !== null
              ? filterUnderscoreFields(val)
              : val;
          }
        }
        return filtered;
      }
      
      return obj;
    };

    // Handle objects (including the root level)
    if (typeof value === 'object') {
      // If this is a field that starts with underscore, return the raw value
      if (fieldName?.startsWith('_')) {
        return String(value);
      }
      const filtered = filterUnderscoreFields(value);
      return JSON.stringify(filtered);
    }
    
    // Handle non-object values
    if (fieldName?.startsWith('_')) {
      if (fieldName === '_creationTime' && typeof value === 'number') {
        const date = new Date(value);
        return date.toLocaleString('en-US', {
          month: 'numeric',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
      }
      return String(value);
    }
    
    return String(value);
  };

  /**
   * Get table fields
   */
  const getTableFields = (tableName: string) => {
    if (!tables[tableName] || !tables[tableName].fields) return [];
    return tables[tableName].fields.map(field => field.fieldName);
  };

  /**
   * Get column headers
   */
  const getColumnHeaders = () => {
    if (!selectedTable) return [];
    
    const schemaFields = getTableFields(selectedTable);
    
    const documentFields = new Set<string>();
    documents.forEach(doc => {
      Object.keys(doc).forEach(key => {
        documentFields.add(key);
      });
    });
    
    const allFields = new Set(Array.from(schemaFields).concat(Array.from(documentFields)));
    
    const fields = Array.from(allFields);
    const idIndex = fields.indexOf('_id');
    if (idIndex > -1) {
      fields.splice(idIndex, 1);
      fields.unshift('_id');
    }
    
    return fields;
  };

  /**
   * Helper function to sort documents based on sort configuration
   */
  const sortDocuments = (docs: TableDocument[], config: SortConfig): TableDocument[] => {
    return [...docs].sort((a, b) => {
      const aValue = a[config.field];
      const bValue = b[config.field];
      
      // Handle null/undefined values (sort them to the end regardless of sort direction)
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      // Compare based on value type
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return config.direction === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return config.direction === 'asc' 
          ? aValue - bValue 
          : bValue - aValue;
      }
      
      if (aValue instanceof Date && bValue instanceof Date) {
        return config.direction === 'asc' 
          ? aValue.getTime() - bValue.getTime() 
          : bValue.getTime() - aValue.getTime();
      }
      
      // Default comparison for other types (convert to string)
      const aStr = String(aValue);
      const bStr = String(bValue);
      return config.direction === 'asc' 
        ? aStr.localeCompare(bStr) 
        : bStr.localeCompare(aStr);
    });
  };

  // Clear loading timer on unmount
  useEffect(() => {
    return () => {
      if (loadingTimerRef.current !== null) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
  }, []);

  /**
   * Lightweight "real-time" refresh:
   * Periodically refetch the current table so external writes
   * (for example, from an app using Convex directly) are reflected
   * in the panel without manual reload.
   * 
   * DISABLED: Polling disabled to prevent excessive queries and blinking.
   * Data will only refresh when explicitly requested (filters, sort, manual refresh).
   */
  // useEffect(() => {
  //   if (!selectedTable || useMockData || !adminClient) return;

  //   // Short interval to feel "instant" when other apps write data,
  //   // while still avoiding an excessive load on the admin endpoint.
  //   const REFRESH_INTERVAL_MS = 500;

  //   const intervalId = window.setInterval(() => {
  //     // Use the first page (cursor null) so we always see the latest data.
  //     fetchTableData(selectedTable, null);
  //   }, REFRESH_INTERVAL_MS);

  //   return () => {
  //     window.clearInterval(intervalId);
  //   };
  // }, [selectedTable, fetchTableData, useMockData, adminClient]);

  return {
    tables,
    selectedTable,
    setSelectedTable,
    documents,
    setDocuments,
    isLoading,
    error,
    documentCount,
    continueCursor,
    hasMore,
    isLoadingMore,
    fetchTableData,
    fetchTables,
    patchDocumentFields: patchFields,
    getTableFields,
    getColumnHeaders,
    formatValue,
    renderFieldType,
    observerTarget,
    filters,
    setFilters,
    sortConfig,
    setSortConfig
  };
}; 