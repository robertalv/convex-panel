/**
 * Log Export Utilities
 * Export logs to various file formats using Tauri's file system
 */

import type { LogEntry } from "../types";
import type { LocalLogEntry } from "../hooks/useLocalLogStore";

export type ExportFormat = "json" | "csv" | "txt";

/**
 * Parse json_blob from LocalLogEntry to extract error and logLines
 */
function parseLocalLogEntry(log: LocalLogEntry): {
  error?: string;
  logLines?: any[];
} {
  try {
    const parsed = JSON.parse(log.json_blob);
    return {
      error: parsed.error,
      logLines: parsed.logLines,
    };
  } catch {
    return {};
  }
}

/**
 * Format a log entry for text output
 */
function formatLogToText(log: LogEntry | LocalLogEntry): string {
  // Check if it's a LocalLogEntry
  const isLocal = "ts" in log && "json_blob" in log;

  const timestamp = isLocal
    ? new Date((log as LocalLogEntry).ts).toISOString()
    : new Date((log as LogEntry).timestamp).toISOString();

  const success = isLocal
    ? ((log as LocalLogEntry).success ?? true)
    : (log as LogEntry).success;

  const status = success ? "SUCCESS" : "FAILURE";

  const durationMs = isLocal
    ? (log as LocalLogEntry).duration_ms
    : (log as LogEntry).durationMs;

  const duration = durationMs ? `${durationMs.toFixed(2)}ms` : "N/A";

  const functionName = isLocal
    ? (log as LocalLogEntry).function_name ||
      (log as LocalLogEntry).function_path ||
      "unknown"
    : (log as LogEntry).functionName ||
      (log as LogEntry).functionIdentifier ||
      "unknown";

  let text = `[${timestamp}] [${status}] ${functionName} (${duration})`;

  // Get error and logLines
  let error: string | undefined;
  let logLines: any[] | undefined;

  if (isLocal) {
    const parsed = parseLocalLogEntry(log as LocalLogEntry);
    error = parsed.error;
    logLines = parsed.logLines;
  } else {
    error = (log as LogEntry).error;
    logLines = (log as LogEntry).logLines;
  }

  if (error) {
    text += `\n  Error: ${error}`;
  }

  if (logLines && logLines.length > 0) {
    text += "\n  Console:";
    for (const line of logLines) {
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
export function logsToCSV(logs: (LogEntry | LocalLogEntry)[]): string {
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

  const rows = logs.map((log) => {
    // Check if it's a LocalLogEntry
    const isLocal = "ts" in log && "json_blob" in log;

    const id = log.id;
    const timestamp = isLocal
      ? new Date((log as LocalLogEntry).ts).toISOString()
      : new Date((log as LogEntry).timestamp).toISOString();

    const success = isLocal
      ? ((log as LocalLogEntry).success ?? true)
      : (log as LogEntry).success;

    const functionIdentifier = isLocal
      ? (log as LocalLogEntry).function_path
      : (log as LogEntry).functionIdentifier;

    const functionName = isLocal
      ? (log as LocalLogEntry).function_name
      : (log as LogEntry).functionName;

    const functionType = isLocal
      ? (log as LocalLogEntry).udf_type
      : (log as LogEntry).udfType;

    const durationMs = isLocal
      ? (log as LocalLogEntry).duration_ms
      : (log as LogEntry).durationMs;

    const requestId = isLocal
      ? (log as LocalLogEntry).request_id
      : (log as LogEntry).requestId;

    // Get error and logLines
    let error: string | undefined;
    let logLines: any[] | undefined;

    if (isLocal) {
      const parsed = parseLocalLogEntry(log as LocalLogEntry);
      error = parsed.error;
      logLines = parsed.logLines;
    } else {
      error = (log as LogEntry).error;
      logLines = (log as LogEntry).logLines;
    }

    return [
      escapeCSV(id),
      escapeCSV(timestamp),
      success ? "true" : "false",
      escapeCSV(functionIdentifier),
      escapeCSV(functionName),
      escapeCSV(functionType),
      durationMs?.toFixed(2) || "",
      escapeCSV(requestId),
      escapeCSV(error),
      escapeCSV(logLines ? JSON.stringify(logLines) : ""),
    ];
  });

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

/**
 * Convert logs to JSON format
 */
export function logsToJSON(
  logs: (LogEntry | LocalLogEntry)[],
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
export function logsToText(logs: (LogEntry | LocalLogEntry)[]): string {
  return logs.map(formatLogToText).join("\n\n");
}

/**
 * Convert logs to the specified format
 */
export function formatLogs(
  logs: (LogEntry | LocalLogEntry)[],
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
  logs: (LogEntry | LocalLogEntry)[],
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
  logs: (LogEntry | LocalLogEntry)[],
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
  logs: (LogEntry | LocalLogEntry)[],
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
