/**
 * Hook to manage data browser preferences (selected table, view mode, filters)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useDeployment } from "../../../contexts/DeploymentContext";
import type { DataViewMode, FilterExpression, SortConfig } from "../types";
import {
  saveSelectedTable,
  loadSelectedTable,
  saveViewMode,
  loadViewMode,
  saveFilters,
  loadFilters,
  saveSortConfig,
  loadSortConfig,
} from "../utils/storage";

export interface DataPreferences {
  selectedTable: string | null;
  viewMode: DataViewMode;
  filters: FilterExpression[];
  sortConfig: SortConfig | null;
  isLoading: boolean;
}

export interface DataPreferencesActions {
  setSelectedTable: (tableName: string | null) => void;
  setViewMode: (mode: DataViewMode) => void;
  setFilters: (filters: FilterExpression[]) => void;
  addFilter: (filter: FilterExpression) => void;
  removeFilter: (index: number) => void;
  clearFilters: () => void;
  setSortConfig: (sortConfig: SortConfig | null) => void;
  clearSort: () => void;
}

/**
 * Hook to manage data browser preferences with AsyncStorage persistence
 */
export function useDataPreferences(): DataPreferences & DataPreferencesActions {
  const { deployment } = useDeployment();
  const [selectedTable, setSelectedTableState] = useState<string | null>(null);
  const [viewMode, setViewModeState] = useState<DataViewMode>("list");
  const [filters, setFiltersState] = useState<FilterExpression[]>([]);
  const [sortConfig, setSortConfigState] = useState<SortConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const prevDeploymentIdRef = useRef<number | null>(null);

  // Clear selected table when deployment changes
  useEffect(() => {
    if (deployment?.id !== prevDeploymentIdRef.current) {
      // Deployment changed - clear selected table and filters
      setSelectedTableState(null);
      setFiltersState([]);
      setSortConfigState(null);
      saveSelectedTable(null);
      console.log("[useDataPreferences] Cleared selected table for deployment change");
      prevDeploymentIdRef.current = deployment?.id ?? null;
    } else if (!deployment) {
      // Deployment cleared
      setSelectedTableState(null);
      setFiltersState([]);
      setSortConfigState(null);
      prevDeploymentIdRef.current = null;
    }
  }, [deployment]);

  // Load preferences on mount
  useEffect(() => {
    async function loadPreferences() {
      try {
        const [table, mode] = await Promise.all([
          loadSelectedTable(),
          loadViewMode(),
        ]);

        setSelectedTableState(table);
        setViewModeState(mode);

        // Load filters and sort config for the selected table
        if (table) {
          const [tableFilters, tableSortConfig] = await Promise.all([
            loadFilters(table),
            loadSortConfig(table),
          ]);
          setFiltersState(tableFilters);
          setSortConfigState(tableSortConfig);
        }
      } catch (error) {
        console.error("Failed to load data preferences:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadPreferences();
  }, []);

  // Set selected table and persist
  const setSelectedTable = useCallback(async (tableName: string | null) => {
    setSelectedTableState(tableName);
    await saveSelectedTable(tableName);

    // Load filters and sort config for the newly selected table
    if (tableName) {
      const [tableFilters, tableSortConfig] = await Promise.all([
        loadFilters(tableName),
        loadSortConfig(tableName),
      ]);
      setFiltersState(tableFilters);
      setSortConfigState(tableSortConfig);
    } else {
      setFiltersState([]);
      setSortConfigState(null);
    }
  }, []);

  // Set view mode and persist
  const setViewMode = useCallback(async (mode: DataViewMode) => {
    setViewModeState(mode);
    await saveViewMode(mode);
  }, []);

  // Set filters and persist
  const setFilters = useCallback(
    async (newFilters: FilterExpression[]) => {
      console.log("[useDataPreferences] setFilters called", {
        newFilters,
        selectedTable,
        clausesCount: newFilters[0]?.clauses?.length || 0,
      });
      setFiltersState(newFilters);
      if (selectedTable) {
        await saveFilters(selectedTable, newFilters);
        console.log("[useDataPreferences] Filters saved to storage");
      }
    },
    [selectedTable],
  );

  // Add a filter
  const addFilter = useCallback(
    (filter: FilterExpression) => {
      setFiltersState((prev) => {
        const newFilters = [...prev, filter];
        if (selectedTable) {
          saveFilters(selectedTable, newFilters);
        }
        return newFilters;
      });
    },
    [selectedTable],
  );

  // Remove a filter by index
  const removeFilter = useCallback(
    (index: number) => {
      setFiltersState((prev) => {
        const newFilters = prev.filter((_, i) => i !== index);
        if (selectedTable) {
          saveFilters(selectedTable, newFilters);
        }
        return newFilters;
      });
    },
    [selectedTable],
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFiltersState([]);
    if (selectedTable) {
      saveFilters(selectedTable, []);
    }
  }, [selectedTable]);

  // Set sort config and persist
  const setSortConfig = useCallback(
    async (newSortConfig: SortConfig | null) => {
      setSortConfigState(newSortConfig);
      if (selectedTable) {
        await saveSortConfig(selectedTable, newSortConfig);
      }
    },
    [selectedTable],
  );

  // Clear sort config
  const clearSort = useCallback(() => {
    setSortConfigState(null);
    if (selectedTable) {
      saveSortConfig(selectedTable, null);
    }
  }, [selectedTable]);

  return {
    selectedTable,
    viewMode,
    filters,
    sortConfig,
    isLoading,
    setSelectedTable,
    setViewMode,
    setFilters,
    addFilter,
    removeFilter,
    clearFilters,
    setSortConfig,
    clearSort,
  };
}
