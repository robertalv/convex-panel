/**
 * Schedules API
 * Functions for fetching and managing scheduled jobs and cron jobs
 */

import { SYSTEM_QUERIES } from "./constants";

/**
 * Fetch paginated scheduled jobs from the deployment
 * @param adminClient - The Convex admin client instance
 * @param options - Pagination and filter options
 * @param componentId - Optional component ID for multi-component apps
 * @returns Promise resolving to paginated results
 */
export async function fetchScheduledJobs(
  adminClient: any,
  options: {
    numItems?: number;
    cursor?: string | null;
    udfPath?: string;
  } = {},
  componentId?: string | null,
): Promise<any> {
  if (!adminClient) {
    throw new Error("Admin client not available");
  }

  try {
    const result = await adminClient.query(
      "_system/frontend/paginatedScheduledJobs:default" as any,
      {
        paginationOpts: {
          numItems: options.numItems || 50,
          cursor: options.cursor ?? null,
        },
        udfPath: options.udfPath ?? undefined,
        componentId: componentId ?? undefined,
      },
    );

    return result;
  } catch (error) {
    console.error("Failed to fetch scheduled jobs:", error);
    throw error;
  }
}

/**
 * Fetch all cron jobs from the deployment
 * @param adminClient - The Convex admin client instance
 * @param componentId - Optional component ID for multi-component apps
 * @returns Promise resolving to array of cron jobs with run information
 */
export async function fetchCronJobs(
  adminClient: any,
  componentId?: string | null,
): Promise<any[]> {
  if (!adminClient) {
    throw new Error("Admin client not available");
  }

  try {
    const result = await adminClient.query(
      "_system/frontend/listCronJobs:default" as any,
      { componentId: componentId ?? undefined },
    );

    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Failed to fetch cron jobs:", error);
    return [];
  }
}

/**
 * Fetch cron job execution history
 * @param adminClient - The Convex admin client instance
 * @param componentId - Optional component ID for multi-component apps
 * @returns Promise resolving to array of cron job run logs
 */
export async function fetchCronJobRuns(
  adminClient: any,
  componentId?: string | null,
): Promise<any[]> {
  if (!adminClient) {
    throw new Error("Admin client not available");
  }

  try {
    const result = await adminClient.query(
      "_system/frontend/listCronJobRuns:default" as any,
      { componentId: componentId ?? undefined },
    );

    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Failed to fetch cron job runs:", error);
    return [];
  }
}

/**
 * Fetch modules information (includes cron specs)
 * @param adminClient - The Convex admin client instance
 * @param componentId - Optional component ID for multi-component apps
 * @returns Promise resolving to modules map
 *
 * Note: This API may not be available in all Convex deployments.
 * Returns undefined if the query is not available or fails.
 */
export async function fetchModules(
  adminClient: any,
  componentId?: string | null,
): Promise<Map<string, any> | undefined> {
  if (!adminClient) {
    return undefined;
  }

  try {
    // Try the listForAllComponents query first (newer API)
    const result = await adminClient.query(
      "_system/frontend/modules:listForAllComponents" as any,
      {},
    );

    // Result is an array of [componentId, modules] tuples
    if (Array.isArray(result)) {
      // Find modules for the requested component
      for (const [compId, modules] of result) {
        if (compId === (componentId ?? null)) {
          if (modules instanceof Map) {
            return modules;
          } else if (typeof modules === "object" && modules !== null) {
            return new Map(Object.entries(modules));
          } else if (Array.isArray(modules)) {
            return new Map(modules);
          }
        }
      }
      // If no matching component found, return undefined
      return undefined;
    }

    // Fallback: try the old modules:default query
    const fallbackResult = await adminClient.query(
      "_system/frontend/modules:default" as any,
      { componentId: componentId ?? undefined },
    );

    if (fallbackResult instanceof Map) {
      return fallbackResult;
    } else if (typeof fallbackResult === "object" && fallbackResult !== null) {
      return new Map(Object.entries(fallbackResult));
    }

    return undefined;
  } catch (error: any) {
    // Silently fail if the API doesn't exist - this is expected in some Convex versions
    const errorMsg = error?.message || String(error);
    if (
      errorMsg.includes("Couldn't find") ||
      errorMsg.includes("Endpoint not found")
    ) {
      console.debug("Modules API not available in this deployment");
    } else {
      console.error("Failed to fetch modules:", error);
    }
    return undefined;
  }
}

/**
 * Cancel a specific scheduled job
 * @param deploymentUrl - The deployment URL
 * @param authToken - Admin authentication token
 * @param jobId - The ID of the job to cancel
 * @param componentId - Optional component ID
 * @param fetchFn - Optional custom fetch function (defaults to global fetch)
 * @returns Promise that resolves when the job is canceled
 */
export async function cancelScheduledJob(
  deploymentUrl: string,
  authToken: string,
  jobId: string,
  componentId?: string | null,
  fetchFn: typeof fetch = fetch,
): Promise<void> {
  try {
    const response = await fetchFn(`${deploymentUrl}/api/cancel_job`, {
      method: "POST",
      headers: {
        Authorization: `Convex ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: jobId,
        componentId: componentId ?? undefined,
      }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Unknown error" }));
      throw new Error(
        error.message || `HTTP error! status: ${response.status}`,
      );
    }
  } catch (error: any) {
    const errorMessage = error?.message || "Failed to cancel scheduled job";
    throw new Error(errorMessage);
  }
}

/**
 * Cancel all scheduled jobs
 * @param deploymentUrl - The deployment URL
 * @param authToken - Admin authentication token
 * @param udfPath - Optional UDF path to filter jobs by function
 * @param componentId - Optional component ID
 * @param fetchFn - Optional custom fetch function (defaults to global fetch)
 * @returns Promise that resolves when all jobs are canceled
 */
export async function cancelAllScheduledJobs(
  deploymentUrl: string,
  authToken: string,
  udfPath?: string,
  componentId?: string | null,
  fetchFn: typeof fetch = fetch,
): Promise<void> {
  try {
    const response = await fetchFn(`${deploymentUrl}/api/cancel_all_jobs`, {
      method: "POST",
      headers: {
        Authorization: `Convex ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        udfPath: udfPath ?? undefined,
        componentId: componentId ?? undefined,
      }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Unknown error" }));

      if (error.code === "OptimisticConcurrencyControlFailure") {
        throw new Error(
          "There are too many functions being scheduled in this deployment. Pause your deployment to cancel all functions.",
        );
      }

      throw new Error(
        error.message || `HTTP error! status: ${response.status}`,
      );
    }
  } catch (error: any) {
    const errorMessage =
      error?.message || "Failed to cancel all scheduled jobs";
    throw new Error(errorMessage);
  }
}

/**
 * Fetch scheduled function arguments by job ID
 *
 * Note: In newer Convex versions, scheduled jobs have `argsId` instead of inline `udfArgs`.
 * This function attempts multiple strategies to fetch the arguments:
 * 1. Get full job document via getById (might have udfArgs populated)
 * 2. Try listById with _scheduled_jobs table name
 *
 * @param adminClient - The Convex admin client instance
 * @param jobId - The ID of the scheduled job
 * @param componentId - Optional component ID for multi-component apps
 * @returns Promise resolving to the arguments bytes or null if not found
 */
export async function fetchScheduledJobArguments(
  adminClient: any,
  jobId: string,
  componentId?: string | null,
): Promise<any> {
  if (!adminClient) {
    throw new Error("Admin client not available");
  }

  try {
    console.log(
      "fetchScheduledJobArguments - Trying strategy 1: getById for job ID:",
      jobId,
    );

    // Strategy 1: Try to fetch the full job document using getById
    const jobDoc = await adminClient.query(
      "_system/frontend/getById:default" as any,
      {
        id: jobId,
        componentId: componentId ?? undefined,
      },
    );

    console.log(
      "fetchScheduledJobArguments - Job document from getById:",
      jobDoc,
    );
    console.log("fetchScheduledJobArguments - job.args:", jobDoc?.args);
    console.log("fetchScheduledJobArguments - job.udfArgs:", jobDoc?.udfArgs);
    console.log("fetchScheduledJobArguments - job.argsId:", jobDoc?.argsId);

    // Check for 'args' field first (newer Convex versions use this)
    if (jobDoc?.args) {
      console.log(
        "fetchScheduledJobArguments - Found args field in job document",
      );
      return jobDoc.args;
    }

    // Then check for 'udfArgs' field (older Convex versions)
    if (jobDoc?.udfArgs) {
      console.log("fetchScheduledJobArguments - Found udfArgs in job document");
      return jobDoc.udfArgs;
    }

    // Strategy 2: Try listById with _scheduled_jobs table
    console.log(
      "fetchScheduledJobArguments - Trying strategy 2: listById with _scheduled_jobs",
    );
    const listResult = await adminClient.query(
      "_system/frontend/listById:default" as any,
      {
        ids: [{ id: jobId, tableName: "_scheduled_jobs" }],
        componentId: componentId ?? undefined,
      },
    );

    console.log("fetchScheduledJobArguments - listById result:", listResult);
    const jobFromList = Array.isArray(listResult) ? listResult[0] : null;
    console.log("fetchScheduledJobArguments - job from list:", jobFromList);
    console.log(
      "fetchScheduledJobArguments - job.args from list:",
      jobFromList?.args,
    );
    console.log(
      "fetchScheduledJobArguments - job.udfArgs from list:",
      jobFromList?.udfArgs,
    );

    return jobFromList?.args ?? jobFromList?.udfArgs ?? null;
  } catch (error) {
    console.error("Failed to fetch scheduled job arguments:", error);
    throw error;
  }
}

/**
 * Check if deployment is paused
 * @param adminClient - The Convex admin client instance
 * @returns Promise resolving to true if paused, false otherwise
 */
export async function fetchDeploymentState(
  adminClient: any,
): Promise<"paused" | "running" | "disabled"> {
  if (!adminClient) {
    throw new Error("Admin client not available");
  }

  try {
    const result = await adminClient.query(
      "_system/frontend/deploymentState:deploymentState" as any,
    );

    return result?.state || "running";
  } catch (error) {
    console.error("Failed to fetch deployment state:", error);
    return "running";
  }
}
