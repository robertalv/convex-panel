import { StyleSheet } from "react-native";

/**
 * Shared styles for BaseFilterSheet and its consumers (DataFilterSheet, LogFilterSheet)
 * These styles define the common UI patterns for filter sheets throughout the app.
 */
export const filterSheetStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerSide: {
    width: 60,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerDone: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "right",
  },
  headerClear: {
    fontSize: 15,
    fontWeight: "500",
  },
  body: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    marginTop: 8,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
  },
  actionButtons: {
    marginTop: 16,
    gap: 12,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
  clausesContainer: {
    gap: 12,
    marginBottom: 16,
  },
  whereLabel: {
    marginBottom: 4,
  },
  whereLabelText: {
    fontSize: 13,
    fontWeight: "500",
  },
  clauseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  pillButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  pillText: {
    fontSize: 14,
    fontWeight: "500",
  },
  moreButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  moreButtonText: {
    fontSize: 18,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    maxHeight: "60%",
    borderRadius: 12,
    overflow: "hidden",
  },
  modalItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalItemText: {
    fontSize: 16,
  },
  sectionLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  fieldList: {
    marginTop: 4,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  fieldIcon: {
    width: 28,
    alignItems: "center",
  },
  fieldName: {
    fontSize: 15,
    flex: 1,
  },
});
