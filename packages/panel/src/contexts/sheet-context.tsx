import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

export interface SheetContent {
  title?: string;
  content: ReactNode;
  width?: string;
}

interface SheetContextValue {
  isOpen: boolean;
  openSheet: (content: SheetContent) => void;
  closeSheet: () => void;
  sheetContent: SheetContent | null;
}

const SheetContext = createContext<SheetContextValue | null>(null);

interface SheetProviderProps {
  children: ReactNode;
}

export function SheetProvider({ children }: SheetProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sheetContent, setSheetContent] = useState<SheetContent | null>(null);

  const openSheet = useCallback((content: SheetContent) => {
    setSheetContent(content);
    setIsOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setIsOpen(false);
    // Clear content after animation completes
    setTimeout(() => {
      setSheetContent(null);
    }, 300);
  }, []);

  const value: SheetContextValue = {
    isOpen,
    openSheet,
    closeSheet,
    sheetContent,
  };

  return (
    <SheetContext.Provider value={value}>
      {children}
    </SheetContext.Provider>
  );
}

export function useSheet(): SheetContextValue {
  const context = useContext(SheetContext);
  if (!context) {
    throw new Error('useSheet must be used within a SheetProvider');
  }
  return context;
}

// Safe version that returns a no-op if not in provider
export function useSheetSafe(): SheetContextValue {
  const context = useContext(SheetContext);
  if (!context) {
    return {
      isOpen: false,
      openSheet: () => {},
      closeSheet: () => {},
      sheetContent: null,
    };
  }
  return context;
}

