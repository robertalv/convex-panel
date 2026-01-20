/**
 * Metrics and analytics functions
 * Handles fetching various metrics from the Convex API
 */

import { ROUTES } from "../../utils/constants";
import type {
  FunctionExecutionStats,
  StreamUdfExecutionResponse,
  AggregatedFunctionStats,
  FetchFn,
} from "../../types";
import {
  mockFetchCacheHitRate,
  mockFetchFailureRate,
  mockFetchSchedulerLag,
} from "../mockData";
import { normalizeToken, serializeDate, parseDate } from "./helpers";
import type { TimeseriesBucket, TableMetric } from "./types";
import { CONVEX_DASHBOARD_DOMAIN } from "../constants";
import { fetchLogsFromApi } from "./logs";

// Default fetch function - uses native fetch
const defaultFetch: FetchFn = (input, init) => fetch(input, init);

/**
 * Fetch the failure rate from the Convex API
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token for the Convex deployment
 * @param useMockData - Whether to use mock data instead of making API calls
 * @param fetchFn - Optional custom fetch function (for Tauri/CORS-free environments)
 * @returns The failure rate
 */
export const fetchFailureRate = async (
  deploymentUrl: string,
  authToken: string,
  useMockData = false,
  fetchFn: FetchFn = defaultFetch,
) => {
  if (useMockData) {
    return mockFetchFailureRate();
  }

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
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token for the Convex deployment
 * @param useMockData - Whether to use mock data instead of making API calls
 * @param fetchFn - Optional custom fetch function (for Tauri/CORS-free environments)
 * @returns The cache hit rate
 */
export const fetchCacheHitRate = async (
  deploymentUrl: string,
  authToken: string,
  useMockData = false,
  fetchFn: FetchFn = defaultFetch,
) => {
  if (useMockData) {
    return mockFetchCacheHitRate();
  }

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
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token for the Convex deployment
 * @param useMockData - Whether to use mock data instead of making API calls
 * @param fetchFn - Optional custom fetch function (for Tauri/CORS-free environments)
 * @returns The scheduler lag
 */
export async function fetchSchedulerLag(
  deploymentUrl: string,
  authToken: string,
  useMockData = false,
  fetchFn: FetchFn = defaultFetch,
): Promise<any> {
  if (useMockData) {
    return mockFetchSchedulerLag();
  }

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
 * Fetch the table rate from the Convex API
 * @param deploymentUrl - The URL of the Convex deployment
 * @param tableName - The name of the table
 * @param metric - The metric to fetch
 * @param start - The start date
 * @param end - The end date
 * @param numBuckets - The number of buckets
 * @param authToken - The authentication token
 * @param fetchFn - Optional custom fetch function (for Tauri/CORS-free environments)
 * @returns The table rate
 */
export async function fetchTableRate(
  deploymentUrl: string,
  tableName: string,
  metric: TableMetric,
  start: Date,
  end: Date,
  numBuckets: number,
  authToken: string,
  fetchFn: FetchFn = defaultFetch,
): Promise<TimeseriesBucket[]> {
  const windowArgs = {
    start: serializeDate(start),
    end: serializeDate(end),
    num_buckets: numBuckets,
  };

  const name = encodeURIComponent(tableName);
  const window = encodeURIComponent(JSON.stringify(windowArgs));
  const url = `${deploymentUrl}${ROUTES.TABLE_RATE}?name=${name}&metric=${metric}&window=${window}`;

  const normalizedToken = normalizeToken(authToken);

  const response = await fetchFn(url, {
    headers: {
      Authorization: normalizedToken,
      "Convex-Client": "dashboard-0.0.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch table rate: ${response.statusText}`);
  }

  const respJSON: Array<
    [{ secs_since_epoch: number; nanos_since_epoch: number }, number | null]
  > = await response.json();

  return respJSON.map(([time, metricValue]) => ({
    time: parseDate(time),
    metric: metricValue,
  }));
}

/**
 * Fetch the UDF execution stats from the Convex API
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token
 * @param cursor - The cursor to start streaming from
 * @param fetchFn - Optional custom fetch function (for Tauri/CORS-free environments)
 * @returns The UDF execution stats
 */
export async function fetchUdfExecutionStats(
  deploymentUrl: string,
  authToken: string,
  cursor: number = 0,
  fetchFn: FetchFn = defaultFetch,
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
 * Aggregate function execution statistics into time-bucketed data
 * @param entries - Array of function execution entries
 * @param functionIdentifier - The function identifier to filter by
 * @param functionName - The function name (for fallback matching)
 * @param functionPath - The module path (for fallback matching)
 * @param timeStart - Start of time window in seconds
 * @param timeEnd - End of time window in seconds
 * @param numBuckets - Number of time buckets (default 30)
 * @returns AggregatedFunctionStats with arrays of metrics per bucket
 */
export function aggregateFunctionStats(
  entries: FunctionExecutionStats[],
  functionIdentifier: string,
  functionName: string,
  functionPath: string,
  timeStart: number,
  timeEnd: number,
  numBuckets: number = 30,
): AggregatedFunctionStats {
  const functionEntries = entries.filter((entry) => {
    return (
      entry.identifier === functionIdentifier ||
      entry.identifier === functionName ||
      entry.identifier === functionPath ||
      entry.identifier.includes(functionName) ||
      entry.identifier.includes(functionPath) ||
      (entry.identifier.includes(":") &&
        entry.identifier.split(":")[0] === functionPath)
    );
  });

  const invocations: number[] = Array(numBuckets).fill(0);
  const errors: number[] = Array(numBuckets).fill(0);
  const executionTimes: number[] = Array(numBuckets).fill(0);
  const cacheHits: number[] = Array(numBuckets).fill(0);
  const cacheMisses: number[] = Array(numBuckets).fill(0);

  const bucketSizeSeconds = (timeEnd - timeStart) / numBuckets;

  const executionTimesByBucket: number[][] = Array(numBuckets)
    .fill(null)
    .map(() => []);

  functionEntries.forEach((entry) => {
    let entryTime = entry.timestamp;
    if (entryTime > 1e12) {
      entryTime = Math.floor(entryTime / 1000);
    }

    if (entryTime < timeStart || entryTime > timeEnd) {
      return;
    }

    const bucketIndex = Math.floor((entryTime - timeStart) / bucketSizeSeconds);
    const clampedIndex = Math.max(0, Math.min(numBuckets - 1, bucketIndex));

    invocations[clampedIndex]++;

    if (!entry.success) {
      errors[clampedIndex]++;
    }

    if (entry.execution_time_ms != null && entry.execution_time_ms > 0) {
      executionTimesByBucket[clampedIndex].push(entry.execution_time_ms);
    }

    if (entry.udf_type === "query" || entry.udf_type === "Query") {
      if (entry.cachedResult === true) {
        cacheHits[clampedIndex]++;
      } else if (entry.cachedResult === false) {
        cacheMisses[clampedIndex]++;
      }
    }
  });

  executionTimesByBucket.forEach((times, index) => {
    if (times.length > 0) {
      const sorted = times.sort((a, b) => a - b);
      const medianIndex = Math.floor(sorted.length / 2);
      executionTimes[index] =
        sorted.length % 2 === 0
          ? (sorted[medianIndex - 1] + sorted[medianIndex]) / 2
          : sorted[medianIndex];
    }
  });

  const cacheHitRates: number[] = Array(numBuckets).fill(0);
  for (let i = 0; i < numBuckets; i++) {
    const totalCacheOps = cacheHits[i] + cacheMisses[i];
    if (totalCacheOps > 0) {
      cacheHitRates[i] = (cacheHits[i] / totalCacheOps) * 100;
    }
  }

  return {
    invocations,
    errors,
    executionTimes,
    cacheHits: cacheHitRates,
  };
}

/**
 * Fetch latency percentiles from the Convex API
 * Note: The latency_percentiles endpoint requires a specific UDF identifier.
 * For aggregate metrics, we calculate percentiles from execution stats.
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token for the Convex deployment
 * @param useMockData - Whether to use mock data instead of making API calls
 * @param fetchFn - Optional custom fetch function (for Tauri/CORS-free environments)
 * @returns The latency percentiles (p50, p95, p99) as array of [percentile, timeseries]
 */
export async function fetchLatencyPercentiles(
  deploymentUrl: string,
  authToken: string,
  useMockData = false,
  fetchFn: FetchFn = defaultFetch,
): Promise<any> {
  if (useMockData) {
    return [];
  }

  if (!deploymentUrl || !deploymentUrl.trim()) {
    throw new Error("Deployment URL is required");
  }
  if (!authToken || !authToken.trim()) {
    throw new Error("Auth token is required");
  }

  // Since latency_percentiles requires a specific function path,
  // we'll calculate aggregate latency from execution stats
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
    // For now, return current values (not time series)
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
 * Since udf_rate requires a specific function path, we'll use stream_udf_execution
 * to get aggregate invocation data and calculate rates ourselves.
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token for the Convex deployment
 * @param useMockData - Whether to use mock data instead of making API calls
 * @param fetchFn - Optional custom fetch function (for Tauri/CORS-free environments)
 * @returns The UDF invocation rate time series data
 */
export async function fetchUdfRate(
  deploymentUrl: string,
  authToken: string,
  useMockData = false,
  fetchFn: FetchFn = defaultFetch,
): Promise<any> {
  if (useMockData) {
    return [];
  }

  if (!deploymentUrl || !deploymentUrl.trim()) {
    throw new Error("Deployment URL is required");
  }
  if (!authToken || !authToken.trim()) {
    throw new Error("Auth token is required");
  }

  // Since udf_rate requires a specific function path, we'll aggregate
  // from stream_udf_execution instead
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const cursor = Math.floor(oneHourAgo / 1000) * 1000; // Convert to milliseconds

  try {
    const executionResponse = await fetchUdfExecutionStats(
      deploymentUrl,
      authToken,
      cursor,
      fetchFn,
    );    if (!executionResponse || !executionResponse.entries) {
      return [];
    }

    // Aggregate invocations by minute
    const now = Math.floor(Date.now() / 1000);
    const twentySixMinutesAgo = now - 26 * 60;
    const numBuckets = 26;
    const bucketSizeSeconds = (26 * 60) / numBuckets;    // Initialize buckets
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

/**
 * Fetch recent errors from logs
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token for the Convex deployment
 * @param useMockData - Whether to use mock data instead of making API calls
 * @param hoursBack - Number of hours to look back (default: 1)
 * @param fetchFn - Optional custom fetch function (for Tauri/CORS-free environments)
 * @returns Object with error count and top error messages
 */
export async function fetchRecentErrors(
  deploymentUrl: string,
  authToken: string,
  useMockData = false,
  hoursBack: number = 1,
  fetchFn: FetchFn = defaultFetch,
): Promise<{
  count: number;
  topErrors: Array<{ message: string; count: number }>;
}> {
  if (useMockData) {
    return {
      count: 0,
      topErrors: [],
    };
  }

  if (!deploymentUrl || !deploymentUrl.trim()) {
    throw new Error("Deployment URL is required");
  }
  if (!authToken || !authToken.trim()) {
    throw new Error("Auth token is required");
  }

  try {
    // Calculate cursor for last hour (approximate)
    const oneHourAgo = Date.now() - hoursBack * 60 * 60 * 1000;
    const cursor = Math.floor(oneHourAgo / 1000);

    // Fetch logs with a limit to avoid too much data
    const logsResponse = await fetchLogsFromApi({
      cursor: String(cursor),
      convexUrl: deploymentUrl,
      accessToken: authToken,
      limit: 1000, // Limit to last 1000 log entries
      useMockData: false,
      fetchFn,
    });

    // Filter for errors
    const errorLogs = logsResponse.logs.filter(
      (log) =>
        log.status === "error" ||
        log.status === "failure" ||
        log.log_level === "ERROR" ||
        log.error_message,
    );    // Count errors by message
    const errorCounts = new Map<string, number>();
    errorLogs.forEach((log) => {
      const message = log.error_message || log.message || "Unknown error";
      errorCounts.set(message, (errorCounts.get(message) || 0) + 1);
    });    // Get top 5 errors
    const topErrors = Array.from(errorCounts.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);    return {
      count: errorLogs.length,
      topErrors,
    };
  } catch (error) {
    // Return empty result on error rather than throwing
    return {
      count: 0,
      topErrors: [],
    };
  }
}