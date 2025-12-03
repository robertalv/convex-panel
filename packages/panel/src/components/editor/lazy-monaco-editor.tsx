import React, { lazy, Suspense } from 'react';

// Loading fallback component
const EditorLoading: React.FC<{ height?: string | number }> = ({ height = '200px' }) => (
  <div
    style={{
      height,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--color-panel-bg-secondary, #16181D)',
      color: 'var(--color-panel-text-secondary, #9ca3af)',
      fontSize: '12px',
      border: '1px solid var(--color-panel-border, #2D313A)',
      borderRadius: '4px',
    }}
  >
    Loading editor...
  </div>
);

// Lazy load Monaco Editor - it's huge (~1MB+) and only needed when editing
const MonacoEditorModule = lazy(() => 
  import('@monaco-editor/react').then(module => ({ default: module.default }))
);

const DiffEditorModule = lazy(() =>
  import('@monaco-editor/react').then(module => ({ default: module.DiffEditor }))
);

// Re-export types
export type { BeforeMount, OnMount, DiffOnMount, EditorProps, DiffEditorProps } from '@monaco-editor/react';

// Wrapper for Editor
export const Editor: React.FC<any> = (props) => {
  return (
    <Suspense fallback={<EditorLoading height={props.height} />}>
      <MonacoEditorModule {...props} />
    </Suspense>
  );
};

// Wrapper for DiffEditor
export const DiffEditor: React.FC<any> = (props) => {
  return (
    <Suspense fallback={<EditorLoading height={props.height} />}>
      <DiffEditorModule {...props} />
    </Suspense>
  );
};

// Default export for compatibility (Editor)
export default Editor;

