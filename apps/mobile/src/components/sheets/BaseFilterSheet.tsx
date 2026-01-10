/**
 * BaseFilterSheet - Shared bottom sheet component for filters
 * Provides common structure and behavior for DataFilterSheet and LogFilterSheet
 */

import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { View, Text, TouchableOpacity } from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import type BottomSheetType from "@gorhom/bottom-sheet";
import { useTheme } from "../../contexts/ThemeContext";
import { Icon } from "../ui/Icon";
import { filterSheetStyles } from "./filterSheetStyles";

export interface BaseFilterClause {
  id: string;
  enabled?: boolean;
  [key: string]: any;
}

export interface BaseFilterSheetConfig<T extends BaseFilterClause> {
  // Title configuration
  overviewTitle: string;
  selectTitle: string;
  emptyTitle: string;
  emptySubtitle: string;

  // Render functions
  renderClauseRow: (
    clause: T,
    onEdit: () => void,
    onRemove: () => void,
    onUpdateClause: (id: string, updates: Partial<T>) => void,
    selectedClauseId: string | null,
    setSelectedClauseId: (id: string | null) => void,
  ) => ReactNode;
  renderSelectMode: (
    onSelect: (updates: Partial<T>) => void,
    editingClauseId: string | null,
    editingPart?: "field" | "operator" | "value",
  ) => ReactNode;

  // Optional modal picker
  renderModalPicker?: (
    visible: boolean,
    selectedClauseId: string | null,
    onClose: () => void,
    onSelect: (value: any) => void,
  ) => ReactNode;

  // Optional nested bottom sheet picker (for operators, values, etc.)
  renderNestedPicker?: (
    selectedClauseId: string | null,
    onClose: () => void,
    onSelect: (value: any) => void,
  ) => ReactNode;
  nestedPickerTitle?: string;
}

export interface BaseFilterSheetProps<T extends BaseFilterClause> {
  sheetRef: React.RefObject<BottomSheet>;
  filters: { clauses: T[] };
  onChangeFilters: (filters: { clauses: T[] }) => void;
  config: BaseFilterSheetConfig<T>;
  onSheetClose?: () => void;
}

type SheetMode = "overview" | "select";

export function BaseFilterSheet<T extends BaseFilterClause>({
  sheetRef,
  filters,
  onChangeFilters,
  config,
  onSheetClose,
}: BaseFilterSheetProps<T>) {
  const { theme } = useTheme();
  const [mode, setMode] = useState<SheetMode>("overview");
  const [editingClauseId, setEditingClauseId] = useState<string | null>(null);
  const [editingPart, setEditingPart] = useState<"field" | "operator" | "value" | undefined>(undefined);
  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(null);
  const [modalPickerVisible, setModalPickerVisible] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const nestedPickerRef = useRef<BottomSheetType>(null);

  const filterCount = filters.clauses?.length ?? 0;

  // Dynamic snap points based on filter count
  const snapPoints = useMemo(() => {
    const baseHeight = 25;
    const heightPerFilter = 8;
    const dynamicHeight = Math.min(
      baseHeight + filterCount * heightPerFilter,
      70,
    );
    return [`${dynamicHeight}%`, "70%"];
  }, [filterCount]);

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

  // Helper to update filters
  const updateFilters = useCallback(
    (updater: (current: { clauses: T[] }) => { clauses: T[] }) => {
      const next = updater(filters);
      onChangeFilters(next);
    },
    [filters, onChangeFilters],
  );

  const handleSheetChange = useCallback(
    (index: number) => {
      setIsSheetOpen(index !== -1);
      if (index === -1) {
        // Sheet is closed - remove empty clauses (check for empty string, null, undefined)
        const cleaned = {
          clauses: (filters.clauses ?? []).filter((c: any) => {
            const isActive = c.value !== "" && c.value != null;
            return isActive;
          }),
        };
        if (cleaned.clauses.length !== filters.clauses?.length) {
          onChangeFilters(cleaned as { clauses: T[] });
        }
        setMode("overview");
        setEditingClauseId(null);
        setEditingPart(undefined);
        onSheetClose?.();
      } else if (index === 0 && mode === "select") {
        setMode("overview");
        setEditingClauseId(null);
        setEditingPart(undefined);
      }
    },
    [mode, filters, onChangeFilters, onSheetClose],
  );

  // Adjust sheet height when filters change (only if sheet is already open)
  useEffect(() => {
    if (isSheetOpen && mode === "overview") {
      sheetRef.current?.snapToIndex(0);
    }
  }, [filterCount, mode, isSheetOpen, sheetRef]);

  // Open nested picker when selectedClauseId is set and renderNestedPicker exists
  useEffect(() => {
    if (selectedClauseId && config.renderNestedPicker) {
      // Use a timeout with retry to ensure the BottomSheet is mounted and ready
      let retries = 0;
      const maxRetries = 10;
      
      const tryOpen = () => {
        if (nestedPickerRef.current) {
          try {
            nestedPickerRef.current.snapToIndex(0);
          } catch (error) {
            // Retry if it fails
            if (retries < maxRetries) {
              retries++;
              setTimeout(tryOpen, 50);
            }
          }
        } else if (retries < maxRetries) {
          retries++;
          setTimeout(tryOpen, 50);
        }
      };
      
      // Start trying after a short delay
      const timeoutId = setTimeout(tryOpen, 100);
      return () => clearTimeout(timeoutId);
    } else if (!selectedClauseId && nestedPickerRef.current) {
      // Close nested picker when selectedClauseId is cleared
      nestedPickerRef.current.close();
    }
  }, [selectedClauseId, config.renderNestedPicker]);

  const handleAddFilter = useCallback(() => {
    setEditingClauseId(null);
    setMode("select");
    sheetRef.current?.snapToIndex(1);
  }, [sheetRef]);

  const handleUpdateClause = useCallback(
    (id: string, updates: Partial<T>) => {
      updateFilters((current) => ({
        clauses: (current.clauses ?? []).map((c) =>
          c.id === id ? { ...c, ...updates } : c,
        ),
      }));
    },
    [updateFilters],
  );

  const handleRemoveClause = useCallback(
    (id: string) => {
      updateFilters((current) => ({
        clauses: (current.clauses ?? []).filter((c) => c.id !== id),
      }));
    },
    [updateFilters],
  );

  const handleDone = useCallback(() => {
    // Remove any clauses without values before closing (check for empty string, null, undefined)
    updateFilters((current) => {
      const cleaned = {
        clauses: (current.clauses ?? []).filter((c: any) => {
          const isActive = c.value !== "" && c.value != null;
          return isActive;
        }),
      };
      return cleaned;
    });
    sheetRef.current?.close();
  }, [updateFilters, sheetRef]);

  const handleClearAll = useCallback(() => {
    onChangeFilters({ clauses: [] });
  }, [onChangeFilters]);

  const handleSelectUpdate = useCallback(
    (updates: Partial<T>) => {
      if (editingClauseId) {
        handleUpdateClause(editingClauseId, updates);
        setEditingClauseId(null);
        setEditingPart(undefined);
      } else {
        // Create new clause
        const newClause = {
          id: `${Date.now()}`,
          enabled: true,
          ...updates,
        } as T;

        updateFilters((current) => {
          const updated = {
            clauses: [...(current.clauses ?? []), newClause],
          };
          return updated;
        });
      }
      setMode("overview");
    },
    [editingClauseId, handleUpdateClause, updateFilters],
  );

  const handleEditClause = useCallback(
    (id: string, part?: "field" | "operator" | "value") => {
      setEditingClauseId(id);
      setEditingPart(part);
      setMode("select");
      sheetRef.current?.snapToIndex(1);
    },
    [sheetRef],
  );


  const renderOverview = () => {
    const hasFilters = filters.clauses && filters.clauses.length > 0;

    return (
      <View style={filterSheetStyles.body}>
        {!hasFilters && (
          <>
            <View style={filterSheetStyles.emptyState}>
              <Text
                style={[
                  filterSheetStyles.emptyTitle,
                  { color: theme.colors.text },
                ]}
              >
                {config.emptyTitle}
              </Text>
              <Text
                style={[
                  filterSheetStyles.emptySubtitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {config.emptySubtitle}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                filterSheetStyles.addButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleAddFilter}
              activeOpacity={0.8}
            >
              <Icon name="filter" size={18} color="#FFFFFF" />
              <Text style={filterSheetStyles.addButtonText}>Add filter</Text>
            </TouchableOpacity>
          </>
        )}

        {hasFilters && (
          <>
            <View style={filterSheetStyles.clausesContainer}>
              {/* Where label */}
              <View style={filterSheetStyles.whereLabel}>
                <Text
                  style={[
                    filterSheetStyles.whereLabelText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Where
                </Text>
              </View>

              {/* Filter clauses */}
              {filters.clauses.map((clause) => (
                <React.Fragment key={clause.id}>
                  {config.renderClauseRow(
                    clause,
                    () => handleEditClause(clause.id, "field"),
                    () => handleRemoveClause(clause.id),
                    handleUpdateClause,
                    selectedClauseId,
                    (id) => {
                      if (id) {
                        // Check if this is for operator selection (DataFilterSheet) vs value selection (LogFilterSheet)
                        const clause = filters.clauses?.find((c) => c.id === id);
                        // If clause has 'op' field, it's a FilterClause and we're selecting operator
                        // If clause has 'type' field, it's a LogFilterClause and we're selecting value
                        if (clause && 'op' in clause) {
                          // This is operator selection in DataFilterSheet - use edit mode
                          handleEditClause(id, "operator");
                        } else if (clause && 'type' in clause) {
                          // This is value selection in LogFilterSheet - use edit mode
                          handleEditClause(id, "value");
                        } else if (config.renderNestedPicker) {
                          // Fallback to nested picker for other cases
                          setSelectedClauseId(id);
                        } else if (config.renderModalPicker) {
                          setSelectedClauseId(id);
                          setModalPickerVisible(true);
                        }
                      } else {
                        setSelectedClauseId(null);
                      }
                    },
                  )}
                </React.Fragment>
              ))}
            </View>
            <View style={filterSheetStyles.actionButtons}>
              <TouchableOpacity
                style={[
                  filterSheetStyles.addButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={handleAddFilter}
                activeOpacity={0.8}
              >
                <Icon name="filter" size={18} color="#FFFFFF" />
                <Text style={filterSheetStyles.addButtonText}>Add filter</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  };

  const title = mode === "overview" ? config.overviewTitle : config.selectTitle;

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      onChange={handleSheetChange}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: theme.colors.surface }}
      handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
    >
      <BottomSheetView style={filterSheetStyles.container}>
        {/* Header */}
        <View style={filterSheetStyles.header}>
          <View style={filterSheetStyles.headerSide}>
            {mode === "select" ? (
              <TouchableOpacity
                onPress={() => {
                  setEditingClauseId(null);
                  setMode("overview");
                  sheetRef.current?.snapToIndex(0);
                }}
                activeOpacity={0.7}
              >
                <Icon
                  name="chevron-back"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            ) : filterCount > 0 ? (
              <TouchableOpacity onPress={handleClearAll} activeOpacity={0.7}>
                <Text
                  style={[
                    filterSheetStyles.headerClear,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Clear all
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <Text
            style={[
              filterSheetStyles.headerTitle,
              { color: theme.colors.text },
            ]}
          >
            {title}
          </Text>

          <TouchableOpacity
            style={filterSheetStyles.headerSide}
            onPress={handleDone}
            activeOpacity={0.7}
          >
            <Text
              style={[
                filterSheetStyles.headerDone,
                { color: theme.colors.primary },
              ]}
            >
              {mode === "overview" ? "Done" : "Apply"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {mode === "overview"
          ? renderOverview()
          : config.renderSelectMode(handleSelectUpdate, editingClauseId, editingPart)}
      </BottomSheetView>

      {/* Optional Modal Picker */}
      {config.renderModalPicker &&
        config.renderModalPicker(
          modalPickerVisible,
          selectedClauseId,
          () => {
            setModalPickerVisible(false);
            setSelectedClauseId(null);
          },
          (value) => {
            if (selectedClauseId) {
              handleUpdateClause(selectedClauseId, {
                value,
              } as unknown as Partial<T>);
            }
            setModalPickerVisible(false);
            setSelectedClauseId(null);
          },
        )}

      {/* Optional Nested Bottom Sheet Picker */}
      {config.renderNestedPicker && (
        <BottomSheet
          ref={nestedPickerRef}
          index={-1}
          snapPoints={["50%", "70%"]}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ backgroundColor: theme.colors.background }}
          handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
          onChange={(index) => {
            if (index === -1) {
              setSelectedClauseId(null);
            }
          }}
        >
          <BottomSheetView style={filterSheetStyles.container}>
            {/* Header */}
            <View style={filterSheetStyles.header}>
              <View style={filterSheetStyles.headerSide}>
                <TouchableOpacity
                  onPress={() => {
                    nestedPickerRef.current?.close();
                  }}
                  activeOpacity={0.7}
                >
                  <Icon
                    name="chevron-back"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              <Text
                style={[
                  filterSheetStyles.headerTitle,
                  { color: theme.colors.text },
                ]}
              >
                {config.nestedPickerTitle || "Select"}
              </Text>
              <View style={filterSheetStyles.headerSide} />
            </View>

            {/* Content */}
            {config.renderNestedPicker(
              selectedClauseId,
              () => {
                nestedPickerRef.current?.close();
                setSelectedClauseId(null);
              },
              (value) => {
                if (selectedClauseId) {
                  handleUpdateClause(selectedClauseId, {
                    ...value,
                  } as unknown as Partial<T>);
                }
                nestedPickerRef.current?.close();
                setSelectedClauseId(null);
              },
            )}
          </BottomSheetView>
        </BottomSheet>
      )}
    </BottomSheet>
  );
}

/**
 * Shared Pill Button Component
 * Used in clause rows for consistent styling
 */
export function FilterPillButton({
  icon,
  label,
  onPress,
  theme,
}: {
  icon?: string;
  label: string;
  onPress: () => void;
  theme: any;
}) {
  return (
    <TouchableOpacity
      style={[
        filterSheetStyles.pillButton,
        { backgroundColor: theme.colors.surface },
      ]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {icon && (
        <Icon name={icon} size={14} color={theme.colors.textSecondary} />
      )}
      <Text
        style={[filterSheetStyles.pillText, { color: theme.colors.text }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Icon
        name="chevron-down"
        size={14}
        color={theme.colors.textSecondary}
      />
    </TouchableOpacity>
  );
}
