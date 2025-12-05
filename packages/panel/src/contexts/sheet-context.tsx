import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

export interface SheetContent {
  title?: string;
  content: ReactNode;
  width?: string;
  fullscreen?: boolean;
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
    // If a sheet is already open, close it first before opening the new one
    if (isOpen) {
      setIsOpen(false);
      setSheetContent(null);
      // Small delay to allow close animation to start, then open new sheet
      setTimeout(() => {
        setSheetContent(content);
        setIsOpen(true);
      }, 100);
    } else {
      // No sheet is open, just open the new one
      setSheetContent(content);
      setIsOpen(true);
    }
  }, [isOpen]);

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

