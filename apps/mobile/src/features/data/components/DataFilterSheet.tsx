/**
 * Data Filter Bottom Sheet
 *
 * Mobile filter builder inspired by the desktop FilterPanel.
 * Lets the user add simple field-based filters for the current table.
 */

import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import { useTheme } from "../../../contexts/ThemeContext";
import type {
  FilterClause,
  FilterExpression,
  TableSchema,
  FilterOperator,
} from "../types";
import { Icon } from "../../../components/ui/Icon";
import {
  BaseFilterSheet,
  BaseFilterSheetConfig,
} from "../../../components/sheets/BaseFilterSheet";
import { filterSheetStyles } from "../../../components/sheets/filterSheetStyles";
import { getFieldTypeIcon, getFieldTypeColor } from "../utils/fieldTypeIcons";

export interface DataFilterSheetProps {
  sheetRef: React.RefObject<BottomSheet>;
  tableName: string | null;
  schema?: TableSchema;
  filters: FilterExpression[];
  onChangeFilters: (filters: FilterExpression[]) => void;
}

// Filter operators matching the images
const FILTER_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: "eq", label: "is" },
  { value: "neq", label: "is not" },
  { value: "gt", label: "greater than" },
  { value: "gte", label: "greater or equal" },
  { value: "lt", label: "less than" },
  { value: "lte", label: "less or equal" },
];

// Extended operators for string matching (we'll use eq/neq for now but show these labels)
const STRING_OPERATORS = [
  { value: "contains", label: "contains" },
  { value: "not contains", label: "not contains" },
  { value: "starts with", label: "starts with" },
  { value: "ends with", label: "ends with" },
  { value: "is", label: "is" },
  { value: "is not", label: "is not" },
  { value: "empty", label: "empty" },
  { value: "not empty", label: "not empty" },
];

export function DataFilterSheet({
  sheetRef,
  tableName,
  schema,
  filters,
  onChangeFilters,
}: DataFilterSheetProps) {
  const { theme } = useTheme();

  const activeFilters: FilterExpression = filters[0] ?? {
    clauses: [],
  };

  // Build list of available fields from schema (plus system fields)
  const availableFields = useMemo(() => {
    const fields = new Set<string>();
    fields.add("_id");
    fields.add("_creationTime");

    if (schema?.fields) {
      for (const field of schema.fields) {
        if (field.fieldName) {
          fields.add(field.fieldName);
        }
      }
    }

    return Array.from(fields);
  }, [schema]);

  // Helper to get field type from schema
  const getFieldType = useCallback(
    (fieldName: string): string | null => {
      if (fieldName === "_id") return "Id";
      if (fieldName === "_creationTime") return "Float64";
      const field = schema?.fields?.find((f) => f.fieldName === fieldName);
      return field?.shape?.type ?? null;
    },
    [schema],
  );

  // Helper to convert string value to appropriate type based on field schema
  const convertValueToType = useCallback(
    (value: string, fieldName: string): any => {
      if (value === "" || value === null || value === undefined) {
        return ""; // Return empty string instead of null to preserve the user's typing
      }

      const fieldType = getFieldType(fieldName);

      // Try to parse based on type
      switch (fieldType) {
        case "Float64":
        case "Int64":
        case "Number":
          const num = Number(value);
          if (!isNaN(num)) return num;
          return value; // Fallback to string if not a valid number
        case "Boolean":
          if (value.toLowerCase() === "true") return true;
          if (value.toLowerCase() === "false") return false;
          return value; // Fallback to string
        case "String":
        case "Id":
        default:
          return value; // Keep as string
      }
    },
    [getFieldType],
  );

  // Adapter to convert between FilterExpression[] and FilterExpression for BaseFilterSheet
  const handleFiltersChange = useCallback(
    (newFilters: FilterExpression) => {
      console.log("[DataFilterSheet] handleFiltersChange called", {
        newFilters,
        clauses: newFilters.clauses,
      });
      onChangeFilters([newFilters]);
    },
    [onChangeFilters],
  );

  // Update a specific clause
  const handleUpdateClause = useCallback(
    (id: string, updates: Partial<FilterClause>) => {
      console.log("[DataFilterSheet] handleUpdateClause", {
        id,
        updates,
        currentClauses: activeFilters.clauses,
      });
      const updatedFilters = {
        ...activeFilters,
        clauses: (activeFilters.clauses ?? []).map((c) =>
          c.id === id ? { ...c, ...updates } : c,
        ),
      };
      console.log("[DataFilterSheet] Calling onChangeFilters with", {
        updatedFilters,
      });
      onChangeFilters([updatedFilters]);
    },
    [activeFilters, onChangeFilters],
  );


  // BaseFilterSheet configuration
  const config: BaseFilterSheetConfig<FilterClause> = {
    overviewTitle: "Filters",
    selectTitle: "Select field to filter",
    emptyTitle: "No filtering set up yet.",
    emptySubtitle: "Choose a field to filter by",

    renderClauseRow: (clause, onEdit, onRemove, onUpdateClause, selectedClauseId, setSelectedClauseId) => (
      <View style={filterSheetStyles.clauseRow}>
        {/* Field selector pill */}
        <TouchableOpacity
          style={[
            filterSheetStyles.pillButton,
            { backgroundColor: theme.colors.surface },
          ]}
          activeOpacity={0.7}
          onPress={onEdit}
        >
          <Icon name="table" size={14} color={theme.colors.textSecondary} />
          <Text
            style={[filterSheetStyles.pillText, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {clause.field}
          </Text>
          <Icon
            name="chevron-down"
            size={14}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Condition selector pill */}
        <TouchableOpacity
          style={[
            filterSheetStyles.pillButton,
            { backgroundColor: theme.colors.surface },
          ]}
          activeOpacity={0.7}
          onPress={() => setSelectedClauseId(clause.id)}
        >
          <Text
            style={[filterSheetStyles.pillText, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {FILTER_OPERATORS.find((op) => op.value === clause.op)?.label ||
              "Select condition"}
          </Text>
          <Icon
            name="chevron-down"
            size={14}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Value input */}
        <TextInput
          style={[
            styles.valueInput,
            {
              color: theme.colors.text,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.background,
            },
          ]}
          placeholder="Enter value"
          placeholderTextColor={theme.colors.textTertiary}
          value={
            typeof clause.value === "string"
              ? clause.value
              : clause.value == null
                ? ""
                : JSON.stringify(clause.value)
          }
          onChangeText={(text) => {
            const convertedValue = convertValueToType(text, clause.field);
            onUpdateClause(clause.id, { value: convertedValue });
          }}
        />

        {/* Remove button */}
        <TouchableOpacity
          style={filterSheetStyles.moreButton}
          onPress={onRemove}
          activeOpacity={0.7}
        >
          <Text
            style={[
              filterSheetStyles.moreButtonText,
              { color: theme.colors.textSecondary },
            ]}
          >
            ⋯
          </Text>
        </TouchableOpacity>
      </View>
    ),

    renderSelectMode: (onSelect, editingClauseId, editingPart) => {
      // If editing operator, show operators
      if (editingPart === "operator" && editingClauseId) {
        const editingClause = activeFilters.clauses?.find((c) => c.id === editingClauseId);
        
        return (
          <View style={filterSheetStyles.body}>
            <View style={filterSheetStyles.fieldList}>
              {FILTER_OPERATORS.map((operator) => {
                const isSelected = editingClause?.op === operator.value;

                return (
                  <TouchableOpacity
                    key={operator.value}
                    style={filterSheetStyles.fieldRow}
                    onPress={() => {
                      onSelect({ op: operator.value });
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.leftContent}>
                      <View style={styles.fieldIcon}>
                        <Icon
                          name="table"
                          size={18}
                          color={theme.colors.textSecondary}
                        />
                      </View>
                      <Text
                        style={[
                          filterSheetStyles.fieldName,
                          {
                            color: isSelected
                              ? theme.colors.primary
                              : theme.colors.text,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {operator.label}
                      </Text>
                    </View>
                    {isSelected && (
                      <Icon
                        name="checkmark-circle"
                        size={20}
                        color={theme.colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      }

      // Otherwise, show fields (for new clause or editing field)
      const usedFields = new Set(activeFilters.clauses?.map((c) => c.field) ?? []);

      return (
        <View style={filterSheetStyles.body}>
          <View style={filterSheetStyles.fieldList}>
            {availableFields.map((field) => {
              const isSelected = usedFields.has(field);
              const fieldType = getFieldType(field);
              const iconName = getFieldTypeIcon(fieldType);
              const iconColor = getFieldTypeColor(fieldType, theme);

              return (
                <TouchableOpacity
                  key={field}
                  style={filterSheetStyles.fieldRow}
                  onPress={() =>
                    onSelect({ field, op: "eq", value: "", enabled: true })
                  }
                  activeOpacity={0.6}
                >
                  <View style={styles.leftContent}>
                    <View
                      style={styles.fieldIcon}
                    >
                      <Icon name={iconName} size={18} color={theme.colors.textSecondary} />
                    </View>
                    <Text
                      style={[
                        filterSheetStyles.fieldName,
                        { color: theme.colors.text },
                      ]}
                      numberOfLines={1}
                    >
                      {field}
                    </Text>
                  </View>
                  {isSelected && (
                    <Icon
                      name="checkmark-circle"
                      size={20}
                      color={theme.colors.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    },

  };

  return (
    <BaseFilterSheet
      sheetRef={sheetRef}
      filters={activeFilters}
      onChangeFilters={handleFiltersChange}
      config={config}
    />
  );
}

const styles = StyleSheet.create({
  valueInput: {
    flex: 1,
    minWidth: 100,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  fieldIcon: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
});
