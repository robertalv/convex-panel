import type { APIResponse, ChartData, TimeRange } from './types';

/**
 * Transform API data to chart format (like Convex dashboard)
 * Handles null values by filling with defaults if there was previous data
 */
export const transformToChartData = (
  data: APIResponse | null,
  kind: 'cacheHitRate' | 'failureRate' = 'failureRate'
): ChartData => {
  if (!data || data.length === 0) {
    return { timestamps: [], functionData: new Map() };
  }

  // Collect all unique timestamps
  const allTimestamps = new Set<number>();
  data.forEach(([_, timeSeries]) => {
    timeSeries.forEach(([timestamp]) => {
      allTimestamps.add(timestamp.secs_since_epoch);
    });
  });

  const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

  // Map each function to its time series values (including nulls)
  const functionData = new Map<string, Map<number, number | null>>();
  data.forEach(([functionName, timeSeries]) => {
    const valueMap = new Map<number, number | null>();

    // First pass: store all values (including nulls)
    timeSeries.forEach(([timestamp, value]) => {
      valueMap.set(timestamp.secs_since_epoch, typeof value === 'number' ? value : null);
    });

    // Second pass: fill nulls with defaults if there was previous data (like Convex does)
    let hadDataAt = -1;
    sortedTimestamps.forEach((ts, index) => {
      const value = valueMap.get(ts);
      if (hadDataAt === -1 && value !== null && value !== undefined) {
        hadDataAt = index;
      }
      if (value === null && hadDataAt > -1) {
        // Fill null with default: 100 for cache hit, 0 for failure
        const defaultValue = kind === 'cacheHitRate' ? 100 : 0;
        valueMap.set(ts, defaultValue);
      }
    });

    functionData.set(functionName, valueMap);
  });

  return { timestamps: sortedTimestamps, functionData };
};

/**
 * Get time range from API response
 */
export const getTimeRange = (data: APIResponse | null): TimeRange => {
  if (!data || data.length === 0) {
    const now = new Date();
    return {
      start: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      end: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }

  const allTimestamps: number[] = [];
  data.forEach(([_, timeSeries]) => {
    timeSeries.forEach(([timestamp]) => {
      allTimestamps.push(timestamp.secs_since_epoch);
    });
  });

  if (allTimestamps.length === 0) {
    const now = new Date();
    return {
      start: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      end: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }

  const minTs = Math.min(...allTimestamps);
  const maxTs = Math.max(...allTimestamps);

  return {
    start: new Date(minTs * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    end: new Date(maxTs * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
};

/**
 * Calculate current time position (right edge of chart)
 */
export const getCurrentTimeX = (timestamps: number[], width: number = 300): number => {
  if (timestamps.length === 0) return width;
  const now = Math.floor(Date.now() / 1000);
  const minTs = Math.min(...timestamps);
  const maxTs = Math.max(...timestamps);
  // If current time is beyond the data range, show at right edge
  if (now >= maxTs) return width;
  // Calculate position based on time
  const progress = (now - minTs) / (maxTs - minTs);
  return progress * width;
};

/**
 * Transform function data to SVG path
 * Uses fixed 0-100% scale like Convex dashboard (0% at bottom, 100% at top)
 */
export const transformFunctionToSVGPath = (
  timestamps: number[],
  valueMap: Map<number, number | null>,
  height: number = 100,
  width: number = 300
): string => {
  if (timestamps.length === 0 || valueMap.size === 0) {
    return '';
  }

  const padding = 5;
  const usableHeight = height - 2 * padding;
  const minTs = Math.min(...timestamps);
  const maxTs = Math.max(...timestamps);
  const timeRange = maxTs - minTs;

  const points = timestamps
    .map((ts, index) => {
      const value = valueMap.get(ts);
      // If value is undefined or null, skip this point
      if (value === undefined || value === null) {
        return null;
      }
      // Clamp to 0-100 range (values from API are already percentages)
      const percentage = Math.max(0, Math.min(100, value as number));
      const x = timeRange > 0 ? ((ts - minTs) / timeRange) * width : (index / timestamps.length) * width;
      const y = height - padding - (percentage / 100) * usableHeight;
      return { x, y };
    })
    .filter((point): point is { x: number; y: number } => point !== null);

  if (points.length === 0) {
    return '';
  }

  let path = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x},${points[i].y}`;
  }

  return path;
};

