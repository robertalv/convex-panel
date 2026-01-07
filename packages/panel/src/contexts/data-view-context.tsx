import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { ReactNode } from "react";

// Split context into State and Actions to prevent unnecessary re-renders
// Components that only need to call actions won't re-render when state changes

export interface DataViewStateValue {
  selectedTable: string | null;
  availableFields: string[];
}

export interface DataViewActionsValue {
  setDataViewContext: (table: string | null, fields: string[]) => void;
  refreshFilters: () => void;
}

// Combined interface for backwards compatibility
export interface DataViewContextValue
  extends DataViewStateValue, DataViewActionsValue {}

// Separate contexts for state and actions
const DataViewStateContext = createContext<DataViewStateValue | null>(null);
const DataViewActionsContext = createContext<DataViewActionsValue | null>(null);

interface DataViewProviderProps {
  children: ReactNode;
}

export function DataViewProvider({ children }: DataViewProviderProps) {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [availableFields, setAvailableFields] = useState<string[]>([]);

  const setDataViewContext = useCallback(
    (table: string | null, fields: string[]) => {
      setSelectedTable(table);
      setAvailableFields(fields);
    },
    [],
  );

  const refreshFilters = useCallback(() => {
    // Trigger a refresh by dispatching a custom event
    window.dispatchEvent(new CustomEvent("convex-panel-filters-updated"));
  }, []);

  // Memoize the state value - changes when state changes
  const stateValue = useMemo(
    () => ({
      selectedTable,
      availableFields,
    }),
    [selectedTable, availableFields],
  );

  // Memoize the actions value - should be stable (never changes)
  const actionsValue = useMemo(
    () => ({
      setDataViewContext,
      refreshFilters,
    }),
    [setDataViewContext, refreshFilters],
  );

  return (
    <DataViewActionsContext.Provider value={actionsValue}>
      <DataViewStateContext.Provider value={stateValue}>
        {children}
      </DataViewStateContext.Provider>
    </DataViewActionsContext.Provider>
  );
}

// Hook for components that need state (will re-render when state changes)
export function useDataViewState(): DataViewStateValue {
  const context = useContext(DataViewStateContext);
  if (!context) {
    return {
      selectedTable: null,
      availableFields: [],
    };
  }
  return context;
}

// Hook for components that only need actions (won't re-render when state changes)
export function useDataViewActions(): DataViewActionsValue {
  const context = useContext(DataViewActionsContext);
  if (!context) {
    return {
      setDataViewContext: () => {},
      refreshFilters: () => {},
    };
  }
  return context;
}

// Combined hook for backwards compatibility
// Use useDataViewState or useDataViewActions for better performance
export function useDataViewContext(): DataViewContextValue {
  const state = useDataViewState();
  const actions = useDataViewActions();
  return { ...state, ...actions };
}




