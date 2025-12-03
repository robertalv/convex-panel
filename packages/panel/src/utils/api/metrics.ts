/**
 * Metrics and analytics functions
 * Handles fetching various metrics from the Convex API
 */

import { ROUTES } from '../../utils/constants';
import type {
  FunctionExecutionStats,
  StreamUdfExecutionResponse,
  AggregatedFunctionStats,
} from '../../types';
import { mockFetchCacheHitRate, mockFetchFailureRate, mockFetchSchedulerLag } from '../mockData';
import { normalizeToken, serializeDate, parseDate } from './helpers';
import type { TimeseriesBucket, TableMetric } from './types';
import { CONVEX_DASHBOARD_DOMAIN } from '../constants';

/**
 * Fetch the failure rate from the Convex API
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token for the Convex deployment
 * @param useMockData - Whether to use mock data instead of making API calls
 * @returns The failure rate
 */
export const fetchFailureRate = async (
  deploymentUrl: string, 
  authToken: string, 
  useMockData = false
) => {
  if (useMockData) {
    return mockFetchFailureRate();
  }

  if (!deploymentUrl || !deploymentUrl.trim()) {
    throw new Error('Deployment URL is required');
  }
  if (!authToken || !authToken.trim()) {
    throw new Error('Auth token is required');
  }

  const now = Math.floor(Date.now() / 1000);
  const oneHourAgo = now - 3600;

  const window = {
    start: {
      secs_since_epoch: oneHourAgo,
      nanos_since_epoch: 0
    },
    end: {
      secs_since_epoch: now,
      nanos_since_epoch: 0
    },
    num_buckets: 60
  };

  const params = new URLSearchParams({
    window: JSON.stringify(window),
    k: '3'
  });

  const normalizedToken = normalizeToken(authToken);

  const response = await fetch(
    `${deploymentUrl}${ROUTES.FAILURE_RATE}?${params}`,
    {
      headers: {
        'Authorization': normalizedToken,
        'Content-Type': 'application/json',
        'Convex-Client': 'dashboard-0.0.0',
        'Origin': `https://${CONVEX_DASHBOARD_DOMAIN}`,
        'Referer': `https://${CONVEX_DASHBOARD_DOMAIN}/`
      }
    }
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
 * @returns The cache hit rate
 */
export const fetchCacheHitRate = async (
  deploymentUrl: string, 
  authToken: string, 
  useMockData = false
) => {
  if (useMockData) {
    return mockFetchCacheHitRate();
  }

  if (!deploymentUrl || !deploymentUrl.trim()) {
    throw new Error('Deployment URL is required');
  }
  if (!authToken || !authToken.trim()) {
    throw new Error('Auth token is required');
  }

  const now = Math.floor(Date.now() / 1000);
  const oneHourAgo = now - 3600;

  const window = {
    start: {
      secs_since_epoch: oneHourAgo,
      nanos_since_epoch: 0
    },
    end: {
      secs_since_epoch: now,
      nanos_since_epoch: 0
    },
    num_buckets: 60
  };

  const params = new URLSearchParams({
    window: JSON.stringify(window),
    k: '3'
  });

  const normalizedToken = normalizeToken(authToken);

  const response = await fetch(
    `${deploymentUrl}${ROUTES.CACHE_HIT_RATE}?${params}`,
    {
      headers: {
        'Authorization': normalizedToken,
        'Content-Type': 'application/json',
        'Convex-Client': 'dashboard-0.0.0',
        'Origin': `https://${CONVEX_DASHBOARD_DOMAIN}`,
        'Referer': `https://${CONVEX_DASHBOARD_DOMAIN}/`
      }
    }
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
 * @returns The scheduler lag
 */
export async function fetchSchedulerLag(
  deploymentUrl: string,
  authToken: string,
  useMockData = false
): Promise<any> {
  if (useMockData) {
    return mockFetchSchedulerLag();
  }

  if (!deploymentUrl || !deploymentUrl.trim()) {
    throw new Error('Deployment URL is required');
  }
  if (!authToken || !authToken.trim()) {
    throw new Error('Auth token is required');
  }

  const end = new Date();
  const start = new Date(end.getTime() - 60 * 60 * 1000);
  
  const window = {
    start: {
      secs_since_epoch: Math.floor(start.getTime() / 1000),
      nanos_since_epoch: (start.getTime() % 1000) * 1000000
    },
    end: {
      secs_since_epoch: Math.floor(end.getTime() / 1000),
      nanos_since_epoch: (end.getTime() % 1000) * 1000000
    },
    num_buckets: 60
  };

  try {
    const response = await fetch(
      `${deploymentUrl}${ROUTES.SCHEDULED_JOB_LAG}?window=${encodeURIComponent(JSON.stringify(window))}`,
      {
        headers: {
          'Authorization': normalizeToken(authToken),
          'Content-Type': 'application/json',
          'Convex-Client': 'dashboard-0.0.0',
          'Origin': `https://${CONVEX_DASHBOARD_DOMAIN}`,
          'Referer': `https://${CONVEX_DASHBOARD_DOMAIN}/`
        }
      }
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

  const response = await fetch(url, {
    headers: {
      Authorization: normalizedToken,
      'Convex-Client': 'dashboard-0.0.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch table rate: ${response.statusText}`);
  }

  const respJSON: Array<[{ secs_since_epoch: number; nanos_since_epoch: number }, number | null]> = await response.json();
  
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
 * @returns The UDF execution stats
 */
export async function fetchUdfExecutionStats(
  deploymentUrl: string,
  authToken: string,
  cursor: number = 0
): Promise<StreamUdfExecutionResponse> {
  const url = `${deploymentUrl}${ROUTES.STREAM_UDF_EXECUTION}?cursor=${cursor}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': normalizeToken(authToken),
      'Content-Type': 'application/json',
      'Convex-Client': 'dashboard-1.0.0',
    },
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Failed to fetch UDF execution stats: HTTP ${response.status} - ${responseText}`);
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
  numBuckets: number = 30
): AggregatedFunctionStats {
  const functionEntries = entries.filter((entry) => {
    return (
      entry.identifier === functionIdentifier ||
      entry.identifier === functionName ||
      entry.identifier === functionPath ||
      entry.identifier.includes(functionName) ||
      entry.identifier.includes(functionPath) ||
      (entry.identifier.includes(':') && entry.identifier.split(':')[0] === functionPath)
    );
  });

  const invocations: number[] = Array(numBuckets).fill(0);
  const errors: number[] = Array(numBuckets).fill(0);
  const executionTimes: number[] = Array(numBuckets).fill(0);
  const cacheHits: number[] = Array(numBuckets).fill(0);
  const cacheMisses: number[] = Array(numBuckets).fill(0);

  const bucketSizeSeconds = (timeEnd - timeStart) / numBuckets;

  const executionTimesByBucket: number[][] = Array(numBuckets).fill(null).map(() => []);

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

    if (entry.udf_type === 'query' || entry.udf_type === 'Query') {
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
      executionTimes[index] = sorted.length % 2 === 0
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

