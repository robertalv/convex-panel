/**
 * useDataSortConfig - Hook to generate BaseSortSheet configuration for data sorting
 * Encapsulates all the domain-specific logic for sorting table documents.
 */

import { useMemo } from "react";
import type { BaseSortSheetConfig } from "../../../components/sheets/BaseSortSheet";
import type { TableSchema } from "../types";
import { getFieldTypeIcon } from "../utils/fieldTypeIcons";

export interface UseDataSortConfigOptions {
  schema?: TableSchema;
}

export interface UseDataSortConfigResult {
  config: BaseSortSheetConfig;
  getFieldType: (fieldName: string) => string | null;
}

export function useDataSortConfig({
  schema,
}: UseDataSortConfigOptions): UseDataSortConfigResult {
  // Helper to get field type from schema
  const getFieldType = (fieldName: string): string | null => {
    if (fieldName === "_id") return "Id";
    if (fieldName === "_creationTime") return "Float64";
    const field = schema?.fields?.find((f) => f.fieldName === fieldName);
    return field?.shape?.type ?? null;
  };

  // Build list of available fields from schema (plus system fields)
  const availableFields = useMemo(() => {
    const fieldsMap = new Map<
      string,
      { field: string; label: string; icon?: string }
    >();

    // System fields always available
    fieldsMap.set("_creationTime", {
      field: "_creationTime",
      label: "Creation Time",
      icon: getFieldTypeIcon("Float64"),
    });
    fieldsMap.set("_id", {
      field: "_id",
      label: "Document ID",
      icon: getFieldTypeIcon("Id"),
    });

    // Add schema fields (will not override system fields if they have the same name)
    if (schema?.fields) {
      schema.fields.forEach((field) => {
        // Skip nested fields for now (only allow sorting by top-level fields)
        if (!field.fieldName.includes(".") && !fieldsMap.has(field.fieldName)) {
          const fieldType = field.shape?.type ?? null;
          fieldsMap.set(field.fieldName, {
            field: field.fieldName,
            label: field.fieldName,
            icon: getFieldTypeIcon(fieldType),
          });
        }
      });
    }

    return Array.from(fieldsMap.values());
  }, [schema]);

  const config: BaseSortSheetConfig = useMemo(
    () => ({
      overviewTitle: "Sort",
      selectTitle: "Select field",
      emptyTitle: "No sorting applied",
      emptySubtitle: "Select a field to sort by",
      availableFields,
      getFieldType,
    }),
    [availableFields],
  );

  return {
    config,
    getFieldType,
  };
}
