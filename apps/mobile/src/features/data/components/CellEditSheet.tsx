/**
 * Cell Edit Bottom Sheet
 *
 * Bottom sheet for editing a single cell value in the table.
 * Uses keyboardBehavior="interactive" to automatically offset the sheet
 * by the keyboard height when keyboard opens.
 */

import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Keyboard,
} from "react-native";
import type BottomSheet from "@gorhom/bottom-sheet";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { useTheme } from "../../../contexts/ThemeContext";
import { BaseSheet } from "../../../components/sheets/BaseSheet";

// Snap points in pixels:
// - 200: Compact (handle + header + padding + small input)
// - 350: Expanded for larger content
// The sheet will be offset by keyboard height automatically via keyboardBehavior="interactive"
const SNAP_POINTS = [200, 180];

export interface CellEditSheetProps {
  sheetRef: React.RefObject<BottomSheet>;
  fieldName: string | null;
  value: any;
  onSave: (newValue: string) => void;
  onClose?: () => void;
}

export function CellEditSheet({
  sheetRef,
  fieldName,
  value,
  onSave,
  onClose,
}: CellEditSheetProps) {
  const { theme } = useTheme();
  const [editValue, setEditValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Update edit value when the sheet opens with a new value
  useEffect(() => {
    if (value !== null && value !== undefined) {
      // Format the value as a string for editing
      if (typeof value === "string") {
        setEditValue(value);
      } else if (typeof value === "object") {
        setEditValue(JSON.stringify(value, null, 2));
      } else {
        setEditValue(String(value));
      }
    } else {
      setEditValue("");
    }
  }, [value]);

  const handleSheetChange = useCallback(
    (index: number) => {
      console.log("[CellEditSheet] Sheet index changed:", index);
      setIsOpen(index >= 0);
      if (index === -1) {
        // Dismiss keyboard when sheet closes
        Keyboard.dismiss();
        onClose?.();
      }
    },
    [onClose],
  );

  const handleSave = useCallback(() => {
    // Dismiss keyboard before closing
    Keyboard.dismiss();
    onSave(editValue);
    onClose?.(); // Clear selection immediately before closing
    sheetRef.current?.close();
  }, [editValue, onSave, onClose, sheetRef]);

  const handleCancel = useCallback(() => {
    // Dismiss keyboard before closing
    Keyboard.dismiss();
    onClose?.(); // Clear selection immediately before closing
    sheetRef.current?.close();
  }, [onClose, sheetRef]);

  // Header left: Cancel button
  const headerLeft = (
    <TouchableOpacity
      onPress={handleCancel}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={[styles.cancelText, { color: theme.colors.primary }]}>
        Cancel
      </Text>
    </TouchableOpacity>
  );

  // Header right: Save button
  const headerRight = (
    <TouchableOpacity
      onPress={handleSave}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={[styles.saveText, { color: theme.colors.primary }]}>
        Save
      </Text>
    </TouchableOpacity>
  );

  return (
    <BaseSheet
      sheetRef={sheetRef}
      size={SNAP_POINTS}
      title={`Edit ${fieldName}`}
      headerLeft={headerLeft}
      headerRight={headerRight}
      onChange={handleSheetChange}
      enablePanDownToClose={false}
      handleKeyboard
      keyboardBehavior="interactive"
    >
      {/* Content */}
      <View style={styles.content}>
        {isOpen ? (
          <BottomSheetTextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
            value={editValue}
            onChangeText={setEditValue}
            placeholder="Enter value..."
            placeholderTextColor={theme.colors.textTertiary}
            multiline
            autoFocus
            textAlignVertical="top"
          />
        ) : (
          <View
            style={[
              styles.input,
              styles.skeleton,
              { backgroundColor: theme.colors.surface },
            ]}
          />
        )}
      </View>
    </BaseSheet>
  );
}

const styles = StyleSheet.create({
  cancelText: {
    fontSize: 16,
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "right",
  },
  content: {
    padding: 16,
    paddingTop: 8,
  },
  input: {
    height: 100,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
  skeleton: {
    borderWidth: 0,
  },
});
