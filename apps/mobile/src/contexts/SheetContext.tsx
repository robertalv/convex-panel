/**
 * Unified Sheet Context
 *
 * Single context to manage all bottom sheets in the app.
 * Replaces individual MenuSheetContext, DeploymentSheetContext, etc.
 */

import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  useMemo,
} from "react";
import type BottomSheet from "@gorhom/bottom-sheet";

/** Sheet identifiers */
export type SheetName = "menu" | "deployment";

interface SheetControls {
  sheetRef: React.RefObject<BottomSheet>;
  openSheet: (index?: number) => void;
  closeSheet: () => void;
}

interface SheetContextValue {
  /** Get controls for a specific sheet */
  getSheet: (name: SheetName) => SheetControls;
  /** Shorthand to open a sheet */
  openSheet: (name: SheetName, index?: number) => void;
  /** Shorthand to close a sheet */
  closeSheet: (name: SheetName) => void;
}

const SheetContext = createContext<SheetContextValue | undefined>(undefined);

export function SheetProvider({ children }: { children: React.ReactNode }) {
  // Create refs for all sheets
  const menuRef = useRef<BottomSheet>(null);
  const deploymentRef = useRef<BottomSheet>(null);

  // Memoized sheet controls
  const sheets = useMemo<Record<SheetName, SheetControls>>(
    () => ({
      menu: {
        sheetRef: menuRef,
        openSheet: (index = 0) => menuRef.current?.snapToIndex(index),
        closeSheet: () => menuRef.current?.close(),
      },
      deployment: {
        sheetRef: deploymentRef,
        openSheet: () => deploymentRef.current?.expand(),
        closeSheet: () => deploymentRef.current?.close(),
      },
    }),
    [],
  );

  const getSheet = useCallback(
    (name: SheetName): SheetControls => sheets[name],
    [sheets],
  );

  const openSheet = useCallback(
    (name: SheetName, index?: number) => {
      sheets[name].openSheet(index);
    },
    [sheets],
  );

  const closeSheet = useCallback(
    (name: SheetName) => {
      sheets[name].closeSheet();
    },
    [sheets],
  );

  const value = useMemo(
    () => ({ getSheet, openSheet, closeSheet }),
    [getSheet, openSheet, closeSheet],
  );

  return (
    <SheetContext.Provider value={value}>{children}</SheetContext.Provider>
  );
}

/**
 * Hook to access sheet controls.
 *
 * @example
 * // Get all sheet functions
 * const { openSheet, closeSheet } = useSheet();
 * openSheet("menu");
 *
 * @example
 * // Get controls for a specific sheet
 * const { sheetRef, closeSheet } = useSheet("menu");
 */
export function useSheet(): SheetContextValue;
export function useSheet(name: SheetName): SheetControls;
export function useSheet(name?: SheetName): SheetContextValue | SheetControls {
  const context = useContext(SheetContext);
  if (!context) {
    throw new Error("useSheet must be used within SheetProvider");
  }
  if (name) {
    return context.getSheet(name);
  }
  return context;
}
