/**
 * Deployment Sheet Context
 * 
 * Manages the bottom sheet for deployment selection globally
 */

import React, { createContext, useContext, useRef, useCallback } from 'react';
import BottomSheet from '@gorhom/bottom-sheet';

interface DeploymentSheetContextValue {
  openSheet: () => void;
  closeSheet: () => void;
  sheetRef: React.RefObject<BottomSheet>;
}

const DeploymentSheetContext = createContext<DeploymentSheetContextValue | undefined>(undefined);

export function DeploymentSheetProvider({ children }: { children: React.ReactNode }) {
  const sheetRef = useRef<BottomSheet>(null);

  const openSheet = useCallback(() => {
    sheetRef.current?.expand();
  }, []);

  const closeSheet = useCallback(() => {
    sheetRef.current?.close();
  }, []);

  const value: DeploymentSheetContextValue = {
    openSheet,
    closeSheet,
    sheetRef,
  };

  return (
    <DeploymentSheetContext.Provider value={value}>
      {children}
    </DeploymentSheetContext.Provider>
  );
}

export function useDeploymentSheet(): DeploymentSheetContextValue {
  const context = useContext(DeploymentSheetContext);
  if (context === undefined) {
    throw new Error('useDeploymentSheet must be used within a DeploymentSheetProvider');
  }
  return context;
}

