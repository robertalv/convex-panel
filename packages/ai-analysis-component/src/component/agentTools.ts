/**
 * Agent Tools
 * Tools that the Agent can call to interact with Convex data
 */

import { createTool, type ToolCtx } from "@convex-dev/agent";
import { z } from "zod/v3";
import { internal } from "./_generated/api";
import type { AgentContext } from "./agent";

/**
 * Create tools for the agent
 */
export function createTools(
  ctx: any,
  context?: AgentContext
): Record<string, any> {
  return {
    // fetchLogs: createTool({
    //   description:
    //     "Fetch and filter logs from the Convex deployment. Use this when the user asks about logs, errors, failures, or function execution history.",
    //   args: z.object({
    //     logTypes: z
    //       .array(z.string())
    //       .optional()
    //       .describe("Types of logs to fetch: 'error', 'failure', 'success', 'warning', 'debug', 'info'"),
    //     limit: z
    //       .number()
    //       .optional()
    //       .describe("Maximum number of logs to return (default: 10, max: 50)"),
    //     timeWindow: z
    //       .string()
    //       .optional()
    //       .describe("Time window in natural language (e.g., 'last hour', 'last 15 minutes', 'last day')"),
    //     searchQuery: z
    //       .string()
    //       .optional()
    //       .describe("Search query to filter logs by message content"),
    //     functionIds: z
    //       .array(z.string())
    //       .optional()
    //       .describe("Filter logs by specific function IDs/paths"),
    //   }),
    //   handler: async (toolCtx: ToolCtx, args) => {
    //     if (!context?.convexUrl || !context?.accessToken) {
    //       throw new Error("Convex deployment URL and access token are required");
    //     }

    //     // Call internal action to fetch logs
    //     const result = await toolCtx.runAction(internal.agentActions.fetchLogs, {
    //       convexUrl: context.convexUrl,
    //       accessToken: context.accessToken,
    //       filters: {
    //         logTypes: args.logTypes || [],
    //         searchQuery: args.searchQuery || "",
    //         functionIds: args.functionIds || [],
    //         componentIds: context.componentId ? [context.componentId] : [],
    //       },
    //       limit: Math.min(args.limit || 10, 50),
    //       timeWindow: args.timeWindow,
    //     });

    //     return result as any;
    //   },
    // }) as any,

    fetchMetrics: createTool({
      description:
        "Fetch function execution metrics and statistics. Use this when the user asks about performance, failure rates, or function statistics.",
      args: z.object({
        timeWindow: z
          .string()
          .optional()
          .describe("Time window in natural language (e.g., 'last 30 minutes', 'last hour')"),
        functionFilter: z
          .string()
          .optional()
          .describe("Filter metrics by specific function name or path"),
      }),
      handler: async (toolCtx: ToolCtx, args) => {
        if (!context?.convexUrl || !context?.accessToken) {
          throw new Error("Convex deployment URL and access token are required");
        }

        // Call internal action to fetch metrics
        const result = await toolCtx.runAction(internal.agentActions.fetchMetrics, {
          convexUrl: context.convexUrl,
          accessToken: context.accessToken,
          timeWindow: args.timeWindow || "30 minutes",
          functionFilter: args.functionFilter,
        });

        return result as any;
      },
    }) as any,

    filterData: createTool({
      description:
        "Filter and query data from Convex tables. IMPORTANT: Always pass the user's natural language request as the 'query' parameter - DO NOT try to create filters yourself. The backend has the actual table schema and will convert the query to correct filters using real field names and types.",
      args: z.object({
        query: z
          .string()
          .describe("REQUIRED: The user's natural language filter request. Pass this instead of creating filters manually."),
        tableName: z.string().describe("Name of the table to query"),
        filters: z
          .array(
            z.object({
              field: z.string(),
              op: z.enum([
                "eq",
                "neq",
                "gt",
                "gte",
                "lt",
                "lte",
                "contains",
                "not_contains",
                "starts_with",
                "ends_with",
              ]),
              value: z.any(),
            })
          )
          .optional()
          .describe("Filters to apply to the table"),
        sortConfig: z
          .object({
            field: z.string(),
            direction: z.enum(["asc", "desc"]),
          })
          .optional()
          .describe("Sort configuration"),
        limit: z
          .number()
          .optional()
          .describe("Maximum number of results to return"),
      }),
      handler: async (toolCtx: ToolCtx, args) => {
        if (!context?.convexUrl || !context?.accessToken) {
          throw new Error("Convex deployment URL and access token are required");
        }

        const tableNameArg = context?.tableName || args.tableName;
        if (!tableNameArg) {
          throw new Error("Table name is required for filterData");
        }

        // Call internal action to filter data
        const result = await toolCtx.runAction(internal.agentActions.filterData, {
          convexUrl: context.convexUrl,
          accessToken: context.accessToken,
          componentId: context.componentId,
          query: args.query,
          tableName: tableNameArg,
          filters: args.filters,
          sortConfig: args.sortConfig,
          limit: args.limit,
        });

        return result as any;
      },
    }) as any,

    createChartFromTable: createTool({
      description:
        "REQUIRED for chart/visualization requests. Create a chart by querying a table and counting/aggregating by a field. Use when user asks to 'chart', 'graph', 'visualize', or 'plot' data.",
      args: z.object({
        tableName: z.string().optional().describe("Name of the table to query (uses current table from context if not specified)"),
        groupByField: z.string().describe("Field to group/count by (e.g., 'category', 'status', 'done')"),
        chartType: z.enum([
          'bar', 'line', 'area', 'pie', 'doughnut', 'scatter', 'radar', 'radialbar', 'treemap', 'funnel'
        ]).optional().describe("Type of chart to generate. Default is 'bar'."),
        title: z.string().optional().describe("Chart title (auto-generated if not provided)"),
        countField: z.string().optional().describe("Optional: field to count. Default counts documents."),
      }),
      handler: async (toolCtx: ToolCtx, args) => {
        if (!context?.convexUrl || !context?.accessToken) {
          throw new Error("Convex deployment URL and access token are required");
        }

        // Prefer context tableName (current UI selection) over model guess
        const tableName = context?.tableName || args.tableName;
        if (!tableName) {
          throw new Error("Table name is required for createChartFromTable");
        }

        // Fetch data from the table
        const result = await toolCtx.runAction(internal.agentActions.filterData, {
          convexUrl: context.convexUrl,
          accessToken: context.accessToken,
          componentId: context.componentId,
          tableName: tableName,
          limit: 1000, // Get enough data for charting
        });

        const rows = (result as any)?.rows || [];

        // Aggregate by the groupByField
        const counts: Record<string, number> = {};
        for (const row of rows) {
          const key = String(row[args.groupByField] ?? 'Unknown');
          counts[key] = (counts[key] || 0) + 1;
        }

        // Convert to chart data format
        const chartData = Object.entries(counts)
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value); // Sort by value descending

        return {
          type: 'chart',
          title: args.title || `${tableName} by ${args.groupByField}`,
          data: chartData,
          chartType: args.chartType || 'bar',
          description: `Showing ${rows.length} items grouped by ${args.groupByField}`,
        };
      },
    }) as any,


    analyzeData: createTool({
      description:
        "Analyze data from a table and provide insights without fetching new data. Use this when the user asks analytical questions about data they've already viewed (e.g., 'what's the time range?', 'how many are there?', 'summarize this data'). Do NOT use this for fetching or filtering new data.",
      args: z.object({
        analysisType: z.enum([
          'count',
          'summarize',
          'timeRange',
          'categorize',
          'compare'
        ]).describe("Type of analysis to perform"),
        tableName: z.string().describe("Table to analyze"),
        field: z.string().optional().describe("Specific field to focus analysis on"),
      }),
      handler: async (toolCtx: ToolCtx, args) => {
        // This tool is lightweight - it just returns a structured object that the
        // agent uses to guide its response generation based on context it already has
        // or will have after this tool call.

        return {
          type: 'analysis',
          analysisType: args.analysisType,
          tableName: args.tableName,
          field: args.field,
          message: `Analysis request for ${args.tableName} (${args.analysisType}) processed. Use the data you see to answer the user's question.`
        };
      },
    }) as any,

    createTable: createTool({
      description: "Create a new table. Optionally specify columns to initialize it.",
      args: z.object({
        tableName: z.string(),
        columns: z.array(z.object({
          name: z.string(),
          defaultValue: z.any().optional(),
        })).optional(),
      }),
      handler: async (toolCtx: ToolCtx, args) => {
        if (!context?.convexUrl || !context?.accessToken) {
          throw new Error("Convex deployment URL and access token are required");
        }

        const result = await toolCtx.runAction(internal.agentActions.createTable, {
          convexUrl: context.convexUrl,
          accessToken: context.accessToken,
          tableName: args.tableName,
          columns: args.columns,
          componentId: context.componentId ?? undefined,
        });

        return {
          type: 'action',
          action: 'createTable',
          tableName: args.tableName,
          columns: args.columns,
          result,
        };
      },
    }) as any,

    listTables: createTool({
      description: "List all tables in the Convex deployment with their row counts. Use this when the user asks 'how many tables', 'list tables', 'show tables', or 'what tables do we have'.",
      args: z.object({}),
      handler: async (toolCtx: ToolCtx, args) => {
        if (!context?.convexUrl || !context?.accessToken) {
          throw new Error("Convex deployment URL and access token are required");
        }

        const result = await toolCtx.runAction(internal.agentActions.listTables, {
          convexUrl: context.convexUrl,
          accessToken: context.accessToken,
          componentId: context.componentId ?? undefined,
        });

        return {
          type: 'action',
          action: 'listTables',
          result,
        };
      },
    }) as any,

    addColumn: createTool({
      description: "Add a new column (field) to a table. Use when user asks to 'add column', 'create field', 'add field'.",
      args: z.object({
        tableName: z.string(),
        columnName: z.string(),
        defaultValue: z.any().optional(),
      }),
      handler: async (toolCtx: ToolCtx, args) => {
        if (!context?.convexUrl || !context?.accessToken) {
          throw new Error("Convex deployment URL and access token are required");
        }

        const result = await toolCtx.runAction(internal.agentActions.addColumn, {
          convexUrl: context.convexUrl,
          accessToken: context.accessToken,
          tableName: args.tableName,
          columnName: args.columnName,
          defaultValue: args.defaultValue,
          componentId: context.componentId ?? undefined,
        });

        return {
          type: 'action',
          action: 'addColumn',
          tableName: args.tableName,
          columnName: args.columnName,
          result,
        };
      },
    }) as any,
  };
}

