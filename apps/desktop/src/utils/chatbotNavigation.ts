/**
 * Chatbot Navigation Utilities
 * Functions for navigating to data view with filters from chatbot queries
 */

import type { FilterExpression, SortConfig } from "@convex-panel/shared";
import { saveTableFilters, saveActiveTable, saveTableSortConfig, saveLogsFilters, type LogsFilters } from './storage';
import { convertNaturalLanguageQuery } from './api/aiAnalysis';
import { convertQueryResponse } from './naturalLanguageQuery';
import { fetchTablesFromApi } from './api/tables';
import type { TableDefinition } from "@convex-panel/shared";
import { fetchLogsFromApi } from './api/logs';
import type { LogEntry } from "@convex-panel/shared";

export interface ChatbotNavigationResult {
  success: boolean;
  message: string;
  tableName?: string;
  filters?: FilterExpression;
  sortConfig?: SortConfig | null;
}

/**
 * Detect if a query is about logs
 * Check for logs-related keywords before checking for data filter keywords
 */
export function isLogsQuery(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  const logsKeywords = [
    'log', 'logs', 'error log', 'error logs', 'failed log', 'failed logs',
    'success log', 'success logs', 'warning log', 'warning logs',
    'debug log', 'debug logs', 'function log', 'function logs',
    'execution log', 'execution logs', 'console log', 'console logs',
    'show logs', 'view logs', 'see logs', 'display logs', 'get logs',
    'list logs', 'find logs', 'search logs', 'filter logs'
  ];
  
  // Check if query contains logs keywords
  const hasLogsKeyword = logsKeywords.some(keyword => lowerQuery.includes(keyword));
  
  // Also check for log-related patterns like "failed", "errors", "warnings" when combined with log context
  const logContextPatterns = [
    /(failed|failure|fail|failing|error|errors|warning|warnings|success|debug).*log/i,
    /log.*(failed|failure|fail|failing|error|errors|warning|warnings|success|debug)/i,
  ];
  
  const hasLogPattern = logContextPatterns.some(pattern => pattern.test(query));
  
  return hasLogsKeyword || hasLogPattern;
}

/**
 * Detect if a query is about metrics, analytics, or function statistics
 * Check for metrics-related keywords before checking for data filter keywords
 */
export function isMetricsQuery(query: string): boolean {
  if (isLogsQuery(query)) {
    return false;
  }
  
  const lowerQuery = query.toLowerCase();
  const metricsKeywords = [
    'metric', 'metrics', 'statistic', 'statistics', 'stats', 'analytics',
    'performance', 'failure rate', 'error rate', 'success rate',
    'which functions', 'what functions', 'most failing', 'top failing',
    'function failures', 'function errors', 'execution stats',
    'execution statistics', 'function performance', 'function metrics',
    'how many failures', 'failure count', 'error count',
    'function breakdown', 'function analysis', 'function summary'
  ];
  
  const hasMetricsKeyword = metricsKeywords.some(keyword => lowerQuery.includes(keyword));
  
  const metricsPatterns = [
    /(which|what).*function.*fail/i,
    /(which|what).*function.*error/i,
    /most.*fail/i,
    /most.*error/i,
    /top.*fail/i,
    /top.*error/i,
    /function.*fail.*most/i,
    /function.*error.*most/i,
  ];
  
  const hasMetricsPattern = metricsPatterns.some(pattern => pattern.test(query));
  
  return hasMetricsKeyword || hasMetricsPattern;
}

/**
 * Detect if a query is about filtering data
 * Simple heuristic-based detection
 * Note: This should be checked AFTER isLogsQuery and isMetricsQuery to avoid false positives
 */
export function isDataFilterQuery(query: string): boolean {
  if (isLogsQuery(query) || isMetricsQuery(query)) {
    return false;
  }
  
  const lowerQuery = query.toLowerCase();
  const filterKeywords = [
    'filter', 'show', 'find', 'search', 'get', 'list', 'display',
    'where', 'sort', 'order', 'by', 'created', 'updated', 'date',
    'greater', 'less', 'equal', 'contains', 'matches', 'table', 'tables'
  ];
  
  return filterKeywords.some(keyword => lowerQuery.includes(keyword));
}

/**
 * Get table name from query if possible
 * This is a simple heuristic - the AI should handle this better
 */
export function extractTableNameFromQuery(query: string, tables: TableDefinition): string | null {
  const lowerQuery = query.toLowerCase();
  const tableNames = Object.keys(tables);
  
  for (const tableName of tableNames) {
    if (lowerQuery.includes(tableName.toLowerCase())) {
      return tableName;
    }
  }
  
  return null;
}

/**
 * Navigate to data view with filters from a natural language query
 */
export async function navigateToDataViewWithQuery(
  query: string,
  adminClient: any,
  tables: TableDefinition,
  componentId: string | null = null,
  tableName?: string | null,
  availableFields?: string[]
): Promise<ChatbotNavigationResult> {
  try {
    // If no tables available, return error
    if (Object.keys(tables).length === 0) {
      return {
        success: false,
        message: 'No tables available. Please ensure your Convex deployment has tables.',
      };
    }

    // Use provided table name, or try to extract from query, or use first table as default
    let selectedTableName: string | undefined = tableName || undefined;
    if (!selectedTableName) {
      selectedTableName = extractTableNameFromQuery(query, tables) || undefined;
    }
    if (!selectedTableName) {
      selectedTableName = Object.keys(tables)[0];
    }

    const tableSchema = tables[selectedTableName];
    if (!tableSchema) {
      return {
        success: false,
        message: `Table "${selectedTableName}" not found.`,
      };
    }

    // Use provided available fields if available, otherwise get from schema
    let allFields: string[];
    if (availableFields && availableFields.length > 0) {
      // Use the provided fields (already includes system fields)
      allFields = availableFields;
    } else {
      // Get available fields from schema
      const schemaFields = tableSchema.fields?.map(field => field.fieldName) || [];
      // Always include system fields
      allFields = ['_id', '_creationTime', ...schemaFields];
    }

    // Convert fields to the format expected by the API
    // Only include fields that are in allFields (the actual available fields)
    const fields = tableSchema.fields
      .filter((field) => allFields.includes(field.fieldName))
      .map((field) => ({
        fieldName: field.fieldName,
        type: field.shape?.type || 'any',
        optional: field.optional,
      }));

    // Fetch sample documents to help AI match exact case of values
    let sampleDocuments: Array<Record<string, any>> = [];
    try {
      const normalizedComponentId = componentId === 'app' || componentId === null ? null : componentId;
      const sampleResult = await adminClient.query(
        "_system/frontend/paginatedTableDocuments:default" as any,
        {
          table: selectedTableName,
          componentId: normalizedComponentId,
          filters: null, // No filters - get a sample
          paginationOpts: {
            numItems: 10, // Get up to 10 sample documents
            cursor: null,
            id: Date.now(),
          },
        }
      );
      
      if (sampleResult?.page && Array.isArray(sampleResult.page)) {
        sampleDocuments = sampleResult.page;
      }
    } catch (error) {
      // If we can't fetch samples, continue without them
      console.warn('Could not fetch sample documents for AI:', error);
    }

    // Call the AI conversion with sample documents
    const result = await convertNaturalLanguageQuery(adminClient, {
      query: query.trim(),
      tableName: selectedTableName,
      fields,
      sampleDocuments: sampleDocuments.length > 0 ? sampleDocuments : undefined,
    });

    // Convert to FilterExpression and SortConfig
    const converted = convertQueryResponse(result, allFields);

    // Save filters to localStorage
    saveTableFilters(selectedTableName, converted.filters);
    
    // Save sort config if present
    saveTableSortConfig(selectedTableName, converted.sortConfig);
    
    // Save active table
    saveActiveTable(selectedTableName);

    return {
      success: true,
      message: `Applied filters to table "${selectedTableName}". Navigating to data view...`,
      tableName: selectedTableName,
      filters: converted.filters,
      sortConfig: converted.sortConfig,
    };
  } catch (error: any) {
    console.error('Error navigating to data view with query:', error);
    return {
      success: false,
      message: error?.message || 'Failed to process query. Please try again.',
    };
  }
}

/**
 * Get tables for the chatbot
 * This fetches tables that can be used for filtering
 */
export async function getTablesForChatbot(
  convexUrl: string,
  accessToken: string,
  adminClient: any,
  componentId: string | null = null
): Promise<TableDefinition> {
  try {
    const response = await fetchTablesFromApi({
      convexUrl,
      accessToken,
      adminClient,
      componentId: componentId === 'app' ? null : componentId,
    });
    return response.tables;
  } catch (error) {
    console.error('Error fetching tables for chatbot:', error);
    return {};
  }
}

/**
 * Navigate to logs view with filters
 */
export interface NavigateToLogsResult {
  success: boolean;
  message: string;
}

export async function navigateToLogsWithFilters(
  filters: LogsFilters
): Promise<NavigateToLogsResult> {
  try {
    saveLogsFilters(filters);

    return {
      success: true,
      message: 'Applied filters to logs view. Navigating to logs...',
    };
  } catch (error: any) {
    console.error('Error navigating to logs with filters:', error);
    return {
      success: false,
      message: error?.message || 'Failed to apply logs filters. Please try again.',
    };
  }
}

/**
 * Fetch and filter logs for chatbot display
 * Returns up to displayLimit logs with total count
 */
export interface FetchFilteredLogsResult {
  logs: LogEntry[];
  totalCount: number;
}

export async function fetchFilteredLogsForChatbot(
  convexUrl: string,
  accessToken: string,
  filters: LogsFilters,
  limit: number = 30
): Promise<FetchFilteredLogsResult> {
  try {
    const response = await fetchLogsFromApi({
      cursor: 0,
      convexUrl,
      accessToken,
      limit,
    });

    let allLogs = response.logs || [];

    const filteredLogs = allLogs.filter((log) => {
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesSearch =
          log.message?.toLowerCase().includes(query) ||
          log.function?.path?.toLowerCase().includes(query) ||
          log.function?.request_id?.toLowerCase().includes(query) ||
          log.error_message?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      if (filters.logTypes && filters.logTypes.length > 0) {
        let matchesAnyLogType = false;
        
        const status = log.status;
        const logLevel = log.log_level?.toLowerCase();
        // Enhanced failure detection matching the logs view logic
        // Check multiple sources for failure indicators
        const hasError = log.error_message || 
                        status === 'error' || 
                        status === 'failure' ||
                        (log.raw && (
                          !!log.raw.error || 
                          log.raw.failure === true || 
                          log.raw.success === false ||
                          (log.raw.success !== undefined && log.raw.success === false)
                        )) ||
                        // Also check if success field exists and is false
                        (log.raw && typeof log.raw.success === 'boolean' && log.raw.success === false);
        
        for (const logType of filters.logTypes) {
          const normalizedLogType = logType.toLowerCase();
          
          // Map log types to LOG_TYPES constant values (case-insensitive matching)
          // LOG_TYPES: 'success', 'failure', 'DEBUG', 'INFO', 'WARN', 'ERROR'
          if (normalizedLogType === 'success' && status === 'success') {
            matchesAnyLogType = true;
            break;
          }
          if (normalizedLogType === 'failure') {
            // Match failures: status is error/failure, has error_message, or has error in raw data
            // Be more strict - if we're looking for failures, exclude successes
            if (status === 'success' && !hasError) {
              // Explicitly exclude successes when looking for failures
              continue;
            }
            if (status === 'error' || 
                status === 'failure' || 
                hasError ||
                (log.raw && (
                  !!log.raw.error || 
                  log.raw.failure === true || 
                  log.raw.success === false ||
                  (typeof log.raw.success === 'boolean' && log.raw.success === false)
                ))) {
              matchesAnyLogType = true;
              break;
            }
          }
          // DEBUG from LOG_TYPES
          if (normalizedLogType === 'debug' && logLevel === 'debug') {
            matchesAnyLogType = true;
            break;
          }
          // INFO from LOG_TYPES - also handle 'log / info' variant
          if ((normalizedLogType === 'info' || normalizedLogType === 'log / info') && 
              (logLevel === 'info' || logLevel === 'log' || (!logLevel && !hasError && status !== 'success' && status !== 'error' && status !== 'failure'))) {
            matchesAnyLogType = true;
            break;
          }
          // WARN from LOG_TYPES
          if (normalizedLogType === 'warn' && (logLevel === 'warn' || logLevel === 'warning')) {
            matchesAnyLogType = true;
            break;
          }
          // ERROR from LOG_TYPES
          if (normalizedLogType === 'error' && (logLevel === 'error' || status === 'error' || hasError)) {
            matchesAnyLogType = true;
            break;
          }
        }
        
        if (!matchesAnyLogType) {
          return false;
        }
      }

      // Filter by function IDs
      if (filters.functionIds && filters.functionIds.length > 0) {
        if (!log.function?.path) return false;
        
        let matchesAnyFunction = false;
        for (const functionId of filters.functionIds) {
          // Try exact match
          if (log.function.path === functionId) {
            matchesAnyFunction = true;
            break;
          }
          // Try matching without .js extension
          const identifierWithoutJs = functionId.replace(/\.js:/g, ':').replace(/\.js$/g, '');
          const logPathWithoutJs = log.function.path.replace(/\.js:/g, ':').replace(/\.js$/g, '');
          if (logPathWithoutJs === identifierWithoutJs) {
            matchesAnyFunction = true;
            break;
          }
        }
        
        if (!matchesAnyFunction) {
          return false;
        }
      }

      // Filter by component IDs
      if (filters.componentIds && filters.componentIds.length > 0) {
        if (!log.function?.path) {
          // Log has no function path - only show if 'app' is in componentIds
          if (!filters.componentIds.includes('app')) {
            return false;
          }
        } else {
          // Check if log belongs to any selected component
          const pathParts = log.function.path.split(':');
          const componentMatch = pathParts.length > 1 ? pathParts[0] : null;
          
          let matchesAnyComponent = false;
          
          for (const componentId of filters.componentIds) {
            if (componentId === 'app') {
              // If 'app' is selected, match logs without component prefix
              if (!componentMatch) {
                matchesAnyComponent = true;
                break;
              }
            } else {
              // Check component name/ID match
              if (componentMatch === componentId) {
                matchesAnyComponent = true;
                break;
              }
              
              // Check log's componentId field from raw data
              const logComponentId = (log.raw as any)?.component_id;
              if (logComponentId && logComponentId === componentId) {
                matchesAnyComponent = true;
                break;
              }
            }
          }
          
          if (!matchesAnyComponent) {
            return false;
          }
        }
      }

      // Exclude frontend logs
      if (log.topic === 'frontend') {
        return false;
      }

      return true;
    });

    return {
      logs: filteredLogs,
      totalCount: filteredLogs.length,
    };
  } catch (error: any) {
    console.error('Error fetching filtered logs for chatbot:', error);
    return {
      logs: [],
      totalCount: 0,
    };
  }
}
