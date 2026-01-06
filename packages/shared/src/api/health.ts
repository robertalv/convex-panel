/**
 * Health checks and insights
 * Handles fetching deployment health information, server version, and insights
 */

import type { Insight, FetchFn } from "./types";
import { callConvexQuery } from "./helpers";
import { SYSTEM_QUERIES } from "./constants";

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
    return null;
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
    // Return null on error
    return null;
  }
}

/**
 * Extract deployment name from URL
 */
function extractDeploymentName(deploymentUrl: string): string | null {
  if (!deploymentUrl) return null;

  try {
    const url = new URL(deploymentUrl);
    const hostname = url.hostname;

    if (hostname.endsWith(".convex.cloud")) {
      return hostname.replace(".convex.cloud", "");
    }

    if (hostname.endsWith(".convex.site")) {
      return hostname.replace(".convex.site", "");
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get the insights period for data processing
 */
function useInsightsPeriod(): { from: Date; to: Date; key: string } {
  const now = new Date();
  const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  return {
    from,
    to: now,
    key: "last_7_days",
  };
}

/**
 * Transform raw insights data from BigBrain API
 */
function transformInsightsData(rawData: any[], fromDate: Date): Insight[] {
  if (!Array.isArray(rawData)) return [];

  return rawData
    .map((item: any) => {
      const [kind, functionId, componentPath, detailsJSON] = item;
      let details;
      try {
        details =
          typeof detailsJSON === "string"
            ? JSON.parse(detailsJSON)
            : detailsJSON;
      } catch {
        details = {};
      }

      return {
        kind,
        functionId,
        componentPath,
        details,
      } as Insight;
    })
    .filter(Boolean);
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
      return [];
    }

    // Big Brain API uses Bearer token, so strip "Convex " prefix if present
    const bearerToken = authToken.startsWith("Convex ")
      ? authToken.substring(7)
      : authToken;

    // Try to get teamId from deployment
    let teamId: number | null = null;
    let projectId: number | null = null;

    try {
      const teamResponse = await fetchFn(
        `https://api.convex.dev/api/deployment/${deploymentName}/team_and_project`,
        {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (teamResponse.ok) {
        const teamInfo = await teamResponse.json();
        teamId = teamInfo.teamId;
        projectId = teamInfo.projectId;
      }
    } catch {
      // Continue anyway
    }

    if (!teamId) {
      return [];
    }

    // Get the period for data processing
    const period = useInsightsPeriod();

    // Call Big Brain API to get insights
    const insightsQueryId = "9ab3b74e-a725-480b-88a6-43e6bd70bd82";

    const queryParams = new URLSearchParams({
      team_id: String(teamId),
      query_id: insightsQueryId,
      ...(projectId && { project_id: String(projectId) }),
      ...(deploymentName && { deployment_name: deploymentName }),
      period_start: period.from.toISOString(),
      period_end: period.to.toISOString(),
    });

    const insightsResponse = await fetchFn(
      `https://big-brain.convex.cloud/api/usage/query?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!insightsResponse.ok) {
      return [];
    }

    const insightsData = await insightsResponse.json();

    if (!insightsData || !Array.isArray(insightsData)) {
      return [];
    }

    // Transform the tuple format data: [kind, functionId, componentPath, detailsJSON]
    const transformed = transformInsightsData(insightsData, period.from);

    return transformed;
  } catch (error) {
    return [];
  }
}
