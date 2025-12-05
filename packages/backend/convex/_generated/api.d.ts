/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as dummyjson from "../dummyjson.js";
import type * as filterHistory from "../filterHistory.js";
import type * as http from "../http.js";
import type * as loops from "../loops.js";
import type * as stats from "../stats.js";
import type * as todos from "../todos.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  dummyjson: typeof dummyjson;
  filterHistory: typeof filterHistory;
  http: typeof http;
  loops: typeof loops;
  stats: typeof stats;
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
  filterHistory: {
    lib: {
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
};
