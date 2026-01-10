/**
 * Data Sort Bottom Sheet
 *
 * Simple sorting UI for the data browser.
 * Allows selecting a field and direction (asc/desc).
 */

import React, { useMemo } from "react";
import BottomSheet from "@gorhom/bottom-sheet";
import type { SortConfig, TableSchema } from "../types";
import {
  BaseSortSheet,
  BaseSortSheetConfig,
} from "../../../components/sheets/BaseSortSheet";
import { getFieldTypeIcon } from "../utils/fieldTypeIcons";

export interface DataSortSheetProps {
  sheetRef: React.RefObject<BottomSheet>;
  tableName: string | null;
  schema?: TableSchema;
  sortConfig: SortConfig | null;
  onChangeSortConfig: (sortConfig: SortConfig | null) => void;
}

export function DataSortSheet({
  sheetRef,
  tableName,
  schema,
  sortConfig,
  onChangeSortConfig,
}: DataSortSheetProps) {
  // Helper to get field type from schema
  const getFieldType = (fieldName: string): string | null => {
    if (fieldName === "_id") return "Id";
    if (fieldName === "_creationTime") return "Float64";
    const field = schema?.fields?.find((f) => f.fieldName === fieldName);
    return field?.shape?.type ?? null;
  };

  // Build list of available fields from schema (plus system fields)
  const availableFields = useMemo(() => {
    const fieldsMap = new Map<string, { field: string; label: string; icon?: string }>();
    
    // System fields always available
    fieldsMap.set("_creationTime", { 
      field: "_creationTime", 
      label: "Creation Time", 
      icon: getFieldTypeIcon("Float64")
    });
    fieldsMap.set("_id", { 
      field: "_id", 
      label: "Document ID", 
      icon: getFieldTypeIcon("Id")
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

  const config: BaseSortSheetConfig = {
    overviewTitle: "Sort",
    selectTitle: "Select field",
    emptyTitle: "No sorting applied",
    emptySubtitle: "Select a field to sort by",
    availableFields,
    getFieldType,
  };

  return (
    <BaseSortSheet
      sheetRef={sheetRef}
      sortConfig={sortConfig}
      onChangeSortConfig={onChangeSortConfig}
      config={config}
      schema={schema}
      tableName={tableName}
    />
  );
}
