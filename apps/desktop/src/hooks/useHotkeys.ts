import { useHotkeys } from 'react-hotkeys-hook';
import { TableDocument } from "@convex-panel/shared";

export interface GlobalHotkeyHandlers {
  onView?: (doc: TableDocument, field: string) => void;
  onEdit?: (doc: TableDocument, field: string) => void;
  onCopy?: (value: any) => void;
  onViewDoc?: (doc: TableDocument) => void;
  onEditDoc?: (doc: TableDocument) => void;
  onCopyDoc?: (doc: TableDocument) => void;
  onClose?: () => void;
  currentDoc?: TableDocument;
  currentField?: string;
}

export function useGlobalHotkeys(handlers: GlobalHotkeyHandlers = {}, enabled: boolean = true) {
  const {
    onView,
    onEdit,
    onCopy,
    onViewDoc,
    onEditDoc,
    onCopyDoc,
    onClose,
    currentDoc,
    currentField,
  } = handlers;

  // View field
  useHotkeys('space', () => {
    if (currentDoc && currentField) {
      onView?.(currentDoc, currentField);
    }
  }, { enabled, enableOnFormTags: true });

  // Edit field
  useHotkeys('return', () => {
    if (currentDoc && currentField) {
      onEdit?.(currentDoc, currentField);
    }
  }, { enabled, enableOnFormTags: true });

  // Copy field
  useHotkeys('meta+c, ctrl+c', () => {
    onCopy?.(currentDoc);
  }, { enabled, enableOnFormTags: true });

  // View document
  useHotkeys('shift+space', () => {
    if (currentDoc) {
      onViewDoc?.(currentDoc);
    }
  }, { enabled, enableOnFormTags: true });

  // Edit document
  useHotkeys('shift+return', () => {
    if (currentDoc) {
      onEditDoc?.(currentDoc);
    }
  }, { enabled, enableOnFormTags: true });

  // Copy document
  useHotkeys('shift+meta+c, shift+ctrl+c', () => {
    if (currentDoc) {
      onCopyDoc?.(currentDoc);
    }
  }, { enabled, enableOnFormTags: true });

  // Close/Escape
  useHotkeys('esc', () => {
    onClose?.();
  }, { enabled, enableOnFormTags: true });
}

// Helper function to format keyboard shortcuts based on platform
export function formatShortcut(shortcut: string): string {
  const isMac = navigator.platform.includes('Mac');
  return shortcut
    .replace('meta+', isMac ? '⌘' : 'Ctrl+')
    .replace('shift+', '⇧')
    .replace('return', '↵')
    .replace('space', 'Space')
    .replace('ctrl+', 'Ctrl+');
} 