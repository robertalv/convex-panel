import React, { useState, useEffect, useRef } from 'react';
import type { editor } from 'monaco-editor';
import Editor from './lazy-monaco-editor';
import type { BeforeMount, OnMount } from './lazy-monaco-editor';
import { useThemeSafe } from '../../hooks/useTheme';
import { setupMonacoThemes, getMonacoTheme } from './monaco-theme';
import { editorOptions } from './editor-options';
import type { HighlightLines, ParentHeight, ContentHeight } from '../../types/editor';
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
      width: ref.current?.offsetWidth || 0,
    });
  };
  editor.onDidContentSizeChange(updateHeight);
}

export type ReadonlyCodeProps = {
  code: string;
  language?: string;
  highlightLines?: HighlightLines;
  path: string;
  height?: ParentHeight | ContentHeight;
  disableLineNumbers?: boolean;
};

export function ReadonlyCode({
  code,
  language = 'json',
  highlightLines,
  path,
  height = { type: 'parent' },
  disableLineNumbers = false,
}: ReadonlyCodeProps) {
  const [editor, setEditor] = useState<editor.IStandaloneCodeEditor | null>(null);
  const { theme } = useThemeSafe();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightLines === undefined || !editor) {
      return;
    }
    // Paint the selected line.
    editor.deltaDecorations(
      [],
      [
        {
          range: {
            startLineNumber: highlightLines.startLineNumber,
            startColumn: 1,
            endLineNumber: highlightLines.endLineNumber,
            endColumn: 1,
          },
          options: {
            isWholeLine: true,
            marginClassName: 'monacoLineHighlight',
            inlineClassName: 'monacoLineHighlight',
          },
        },
      ],
    );
  }, [editor, highlightLines, path]);

  // code.length * 18 is a hack from
  // https://github.com/microsoft/monaco-editor/issues/794#issuecomment-383523405
  // If it's wrong (probably due to font size changes), worst case there will
  // be a bit of a UI flash from our incorrect guess to the correct value that's
  // set in `updateHeight` based on the actual content size below.
  let initialHeight: React.CSSProperties;
  if (height.type === 'content') {
    const contentHeightGuessPixels = (code?.split('\n').length ?? 0) * 18;
    initialHeight = {
      height: Math.min(contentHeightGuessPixels, maxHeightPixels(height)),
    };
  } else {
    initialHeight = {
      height: '100%',
    };
  }

  const handleBeforeMount: BeforeMount = (monacoInstance) => {
    setupMonacoThemes(monacoInstance);
  };

  const handleMount: OnMount = (e) => {
    setEditor(e);
    if (height.type === 'content') {
      setupAutoHeight(e, ref, maxHeightPixels(height));
    }
    if (highlightLines) {
      e.revealLineNearTop(highlightLines.startLineNumber);
    } else {
      e.revealLineNearTop(1);
    }
  };

  return (
    <div
      ref={ref}
      style={initialHeight}
      key={path}
    >
      <Editor
        value={code}
        path={path}
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
          lineNumbers: disableLineNumbers ? 'off' : 'on',
          hover: { enabled: false },
          scrollbar: {
            ...(editorOptions?.scrollbar || {}),
            vertical:
              height.type === 'content' && height.maxHeightRem === undefined
                ? 'hidden'
                : 'visible',
          },
          glyphMargin: !disableLineNumbers,
          lineDecorationsWidth: disableLineNumbers ? 0 : 10,
          lineNumbersMinChars: disableLineNumbers ? 0 : 5,
          folding: !disableLineNumbers,
        }}
      />
    </div>
  );
}

