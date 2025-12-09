import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

export interface DataViewContextValue {
  selectedTable: string | null;
  availableFields: string[];
  setDataViewContext: (table: string | null, fields: string[]) => void;
  refreshFilters?: () => void;
}

const DataViewContext = createContext<DataViewContextValue | null>(null);

interface DataViewProviderProps {
  children: ReactNode;
}

export function DataViewProvider({ children }: DataViewProviderProps) {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [, setRefreshTrigger] = useState(0);

  const setDataViewContext = useCallback((table: string | null, fields: string[]) => {
    setSelectedTable(table);
    setAvailableFields(fields);
  }, []);

  const refreshFilters = useCallback(() => {
    // Trigger a refresh by dispatching a custom event
    window.dispatchEvent(new CustomEvent('convex-panel-filters-updated'));
    // Also update trigger to force re-render if needed
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <DataViewContext.Provider value={{ selectedTable, availableFields, setDataViewContext, refreshFilters }}>
      {children}
    </DataViewContext.Provider>
  );
}

export function useDataViewContext(): DataViewContextValue {
  const context = useContext(DataViewContext);
  if (!context) {
    return {
      selectedTable: null,
      availableFields: [],
      setDataViewContext: () => {},
      refreshFilters: () => {},
    };
  }
  return context;
}
