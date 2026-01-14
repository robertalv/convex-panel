/**
 * Log filtering utilities ported from dashboard-common
 * Provides comprehensive filtering for logs by type, function, component, and text
 */

import type { UdfLog } from "../types";

// MultiSelectValue type - either "all" or an array of selected values
export type MultiSelectValue = "all" | string[];

export const ALL_LEVELS = ["DEBUG", "INFO", "WARN", "ERROR", "FAILURE"];
export const NENT_APP_PLACEHOLDER = "_App";

/**
 * Helper to parse function identifier from JSON string
 * Format: {"identifier": "functionName", "componentPath": "path", "componentId": "id"}
 */
export function functionIdentifierFromValue(value: string): {
  identifier: string;
  componentPath?: string;
  componentId?: string;
} {
  try {
    return JSON.parse(value);
  } catch {
    // Fallback for simple string identifiers (backward compatibility)
    return { identifier: value };
  }
}

/**
 * Helper to create function identifier JSON string
 */
export function functionIdentifierValue(
  identifier: string,
  componentPath?: string,
  componentId?: string,
): string {
  return JSON.stringify({ identifier, componentPath, componentId });
}

/**
 * Strip component ID from function identifier, keeping only identifier and path
 */
function stripComponentId(call: string): string {
  const f = functionIdentifierFromValue(call);
  return functionIdentifierValue(f.identifier, f.componentPath);
}

/**
 * Filter log entry by log levels (DEBUG, INFO, WARN, ERROR)
 */
function filterEntryForLogLevels(entry: UdfLog, levels: string[]): boolean {
  if (entry.kind !== "log") return true;
  const out = entry.output;

  return levels.some(
    (level) =>
      (level === "ERROR" && out.level === "FAILURE") ||
      (level === "INFO" && out.level === "LOG") ||
      out.level === level,
  );
}

/**
 * Filter log entry by status (success, failure)
 */
function filterEntryForStatuses(entry: UdfLog, statuses: string[]): boolean {
  if (entry.kind !== "outcome") return true;
  return statuses.includes(entry.outcome.status);
}

/**
 * Filter log entry by log line levels
 */
function filterEntryForLogLines(entry: UdfLog, levels: string[]): boolean {
  if (entry.kind !== "log") return true;
  const levelsArray = Array.from(levels);
  const out = entry.output;
  return levelsArray.some(
    (level) =>
      (level === "ERROR" && out.level === "FAILURE") ||
      (level === "INFO" && out.level === "LOG") ||
      out.level === level,
  );
}

/**
 * Filter log entry by raw text search
 * Searches in request ID, function name, and log messages
 */
function filterEntryForRawText(entry: UdfLog, text: string): boolean {
  const requestIdMatches = text.includes(entry.requestId);

  const lowerCaseText = text.toLocaleLowerCase();
  return (
    requestIdMatches ||
    entry.call.toLocaleLowerCase().includes(lowerCaseText) ||
    (entry.kind === "log"
      ? entry.output.messages
          .join(" ")
          .toLocaleLowerCase()
          .includes(lowerCaseText)
      : !!entry.error?.toLocaleLowerCase().includes(lowerCaseText))
  );
}

/**
 * Filter log entry by function and component (nent)
 */
function filterEntryForFunction(
  entry: UdfLog,
  functions: string[],
  selectedFunctions: string[] | "all",
  selectedNents: string[] | "all",
): boolean {
  const entryFunction =
    (entry.kind === "log" ? entry.output.subfunction : undefined) ?? entry.call;

  // If "all" is selected, return true for all entries
  if (selectedFunctions === "all") {
    if (selectedNents === "all") {
      return true;
    }
    return selectedNents.includes(
      functionIdentifierFromValue(entryFunction).componentPath ||
        NENT_APP_PLACEHOLDER,
    );
  }

  if (
    selectedNents !== "all" &&
    !selectedNents.includes(
      functionIdentifierFromValue(entryFunction).componentPath ||
        NENT_APP_PLACEHOLDER,
    )
  ) {
    return false;
  }

  return (
    selectedFunctions.includes(entryFunction) ||
    (!functions.includes(entryFunction) &&
      selectedFunctions.includes(functionIdentifierValue("_other")))
  );
}

/**
 * Main filtering function - applies all filters to logs
 */
export function filterLogs(
  {
    logTypes,
    functions,
    selectedFunctions,
    selectedNents,
    filter,
  }: {
    logTypes: MultiSelectValue;
    functions: string[];
    selectedFunctions: MultiSelectValue;
    selectedNents: MultiSelectValue;
    filter: string;
  },
  logs?: UdfLog[],
): UdfLog[] | undefined {
  // Handle logTypes "all" case
  const logTypesArray =
    logTypes === "all"
      ? ["success", "failure", "DEBUG", "INFO", "WARN", "ERROR"]
      : logTypes;

  const statuses = logTypesArray.filter(
    (l) => l === "success" || l === "failure",
  );
  const levels = logTypesArray.filter(
    (l) => l !== "success" && l !== "failure",
  );
  const functionsWithoutId = functions.map(stripComponentId);

  // Handle selectedFunctions "all" case
  const selectedFunctionsWithoutId =
    selectedFunctions === "all"
      ? "all"
      : selectedFunctions.map(stripComponentId);

  return logs?.filter(
    (entry) =>
      filterEntryForFunction(
        entry,
        functionsWithoutId,
        selectedFunctionsWithoutId,
        selectedNents,
      ) &&
      filterEntryForStatuses(entry, statuses) &&
      filterEntryForLogLevels(entry, levels) &&
      filterEntryForLogLines(entry, levels) &&
      (filter ? filterEntryForRawText(entry, filter) : true),
  );
}
