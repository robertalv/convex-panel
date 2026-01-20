import React, { useMemo } from "react";
import { DataFilterPanel } from "./data-filter-panel";
import { Sheet } from "../../../components/shared/sheet";
import type {
  FilterExpression,
  SortConfig,
  TableDefinition,
} from "../../../types";
import { createSessionStorageFilterHistoryApi } from "../../../utils/filterHistoryStorage";

export interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterExpression;
  setFilters: (filters: FilterExpression) => void;
  sortConfig: SortConfig | null;
  setSortConfig: (sortConfig: SortConfig | null) => void;
  selectedTable: string;
  tables: TableDefinition;
  visibleFields?: string[];
  onVisibleFieldsChange?: (fields: string[]) => void;
  openColumnVisibility?: boolean;
  userId?: string;
  container?: HTMLElement | null;
  /**
   * Render mode for the sheet:
   * - 'portal': Uses createPortal to render the sheet (default, used for overlays)
   * - 'inline': Renders directly without portal (used for push-aside layouts in desktop)
   */
  renderMode?: "portal" | "inline";
}

export const FilterSheet: React.FC<FilterSheetProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters,
  sortConfig,
  setSortConfig,
  selectedTable,
  tables,
  visibleFields,
  onVisibleFieldsChange,
  openColumnVisibility,
  userId = "default",
  container,
  renderMode = "portal",
}) => {
  const filterHistoryApi = useMemo(() => {
    return createSessionStorageFilterHistoryApi();
  }, []);

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      width="480px"
      container={container}
      renderMode={renderMode}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          backgroundColor: "var(--color-panel-bg)",
        }}
      >
        <DataFilterPanel
          filters={filters}
          setFilters={setFilters}
          sortConfig={sortConfig}
          setSortConfig={setSortConfig}
          selectedTable={selectedTable}
          tables={tables}
          visibleFields={visibleFields}
          onVisibleFieldsChange={onVisibleFieldsChange}
          onClose={onClose}
          openColumnVisibility={openColumnVisibility}
          filterHistoryApi={filterHistoryApi}
          userId={userId}
        />
      </div>
    </Sheet>
  );
};
