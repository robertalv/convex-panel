/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiAnalysis from "../aiAnalysis.js";
import type * as crons from "../crons.js";
import type * as dummyjson from "../dummyjson.js";
import type * as http from "../http.js";
import type * as loops from "../loops.js";
import type * as stats from "../stats.js";
import type * as test from "../test.js";
import type * as todos from "../todos.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aiAnalysis: typeof aiAnalysis;
  crons: typeof crons;
  dummyjson: typeof dummyjson;
  http: typeof http;
  loops: typeof loops;
  stats: typeof stats;
  test: typeof test;
  todos: typeof todos;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  ossStats: {
    github: {
      getGithubOwners: FunctionReference<
        "query",
        "internal",
        { owners: Array<string> },
        Array<null | {
          contributorCount: number;
          dependentCount: number;
          dependentCountPrevious?: { count: number; updatedAt: number };
          dependentCountUpdatedAt?: number;
          name: string;
          nameNormalized: string;
          starCount: number;
          updatedAt: number;
        }>
      >;
      getGithubRepo: FunctionReference<
        "query",
        "internal",
        { name: string },
        null | {
          contributorCount: number;
          dependentCount: number;
          dependentCountPrevious?: { count: number; updatedAt: number };
          dependentCountUpdatedAt?: number;
          name: string;
          nameNormalized: string;
          owner: string;
          ownerNormalized: string;
          starCount: number;
          updatedAt: number;
        }
      >;
      getGithubRepos: FunctionReference<
        "query",
        "internal",
        { names: Array<string> },
        Array<null | {
          contributorCount: number;
          dependentCount: number;
          dependentCountPrevious?: { count: number; updatedAt: number };
          dependentCountUpdatedAt?: number;
          name: string;
          nameNormalized: string;
          owner: string;
          ownerNormalized: string;
          starCount: number;
          updatedAt: number;
        }>
      >;
      updateGithubOwner: FunctionReference<
        "mutation",
        "internal",
        { name: string },
        any
      >;
      updateGithubOwnerStats: FunctionReference<
        "action",
        "internal",
        { githubAccessToken: string; owner: string; page?: number },
        any
      >;
      updateGithubRepos: FunctionReference<
        "mutation",
        "internal",
        {
          repos: Array<{
            contributorCount: number;
            dependentCount: number;
            name: string;
            owner: string;
            starCount: number;
          }>;
        },
        any
      >;
      updateGithubRepoStars: FunctionReference<
        "mutation",
        "internal",
        { name: string; owner: string; starCount: number },
        any
      >;
      updateGithubRepoStats: FunctionReference<
        "action",
        "internal",
        { githubAccessToken: string; repo: string },
        any
      >;
    };
    lib: {
      clearAndSync: FunctionReference<
        "action",
        "internal",
        {
          githubAccessToken: string;
          githubOwners?: Array<string>;
          githubRepos?: Array<string>;
          minStars?: number;
          npmOrgs?: Array<string>;
          npmPackages?: Array<string>;
        },
        any
      >;
      clearPage: FunctionReference<
        "mutation",
        "internal",
        { tableName: "githubRepos" | "npmPackages" },
        { isDone: boolean }
      >;
      clearTable: FunctionReference<
        "action",
        "internal",
        { tableName: "githubRepos" | "npmPackages" },
        null
      >;
      sync: FunctionReference<
        "action",
        "internal",
        {
          githubAccessToken: string;
          githubOwners?: Array<string>;
          githubRepos?: Array<string>;
          minStars?: number;
          npmOrgs?: Array<string>;
          npmPackages?: Array<string>;
        },
        null
      >;
    };
    npm: {
      getNpmOrgs: FunctionReference<
        "query",
        "internal",
        { names: Array<string> },
        Array<null | {
          dayOfWeekAverages: Array<number>;
          downloadCount: number;
          downloadCountUpdatedAt: number;
          name: string;
          updatedAt: number;
        }>
      >;
      getNpmPackage: FunctionReference<
        "query",
        "internal",
        { name: string },
        null | {
          dayOfWeekAverages: Array<number>;
          downloadCount: number;
          downloadCountUpdatedAt?: number;
          name: string;
          org?: string;
          updatedAt: number;
        }
      >;
      getNpmPackages: FunctionReference<
        "query",
        "internal",
        { names: Array<string> },
        {
          dayOfWeekAverages: Array<number>;
          downloadCount: number;
          downloadCountUpdatedAt: number;
          updatedAt: number;
        }
      >;
      updateNpmOrg: FunctionReference<
        "mutation",
        "internal",
        { name: string },
        any
      >;
      updateNpmOrgStats: FunctionReference<
        "action",
        "internal",
        { org: string; page?: number },
        any
      >;
      updateNpmPackage: FunctionReference<
        "mutation",
        "internal",
        {
          dayOfWeekAverages: Array<number>;
          downloadCount: number;
          name: string;
        },
        any
      >;
      updateNpmPackagesForOrg: FunctionReference<
        "mutation",
        "internal",
        {
          org: string;
          packages: Array<{
            dayOfWeekAverages: Array<number>;
            downloadCount: number;
            isNotFound?: boolean;
            name: string;
          }>;
        },
        any
      >;
      updateNpmPackageStats: FunctionReference<
        "action",
        "internal",
        { name: string },
        any
      >;
    };
  };
  loops: {
    lib: {
      addContact: FunctionReference<
        "action",
        "internal",
        {
          apiKey: string;
          contact: {
            email: string;
            firstName?: string;
            lastName?: string;
            source?: string;
            subscribed?: boolean;
            userGroup?: string;
            userId?: string;
          };
        },
        { id?: string; success: boolean }
      >;
      batchCreateContacts: FunctionReference<
        "action",
        "internal",
        {
          apiKey: string;
          contacts: Array<{
            email: string;
            firstName?: string;
            lastName?: string;
            source?: string;
            subscribed?: boolean;
            userGroup?: string;
            userId?: string;
          }>;
        },
        {
          created?: number;
          failed?: number;
          results?: Array<{ email: string; error?: string; success: boolean }>;
          success: boolean;
        }
      >;
      checkActorRateLimit: FunctionReference<
        "query",
        "internal",
        { actorId: string; maxEmails: number; timeWindowMs: number },
        {
          allowed: boolean;
          count: number;
          limit: number;
          retryAfter?: number;
          timeWindowMs: number;
        }
      >;
      checkGlobalRateLimit: FunctionReference<
        "query",
        "internal",
        { maxEmails: number; timeWindowMs: number },
        { allowed: boolean; count: number; limit: number; timeWindowMs: number }
      >;
      checkRecipientRateLimit: FunctionReference<
        "query",
        "internal",
        { email: string; maxEmails: number; timeWindowMs: number },
        {
          allowed: boolean;
          count: number;
          limit: number;
          retryAfter?: number;
          timeWindowMs: number;
        }
      >;
      countContacts: FunctionReference<
        "query",
        "internal",
        { source?: string; subscribed?: boolean; userGroup?: string },
        number
      >;
      deleteContact: FunctionReference<
        "action",
        "internal",
        { apiKey: string; email: string },
        { success: boolean }
      >;
      detectActorSpam: FunctionReference<
        "query",
        "internal",
        { maxEmailsPerActor?: number; timeWindowMs?: number },
        Array<{ actorId: string; count: number; timeWindowMs: number }>
      >;
      detectRapidFirePatterns: FunctionReference<
        "query",
        "internal",
        { minEmailsInWindow?: number; timeWindowMs?: number },
        Array<{
          actorId?: string;
          count: number;
          email?: string;
          firstTimestamp: number;
          lastTimestamp: number;
          timeWindowMs: number;
        }>
      >;
      detectRecipientSpam: FunctionReference<
        "query",
        "internal",
        { maxEmailsPerRecipient?: number; timeWindowMs?: number },
        Array<{ count: number; email: string; timeWindowMs: number }>
      >;
      findContact: FunctionReference<
        "action",
        "internal",
        { apiKey: string; email: string },
        {
          contact?: {
            createdAt?: string | null;
            email?: string | null;
            firstName?: string | null;
            id?: string | null;
            lastName?: string | null;
            source?: string | null;
            subscribed?: boolean | null;
            userGroup?: string | null;
            userId?: string | null;
          };
          success: boolean;
        }
      >;
      getEmailStats: FunctionReference<
        "query",
        "internal",
        { timeWindowMs?: number },
        {
          failedOperations: number;
          operationsByType: Record<string, number>;
          successfulOperations: number;
          totalOperations: number;
          uniqueActors: number;
          uniqueRecipients: number;
        }
      >;
      listContacts: FunctionReference<
        "query",
        "internal",
        {
          limit?: number;
          offset?: number;
          source?: string;
          subscribed?: boolean;
          userGroup?: string;
        },
        {
          contacts: Array<{
            _id: string;
            createdAt: number;
            email: string;
            firstName?: string;
            lastName?: string;
            loopsContactId?: string;
            source?: string;
            subscribed: boolean;
            updatedAt: number;
            userGroup?: string;
            userId?: string;
          }>;
          hasMore: boolean;
          limit: number;
          offset: number;
          total: number;
        }
      >;
      logEmailOperation: FunctionReference<
        "mutation",
        "internal",
        {
          actorId?: string;
          campaignId?: string;
          email: string;
          eventName?: string;
          loopId?: string;
          messageId?: string;
          metadata?: Record<string, any>;
          operationType: "transactional" | "event" | "campaign" | "loop";
          success: boolean;
          transactionalId?: string;
        },
        any
      >;
      removeContact: FunctionReference<
        "mutation",
        "internal",
        { email: string },
        any
      >;
      resubscribeContact: FunctionReference<
        "action",
        "internal",
        { apiKey: string; email: string },
        { success: boolean }
      >;
      sendEvent: FunctionReference<
        "action",
        "internal",
        {
          apiKey: string;
          email: string;
          eventName: string;
          eventProperties?: Record<string, any>;
        },
        { success: boolean }
      >;
      sendTransactional: FunctionReference<
        "action",
        "internal",
        {
          apiKey: string;
          dataVariables?: Record<string, any>;
          email: string;
          transactionalId: string;
        },
        { messageId?: string; success: boolean }
      >;
      storeContact: FunctionReference<
        "mutation",
        "internal",
        {
          email: string;
          firstName?: string;
          lastName?: string;
          loopsContactId?: string;
          source?: string;
          subscribed?: boolean;
          userGroup?: string;
          userId?: string;
        },
        any
      >;
      triggerLoop: FunctionReference<
        "action",
        "internal",
        {
          apiKey: string;
          dataVariables?: Record<string, any>;
          email: string;
          eventName?: string;
          loopId: string;
        },
        { success: boolean; warning?: string }
      >;
      unsubscribeContact: FunctionReference<
        "action",
        "internal",
        { apiKey: string; email: string },
        { success: boolean }
      >;
      updateContact: FunctionReference<
        "action",
        "internal",
        {
          apiKey: string;
          dataVariables?: Record<string, any>;
          email: string;
          firstName?: string;
          lastName?: string;
          source?: string;
          subscribed?: boolean;
          userGroup?: string;
          userId?: string;
        },
        { success: boolean }
      >;
    };
  };
  convexPanel: {
    lib: {
      cleanup: FunctionReference<
        "action",
        "internal",
        { retentionHours: number },
        { deletedScopes: number; deletedStates: number }
      >;
      clear: FunctionReference<"mutation", "internal", { scope: string }, null>;
      createCheckpoint: FunctionReference<
        "mutation",
        "internal",
        { name: string; scope: string },
        null
      >;
      deleteCheckpoint: FunctionReference<
        "mutation",
        "internal",
        { name: string; scope: string },
        null
      >;
      deleteScope: FunctionReference<
        "mutation",
        "internal",
        { scope: string },
        null
      >;
      getCheckpointState: FunctionReference<
        "query",
        "internal",
        { name: string; scope: string },
        any | null
      >;
      getCurrentState: FunctionReference<
        "query",
        "internal",
        { scope: string },
        any | null
      >;
      getStateAtPosition: FunctionReference<
        "query",
        "internal",
        { position: number; scope: string },
        any | null
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { scope: string },
        {
          canRedo: boolean;
          canUndo: boolean;
          length: number;
          position: number | null;
        }
      >;
      listCheckpoints: FunctionReference<
        "query",
        "internal",
        { scope: string },
        Array<{ name: string; position: number | null }>
      >;
      listStates: FunctionReference<
        "query",
        "internal",
        { scope: string },
        Array<{ position: number; state: any }>
      >;
      push: FunctionReference<
        "mutation",
        "internal",
        { maxStates?: number; scope: string; state: any },
        null
      >;
      redo: FunctionReference<
        "mutation",
        "internal",
        { count?: number; scope: string },
        any | null
      >;
      restoreCheckpoint: FunctionReference<
        "mutation",
        "internal",
        { maxStates?: number; name: string; scope: string },
        any
      >;
      undo: FunctionReference<
        "mutation",
        "internal",
        { count?: number; scope: string },
        any | null
      >;
    };
  };
  aiAnalysis: {
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
          number
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
          } | null
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
          }>
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
          }>
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
          }>
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
          }
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
          } | null
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
          }>
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
          } | null
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
          }>
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
          Array<string>
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
          >
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
          }
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
          }
        >;
      };
      suggestions: {
        getDocumentationLinks: FunctionReference<
          "action",
          "internal",
          { errorMessage: string; functionPath?: string },
          Array<string>
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
          }
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
          }
        >;
      };
    };
    cache: {
      clearCache: FunctionReference<"mutation", "internal", {}, null>;
    };
    chats: {
      createChat: FunctionReference<
        "mutation",
        "internal",
        { title: string },
        { chatId: string }
      >;
      deleteChat: FunctionReference<
        "mutation",
        "internal",
        { chatId: string },
        null
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
        { message?: string; success: boolean }
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
        { message?: string; success: boolean; threadId?: string }
      >;
      getAgentMessages: FunctionReference<
        "query",
        "internal",
        { chatId: string },
        Array<any>
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
        } | null
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
        }>
      >;
      listAgentTools: FunctionReference<
        "query",
        "internal",
        {},
        Array<{ description: string; name: string }>
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
        }>
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
        any
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
        { messageId: string }
      >;
      updateChatTitle: FunctionReference<
        "mutation",
        "internal",
        { chatId: string; title: string },
        null
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
        } | null
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
        null
      >;
      testConnection: FunctionReference<
        "action",
        "internal",
        { apiKey: string; model: string; provider: "openai" | "anthropic" },
        { error?: string; success: boolean }
      >;
      validateConfig: FunctionReference<
        "mutation",
        "internal",
        {
          apiKey: string;
          model: string;
          provider: "openai" | "anthropic" | "none";
        },
        { error?: string; valid: boolean }
      >;
    };
  };
};
