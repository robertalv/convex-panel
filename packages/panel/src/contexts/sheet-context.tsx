import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import type { ReactNode } from "react";

export interface SheetContent {
  title?: string;
  content: ReactNode;
  width?: string;
  fullscreen?: boolean;
}

// Actions context - stable references that never change
interface SheetActionsContextValue {
  openSheet: (content: SheetContent) => void;
  closeSheet: () => void;
}

// State context - changes when sheet opens/closes
interface SheetStateContextValue {
  isOpen: boolean;
  sheetContent: SheetContent | null;
  container: HTMLElement | null;
}

// Combined interface for backwards compatibility
interface SheetContextValue
  extends SheetActionsContextValue, SheetStateContextValue {}

const SheetActionsContext = createContext<SheetActionsContextValue | null>(
  null,
);
const SheetStateContext = createContext<SheetStateContextValue | null>(null);

interface SheetProviderProps {
  children: ReactNode;
  container?: HTMLElement | null;
}

export function SheetProvider({
  children,
  container = null,
}: SheetProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sheetContent, setSheetContent] = useState<SheetContent | null>(null);

  // Use ref to track pending close timeout
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openSheet = useCallback((content: SheetContent) => {
    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    // Always set content and open - this handles both:
    // 1. Opening a new sheet when none is open
    // 2. Replacing content when a sheet is already open (seamless transition)
    setSheetContent(content);
    setIsOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setIsOpen(false);
    // Clear content after animation completes (250ms animation duration)
    closeTimeoutRef.current = setTimeout(() => {
      setSheetContent(null);
      closeTimeoutRef.current = null;
    }, 250);
  }, []);

  // Actions are stable - only created once
  const actions = useMemo<SheetActionsContextValue>(
    () => ({
      openSheet,
      closeSheet,
    }),
    [openSheet, closeSheet],
  );

  // State changes when isOpen or sheetContent changes
  const state = useMemo<SheetStateContextValue>(
    () => ({
      isOpen,
      sheetContent,
      container,
    }),
    [isOpen, sheetContent, container],
  );

  return (
    <SheetActionsContext.Provider value={actions}>
      <SheetStateContext.Provider value={state}>
        {children}
      </SheetStateContext.Provider>
    </SheetActionsContext.Provider>
  );
}

// Hook to get only actions (openSheet, closeSheet) - won't cause re-renders when sheet opens
export function useSheetActions(): SheetActionsContextValue {
  const context = useContext(SheetActionsContext);
  if (!context) {
    throw new Error("useSheetActions must be used within a SheetProvider");
  }
  return context;
}

// Hook to get only state (isOpen, sheetContent) - will re-render when sheet state changes
export function useSheetState(): SheetStateContextValue {
  const context = useContext(SheetStateContext);
  if (!context) {
    throw new Error("useSheetState must be used within a SheetProvider");
  }
  return context;
}

// Full hook for components that need everything
export function useSheet(): SheetContextValue {
  const actions = useContext(SheetActionsContext);
  const state = useContext(SheetStateContext);
  if (!actions || !state) {
    throw new Error("useSheet must be used within a SheetProvider");
  }
  return { ...actions, ...state };
}

// Safe version that returns a no-op if not in provider
export function useSheetSafe(): SheetContextValue {
  const actions = useContext(SheetActionsContext);
  const state = useContext(SheetStateContext);

  if (!actions || !state) {
    return {
      isOpen: false,
      openSheet: () => {},
      closeSheet: () => {},
      sheetContent: null,
      container: null,
    };
  }
  return { ...actions, ...state };
}

// Safe version for actions only - won't re-render when sheet state changes
export function useSheetActionsSafe(): SheetActionsContextValue {
  const context = useContext(SheetActionsContext);
  if (!context) {
    return {
      openSheet: () => {},
      closeSheet: () => {},
    };
  }
  return context;
}

// Safe version for state only - returns defaults if not in provider
export function useSheetStateSafe(): SheetStateContextValue {
  const context = useContext(SheetStateContext);
  if (!context) {
    return {
      isOpen: false,
      sheetContent: null,
      container: null,
    };
  }
  return context;
}