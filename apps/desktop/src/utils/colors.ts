/**
 * Shared color constants for charts and visualizations in the desktop app.
 * Keep these in sync with any corresponding colors in the panel package.
 */

export const FUNCTION_ACTIVITY_COLORS = {
  queries: "#3B82F6",
  mutations: "#10B981",
  actions: "#F59E0B",
  scheduled: "#EF4444",
  http: "#8B5CF6",
} as const;

export type FunctionActivityColorKey = keyof typeof FUNCTION_ACTIVITY_COLORS;

