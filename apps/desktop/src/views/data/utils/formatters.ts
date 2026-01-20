/**
 * Data View Formatters
 * Utility functions for formatting values in the data browser
 */

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
      const date = new Date(value.$date);
      if (!isNaN(date.getTime())) {
        return formatFullTimestamp(date.getTime());
      }
      return "Invalid date";
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
 * - IDs: yellow
 * - Dates/timestamps: blue
 * - Strings: neutral/grey (inherited text color)
 * - Numbers: blue
 * - Booleans: yellow
 * - Arrays: purple
 * - null/undefined: muted
 */
export function getValueColor(value: any, isIdField?: boolean): string {
  if (value === null || value === undefined) {
    return "var(--color-text-muted)";
  }

  // Check for ID fields (orange)
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
    return "var(--color-text-base)"; // neutral/grey for strings
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
    return "var(--color-text-base)"; // default for objects
  }
  return "var(--color-text-base)";
}

/**
 * Get the type label for a table field
 */
export function getFieldTypeLabel(field: {
  optional: boolean;
  shape: { type: string; tableName?: string };
}): string {
  const { shape, optional } = field;
  let label = shape.type;

  if (shape.type === "Id" && shape.tableName) {
    label = `id<${shape.tableName}>`;
  } else if (shape.type === "Array") {
    label = "array";
  } else if (shape.type === "Object") {
    label = "object";
  } else if (shape.type === "String") {
    label = "string";
  } else if (
    shape.type === "Number" ||
    shape.type === "Int64" ||
    shape.type === "Float64"
  ) {
    label = "number";
  } else if (shape.type === "Boolean") {
    label = "boolean";
  } else if (shape.type === "Null") {
    label = "null";
  } else if (shape.type === "Bytes") {
    label = "bytes";
  }

  return optional ? `${label}?` : label;
}

/**
 * Truncate a string with ellipsis
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Parse a JSON value safely
 */
export function parseJsonValue(input: string): {
  value: any;
  error: string | null;
} {
  const trimmed = input.trim();

  // Handle special values
  if (trimmed === "null") return { value: null, error: null };
  if (trimmed === "true") return { value: true, error: null };
  if (trimmed === "false") return { value: false, error: null };
  if (trimmed === "undefined") return { value: undefined, error: null };

  // Handle numbers
  if (/^-?\d+\.?\d*$/.test(trimmed)) {
    const num = Number(trimmed);
    if (!isNaN(num)) return { value: num, error: null };
  }

  // Handle JSON strings, arrays, objects
  try {
    const parsed = JSON.parse(trimmed);
    return { value: parsed, error: null };
  } catch {
    // If it doesn't start with quote but isn't valid JSON, treat as string
    if (
      !trimmed.startsWith('"') &&
      !trimmed.startsWith("[") &&
      !trimmed.startsWith("{")
    ) {
      return { value: trimmed, error: null };
    }
    return { value: null, error: "Invalid JSON" };
  }
}

/**
 * Convert documents to CSV format
 */
export function documentsToCSV(
  documents: Record<string, any>[],
  fields?: string[],
): string {
  if (documents.length === 0) return "";

  // Get all unique fields from documents if not provided
  const allFields =
    fields ||
    Array.from(new Set(documents.flatMap((doc) => Object.keys(doc)))).sort();

  // Create header row
  const header = allFields.join(",");

  // Create data rows
  const rows = documents.map((doc) => {
    return allFields
      .map((field) => {
        const value = doc[field];
        if (value === undefined || value === null) return "";
        if (typeof value === "string") {
          // Escape quotes and wrap in quotes
          return `"${value.replace(/"/g, '""')}"`;
        }
        if (typeof value === "object") {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return String(value);
      })
      .join(",");
  });

  return [header, ...rows].join("\n");
}

/**
 * Trigger a file download
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
