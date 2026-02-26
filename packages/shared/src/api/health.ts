/**
 * Health checks and insights
 * Handles fetching deployment health information, server version, and insights
 */

import type { Insight, FetchFn } from "./types";
import { callConvexQuery } from "./helpers";
import { SYSTEM_QUERIES } from "./constants";
import {
  extractDeploymentName,
  getTeamFromDeployment,
  getTokenDetails,
  queryUsage,
  getInsightsPeriod,
  normalizeBearerToken,
  DATABRICKS_QUERY_IDS,
  ROOT_COMPONENT_PATH,
} from "./bigbrain";

// Default fetch function - uses native fetch
const defaultFetch: FetchFn = (input, init) => fetch(input, init);

/**
 * Fetch the last push event timestamp from the Convex deployment
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token for the Convex deployment
 * @param fetchFn - Optional custom fetch function (for Tauri/CORS-free environments)
 * @returns The last push event timestamp, or null if unavailable
 */
export async function fetchLastPushEvent(
  deploymentUrl: string,
  authToken: string,
  fetchFn: FetchFn = defaultFetch,
): Promise<{ _creationTime: number } | null> {
  try {
    let data = await callConvexQuery(
      deploymentUrl,
      authToken,
      SYSTEM_QUERIES.LAST_PUSH_EVENT,
      {},
      fetchFn,
    );

    if (data === null || data === undefined) {
      return null;
    }

    let eventData = data;
    if (data && typeof data === "object" && "value" in data) {
      eventData = data.value;
    }

    if (eventData === null || eventData === undefined) {
      return null;
    }

    if (
      eventData &&
      typeof eventData === "object" &&
      "_creationTime" in eventData
    ) {
      const creationTime = eventData._creationTime;
      const timestamp =
        typeof creationTime === "number"
          ? creationTime < 1e12
            ? creationTime * 1000
            : creationTime
          : new Date(creationTime).getTime();
      return { _creationTime: timestamp };
    }

    if (eventData && typeof eventData === "object") {
      if (
        "timestamp" in eventData ||
        "time" in eventData ||
        "date" in eventData
      ) {
        const timestamp =
          eventData.timestamp || eventData.time || eventData.date;
        const ms =
          typeof timestamp === "number"
            ? timestamp < 1e12
              ? timestamp * 1000
              : timestamp
            : new Date(timestamp).getTime();
        return { _creationTime: ms };
      }
    }

    return null;
  } catch (error) {
    console.error("[fetchLastPushEvent] Error:", error);
    throw error;
  }
}

/**
 * Fetch the Convex server version
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token for the Convex deployment
 * @param fetchFn - Optional custom fetch function (for Tauri/CORS-free environments)
 * @returns The server version string, or null if unavailable
 */
export async function fetchServerVersion(
  deploymentUrl: string,
  authToken: string,
  fetchFn: FetchFn = defaultFetch,
): Promise<string | null> {
  try {
    let data = await callConvexQuery(
      deploymentUrl,
      authToken,
      SYSTEM_QUERIES.GET_VERSION,
      {},
      fetchFn,
    );

    if (data === null || data === undefined) {
      data = await callConvexQuery(
        deploymentUrl,
        authToken,
        "_system/frontend/getVersion.default",
        {},
        fetchFn,
      );
    }

    if (data && typeof data === "object" && "value" in data) {
      const versionValue = data.value;
      if (typeof versionValue === "string") {
        return versionValue;
      }
      if (
        versionValue &&
        typeof versionValue === "object" &&
        versionValue.version
      ) {
        return String(versionValue.version);
      }
    }

    if (typeof data === "string") {
      return data;
    }

    if (data && typeof data === "object" && data.version) {
      return String(data.version);
    }

    return null;
  } catch (error) {
    console.error("[fetchServerVersion] Error:", error);
    throw error;
  }
}

/**
 * Transform raw insights data from BigBrain API
 * Data format: [kind, functionId, componentPath, detailsJSON]
 */
function transformInsightsData(
  rawData: string[][],
  periodFrom: string,
): Insight[] {
  if (!Array.isArray(rawData)) return [];

  return rawData
    .map((row) => {
      const [kind, functionId, componentPath, detailsJSON] = row;

      // Validate required fields
      if (!kind || !functionId) {
        console.warn("[Insights] Skipping invalid row:", row);
        return null;
      }

      let details;
      try {
        details =
          typeof detailsJSON === "string"
            ? JSON.parse(detailsJSON)
            : detailsJSON || {};
      } catch (e) {
        console.warn("[Insights] Failed to parse details JSON:", detailsJSON);
        details = {};
      }

      // Pad and sort hourly counts if present
      if (details.hourlyCounts && Array.isArray(details.hourlyCounts)) {
        details.hourlyCounts = padAndSortHourlyData(
          details.hourlyCounts,
          periodFrom,
        );
      }

      return {
        kind: kind as Insight["kind"],
        functionId,
        componentPath:
          componentPath === ROOT_COMPONENT_PATH ? null : componentPath,
        details,
      } as Insight;
    })
    .filter((item): item is Insight => item !== null);
}

/**
 * Pad hourly data to ensure continuous time series
 */
function padAndSortHourlyData(
  hourlyCounts: Array<{ hour: string; count: number }>,
  periodStart: string,
): Array<{ hour: string; count: number }> {
  const currentTime = new Date();

  if (hourlyCounts.length === 0) {
    if (periodStart) {
      const startDate = new Date(periodStart);
      const endDate = new Date(currentTime);
      const result: Array<{ hour: string; count: number }> = [];
      const currentDate = new Date(startDate);

      while (currentDate < endDate) {
        const year = currentDate.getUTCFullYear();
        const month = String(currentDate.getUTCMonth() + 1).padStart(2, "0");
        const day = String(currentDate.getUTCDate()).padStart(2, "0");
        const hour = String(currentDate.getUTCHours()).padStart(2, "0");
        const formattedHour = `${year}-${month}-${day} ${hour}:00:00`;

        result.push({ hour: formattedHour, count: 0 });
        currentDate.setHours(currentDate.getHours() + 1);
      }
      return result;
    }
    return [];
  }

  // Build hour to count map
  const hourToCountMap = new Map<string, number>();
  for (const item of hourlyCounts) {
    hourToCountMap.set(item.hour, item.count);
  }

  // Determine start and end dates
  const startDate = new Date(periodStart);
  const endDate = new Date(currentTime);

  // Generate all hours in the range
  const result: Array<{ hour: string; count: number }> = [];
  const currentDate = new Date(startDate);

  while (currentDate < endDate) {
    const year = currentDate.getUTCFullYear();
    const month = String(currentDate.getUTCMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getUTCDate()).padStart(2, "0");
    const hour = String(currentDate.getUTCHours()).padStart(2, "0");
    const formattedHour = `${year}-${month}-${day} ${hour}:00:00`;

    // Try to find count in the map
    const isoHour = currentDate.toISOString().slice(0, 13);
    const count =
      hourToCountMap.get(isoHour) || hourToCountMap.get(formattedHour) || 0;

    result.push({ hour: formattedHour, count });
    currentDate.setHours(currentDate.getHours() + 1);
  }

  return result;
}

/**
 * Sort insights by severity
 */
function sortInsights(insights: Insight[]): Insight[] {
  const order: Record<Insight["kind"], number> = {
    documentsReadLimit: 0,
    bytesReadLimit: 1,
    occFailedPermanently: 2,
    documentsReadThreshold: 3,
    bytesReadThreshold: 4,
    occRetried: 5,
  };

  return [...insights].sort((a, b) => order[a.kind] - order[b.kind]);
}

/**
 * Fetch insights from Big Brain API
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token (prefer team access token for Big Brain API)
 * @param fetchFn - Optional custom fetch function (for Tauri/CORS-free environments)
 * @returns Array of insights, or empty array if none found
 */
export async function fetchInsights(
  deploymentUrl: string,
  authToken: string,
  fetchFn: FetchFn = defaultFetch,
): Promise<Insight[]> {
  try {
    // Extract deployment name from URL
    const deploymentName = extractDeploymentName(deploymentUrl);

    if (!deploymentName) {
      console.error(
        "[Insights] Failed to extract deployment name from URL:",
        deploymentUrl,
      );
      return [];
    }

    // BigBrain API uses Bearer token, so strip "Convex " prefix if present
    const bearerToken = normalizeBearerToken(authToken);

    console.log("[Insights] Fetching for deployment:", deploymentName);

    // Try to get teamId from deployment
    let teamId: number | null = null;
    let projectId: number | null = null;

    // Method 1: Get team info from deployment name
    try {
      const teamInfo = await getTeamFromDeployment(
        deploymentName,
        bearerToken,
        fetchFn,
      );
      if (teamInfo) {
        teamId = teamInfo.teamId;
        projectId = teamInfo.projectId;
        console.log("[Insights] Got team info:", { teamId, projectId });
      }
    } catch (error) {
      console.error("[Insights] Error getting team from deployment:", error);
    }

    // Method 2: Try token details if team not found
    if (!teamId) {
      try {
        const tokenDetails = await getTokenDetails(bearerToken, fetchFn);
        if (tokenDetails?.teamId) {
          teamId = tokenDetails.teamId;
          console.log("[Insights] Got teamId from token details:", teamId);
        }

        // Check if it's a project token (which can't access insights)
        if (tokenDetails?.type === "projectToken") {
          console.warn("[Insights] Project tokens cannot access insights API");
          return [];
        }
      } catch (error) {
        console.error("[Insights] Error getting token details:", error);
      }
    }

    if (!teamId) {
      console.error("[Insights] No teamId found, cannot fetch insights");
      return [];
    }

    // Get the period for data processing (last 72 hours)
    const period = getInsightsPeriod();

    console.log("[Insights] Querying with params:", {
      teamId,
      projectId,
      deploymentName,
      from: period.from.split("T")[0],
      to: period.to.split("T")[0],
    });

    // Call Big Brain API to get insights
    let insightsData: string[][];
    try {
      insightsData = await queryUsage(
        {
          queryId: DATABRICKS_QUERY_IDS.INSIGHTS,
          teamId,
          projectId,
          deploymentName,
          from: period.from.split("T")[0],
          to: period.to.split("T")[0],
        },
        bearerToken,
        fetchFn,
      );
    } catch (error) {
      console.error("[Insights] Error querying usage:", error);

      // Handle specific error cases
      if (error instanceof Error) {
        if (
          error.message.includes("Service accounts cannot manage teams") ||
          error.message.includes("ServiceAccount") ||
          (error.message.includes("403") && error.message.includes("service"))
        ) {
          console.warn(
            "[Insights] Service account tokens don't have access to insights",
          );
          return [];
        }

        if (error.message.includes("CORS")) {
          console.warn(
            "[Insights] CORS error - insights may not be available from this origin",
          );
          return [];
        }

        if (
          error.message.includes("403") ||
          error.message.includes("Forbidden")
        ) {
          console.warn("[Insights] Permission denied for insights API");
          return [];
        }
      }

      return [];
    }

    if (!insightsData || !Array.isArray(insightsData)) {
      console.warn("[Insights] Invalid response format:", typeof insightsData);
      return [];
    }

    console.log("[Insights] Received", insightsData.length, "insight(s)");

    // Transform the tuple format data
    const transformed = transformInsightsData(insightsData, period.from);

    // Sort by severity
    return sortInsights(transformed);
  } catch (error) {
    console.error("[Insights] Unexpected error:", error);
    throw error;
  }
}
