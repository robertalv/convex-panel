/**
 * AI Analysis API Utilities
 * Functions to call AI analysis component functions from the frontend
 */

import type { LogEntry } from "../../types/logs";

export interface AIConfig {
  provider: "openai" | "anthropic" | "none";
  model: string;
  embeddingModel?: string;
  temperature?: number;
  maxTokens?: number;
  enabled: boolean;
  automaticAnalysis: boolean;
  updatedAt: number;
}

export interface ErrorAnalysis {
  errorId: string;
  errorMessage?: string;
  functionPath?: string;
  timestamp?: number;
  rootCause: string;
  confidence: number;
  severity: "low" | "medium" | "high" | "critical";
  suggestions: string[];
  relatedIssues?: string[];
  deploymentId?: string;
}

export interface LogSummary {
  summary: string;
  keyEvents: string[];
  errorCount: number;
  functionCount: number;
  affectedFunctions: string[];
  patterns?: string[];
}

export interface DeploymentCorrelation {
  deploymentId: string;
  correlationScore: number;
  affectedFunctions: string[];
  reasoning: string;
}

export interface AgentTool {
  name: string;
  description: string;
}

export interface FixSuggestion {
  suggestion: string;
  codeExample?: string;
  documentationLinks: string[];
  confidence: number;
}

/**
 * Check if AI is available (configured and enabled)
 * This check should be used for ALL AI features (chat, error analysis, etc.)
 */
export async function isAIAvailable(adminClient: any): Promise<boolean> {
  if (!adminClient) {
    return false;
  }

  try {
    const config = await getAIConfig(adminClient);
    return config !== null && config.provider !== "none" && config.enabled === true;
  } catch (error) {
    console.error("Failed to check AI availability:", error);
    return false;
  }
}

/**
 * Get AI configuration
 */
export async function getAIConfig(
  adminClient: any
): Promise<AIConfig | null> {
  if (!adminClient) {
    throw new Error("Admin client is required");
  }

  try {
    return await adminClient.query("aiAnalysis:getAIConfig", {});
  } catch (error) {
    console.error("Failed to get AI config:", error);
    return null;
  }
}

/**
 * Set AI configuration
 */
export async function setAIConfig(
  adminClient: any,
  config: {
    provider: "openai" | "anthropic" | "none";
    apiKey: string;
    model: string;
    embeddingModel?: string;
    temperature?: number;
    maxTokens?: number;
    enabled: boolean;
    automaticAnalysis: boolean;
  }
): Promise<void> {
  if (!adminClient) {
    throw new Error("Admin client is required");
  }

  try {
    await adminClient.mutation("aiAnalysis:setAIConfig", config);
  } catch (error) {
    console.error("Failed to set AI config:", error);
    throw error;
  }
}

/**
 * Test AI provider connection
 */
export async function testAIConnection(
  adminClient: any,
  provider: "openai" | "anthropic",
  apiKey: string,
  model: string
): Promise<{ success: boolean; error?: string }> {
  if (!adminClient) {
    throw new Error("Admin client is required");
  }

  try {
    return await adminClient.action("aiAnalysis:testAIConnection", {
      provider,
      apiKey,
      model,
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * List available Agent tools (metadata only)
 */
export async function listAgentTools(
  adminClient: any
): Promise<AgentTool[]> {
  if (!adminClient) {
    throw new Error("Admin client is required");
  }

  try {
    return await adminClient.query("aiAnalysis:listAgentTools", {});
  } catch (error) {
    console.error("Failed to list agent tools:", error);
    return [];
  }
}

/**
 * Analyze an error
 */
export async function analyzeError(
  adminClient: any,
  error: {
    errorId: string;
    errorMessage: string;
    functionPath?: string;
    timestamp: number;
    stackTrace?: string;
    logLines?: string[];
    deploymentId?: string;
  }
): Promise<ErrorAnalysis> {
  if (!adminClient) {
    throw new Error("Admin client is required");
  }

  try {
    return await adminClient.action("aiAnalysis:analyzeError", error);
  } catch (error) {
    console.error("Failed to analyze error:", error);
    throw error;
  }
}

/**
 * Get error analysis by error ID
 */
export async function getErrorAnalysis(
  adminClient: any,
  errorId: string
): Promise<ErrorAnalysis | null> {
  if (!adminClient) {
    throw new Error("Admin client is required");
  }

  try {
    return await adminClient.query("aiAnalysis:getErrorAnalysis", { errorId });
  } catch (error) {
    console.error("Failed to get error analysis:", error);
    return null;
  }
}

/**
 * Get recent error analyses
 */
export async function getRecentAnalyses(
  adminClient: any,
  options?: {
    limit?: number;
    functionPath?: string;
  }
): Promise<ErrorAnalysis[]> {
  if (!adminClient) {
    throw new Error("Admin client is required");
  }

  try {
    return await adminClient.query("aiAnalysis:getRecentAnalyses", options || {});
  } catch (error) {
    console.error("Failed to get recent analyses:", error);
    return [];
  }
}

/**
 * Summarize logs
 */
export async function summarizeLogs(
  adminClient: any,
  logs: LogEntry[],
  options?: {
    timeWindow?: { start: number; end: number };
    groupByFunction?: boolean;
    includePatterns?: boolean;
  }
): Promise<LogSummary> {
  if (!adminClient) {
    throw new Error("Admin client is required");
  }

  // Convert LogEntry to the format expected by the API
  const logData = logs.map((log) => ({
    timestamp: log.timestamp,
    message: log.message || "",
    functionPath: log.function?.path,
    logLevel: log.log_level,
    errorMessage: log.error_message,
  }));

  try {
    return await adminClient.action("aiAnalysis:summarizeLogs", {
      logs: logData,
      ...options,
    });
  } catch (error) {
    console.error("Failed to summarize logs:", error);
    throw error;
  }
}

/**
 * Get log summary for a time window
 */
export async function getLogSummary(
  adminClient: any,
  timeWindow: { start: number; end: number }
): Promise<LogSummary | null> {
  if (!adminClient) {
    throw new Error("Admin client is required");
  }

  try {
    return await adminClient.query("aiAnalysis:getLogSummary", { timeWindow });
  } catch (error) {
    console.error("Failed to get log summary:", error);
    return null;
  }
}

/**
 * Correlate error with deployments
 */
export async function correlateWithDeployments(
  adminClient: any,
  error: {
    errorId: string;
    errorMessage: string;
    functionPath?: string;
    timestamp: number;
    stackTrace?: string;
    logLines?: string[];
  },
  deployments: Array<{
    deploymentId: string;
    deploymentTime: number;
    commitHash?: string;
    description?: string;
  }>
): Promise<DeploymentCorrelation> {
  if (!adminClient) {
    throw new Error("Admin client is required");
  }

  try {
    return await adminClient.action("aiAnalysis:correlateWithDeployments", {
      ...error,
      deployments,
    });
  } catch (error) {
    console.error("Failed to correlate with deployments:", error);
    throw error;
  }
}

/**
 * Get deployment correlations
 */
export async function getDeploymentCorrelations(
  adminClient: any,
  deploymentId: string
): Promise<DeploymentCorrelation[]> {
  if (!adminClient) {
    throw new Error("Admin client is required");
  }

  try {
    return await adminClient.query("aiAnalysis:getDeploymentCorrelations", {
      deploymentId,
    });
  } catch (error) {
    console.error("Failed to get deployment correlations:", error);
    return [];
  }
}

/**
 * Get recent correlations (all recent correlations)
 */
export async function getRecentCorrelations(
  adminClient: any,
  options?: { limit?: number }
): Promise<DeploymentCorrelation[]> {
  if (!adminClient) {
    throw new Error("Admin client is required");
  }

  try {
    return await adminClient.query("aiAnalysis:getRecentCorrelations", options || {});
  } catch (error) {
    console.error("Failed to get recent correlations:", error);
    return [];
  }
}

/**
 * Suggest a fix for an error
 */
export async function suggestFix(
  adminClient: any,
  error: {
    errorMessage: string;
    functionPath?: string;
    timestamp: number;
    stackTrace?: string;
    logLines?: string[];
    rootCause: string;
    severity: "low" | "medium" | "high" | "critical";
  }
): Promise<FixSuggestion> {
  if (!adminClient) {
    throw new Error("Admin client is required");
  }

  try {
    return await adminClient.action("aiAnalysis:suggestFix", error);
  } catch (error) {
    console.error("Failed to suggest fix:", error);
    throw error;
  }
}

/**
 * Convert natural language query to structured query parameters
 */
export interface NaturalLanguageQueryParams {
  query: string;
  tableName: string;
  fields: Array<{
    fieldName: string;
    type: string;
    optional?: boolean;
  }>;
  sampleDocuments?: Array<Record<string, any>>;
}

export interface NaturalLanguageQueryResponse {
  filters: Array<{
    field: string;
    op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "not_contains" | "starts_with" | "ends_with";
    value: any;
  }>;
  sortConfig: {
    field: string;
    direction: "asc" | "desc";
  } | null;
  limit: number | null;
}

export async function convertNaturalLanguageQuery(
  adminClient: any,
  params: NaturalLanguageQueryParams
): Promise<NaturalLanguageQueryResponse> {
  if (!adminClient) {
    throw new Error("Admin client is required");
  }

  try {
    return await adminClient.action("aiAnalysis:convertNaturalLanguageQuery", params);
  } catch (error) {
    console.error("Failed to convert natural language query:", error);
    throw error;
  }
}

/**
 * Generate AI response using Agent component
 */
export async function generateResponse(
  adminClient: any,
  params: {
    chatId: string;
    prompt: string;
    convexUrl?: string;
    accessToken?: string;
    componentId?: string | null;
    tableName?: string;
  }
): Promise<{ success: boolean; message?: string }> {
  if (!adminClient) {
    throw new Error("Admin client is required");
  }

  try {
    return await adminClient.action("aiAnalysis:generateResponse", params);
  } catch (error) {
    console.error("Failed to generate response:", error);
    throw error;
  }
}

/**
 * Stream AI response using Agent component (delta streaming)
 */
export async function generateResponseStream(
  adminClient: any,
  params: {
    chatId: string;
    prompt: string;
    convexUrl?: string;
    accessToken?: string;
    componentId?: string | null;
    tableName?: string;
  }
): Promise<{ success: boolean; message?: string; threadId?: string }> {
  if (!adminClient) {
    throw new Error("Admin client is required");
  }

  try {
    return await adminClient.action("aiAnalysis:generateResponseStream", params);
  } catch (error) {
    console.error("Failed to stream response:", error);
    throw error;
  }
}

/**
 * List streaming deltas for a chat/thread
 */
export async function listChatStreams(
  adminClient: any,
  params: { chatId: string; streamArgs?: any }
): Promise<any> {
  if (!adminClient) {
    throw new Error("Admin client is required");
  }

  try {
    return await adminClient.query("aiAnalysis:listChatStreams", {
      chatId: params.chatId,
      streamArgs: params.streamArgs || {},
    });
  } catch (error) {
    console.error("Failed to list chat streams:", error);
    throw error;
  }
}
