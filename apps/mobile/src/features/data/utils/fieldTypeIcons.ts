/**
 * Field Type Icons and Colors
 *
 * Utility functions for getting icons and colors for Convex field types
 * Matching the desktop app's implementation
 */

/**
 * Get the icon name for a field type (maps to ICON_MAP in Icon component)
 */
export function getFieldTypeIcon(type: string | null): string {
  if (!type) return "field-string";

  switch (type) {
    case "String":
      return "field-string";
    case "Number":
    case "Float64":
    case "Int64":
      return "field-number";
    case "Boolean":
      return "field-boolean";
    case "Id":
      return "field-id";
    case "Object":
      return "field-object";
    case "Array":
      return "field-array";
    default:
      return "field-string";
  }
}

/**
 * Get the color for a field type (matching desktop app colors)
 */
export function getFieldTypeColor(
  type: string | null,
  theme: { dark: boolean; colors: any },
): string {
  if (!type) return theme.colors.textSecondary;

  // Match desktop app color scheme
  switch (type) {
    case "String":
      // Success/green color
      return theme.dark ? "#4ade80" : "#22c55e";
    case "Number":
    case "Float64":
    case "Int64":
      // Info/blue color
      return theme.dark ? "#60a5fa" : "#3b82f6";
    case "Boolean":
      // Warning/orange color
      return theme.dark ? "#fb923c" : "#f97316";
    case "Id":
      // Brand/purple color
      return theme.dark ? "#a78bfa" : "#9333ea";
    case "Object":
      // Muted gray
      return theme.colors.textSecondary;
    case "Array":
      // Info/blue color
      return theme.dark ? "#60a5fa" : "#3b82f6";
    case "Null":
      return theme.colors.textTertiary;
    default:
      return theme.colors.textSecondary;
  }
}
