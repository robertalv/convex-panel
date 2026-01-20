/**
 * Log line parsing utilities
 * Converts raw log lines from backend into structured log output format
 */

import type { LogOutput, LogLevel } from "../components/LogOutput";

/**
 * Parse log lines from backend format to UI format
 * Backend sends log lines in format: "[LEVEL] message"
 * Example: "[INFO] Hello world" or "[ERROR] Something went wrong"
 */
export function parseLogLines(logLines: string[]): LogOutput[] {
  if (!logLines || logLines.length === 0) return [];

  const outputs: LogOutput[] = [];

  for (const line of logLines) {
    const parsed = parseLogLine(line);
    if (parsed) {
      outputs.push(parsed);
    }
  }

  return outputs;
}

/**
 * Parse a single log line
 * Format: "[LEVEL] message" or just "message"
 */
function parseLogLine(line: string): LogOutput | null {
  // Type guard - ensure line is a string
  if (typeof line !== "string" || !line || line.trim().length === 0)
    return null;

  // Try to extract log level from format: [LEVEL] message
  const levelMatch = line.match(/^\[([A-Z]+)\]\s*(.*)$/);

  if (levelMatch) {
    const level = levelMatch[1] as LogLevel;
    const message = levelMatch[2];

    return {
      level,
      messages: [message],
      isTruncated: false,
      isUnstructured: true, // Backend sends unstructured messages
    };
  }

  // No level prefix, treat as unstructured log message
  return {
    messages: [line],
    isTruncated: false,
    isUnstructured: true,
  };
}

/**
 * Get primary log level from log lines (for badge display)
 * Prioritizes ERROR > WARN > INFO > LOG > DEBUG
 */
export function getPrimaryLogLevel(logLines: string[]): LogLevel | undefined {
  if (!logLines || logLines.length === 0) return undefined;

  const levels: LogLevel[] = [];

  for (const line of logLines) {
    // Type guard - ensure line is a string
    if (typeof line !== "string") continue;
    const match = line.match(/^\[([A-Z]+)\]/);
    if (match) {
      levels.push(match[1] as LogLevel);
    }
  }

  // Priority order
  if (levels.includes("ERROR")) return "ERROR";
  if (levels.includes("WARN")) return "WARN";
  if (levels.includes("INFO")) return "INFO";
  if (levels.includes("LOG")) return "LOG";
  if (levels.includes("DEBUG")) return "DEBUG";

  return undefined;
}

/**
 * Merge all log lines into a single LogOutput for display
 * Used for single-line truncated display in list view
 */
export function mergeLogLines(logLines: string[]): LogOutput | null {
  if (!logLines || logLines.length === 0) return null;

  const primaryLevel = getPrimaryLogLevel(logLines);

  // Combine all messages, stripping level prefixes
  const messages = logLines
    .filter((line) => typeof line === "string") // Type guard
    .map((line) => {
      const match = line.match(/^\[([A-Z]+)\]\s*(.*)$/);
      return match ? match[2] : line;
    });

  return {
    level: primaryLevel,
    messages,
    isTruncated: false,
    isUnstructured: true,
  };
}
