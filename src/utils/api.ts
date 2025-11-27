import { ROUTES } from '../utils/constants';
import { LogEntry, TableDefinition, TableField } from '../types';
import { getActiveTable } from './storage';
import { FetchLogsOptions, FetchLogsResponse, FetchTablesOptions, FetchTablesResponse } from '../types';
import { mockFetchLogsFromApi, mockFetchTablesFromApi, mockFetchCacheHitRate, mockFetchFailureRate, mockFetchSchedulerLag } from './mockData';

/**
 * Fetch logs from the Convex API
 * @param FetchLogsOptions
 * @returns FetchLogsResponse
 */
export async function fetchLogsFromApi({
  /** 
   * The cursor position to fetch logs from.
   * Used for pagination and real-time log streaming.
   * Pass the newCursor from previous response to get next batch.
   * @default 'now' 
   */
  cursor,

  /**
   * URL of your Convex deployment.
   * Format: https://[deployment-name].convex.cloud
   * Required for making API calls to correct environment.
   * @required
   */
  convexUrl,

  /**
   * Authentication token for Convex API access.
   * Required to authorize log fetching requests.
   * Keep secure and do not expose to clients.
   * @required
   */
  accessToken,

  /**
   * AbortSignal for cancelling fetch requests.
   * Useful for cleanup when component unmounts.
   * Pass signal from AbortController to enable cancellation.
   * @optional
   */
  signal,

  /**
   * Whether to use mock data instead of making API calls.
   * Useful for development, testing, and demos.
   * @default false
   */
  useMockData = false
}: FetchLogsOptions & { useMockData?: boolean }): Promise<FetchLogsResponse> {
  // Use mock data if useMockData is true
  if (useMockData) {
    return mockFetchLogsFromApi(cursor);
  }

  // Create URL object based on convex url
  const urlObj = new URL(convexUrl);
  const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;
  
  // Stream function logs
  const response = await fetch(`${baseUrl}${ROUTES.STREAM_FUNCTION_LOGS}?cursor=${cursor}`, {
    headers: {
      "authorization": `Convex ${accessToken}`
    },
    signal,
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch logs: HTTP ${response.status}`);
  }
  
  const data = await response.json();
  
  // Format logs to our log format
  const formattedLogs: LogEntry[] = data.entries?.map((entry: any) => ({
    timestamp: entry.timestamp || Date.now(),
    topic: entry.topic || 'console',
    function: {
      type: entry.udfType,
      path: entry.identifier,
      cached: entry.cachedResult,
      request_id: entry.requestId
    },
    log_level: entry.level || 'INFO',
    message: entry.message || JSON.stringify(entry),
    execution_time_ms: entry.executionTime ? entry.executionTime * 1000 : undefined,
    status: entry.success === null 
      ? undefined 
      : (typeof entry.success === 'object' && entry.success !== null)
        ? 'success'  // If success is an object (like {status: "200"}), it's a success
        : entry.success === true
          ? 'success'
          : 'error',
    error_message: entry.error,
    raw: entry
  })) || [];

  return {
    logs: formattedLogs,
    newCursor: data.newCursor,
    hostname: urlObj.hostname
  };
}

/**
 * Fetch all field names for a table using the getAllTableFields system query
 * This is more efficient than sampling documents and handles pagination limits better
 */
async function getAllTableFields(
  adminClient: any,
  tableName: string,
  componentId: string | null,
  sampleSize: number = 200
): Promise<string[]> {
  if (!adminClient) {
    return [];
  }

  try {
    const fieldsResult = await adminClient.query("_system/frontend/getAllTableFields:default" as any, {
      table: tableName,
      sampleSize,
      componentId
    });

    // Handle different response formats
    if (fieldsResult instanceof Set) {
      return Array.from(fieldsResult);
    } else if (Array.isArray(fieldsResult)) {
      return fieldsResult;
    } else if (fieldsResult && typeof fieldsResult === 'object' && 'value' in fieldsResult) {
      // Handle wrapped response
      const value = fieldsResult.value;
      if (value instanceof Set) {
        return Array.from(value);
      } else if (Array.isArray(value)) {
        return value;
      }
    }

    return [];
  } catch (err) {
    console.warn('[getAllTableFields] Query not available or failed:', err);
    return [];
  }
}

/**
 * Fetch all tables from the Convex instance
 */
export async function fetchTablesFromApi({
  convexUrl,
  accessToken,
  adminClient,
  useMockData = false,
  componentId = null
}: FetchTablesOptions & { useMockData?: boolean; componentId?: string | null }): Promise<FetchTablesResponse> {
  if (useMockData) {
    return mockFetchTablesFromApi();
  }

  if (!convexUrl || !accessToken) {
    throw new Error('Missing URL or access token');
  }

  // Normalize componentId: 'app' means root (null)
  const normalizedComponentId = componentId === 'app' || componentId === null ? null : componentId;
  
  console.log('[fetchTablesFromApi] Component ID:', componentId, 'Normalized:', normalizedComponentId);

  // For components, we need to use getTableMapping to get the table names
  // For root app, we can use shapes data
  let tableNames: string[] = [];
  let shapesData: any = {};
  
  if (adminClient) {
    try {
      // Use getTableMapping to get tables for the component
      const tableMapping = await adminClient.query("_system/frontend/getTableMapping" as any, {
        componentId: normalizedComponentId
      }).catch(() => null);

      console.log('[fetchTablesFromApi] Table mapping result:', tableMapping);

      if (tableMapping && typeof tableMapping === 'object') {
        // tableMapping is an object mapping table numbers to table names
        // e.g., {"1": "users", "2": "posts"}
        tableNames = Object.values(tableMapping) as string[];
        // Filter out system tables that we don't want to show
        tableNames = tableNames.filter(name => name !== '_scheduled_jobs' && name !== '_file_storage');
        
        console.log('[fetchTablesFromApi] Tables for component:', tableNames.length, 'tables:', tableNames);
      }
    } catch (err) {
      console.warn('[fetchTablesFromApi] Failed to get table mapping, will try shapes data:', err);
    }
  }

  // Fetch shapes data - this works for root app, but may not have component tables
  const response = await fetch(`${convexUrl}${ROUTES.SHAPES2}`, {
    headers: {
      authorization: `Convex ${accessToken}`,
      'convex-client': 'dashboard-0.0.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tables: HTTP ${response.status}`);
  }

  shapesData = await response.json();

  if (!shapesData || typeof shapesData !== 'object') {
    throw new Error('Invalid data structure received');
  }

  console.log('[fetchTablesFromApi] All tables from shapes:', Object.keys(shapesData).length, 'tables:', Object.keys(shapesData));

  const columnMap = await fetchTableColumnsFromApi(convexUrl, accessToken, normalizedComponentId).catch(
    () => ({}),
  );

  // If we have component table names, use those; otherwise use all shapes data
  let filteredShapesData = shapesData;
  
  if (tableNames.length > 0) {
    // For components, filter shapes data to only include component tables
    // If a table doesn't exist in shapes data, we'll fetch its schema using adminClient
    const componentTableSet = new Set(tableNames);
    filteredShapesData = Object.fromEntries(
      Object.entries(shapesData).filter(([tableName]) => componentTableSet.has(tableName))
    );
    
    // Fetch schema for component tables that weren't in shapes data
    if (adminClient && normalizedComponentId !== null) {
      const missingTables = tableNames.filter(tableName => !filteredShapesData[tableName]);
      console.log('[fetchTablesFromApi] Fetching schema for missing component tables:', missingTables);
      
      // Try to fetch all fields for each missing table using the new system query
      for (const tableName of missingTables) {
        try {
          // Fetch multiple pages of documents to get comprehensive field coverage
          // We'll sample from the beginning and try to get as many unique fields as possible
          const allKeys = new Set<string>();
          const sampleDocuments: any[] = [];
          let cursor: string | null = null;
          let pagesFetched = 0;
          const maxPages = 5; // Fetch up to 5 pages
          const itemsPerPage = 50; // More items per page
          
          console.log('[fetchTablesFromApi] Starting to fetch documents for', tableName, 'with componentId:', normalizedComponentId);
          
          // Fetch multiple pages to get comprehensive field coverage
          while (pagesFetched < maxPages) {
            try {
              const pageData = await adminClient.query("_system/frontend/paginatedTableDocuments:default" as any, {
                componentId: normalizedComponentId,
                table: tableName,
                filters: null,
                paginationOpts: {
                  numItems: itemsPerPage,
                  cursor: cursor
                }
              }).catch((err: any) => {
                console.warn('[fetchTablesFromApi] Error querying paginatedTableDocuments for', tableName, ':', err);
                return null;
              });
              
              console.log('[fetchTablesFromApi] Page data for', tableName, ':', {
                hasPageData: !!pageData,
                hasPage: !!(pageData?.page),
                pageLength: pageData?.page?.length || 0,
                hasContinuation: !!pageData?.continuationCursor,
                responseKeys: pageData ? Object.keys(pageData) : [],
                firstDocKeys: pageData?.page?.[0] ? Object.keys(pageData.page[0]) : []
              });
              
              if (!pageData || !pageData.page || !Array.isArray(pageData.page) || pageData.page.length === 0) {
                console.log('[fetchTablesFromApi] No more documents for', tableName, 'after', pagesFetched, 'pages');
                break; // No more documents
              }
              
              // Collect all keys from this page
              pageData.page.forEach((doc: any) => {
                sampleDocuments.push(doc);
                Object.keys(doc).forEach(key => {
                  if (key !== '_id' && key !== '_creationTime') {
                    allKeys.add(key);
                  }
                });
              });
              
              console.log('[fetchTablesFromApi] Page', pagesFetched + 1, 'for', tableName, ':', {
                documentsInPage: pageData.page.length,
                totalDocuments: sampleDocuments.length,
                totalFields: allKeys.size,
                fields: Array.from(allKeys)
              });
              
              // Check if we have a continuation cursor
              if (pageData.continuationCursor) {
                cursor = pageData.continuationCursor;
                pagesFetched++;
              } else {
                console.log('[fetchTablesFromApi] No continuation cursor for', tableName, '- reached end');
                break; // No more pages
              }
            } catch (err) {
              console.warn('[fetchTablesFromApi] Error fetching page', pagesFetched + 1, 'for', tableName, ':', err);
              break;
            }
          }
          
          const allFields = Array.from(allKeys);
          console.log('[fetchTablesFromApi] Final field collection for', tableName, ':', {
            totalFields: allFields.length,
            fields: allFields,
            totalDocuments: sampleDocuments.length
          });
          
          if (allFields.length > 0 && sampleDocuments.length > 0) {
            
            const inferredFields: TableField[] = [];
            
            // For each field, infer type from sample documents
            allFields.forEach(fieldName => {
              if (fieldName === '_id' || fieldName === '_creationTime') {
                return; // Skip system fields
              }
              
              let fieldType = 'any';
              let isOptional = true;
              
              // Find the first document with a non-null value for this field
              let value: any = null;
              for (const doc of sampleDocuments) {
                if (doc[fieldName] !== null && doc[fieldName] !== undefined) {
                  value = doc[fieldName];
                  isOptional = false;
                  break;
                }
              }
              
              // Infer type from value
              if (value !== null && value !== undefined) {
                if (typeof value === 'string') {
                  fieldType = 'string';
                } else if (typeof value === 'number') {
                  fieldType = 'number';
                } else if (typeof value === 'boolean') {
                  fieldType = 'boolean';
                } else if (Array.isArray(value)) {
                  fieldType = 'array';
                } else if (typeof value === 'object') {
                  fieldType = 'object';
                }
              }
              
              // Check if field is optional (if all documents have null/undefined for this field)
              if (!isOptional) {
                isOptional = sampleDocuments.every((doc: any) => 
                  doc[fieldName] === null || doc[fieldName] === undefined
                );
              }
              
              inferredFields.push({
                fieldName,
                optional: isOptional,
                shape: {
                  type: fieldType
                }
              });
            });
            
            filteredShapesData[tableName] = {
              type: 'table',
              fields: inferredFields
            };
            console.log('[fetchTablesFromApi] Found', inferredFields.length, 'fields for', tableName, ':', inferredFields.map(f => f.fieldName));
          } else {
            // No fields found, create empty schema
            filteredShapesData[tableName] = {
              type: 'table',
              fields: []
            };
            console.log('[fetchTablesFromApi] No fields found for', tableName, ', using empty fields');
          }
        } catch (err) {
          console.warn('[fetchTablesFromApi] Error fetching fields for', tableName, ':', err);
          // Create empty schema as fallback
          filteredShapesData[tableName] = {
            type: 'table',
            fields: []
          };
        }
      }
    } else {
      // No adminClient or root app - add empty schemas for missing tables
      tableNames.forEach(tableName => {
        if (!filteredShapesData[tableName]) {
          filteredShapesData[tableName] = {
            type: 'table',
            fields: []
          };
        }
      });
    }
    
    console.log('[fetchTablesFromApi] Filtered tables:', Object.keys(filteredShapesData).length, 'tables:', Object.keys(filteredShapesData));
  } else {
    console.log('[fetchTablesFromApi] No component table mapping, using all shapes data');
  }

  const tableData = Object.entries(filteredShapesData).reduce(
    (acc, [tableName, tableSchema]) => {
      if (!tableSchema || typeof tableSchema !== 'object') {
        return acc;
      }

      const normalizedFields = mergeFieldsWithColumns(
        (tableSchema as TableDefinition[string])?.fields || [],
        columnMap[tableName],
      );

      acc[tableName] = {
        type: (tableSchema as any)?.type ?? 'table',
        fields: normalizedFields,
      };

      return acc;
    },
    {} as TableDefinition,
  );

  Object.entries(columnMap).forEach(([tableName, columns]) => {
    if (tableData[tableName]) {
      return;
    }
    tableData[tableName] = {
      type: 'table',
      fields: mergeFieldsWithColumns([], columns),
    };
  });

  const storedActiveTable = getActiveTable();
  let selectedTable = '';

  if (storedActiveTable && tableData[storedActiveTable]) {
    selectedTable = storedActiveTable;
  } else if (Object.keys(tableData).length > 0 && adminClient) {
    try {
      await adminClient.query("_system/frontend/tableSize:default" as any, {
        componentId: normalizedComponentId,
        tableName: Object.keys(tableData)[0]
      });
    } catch (err) {
      // Error fetching table size
    }

    selectedTable = Object.keys(tableData)[0] || '';
  }

  console.log('[fetchTablesFromApi] Final result:', {
    componentId: normalizedComponentId,
    totalTables: Object.keys(tableData).length,
    tableNames: Object.keys(tableData),
    selectedTable
  });

  return {
    tables: tableData,
    selectedTable
  };
}

async function fetchTableColumnsFromApi(
  convexUrl: string,
  accessToken: string,
  componentId?: string | null
): Promise<Record<string, string[]>> {
  const result: Record<string, string[]> = {};

  try {
    const response = await fetch(`${convexUrl}${ROUTES.TABLE_COLUMNS}`, {
      headers: {
        authorization: `Convex ${accessToken}`,
        'convex-client': 'dashboard-0.0.0',
      },
    });

    if (!response.ok) {
      let errorDetails: any = null;
      try {
        errorDetails = await response.json();
      } catch {
        // ignore json parse errors
      }

      if (
        response.status === 403 &&
        (errorDetails?.code === 'StreamingExportNotEnabled' ||
          errorDetails?.message?.includes('Streaming export is only available'))
      ) {
        console.warn(
          '[fetchTableColumnsFromApi] Streaming export unavailable on this plan; falling back to shapes-only columns.',
        );
        return result;
      }

      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    const addColumns = (tableName?: string, columns?: string[]) => {
      if (!tableName || !Array.isArray(columns)) {
        return;
      }
      const existing = new Set(result[tableName] ?? []);
      columns.forEach((column) => {
        if (column) {
          existing.add(column);
        }
      });
      result[tableName] = Array.from(existing);
    };

    if (Array.isArray(data.tables)) {
      data.tables.forEach((table: any) => addColumns(table?.name, table?.columns));
    }

    if (data.by_component && typeof data.by_component === 'object') {
      Object.values(data.by_component).forEach((tables: any) => {
        if (Array.isArray(tables)) {
          tables.forEach((table) => addColumns(table?.name, table?.columns));
        }
      });
    }
  } catch (error) {
    console.warn('fetchTableColumnsFromApi failed', error);
  }

  return result;
}

function mergeFieldsWithColumns(
  existingFields: TableField[],
  extraColumns?: string[],
): TableField[] {
  const fieldMap = new Map<string, TableField>();
  existingFields.forEach((field) => {
    if (field?.fieldName) {
      fieldMap.set(field.fieldName, field);
    }
  });

  const addPlaceholderField = (fieldName?: string) => {
    if (!fieldName || fieldMap.has(fieldName)) {
      return;
    }
    fieldMap.set(fieldName, {
      fieldName,
      optional: true,
      shape: { type: 'string' },
    });
  };

  ['_id', '_creationTime'].forEach(addPlaceholderField);
  extraColumns?.forEach(addPlaceholderField);

  return Array.from(fieldMap.values());
}

/**
 * Fetch the cache hit rate from the Convex API
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token for the Convex deployment
 * @param useMockData - Whether to use mock data instead of making API calls
 * @returns The cache hit rate
 */
export const fetchFailureRate = async (
  deploymentUrl: string, 
  authToken: string, 
  useMockData = false
) => {
  // Use mock data if useMockData is true
  if (useMockData) {
    return mockFetchFailureRate();
  }

  // Calculate timestamps for the last hour
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const oneHourAgo = now - 3600; // One hour ago

  const window = {
    start: {
      secs_since_epoch: oneHourAgo,
      nanos_since_epoch: 0
    },
    end: {
      secs_since_epoch: now,
      nanos_since_epoch: 0
    },
    num_buckets: 60 // 1 minute intervals
  };

  const params = new URLSearchParams({
    window: JSON.stringify(window),
    k: '3'
  });

  // Ensure token has the 'Convex ' prefix
  const normalizedToken = authToken.startsWith('Convex ') ? authToken : `Convex ${authToken}`;

  const response = await fetch(
    `${deploymentUrl}${ROUTES.FAILURE_RATE}?${params}`,
    {
      headers: {
        'Authorization': normalizedToken,
        'Content-Type': 'application/json',
        'Convex-Client': 'dashboard-0.0.0',
        'Origin': 'https://dashboard.convex.dev',
        'Referer': 'https://dashboard.convex.dev/'
      }
    }
  );

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Failed to fetch failure rate: ${response.statusText}`);
  }

  return response.json();
};


/**
 * Fetch the cache hit rate from the Convex API
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token for the Convex deployment
 * @param useMockData - Whether to use mock data instead of making API calls
 * @returns The cache hit rate
 */
export const fetchCacheHitRate = async (
  deploymentUrl: string, 
  authToken: string, 
  useMockData = false
) => {
  // Use mock data if useMockData is true
  if (useMockData) {
    return mockFetchCacheHitRate();
  }

  // Calculate timestamps for the last hour
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const oneHourAgo = now - 3600; // One hour ago

  const window = {
    start: {
      secs_since_epoch: oneHourAgo,
      nanos_since_epoch: 0
    },
    end: {
      secs_since_epoch: now,
      nanos_since_epoch: 0
    },
    num_buckets: 60 // 1 minute intervals
  };

  const params = new URLSearchParams({
    window: JSON.stringify(window),
    k: '3'
  });

  // Ensure token has the 'Convex ' prefix
  const normalizedToken = authToken.startsWith('Convex ') ? authToken : `Convex ${authToken}`;

  const response = await fetch(
    `${deploymentUrl}${ROUTES.CACHE_HIT_RATE}?${params}`,
    {
      headers: {
        'Authorization': normalizedToken,
        'Content-Type': 'application/json',
        'Convex-Client': 'dashboard-0.0.0',
        'Origin': 'https://dashboard.convex.dev',
        'Referer': 'https://dashboard.convex.dev/'
      }
    }
  );

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Failed to fetch cache hit rate: ${response.statusText}`);
  }

  const data = await response.json();

  return data;
};


/**
 * Fetch the failure rate from the Convex API
 */
export const fetchPerformanceFailureRate = async (
  deploymentUrl: string,
  authToken: string,
  functionPath: string,
  udfType: string,
  window: any
) => {
  const params = new URLSearchParams({
    metric: 'errors',
    path: functionPath,
    window: JSON.stringify(window),
    udfType
  });

  const response = await fetch(
    `${deploymentUrl}${ROUTES.UDF_RATE}?${params}`,
    {
      headers: {
        'Authorization': `Convex ${authToken}`,
        'Content-Type': 'application/json',
        'Convex-Client': 'dashboard-0.0.0',
        'Origin': 'https://dashboard.convex.dev',
        'Referer': 'https://dashboard.convex.dev/'
      }
    }
  );

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Failed to fetch failure rate: HTTP ${response.status}`);
  }

  const data = await response.json();

  return data;
};

/**
 * Fetch the scheduler lag from the Convex API
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token for the Convex deployment
 * @param useMockData - Whether to use mock data instead of making API calls
 * @returns The scheduler lag
 */
export async function fetchSchedulerLag(
  deploymentUrl: string,
  authToken: string,
  useMockData = false
): Promise<any> {
  // Use mock data if useMockData is true
  if (useMockData) {
    return mockFetchSchedulerLag();
  }

  // Create a window object (start: 1 hour ago, end: now)
  const end = new Date();
  const start = new Date(end.getTime() - 60 * 60 * 1000); // 1 hour before
  
  const window = {
    start: {
      secs_since_epoch: Math.floor(start.getTime() / 1000),
      nanos_since_epoch: (start.getTime() % 1000) * 1000000
    },
    end: {
      secs_since_epoch: Math.floor(end.getTime() / 1000),
      nanos_since_epoch: (end.getTime() % 1000) * 1000000
    },
    num_buckets: 60
  };

  try {
    const response = await fetch(
      `${deploymentUrl}/api/app_metrics/scheduled_job_lag?window=${encodeURIComponent(JSON.stringify(window))}`,
      {
        headers: {
          'Authorization': `Convex ${authToken}`,
          'Content-Type': 'application/json',
          'Convex-Client': 'dashboard-0.0.0',
          'Origin': 'https://dashboard.convex.dev',
          'Referer': 'https://dashboard.convex.dev/'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

/**
 * Fetch the API spec for all functions in the Convex deployment
 * @param adminClient - The Convex admin client instance
 * @param useMockData - Whether to use mock data instead of making API calls
 * @param componentId - Optional component ID to fetch functions for a specific component
 * @returns Array of function specifications
 */
export async function fetchFunctionSpec(
  adminClient: any,
  useMockData = false,
  componentId?: string | null
): Promise<any[]> {
  if (useMockData) {
    return []; // TODO: Add mock data implementation
  }

  if (!adminClient) {
    throw new Error('Admin client not available');
  }

  try {
    // Call the API spec endpoint with optional componentId parameter
    // Passing componentId allows us to fetch functions for a specific component
    const args: any = {};
    if (componentId !== undefined && componentId !== null) {
      args.componentId = componentId;
    }
    
    const results = await adminClient.query("_system/cli/modules:apiSpec" as any, args) as any[];

    if (!Array.isArray(results)) {
      return [];
    }

    return results;
  } catch (err: any) {
    // Don't throw - return empty array so we can continue with other components
    return [];
  }
}

/**
 * Fetch the list of components from the Convex deployment
 * @param adminClient - The Convex admin client instance
 * @param useMockData - Whether to use mock data instead of making API calls
 * @returns Array of component definitions
 */
export async function fetchComponents(
  adminClient: any,
  useMockData = false
): Promise<any[]> {
  if (useMockData) {
    return []; // TODO: Add mock data implementation
  }

  if (!adminClient) {
    throw new Error('Admin client not available');
  }

  try {
    // Call the components list endpoint
    // Returns an array of component objects with id, name, path, args, state
    const results = await adminClient.query("_system/frontend/components:list" as any, {}) as any[];

    if (!Array.isArray(results)) {
      return [];
    }

    return results;
  } catch (err) {
    // Don't throw - components might not be available in all deployments
    return [];
  }
}

/**
 * Call a Convex query function via HTTP API
 * Convex HTTP API format: POST to /api/query with function path and args
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token
 * @param functionPath - The path to the function (e.g., "_system/frontend/deploymentEvents:lastPushEvent")
 * @param args - Arguments to pass to the function
 * @returns The query result
 */
async function callConvexQuery(
  deploymentUrl: string,
  authToken: string,
  functionPath: string,
  args: any = {}
): Promise<any> {
  try {
    // Convex HTTP API format for queries
    // The path format should be: "module:function" 
    // For system functions: "_system/frontend/module:function"
    // Try different formats in case the API expects a different format
    
    // Format 1: Direct path with args as array
    let requestBody = {
      path: functionPath,
      args: [args],
    };
    
    let response = await fetch(`${deploymentUrl}/api/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Convex ${authToken}`,
        'Content-Type': 'application/json',
        'Convex-Client': 'dashboard-0.0.0',
      },
      body: JSON.stringify(requestBody),
    });

    // If that fails, try format 2: args as object
    if (!response.ok && response.status !== 404) {
      requestBody = {
        path: functionPath,
        args: args,
      };
      
      response = await fetch(`${deploymentUrl}/api/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Convex ${authToken}`,
          'Content-Type': 'application/json',
          'Convex-Client': 'dashboard-0.0.0',
        },
        body: JSON.stringify(requestBody),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status === 404 || response.status === 400) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Fetch the last push event (deployment) from Convex
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token for the Convex deployment
 * @param useMockData - Whether to use mock data instead of making API calls
 * @returns The last push event with creation time, or null if never deployed
 */
export async function fetchLastPushEvent(
  deploymentUrl: string,
  authToken: string,
  useMockData = false
): Promise<{ _creationTime: number } | null> {
  if (useMockData) {
    // Return mock data - 39 minutes ago
    const date = new Date();
    date.setMinutes(date.getMinutes() - 39);
    return {
      _creationTime: date.getTime(),
    };
  }

  try {
    // Call the system function: _system/frontend/deploymentEvents:lastPushEvent
    // Note: The function path format should match how Convex expects it
    // Based on Convex code: udfs.deploymentEvents.lastPushEvent maps to _system/frontend/deploymentEvents:lastPushEvent
    
    // Try the function path as specified in Convex
    let data = await callConvexQuery(
      deploymentUrl,
      authToken,
      '_system/frontend/deploymentEvents:lastPushEvent',
      {}
    );
    
    // If that fails, try without the colon (some APIs use different formats)
    if (data === null || data === undefined) {
      data = await callConvexQuery(
        deploymentUrl,
        authToken,
        '_system/frontend/deploymentEvents.lastPushEvent',
        {}
      );
    }

    // Handle different response formats
    if (data === null || data === undefined) {
      return null;
    }
    
    // The API returns {status: 'success', value: {...}}
    // Extract the actual value from the response wrapper
    let eventData = data;
    if (data && typeof data === 'object' && 'value' in data) {
      eventData = data.value;
    }
    
    // If the value itself is null/undefined, no deployment event exists
    if (eventData === null || eventData === undefined) {
      return null;
    }
    
    // Check for _creationTime in the event data
    if (eventData && typeof eventData === 'object' && '_creationTime' in eventData) {
      const creationTime = eventData._creationTime;
      // Handle both milliseconds and seconds timestamps
      const timestamp = typeof creationTime === 'number' 
        ? (creationTime < 1e12 ? creationTime * 1000 : creationTime) // Convert seconds to ms if needed
        : new Date(creationTime).getTime();
      return { _creationTime: timestamp };
    }
    
    // If it's a different format, try to extract timestamp
    if (eventData && typeof eventData === 'object') {
      if ('timestamp' in eventData || 'time' in eventData || 'date' in eventData) {
        const timestamp = eventData.timestamp || eventData.time || eventData.date;
        const ms = typeof timestamp === 'number' 
          ? (timestamp < 1e12 ? timestamp * 1000 : timestamp)
          : new Date(timestamp).getTime();
        return { _creationTime: ms };
      }
    }
    
    return null;
  } catch (error) {
    // Return null on error (treat as never deployed)
    return null;
  }
}

/**
 * Fetch the Convex server version
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token for the Convex deployment
 * @param useMockData - Whether to use mock data instead of making API calls
 * @returns The server version string, or null if unavailable
 */
export async function fetchServerVersion(
  deploymentUrl: string,
  authToken: string,
  useMockData = false
): Promise<string | null> {
  if (useMockData) {
    return '1.29.3';
  }

  try {
    // Call the system function: _system/frontend/getVersion:default
    // Based on Convex code: udfs.getVersion.default maps to _system/frontend/getVersion:default
    
    let data = await callConvexQuery(
      deploymentUrl,
      authToken,
      '_system/frontend/getVersion:default',
      {}
    );
    
    // If that fails, try without the colon
    if (data === null || data === undefined) {
      data = await callConvexQuery(
        deploymentUrl,
        authToken,
        '_system/frontend/getVersion.default',
        {}
      );
    }

    // Handle different response formats
    // The API returns {status: 'success', value: '1.29.3'}
    if (data && typeof data === 'object' && 'value' in data) {
      const versionValue = data.value;
      if (typeof versionValue === 'string') {
        return versionValue;
      }
      if (versionValue && typeof versionValue === 'object' && versionValue.version) {
        return String(versionValue.version);
      }
    }
    
    // Fallback: check if data is directly a string
    if (typeof data === 'string') {
      return data;
    }
    
    // Fallback: check if data has a version property
    if (data && typeof data === 'object' && data.version) {
      return String(data.version);
    }
    
    return null;
  } catch (error) {
    // Return null on error
    return null;
  }
}

/**
 * Insight type definition based on Convex dashboard
 */
export interface Insight {
  kind: 'bytesReadLimit' | 'bytesReadThreshold' | 'documentsReadLimit' | 'documentsReadThreshold' | 'occFailedPermanently' | 'occRetried';
  functionId: string;
  componentPath?: string | null;
  [key: string]: any; // Allow additional properties
}

/**
 * Fetch insights from Convex
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token for the Convex deployment
 * @param useMockData - Whether to use mock data instead of making API calls
 * @returns Array of insights, or empty array if none found
 */
export async function fetchInsights(
  deploymentUrl: string,
  authToken: string,
  useMockData = false
): Promise<Insight[]> {
  if (useMockData) {
    // Return empty array for mock (no insights = all clear)
    return [];
  }

  try {
    // Try to fetch insights from system function
    // Based on Convex dashboard, insights might be in _system/frontend/insights or similar
    const data = await callConvexQuery(
      deploymentUrl,
      authToken,
      '_system/frontend/insights:list',
      {}
    );

    // Handle response format
    if (data === null || data === undefined) {
      return [];
    }

    // Extract value from response wrapper
    let insightsData = data;
    if (data && typeof data === 'object' && 'value' in data) {
      insightsData = data.value;
    }

    // Handle different response formats
    if (Array.isArray(insightsData)) {
      return insightsData;
    }

    if (insightsData && typeof insightsData === 'object' && 'insights' in insightsData) {
      return Array.isArray(insightsData.insights) ? insightsData.insights : [];
    }

    return [];
  } catch (error) {
    // Return empty array on error (treat as no insights)
    return [];
  }
}

interface MetricsWindow {
  start: {
    secs_since_epoch: number;
    nanos_since_epoch: number;
  };
  end: {
    secs_since_epoch: number;
    nanos_since_epoch: number;
  };
  num_buckets: number;
}

/**
 * Fetch performance metrics for a specific function from the Convex API
 */
const fetchPerformanceMetric = async (
  baseUrl: string,
  authToken: string,
  functionPath: string,
  metric: string,
  udfType: string,
  window: MetricsWindow
) => {
  // Extract just the file path (e.g., "users.js" from "users.js:viewer")
  const path = functionPath.split(':')[0];

  // Ensure token has the 'Convex ' prefix
  const normalizedToken = authToken.startsWith('Convex ') ? authToken : `Convex ${authToken}`;

  // Format window parameter to match dashboard format
  // Ensure timestamps are in the past and limit to 30 minutes to reduce load
  const now = Math.floor(Date.now() / 1000);
  const thirtyMinutesAgo = now - 1800; // 30 minutes instead of 1 hour
  
  const formattedWindow = {
    start: {
      secs_since_epoch: thirtyMinutesAgo,
      nanos_since_epoch: 0
    },
    end: {
      secs_since_epoch: now,
      nanos_since_epoch: 0
    },
    num_buckets: 30 // 1 minute intervals for 30 minutes
  };

  // Build the URL with properly encoded parameters
  const url = new URL(`${baseUrl}/api/app_metrics/${metric}_top_k`);
  url.searchParams.append('path', path);
  url.searchParams.append('window', JSON.stringify(formattedWindow));
  url.searchParams.append('udfType', udfType);
  url.searchParams.append('k', '3');

  // Maximum number of retries
  const MAX_RETRIES = 3;
  let retryCount = 0;
  let lastError: Error | null = null;

  while (retryCount < MAX_RETRIES) {
    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': normalizedToken,
          'Content-Type': 'application/json',
          'Convex-Client': 'convex-panel-extension',
          'Origin': baseUrl,
          'Referer': baseUrl
        }
      });

      if (response.status === 429) {
        // Rate limited - wait and retry
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 1000 * (retryCount + 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retryCount++;
        continue;
      }

      if (!response.ok) {
        const responseText = await response.text();
        
        if (response.status === 500) {
          throw new Error(`Internal server error: ${responseText}`);
        }
        
        throw new Error(`Failed to fetch performance metric: HTTP ${response.status}`);
      }

      const data = await response.json();

      return data;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (retryCount < MAX_RETRIES - 1) {
        // Wait before retrying, using exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        retryCount++;
        continue;
      }
      break;
    }
  }

  throw lastError || new Error('Failed to fetch performance metric after retries');
};

/**
 * Fetch performance cache hit rate for a specific function
 */
export const fetchPerformanceCacheHitRate = async (
  baseUrl: string,
  authToken: string,
  functionPath: string,
  udfType: string,
  window: MetricsWindow
) => {
  return fetchPerformanceMetric(baseUrl, authToken, functionPath, 'cache_hit_percentage', udfType, window);
};

/**
 * Fetch performance invocation rate for a specific function
 */
export async function fetchPerformanceInvocationRate(
  baseUrl: string,
  authToken: string,
  functionPath: string,
  udfType: string,
  window: {
    start: { secs_since_epoch: number; nanos_since_epoch: number };
    end: { secs_since_epoch: number; nanos_since_epoch: number };
    num_buckets: number;
  }
) {
  const params = new URLSearchParams({
    metric: 'invocations',
    path: functionPath,
    window: JSON.stringify(window),
    udfType
  });
  
  const response = await fetch(
    `${baseUrl}${ROUTES.UDF_RATE}?${params}`,
    {
      headers: {
        Authorization: `Convex ${authToken}`,
        'Content-Type': 'application/json',
        'Convex-Client': 'dashboard-0.0.0',
        'Origin': 'https://dashboard.convex.dev',
        'Referer': 'https://dashboard.convex.dev/'
      },
    }
  );

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Failed to fetch invocation rate: ${response.statusText}`);
  }

  const data = await response.json();

  return data;
}

/**
 * Fetch execution time (latency) metrics for a specific function
 */
export const fetchPerformanceExecutionTime = async (
  baseUrl: string,
  authToken: string,
  functionPath: string,
  udfType: string,
  window: any
) => {
  const params = new URLSearchParams({
    percentiles: JSON.stringify([50, 90, 95, 99]),
    path: functionPath,
    window: JSON.stringify(window),
    udfType
  });

  const response = await fetch(
    `${baseUrl}${ROUTES.LATENCY_PERCENTILES}?${params}`,
    {
      headers: {
        'Authorization': `Convex ${authToken}`,
        'Content-Type': 'application/json',
        'Convex-Client': 'dashboard-0.0.0',
        'Origin': 'https://dashboard.convex.dev',
        'Referer': 'https://dashboard.convex.dev/'
      }
    }
  );

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Failed to fetch execution time: HTTP ${response.status}`);
  }

  const data = await response.json();

  return data;
};

/**
 * Fetch source code for a function
 */
export const fetchSourceCode = async (
  deploymentUrl: string,
  authToken: string,
  functionPath: string
) => {
  // Extract just the file path (e.g., "users.js" from "users.js:viewer")
  const path = functionPath;
  
  const params = new URLSearchParams({ path });
  const normalizedToken = authToken.startsWith('Convex ') ? authToken : `Convex ${authToken}`;

  const response = await fetch(
    `${deploymentUrl}${ROUTES.GET_SOURCE_CODE}?${params}`,
    {
      headers: {
        'Authorization': normalizedToken,
        'Content-Type': 'application/json',
        'Convex-Client': 'dashboard-0.0.0',
      }
    }
  );

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Failed to fetch source code: HTTP ${response.status}`);
  }

  return response.text();
};

/**
 * Extract deployment name from deployment URL
 * @param deploymentUrl - The full deployment URL (e.g., https://my-deployment.convex.cloud)
 * @returns The deployment name (e.g., "my-deployment")
 */
export function extractDeploymentName(deploymentUrl: string | undefined): string | undefined {
  if (!deploymentUrl) return undefined;
  
  try {
    const url = new URL(deploymentUrl);
    // Extract deployment name from hostname
    // Format: https://[deployment-name].convex.cloud
    const hostname = url.hostname;
    const match = hostname.match(/^([^.]+)\.convex\.cloud$/);
    return match ? match[1] : undefined;
  } catch {
    // Fallback: try to extract from string directly
    const match = deploymentUrl.match(/https?:\/\/([^.]+)\.convex\.cloud/);
    return match ? match[1] : undefined;
  }
}

/**
 * Extract project name from deployment URL
 * For most deployments, the project name is the first part of the deployment name
 * Format: [project-name]-[random-id] or just [project-name]
 * @param deploymentUrl - The full deployment URL
 * @returns The project name (best guess from deployment name)
 */
export function extractProjectName(deploymentUrl: string | undefined): string | undefined {
  const deploymentName = extractDeploymentName(deploymentUrl);
  if (!deploymentName) return undefined;
  
  // Try to extract project name from deployment name
  // Common patterns:
  // - "my-project-1234" -> "my-project"
  // - "my-project" -> "my-project"
  // - "dev:my-project-1234" -> "my-project"
  
  // Remove "dev:" prefix if present
  let name = deploymentName.replace(/^dev:/, '');
  
  // Try to extract project name (everything before the last dash and number sequence)
  // This is a heuristic - actual project names may vary
  const projectMatch = name.match(/^(.+?)(?:-\d+)?$/);
  if (projectMatch) {
    return projectMatch[1];
  }
  
  return name;
}

/**
 * Fetch deployment metadata from Convex API
 * Attempts to get deployment information using system queries
 * @param adminClient - The Convex admin client instance
 * @param deploymentUrl - The deployment URL
 * @param authToken - Authentication token
 * @returns Deployment metadata including name, type, and project info
 */
export async function fetchDeploymentMetadata(
  adminClient: any,
  deploymentUrl: string | undefined,
  authToken: string | undefined
): Promise<{
  deploymentName?: string;
  projectName?: string;
  deploymentType?: 'dev' | 'prod' | 'preview';
  kind?: 'cloud' | 'local';
}> {
  const deploymentName = extractDeploymentName(deploymentUrl);
  const projectName = extractProjectName(deploymentUrl);
  
  // Default response with extracted info
  const defaultResponse = {
    deploymentName,
    projectName,
    deploymentType: 'dev' as const,
    kind: 'cloud' as const,
  };

  // If we have an admin client, try to query system functions for more info
  if (adminClient) {
    try {
      // Try to get deployment info from system functions
      // Note: These are internal Convex system functions that may not be available
      // in all deployments or may require specific permissions
      const deploymentInfo = await adminClient.query("_system/deployment:info" as any, {}) as any;
      
      if (deploymentInfo) {
        return {
          deploymentName: deploymentInfo.name || deploymentName,
          projectName: deploymentInfo.projectName || projectName,
          deploymentType: deploymentInfo.deploymentType || 'dev',
          kind: deploymentInfo.kind || 'cloud',
        };
      }
    } catch (err) {
      // System query failed, fall back to extracted info
    }
  }

  // Try to determine deployment type from URL or name
  let deploymentType: 'dev' | 'prod' | 'preview' = 'dev';
  if (deploymentName) {
    if (deploymentName.startsWith('prod-') || deploymentName.includes('production')) {
      deploymentType = 'prod';
    } else if (deploymentName.startsWith('preview-') || deploymentName.includes('preview')) {
      deploymentType = 'preview';
    } else if (deploymentName.startsWith('dev-') || deploymentName.startsWith('dev:')) {
      deploymentType = 'dev';
    }
  }

  return {
    ...defaultResponse,
    deploymentType,
  };
}

/**
 * Fetch project information from Convex API
 * Attempts to get project and team information
 * @param adminClient - The Convex admin client instance
 * @param deploymentUrl - The deployment URL
 * @param authToken - Authentication token
 * @param teamSlug - Optional team slug
 * @param projectSlug - Optional project slug
 * @returns Project and team information
 */
/**
 * Parse team and project slugs from access token
 * Token format: "project:{teamSlug}:{projectSlug}|{token}"
 */
function parseAccessToken(authToken: string | undefined): { teamSlug?: string; projectSlug?: string } {
  if (!authToken) return {};
  
  // Token format: "project:{teamSlug}:{projectSlug}|{token}"
  const match = authToken.match(/^project:([^:]+):([^|]+)\|/);
  if (match) {
    return {
      teamSlug: match[1],
      projectSlug: match[2],
    };
  }
  
  return {};
}

export async function fetchProjectInfo(
  adminClient: any,
  deploymentUrl: string | undefined,
  authToken: string | undefined,
  teamSlug?: string,
  projectSlug?: string
): Promise<{
  team?: {
    id: string;
    name: string;
    slug: string;
  };
  project?: {
    id: string;
    name: string;
    slug: string;
    teamId: string;
  };
}> {
  const deploymentName = extractDeploymentName(deploymentUrl);
  const projectName = extractProjectName(deploymentUrl);

  // Parse team and project from access token if not provided
  const tokenInfo = parseAccessToken(authToken);
  const effectiveTeamSlug = teamSlug || tokenInfo.teamSlug;
  const effectiveProjectSlug = projectSlug || tokenInfo.projectSlug;

  // If we have slugs (from props or token), we can construct basic info
  if (effectiveTeamSlug && effectiveProjectSlug) {
    const result = {
      team: effectiveTeamSlug ? {
        id: effectiveTeamSlug, // Using slug as ID placeholder
        name: effectiveTeamSlug, // Can be improved with actual API call
        slug: effectiveTeamSlug,
      } : undefined,
      project: effectiveProjectSlug ? {
        id: effectiveProjectSlug, // Using slug as ID placeholder
        name: effectiveProjectSlug, // Use project slug as name (e.g., "deskforge")
        slug: effectiveProjectSlug,
        teamId: effectiveTeamSlug, // Using slug as teamId placeholder
      } : undefined,
    };
    return result;
  }

  // If we have an admin client, try to query system functions for more info
  if (adminClient) {
    try {
      // Try to get project info from system functions
      // Note: These are internal Convex system functions that may not be available
      // in all deployments or may require specific permissions
      const projectInfo = await adminClient.query("_system/project:info" as any, {}) as any;
      
      if (projectInfo) {
        const result = {
          team: projectInfo.team ? {
            id: projectInfo.team.id?.toString() || '',
            name: projectInfo.team.name || '',
            slug: projectInfo.team.slug || '',
          } : undefined,
          project: projectInfo.project ? {
            id: projectInfo.project.id?.toString() || '',
            name: projectInfo.project.name || projectName || '',
            slug: projectInfo.project.slug || projectSlug || '',
            teamId: projectInfo.project.teamId?.toString() || projectInfo.team?.id?.toString() || '',
          } : undefined,
        };
        return result;
      }
    } catch (err) {
      // System query failed, fall back to extracted info
    }
  }

  // Fallback: construct from available data
  if (projectName) {
    const result = {
      project: {
        id: deploymentName || '',
        name: projectName,
        slug: projectSlug || projectName,
        teamId: teamSlug || '',
      },
    };
    return result;
  }

  return {};
}