/**
 * Format a timestamp for display in the log list
 * Returns format matching dashboard: "Jan 11, 16:25:41"
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const month = date.toLocaleString("default", { month: "short" });
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  return `${month} ${day}, ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Format a timestamp with relative time
 */
export function formatTimestampWithRelative(timestamp: number): {
  absolute: string;
  relative: string;
} {
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
}

/**
 * Format a full date/time string
 */
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return "0ms";
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  const seconds = ms / 1000;
  return `${seconds.toFixed(2)}s`;
}

/**
 * Format compute usage (GB-hours)
 */
export function formatCompute(memoryMb?: number, durationMs?: number): string {
  if (!memoryMb || !durationMs) return "0.0000000 GB-hr (0 MB for 0s)";
  const memoryGb = memoryMb / 1024;
  const durationHours = durationMs / (1000 * 60 * 60);
  const gbHours = memoryGb * durationHours;
  const durationSeconds = durationMs / 1000;
  return `${gbHours.toFixed(7)} GB-hr (${memoryMb} MB for ${durationSeconds.toFixed(2)}s)`;
}

/**
 * Get a short request ID (first 4 characters)
 */
export function getShortRequestId(requestId?: string): string {
  return requestId ? requestId.slice(0, 4) : "-";
}

/**
 * Get the type icon letter for a function type
 */
export function getFunctionTypeIcon(
  type?: string,
  topic?: string,
): "Q" | "M" | "A" | "H" | "L" {
  const normalizedType = type?.toLowerCase().trim();

  if (normalizedType === "query") return "Q";
  if (normalizedType === "mutation") return "M";
  // HTTP Actions should show as "H", not "A"
  if (normalizedType === "httpaction" || normalizedType === "http_action")
    return "H";
  if (normalizedType === "action") return "A";
  if (topic === "http") return "H";
  return "L";
}

/**
 * Parse function path to get component and function name parts
 */
export function parseFunctionPath(path?: string): {
  componentId: string;
  functionName: string;
} {
  if (!path) return { componentId: "", functionName: "" };

  const parts = path.split(":");
  if (parts.length > 1) {
    return {
      componentId: parts[0],
      functionName: parts.slice(1).join(":"),
    };
  }
  return { componentId: "", functionName: path };
}
