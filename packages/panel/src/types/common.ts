/**
 * Common/shared types used across the panel
 */

import type { EditorProps, DiffEditorProps } from "@monaco-editor/react";

export interface ThemeClasses {
  container?: string;
  header?: string;
  toolbar?: string;
  table?: string;
  tableHeader?: string;
  tableRow?: string;
  text?: string;
  button?: string;
  input?: string;
  successText?: string;
  errorText?: string;
  warningText?: string;
}

export type ButtonPosition = 'bottom-left' | 'bottom-center' | 'bottom-right' | 'right-center' | 'top-right';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  direction: SortDirection;
}

export type EnvType = 'development' | 'preview' | 'production';
export type DeploymentKind = 'cloud' | 'local' | 'self-hosted';

export interface ConvexPanelSettings {
  showDebugFilters: boolean;
  showStorageDebug: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  healthCheckInterval: number;
  showRequestIdInput: boolean;
  showLimitInput: boolean;
  showSuccessCheckbox: boolean;
}

export const editorOptions: EditorProps["options"] &
  DiffEditorProps["options"] = {
  tabFocusMode: false,
  automaticLayout: true,
  minimap: { enabled: false },
  overviewRulerBorder: false,
  scrollBeyondLastLine: false,
  find: {
    addExtraSpaceOnTop: false,
    autoFindInSelection: "never",
    seedSearchStringFromSelection: "never",
  },
  lineNumbers: "off",
  glyphMargin: false,
  lineDecorationsWidth: 0,
  lineNumbersMinChars: 0,
  scrollbar: {
    alwaysConsumeMouseWheel: false,
    horizontalScrollbarSize: 8,
    verticalScrollbarSize: 8,
    useShadows: false,
    vertical: "visible",
  },
  suggest: { preview: false },
  hideCursorInOverviewRuler: true,
  quickSuggestions: false,
  parameterHints: { enabled: false },
  suggestOnTriggerCharacters: false,
  snippetSuggestions: "none",
  contextmenu: false,
  codeLens: false,
  disableLayerHinting: true,
  inlayHints: { enabled: "off" },
  inlineSuggest: { enabled: false },
  hover: { above: false },
  guides: {
    bracketPairs: false,
    bracketPairsHorizontal: false,
    highlightActiveBracketPair: false,
    indentation: false,
    highlightActiveIndentation: false,
  },
  bracketPairColorization: { enabled: false },
  matchBrackets: "never",
  tabCompletion: "off",
  selectionHighlight: false,
  renderLineHighlight: "none",
};

