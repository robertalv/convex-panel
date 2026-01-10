import React, { useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useTheme } from "../../../contexts/ThemeContext";
import { Icon } from "../../../components/ui/Icon";
import type { TableDocument } from "../types";
import { formatConvexValue } from "../utils/formatters";

export interface DetailSheetProps {
  sheetRef: React.RefObject<BottomSheet>;
  document: TableDocument | null;
  onClose: () => void;
  onNavigatePrevious?: () => void;
  onNavigateNext?: () => void;
  currentIndex?: number;
  totalCount?: number;
}

export function DetailSheet({
  sheetRef,
  document,
  onClose,
  onNavigatePrevious,
  onNavigateNext,
  currentIndex,
  totalCount,
}: DetailSheetProps) {
  const { theme } = useTheme();
  
  // Compact snap point for action menu style
  const snapPoints = useMemo(() => ["40%"], []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  // If no document, keep sheet closed
  const initialIndex = document ? 0 : -1;

  const handleClose = useCallback(() => {
    sheetRef.current?.close();
    onClose();
  }, [sheetRef, onClose]);

  // Get document identifier - prefer name, email, or fallback to _id
  const getDocumentIdentifier = useCallback((doc: TableDocument): string => {
    // Try common identifier fields
    if (doc.name && typeof doc.name === "string") return doc.name;
    if (doc.email && typeof doc.email === "string") return doc.email;
    if (doc.title && typeof doc.title === "string") return doc.title;
    // Fallback to _id
    return doc._id;
  }, []);

  if (!document) return null;

  const identifier = getDocumentIdentifier(document);

  return (
    <BottomSheet
      ref={sheetRef}
      index={initialIndex}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: theme.colors.surface }}
      handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
      onChange={(index) => {
        if (index === -1) {
          onClose();
        }
      }}
    >
      <BottomSheetView style={styles.container}>
        {/* Header with document identifier */}
        <TouchableOpacity
          style={[
            styles.headerSection,
            {
              borderBottomColor: theme.colors.border,
            },
          ]}
          activeOpacity={0.7}
          onPress={() => {
            // Could expand to full detail view here
          }}
        >
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <Icon
                name="table"
                size={24}
                color={theme.colors.textSecondary}
              />
            </View>
            <View style={styles.headerText}>
              <Text
                style={[styles.identifierLarge, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {identifier}
              </Text>
              <Text
                style={[
                  styles.identifierSmall,
                  { color: theme.colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {identifier}
              </Text>
            </View>
          </View>
          <Icon
            name="chevron-forward"
            size={20}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Action buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                borderBottomColor: theme.colors.border,
              },
            ]}
            activeOpacity={0.7}
            onPress={() => {
              // TODO: Implement edit attributes
            }}
          >
            <View
              style={[
                styles.actionIconContainer,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <Icon name="pencil" size={18} color={theme.colors.text} />
            </View>
            <Text style={[styles.actionText, { color: theme.colors.text }]}>
              Edit attributes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                borderBottomColor: theme.colors.border,
              },
            ]}
            activeOpacity={0.7}
            onPress={() => {
              // TODO: Implement add comment
            }}
          >
            <View style={styles.actionIconContainer}>
              <View
                style={[
                  styles.commentIcon,
                  { backgroundColor: theme.colors.background },
                ]}
              >
                <Text style={[styles.commentText, { color: theme.colors.text }]}>
                  💬
                </Text>
              </View>
              <View
                style={[
                  styles.plusIcon,
                  {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
              >
                <Text style={styles.plusText}>+</Text>
              </View>
            </View>
            <Text style={[styles.actionText, { color: theme.colors.text }]}>
              Add Comment
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => {
              // TODO: Implement remove entry
            }}
          >
            <View
              style={[
                styles.deleteIconContainer,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <Text style={styles.deleteIconText}>🗑️</Text>
            </View>
            <Text
              style={[
                styles.actionText,
                { color: theme.colors.error || "#FF3B30" },
              ]}
            >
              Remove entry
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
  },
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  identifierLarge: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 2,
  },
  identifierSmall: {
    fontSize: 14,
  },
  actionsContainer: {
    paddingTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  actionIconContainer: {
    width: 24,
    height: 24,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  commentIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  commentText: {
    fontSize: 14,
  },
  plusIcon: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  plusText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
    lineHeight: 14,
  },
  deleteIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteIconText: {
    fontSize: 18,
  },
  actionText: {
    fontSize: 16,
    fontWeight: "400",
  },
});

