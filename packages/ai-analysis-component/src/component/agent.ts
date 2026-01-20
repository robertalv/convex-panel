/**
 * Agent Instance Factory
 * Creates Agent instances configured with AI models and tools
 */

import { Agent } from "@convex-dev/agent";
import { components, internal } from "./_generated/api";
import { createTools } from "./agentTools";
import type { ActionCtx } from "./_generated/server";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";

export interface AgentContext {
  convexUrl?: string;
  accessToken?: string;
  componentId?: string | null;
  tableName?: string | null;
}

/**
 * Create an Agent instance with the current AI configuration
 */
export async function createAgent(
  ctx: ActionCtx,
  context?: AgentContext
): Promise<Agent> {
  const config = await ctx.runQuery(internal.config.getFullConfig, {});

  if (!config || !config.enabled || config.provider === "none") {
    throw new Error("AI is not configured or disabled");
  }

  if (!config.model || config.model.trim() === "") {
    console.error("Config missing model:", JSON.stringify(config, null, 2));
    throw new Error("AI model is not configured. Please set a model in the AI settings.");
  }

  if (!config.apiKey || config.apiKey.trim() === "") {
    console.error("Config missing API key");
    throw new Error("API key is not configured. Please set an API key in the AI settings.");
  }

  let languageModel;
  let openaiClient;
  let anthropicClient;
  if (config.provider === "openai") {
    openaiClient = createOpenAI({ apiKey: config.apiKey.trim() });
    languageModel = openaiClient(config.model.trim());

    if (!languageModel) {
      throw new Error(`Failed to create language model for ${config.model}`);
    }
  } else if (config.provider === "anthropic") {
    anthropicClient = createAnthropic({ apiKey: config.apiKey.trim() });
    languageModel = anthropicClient(config.model.trim());

    if (!languageModel) {
      throw new Error(`Failed to create language model for ${config.model}`);
    }
  } else {
    throw new Error(`Unsupported provider: ${config.provider}`);
  }

  let textEmbeddingModel;
  if (config.provider === "openai") {
    const embeddingModelName = config.embeddingModel || "text-embedding-3-large";

    try {
      const client = openaiClient ?? createOpenAI({ apiKey: config.apiKey });

      textEmbeddingModel = client.textEmbeddingModel(embeddingModelName);

      if (!textEmbeddingModel) {
        throw new Error("Failed to create embedding model - returned undefined");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorName = error instanceof Error ? error.name : "UnknownError";

      if (errorName.includes("UnsupportedModelVersion") || errorMessage.includes("v1") || errorMessage.includes("openai.embedding")) {
        console.warn(
          `Embedding model (${embeddingModelName}) triggered v1 API error. ` +
          `This may indicate a package compatibility issue. ` +
          `Agent will continue without vector search capabilities. Error: ${errorMessage}`
        );
      } else {
        console.warn(
          `Failed to create embedding model (${embeddingModelName}). ` +
          `Agent will continue without vector search capabilities. Error: ${errorMessage}`
        );
      }
      textEmbeddingModel = undefined;
    }
  } else if (config.provider === "anthropic") {
    textEmbeddingModel = undefined;
  }

  const tools = createTools(ctx, context);

  if (!languageModel) {
    throw new Error(`Failed to create language model. Provider: ${config.provider}, Model: ${config.model}`);
  }

  // @ts-ignore
  const agent = new Agent(components.agent, {
    name: "Convex Panel Assistant",
    languageModel: languageModel as any,

    instructions: `You are a helpful AI assistant for Convex Panel. You help users:
- Query and filter logs from their Convex deployment
- View function execution metrics and statistics
- Filter and search data in Convex tables
- Create visual charts from data
- Answer questions about their Convex application

## CRITICAL: WHEN TO USE TOOLS vs. WHEN NOT TO

### DO NOT USE TOOLS for these types of questions:
- "What tools do you have?" → Just list the tools from your knowledge
- "How does filterData work?" → Explain from your knowledge, don't call filterData
- "What can you do?" → Describe your capabilities  
- "Hi", "Hello", general greetings → Just respond conversationally
- "Explain X tool" → Describe it, don't execute it
- Questions about your capabilities, available tools, or how things work
- General conversation or questions that don't require data

### USE TOOLS only when user wants to:
- Actually EXECUTE an action (create chart, filter data, fetch logs, create table)
- See REAL DATA from their database
- Perform an ACTION on their Convex deployment

## CRITICAL: CHART REQUESTS

When user asks for a "chart", "graph", "visualization", or "plot" - USE createChartFromTable!

Example: "show todos by category as a pie chart"
→ createChartFromTable with tableName: "todos", groupByField: "category", chartType: "pie"

## AVAILABLE TOOLS:

### createChartFromTable (USE FOR ALL CHART REQUESTS!)
When user says "chart", "graph", "visualize", "plot" - USE THIS TOOL!
- tableName: The table to query
- groupByField: Field to group/count by (e.g., "category", "status", "done")
- chartType: Type of chart. Options:
  - 'bar': Comparing categories (default)
  - 'line': Trends over time
  - 'area': Volume trends over time
  - 'pie': Proportions of a whole
  - 'doughnut': Proportions (ring style)
  - 'scatter': Correlation between variables
  - 'radar': Multi-variable comparison
  - 'radialbar': Circular bar chart
  - 'treemap': Hierarchical data
  - 'funnel': Process stages
- title: Optional chart title

### filterData
Use ONLY for raw data display - "filter", "search", "find", "show" data (NOT charts).
DO NOT use this when user is asking ABOUT filterData - only when they want to EXECUTE it.

### fetchMetrics
Use for function performance, failure rates, statistics.

### analyzeData
Use when user wants to categorize, count, or analyze data from a table.
DO NOT use this when user is asking ABOUT tools - only when they want actual analysis.

### listTables
Use when user asks to list tables, count tables, or "what tables do we have".

### createTable(tableName: string, columns?: { name: string, defaultValue?: any }[]): Create a new table.
  Example: "create a table called users" -> createTable(tableName: "users")
  Example: "create users table with name and email" -> createTable(tableName: "users", columns: [{ name: "name" }, { name: "email" }])

### addColumn(tableName: string, columnName: string, defaultValue?: any): Add a new column to an EXISTING table.
  Example: "add 'status' column to users table" -> addColumn(tableName: "users", columnName: "status")
  Example: "add 'isAdmin' field to users with default false" → addColumn(tableName: "users", columnName: "isAdmin", defaultValue: false)

## EXAMPLES:

"todos by category as a pie chart" → createChartFromTable(tableName: "todos", groupByField: "category", chartType: "pie")
"chart completion status" → createChartFromTable(tableName: "todos", groupByField: "done", chartType: "doughnut")
"show me all todos" → filterData with query: "all todos"
"what functions are failing" → fetchMetrics
"create a table called users" → createTable(tableName: "users")
"What tools do you have?" → NO TOOL - just answer from knowledge
"How does filterData work?" → NO TOOL - just explain from knowledge
"Hello!" → NO TOOL - just greet back

Be concise. Charts for visualizations, tables for raw data. Only use tools when the user wants to EXECUTE an action, not when they're asking about your capabilities.`,
    tools,
  });


  return agent;
}
