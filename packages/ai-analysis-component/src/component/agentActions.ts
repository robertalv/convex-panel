/**
 * Internal Actions for Agent Tools
 * These actions handle HTTP calls to Convex API endpoints
 */

import { internalAction } from "./_generated/server";
import { v } from "convex/values";

/**
 * Minimal base64 encoder that works in Convex runtime (no Buffer).
 */
function toBase64(input: string): string {
  if (typeof btoa === "function") {
    return btoa(input);
  }

  const encoder =
    typeof TextEncoder !== "undefined"
      ? new TextEncoder()
      : ({
        encode: (str: string) => {
          const arr = new Uint8Array(str.length);
          for (let i = 0; i < str.length; i++) arr[i] = str.charCodeAt(i);
          return arr;
        },
      } as any);
  const bytes = encoder.encode(input);
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";

  for (let i = 0; i < bytes.length; i += 3) {
    const byte1 = bytes[i];
    const byte2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const byte3 = i + 2 < bytes.length ? bytes[i + 2] : 0;

    const enc1 = byte1 >> 2;
    const enc2 = ((byte1 & 3) << 4) | (byte2 >> 4);
    const enc3 = ((byte2 & 15) << 2) | (byte3 >> 6);
    const enc4 = byte3 & 63;

    output += alphabet[enc1] + alphabet[enc2];
    output += (i + 1 < bytes.length) ? alphabet[enc3] : "=";
    output += (i + 2 < bytes.length) ? alphabet[enc4] : "=";
  }

  return output;
}

const STREAM_FUNCTION_LOGS_API = "/api/app_metrics/stream_function_logs";
const UDF_EXECUTION_STATS_API = "/api/stream_udf_execution_stats";

/**
 * Fetch logs from Convex API
 */
export const fetchLogs = internalAction({
  args: {
    convexUrl: v.string(),
    accessToken: v.string(),
    filters: v.object({
      logTypes: v.array(v.string()),
      searchQuery: v.string(),
      functionIds: v.array(v.string()),
      componentIds: v.array(v.string()),
    }),
    limit: v.number(),
    timeWindow: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const urlObj = new URL(args.convexUrl);
    const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;

    const url = new URL(`${baseUrl}${STREAM_FUNCTION_LOGS_API}`);
    url.searchParams.set('cursor', '0');
    url.searchParams.set('limit', String(args.limit));

    const normalizedToken = args.accessToken.startsWith('Bearer ')
      ? args.accessToken
      : `Bearer ${args.accessToken}`;

    let data: { entries?: any[] };

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': normalizedToken,
          'Content-Type': 'application/json',
          'Convex-Client': 'dashboard-0.0.0',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`fetchLogs failed: ${response.status} - ${errorText}`);
        return {
          entries: [],
          error: `Failed to fetch logs: HTTP ${response.status}. The provided access token may be invalid or expired.`,
        };
      }

      data = await response.json() as { entries?: any[] };
    } catch (error) {
      console.error("fetchLogs exception:", error);
      return {
        entries: [],
        error: error instanceof Error ? error.message : "Unknown error fetching logs",
      };
    }

    const allLogs = (data.entries || []).map((entry: any) => {
      const timestamp = entry.timestamp
        ? (entry.timestamp > 1e12 ? entry.timestamp : entry.timestamp * 1000)
        : Date.now();

      const status = entry.status || (entry.success === true ? 'success' : entry.success === false ? 'error' : undefined);
      const requestId = entry.requestId || entry.request_id || entry.execution_id || '';
      const shortId = requestId ? requestId.slice(0, 4) : '-';
      const functionPath = entry.identifier || entry.udf_path || entry.function || '';
      const pathParts = functionPath.split(':');
      const functionIdentifier = pathParts.length > 1 ? pathParts[0] : '';
      const functionName = pathParts.length > 1 ? pathParts[1] : functionPath;

      const udfType = entry.udfType || entry.udf_type || entry.type;
      const normalizedType = udfType ? String(udfType).toLowerCase().trim() : undefined;
      const functionType = normalizedType === 'query' || normalizedType === 'mutation' || normalizedType === 'action'
        ? normalizedType
        : normalizedType === 'httpaction' || normalizedType === 'http_action'
          ? 'action'
          : undefined;
      const logTypeIcon = functionType === 'query' ? 'Q'
        : functionType === 'mutation' ? 'M'
          : functionType === 'action' ? 'A'
            : 'L';

      const executionTime = entry.executionTime
        ? (entry.executionTime < 1000 ? entry.executionTime * 1000 : entry.executionTime)
        : (entry.execution_time_ms || entry.executionTimeMs);
      const executionTimeStr = executionTime ? `${Math.round(executionTime)}ms` : undefined;

      const isCached = entry.cached || entry.cachedResult || false;
      const isSuccess = status === 'success' || (status !== 'error' && status !== 'failure' && !entry.error_message);
      const isError = status === 'error' || status === 'failure' || !!entry.error_message;

      const logLines = entry.logLines || entry.log_lines || entry.log || [];
      let logPreview: string | null = null;
      if (logLines && Array.isArray(logLines) && logLines.length > 0) {
        const nonEmptyLogLines = logLines.filter((line: any) => {
          if (line === null || line === undefined) return false;
          if (typeof line === 'string') {
            const trimmed = line.trim();
            return trimmed.length > 0 && trimmed !== '{}' && trimmed !== '[]';
          }
          return true;
        });

        if (nonEmptyLogLines.length > 0) {
          const firstLogLine = nonEmptyLogLines[0];
          if (typeof firstLogLine === 'string') {
            logPreview = firstLogLine.trim();
          } else {
            try {
              logPreview = JSON.stringify(firstLogLine);
            } catch {
              logPreview = null;
            }
          }
        }
      }

      if (!logPreview) {
        logPreview = entry.message || entry.error_message || null;
      }

      return {
        timestamp,
        shortId,
        status,
        isSuccess,
        isError,
        isCached,
        executionTime: executionTimeStr,
        functionIdentifier,
        functionName,
        logTypeIcon,
        logPreview,
        errorMessage: entry.error_message || null,
        level: entry.log_level || status || 'info',
      };
    });

    let filteredLogs = allLogs;

    if (args.filters.logTypes.length > 0) {
      filteredLogs = filteredLogs.filter((log: any) => {
        for (const logType of args.filters.logTypes) {
          const normalizedLogType = logType.toLowerCase();
          if (normalizedLogType === 'success' && log.status === 'success') return true;
          if (normalizedLogType === 'failure' && log.isError) return true;
          if (normalizedLogType === 'error' && log.isError) return true;
          if (normalizedLogType === 'debug' && log.level === 'debug') return true;
          if ((normalizedLogType === 'info' || normalizedLogType === 'log / info') &&
            (log.level === 'info' || log.level === 'log')) return true;
          if (normalizedLogType === 'warn' && (log.level === 'warn' || log.level === 'warning')) return true;
        }
        return false;
      });
    }

    if (args.filters.searchQuery) {
      const query = args.filters.searchQuery.toLowerCase();
      filteredLogs = filteredLogs.filter((log: any) =>
        log.logPreview?.toLowerCase().includes(query) ||
        log.functionName.toLowerCase().includes(query) ||
        log.errorMessage?.toLowerCase().includes(query)
      );
    }

    if (args.filters.functionIds.length > 0) {
      filteredLogs = filteredLogs.filter((log: any) => {
        const fullPath = log.functionIdentifier
          ? `${log.functionIdentifier}:${log.functionName}`
          : log.functionName;
        return args.filters.functionIds.some((id) =>
          fullPath.includes(id) || log.functionName.includes(id)
        );
      });
    }

    if (args.timeWindow) {
      const now = Date.now();
      let timeWindowStart: number;

      if (args.timeWindow.includes('minute')) {
        const minutes = parseInt(args.timeWindow.match(/\d+/)?.[0] || '15');
        timeWindowStart = now - (minutes * 60 * 1000);
      } else if (args.timeWindow.includes('hour')) {
        const hours = parseInt(args.timeWindow.match(/\d+/)?.[0] || '1');
        timeWindowStart = now - (hours * 60 * 60 * 1000);
      } else if (args.timeWindow.includes('day')) {
        const days = parseInt(args.timeWindow.match(/\d+/)?.[0] || '1');
        timeWindowStart = now - (days * 24 * 60 * 60 * 1000);
      } else {
        timeWindowStart = now - (30 * 60 * 1000);
      }

      filteredLogs = filteredLogs.filter((log: any) => log.timestamp >= timeWindowStart);
    }

    filteredLogs.sort((a: any, b: any) => b.timestamp - a.timestamp);

    return {
      logs: filteredLogs.slice(0, args.limit),
      totalCount: filteredLogs.length,
    };
  },
});

/**
 * Fetch metrics from Convex API
 */
export const fetchMetrics = internalAction({
  args: {
    convexUrl: v.string(),
    accessToken: v.string(),
    timeWindow: v.string(),
    functionFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const urlObj = new URL(args.convexUrl);
    const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;

    const now = Math.floor(Date.now() / 1000);
    let timeStart: number;

    if (args.timeWindow.includes('minute')) {
      const minutes = parseInt(args.timeWindow.match(/\d+/)?.[0] || '30');
      timeStart = now - (minutes * 60);
    } else if (args.timeWindow.includes('hour')) {
      const hours = parseInt(args.timeWindow.match(/\d+/)?.[0] || '1');
      timeStart = now - (hours * 60 * 60);
    } else {
      timeStart = now - (30 * 60);
    }

    const timeStartMs = timeStart * 1000;

    const url = new URL(`${baseUrl}${UDF_EXECUTION_STATS_API}`);
    url.searchParams.set('start', String(timeStartMs));

    const normalizedToken = args.accessToken.startsWith('Bearer ')
      ? args.accessToken
      : `Bearer ${args.accessToken}`;

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': normalizedToken,
        'Content-Type': 'application/json',
        'Convex-Client': 'dashboard-0.0.0',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch metrics: HTTP ${response.status} - ${errorText}`);
    }

    const data = await response.json() as { entries?: any[] };
    const entries = data.entries || [];

    const functionFailures: Record<string, {
      failures: number;
      total: number;
      functionName: string;
      functionPath: string;
    }> = {};

    entries.forEach((entry: any) => {
      const identifier = entry.identifier || '';
      if (!identifier) return;

      const pathParts = identifier.split(':');
      const functionPath = pathParts.length > 1 ? pathParts[0] : '';
      const functionName = pathParts.length > 1 ? pathParts[1] : identifier;

      if (!functionFailures[identifier]) {
        functionFailures[identifier] = {
          failures: 0,
          total: 0,
          functionName,
          functionPath,
        };
      }

      functionFailures[identifier].total++;
      if (!entry.success) {
        functionFailures[identifier].failures++;
      }
    });

    // Filter by function if specified
    let filteredFunctions = Object.entries(functionFailures);
    if (args.functionFilter) {
      filteredFunctions = filteredFunctions.filter(([identifier, stats]) =>
        identifier.includes(args.functionFilter!) ||
        stats.functionName.includes(args.functionFilter!)
      );
    }

    // Sort by failure count
    const sortedFunctions = filteredFunctions
      .map(([identifier, stats]) => ({
        identifier,
        ...stats,
        failureRate: stats.total > 0 ? (stats.failures / stats.total) * 100 : 0,
      }))
      .sort((a, b) => {
        if (b.failures !== a.failures) {
          return b.failures - a.failures;
        }
        return b.failureRate - a.failureRate;
      })
      .filter((f) => f.failures > 0)
      .slice(0, 10);

    // Calculate overall statistics
    const totalExecutions = entries.length;
    const totalFailures = entries.filter((e: any) => !e.success).length;
    const overallFailureRate = totalExecutions > 0 ? (totalFailures / totalExecutions) * 100 : 0;

    return {
      type: 'metrics',
      summary: {
        totalExecutions,
        totalFailures,
        overallFailureRate: Math.round(overallFailureRate * 100) / 100,
        timeWindow: args.timeWindow,
      },
      topFailingFunctions: sortedFunctions.map((f) => ({
        identifier: f.identifier,
        functionName: f.functionName,
        functionPath: f.functionPath,
        failures: f.failures,
        total: f.total,
        failureRate: Math.round(f.failureRate * 100) / 100,
      })),
    };
  },
});

/**
 * Filter data from Convex tables
 */
export const filterData = internalAction({
  args: {
    convexUrl: v.string(),
    accessToken: v.string(),
    componentId: v.optional(v.union(v.string(), v.null())),
    query: v.optional(v.string()),
    tableName: v.string(),
    filters: v.optional(v.array(v.any())),
    sortConfig: v.optional(v.any()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { convexUrl, accessToken, componentId, tableName, query, filters = [], sortConfig, limit } = args;

    if (!convexUrl || !accessToken) {
      throw new Error("Convex deployment URL and access token are required");
    }

    const normalizedComponentId = componentId === "app" || componentId === null ? null : componentId;

    // Normalize token to include expected prefix.
    // Support both Convex <token> and Bearer <token> since callers may pass either.
    const authHeader = accessToken.startsWith("Convex ")
      ? accessToken
      : accessToken.startsWith("Bearer ")
        ? accessToken
        : `Convex ${accessToken}`;

    const logCtx = {
      tableName,
      hasConvexUrl: !!convexUrl,
      componentId: normalizedComponentId ?? null,
      hasAccessToken: !!accessToken,
      tokenPrefix: authHeader.split(" ")[0],
      queryProvided: !!query,
      filtersProvided: Array.isArray(filters) ? filters.length : 0,
      sortProvided: !!sortConfig,
      limitProvided: limit ?? null,
    };

    /**
     * Fetch shapes and validate table exists for current component
     */
    const fetchTableFields = async (): Promise<
      Array<{ fieldName: string; type: string; optional?: boolean }>
    > => {
      const shapesRes = await fetch(`${convexUrl}/api/shapes2`, {
        method: "GET",
        headers: {
          Authorization: authHeader,
          "Convex-Client": "dashboard-0.0.0",
        },
      });

      if (!shapesRes.ok) {
        const text = await shapesRes.text().catch(() => "");
        console.error("[agentActions.filterData] shapes2 failed", { status: shapesRes.status, text });
        throw new Error(`Failed to fetch shapes: HTTP ${shapesRes.status} ${text}`);
      }

      const shapes: any = await shapesRes.json();

      // When componentId is set, the shapes are namespaced under that component
      // Shapes response can be either flat or grouped by component key; handle both
      const shapeRoot = normalizedComponentId && shapes?.[normalizedComponentId] ? shapes[normalizedComponentId] : shapes;
      const availableTables = shapeRoot ? Object.keys(shapeRoot) : [];

      if (!shapeRoot || !shapeRoot[tableName]) {
        const tableList = availableTables.length ? availableTables.join(", ") : "none";
        console.error("[agentActions.filterData] table not found", { requested: tableName, availableTables });
        throw new Error(
          `Table "${tableName}" not found for this component. Available tables: ${tableList}`
        );
      }

      const tableShape = shapeRoot?.[tableName];
      const fields: Array<{ fieldName: string; type: string; optional?: boolean }> =
        tableShape?.fields?.map((f: any) => ({
          fieldName: f.fieldName,
          type: f.shape?.type ?? "any",
          optional: !!f.optional,
        })) ?? [];

      return fields;
    };

    /**
     * Fetch a few sample documents for the AI to understand exact values/casing
     */
    const fetchSampleDocuments = async (): Promise<any[]> => {
      try {
        const sampleBody = {
          path: "_system/frontend/paginatedTableDocuments:default",
          args: [
            {
              paginationOpts: { cursor: null, numItems: 5, id: Date.now() },
              table: tableName,
              filters: null,
              componentId: normalizedComponentId,
            },
          ],
        };

        const sampleRes = await fetch(`${convexUrl}/api/query`, {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
            "Convex-Client": "dashboard-0.0.0",
          },
          body: JSON.stringify(sampleBody),
        });

        if (!sampleRes.ok) {
          console.warn("[agentActions] Failed to fetch sample documents");
          return [];
        }

        const sampleResult = (await sampleRes.json()) as { page?: any[] };
        return sampleResult?.page || [];
      } catch (err) {
        console.warn("[agentActions] Error fetching sample documents:", err);
        return [];
      }
    };

    /**
     * Convert a natural language query into filters/sort/limit using the existing backend action
     */
    const maybeConvertNaturalQuery = async () => {
      if (!query || query.trim().length === 0) {
        return null;
      }

      const fields = await fetchTableFields();
      if (!fields || fields.length === 0) {
        throw new Error("Could not load table schema to convert natural language query.");
      }

      const sampleDocuments = await fetchSampleDocuments();

      const body = {
        path: "aiAnalysis:convertNaturalLanguageQuery",
        args: [
          {
            query: query.trim(),
            tableName,
            fields,
            sampleDocuments: sampleDocuments.length > 0 ? sampleDocuments : undefined,
          },
        ],
      };

      const res = await fetch(`${convexUrl}/api/action`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
          "Convex-Client": "dashboard-0.0.0",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[agentActions.filterData] convertNaturalLanguageQuery failed", { status: res.status, text });
        throw new Error(`Failed to convert natural language query: HTTP ${res.status} ${text}`);
      }

      const result = (await res.json()) as {
        filters: Array<{ field: string; op: string; value: any }>;
        sortConfig: { field: string; direction: "asc" | "desc" } | null;
        limit: number | null;
      };

      if (!result.filters || result.filters.length === 0) {
        const lowerQuery = query.toLowerCase();
        const availableFieldNames = new Set(fields.map(f => f.fieldName));
        const manualFilters: Array<{ field: string; op: string; value: any }> = [];

        // Check for "done" / "completed" patterns
        if (availableFieldNames.has("done")) {
          if (lowerQuery.includes("done") || lowerQuery.includes("completed") || lowerQuery.includes("finished")) {
            manualFilters.push({ field: "done", op: "eq", value: true });
          } else if (lowerQuery.includes("not done") || lowerQuery.includes("incomplete") || lowerQuery.includes("pending")) {
            manualFilters.push({ field: "done", op: "eq", value: false });
          }
        }

        // Check for category patterns - look at sample docs for exact values
        if (availableFieldNames.has("category")) {
          // Get unique category values from samples
          const categories = new Set(sampleDocuments.map(d => d.category).filter(Boolean));

          for (const cat of categories) {
            if (lowerQuery.includes(cat.toLowerCase())) {
              manualFilters.push({ field: "category", op: "eq", value: cat });
              break;
            }
          }

          // Common category patterns if no samples matched
          if (!manualFilters.some(f => f.field === "category")) {
            if (lowerQuery.includes("chore")) {
              manualFilters.push({ field: "category", op: "eq", value: "Chores" });
            } else if (lowerQuery.includes("work")) {
              manualFilters.push({ field: "category", op: "eq", value: "Work" });
            } else if (lowerQuery.includes("other")) {
              manualFilters.push({ field: "category", op: "eq", value: "Other" });
            }
          }
        }

        if (manualFilters.length > 0) {
          return {
            filters: manualFilters,
            sortConfig: result.sortConfig,
            limit: result.limit,
          };
        }
      }

      return result;
    };

    let effectiveFilters = filters;
    let effectiveSortConfig = sortConfig ?? null;
    let effectiveLimit = limit ?? null;

    // ALWAYS prefer natural language query conversion when a query is provided
    // This ensures we use schema-aware field names, ignoring any AI-generated filters
    if (query && query.trim().length > 0) {
      const converted = await maybeConvertNaturalQuery();
      if (converted) {
        // Validate fields against schema
        const fields = await fetchTableFields();
        const availableFieldNames = new Set(fields.map((f) => f.fieldName));

        effectiveFilters = (converted.filters || []).filter((f) => availableFieldNames.has(f.field));
        effectiveFilters = effectiveFilters.map((f, idx) => ({
          field: f.field,
          op: f.op as any,
          value: f.value,
          enabled: true,
          id: `${f.field}_${idx}`,
        }));

        if (converted.sortConfig && availableFieldNames.has(converted.sortConfig.field)) {
          effectiveSortConfig = converted.sortConfig;
        } else {
          effectiveSortConfig = null;
        }

        effectiveLimit = converted.limit ?? effectiveLimit ?? null;

      }
    }

    // Build Convex system query payload
    const paginationOpts = {
      cursor: null,
      numItems: effectiveLimit && effectiveLimit > 0 ? effectiveLimit : 50,
      id: Date.now(),
    };

    // Convex expects filters as base64-encoded JSON string
    const buildSort = (docs: any[]) => {
      if (!effectiveSortConfig || !effectiveSortConfig.field) return docs;
      const { field, direction } = effectiveSortConfig as { field: string; direction: "asc" | "desc" };
      return [...docs].sort((a, b) => {
        const aVal = a?.[field];
        const bVal = b?.[field];

        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;

        if (typeof aVal === "number" && typeof bVal === "number") {
          return direction === "asc" ? aVal - bVal : bVal - aVal;
        }

        return direction === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    };

    // Fetch fields once for normalization/validation
    const fields = await fetchTableFields();

    // Normalize values based on field type to reduce LLM casing/boolean errors
    const normalizeValue = (
      fieldName: string,
      value: any,
      fieldList: Array<{ fieldName: string; type: string; optional?: boolean }>
    ): any => {
      const fieldType = fieldList.find((f) => f.fieldName === fieldName)?.type;

      if (fieldType === "boolean") {
        if (typeof value === "boolean") return value;
        if (typeof value === "string") {
          const lower = value.trim().toLowerCase();
          if (["true", "1", "yes", "y", "done", "completed", "complete", "checked"].includes(lower)) return true;
          if (["false", "0", "no", "n", "not done", "pending", "open", "todo"].includes(lower)) return false;
        }
      }

      if (fieldType === "string" && typeof value === "string") {
        // Normalize common category casing
        if (fieldName === "category") {
          const lower = value.trim().toLowerCase();
          if (["chores", "chore"].includes(lower)) return "Chores";
          if (["work"].includes(lower)) return "Work";
          if (["other"].includes(lower)) return "Other";
          // Generic title-case fallback
          return value.trim().charAt(0).toUpperCase() + value.trim().slice(1).toLowerCase();
        }
        return value;
      }

      return value;
    };

    const filterString =
      Array.isArray(effectiveFilters) && effectiveFilters.length > 0
        ? toBase64(
          JSON.stringify({
            clauses: effectiveFilters.map((clause: any, idx: number) => ({
              op: clause.op,
              field: clause.field,
              value: normalizeValue(clause.field, clause.value, fields),
              enabled: clause.enabled !== false,
              id: clause.id ?? `${clause.field}_${idx}`,
            })),
          })
        )
        : null;

    // Debug: Log the filter payload being sent
    if (filterString) {
      const filterPayload = {
        clauses: effectiveFilters.map((clause: any, idx: number) => ({
          op: clause.op,
          field: clause.field,
          value: normalizeValue(clause.field, clause.value, fields),
          enabled: clause.enabled !== false,
          id: clause.id ?? `${clause.field}_${idx}`,
        })),
      };
    }

    const body = {
      path: "_system/frontend/paginatedTableDocuments:default",
      args: [
        {
          paginationOpts,
          table: tableName,
          filters: filterString,
          componentId: normalizedComponentId,
        },
      ],
    };

    const response = await fetch(`${convexUrl}/api/query`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        "Convex-Client": "dashboard-0.0.0",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("[agentActions.filterData] query failed", { status: response.status, errorText });
      throw new Error(`Failed to query table data: HTTP ${response.status} ${errorText}`);
    }

    const rawResult = (await response.json()) as any;

    // Convex HTTP API wraps responses in { status: "success", value: {...} }
    // Unwrap it if present
    const result = rawResult?.status === "success" && rawResult?.value
      ? rawResult.value
      : rawResult;

    let rows = Array.isArray(result?.page) ? result.page : [];

    // Apply client-side sort if requested (Convex system query does not sort)
    rows = buildSort(rows);


    const payload = {
      success: true,
      tableName,
      rows,
      count: rows.length,
      continueCursor: result?.continueCursor ?? null,
      isDone: result?.isDone ?? true,
      appliedFilters: effectiveFilters,
      sortConfig: effectiveSortConfig,
      limit: effectiveLimit,
      // Structured artifact for the UI/agent to surface and apply
      type: "filter",
      target: tableName,
      filters: effectiveFilters,
      sort: effectiveSortConfig,
      message:
        effectiveFilters && effectiveFilters.length > 0
          ? `Applied ${effectiveFilters.length} filter(s) to ${tableName}`
          : `Showing results from ${tableName}`,
      rowsPreview: rows.slice(0, 5),
    };

    return payload;
  },
});

/**
 * Create a new table in the Convex deployment
 */
export const createTable = internalAction({
  args: {
    convexUrl: v.string(),
    accessToken: v.string(),
    tableName: v.string(),
    columns: v.optional(v.array(v.object({
      name: v.string(),
      defaultValue: v.optional(v.any()),
    }))),
    componentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const urlObj = new URL(args.convexUrl);
    const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;
    const mutationPath = "_system/frontend/createTable:default";

    // Construct the mutation URL
    const url = new URL(`${baseUrl}/api/mutation`);

    const normalizedToken = args.accessToken.startsWith('Convex ')
      ? args.accessToken
      : `Convex ${args.accessToken}`;

    const requestBody = {
      path: mutationPath,
      args: [{
        table: args.tableName,
        componentId: args.componentId ?? null,
      }],
    };

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Authorization': normalizedToken,
        'Content-Type': 'application/json',
        'Convex-Client': 'dashboard-0.0.0',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Failed to create table: HTTP ${response.status} - ${errorText}`);
    }

    // If columns are provided, create a sample document to initialize them
    if (args.columns && args.columns.length > 0) {
      const document: Record<string, any> = {};
      for (const col of args.columns) {
        document[col.name] = col.defaultValue ?? null;
      }

      // Use the same logic as addColumn to add the document
      // Helper to call Convex API
      const callApi = async (path: string, args: any) => {
        const response = await fetch(`${baseUrl}/api/mutation`, {
          method: 'POST',
          headers: {
            'Authorization': normalizedToken,
            'Content-Type': 'application/json',
            'Convex-Client': 'dashboard-0.0.0',
          },
          body: JSON.stringify({ path, args }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`API call to ${path} failed: ${response.status} - ${errorText}`);
        }
        return response.json();
      };

      try {
        await callApi('_system/frontend/addDocument', {
          table: args.tableName,
          documents: [document],
          componentId: args.componentId ?? null,
        });
      } catch (e) {
        // Fallback
        await callApi('panel:addDocument', {
          table: args.tableName,
          documents: [document],
        });
      }
    }

    return { success: true, tableName: args.tableName, columns: args.columns };
  },
});

export const listTables = internalAction({
  args: {
    convexUrl: v.string(),
    accessToken: v.string(),
    componentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const urlObj = new URL(args.convexUrl);
    const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;

    const normalizedToken = args.accessToken.startsWith('Convex ')
      ? args.accessToken
      : `Convex ${args.accessToken}`;

    // Helper to call Convex API
    const callApi = async (path: string, args: any, type: 'query' | 'mutation' = 'mutation') => {
      const endpoint = type === 'query' ? 'api/query' : 'api/mutation';
      const response = await fetch(`${baseUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': normalizedToken,
          'Content-Type': 'application/json',
          'Convex-Client': 'dashboard-0.0.0',
        },
        body: JSON.stringify({ path, args }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`API call to ${path} failed: ${response.status} - ${errorText}`);
      };
      return response.json();
    };

    // 1. Get table mapping (QUERY)
    const mappingResult = await callApi('_system/frontend/getTableMapping', {
      componentId: args.componentId ?? null,
    }, 'query');

    let tableNames: string[] = [];
    let mapping = mappingResult;
    if (mappingResult && typeof mappingResult === 'object' && 'value' in mappingResult) {
      mapping = mappingResult.value;
    }
    if (mapping && typeof mapping === 'object') {
      tableNames = Object.values(mapping) as string[];
      // Filter out system tables
      tableNames = tableNames.filter(name => !name.startsWith('_'));
    }

    // 2. Get size for each table (QUERY)
    const tables = await Promise.all(tableNames.map(async (name) => {
      try {
        const sizeResult = await callApi('_system/frontend/tableSize:default', {
          tableName: name,
          componentId: args.componentId ?? null,
        }, 'query');

        let count = 0;
        if (typeof sizeResult === 'number') count = sizeResult;
        else if (sizeResult && typeof sizeResult === 'object' && 'value' in sizeResult) count = (sizeResult as any).value as number;

        return { name, count };
      } catch (e) {
        return { name, count: 0 };
      }
    }));

    return { success: true, tables };
  },
});

/**
 * Add a new column to an existing table in the Convex deployment
 */
export const addColumn = internalAction({
  args: {
    convexUrl: v.string(),
    accessToken: v.string(),
    tableName: v.string(),
    columnName: v.string(),
    defaultValue: v.optional(v.any()),
    componentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { convexUrl, accessToken, tableName, columnName, defaultValue, componentId } = args;
    const baseUrl = convexUrl.replace(/\/$/, '');
    const normalizedToken = accessToken.startsWith('Convex ')
      ? accessToken
      : `Convex ${accessToken}`;

    // Helper to call Convex API
    const callApi = async (path: string, args: any) => {
      const response = await fetch(`${baseUrl}/api/mutation`, {
        method: 'POST',
        headers: {
          'Authorization': normalizedToken,
          'Content-Type': 'application/json',
          'Convex-Client': 'dashboard-0.0.0',
        },
        body: JSON.stringify({ path, args }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`API call to ${path} failed: ${response.status} - ${errorText}`);
      }
      return response.json();
    };

    // 1. Check for existing documents
    const queryResponse = await fetch(`${baseUrl}/api/query`, {
      method: 'POST',
      headers: {
        'Authorization': normalizedToken,
        'Content-Type': 'application/json',
        'Convex-Client': 'dashboard-0.0.0',
      },
      body: JSON.stringify({
        path: '_system/frontend/paginatedTableDocuments:default',
        args: [{
          table: tableName,
          paginationOpts: { numItems: 5, cursor: null },
          componentId: componentId ?? null,
        }],
      }),
    });

    if (!queryResponse.ok) {
      throw new Error(`Failed to fetch documents: ${queryResponse.status}`);
    }

    const queryResult = (await queryResponse.json()) as any;
    const docs = queryResult.page || [];

    const valueToSet = defaultValue ?? null;
    const fields = { [columnName]: valueToSet };

    if (docs.length > 0) {
      // 2a. Patch existing documents
      const ids = docs.map((d: any) => d._id);
      await callApi('_system/frontend/patchDocumentsFields', {
        table: tableName,
        ids,
        fields,
        componentId: componentId ?? null,
      });
      return { success: true, message: `Added column "${columnName}" to ${docs.length} document(s).`, tableName, columnName };
    } else {
      // 2b. Add a new document with the field
      const document = { [columnName]: valueToSet };
      try {
        await callApi('_system/frontend/addDocument', {
          table: tableName,
          documents: [document],
          componentId: componentId ?? null,
        });
      } catch (e) {
        // Fallback to panel:addDocument if system mutation fails
        await callApi('panel:addDocument', {
          table: tableName,
          documents: [document],
        });
      }
      return { success: true, message: `Added column "${columnName}" by creating a new document.`, tableName, columnName };
    }
  },
});
