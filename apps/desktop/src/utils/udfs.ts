import { FunctionExecutionStats } from "@convex-panel/shared/api";

/**
 * Normalize UDF type to a consistent format.
 */
export function normalizeUdfType(udfType: string | undefined | null): string {
  if (!udfType) return "action";
  const type = udfType.toLowerCase();
  if (type === "query" || type === "q") return "query";
  if (type === "mutation" || type === "m") return "mutation";
  if (type === "action" || type === "a") return "action";
  if (type === "httpaction" || type === "http" || type === "h")
    return "httpAction";
  return type;
}

/**
 * Check if a function is scheduled (cron or scheduled).
 */
export function isScheduledFunction(entry: FunctionExecutionStats): boolean {
  const identifier = entry.identifier?.toLowerCase() || "";
  return identifier.includes("cron") || identifier.includes("scheduled");
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}