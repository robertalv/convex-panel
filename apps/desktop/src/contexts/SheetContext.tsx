/**
 * Sheet Context
 * Local sheet management for desktop app
 * Provides state and actions for managing sheet panels
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from "react";

// ============================================================================
// Types
// ============================================================================

export interface SheetContent {
  title?: string;
  content: React.ReactNode;
}

export interface SheetState {
  isOpen: boolean;
  sheetContent: SheetContent | null;
}

type SheetAction =
  | { type: "OPEN_SHEET"; payload: SheetContent }
  | { type: "CLOSE_SHEET" }
  | { type: "SET_CONTENT"; payload: SheetContent | null };

// ============================================================================
// Reducer
// ============================================================================

function sheetReducer(state: SheetState, action: SheetAction): SheetState {
  switch (action.type) {
    case "OPEN_SHEET":
      return {
        isOpen: true,
        sheetContent: action.payload,
      };
    case "CLOSE_SHEET":
      return {
        isOpen: false,
        sheetContent: null,
      };
    case "SET_CONTENT":
      return {
        ...state,
        sheetContent: action.payload,
      };
    default:
      return state;
  }
}

const initialState: SheetState = {
  isOpen: false,
  sheetContent: null,
};

// ============================================================================
// Context
// ============================================================================

const SheetContext = createContext<
  | {
      state: SheetState;
      openSheet: (content: SheetContent) => void;
      closeSheet: () => void;
      setSheetContent: (content: SheetContent | null) => void;
    }
  | undefined
>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface SheetProviderProps {
  children: React.ReactNode;
}

export function SheetProvider({ children }: SheetProviderProps) {
  const [state, dispatch] = useReducer(sheetReducer, initialState);

  const openSheet = useCallback((content: SheetContent) => {
    dispatch({ type: "OPEN_SHEET", payload: content });
  }, []);

  const closeSheet = useCallback(() => {
    dispatch({ type: "CLOSE_SHEET" });
  }, []);

  const setSheetContent = useCallback((content: SheetContent | null) => {
    dispatch({ type: "SET_CONTENT", payload: content });
  }, []);

  const value = {
    state,
    openSheet,
    closeSheet,
    setSheetContent,
  };

  return (
    <SheetContext.Provider value={value}>{children}</SheetContext.Provider>
  );
}

// ============================================================================
// Hooks
// ============================================================================

export function useSheet() {
  const context = useContext(SheetContext);
  if (context === undefined) {
    throw new Error("useSheet must be used within a SheetProvider");
  }
  return context;
}

export function useSheetSafe() {
  const context = useContext(SheetContext);
  if (context === undefined) {
    // Return a safe default when context is not available
    return {
      state: initialState,
      openSheet: () => {},
      closeSheet: () => {},
      setSheetContent: () => {},
    };
  }
  return context;
}

// ============================================================================
// Actions Hook
// ============================================================================

export function useSheetActions() {
  const { openSheet, closeSheet, setSheetContent } = useSheet();

  return {
    openSheet,
    closeSheet,
    setSheetContent,
  };
}

export function useSheetState() {
  const { state } = useSheet();
  return state;
}

// ============================================================================
// Safe Actions Hook (compatible with panel package)
// ============================================================================

export function useSheetActionsSafe() {
  const context = useContext(SheetContext);
  if (context === undefined) {
    // Return safe defaults when context is not available
    return {
      openSheet: () => {},
      closeSheet: () => {},
      setSheetContent: () => {},
    };
  }
  const { openSheet, closeSheet, setSheetContent } = context;
  return {
    openSheet,
    closeSheet,
    setSheetContent,
  };
}

export function useSheetStateSafe() {
  const context = useContext(SheetContext);
  if (context === undefined) {
    return initialState;
  }
  return context.state;
}
