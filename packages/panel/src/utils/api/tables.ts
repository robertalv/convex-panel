/**
 * Table and schema operations
 * Handles fetching table schemas, columns, and field information
 */

import { ROUTES, SYSTEM_QUERIES } from '../../utils/constants';
import type {
  FetchTablesOptions,
  FetchTablesResponse,
} from '../../types';
import type {
  TableDefinition,
  TableField,
} from '../../types';
import { getActiveTable } from '../storage';
import { mockFetchTablesFromApi } from '../mockData';
import {
  getTableColumnsForbiddenCache,
  setTableColumnsForbiddenCache,
  mergeFieldsWithColumns,
} from './utils';
import { callConvexQuery } from './helpers';

/**
 * Fetch all field names for a table using the getAllTableFields system query
 * This is more efficient than sampling documents and handles pagination limits better
 * @param deploymentUrl - The deployment URL
 * @param accessToken - The access token
 * @param tableName - The name of the table
 * @param componentId - The component ID
 * @param sampleSize - The sample size
 * @returns The field names
 */
// async function getAllTableFields(
//   deploymentUrl: string,
//   accessToken: string,
//   tableName: string,
//   componentId: string | null,
//   sampleSize: number = 200
// ): Promise<string[]> {
//   if (!deploymentUrl || !accessToken) {
//     return [];
//   }

//   try {
//     const fieldsResult = await callConvexQuery(
//       deploymentUrl,
//       accessToken,
//       SYSTEM_QUERIES.GET_ALL_TABLE_FIELDS,
//       {
//         table: tableName,
//         sampleSize,
//         componentId
//       }
//     );

//     if (fieldsResult === null || fieldsResult === undefined) {
//       return [];
//     }

//     // Handle different response formats
//     let result = fieldsResult;
//     if (fieldsResult && typeof fieldsResult === 'object' && 'value' in fieldsResult) {
//       result = fieldsResult.value;
//     }

//     if (result instanceof Set) {
//       return Array.from(result);
//     } else if (Array.isArray(result)) {
//       return result;
//     }

//     return [];
//   } catch (err) {
//     console.warn('[getAllTableFields] Query not available or failed:', err);
//     return [];
//   }
// }

/**
 * Fetch table columns from the Convex API
 * @param convexUrl - The URL of the Convex deployment
 * @param accessToken - The authentication token
 * @returns The table columns
 */
async function fetchTableColumnsFromApi(
  convexUrl: string,
  accessToken: string,
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

/**
 * Fetch all tables from the Convex instance
 * @param convexUrl - The URL of the Convex deployment
 * @param accessToken - The authentication token
 * @param useMockData - Whether to use mock data
 * @param componentId - The component ID
 * @returns The tables
 * @throws An error if the URL or access token is missing
 */
export async function fetchTablesFromApi({
  convexUrl,
  accessToken,
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
  
  try {
    const tableMapping = await callConvexQuery(
      convexUrl,
      accessToken,
      SYSTEM_QUERIES.GET_TABLE_MAPPING,
      {
        componentId: normalizedComponentId
      }
    ).catch(() => null);

    if (tableMapping && typeof tableMapping === 'object') {
      let mapping = tableMapping;
      if (tableMapping && typeof tableMapping === 'object' && 'value' in tableMapping) {
        mapping = tableMapping.value;
      }
      if (mapping && typeof mapping === 'object') {
        tableNames = Object.values(mapping) as string[];
        tableNames = tableNames.filter(name => name !== '_scheduled_jobs' && name !== '_file_storage');
      }
    }
  } catch (err) {
    console.warn('Failed to get table mapping, will try shapes data:', err);
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

  const columnMap = await fetchTableColumnsFromApi(convexUrl, accessToken).catch(
    () => ({}),
  );

  let filteredShapesData = shapesData;
  
  if (tableNames.length > 0) {
    const componentTableSet = new Set(tableNames);
    filteredShapesData = Object.fromEntries(
      Object.entries(shapesData).filter(([tableName]) => componentTableSet.has(tableName))
    );
    
    if (normalizedComponentId !== null) {
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
              const pageData: any = await callConvexQuery(
                convexUrl,
                accessToken,
                SYSTEM_QUERIES.PAGINATED_TABLE_DOCUMENTS,
                {
                  componentId: normalizedComponentId,
                  table: tableName,
                  filters: null,
                  paginationOpts: {
                    numItems: itemsPerPage,
                    cursor: cursor
                  }
                }
              ).catch((err: any) => {
                console.warn('Error querying paginatedTableDocuments for', tableName, ':', err);
                return null;
              });
              
              let result = pageData;
              if (pageData && typeof pageData === 'object' && 'value' in pageData) {
                result = pageData.value;
              }
              
              if (!result || !result.page || !Array.isArray(result.page) || result.page.length === 0) {
                break;
              }
              
              result.page.forEach((doc: any) => {
                sampleDocuments.push(doc);
                Object.keys(doc).forEach(key => {
                  if (key !== '_id' && key !== '_creationTime') {
                    allKeys.add(key);
                  }
                });
              });
              
              if (result.continuationCursor) {
                cursor = result.continuationCursor;
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
  } else if (Object.keys(tableData).length > 0) {
    try {
      await callConvexQuery(
        convexUrl,
        accessToken,
        SYSTEM_QUERIES.GET_TABLE_SIZE,
        {
          componentId: normalizedComponentId,
          tableName: Object.keys(tableData)[0]
        }
      );
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

