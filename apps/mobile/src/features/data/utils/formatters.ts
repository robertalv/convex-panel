/**
 * Data View Formatters
 * Utility functions for formatting values in the data browser
 * Matches desktop implementation for consistency
 */

export type ConvexValue =
  | null
  | bigint
  | number
  | boolean
  | string
  | ArrayBuffer
  | { [key: string]: ConvexValue }
  | ConvexValue[];

export interface FormattedValue {
  display: string;
  type: string;
  color: string;
  isTruncated?: boolean;
}

/**
 * Format a Convex ID for display
 */
export function formatId(id: string): string {
  if (!id || typeof id !== "string") return "";

  // Convex IDs are like: "jd7x8y9z0a1b2c3d4e5f6g7h"
  // Show first 8 chars for readability
  return id.length > 8 ? `${id.slice(0, 8)}...` : id;
}

/**
 * Check if a value looks like a Convex document ID
 */
export function isConvexId(value: any): boolean {
  if (typeof value !== "string") return false;
  // Convex IDs are typically 32 characters of alphanumeric
  return /^[a-zA-Z0-9_-]{20,}$/.test(value);
}

/**
 * Format a timestamp to a human-readable string
 * Format: "12/9/2025, 8:12:03 AM"
 */
export function formatTimestamp(value: number): string {
  const date = new Date(value);
  return date.toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/**
 * Format a full timestamp with time
 */
export function formatFullTimestamp(value: number): string {
  const date = new Date(value);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/**
 * Format a value for display in cells/cards
 */
export function formatValue(value: any, maxLength: number = 100): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";

  if (typeof value === "string") {
    if (value.length > maxLength) {
      return `"${value.slice(0, maxLength)}..."`;
    }
    return `"${value}"`;
  }

  if (typeof value === "number") {
    return value.toString();
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const preview = JSON.stringify(value);
    if (preview.length > maxLength) {
      return `[${value.length} items]`;
    }
    return preview;
  }

  if (typeof value === "object") {
    // Check for special Convex types
    if (value.$date) {
      return formatFullTimestamp(new Date(value.$date).getTime());
    }
    if (value.$bytes) {
      return `<bytes: ${value.$bytes.length} chars>`;
    }

    const preview = JSON.stringify(value);
    if (preview.length > maxLength) {
      const keys = Object.keys(value);
      return `{${keys.length} properties}`;
    }
    return preview;
  }

  return String(value);
}

/**
 * Get the display color for a value type
 * Colors match the panel styling:
 * - IDs: yellow (#eab308)
 * - Dates/timestamps: blue (#3b82f6)
 * - Strings: neutral/grey (inherited text color)
 * - Numbers: blue (#3b82f6)
 * - Booleans: yellow (#eab308)
 * - Arrays: purple (#a855f7)
 * - null/undefined: muted
 */
export function getValueColor(value: any, isIdField?: boolean): string {
  if (value === null || value === undefined) {
    return "#8B8B8B"; // muted gray
  }

  // Check for ID fields (yellow)
  if (isIdField || (typeof value === "string" && isConvexId(value))) {
    return "#eab308"; // yellow-500
  }

  // Check for date objects
  if (typeof value === "object" && value !== null) {
    if (value.$date) {
      return "#3b82f6"; // blue-500
    }
  }

  if (typeof value === "string") {
    return "#FFFFFF"; // neutral/white for strings (will use theme color in practice)
  }
  if (typeof value === "number") {
    return "#3b82f6"; // blue-500 for numbers
  }
  if (typeof value === "boolean") {
    return "#eab308"; // yellow-500 for booleans
  }
  if (Array.isArray(value)) {
    return "#a855f7"; // purple-500 for arrays
  }
  if (typeof value === "object") {
    return "#FFFFFF"; // default for objects (will use theme color)
  }
  return "#FFFFFF";
}

// Timestamp color constant (matches desktop)
export const TIMESTAMP_COLOR = "#3b82f6";

/**
 * Truncate long strings with ellipsis
 */
export function truncateString(
  str: string,
  maxLength: number = 50,
): { value: string; isTruncated: boolean } {
  if (!str || typeof str !== "string") {
    return { value: "", isTruncated: false };
  }

  if (str.length <= maxLength) {
    return { value: str, isTruncated: false };
  }

  return {
    value: `${str.slice(0, maxLength)}...`,
    isTruncated: true,
  };
}

/**
 * Format a Convex value for display with type info and color
 */
export function formatConvexValue(
  value: ConvexValue,
  maxLength: number = 50,
): FormattedValue {
  // Null/undefined
  if (value === null || value === undefined) {
    return {
      display: "null",
      type: "null",
      color: "#8B8B8B", // gray
    };
  }

  // Boolean
  if (typeof value === "boolean") {
    return {
      display: value ? "true" : "false",
      type: "boolean",
      color: "#F59E0B", // amber
    };
  }

  // Number
  if (typeof value === "number") {
    return {
      display: value.toString(),
      type: "number",
      color: "#10B981", // green
    };
  }

  // BigInt
  if (typeof value === "bigint") {
    return {
      display: `${value.toString()}n`,
      type: "bigint",
      color: "#10B981", // green
    };
  }

  // String
  if (typeof value === "string") {
    // Check if it looks like a Convex ID
    const isId = isConvexId(value);

    if (isId) {
      return {
        display: formatId(value),
        type: "id",
        color: "#eab308", // yellow-500 (matching desktop)
        isTruncated: value.length > 8,
      };
    }

    const { value: truncated, isTruncated } = truncateString(value, maxLength);
    return {
      display: `"${truncated}"`,
      type: "string",
      color: "#3B82F6", // blue
      isTruncated,
    };
  }

  // Array
  if (Array.isArray(value)) {
    const length = value.length;
    return {
      display: `Array(${length})`,
      type: "array",
      color: "#EC4899", // pink
    };
  }

  // ArrayBuffer
  if (value instanceof ArrayBuffer) {
    return {
      display: `ArrayBuffer(${value.byteLength})`,
      type: "bytes",
      color: "#6366F1", // indigo
    };
  }

  // Object
  if (typeof value === "object") {
    const keys = Object.keys(value);
    return {
      display: `Object{${keys.length}}`,
      type: "object",
      color: "#EC4899", // pink
    };
  }

  // Fallback
  return {
    display: String(value),
    type: "unknown",
    color: "#8B8B8B", // gray
  };
}

/**
 * Get preview fields from a document (first 3-4 non-system fields)
 */
export function getDocumentPreviewFields(
  doc: Record<string, ConvexValue>,
): Array<{ key: string; value: ConvexValue }> {
  const fields: Array<{ key: string; value: ConvexValue }> = [];

  for (const [key, value] of Object.entries(doc)) {
    // Skip _id and _creationTime (shown separately)
    if (key === "_id" || key === "_creationTime") continue;

    fields.push({ key, value });

    // Limit to 4 preview fields
    if (fields.length >= 4) break;
  }

  return fields;
}

/**
 * Format field name for display (convert camelCase to Title Case)
 */
export function formatFieldName(fieldName: string): string {
  if (!fieldName) return "";

  // Convert camelCase to Title Case
  return fieldName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format a number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}
