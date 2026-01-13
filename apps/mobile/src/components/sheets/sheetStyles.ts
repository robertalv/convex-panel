/**
 * Sheet Styles
 *
 * Shared styles for bottom sheets across the app.
 * Provides consistent styling for list items, loading states, and empty states.
 */

import { StyleSheet, Platform } from "react-native";

/**
 * Shared styles for list-based bottom sheets
 */
export const sheetStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
  },

  // List content padding
  listContent: {
    paddingVertical: 8,
  },

  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  errorDetail: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },

  // Standard list item row
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },

  // Item title text
  itemTitle: {
    fontSize: 16,
    fontWeight: "400",
    flex: 1,
  },

  // Item content wrapper (for multi-line items)
  itemContent: {
    flex: 1,
  },

  // Item metadata text
  itemMeta: {
    fontSize: 12,
    marginTop: 2,
  },

  // Standard icon container (32x32 with rounded corners)
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  // Monospace font for code/identifiers
  mono: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },

  // Back button in header
  backButton: {
    padding: 4,
  },

  // Divider line
  divider: {
    height: 1,
    marginHorizontal: 16,
    marginVertical: 8,
  },

  // Menu item styles (for MenuSheet-like items)
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  menuItemLabel: {
    fontSize: 16,
    flex: 1,
  },
  menuItemBadge: {
    marginLeft: "auto",
  },
  menuItemChevron: {
    marginLeft: 8,
  },

  // Count badge in header
  headerCount: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },

  // Section header
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

/**
 * Create themed styles for sheet items
 * Use this when you need to apply theme colors to sheet items
 */
export function createThemedItemStyles(theme: {
  colors: {
    text: string;
    textSecondary: string;
    background: string;
    surface: string;
    border: string;
    primary: string;
    error: string;
  };
}) {
  return {
    itemTitle: { color: theme.colors.text },
    itemMeta: { color: theme.colors.textSecondary },
    emptyText: { color: theme.colors.textSecondary },
    errorText: { color: theme.colors.error },
    listBackground: { backgroundColor: theme.colors.background },
    divider: { backgroundColor: theme.colors.border },
    sectionHeaderText: { color: theme.colors.textSecondary },
  };
}
