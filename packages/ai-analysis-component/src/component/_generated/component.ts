/* eslint-disable */
/**
 * Generated `ComponentApi` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";

/**
 * A utility for referencing a Convex component's exposed API.
 *
 * Useful when expecting a parameter like `components.myComponent`.
 * Usage:
 * ```ts
 * async function myFunction(ctx: QueryCtx, component: ComponentApi) {
 *   return ctx.runQuery(component.someFile.someQuery, { ...args });
 * }
 * ```
 */
export type ComponentApi<Name extends string | undefined = string | undefined> =
  {
    analysis: {
      correlation: {
        calculateCorrelationScore: FunctionReference<
          "query",
          "internal",
          {
            deploymentDescription?: string;
            deploymentTime: number;
            errorTimestamp: number;
            functionPath?: string;
          },
          number,
          Name
        >;
        findDeploymentImpact: FunctionReference<
          "action",
          "internal",
          {
            deployments: Array<{
              commitHash?: string;
              deploymentId: string;
              deploymentTime: number;
              description?: string;
            }>;
            errorId: string;
            errorMessage: string;
            functionPath?: string;
            timestamp: number;
          },
          {
            affectedFunctions: Array<string>;
            correlationScore: number;
            deploymentId: string;
            reasoning: string;
          } | null,
          Name
        >;
        getDeploymentCorrelations: FunctionReference<
          "query",
          "internal",
          { deploymentId: string },
          Array<{
            affectedFunctions: Array<string>;
            correlationScore: number;
            deploymentId: string;
            deploymentTime: number;
            errorId: string;
          }>,
          Name
        >;
        getErrorCorrelations: FunctionReference<
          "query",
          "internal",
          { errorId: string },
          Array<{
            affectedFunctions: Array<string>;
            correlationScore: number;
            deploymentId: string;
            deploymentTime: number;
            errorId: string;
          }>,
          Name
        >;
        getRecentCorrelations: FunctionReference<
          "query",
          "internal",
          { limit?: number },
          Array<{
            affectedFunctions: Array<string>;
            correlationScore: number;
            deploymentId: string;
            deploymentTime: number;
            errorId: string;
            reasoning: string;
          }>,
          Name
        >;
      };
      errorAnalysis: {
        analyzeError: FunctionReference<
          "action",
          "internal",
          {
            deploymentId?: string;
            errorId: string;
            errorMessage: string;
            functionPath?: string;
            logLines?: Array<string>;
            stackTrace?: string;
            timestamp: number;
          },
          {
            confidence: number;
            errorId: string;
            relatedIssues?: Array<string>;
            rootCause: string;
            severity: "low" | "medium" | "high" | "critical";
            suggestions: Array<string>;
          },
          Name
        >;
        getErrorAnalysis: FunctionReference<
          "query",
          "internal",
          { errorId: string },
          {
            confidence: number;
            deploymentId?: string;
            errorId: string;
            errorMessage: string;
            functionPath?: string;
            rootCause: string;
            severity: "low" | "medium" | "high" | "critical";
            suggestions: Array<string>;
            timestamp: number;
          } | null,
          Name
        >;
        getRecentAnalyses: FunctionReference<
          "query",
          "internal",
          { functionPath?: string; limit?: number },
          Array<{
            confidence: number;
            deploymentId?: string;
            errorId: string;
            errorMessage: string;
            functionPath?: string;
            rootCause: string;
            severity: "low" | "medium" | "high" | "critical";
            suggestions: Array<string>;
            timestamp: number;
          }>,
          Name
        >;
      };
      logSummarization: {
        getLogSummary: FunctionReference<
          "query",
          "internal",
          { timeWindow: { end: number; start: number } },
          {
            affectedFunctions: Array<string>;
            errorCount: number;
            functionCount: number;
            keyEvents: Array<string>;
            summary: string;
            timeWindow: { end: number; start: number };
          } | null,
          Name
        >;
        getRecentSummaries: FunctionReference<
          "query",
          "internal",
          { limit?: number },
          Array<{
            affectedFunctions: Array<string>;
            errorCount: number;
            functionCount: number;
            keyEvents: Array<string>;
            summary: string;
            timeWindow: { end: number; start: number };
          }>,
          Name
        >;
        identifyPatterns: FunctionReference<
          "action",
          "internal",
          {
            logs: Array<{
              errorMessage?: string;
              functionPath?: string;
              logLevel?: string;
              message: string;
              timestamp: number;
            }>;
          },
          Array<string>,
          Name
        >;
        summarizeByFunction: FunctionReference<
          "action",
          "internal",
          {
            logs: Array<{
              errorMessage?: string;
              functionPath?: string;
              logLevel?: string;
              message: string;
              timestamp: number;
            }>;
          },
          Record<
            string,
            { errorCount: number; keyEvents: Array<string>; summary: string }
          >,
          Name
        >;
        summarizeLogs: FunctionReference<
          "action",
          "internal",
          {
            groupByFunction?: boolean;
            includePatterns?: boolean;
            logs: Array<{
              errorMessage?: string;
              functionPath?: string;
              logLevel?: string;
              message: string;
              timestamp: number;
            }>;
            timeWindow?: { end: number; start: number };
          },
          {
            affectedFunctions: Array<string>;
            errorCount: number;
            functionCount: number;
            keyEvents: Array<string>;
            patterns?: Array<string>;
            summary: string;
          },
          Name
        >;
      };
      naturalLanguageQuery: {
        convertNaturalLanguageQuery: FunctionReference<
          "action",
          "internal",
          {
            fields: Array<{
              fieldName: string;
              optional?: boolean;
              type: string;
            }>;
            query: string;
            sampleDocuments?: Array<any>;
            tableName: string;
          },
          {
            filters: Array<{
              field: string;
              op:
                | "eq"
                | "neq"
                | "gt"
                | "gte"
                | "lt"
                | "lte"
                | "contains"
                | "not_contains"
                | "starts_with"
                | "ends_with";
              value: any;
            }>;
            limit: number | null;
            sortConfig: { direction: "asc" | "desc"; field: string } | null;
          },
          Name
        >;
      };
      suggestions: {
        getDocumentationLinks: FunctionReference<
          "action",
          "internal",
          { errorMessage: string; functionPath?: string },
          Array<string>,
          Name
        >;
        suggestFix: FunctionReference<
          "action",
          "internal",
          {
            errorMessage: string;
            functionPath?: string;
            logLines?: Array<string>;
            rootCause: string;
            severity: "low" | "medium" | "high" | "critical";
            stackTrace?: string;
            timestamp: number;
          },
          {
            codeExample?: string;
            confidence: number;
            documentationLinks: Array<string>;
            suggestion: string;
          },
          Name
        >;
        suggestPrevention: FunctionReference<
          "action",
          "internal",
          {
            errorMessage: string;
            functionPath?: string;
            rootCause: string;
            severity: "low" | "medium" | "high" | "critical";
          },
          {
            codePatterns?: Array<string>;
            monitoringSuggestions: Array<string>;
            preventiveMeasures: Array<string>;
          },
          Name
        >;
      };
    };
    cache: {
      clearCache: FunctionReference<"mutation", "internal", {}, null, Name>;
    };
    chats: {
      createChat: FunctionReference<
        "mutation",
        "internal",
        { title: string },
        { chatId: string },
        Name
      >;
      deleteChat: FunctionReference<
        "mutation",
        "internal",
        { chatId: string },
        null,
        Name
      >;
      generateResponse: FunctionReference<
        "action",
        "internal",
        {
          accessToken?: string;
          chatId: string;
          componentId?: string | null;
          convexUrl?: string;
          prompt: string;
          tableName?: string;
        },
        { message?: string; success: boolean },
        Name
      >;
      generateResponseStream: FunctionReference<
        "action",
        "internal",
        {
          accessToken?: string;
          chatId: string;
          componentId?: string | null;
          convexUrl?: string;
          prompt: string;
          tableName?: string;
        },
        { message?: string; success: boolean; threadId?: string },
        Name
      >;
      getAgentMessages: FunctionReference<
        "query",
        "internal",
        { chatId: string },
        Array<any>,
        Name
      >;
      getChat: FunctionReference<
        "query",
        "internal",
        { chatId: string },
        {
          _creationTime: number;
          _id: string;
          messages: Array<{
            _creationTime: number;
            _id: string;
            chatId: string;
            content: string;
            error?: boolean;
            role: "user" | "assistant";
            timestamp: number;
          }>;
          threadId?: string;
          title: string;
          updatedAt: number;
        } | null,
        Name
      >;
      getChatMessages: FunctionReference<
        "query",
        "internal",
        { chatId: string },
        Array<{
          _id: string;
          chatId: string;
          content: string;
          error?: boolean;
          role: "user" | "assistant";
          timestamp: number;
        }>,
        Name
      >;
      listAgentTools: FunctionReference<
        "query",
        "internal",
        {},
        Array<{ description: string; name: string }>,
        Name
      >;
      listChats: FunctionReference<
        "query",
        "internal",
        {},
        Array<{
          _creationTime: number;
          _id: string;
          threadId?: string;
          title: string;
          updatedAt: number;
        }>,
        Name
      >;
      listChatStreams: FunctionReference<
        "query",
        "internal",
        {
          chatId: string;
          streamArgs?:
            | { kind: "list"; startOrder?: number }
            | {
                cursors: Array<{ cursor: number; streamId: string }>;
                kind: "deltas";
              };
        },
        any,
        Name
      >;
      saveMessage: FunctionReference<
        "mutation",
        "internal",
        {
          chatId: string;
          content: string;
          error?: boolean;
          role: "user" | "assistant";
        },
        { messageId: string },
        Name
      >;
      updateChatTitle: FunctionReference<
        "mutation",
        "internal",
        { chatId: string; title: string },
        null,
        Name
      >;
    };
    config: {
      getConfig: FunctionReference<
        "query",
        "internal",
        {},
        {
          automaticAnalysis: boolean;
          embeddingModel?: string;
          enabled: boolean;
          maxTokens?: number;
          model: string;
          provider: "openai" | "anthropic" | "none";
          temperature?: number;
          updatedAt: number;
        } | null,
        Name
      >;
      setConfig: FunctionReference<
        "mutation",
        "internal",
        {
          apiKey: string;
          automaticAnalysis: boolean;
          embeddingModel?: string;
          enabled: boolean;
          maxTokens?: number;
          model: string;
          provider: "openai" | "anthropic" | "none";
          temperature?: number;
        },
        null,
        Name
      >;
      testConnection: FunctionReference<
        "action",
        "internal",
        { apiKey: string; model: string; provider: "openai" | "anthropic" },
        { error?: string; success: boolean },
        Name
      >;
      validateConfig: FunctionReference<
        "mutation",
        "internal",
        {
          apiKey: string;
          model: string;
          provider: "openai" | "anthropic" | "none";
        },
        { error?: string; valid: boolean },
        Name
      >;
    };
  };
