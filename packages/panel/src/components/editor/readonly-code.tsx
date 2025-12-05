import React, { useMemo } from 'react';
import Editor from './lazy-editor';
import { useThemeSafe } from '../../hooks/useTheme';
import { getConvexPanelTheme } from './editor-theme';
import { editorOptions } from './editor-options';
import type { HighlightLines, ParentHeight, ContentHeight } from '../../types/editor';
import { maxHeightPixels } from '../../types/editor';

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
  const { theme } = useThemeSafe();
  const markers = useMemo(() => {
    if (!highlightLines) return [];
    return [
      {
        startRow: highlightLines.startLineNumber - 1,
        startCol: 0,
        endRow: highlightLines.endLineNumber - 1,
        endCol: 1,
        className: 'ace-highlight-line',
        type: 'fullLine',
      },
    ];
  }, [highlightLines]);

  const initialHeight: React.CSSProperties =
    height.type === 'content'
      ? {
          height: Math.min((code?.split('\n').length ?? 0) * 18, maxHeightPixels(height)),
        }
      : { height: '100%' };

  return (
    <div
      style={initialHeight}
      key={path}
    >
      <Editor
        value={code}
        path={path}
        language={language}
        theme={getConvexPanelTheme(theme)}
        markers={markers as any}
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
            verticalScrollbarSize:
              height.type === 'content' && height.maxHeightRem === undefined
                ? 0
                : 10,
          },
          glyphMargin: !disableLineNumbers,
          lineNumbersMinChars: disableLineNumbers ? 0 : 5,
          folding: !disableLineNumbers,
        }}
      />
    </div>
  );
}

