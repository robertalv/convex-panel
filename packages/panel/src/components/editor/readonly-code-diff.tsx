import React, { useRef } from 'react';
import type { editor } from 'monaco-editor';
import { DiffEditor } from './lazy-monaco-editor';
import type { BeforeMount, DiffOnMount } from './lazy-monaco-editor';
import { useThemeSafe } from '../../hooks/useTheme';
import { setupMonacoThemes, getMonacoTheme } from './monaco-theme';
import { editorOptions } from './editor-options';
import type { ParentHeight, ContentHeight } from '../../types/editor';
import { maxHeightPixels } from '../../types/editor';

function setupAutoHeight(
  editor: editor.ICodeEditor,
  ref: React.RefObject<HTMLDivElement | null>,
  maxHeight: number,
) {
  const updateHeight = (e: editor.IContentSizeChangedEvent) => {
    if (!e.contentHeightChanged || !ref.current) {
      return;
    }
    const contentHeight = Math.min(maxHeight, editor.getContentHeight());
    if (ref.current) {
      ref.current.style.height = `${contentHeight}px`;
    }
    editor.layout({
      height: contentHeight,
      width: (ref.current?.offsetWidth || 0) / 2,
    });
  };
  editor.onDidContentSizeChange(updateHeight);
}

export type ReadonlyCodeDiffProps = {
  originalCode: string;
  modifiedCode: string;
  language?: string;
  path: string;
  height?: ParentHeight | ContentHeight;
};

export function ReadonlyCodeDiff({
  originalCode,
  modifiedCode,
  language = 'json',
  path: _path,
  height = { type: 'parent' },
}: ReadonlyCodeDiffProps) {
  const { theme } = useThemeSafe();
  const ref = useRef<HTMLDivElement>(null);

  // Since there is no simple way to pre-compute the initial height of a diff,
  // we default to 200px and wait for the first onMount event handler
  // to set the actual height
  const initialHeight =
    height.type === 'content' ? { height: '200px' } : { height: '100%' };

  const handleBeforeMount: BeforeMount = (monacoInstance) => {
    setupMonacoThemes(monacoInstance);
  };

  const handleMount: DiffOnMount = (editor) => {
    if (height.type === 'content') {
      const originalEditor = editor.getOriginalEditor();
      const modifiedEditor = editor.getModifiedEditor();
      const maxHeight = maxHeightPixels(height);
      setupAutoHeight(originalEditor, ref, maxHeight);
      setupAutoHeight(modifiedEditor, ref, maxHeight);
    }
  };

  return (
    <div ref={ref} style={initialHeight}>
      <DiffEditor
        original={originalCode}
        modified={modifiedCode}
        language={language}
        onMount={handleMount}
        beforeMount={handleBeforeMount}
        theme={getMonacoTheme(theme)}
        options={{
          ...(editorOptions || {}),
          readOnly: true,
          contextmenu: false,
          wordWrap: 'on',
          domReadOnly: true,
          lineNumbers: 'on',
          hover: { enabled: false },
          scrollbar: {
            ...(editorOptions?.scrollbar || {}),
            vertical:
              height.type === 'content' && height.maxHeightRem === undefined
                ? 'hidden'
                : 'visible',
          },
          glyphMargin: true,
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 5,
          folding: true,
        }}
      />
    </div>
  );
}

