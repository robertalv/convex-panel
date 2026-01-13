/**
 * Log Export Utilities
 * Export logs to various file formats using Tauri's file system
 */

import type { LogEntry } from "../types";
import type { StoredLogEntry } from "./log-storage";

export type ExportFormat = "json" | "csv" | "txt";

/**
 * Format a log entry for text output
 */
function formatLogToText(log: LogEntry | StoredLogEntry): string {
  const timestamp = new Date(log.timestamp).toISOString();
  const status = log.success ? "SUCCESS" : "FAILURE";
  const duration = log.durationMs ? `${log.durationMs.toFixed(2)}ms` : "N/A";
  const functionName = log.functionName || log.functionIdentifier || "unknown";

  let text = `[${timestamp}] [${status}] ${functionName} (${duration})`;

  if (log.error) {
    text += `\n  Error: ${log.error}`;
  }

  if (log.logLines && log.logLines.length > 0) {
    text += "\n  Console:";
    for (const line of log.logLines) {
      const lineStr = typeof line === "string" ? line : JSON.stringify(line);
      text += `\n    ${lineStr}`;
    }
  }

  return text;
}

/**
 * Format a log entry for CSV output
 */
function escapeCSV(value: string | undefined | null): string {
  if (value === undefined || value === null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert logs to CSV format
 */
export function logsToCSV(logs: (LogEntry | StoredLogEntry)[]): string {
  const headers = [
    "id",
    "timestamp",
    "success",
    "functionIdentifier",
    "functionName",
    "functionType",
    "executionTime",
    "requestId",
    "error",
    "logLines",
  ];

  const rows = logs.map((log) => [
    escapeCSV(log.id),
    escapeCSV(new Date(log.timestamp).toISOString()),
    log.success ? "true" : "false",
    escapeCSV(log.functionIdentifier),
    escapeCSV(log.functionName),
    escapeCSV(log.udfType),
    log.durationMs?.toFixed(2) || "",
    escapeCSV(log.requestId),
    escapeCSV(log.error),
    escapeCSV(log.logLines ? JSON.stringify(log.logLines) : ""),
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

/**
 * Convert logs to JSON format
 */
export function logsToJSON(
  logs: (LogEntry | StoredLogEntry)[],
  pretty: boolean = true,
): string {
  if (pretty) {
    return JSON.stringify(logs, null, 2);
  }
  return JSON.stringify(logs);
}

/**
 * Convert logs to text format
 */
export function logsToText(logs: (LogEntry | StoredLogEntry)[]): string {
  return logs.map(formatLogToText).join("\n\n");
}

/**
 * Convert logs to the specified format
 */
export function formatLogs(
  logs: (LogEntry | StoredLogEntry)[],
  format: ExportFormat,
): string {
  switch (format) {
    case "json":
      return logsToJSON(logs);
    case "csv":
      return logsToCSV(logs);
    case "txt":
      return logsToText(logs);
    default:
      throw new Error(`Unknown export format: ${format}`);
  }
}

/**
 * Get file extension for format
 */
export function getFileExtension(format: ExportFormat): string {
  return format;
}

/**
 * Get MIME type for format
 */
export function getMimeType(format: ExportFormat): string {
  switch (format) {
    case "json":
      return "application/json";
    case "csv":
      return "text/csv";
    case "txt":
      return "text/plain";
    default:
      return "application/octet-stream";
  }
}

/**
 * Generate a default filename for export
 */
export function generateExportFilename(
  format: ExportFormat,
  deploymentId?: string,
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const deploymentPart = deploymentId ? `-${deploymentId.slice(0, 8)}` : "";
  return `convex-logs${deploymentPart}-${timestamp}.${format}`;
}

/**
 * Export logs to a file using Tauri's file dialog and fs
 */
export async function exportLogsToFile(
  logs: (LogEntry | StoredLogEntry)[],
  format: ExportFormat,
  deploymentId?: string,
): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    // Dynamic import to avoid issues when not in Tauri context
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeTextFile } = await import("@tauri-apps/plugin-fs");

    const defaultFilename = generateExportFilename(format, deploymentId);

    // Show save file dialog
    const filePath = await save({
      defaultPath: defaultFilename,
      filters: [
        {
          name: format.toUpperCase(),
          extensions: [format],
        },
      ],
      title: "Export Logs",
    });

    if (!filePath) {
      return { success: false, error: "Export cancelled" };
    }

    // Format the logs
    const content = formatLogs(logs, format);

    // Write to file
    await writeTextFile(filePath, content);

    console.log(`[log-export] Exported ${logs.length} logs to ${filePath}`);
    return { success: true, path: filePath };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("[log-export] Failed to export logs:", error);
    return { success: false, error };
  }
}

/**
 * Download logs in browser context (fallback for non-Tauri)
 */
export function downloadLogs(
  logs: (LogEntry | StoredLogEntry)[],
  format: ExportFormat,
  deploymentId?: string,
): void {
  const content = formatLogs(logs, format);
  const mimeType = getMimeType(format);
  const filename = generateExportFilename(format, deploymentId);

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
  console.log(`[log-export] Downloaded ${logs.length} logs as ${filename}`);
}

/**
 * Copy logs to clipboard
 */
export async function copyLogsToClipboard(
  logs: (LogEntry | StoredLogEntry)[],
  format: ExportFormat = "json",
): Promise<boolean> {
  try {
    const content = formatLogs(logs, format);
    await navigator.clipboard.writeText(content);
    console.log(`[log-export] Copied ${logs.length} logs to clipboard`);
    return true;
  } catch (err) {
    console.error("[log-export] Failed to copy to clipboard:", err);
    return false;
  }
}
