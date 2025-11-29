import { ROUTES } from '../utils/constants';
import {
  LogEntry,
  TableDefinition,
  TableField,
  FunctionExecutionStats,
  StreamUdfExecutionResponse,
  AggregatedFunctionStats,
  FunctionExecutionJson,
  FunctionExecutionLog,
  ModuleFunction,
} from '../types';
import { getActiveTable } from './storage';
import { FetchLogsOptions, FetchLogsResponse, FetchTablesOptions, FetchTablesResponse } from '../types';
import { mockFetchLogsFromApi, mockFetchTablesFromApi, mockFetchCacheHitRate, mockFetchFailureRate, mockFetchSchedulerLag } from './mockData';

// Cache to track deployments that return 403 for table columns endpoint
// Persisted in sessionStorage to survive page reloads
const getTableColumnsForbiddenCache = (): Set<string> => {
  try {
    const cached = sessionStorage.getItem('tableColumnsForbiddenCache');
    return cached ? new Set(JSON.parse(cached)) : new Set<string>();
  } catch {
    return new Set<string>();
  }
};

const setTableColumnsForbiddenCache = (cache: Set<string>) => {
  try {
    sessionStorage.setItem('tableColumnsForbiddenCache', JSON.stringify(Array.from(cache)));
  } catch {
    // Ignore storage errors
  }
};

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

export async function streamUdfExecution(
  deploymentUrl: string,
  authToken: string,
  cursor: number | string = 0,
): Promise<{ entries: FunctionExecutionJson[]; newCursor: number | string }> {
  const url = `${deploymentUrl}${ROUTES.STREAM_UDF_EXECUTION}?cursor=${cursor}`;

  const normalizedToken =
    authToken && authToken.startsWith('Convex ')
      ? authToken
      : `Convex ${authToken}`;

  const response = await fetch(url, {
    headers: {
      Authorization: normalizedToken,
      'Content-Type': 'application/json',
      'Convex-Client': 'dashboard-1.0.0',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to stream UDF executions: HTTP ${response.status} - ${text}`);
  }

  const data = await response.json();

  return {
    entries: (data.entries || []) as FunctionExecutionJson[],
    newCursor: data.new_cursor ?? cursor,
  };
}

export async function streamFunctionLogs(
  deploymentUrl: string,
  authToken: string,
  cursor: number | string = 0,
  sessionId?: string,
  clientRequestCounter?: number,
): Promise<{ entries: FunctionExecutionJson[]; newCursor: number | string }> {
  const params = new URLSearchParams({
    cursor: String(cursor),
  });

  if (sessionId && clientRequestCounter !== undefined) {
    params.set('session_id', sessionId);
    params.set('client_request_counter', String(clientRequestCounter));
  }

  const url = `${deploymentUrl}${ROUTES.STREAM_FUNCTION_LOGS}?${params.toString()}`;

  const normalizedToken =
    authToken && authToken.startsWith('Convex ')
      ? authToken
      : `Convex ${authToken}`;

  const response = await fetch(url, {
    headers: {
      Authorization: normalizedToken,
      'Content-Type': 'application/json',
      'Convex-Client': 'dashboard-1.0.0',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to stream function logs: HTTP ${response.status} - ${text}`);
  }

  const data = await response.json();

  return {
    entries: (data.entries || []) as FunctionExecutionJson[],
    newCursor: data.new_cursor ?? cursor,
  };
}

export function processFunctionLogs(
  entries: FunctionExecutionJson[],
  selectedFunction: ModuleFunction | null,
): FunctionExecutionLog[] {
  if (!entries || entries.length === 0) return [];

  const targetIdentifier = selectedFunction?.identifier;

  const normalizeIdentifier = (id: string | undefined | null) =>
    (id || '').replace(/\.js:/g, ':').replace(/\.js$/g, '');

  const matchesSelected = (entry: FunctionExecutionJson) => {
    if (!selectedFunction) return true;

    const raw: any = entry as any;
    // Prefer Convex's full UDF path if present; otherwise identifier as-is.
    const entryPath: string | undefined =
      raw.udf_path || raw.identifier;

    const normalizedEntryId = normalizeIdentifier(entryPath);
    const normalizedTargetId = normalizeIdentifier(targetIdentifier);

    return (
      normalizedEntryId.length > 0 &&
      normalizedTargetId.length > 0 &&
      normalizedEntryId === normalizedTargetId
    );
  };

  const matchingEntries = entries.filter(matchesSelected);
  const effectiveEntries =
    selectedFunction ? matchingEntries : entries;

  if (typeof window !== 'undefined' && selectedFunction) {
    const matchesSample = matchingEntries.slice(0, 20).map((e: any) => ({
      identifier: e.identifier,
      udf_path: e.udf_path,
      component_path: e.component_path,
    }));
  }

  return effectiveEntries
    .map((entry) => {
      const raw: any = entry as any;

      const udfTypeRaw = (raw.udf_type || raw.udfType || 'query') as string;
      const componentPath = raw.component_path || raw.componentPath;

      const identifierRaw =
        raw.identifier ||
        raw.udf_path ||
        (componentPath ? `${componentPath}:${raw.identifier}` : '');

      const timestampSec = raw.timestamp ?? raw.execution_timestamp ?? 0;
      const startedAtMs =
        timestampSec > 1e12 ? timestampSec : timestampSec * 1000;

      const executionTimeSeconds =
        raw.execution_time ??
        (raw.execution_time_ms != null
          ? raw.execution_time_ms / 1000
          : raw.executionTimeMs != null
          ? raw.executionTimeMs / 1000
          : 0);
      const durationMs = executionTimeSeconds * 1000;
      const completedAtMs = startedAtMs + durationMs;

      const logLines = (raw.log_lines || raw.logLines || []).map((line: any) =>
        typeof line === 'string' ? line : JSON.stringify(line),
      );

      const success =
        raw.error == null &&
        (raw.success === undefined ||
          raw.success === null ||
          raw.success === true ||
          (typeof raw.success === 'object' && raw.success !== null));

      const functionName =
        typeof identifierRaw === 'string' && identifierRaw.includes(':')
          ? identifierRaw.split(':').slice(-1)[0]
          : identifierRaw;

      const functionIdentifier =
        componentPath && identifierRaw
          ? `${componentPath}:${identifierRaw}`
          : identifierRaw;

      return {
        id: raw.execution_id || raw.executionId || `${identifierRaw}-${startedAtMs}`,
        functionIdentifier,
        functionName,
        udfType: (udfTypeRaw.toLowerCase() || 'query') as any,
        componentPath,
        timestamp: startedAtMs,
        startedAt: startedAtMs,
        completedAt: completedAtMs,
        durationMs,
        success,
        error: raw.error || raw.error_message,
        logLines,
        usageStats: raw.usage_stats || raw.usageStats || {
          database_read_bytes: 0,
          database_write_bytes: 0,
          database_read_documents: 0,
          storage_read_bytes: 0,
          storage_write_bytes: 0,
          vector_index_read_bytes: 0,
          vector_index_write_bytes: 0,
          memory_used_mb: 0,
        },
        requestId: raw.request_id || raw.requestId || '',
        executionId: raw.execution_id || raw.executionId || '',
        caller: raw.caller,
        environment: raw.environment,
        identityType: raw.identity_type || raw.identityType || '',
        returnBytes: raw.return_bytes || raw.returnBytes,
        raw: raw,
      } as FunctionExecutionLog;
    });
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

  const normalizedComponentId = componentId === 'app' || componentId === null ? null : componentId;

  let tableNames: string[] = [];
  let shapesData: any = {};
  
  if (adminClient) {
    try {
      const tableMapping = await adminClient.query("_system/frontend/getTableMapping" as any, {
        componentId: normalizedComponentId
      }).catch(() => null);

      if (tableMapping && typeof tableMapping === 'object') {
        tableNames = Object.values(tableMapping) as string[];
        tableNames = tableNames.filter(name => name !== '_scheduled_jobs' && name !== '_file_storage');
        
      }
    } catch (err) {
      console.warn('Failed to get table mapping, will try shapes data:', err);
    }
  }

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

  const columnMap = await fetchTableColumnsFromApi(convexUrl, accessToken, normalizedComponentId).catch(
    () => ({}),
  );

  let filteredShapesData = shapesData;
  
  if (tableNames.length > 0) {
    const componentTableSet = new Set(tableNames);
    filteredShapesData = Object.fromEntries(
      Object.entries(shapesData).filter(([tableName]) => componentTableSet.has(tableName))
    );
    
    if (adminClient && normalizedComponentId !== null) {
      const missingTables = tableNames.filter(tableName => !filteredShapesData[tableName]);
      for (const tableName of missingTables) {
        try {
          const allKeys = new Set<string>();
          const sampleDocuments: any[] = [];
          let cursor: string | null = null;
          let pagesFetched = 0;
          const maxPages = 5;
          const itemsPerPage = 50;
          
          while (pagesFetched < maxPages) {
            try {
              const pageData: any = await adminClient.query("_system/frontend/paginatedTableDocuments:default" as any, {
                componentId: normalizedComponentId,
                table: tableName,
                filters: null,
                paginationOpts: {
                  numItems: itemsPerPage,
                  cursor: cursor
                }
              }).catch((err: any) => {
                console.warn('Error querying paginatedTableDocuments for', tableName, ':', err);
                return null;
              });
              
              if (!pageData || !pageData.page || !Array.isArray(pageData.page) || pageData.page.length === 0) {
                break;
              }
              
              pageData.page.forEach((doc: any) => {
                sampleDocuments.push(doc);
                Object.keys(doc).forEach(key => {
                  if (key !== '_id' && key !== '_creationTime') {
                    allKeys.add(key);
                  }
                });
              });
              
              if (pageData.continuationCursor) {
                cursor = pageData.continuationCursor;
                pagesFetched++;
              } else {
                break;
              }
            } catch (err) {
              console.warn('[fetchTablesFromApi] Error fetching page', pagesFetched + 1, 'for', tableName, ':', err);
              break;
            }
          }
          
          const allFields = Array.from(allKeys);
          if (allFields.length > 0 && sampleDocuments.length > 0) {
            
            const inferredFields: TableField[] = [];
            
            allFields.forEach(fieldName => {
              if (fieldName === '_id' || fieldName === '_creationTime') {
                return;
              }
              
              let fieldType = 'any';
              let isOptional = true;
              
              let value: any = null;
              for (const doc of sampleDocuments) {
                if (doc[fieldName] !== null && doc[fieldName] !== undefined) {
                  value = doc[fieldName];
                  isOptional = false;
                  break;
                }
              }
              
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
          } else {
            filteredShapesData[tableName] = {
              type: 'table',
              fields: []
            };
          }
        } catch (err) {
          console.warn('[fetchTablesFromApi] Error fetching fields for', tableName, ':', err);
          filteredShapesData[tableName] = {
            type: 'table',
            fields: []
          };
        }
      }
    } else {
      tableNames.forEach(tableName => {
        if (!filteredShapesData[tableName]) {
          filteredShapesData[tableName] = {
            type: 'table',
            fields: []
          };
        }
      });
    }
    
  }

  const tableData = Object.entries(filteredShapesData).reduce(
    (acc, [tableName, tableSchema]) => {
      if (!tableSchema || typeof tableSchema !== 'object') {
        return acc;
      }

      const normalizedFields = mergeFieldsWithColumns(
        (tableSchema as TableDefinition[string])?.fields || [],
        (columnMap && typeof columnMap === 'object' && !Array.isArray(columnMap) && tableName in columnMap)
          ? (columnMap as Record<string, string[]>)[tableName]
          : undefined,
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
      console.error('Error fetching table size:', err);
    }

    selectedTable = Object.keys(tableData)[0] || '';
  }

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

  // Skip request if we've already seen a 403 for this deployment
  const cache = getTableColumnsForbiddenCache();
  if (cache.has(convexUrl)) {
    return result;
  }

  try {
    const response = await fetch(`${convexUrl}${ROUTES.TABLE_COLUMNS}`, {
      headers: {
        authorization: `Convex ${accessToken}`,
        'convex-client': 'dashboard-0.0.0',
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        // Cache this deployment as forbidden to skip future requests
        cache.add(convexUrl);
        setTableColumnsForbiddenCache(cache);
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
    if (error instanceof Error && !error.message.includes('403')) {
      console.warn('fetchTableColumnsFromApi failed', error);
    }
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
 * Serialize a Date to the format expected by Convex metrics API
 */
function serializeDate(date: Date): { secs_since_epoch: number; nanos_since_epoch: number } {
  const unixTsSeconds = date.getTime() / 1000;
  const secsSinceEpoch = Math.floor(unixTsSeconds);
  const nanosSinceEpoch = Math.floor((unixTsSeconds - secsSinceEpoch) * 1e9);
  return {
    secs_since_epoch: secsSinceEpoch,
    nanos_since_epoch: nanosSinceEpoch,
  };
}

/**
 * Parse a serialized date from Convex metrics API
 */
function parseDate(date: { secs_since_epoch: number; nanos_since_epoch: number }): Date {
  let unixTsMs = date.secs_since_epoch * 1000;
  unixTsMs += date.nanos_since_epoch / 1_000_000;
  return new Date(unixTsMs);
}

export type TableMetric = 'rowsRead' | 'rowsWritten';

export interface TimeseriesBucket {
  time: Date;
  metric: number | null;
}

/**
 * Fetch table rate metrics from the Convex API
 */
export async function fetchTableRate(
  deploymentUrl: string,
  tableName: string,
  metric: TableMetric,
  start: Date,
  end: Date,
  numBuckets: number,
  authToken: string,
): Promise<TimeseriesBucket[]> {
  const windowArgs = {
    start: serializeDate(start),
    end: serializeDate(end),
    num_buckets: numBuckets,
  };

  const name = encodeURIComponent(tableName);
  const window = encodeURIComponent(JSON.stringify(windowArgs));
  const url = `${deploymentUrl}/api/app_metrics/table_rate?name=${name}&metric=${metric}&window=${window}`;

  const normalizedToken = authToken.startsWith('Convex ') ? authToken : `Convex ${authToken}`;

  const response = await fetch(url, {
    headers: {
      Authorization: normalizedToken,
      'Convex-Client': 'dashboard-0.0.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch table rate: ${response.statusText}`);
  }

  const respJSON: Array<[{ secs_since_epoch: number; nanos_since_epoch: number }, number | null]> = await response.json();
  
  return respJSON.map(([time, metricValue]) => ({
    time: parseDate(time),
    metric: metricValue,
  }));
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

  const udfTypeCapitalized = udfType.charAt(0).toUpperCase() + udfType.slice(1);
  
  const windowStart = new Date(window.start.secs_since_epoch * 1000).toISOString();
  const windowEnd = new Date(window.end.secs_since_epoch * 1000).toISOString();
  
  const params = new URLSearchParams({
    component_path: '',
    udf_path: functionPath,
    udf_type: udfTypeCapitalized,
    window: JSON.stringify({ start: windowStart, end: windowEnd })
  });
  
  const url = `${baseUrl}${ROUTES.CACHE_HIT_PERCENTAGE}?${params}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Convex ${authToken}`,
      'Content-Type': 'application/json',
      'Convex-Client': 'dashboard-1.0.0',
    }
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Failed to fetch cache hit rate: HTTP ${response.status}`);
  }

  const data = await response.json();

  return data;
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

  const udfTypeCapitalized = udfType.charAt(0).toUpperCase() + udfType.slice(1);

  const windowStart = new Date(window.start.secs_since_epoch * 1000).toISOString();
  const windowEnd = new Date(window.end.secs_since_epoch * 1000).toISOString();
  
  const params = new URLSearchParams({
    component_path: '',
    udf_path: functionPath,
    udf_type: udfTypeCapitalized,
    metric: 'invocations',
    window: JSON.stringify({ start: windowStart, end: windowEnd })
  });
  
  const url = `${baseUrl}${ROUTES.PERFORMANCE_INVOCATION_UDF_RATE}?${params}`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Convex ${authToken}`,
      'Content-Type': 'application/json',
      'Convex-Client': 'dashboard-1.0.0',
    },
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Failed to fetch invocation rate: HTTP ${response.status} - ${responseText}`);
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

  const udfTypeCapitalized = udfType.charAt(0).toUpperCase() + udfType.slice(1);
  
  const windowStart = new Date(window.start.secs_since_epoch * 1000).toISOString();
  const windowEnd = new Date(window.end.secs_since_epoch * 1000).toISOString();
  
  const params = new URLSearchParams({
    component_path: '',
    udf_path: functionPath,
    udf_type: udfTypeCapitalized,
    percentiles: [50, 90, 95, 99].join(','),
    window: JSON.stringify({ start: windowStart, end: windowEnd })
  });

  const url = `${baseUrl}${ROUTES.PERFORMANCE_EXECUTION_TIME}?${params}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Convex ${authToken}`,
      'Content-Type': 'application/json',
      'Convex-Client': 'dashboard-1.0.0',
    }
  });


  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Failed to fetch execution time: HTTP ${response.status}`);
  }

  const data = await response.json();

  return data;
};

/**
 * Fetch function statistics using system metrics queries
 * Uses the adminClient to query _system/metrics and _system/logs functions
 */
export async function fetchFunctionStatistics(
  adminClient: any,
  functionIdentifier: string,
  timeWindow: { start: number; end: number },
  useMockData = false
): Promise<{
  cacheHitPercentage?: any;
  latencyPercentiles?: any;
  executions?: any[];
  invocationRate?: any;
}> {
  if (useMockData || !adminClient) {
    return {
      cacheHitPercentage: null,
      latencyPercentiles: null,
      executions: [],
      invocationRate: null,
    };
  }

  try {
    const results = await Promise.allSettled([
      // Get cache hit percentage for queries
      adminClient.query("_system/metrics:cache_hit_percentage" as any, {
        identifier: functionIdentifier,
        window: timeWindow,
      }),
      
      // Get latency percentiles
      adminClient.query("_system/metrics:latency_percentiles" as any, {
        identifier: functionIdentifier,
        percentiles: [50, 90, 95, 99],
        window: timeWindow,
      }),
      
      // Get function executions for detailed stats
      adminClient.query("_system/logs:stream_udf_execution" as any, {
        cursor: timeWindow.start,
      }),
    ]);

    const cacheStats = results[0].status === 'fulfilled' ? results[0].value : null;
    const latencyStats = results[1].status === 'fulfilled' ? results[1].value : null;
    const executionsResult = results[2].status === 'fulfilled' ? results[2].value : null;

    if (results[0].status === 'rejected') {
      console.error('[fetchFunctionStatistics] Cache hit query failed:', results[0].reason);
    } else {
    }

    if (results[1].status === 'rejected') {
      console.error('[fetchFunctionStatistics] Latency query failed:', results[1].reason);
    }

    if (results[2].status === 'rejected') {
      console.error('[fetchFunctionStatistics] Executions query failed:', results[2].reason);
    }

    // Get invocation rate (try different query names if needed)
    let invocationRate = null;
    try {
      invocationRate = await adminClient.query("_system/metrics:invocation_rate" as any, {
        identifier: functionIdentifier,
        window: timeWindow,
      });
    } catch (err1) {
      console.warn('[fetchFunctionStatistics] invocation_rate failed:', err1);
      // Try alternative name
      try {
        invocationRate = await adminClient.query("_system/metrics:invocations" as any, {
          identifier: functionIdentifier,
          window: timeWindow,
        });
      } catch (err2) {
        console.warn('[fetchFunctionStatistics] invocations also failed:', err2);
        // If both fail, invocationRate stays null
      }
    }

    // Handle executions - it might be an array or an object with entries
    let executions: any[] = [];
    if (executionsResult) {
      if (Array.isArray(executionsResult)) {
        executions = executionsResult;
      } else if (executionsResult.entries && Array.isArray(executionsResult.entries)) {
        executions = executionsResult.entries;
      } else if (executionsResult.logs && Array.isArray(executionsResult.logs)) {
        executions = executionsResult.logs;
      }
    }

    const returnValue = {
      cacheHitPercentage: cacheStats,
      latencyPercentiles: latencyStats,
      executions: executions,
      invocationRate: invocationRate,
    };

    return returnValue;
  } catch (error) {
    return {
      cacheHitPercentage: null,
      latencyPercentiles: null,
      executions: [],
      invocationRate: null,
    };
  }
}

/**
 * Analyze function executions to extract statistics
 */
export function analyzeExecutions(executions: any[]): {
  totalInvocations: number;
  successCount: number;
  errorCount: number;
  totalExecutionTime: number;
  avgExecutionTime: number;
  usageStats: {
    totalDatabaseReads: number;
    totalDatabaseWrites: number;
    totalStorageReads: number;
    totalStorageWrites: number;
    totalMemoryUsed: number;
  };
} {
  const stats = {
    totalInvocations: executions.length,
    successCount: 0,
    errorCount: 0,
    totalExecutionTime: 0,
    avgExecutionTime: 0,
    usageStats: {
      totalDatabaseReads: 0,
      totalDatabaseWrites: 0,
      totalStorageReads: 0,
      totalStorageWrites: 0,
      totalMemoryUsed: 0,
    },
  };

  executions.forEach((execution) => {
    if (execution.params?.result?.is_ok) {
      stats.successCount++;
    } else {
      stats.errorCount++;
    }

    stats.totalExecutionTime += execution.execution_time || 0;
    stats.usageStats.totalDatabaseReads +=
      execution.usage_stats?.database_read_bytes || 0;
    stats.usageStats.totalDatabaseWrites +=
      execution.usage_stats?.database_write_bytes || 0;
    stats.usageStats.totalStorageReads +=
      execution.usage_stats?.storage_read_bytes || 0;
    stats.usageStats.totalStorageWrites +=
      execution.usage_stats?.storage_write_bytes || 0;
    stats.usageStats.totalMemoryUsed += execution.memory_used_mb || 0;
  });

  stats.avgExecutionTime =
    stats.totalInvocations > 0
      ? stats.totalExecutionTime / stats.totalInvocations
      : 0;

  return stats;
}

/**
 * Fetch source code for a function
 */
export const fetchSourceCode = async (
  deploymentUrl: string,
  authToken: string,
  modulePath: string,
  componentId?: string | null
) => {
  const params = new URLSearchParams({ path: modulePath });
  
  if (componentId) {
    params.append('component', componentId);
  }
  
  const normalizedToken = authToken.startsWith('Convex ') ? authToken : `Convex ${authToken}`;
  const url = `${deploymentUrl}${ROUTES.GET_SOURCE_CODE}?${params}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': normalizedToken,
      'Content-Type': 'application/json',
      'Convex-Client': 'dashboard-0.0.0',
    }
  });


  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Failed to fetch source code: HTTP ${response.status} - ${responseText}`);
  }

  const text = await response.text();
  
  if (text === 'null' || text.trim() === '') {
    return null;
  }
  
  try {
    const json = JSON.parse(text);
    
    if (json === null || json === undefined) {
      return null;
    }
    if (typeof json === 'object' && 'code' in json) {
      return json.code || null;
    }
    if (typeof json === 'object' && 'source' in json) {
      return json.source || null;
    }
    if (typeof json === 'string') {
      return json;
    }
  } catch (parseError) {
    // Not JSON, return as text
  }
  
  return text;
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
export function parseAccessToken(authToken: string | undefined): { teamSlug?: string; projectSlug?: string } {
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

/**
 * Fetch UDF execution statistics from the Convex API
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token for the Convex deployment
 * @param cursor - The cursor position to fetch from (in milliseconds, defaults to 0)
 * @returns StreamUdfExecutionResponse with execution entries and new cursor
 */
export async function fetchUdfExecutionStats(
  deploymentUrl: string,
  authToken: string,
  cursor: number = 0
): Promise<StreamUdfExecutionResponse> {
  const url = `${deploymentUrl}${ROUTES.STREAM_UDF_EXECUTION}?cursor=${cursor}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Convex ${authToken}`,
      'Content-Type': 'application/json',
      'Convex-Client': 'dashboard-1.0.0',
    },
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Failed to fetch UDF execution stats: HTTP ${response.status} - ${responseText}`);
  }

  const data = await response.json();

  return {
    entries: data.entries || [],
    new_cursor: data.new_cursor || cursor,
  };
}

/**
 * Aggregate function execution statistics into time-bucketed data
 * @param entries - Array of function execution entries
 * @param functionIdentifier - The function identifier to filter by
 * @param functionName - The function name (for fallback matching)
 * @param functionPath - The module path (for fallback matching)
 * @param timeStart - Start of time window in seconds
 * @param timeEnd - End of time window in seconds
 * @param numBuckets - Number of time buckets (default 30)
 * @returns AggregatedFunctionStats with arrays of metrics per bucket
 */
export function aggregateFunctionStats(
  entries: FunctionExecutionStats[],
  functionIdentifier: string,
  functionName: string,
  functionPath: string,
  timeStart: number,
  timeEnd: number,
  numBuckets: number = 30
): AggregatedFunctionStats {
  const functionEntries = entries.filter((entry) => {
    return (
      entry.identifier === functionIdentifier ||
      entry.identifier === functionName ||
      entry.identifier === functionPath ||
      entry.identifier.includes(functionName) ||
      entry.identifier.includes(functionPath) ||
      (entry.identifier.includes(':') && entry.identifier.split(':')[0] === functionPath)
    );
  });

  const invocations: number[] = Array(numBuckets).fill(0);
  const errors: number[] = Array(numBuckets).fill(0);
  const executionTimes: number[] = Array(numBuckets).fill(0);
  const cacheHits: number[] = Array(numBuckets).fill(0);
  const cacheMisses: number[] = Array(numBuckets).fill(0);

  const bucketSizeSeconds = (timeEnd - timeStart) / numBuckets;

  const executionTimesByBucket: number[][] = Array(numBuckets).fill(null).map(() => []);

  functionEntries.forEach((entry) => {
    let entryTime = entry.timestamp;
    if (entryTime > 1e12) {
      entryTime = Math.floor(entryTime / 1000);
    }

    if (entryTime < timeStart || entryTime > timeEnd) {
      return;
    }

    const bucketIndex = Math.floor((entryTime - timeStart) / bucketSizeSeconds);
    const clampedIndex = Math.max(0, Math.min(numBuckets - 1, bucketIndex));

    invocations[clampedIndex]++;

    if (!entry.success) {
      errors[clampedIndex]++;
    }

    if (entry.execution_time_ms != null && entry.execution_time_ms > 0) {
      executionTimesByBucket[clampedIndex].push(entry.execution_time_ms);
    }

    if (entry.udf_type === 'query' || entry.udf_type === 'Query') {
      if (entry.cachedResult === true) {
        cacheHits[clampedIndex]++;
      } else if (entry.cachedResult === false) {
        cacheMisses[clampedIndex]++;
      }
    }
  });

  executionTimesByBucket.forEach((times, index) => {
    if (times.length > 0) {
      const sorted = times.sort((a, b) => a - b);
      const medianIndex = Math.floor(sorted.length / 2);
      executionTimes[index] = sorted.length % 2 === 0
        ? (sorted[medianIndex - 1] + sorted[medianIndex]) / 2
        : sorted[medianIndex];
    }
  });

  const cacheHitRates: number[] = Array(numBuckets).fill(0);
  for (let i = 0; i < numBuckets; i++) {
    const totalCacheOps = cacheHits[i] + cacheMisses[i];
    if (totalCacheOps > 0) {
      cacheHitRates[i] = (cacheHits[i] / totalCacheOps) * 100;
    }
  }

  return {
    invocations,
    errors,
    executionTimes,
    cacheHits: cacheHitRates,
  };
}