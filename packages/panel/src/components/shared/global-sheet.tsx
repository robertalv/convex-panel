import React from 'react';
import { Sheet } from './sheet';
import { useSheetSafe } from '../../contexts/sheet-context';

export interface GlobalSheetProps {
  container?: HTMLElement | null;
}

/**
 * GlobalSheet component that listens to the SheetContext and displays the sheet when needed.
 * If container is provided, the sheet will render within that container (e.g., inside bottom-sheet).
 * Otherwise, it renders as a global portal to document.body.
 */
export const GlobalSheet: React.FC<GlobalSheetProps> = ({ container }) => {
  const { isOpen, closeSheet, sheetContent } = useSheetSafe();

  if (!sheetContent) return null;

  return (
    <Sheet
      isOpen={isOpen}
      onClose={closeSheet}
      title={sheetContent.title}
      width={sheetContent.width}
      container={container}
      fullscreen={sheetContent.fullscreen}
    >
      {sheetContent.content}
    </Sheet>
  );
};

