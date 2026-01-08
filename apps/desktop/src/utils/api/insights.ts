/**
 * Insights data processing utilities
 * Handles formatting and processing of insights data from the backend
 */

import type { Insight, HourlyCount } from './types';

export const rootComponentPath = '-root-component-';

/**
 * Get the 72-hour period for insights
 * Returns the period from 72 hours ago to now
 */
export function useInsightsPeriod(): { from: string; to: string } {
  const now = new Date();
  const hoursAgo72 = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  return {
    from: hoursAgo72.toISOString(),
    to: now.toISOString(),
  };
}

/**
 * Helper to pad and sort hourly data
 * Ensures continuous hourly data points for sparklines
 */
export function padAndSortHourlyData(
  hourlyCounts: HourlyCount[],
  periodStart?: string,
): HourlyCount[] {
  // Get current time to limit future data points
  const currentTime = new Date();
  if (hourlyCounts.length === 0) {
    // If no data but we have period start, create empty data from period start to now
    if (periodStart) {
      const startDate = new Date(periodStart);
      const endDate = new Date(currentTime);
      const result: HourlyCount[] = [];

      const currentDate = new Date(startDate);
      while (currentDate < endDate) {
        // Format the hour in the expected format for the chart (YYYY-MM-DD HH:00:00)
        // Instead of ISO format with T separator
        const year = currentDate.getUTCFullYear();
        const month = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getUTCDate()).padStart(2, '0');
        const hour = String(currentDate.getUTCHours()).padStart(2, '0');
        const formattedHour = `${year}-${month}-${day} ${hour}:00:00`;

        result.push({
          hour: formattedHour,
          count: 0,
        });

        currentDate.setHours(currentDate.getHours() + 1);
      }

      return result;
    }

    return [];
  }

  // Extract all hours and find min/max
  const hours = hourlyCounts.map((item) => item.hour);
  const hourToCountMap = new Map<string, number>();

  // Fill the map with existing data
  hourlyCounts.forEach((item) => {
    hourToCountMap.set(item.hour, item.count);
  });

  // Determine start and end dates
  let startDate: Date;
  let endDate: Date;

  if (periodStart) {
    // Use the provided period start and current time as end
    startDate = new Date(periodStart);
    endDate = new Date(currentTime);
  } else {
    // Otherwise use min/max from the data
    try {
      // Sort hours and determine continuous range
      const sortedHours = [...hours].sort();
      const minHour = sortedHours[0];
      const maxHour = sortedHours[sortedHours.length - 1];

      // Parse the hours to get start/end dates - handle both formats (with or without T separator)
      let minDate: string;
      let minHourNum: string;
      let maxDate: string;
      let maxHourNum: string;

      if (minHour.includes('T')) {
        [minDate, minHourNum] = minHour.split('T');
        [maxDate, maxHourNum] = maxHour.split('T');
      } else {
        // Fallback if T separator isn't present
        minDate = minHour.substring(0, 10);
        minHourNum = minHour.substring(11, 13) || '00';
        maxDate = maxHour.substring(0, 10);
        maxHourNum = maxHour.substring(11, 13) || '23';
      }

      startDate = new Date(`${minDate}T${minHourNum}:00:00Z`);
      endDate = new Date(`${maxDate}T${maxHourNum}:59:59Z`);

      // Ensure we don't add future data points
      if (endDate > currentTime) {
        endDate.setTime(currentTime.getTime());
      }

      // Check if dates are valid
      if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime())
      ) {
        throw new Error('Invalid date range');
      }
    } catch (error) {
      console.error('Error parsing date range:', error);
      // Return the original data if we can't parse the dates
      return hourlyCounts;
    }
  }

  // Generate all hours in the range
  const result: HourlyCount[] = [];
  const currentDate = new Date(startDate);

  while (currentDate < endDate) {
    // Format the hour in the expected format for the chart (YYYY-MM-DD HH:00:00)
    // Instead of ISO format with T separator
    const year = currentDate.getUTCFullYear();
    const month = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getUTCDate()).padStart(2, '0');
    const hour = String(currentDate.getUTCHours()).padStart(2, '0');
    const formattedHour = `${year}-${month}-${day} ${hour}:00:00`;

    // Use either the original count or 0 if no data exists for this hour
    // Try both ISO format and space-separated format for lookup
    const isoHour = currentDate.toISOString().slice(0, 13); // For lookup in the map
    const count =
      hourToCountMap.get(isoHour) || hourToCountMap.get(formattedHour) || 0;

    result.push({
      hour: formattedHour,
      count,
    });

    // Move to next hour
    currentDate.setHours(currentDate.getHours() + 1);
  }

  return result;
}

/**
 * Transform raw backend insights data to proper Insight objects
 * Backend returns tuples: [kind, functionId, componentPath, detailsJSON]
 */
export function transformInsightsData(
  rawData: any[],
  periodFrom: string,
): Insight[] {

  if (!Array.isArray(rawData)) {
    console.warn('[transformInsightsData] rawData is not an array:', {
      type: typeof rawData,
      value: rawData
    });
    return [];
  }

  if (rawData.length === 0) {
    return [];
  }

  const insights = rawData
    .map((d, index) => {
      try {
        // Handle tuple format: [kind, functionId, componentPath, detailsJSON]
        // But also handle if it's already an object
        let kind: Insight['kind'];
        let functionId: string;
        let componentPath: string | null;
        let detailsJSON: any;

        if (Array.isArray(d)) {
          // Tuple format: [kind, functionId, componentPath, detailsJSON]
          kind = d[0] as Insight['kind'];
          functionId = d[1] as string;
          componentPath = d[2] === null || d[2] === undefined ? null : (d[2] as string);
          detailsJSON = d[3];
        } else if (typeof d === 'object' && d !== null) {
          // Already an object format
          kind = d.kind as Insight['kind'];
          functionId = d.functionId as string;
          componentPath = d.componentPath === null || d.componentPath === undefined ? null : (d.componentPath as string);
          detailsJSON = d.details || d[3];
        } else {
          console.warn(`[transformInsightsData] Invalid data format at index ${index}:`, {
            value: d,
            type: typeof d
          });
          return null;
        }

        // Validate required fields
        if (!kind || !functionId) {
          console.warn(`[transformInsightsData] Missing required fields at index ${index}:`, {
            kind,
            functionId,
            hasKind: !!kind,
            hasFunctionId: !!functionId
          });
          return null;
        }

        // Parse details JSON
        let parsedDetails: any;
        try {
          if (typeof detailsJSON === 'string') {
            parsedDetails = JSON.parse(detailsJSON);
          } else {
            parsedDetails = detailsJSON || {};
          }
        } catch (error) {
          console.error(`[transformInsightsData] Error parsing insight details for item ${index}:`, {
            error,
            detailsJSON
          });
          parsedDetails = {};
        }

        // Pad and sort hourly counts if they exist
        if (
          parsedDetails.hourlyCounts &&
          Array.isArray(parsedDetails.hourlyCounts)
        ) {
          parsedDetails.hourlyCounts = padAndSortHourlyData(
            parsedDetails.hourlyCounts,
            periodFrom,
          );
        }

        // Handle rootComponentPath - convert it to null
        const finalComponentPath = componentPath === rootComponentPath ? null : componentPath;

        const insight: Insight = {
          kind,
          functionId,
          componentPath: finalComponentPath,
          details: parsedDetails,
        } as Insight;

        return insight;
      } catch (error) {
        console.error(`[transformInsightsData] Error transforming insight at index ${index}:`, {
          error,
          item: d
        });
        return null;
      }
    })
    .filter((insight): insight is Insight => {
      const isValid = insight !== null;
      if (!isValid) {
      }
      return isValid;
    });

  // Sort insights by priority
  insights.sort((a, b) => {
    const order: Record<Insight['kind'], number> = {
      documentsReadLimit: 0,
      bytesReadLimit: 1,
      occFailedPermanently: 2,
      documentsReadThreshold: 3,
      bytesReadThreshold: 4,
      occRetried: 5,
    };

    return order[a.kind] - order[b.kind];
  });

  return insights;
}

/**
 * Generate a unique page identifier for an insight for use in URL query parameters
 */
export function getInsightPageIdentifier(insight: Insight): string {
  // For OCC insights, include the table name in the page identifier
  if (
    (insight.kind === 'occRetried' ||
      insight.kind === 'occFailedPermanently') &&
    'details' in insight &&
    'occTableName' in insight.details
  ) {
    return `insight:${insight.kind}:${insight.componentPath}:${insight.functionId}:${insight.details.occTableName}`;
  }

  // For other insights, use the standard format
  return `insight:${insight.kind}:${insight.componentPath}:${insight.functionId}`;
}
