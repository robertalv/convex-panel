/**
 * Shared filter helpers for data and logs
 * - Minimal, domain-agnostic clause gating (enabled/value checks)
 * - Adapters for Convex data filters (server-side) and logs (client-side)
 */

import type { FilterExpression } from "../data/types";
import type { LogEntry } from "../../api/logs";

/**
 * Base64 encode a string (React Native compatible)
 * Uses Buffer which is available via react-native polyfills
 */
function base64Encode(str: string): string {
  console.log("[base64Encode] Input:", {
    str,
    length: str.length,
    hasBuffer: typeof Buffer !== "undefined",
    hasBtoa: typeof btoa !== "undefined",
  });

  // Use Buffer for reliable base64 encoding in React Native
  // Buffer is available via @react-native/js-polyfills or react-native-get-random-values
  if (typeof Buffer !== "undefined") {
    const result = Buffer.from(str, "utf8").toString("base64");
    console.log("[base64Encode] Using Buffer, result:", {
      result,
      length: result.length,
      lastChars: result.slice(-10),
    });
    return result;
  }

  // Fallback to btoa if Buffer is not available
  if (typeof btoa !== "undefined") {
    const result = btoa(str);
    console.log("[base64Encode] Using btoa, result:", {
      result,
      length: result.length,
      lastChars: result.slice(-10),
    });
    return result;
  }

  // Last resort: manual base64 encoding
  console.log("[base64Encode] Using manual encoding");
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  let i = 0;

  while (i < str.length) {
    const byte1 = str.charCodeAt(i++);
    const hasByte2 = i < str.length;
    const byte2 = hasByte2 ? str.charCodeAt(i++) : 0;
    const hasByte3 = i < str.length;
    const byte3 = hasByte3 ? str.charCodeAt(i++) : 0;

    const bitmap = (byte1 << 16) | (byte2 << 8) | byte3;

    result += chars.charAt((bitmap >> 18) & 63);
    result += chars.charAt((bitmap >> 12) & 63);
    result += hasByte2 ? chars.charAt((bitmap >> 6) & 63) : "=";
    result += hasByte3 ? chars.charAt(bitmap & 63) : "=";
  }

  console.log("[base64Encode] Manual result:", {
    result,
    length: result.length,
    lastChars: result.slice(-10),
  });
  return result;
}

/**
 * Check if a clause should participate in filtering.
 * Treats false/0 as valid values; skips null/undefined/empty-string.
 */
export function isActiveClause(clause: { enabled?: boolean; value?: any }) {
  if (clause.enabled === false) return false;
  const value = (clause as any).value;
  return !(value === null || value === undefined || value === "");
}

/**
 * Build an AND predicate over clauses using a matcher.
 */
export function buildPredicate<T, C>(
  clauses: C[],
  matcher: (clause: C, item: T) => boolean,
): (item: T) => boolean {
  if (!clauses || clauses.length === 0) {
    return () => true;
  }
  return (item: T) =>
    clauses.every((clause) => {
      if (!isActiveClause(clause as any)) return true;
      return matcher(clause, item);
    });
}

/**
 * Convert FilterExpression[] into a Convex filter string (base64-encoded FilterExpression).
 * The backend expects a FilterExpression object with a clauses array, not a simple filter object.
 */
export function buildConvexFilterString(
  filters?: FilterExpression[],
): string | null {
  if (!filters || filters.length === 0) {
    return null;
  }

  // Flatten all clauses from all filter expressions
  const clauses = filters.flatMap((f) => f.clauses || []);
  const activeClauses = clauses.filter(isActiveClause);

  if (activeClauses.length === 0) {
    return null;
  }

  // Build FilterExpression object matching backend expectations
  // The backend expects: { clauses: FilterClause[] }
  // Desktop includes id and enabled fields, so we should too
  const filterExpression: { clauses: typeof activeClauses } = {
    clauses: activeClauses,
  };

  // Base64 encode the filter expression (matching desktop behavior)
  // The backend does: JSON.parse(decode(filters))
  const jsonString = JSON.stringify(filterExpression);

  // Debug: Check for null bytes or extra characters
  console.log("[Filter Debug] JSON string:", {
    jsonString,
    length: jsonString.length,
    lastChar: jsonString.charCodeAt(jsonString.length - 1),
    hasNullByte: jsonString.indexOf("\0") !== -1,
  });

  const filterString = base64Encode(jsonString);

  console.log("[Filter Debug] Base64 result:", {
    filterString,
    length: filterString.length,
    lastChars: filterString.slice(-10),
  });

  return filterString;
}

/**
 * Apply log filters (functionType/status/logLevel) using case-insensitive match.
 */
export function filterLogsByClauses(
  logs: LogEntry[],
  filters: {
    clauses: Array<{ type: string; value: string; enabled?: boolean }>;
  },
): LogEntry[] {
  if (!filters?.clauses || filters.clauses.length === 0) return logs;

  const normalize = (val?: string | null) =>
    val === null || val === undefined ? "" : String(val).toLowerCase();

  // Filter out inactive clauses for debugging
  const activeClauses = filters.clauses.filter(isActiveClause);

  console.log("[filterLogsByClauses] Filtering logs:", {
    totalLogs: logs.length,
    totalClauses: filters.clauses.length,
    activeClauses: activeClauses.length,
    clausesDetail: activeClauses.map((c) => ({
      type: (c as any).type,
      value: (c as any).value,
      enabled: c.enabled,
    })),
  });

  const predicate = buildPredicate<
    LogEntry,
    { type: string; value: string; enabled?: boolean }
  >(filters.clauses, (clause, log) => {
    const value = normalize((clause as any).value);
    const clauseType = (clause as any).type;
    let matches = false;

    switch (clauseType) {
      case "functionType":
        matches = normalize(log.function?.type) === value;
        if (!matches && isActiveClause(clause as any)) {
          console.log("[filterLogsByClauses] functionType mismatch:", {
            expected: value,
            actual: normalize(log.function?.type),
            rawType: log.function?.type,
          });
        }
        return matches;
      case "status":
        matches = normalize(log.status) === value;
        return matches;
      case "logLevel":
        matches = normalize(log.log_level) === value;
        return matches;
      default:
        return true;
    }
  });

  const filtered = logs.filter(predicate);
  console.log("[filterLogsByClauses] Result:", {
    inputCount: logs.length,
    outputCount: filtered.length,
    filtered: logs.length - filtered.length,
  });

  return filtered;
}
