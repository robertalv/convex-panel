/**
 * Type definitions for health metrics and charts
 */

/**
 * Single time series data point (for simple charts)
 */
export interface TimeSeriesDataPoint {
  time: number;
  value: number | null;
}

/**
 * Line key definition for multi-series charts
 */
export interface LineKey {
  key: string;
  name: string;
  color: string;
}

/**
 * Multi-series chart data structure
 * Used for displaying multiple functions/series on one chart
 */
export interface MultiSeriesChartData {
  data: Record<string, any>[];
  lineKeys: LineKey[];
  xAxisKey: string;
}

/**
 * Deployment marker for charts
 */
export interface DeploymentMarker {
  time: string;
  timestamp: number;
}
