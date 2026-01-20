import React, { useCallback, useMemo, useRef, ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { Icon } from "../ui/Icon";

/**
 * Hook to create and manage a sheet ref with close/open helpers.
 * Use this in contexts or components that manage sheet state to avoid
 * duplicating closeSheet/openSheet logic.
 *
 * @example
 * // In a context provider
 * function MySheetProvider({ children }) {
 *   const sheet = useSheetRef();
 *   return (
 *     <MySheetContext.Provider value={sheet}>
 *       {children}
 *     </MySheetContext.Provider>
 *   );
 * }
 *
 * // In a sheet component
 * function MySheet() {
 *   const { sheetRef, closeSheet } = useMySheet();
 *   return (
 *     <BaseSheet sheetRef={sheetRef}>
 *       <Button onPress={closeSheet} title="Close" />
 *     </BaseSheet>
 *   );
 * }
 */
export function useSheetRef() {
  const sheetRef = useRef<BottomSheet>(null);

  const closeSheet = useCallback(() => {
    sheetRef.current?.close();
  }, []);

  const openSheet = useCallback((index = 0) => {
    sheetRef.current?.snapToIndex(index);
  }, []);

  return { sheetRef, closeSheet, openSheet };
}

export type SheetSize =
  | "small"
  | "medium"
  | "large"
  | "full"
  | "auto"
  | "dynamic"
  | "list";

/** Standard sheet dimension constants for list-based sizing */
export const LIST_SHEET_CONSTANTS = {
  /** Height of the sheet header (title + handle) */
  HEADER_HEIGHT: 60,
  /** Height of a standard list item row */
  ITEM_HEIGHT: 56,
  /** Standard vertical padding */
  PADDING: 32,
  /** Height for loading/empty state content */
  EMPTY_STATE_HEIGHT: 120,
  /** Maximum items visible before scrolling kicks in */
  MAX_VISIBLE_ITEMS: 8,
} as const;

export interface BaseSheetProps {
  sheetRef: React.RefObject<BottomSheet>;
  onClose?: () => void;
  onChange?: (index: number) => void;
  size?: SheetSize | (string | number)[];
  title?: string;
  showHeader?: boolean;
  headerLeft?: ReactNode | "back" | "close";
  headerRight?: ReactNode | "done" | "close";
  onHeaderLeftPress?: () => void;
  onHeaderRightPress?: () => void;
  doneLabel?: string;
  scrollable?: boolean;
  showBackdrop?: boolean;
  backdropOpacity?: number;
  handleKeyboard?: boolean;
  keyboardBehavior?: "interactive" | "extend" | "fillParent";
  enablePanDownToClose?: boolean;
  rawContent?: boolean;
  children: ReactNode;
  contentStyle?: object;
  /** Maximum height for dynamic sizing (in pixels). Only applies when size="dynamic" */
  maxDynamicContentSize?: number;
  /** Number of items in the list. Used with size="list" for automatic snap point calculation */
  itemCount?: number;
  /** Whether the list is loading. Used with size="list" */
  isLoading?: boolean;
  /** Height of each item (defaults to 56). Used with size="list" */
  itemHeight?: number;
  /** Additional height to add (e.g., for user info section). Used with size="list" */
  additionalHeight?: number;
}

interface ListSizeOptions {
  itemCount?: number;
  isLoading?: boolean;
  itemHeight?: number;
  additionalHeight?: number;
}

function getSizeSnapPoints(
  size: SheetSize | (string | number)[],
  maxHeight: number,
  listOptions?: ListSizeOptions,
): (string | number)[] | undefined {
  if (Array.isArray(size)) {
    return size;
  }

  switch (size) {
    case "small":
      return [280];
    case "medium":
      return ["50%", "75%"];
    case "large":
      return ["75%", "90%"];
    case "full":
      return [maxHeight];
    case "dynamic":
      return undefined;
    case "list": {
      // Calculate snap points for list-based content
      const {
        itemCount = 0,
        isLoading = false,
        itemHeight = LIST_SHEET_CONSTANTS.ITEM_HEIGHT,
        additionalHeight = 0,
      } = listOptions || {};

      const { HEADER_HEIGHT, PADDING, EMPTY_STATE_HEIGHT, MAX_VISIBLE_ITEMS } =
        LIST_SHEET_CONSTANTS;

      // For loading or empty state, show compact size
      if (isLoading || itemCount === 0) {
        return [HEADER_HEIGHT + EMPTY_STATE_HEIGHT + PADDING];
      }

      // Calculate content height based on visible items
      const visibleItems = Math.min(itemCount, MAX_VISIBLE_ITEMS);
      const contentHeight =
        HEADER_HEIGHT + visibleItems * itemHeight + PADDING + additionalHeight;

      // If more items than max visible, allow expanding
      if (itemCount > MAX_VISIBLE_ITEMS) {
        return [contentHeight, "80%"];
      }

      // Single snap point that exactly fits the content
      return [contentHeight];
    }
    case "auto":
    default:
      return ["50%", maxHeight];
  }
}

export function BaseSheet({
  sheetRef,
  onClose,
  onChange,
  size = "medium",
  title,
  showHeader,
  headerLeft,
  headerRight,
  onHeaderLeftPress,
  onHeaderRightPress,
  doneLabel = "Done",
  scrollable = false,
  showBackdrop = true,
  backdropOpacity = 0.5,
  handleKeyboard = true,
  keyboardBehavior: keyboardBehaviorProp,
  enablePanDownToClose = true,
  rawContent = false,
  children,
  contentStyle,
  maxDynamicContentSize,
  itemCount,
  isLoading,
  itemHeight,
  additionalHeight,
}: BaseSheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const topInset = insets.top + 10;
  const maxHeight = screenHeight - topInset;
  const enableDynamicSizing = size === "dynamic";

  const snapPoints = useMemo(
    () =>
      getSizeSnapPoints(size, maxHeight, {
        itemCount,
        isLoading,
        itemHeight,
        additionalHeight,
      }),
    [size, maxHeight, itemCount, isLoading, itemHeight, additionalHeight],
  );

  const renderBackdrop = useCallback(
    (props: any) =>
      showBackdrop ? (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={backdropOpacity}
          pressBehavior="close"
        />
      ) : null,
    [showBackdrop, backdropOpacity],
  );

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose?.();
      }
      onChange?.(index);
    },
    [onClose, onChange],
  );

  const closeSheet = useCallback(() => {
    sheetRef.current?.close();
  }, [sheetRef]);

  const handleLeftPress = useCallback(() => {
    if (onHeaderLeftPress) {
      onHeaderLeftPress();
    } else {
      closeSheet();
    }
  }, [onHeaderLeftPress, closeSheet]);

  const handleRightPress = useCallback(() => {
    if (onHeaderRightPress) {
      onHeaderRightPress();
    } else {
      closeSheet();
    }
  }, [onHeaderRightPress, closeSheet]);

  const renderHeaderLeft = () => {
    if (!headerLeft) return <View style={styles.headerSideLeft} />;

    if (headerLeft === "back") {
      return (
        <TouchableOpacity
          style={styles.headerSideLeft}
          onPress={handleLeftPress}
          activeOpacity={0.7}
        >
          <Icon
            name="chevron-back"
            size={20}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      );
    }

    if (headerLeft === "close") {
      return (
        <TouchableOpacity
          style={styles.headerSideLeft}
          onPress={handleLeftPress}
          activeOpacity={0.7}
        >
          <Icon name="x" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      );
    }

    return <View style={styles.headerSideLeft}>{headerLeft}</View>;
  };

  const renderHeaderRight = () => {
    if (!headerRight) return <View style={styles.headerSideRight} />;

    if (headerRight === "done") {
      return (
        <TouchableOpacity
          style={styles.headerSideRight}
          onPress={handleRightPress}
          activeOpacity={0.7}
        >
          <Text style={[styles.doneText, { color: theme.colors.primary }]}>
            {doneLabel}
          </Text>
        </TouchableOpacity>
      );
    }

    if (headerRight === "close") {
      return (
        <TouchableOpacity
          style={styles.headerSideRight}
          onPress={handleRightPress}
          activeOpacity={0.7}
        >
          <Icon name="x" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      );
    }

    return <View style={styles.headerSideRight}>{headerRight}</View>;
  };

  const renderHeader = () => {
    // Show header if explicitly requested OR if any header content exists
    const shouldShowHeader =
      showHeader ?? (!!title || !!headerLeft || !!headerRight);
    if (!shouldShowHeader) return null;

    return (
      <View
        style={[
          styles.header,
          {
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        {renderHeaderLeft()}
        {title ? (
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            {title}
          </Text>
        ) : (
          <View style={styles.headerTitle} />
        )}
        {renderHeaderRight()}
      </View>
    );
  };

  const ContentWrapper = scrollable ? BottomSheetScrollView : BottomSheetView;

  // Determine keyboard behavior
  const keyboardBehavior =
    keyboardBehaviorProp ?? (handleKeyboard ? "interactive" : undefined);

  // For rawContent, render header separately so BottomSheetFlatList etc. can be direct children
  if (rawContent) {
    return (
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enableDynamicSizing={enableDynamicSizing}
        maxDynamicContentSize={maxDynamicContentSize}
        topInset={topInset}
        enablePanDownToClose={enablePanDownToClose}
        backdropComponent={renderBackdrop}
        onChange={handleSheetChange}
        keyboardBehavior={keyboardBehavior}
        keyboardBlurBehavior={
          handleKeyboard || keyboardBehaviorProp ? "restore" : undefined
        }
        android_keyboardInputMode={
          handleKeyboard || keyboardBehaviorProp ? "adjustResize" : undefined
        }
        backgroundStyle={{ backgroundColor: theme.colors.surface }}
        handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
      >
        {renderHeader()}
        {children}
      </BottomSheet>
    );
  }

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enableDynamicSizing={enableDynamicSizing}
      maxDynamicContentSize={maxDynamicContentSize}
      topInset={topInset}
      enablePanDownToClose={enablePanDownToClose}
      backdropComponent={renderBackdrop}
      onChange={handleSheetChange}
      keyboardBehavior={keyboardBehavior}
      keyboardBlurBehavior={
        handleKeyboard || keyboardBehaviorProp ? "restore" : undefined
      }
      android_keyboardInputMode={
        handleKeyboard || keyboardBehaviorProp ? "adjustResize" : undefined
      }
      backgroundStyle={{ backgroundColor: theme.colors.surface }}
      handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
    >
      <ContentWrapper
        style={[
          // Only use flex: 1 when NOT using dynamic sizing
          !enableDynamicSizing && styles.content,
          { backgroundColor: theme.colors.background },
          contentStyle,
        ]}
        contentContainerStyle={
          scrollable && !enableDynamicSizing ? styles.scrollContent : undefined
        }
      >
        {renderHeader()}
        {children}
      </ContentWrapper>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: "relative",
    height: 44,
  },
  headerSideLeft: {
    flex: 1,
    alignItems: "flex-start",
    zIndex: 1,
  },
  headerSideRight: {
    flex: 1,
    alignItems: "flex-end",
    zIndex: 1,
  },
  headerTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    pointerEvents: "none",
  },
  doneText: {
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
});

export default BaseSheet;
