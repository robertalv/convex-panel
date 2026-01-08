import type { LogEntry } from "@convex-panel/shared";

/**
 * Normalize an identifier
 * @param id - The identifier to normalize
 * @returns The normalized identifier
 */
export const normalizeIdentifier = (id: string) =>
  id.replace(/\.js:/g, ":").replace(/\.js$/g, "");

/**
 * Format JSON for display
 */
export const formatJson = (obj: any) => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return String(obj);
  }
};

/**
 * Function to generate a unique ID for each log entry
 * @param log - The log entry to generate an ID for
 * @returns A unique ID for the log entry
 */
export const getLogId = (log: LogEntry) => {
  // For mock data, use a more unique identifier
  if (log.raw && log.raw.mockData) {
    return `mock-${log.timestamp}-${log.raw.mockId || Math.random().toString(36).substring(2, 10)}`;
  }

  // For real logs, use the existing logic
  return `${log.timestamp}-${log.function?.request_id || ""}-${log.message || ""}`;
};

/**
 * Generate a color for a function name
 * @param name - The name of the function to generate a color for
 * @returns A color for the function name
 */
export const generateColor = (name: string): string => {
  if (name === "_rest") return "#2196F3"; // Blue for "All other queries"

  // Hash the function name to get a consistent color
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate HSL color with good saturation and lightness
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
};

/**
 * Format a function name for display
 * @param name - The name of the function to format
 * @returns The formatted function name
 */
export const formatFunctionName = (name: string) => {
  if (name === "_rest") return "All other queries";
  return name.replace(".js:", ":");
};

/**
 * Get the next minute
 * @param timeStr - The time string to get the next minute for
 * @returns The next minute
 */
export const getNextMinute = (timeStr: string): string => {
  const date = new Date(`1970/01/01 ${timeStr}`);
  date.setMinutes(date.getMinutes() + 1);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

/**
 * Get the severity color for a given severity
 * @param severity - The severity to get the color for
 * @returns The severity color
 */
export const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical":
      return {
        bg: "rgba(239, 68, 68, 0.1)",
        border: "rgba(239, 68, 68, 0.3)",
        text: "var(--color-panel-error)",
        badge: "#dc2626",
      };
    case "high":
      return {
        bg: "rgba(249, 115, 22, 0.1)",
        border: "rgba(249, 115, 22, 0.3)",
        text: "#f97316",
        badge: "#ea580c",
      };
    case "medium":
      return {
        bg: "rgba(234, 179, 8, 0.1)",
        border: "rgba(234, 179, 8, 0.3)",
        text: "#eab308",
        badge: "#ca8a04",
      };
    default:
      return {
        bg: "rgba(107, 114, 128, 0.1)",
        border: "rgba(107, 114, 128, 0.3)",
        text: "var(--color-panel-text-muted)",
        badge: "#6b7280",
      };
  }
};

/**
 * Format a date and time for display
 * @param timestamp - The timestamp to format
 * @returns The formatted date and time
 */
export const formatDateTime = (timestamp: number) => {
  if (!timestamp) return "N/A";
  const date = new Date(timestamp);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

/**
 * Format a timestamp with relative time
 * @param timestamp - The timestamp to format
 * @returns The formatted timestamp and relative time
 */
export const formatTimestampWithRelative = (timestamp: number) => {
  if (!timestamp) return { absolute: "N/A", relative: "" };
  const date = new Date(timestamp);
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const milliseconds = date.getMilliseconds().toString().padStart(3, "0");
  const absolute = `${month} ${day}, ${hours}:${minutes}:${seconds}.${milliseconds}`;

  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const relative =
    diffMinutes === 1 ? "1 minute ago" : `${diffMinutes} minutes ago`;

  return { absolute, relative };
};

/**
 * Format bytes to human readable string
 * @param bytes - The number of bytes to format
 * @returns Human readable string (e.g., "1.5 MB")
 */
export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

/**
 * Format number in compact form (K, M suffixes)
 * @param value - The number to format
 * @returns Compact string (e.g., "1.5K", "2.3M")
 */
export const formatNumberCompact = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
};

/**
 * Generate unique page identifier for an insight (for URL/state tracking)
 * @param insight - The insight to generate an identifier for
 * @returns A unique string identifier
 */
export const getInsightPageIdentifier = (insight: {
  kind: string;
  componentPath: string | null;
  functionId: string;
  details?: { occTableName?: string };
}): string => {
  if (
    (insight.kind === "occRetried" ||
      insight.kind === "occFailedPermanently") &&
    insight.details?.occTableName
  ) {
    return `insight:${insight.kind}:${insight.componentPath}:${insight.functionId}:${insight.details.occTableName}`;
  }
  return `insight:${insight.kind}:${insight.componentPath}:${insight.functionId}`;
};

/**
 * Format function identifier with component path
 * @param functionId - The function identifier
 * @param componentPath - Optional component path
 * @returns Formatted function identifier
 */
export const functionIdentifierValue = (
  functionId: string,
  componentPath?: string | null,
): string => {
  if (componentPath) {
    return `${componentPath}/${functionId}`;
  }
  return functionId;
};
