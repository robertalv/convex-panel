/**
 * OpenAI Provider Implementation
 */

import type {
  AIProvider,
  AIProviderConfig,
  ErrorContext,
  ErrorAnalysis,
  LogEntry,
  LogSummary,
  SummarizeOptions,
  Deployment,
  Correlation,
  FixSuggestion,
  NaturalLanguageQueryContext,
  NaturalLanguageQueryResult,
} from "./base";

export class OpenAIProvider implements AIProvider {
  private config: AIProviderConfig;
  private baseUrl = "https://api.openai.com/v1";

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  async analyzeError(error: ErrorContext): Promise<ErrorAnalysis> {
    const prompt = this.buildErrorAnalysisPrompt(error);
    const response = await this.callAPI(prompt);
    return this.parseErrorAnalysis(response);
  }

  async summarizeLogs(
    logs: LogEntry[],
    options?: SummarizeOptions
  ): Promise<LogSummary> {
    const prompt = this.buildLogSummaryPrompt(logs, options);
    const response = await this.callAPI(prompt);
    return this.parseLogSummary(response, logs);
  }

  async correlateDeployment(
    error: ErrorContext,
    deployments: Deployment[]
  ): Promise<Correlation> {
    const prompt = this.buildCorrelationPrompt(error, deployments);
    const response = await this.callAPI(prompt);
    return this.parseCorrelation(response, deployments);
  }

  async suggestFix(
    error: ErrorContext,
    analysis: ErrorAnalysis
  ): Promise<FixSuggestion> {
    const prompt = this.buildFixSuggestionPrompt(error, analysis);
    const response = await this.callAPI(prompt);
    return this.parseFixSuggestion(response);
  }

  async convertNaturalLanguageQuery(
    context: NaturalLanguageQueryContext
  ): Promise<NaturalLanguageQueryResult> {
    const prompt = this.buildNaturalLanguageQueryPrompt(context);
    const response = await this.callAPIWithSchema(prompt);
    return this.parseNaturalLanguageQuery(response);
  }

  /**
   * Check if the model supports JSON mode
   * JSON mode is supported on models released after November 6, 2023
   */
  private supportsJsonMode(model: string): boolean {
    const normalizedModel = model.toLowerCase().trim();
    
    // Models that support JSON mode
    // GPT-4o series (all support JSON mode)
    if (normalizedModel.startsWith("gpt-4o")) {
      return true;
    }
    
    // GPT-4 Turbo series
    if (normalizedModel.includes("gpt-4-turbo") || normalizedModel.includes("gpt-4-1106") || 
        normalizedModel.includes("gpt-4-0125") || normalizedModel.includes("gpt-4-turbo-preview")) {
      return true;
    }
    
    // GPT-3.5 Turbo with version numbers (1106 and later)
    if (normalizedModel.includes("gpt-3.5-turbo-1106") || normalizedModel.includes("gpt-3.5-turbo-0125")) {
      return true;
    }
    
    // Models with date suffixes (newer models)
    if (/gpt-(4|3\.5-turbo)-\d{4}-\d{2}-\d{2}/.test(normalizedModel)) {
      return true;
    }
    
    // Default: older models like "gpt-4" or "gpt-3.5-turbo" without version don't support JSON mode
    return false;
  }

  private async callAPI(prompt: string): Promise<string> {
    // Ensure API key is trimmed and valid
    const apiKey = this.config.apiKey.trim();
    if (!apiKey || !apiKey.startsWith("sk-")) {
      throw new Error("Invalid OpenAI API key format");
    }

    const supportsJson = this.supportsJsonMode(this.config.model);
    
    // Build request body
    const requestBody: any = {
      model: this.config.model,
      messages: [
        {
          role: "system",
          content: supportsJson
            ? "You are an expert software engineer analyzing logs and errors. Provide detailed, actionable insights in JSON format."
            : "You are an expert software engineer analyzing logs and errors. Provide detailed, actionable insights in valid JSON format only. Your response must be valid JSON, no additional text before or after.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: this.config.temperature ?? 0.7,
      max_tokens: this.config.maxTokens ?? 2000,
    };

    // Only include response_format for models that support it
    if (supportsJson) {
      requestBody.response_format = { type: "json_object" };
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return (data as any).choices[0]?.message?.content || "";
  }

  /**
   * Extract JSON from response text
   * Handles cases where the model returns text with JSON embedded
   */
  private extractJson(text: string): any {
    // Try to parse as-is first
    try {
      return JSON.parse(text);
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch {
          // Fall through
        }
      }
      
      // Try to find JSON object in the text
      const braceMatch = text.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        try {
          return JSON.parse(braceMatch[0]);
        } catch {
          // Fall through
        }
      }
      
      throw new Error("Failed to extract JSON from response");
    }
  }

  private buildErrorAnalysisPrompt(error: ErrorContext): string {
    return `Analyze this error and provide a root cause analysis in JSON format:

Error Message: ${error.errorMessage}
${error.functionPath ? `Function: ${error.functionPath}` : ""}
${error.stackTrace ? `Stack Trace:\n${error.stackTrace}` : ""}
${error.logLines ? `Recent Logs:\n${error.logLines.join("\n")}` : ""}

Provide a JSON response with:
{
  "rootCause": "detailed explanation of the root cause",
  "confidence": 0.0-1.0,
  "severity": "low|medium|high|critical",
  "suggestions": ["suggestion1", "suggestion2", ...],
  "relatedIssues": ["related issue 1", ...]
}`;
  }

  private buildLogSummaryPrompt(
    logs: LogEntry[],
    options?: SummarizeOptions
  ): string {
    const logText = logs
      .map(
        (log) =>
          `[${new Date(log.timestamp).toISOString()}] ${log.logLevel || "INFO"} ${
            log.functionPath || ""
          }: ${log.message}${log.errorMessage ? ` ERROR: ${log.errorMessage}` : ""}`
      )
      .join("\n");

    return `Summarize these logs in JSON format:

${logText}

Time Window: ${options?.timeWindow ? `${new Date(options.timeWindow.start).toISOString()} to ${new Date(options.timeWindow.end).toISOString()}` : "Not specified"}

Provide a JSON response with:
{
  "summary": "comprehensive summary of the logs",
  "keyEvents": ["event1", "event2", ...],
  "patterns": ["pattern1", "pattern2", ...]
}`;
  }

  private buildCorrelationPrompt(
    error: ErrorContext,
    deployments: Deployment[]
  ): string {
    const deploymentInfo = deployments
      .map(
        (d) =>
          `- ${d.deploymentId} at ${new Date(d.deploymentTime).toISOString()}${d.description ? `: ${d.description}` : ""}`
      )
      .join("\n");

    return `Correlate this error with recent deployments in JSON format:

Error: ${error.errorMessage}
Error Time: ${new Date(error.timestamp).toISOString()}
${error.functionPath ? `Function: ${error.functionPath}` : ""}

Recent Deployments:
${deploymentInfo}

Provide a JSON response with:
{
  "deploymentId": "most likely deployment ID",
  "correlationScore": 0.0-1.0,
  "affectedFunctions": ["function1", ...],
  "reasoning": "explanation of correlation"
}`;
  }

  private buildFixSuggestionPrompt(
    error: ErrorContext,
    analysis: ErrorAnalysis
  ): string {
    return `Suggest a fix for this error in JSON format:

Error: ${error.errorMessage}
${error.functionPath ? `Function: ${error.functionPath}` : ""}
Root Cause: ${analysis.rootCause}

Provide a JSON response with:
{
  "suggestion": "detailed fix suggestion",
  "codeExample": "example code fix (if applicable)",
  "documentationLinks": ["url1", ...],
  "confidence": 0.0-1.0
}`;
  }

  private parseErrorAnalysis(response: string): ErrorAnalysis {
    try {
      const parsed = this.extractJson(response);
      return {
        rootCause: parsed.rootCause || "Unable to determine root cause",
        confidence: Math.max(0, Math.min(1, parsed.confidence ?? 0.5)),
        severity: parsed.severity || "medium",
        suggestions: Array.isArray(parsed.suggestions)
          ? parsed.suggestions
          : [],
        relatedIssues: Array.isArray(parsed.relatedIssues)
          ? parsed.relatedIssues
          : [],
      };
    } catch (e) {
      throw new Error(`Failed to parse error analysis: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  private parseLogSummary(
    response: string,
    logs: LogEntry[]
  ): LogSummary {
    try {
      const parsed = this.extractJson(response);
      const errorCount = logs.filter((l) => l.errorMessage || l.logLevel === "ERROR").length;
      const functions = new Set(logs.map((l) => l.functionPath).filter(Boolean));

      return {
        summary: parsed.summary || "No summary available",
        keyEvents: Array.isArray(parsed.keyEvents) ? parsed.keyEvents : [],
        errorCount,
        functionCount: functions.size,
        affectedFunctions: Array.from(functions) as string[],
        patterns: Array.isArray(parsed.patterns) ? parsed.patterns : [],
      };
    } catch (e) {
      throw new Error(`Failed to parse log summary: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  private parseCorrelation(
    response: string,
    deployments: Deployment[]
  ): Correlation {
    try {
      const parsed = this.extractJson(response);
      const deploymentId = parsed.deploymentId || deployments[0]?.deploymentId || "";

      return {
        deploymentId,
        correlationScore: Math.max(0, Math.min(1, parsed.correlationScore ?? 0.5)),
        affectedFunctions: Array.isArray(parsed.affectedFunctions)
          ? parsed.affectedFunctions
          : [],
        reasoning: parsed.reasoning || "No reasoning provided",
      };
    } catch (e) {
      throw new Error(`Failed to parse correlation: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  private parseFixSuggestion(response: string): FixSuggestion {
    try {
      const parsed = this.extractJson(response);
      return {
        suggestion: parsed.suggestion || "No suggestion available",
        codeExample: parsed.codeExample,
        documentationLinks: Array.isArray(parsed.documentationLinks)
          ? parsed.documentationLinks
          : [],
        confidence: Math.max(0, Math.min(1, parsed.confidence ?? 0.5)),
      };
    } catch (e) {
      throw new Error(`Failed to parse fix suggestion: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  /**
   * Call API with JSON schema for structured output
   */
  private async callAPIWithSchema(prompt: string): Promise<string> {
    const apiKey = this.config.apiKey.trim();
    if (!apiKey || !apiKey.startsWith("sk-")) {
      throw new Error("Invalid OpenAI API key format");
    }

    const supportsJson = this.supportsJsonMode(this.config.model);
    
    const requestBody: any = {
      model: this.config.model,
      messages: [
        {
          role: "system",
          content: supportsJson
            ? "You are an expert at converting natural language queries into structured database query parameters. Always respond with valid JSON."
            : "You are an expert at converting natural language queries into structured database query parameters. Your response must be valid JSON only, no additional text before or after.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: this.config.temperature ?? 0.2, // Lower temperature for faster, more consistent structured output
      max_tokens: this.config.maxTokens ?? 1000, // Reduced since we're getting structured output
    };

    if (supportsJson) {
      requestBody.response_format = { type: "json_object" };
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return (data as any).choices[0]?.message?.content || "";
  }

  private buildNaturalLanguageQueryPrompt(
    context: NaturalLanguageQueryContext
  ): string {
    const fieldsInfo = context.fields
      .map((f) => `  - ${f.fieldName} (${f.type}${f.optional ? ", optional" : ""})`)
      .join("\n");

    const sampleDocs = context.sampleDocuments
      ? `\n\nSample documents (for reference - use EXACT case and values from these examples):\n${JSON.stringify(context.sampleDocuments.slice(0, 5), null, 2)}\n\nCRITICAL: When matching string values, use the EXACT case as shown in the sample documents above. For example, if samples show "Chores" (capital C), use "Chores" not "chores".`
      : "";

    const currentYear = new Date().getFullYear();
    const currentDate = new Date();
    const currentTimestamp = Math.floor(currentDate.getTime() / 1000);

    return `Convert this natural language query into structured database query parameters for the "${context.tableName}" table.

User Query: "${context.query}"

Available fields in the table:
${fieldsInfo}${sampleDocs}

IMPORTANT DATE HANDLING:
- Current date: ${currentDate.toISOString().split('T')[0]} (Year: ${currentYear})
- Current timestamp (milliseconds): ${Date.now()}
- When a date is mentioned without a year (e.g., "December 5th", "Dec 5"), assume the CURRENT YEAR (${currentYear}) unless the context clearly indicates otherwise
- For _creationTime field, use Unix timestamps in MILLISECONDS (not seconds). Multiply seconds by 1000 to get milliseconds.
- Example: December 5, ${currentYear} 00:00:00 UTC = ${Math.floor(new Date(currentYear, 11, 5).getTime())} milliseconds
- When calculating date ranges, use the current date as reference

Convert the query into filters, sort configuration, and limit. Use these operators:
- "eq" for equals, "neq" for not equals
- "gt" for greater than, "gte" for greater than or equal
- "lt" for less than, "lte" for less than or equal
- "contains" for string contains, "not_contains" for string does not contain
- "starts_with" for string starts with, "ends_with" for string ends with

For sorting, use "asc" for ascending or "desc" for descending.

Return a JSON object with this structure:
{
  "filters": [
    {
      "field": "fieldName",
      "op": "eq",
      "value": "value"
    }
  ],
  "sortConfig": {
    "field": "fieldName",
    "direction": "asc"
  } or null,
  "limit": number or null
}

Examples:
- "Show me the last 50 sign ups from Texas" → filters: [{"field": "state", "op": "eq", "value": "Texas"}], sortConfig: {"field": "_creationTime", "direction": "desc"}, limit: 50
- "Users created in the last week" → filters: [{"field": "_creationTime", "op": "gte", "value": ${Date.now() - 604800000}}], sortConfig: null, limit: null
- "Entries from December 5th" → filters: [{"field": "_creationTime", "op": "gte", "value": ${Math.floor(new Date(currentYear, 11, 5).getTime())}}, {"field": "_creationTime", "op": "lt", "value": ${Math.floor(new Date(currentYear, 11, 6).getTime())}}], sortConfig: null, limit: null
- "All active users sorted by name" → filters: [{"field": "status", "op": "eq", "value": "active"}], sortConfig: {"field": "name", "direction": "asc"}, limit: null

STRING VALUE MATCHING:
- ALWAYS check the sample documents above to see the exact case of string values
- If the user says "chores" but samples show "Chores", use "Chores" (the exact case from samples)
- String equality is case-sensitive, so matching the exact case is critical
- If no samples are provided, preserve the case from the user's query but be aware it may not match

Now convert the user query:`;
  }

  private parseNaturalLanguageQuery(
    response: string
  ): NaturalLanguageQueryResult {
    try {
      const parsed = this.extractJson(response);
      
      // Validate and normalize filters
      const filters = Array.isArray(parsed.filters)
        ? parsed.filters.map((f: any) => ({
            field: String(f.field || ""),
            op: String(f.op || "eq"),
            value: f.value,
          }))
        : [];

      // Validate and normalize sort config
      const sortConfig: NaturalLanguageQueryResult["sortConfig"] = parsed.sortConfig && typeof parsed.sortConfig === "object"
        ? {
            field: String(parsed.sortConfig.field || ""),
            direction: parsed.sortConfig.direction === "desc" ? ("desc" as const) : ("asc" as const),
          }
        : null;

      // Validate limit
      const limit =
        typeof parsed.limit === "number" && parsed.limit > 0
          ? parsed.limit
          : null;

      return {
        filters,
        sortConfig,
        limit,
      };
    } catch (e) {
      throw new Error(
        `Failed to parse natural language query: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }
}
