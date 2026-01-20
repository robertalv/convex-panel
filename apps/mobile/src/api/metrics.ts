/**
 * Metrics API Functions for Mobile App
 * Local metrics functions extracted from @convex-panel/shared
 */

import { ROUTES, CONVEX_DASHBOARD_DOMAIN } from "./constants";
import type {
  FetchFn,
  FunctionExecutionStats,
  StreamUdfExecutionResponse,
} from "./types";
import { normalizeToken } from "./helpers";

/**
 * Fetch the failure rate from the Convex API
 */
export const fetchFailureRate = async (
  deploymentUrl: string,
  authToken: string,
  fetchFn: FetchFn,
) => {
  if (!deploymentUrl || !deploymentUrl.trim()) {
    throw new Error("Deployment URL is required");
  }
  if (!authToken || !authToken.trim()) {
    throw new Error("Auth token is required");
  }

  const now = Math.floor(Date.now() / 1000);
  const twentySixMinutesAgo = now - 26 * 60; // 26 minutes = 1560 seconds

  const window = {
    start: {
      secs_since_epoch: twentySixMinutesAgo,
      nanos_since_epoch: 0,
    },
    end: {
      secs_since_epoch: now,
      nanos_since_epoch: 0,
    },
    num_buckets: 26,
  };

  const params = new URLSearchParams({
    window: JSON.stringify(window),
    k: "3",
  });

  const normalizedToken = normalizeToken(authToken);

  const response = await fetchFn(
    `${deploymentUrl}${ROUTES.FAILURE_RATE}?${params}`,
    {
      headers: {
        Authorization: normalizedToken,
        "Content-Type": "application/json",
        "Convex-Client": "dashboard-0.0.0",
        Origin: `https://${CONVEX_DASHBOARD_DOMAIN}`,
        Referer: `https://${CONVEX_DASHBOARD_DOMAIN}/`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch failure rate: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Fetch the cache hit rate from the Convex API
 */
export const fetchCacheHitRate = async (
  deploymentUrl: string,
  authToken: string,
  fetchFn: FetchFn,
) => {
  if (!deploymentUrl || !deploymentUrl.trim()) {
    throw new Error("Deployment URL is required");
  }
  if (!authToken || !authToken.trim()) {
    throw new Error("Auth token is required");
  }

  const now = Math.floor(Date.now() / 1000);
  const twentySixMinutesAgo = now - 26 * 60; // 26 minutes = 1560 seconds

  const window = {
    start: {
      secs_since_epoch: twentySixMinutesAgo,
      nanos_since_epoch: 0,
    },
    end: {
      secs_since_epoch: now,
      nanos_since_epoch: 0,
    },
    num_buckets: 26,
  };

  const params = new URLSearchParams({
    window: JSON.stringify(window),
    k: "3",
  });

  const normalizedToken = normalizeToken(authToken);

  const response = await fetchFn(
    `${deploymentUrl}${ROUTES.CACHE_HIT_RATE}?${params}`,
    {
      headers: {
        Authorization: normalizedToken,
        "Content-Type": "application/json",
        "Convex-Client": "dashboard-0.0.0",
        Origin: `https://${CONVEX_DASHBOARD_DOMAIN}`,
        Referer: `https://${CONVEX_DASHBOARD_DOMAIN}/`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch cache hit rate: ${response.statusText}`);
  }

  const data = await response.json();

  return data;
};

/**
 * Fetch the scheduler lag from the Convex API
 */
export async function fetchSchedulerLag(
  deploymentUrl: string,
  authToken: string,
  fetchFn: FetchFn,
): Promise<any> {
  if (!deploymentUrl || !deploymentUrl.trim()) {
    throw new Error("Deployment URL is required");
  }
  if (!authToken || !authToken.trim()) {
    throw new Error("Auth token is required");
  }

  const end = new Date();
  const start = new Date(end.getTime() - 26 * 60 * 1000); // 26 minutes

  const window = {
    start: {
      secs_since_epoch: Math.floor(start.getTime() / 1000),
      nanos_since_epoch: (start.getTime() % 1000) * 1000000,
    },
    end: {
      secs_since_epoch: Math.floor(end.getTime() / 1000),
      nanos_since_epoch: (end.getTime() % 1000) * 1000000,
    },
    num_buckets: 26,
  };

  try {
    const response = await fetchFn(
      `${deploymentUrl}${ROUTES.SCHEDULED_JOB_LAG}?window=${encodeURIComponent(JSON.stringify(window))}`,
      {
        headers: {
          Authorization: normalizeToken(authToken),
          "Content-Type": "application/json",
          "Convex-Client": "dashboard-0.0.0",
          Origin: `https://${CONVEX_DASHBOARD_DOMAIN}`,
          Referer: `https://${CONVEX_DASHBOARD_DOMAIN}/`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

/**
 * Fetch the UDF execution stats from the Convex API
 */
export async function fetchUdfExecutionStats(
  deploymentUrl: string,
  authToken: string,
  cursor: number = 0,
  fetchFn: FetchFn,
): Promise<StreamUdfExecutionResponse> {
  const url = `${deploymentUrl}${ROUTES.STREAM_UDF_EXECUTION}?cursor=${cursor}`;

  const response = await fetchFn(url, {
    headers: {
      Authorization: normalizeToken(authToken),
      "Content-Type": "application/json",
      "Convex-Client": "dashboard-1.0.0",
    },
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(
      `Failed to fetch UDF execution stats: HTTP ${response.status} - ${responseText}`,
    );
  }

  const data = await response.json();

  return {
    entries: data.entries || [],
    new_cursor: data.new_cursor || cursor,
  };
}

/**
 * Fetch latency percentiles from the Convex API
 */
export async function fetchLatencyPercentiles(
  deploymentUrl: string,
  authToken: string,
  fetchFn: FetchFn,
): Promise<any> {
  if (!deploymentUrl || !deploymentUrl.trim()) {
    throw new Error("Deployment URL is required");
  }
  if (!authToken || !authToken.trim()) {
    throw new Error("Auth token is required");
  }

  // Calculate aggregate latency from execution stats
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const cursor = Math.floor(oneHourAgo / 1000) * 1000; // Convert to milliseconds

  try {
    const executionResponse = await fetchUdfExecutionStats(
      deploymentUrl,
      authToken,
      cursor,
      fetchFn,
    );

    if (
      !executionResponse ||
      !executionResponse.entries ||
      executionResponse.entries.length === 0
    ) {
      return [];
    }

    // Get execution times from entries
    const executionTimes: number[] = [];
    executionResponse.entries.forEach((entry: any) => {
      let execTime =
        entry.execution_time_ms ||
        entry.executionTimeMs ||
        entry.execution_time ||
        entry.executionTime;
      if (execTime) {
        // Convert to milliseconds if needed
        if (execTime < 1000 && execTime > 0) {
          execTime = execTime * 1000;
        }
        if (execTime > 0) {
          executionTimes.push(execTime);
        }
      }
    });

    if (executionTimes.length === 0) {
      return [];
    }

    // Calculate percentiles
    const sorted = executionTimes.sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    // Return in the format expected by the component: [percentile, timeseries]
    const now = Math.floor(Date.now() / 1000);
    const timestamp = {
      secs_since_epoch: now,
      nanos_since_epoch: 0,
    };

    return [
      [50, [[timestamp, p50]]],
      [95, [[timestamp, p95]]],
      [99, [[timestamp, p99]]],
    ];
  } catch (error) {
    // Return empty array on error
    return [];
  }
}

/**
 * Fetch aggregate UDF invocation rate from the Convex API
 */
export async function fetchUdfRate(
  deploymentUrl: string,
  authToken: string,
  fetchFn: FetchFn,
): Promise<any> {
  if (!deploymentUrl || !deploymentUrl.trim()) {
    throw new Error("Deployment URL is required");
  }
  if (!authToken || !authToken.trim()) {
    throw new Error("Auth token is required");
  }

  // Aggregate from stream_udf_execution
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const cursor = Math.floor(oneHourAgo / 1000) * 1000; // Convert to milliseconds

  try {
    const executionResponse = await fetchUdfExecutionStats(
      deploymentUrl,
      authToken,
      cursor,
      fetchFn,
    );

    if (!executionResponse || !executionResponse.entries) {
      return [];
    }

    // Aggregate invocations by minute
    const now = Math.floor(Date.now() / 1000);
    const twentySixMinutesAgo = now - 26 * 60;
    const numBuckets = 26;
    const bucketSizeSeconds = (26 * 60) / numBuckets;

    // Initialize buckets
    const buckets: number[] = Array(numBuckets).fill(0);
    const timestamps: Array<{
      secs_since_epoch: number;
      nanos_since_epoch: number;
    }> = [];

    // Generate timestamps for each bucket
    for (let i = 0; i < numBuckets; i++) {
      const bucketTime = twentySixMinutesAgo + i * bucketSizeSeconds;
      timestamps.push({
        secs_since_epoch: bucketTime,
        nanos_since_epoch: 0,
      });
    }

    // Count invocations per bucket
    executionResponse.entries.forEach((entry: any) => {
      let entryTime =
        entry.timestamp || entry.execution_timestamp || entry.unix_timestamp;
      if (entryTime > 1e12) {
        entryTime = Math.floor(entryTime / 1000);
      }

      if (entryTime >= twentySixMinutesAgo && entryTime <= now) {
        const bucketIndex = Math.floor(
          (entryTime - twentySixMinutesAgo) / bucketSizeSeconds,
        );
        const clampedIndex = Math.max(0, Math.min(numBuckets - 1, bucketIndex));
        buckets[clampedIndex]++;
      }
    });

    // Convert to expected format: Array<[timestamp, value]>
    const timeSeriesData = timestamps.map((timestamp, i) => [
      timestamp,
      buckets[i],
    ]);

    return [["total", timeSeriesData]];
  } catch (error) {
    // Return empty array on error
    return [];
  }
}
