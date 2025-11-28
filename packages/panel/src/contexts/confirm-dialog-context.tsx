import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ConfirmDialog } from '../components/shared/confirm-dialog';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmDialogContextValue {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

interface ConfirmDialogProviderProps {
  children: ReactNode;
}

export function ConfirmDialogProvider({ children }: ConfirmDialogProviderProps) {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    options: ConfirmDialogOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  const handleClose = useCallback(() => {
    if (dialogState) {
      dialogState.resolve(false);
      setDialogState(null);
    }
  }, [dialogState]);

  const handleConfirm = useCallback(() => {
    if (dialogState) {
      dialogState.resolve(true);
      setDialogState(null);
    }
  }, [dialogState]);

  const value: ConfirmDialogContextValue = {
    confirm,
  };

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      {dialogState && (
        <ConfirmDialog
          isOpen={dialogState.isOpen}
          onClose={handleClose}
          onConfirm={handleConfirm}
          {...dialogState.options}
        />
      )}
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirm(): ConfirmDialogContextValue {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmDialogProvider');
  }
  return context;
}

// Safe version that returns a no-op if not in provider
export function useConfirmSafe(): ConfirmDialogContextValue {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    return {
      confirm: async () => false,
    };
  }
  return context;
}

