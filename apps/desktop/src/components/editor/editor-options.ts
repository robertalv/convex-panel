import type { EditorProps } from './lazy-editor';

export const editorOptions: EditorProps['options'] = {
  scrollBeyondLastLine: false,
  lineNumbers: 'on',
  glyphMargin: false,
  lineNumbersMinChars: 2,
  scrollbar: {
    horizontalScrollbarSize: 8,
    verticalScrollbarSize: 8,
  },
  wordWrap: 'off',
  fontSize: 13,
  folding: true,
};

