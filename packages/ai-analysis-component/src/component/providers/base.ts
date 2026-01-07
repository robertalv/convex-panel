/**
 * Base AI Provider Interface
 * All AI providers must implement this interface
 */

export interface ErrorContext {
  errorMessage: string;
  functionPath?: string;
  timestamp: number;
  stackTrace?: string;
  logLines?: string[];
  deploymentId?: string;
}

export interface ErrorAnalysis {
  rootCause: string;
  confidence: number; // 0-1
  severity: "low" | "medium" | "high" | "critical";
  suggestions: string[];
  relatedIssues?: string[];
}

export interface LogEntry {
  timestamp: number;
  message: string;
  functionPath?: string;
  logLevel?: string;
  errorMessage?: string;
}

export interface SummarizeOptions {
  timeWindow?: {
    start: number;
    end: number;
  };
  groupByFunction?: boolean;
  includePatterns?: boolean;
}

export interface LogSummary {
  summary: string;
  keyEvents: string[];
  errorCount: number;
  functionCount: number;
  affectedFunctions: string[];
  patterns?: string[];
}

export interface Deployment {
  deploymentId: string;
  deploymentTime: number;
  commitHash?: string;
  description?: string;
}

export interface Correlation {
  deploymentId: string;
  correlationScore: number; // 0-1
  affectedFunctions: string[];
  reasoning: string;
}

export interface FixSuggestion {
  suggestion: string;
  codeExample?: string;
  documentationLinks?: string[];
  confidence: number; // 0-1
}

export interface TableFieldInfo {
  fieldName: string;
  type: string;
  optional?: boolean;
}

export interface NaturalLanguageQueryContext {
  query: string;
  tableName: string;
  fields: TableFieldInfo[];
  sampleDocuments?: Array<Record<string, any>>;
}

export interface NaturalLanguageQueryResult {
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

export interface AIProviderConfig {
  provider: "openai" | "anthropic";
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIProvider {
  /**
   * Analyze an error and provide root cause analysis
   */
  analyzeError(error: ErrorContext): Promise<ErrorAnalysis>;

  /**
   * Summarize a collection of logs
   */
  summarizeLogs(logs: LogEntry[], options?: SummarizeOptions): Promise<LogSummary>;

  /**
   * Correlate an error with recent deployments
   */
  correlateDeployment(
    error: ErrorContext,
    deployments: Deployment[]
  ): Promise<Correlation>;

  /**
   * Suggest fixes for an error based on analysis
   */
  suggestFix(error: ErrorContext, analysis: ErrorAnalysis): Promise<FixSuggestion>;

  /**
   * Convert natural language query to structured query parameters
   */
  convertNaturalLanguageQuery(
    context: NaturalLanguageQueryContext
  ): Promise<NaturalLanguageQueryResult>;
}
