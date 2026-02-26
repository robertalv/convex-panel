/**
 * Metrics and analytics functions
 * Handles fetching various metrics from the Convex API
 */

import { ROUTES, CONVEX_DASHBOARD_DOMAIN } from "./constants";
import { CONVEX_CLIENT_ID } from "./bigbrain";
import type {
  FetchFn,
  FunctionExecutionStats,
  StreamUdfExecutionResponse,
  AggregatedFunctionStats,
  TableMetric,
  TimeseriesBucket,
} from "./types";
import { normalizeToken, serializeDate, parseDate } from "./helpers";

// Default fetch function - uses native fetch
const defaultFetch: FetchFn = (input, init) => fetch(input, init);

/**
 * Fetch the failure rate from the Convex API
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token for the Convex deployment
 * @param fetchFn - Optional custom fetch function (for Tauri/CORS-free environments)
 * @returns The failure rate
 */
export const fetchFailureRate = async (
  deploymentUrl: string,
  authToken: string,
  fetchFn: FetchFn = defaultFetch,
) => {
  if (!deploymentUrl || !deploymentUrl.trim()) {
    throw new Error("Deployment URL is required");
  }
  if (!authToken || !authToken.trim()) {
    throw new Error("Auth token is required");
  }

  // Official Convex dashboard uses 1 hour window with 60 buckets for all health metrics
  const now = Math.floor(Date.now() / 1000);
  const oneHourAgo = now - 60 * 60; // 60 minutes = 3600 seconds

  const window = {
    start: {
      secs_since_epoch: oneHourAgo,
      nanos_since_epoch: 0,
    },
    end: {
      secs_since_epoch: now,
      nanos_since_epoch: 0,
    },
    num_buckets: 60,
  };

  const params = new URLSearchParams({
    window: JSON.stringify(window),
    k: "3",
  });

  const normalizedToken = normalizeToken(authToken);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetchFn(
      `${deploymentUrl}${ROUTES.FAILURE_RATE}?${params}`,
      {
        headers: {
          Authorization: normalizedToken,
          "Content-Type": "application/json",
          "Convex-Client": CONVEX_CLIENT_ID,
          Origin: `https://${CONVEX_DASHBOARD_DOMAIN}`,
          Referer: `https://${CONVEX_DASHBOARD_DOMAIN}/`,
        },
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch failure rate: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === "AbortError") {
      const timeoutError = new Error("Fetch failure rate timed out after 15s");
      timeoutError.name = "TimeoutError";
      throw timeoutError;
    }
    throw error;
  }
};

/**
 * Fetch the cache hit rate from the Convex API
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token for the Convex deployment
 * @param fetchFn - Optional custom fetch function (for Tauri/CORS-free environments)
 * @returns The cache hit rate
 */
export const fetchCacheHitRate = async (
  deploymentUrl: string,
  authToken: string,
  fetchFn: FetchFn = defaultFetch,
) => {
  if (!deploymentUrl || !deploymentUrl.trim()) {
    throw new Error("Deployment URL is required");
  }
  if (!authToken || !authToken.trim()) {
    throw new Error("Auth token is required");
  }

  // Official Convex dashboard uses 1 hour window with 60 buckets for all health metrics
  const now = Math.floor(Date.now() / 1000);
  const oneHourAgo = now - 60 * 60; // 60 minutes = 3600 seconds

  const window = {
    start: {
      secs_since_epoch: oneHourAgo,
      nanos_since_epoch: 0,
    },
    end: {
      secs_since_epoch: now,
      nanos_since_epoch: 0,
    },
    num_buckets: 60,
  };

  const params = new URLSearchParams({
    window: JSON.stringify(window),
    k: "3",
  });

  const normalizedToken = normalizeToken(authToken);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetchFn(
      `${deploymentUrl}${ROUTES.CACHE_HIT_RATE}?${params}`,
      {
        headers: {
          Authorization: normalizedToken,
          "Content-Type": "application/json",
          "Convex-Client": CONVEX_CLIENT_ID,
          Origin: `https://${CONVEX_DASHBOARD_DOMAIN}`,
          Referer: `https://${CONVEX_DASHBOARD_DOMAIN}/`,
        },
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch cache hit rate: ${response.statusText}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === "AbortError") {
      const timeoutError = new Error(
        "Fetch cache hit rate timed out after 15s",
      );
      timeoutError.name = "TimeoutError";
      throw timeoutError;
    }
    throw error;
  }
};

/**
 * Fetch the scheduler lag from the Convex API
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token for the Convex deployment
 * @param fetchFn - Optional custom fetch function (for Tauri/CORS-free environments)
 * @returns The scheduler lag
 */
export async function fetchSchedulerLag(
  deploymentUrl: string,
  authToken: string,
  fetchFn: FetchFn = defaultFetch,
): Promise<any> {
  if (!deploymentUrl || !deploymentUrl.trim()) {
    throw new Error("Deployment URL is required");
  }
  if (!authToken || !authToken.trim()) {
    throw new Error("Auth token is required");
  }

  // Official Convex dashboard uses 1 hour window with 60 buckets for scheduler lag
  const end = new Date();
  const start = new Date(end.getTime() - 60 * 60 * 1000); // 60 minutes

  const window = {
    start: {
      secs_since_epoch: Math.floor(start.getTime() / 1000),
      nanos_since_epoch: (start.getTime() % 1000) * 1000000,
    },
    end: {
      secs_since_epoch: Math.floor(end.getTime() / 1000),
      nanos_since_epoch: (end.getTime() % 1000) * 1000000,
    },
    num_buckets: 60,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetchFn(
        `${deploymentUrl}${ROUTES.SCHEDULED_JOB_LAG}?window=${encodeURIComponent(JSON.stringify(window))}`,
        {
          headers: {
            Authorization: normalizeToken(authToken),
            "Content-Type": "application/json",
            "Convex-Client": CONVEX_CLIENT_ID,
            Origin: `https://${CONVEX_DASHBOARD_DOMAIN}`,
            Referer: `https://${CONVEX_DASHBOARD_DOMAIN}/`,
          },
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof DOMException && error.name === "AbortError") {
        const timeoutError = new Error(
          "Fetch scheduler lag timed out after 15s",
        );
        timeoutError.name = "TimeoutError";
        throw timeoutError;
      }
      throw error;
    }
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetchFn(url, {
      headers: {
        Authorization: normalizedToken,
        "Convex-Client": CONVEX_CLIENT_ID,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

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
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === "AbortError") {
      const timeoutError = new Error("Fetch table rate timed out after 15s");
      timeoutError.name = "TimeoutError";
      throw timeoutError;
    }
    throw error;
  }
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

  // Add timeout to prevent indefinite hanging (stream endpoint can block)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetchFn(url, {
      headers: {
        Authorization: normalizeToken(authToken),
        "Content-Type": "application/json",
        "Convex-Client": CONVEX_CLIENT_ID,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

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
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      // Throw a typed error so callers can distinguish timeout from other failures
      const timeoutError = new Error(
        "[fetchUdfExecutionStats] Request timed out after 30s",
      );
      timeoutError.name = "TimeoutError";
      throw timeoutError;
    }
    throw error;
  }
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
 *
 * Accepts optional pre-fetched entries to avoid duplicate API calls.
 * If entries are provided, skips the network request entirely.
 *
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token for the Convex deployment
 * @param fetchFn - Optional custom fetch function (for Tauri/CORS-free environments)
 * @param prefetchedEntries - Optional pre-fetched execution stats to avoid duplicate API call
 * @returns The latency percentiles (p50, p95, p99) as array of [percentile, timeseries]
 */
export async function fetchLatencyPercentiles(
  deploymentUrl: string,
  authToken: string,
  fetchFn: FetchFn = defaultFetch,
  prefetchedEntries?: FunctionExecutionStats[],
): Promise<any> {
  if (!deploymentUrl || !deploymentUrl.trim()) {
    throw new Error("Deployment URL is required");
  }
  if (!authToken || !authToken.trim()) {
    throw new Error("Auth token is required");
  }

  // Use pre-fetched entries if available, otherwise fetch from API
  let entries: FunctionExecutionStats[];
  if (prefetchedEntries !== undefined) {
    entries = prefetchedEntries;
  } else {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const cursor = Math.floor(oneHourAgo / 1000) * 1000;
    const executionResponse = await fetchUdfExecutionStats(
      deploymentUrl,
      authToken,
      cursor,
      fetchFn,
    );
    entries = executionResponse?.entries || [];
  }

  if (entries.length === 0) {
    return [];
  }

  // Get execution times from entries
  const executionTimes: number[] = [];
  entries.forEach((entry: any) => {
    const execTime =
      entry.execution_time_ms ||
      entry.executionTimeMs ||
      entry.execution_time ||
      entry.executionTime;
    if (execTime && execTime > 0) {
      executionTimes.push(execTime);
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
}

/**
 * Fetch aggregate UDF invocation rate from the Convex API
 * Since udf_rate requires a specific function path, we'll use stream_udf_execution
 * to get aggregate invocation data and calculate rates ourselves.
 *
 * Accepts optional pre-fetched entries to avoid duplicate API calls.
 * If entries are provided, skips the network request entirely.
 *
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token for the Convex deployment
 * @param fetchFn - Optional custom fetch function (for Tauri/CORS-free environments)
 * @param prefetchedEntries - Optional pre-fetched execution stats to avoid duplicate API call
 * @returns The UDF invocation rate time series data
 */
export async function fetchUdfRate(
  deploymentUrl: string,
  authToken: string,
  fetchFn: FetchFn = defaultFetch,
  prefetchedEntries?: FunctionExecutionStats[],
): Promise<any> {
  if (!deploymentUrl || !deploymentUrl.trim()) {
    throw new Error("Deployment URL is required");
  }
  if (!authToken || !authToken.trim()) {
    throw new Error("Auth token is required");
  }

  // Use pre-fetched entries if available, otherwise fetch from API
  let entries: FunctionExecutionStats[];
  if (prefetchedEntries !== undefined) {
    entries = prefetchedEntries;
  } else {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const cursor = Math.floor(oneHourAgo / 1000) * 1000;
    const executionResponse = await fetchUdfExecutionStats(
      deploymentUrl,
      authToken,
      cursor,
      fetchFn,
    );
    entries = executionResponse?.entries || [];
  }

  // Aggregate invocations by minute — match official 1 hour / 60 buckets
  const now = Math.floor(Date.now() / 1000);
  const oneHourAgo = now - 60 * 60;
  const numBuckets = 60;
  const bucketSizeSeconds = (60 * 60) / numBuckets;

  // Initialize buckets
  const buckets: number[] = Array(numBuckets).fill(0);
  const timestamps: Array<{
    secs_since_epoch: number;
    nanos_since_epoch: number;
  }> = [];

  // Generate timestamps for each bucket
  for (let i = 0; i < numBuckets; i++) {
    const bucketTime = oneHourAgo + i * bucketSizeSeconds;
    timestamps.push({
      secs_since_epoch: bucketTime,
      nanos_since_epoch: 0,
    });
  }

  // Count invocations per bucket
  entries.forEach((entry: any) => {
    let entryTime =
      entry.timestamp || entry.execution_timestamp || entry.unix_timestamp;
    if (entryTime > 1e12) {
      entryTime = Math.floor(entryTime / 1000);
    }

    if (entryTime >= oneHourAgo && entryTime <= now) {
      const bucketIndex = Math.floor(
        (entryTime - oneHourAgo) / bucketSizeSeconds,
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
}

/**
 * Fetch recent errors from logs
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token for the Convex deployment
 * @param hoursBack - Number of hours to look back (default: 1)
 * @param fetchFn - Optional custom fetch function (for Tauri/CORS-free environments)
 * @returns Object with error count and top error messages
 */
export async function fetchRecentErrors(
  deploymentUrl: string,
  authToken: string,
  hoursBack: number = 1,
  fetchFn: FetchFn = defaultFetch,
): Promise<{
  count: number;
  topErrors: Array<{ message: string; count: number }>;
}> {
  if (!deploymentUrl || !deploymentUrl.trim()) {
    throw new Error("Deployment URL is required");
  }
  if (!authToken || !authToken.trim()) {
    throw new Error("Auth token is required");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    // Calculate cursor for last hour (approximate)
    const hoursAgo = Date.now() - hoursBack * 60 * 60 * 1000;
    const cursor = Math.floor(hoursAgo / 1000);

    // Fetch logs with a limit to avoid too much data
    const response = await fetchFn(
      `${deploymentUrl}${ROUTES.STREAM_FUNCTION_LOGS}?cursor=${cursor}`,
      {
        headers: {
          Authorization: normalizeToken(authToken),
          "Content-Type": "application/json",
          "Convex-Client": CONVEX_CLIENT_ID,
        },
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { count: 0, topErrors: [] };
    }

    const data = await response.json();
    const logs = data.entries || data.logs || [];

    // Filter for errors
    const errorLogs = logs.filter(
      (log: any) =>
        log.status === "error" ||
        log.status === "failure" ||
        log.log_level === "ERROR" ||
        log.error_message,
    );

    // Count errors by message
    const errorCounts = new Map<string, number>();
    errorLogs.forEach((log: any) => {
      const message = log.error_message || log.message || "Unknown error";
      errorCounts.set(message, (errorCounts.get(message) || 0) + 1);
    });

    // Get top 5 errors
    const topErrors = Array.from(errorCounts.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      count: errorLogs.length,
      topErrors,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === "AbortError") {
      const timeoutError = new Error("Fetch recent errors timed out after 15s");
      timeoutError.name = "TimeoutError";
      throw timeoutError;
    }
    console.error("[fetchRecentErrors] Error:", error);
    throw error;
  }
}
