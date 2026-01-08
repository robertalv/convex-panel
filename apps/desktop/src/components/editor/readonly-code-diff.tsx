import { DiffEditor } from './lazy-editor';
import { useThemeSafe } from '../../hooks/useTheme';
import { getConvexPanelTheme } from './editor-theme';
import { editorOptions } from './editor-options';
import type { ParentHeight, ContentHeight } from '../../types/editor';

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

  // Since there is no simple way to pre-compute the initial height of a diff,
  // we default to 200px and wait for the first onMount event handler
  // to set the actual height
  const initialHeight =
    height.type === 'content' ? { height: '200px' } : { height: '100%' };

  return (
    <div style={initialHeight}>
      <DiffEditor
        original={originalCode}
        modified={modifiedCode}
        language={language}
        theme={getConvexPanelTheme(theme)}
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
            horizontalScrollbarSize: 8,
            verticalScrollbarSize:
              (height.type === 'content' && height.maxHeightRem === undefined) ? 0 : 8,
          },
          glyphMargin: true,
          folding: true,
        }}
      />
    </div>
  );
}
