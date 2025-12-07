/// <reference types="../../types/ace-workers" />
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import AceEditor, { type IAceEditorProps } from 'react-ace';
import type { Ace } from 'ace-builds';

type MaybePromise<T> = Promise<T> | T;

export type BeforeMount = () => void;
export type OnMount = (editor: Ace.Editor) => void;
export type DiffOnMount = (editors: { original: Ace.Editor; modified: Ace.Editor }) => void;

type ConvexPanelLikeOptions = {
  readOnly?: boolean;
  domReadOnly?: boolean;
  wordWrap?: 'on' | 'off';
  lineNumbers?: 'on' | 'off';
  fontSize?: number;
  lineNumbersMinChars?: number;
  tabSize?: number;
  minimap?: { enabled?: boolean };
  contextmenu?: boolean;
  scrollBeyondLastLine?: boolean;
  hover?: { enabled?: boolean };
  glyphMargin?: boolean;
  folding?: boolean;
  padding?: { top?: number; bottom?: number };
  scrollbar?: {
    horizontalScrollbarSize?: number;
    verticalScrollbarSize?: number;
  };
};

type Annotation = Ace.Annotation;

type BaseEditorProps = {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, event?: any) => void;
  language?: string;
  defaultLanguage?: string;
  theme?: string;
  height?: string | number;
  width?: string | number;
  className?: string;
  path?: string;
  onMount?: OnMount;
  beforeMount?: BeforeMount;
  options?: ConvexPanelLikeOptions;
  markers?: Annotation[];
  annotations?: Annotation[];
  readOnly?: boolean;
  loading?: React.ReactNode;
};

const modeLoaders: Record<string, () => MaybePromise<unknown>> = {
  javascript: () => import('ace-builds/src-noconflict/mode-javascript'),
  typescript: () => import('ace-builds/src-noconflict/mode-typescript'),
  json: () => import('ace-builds/src-noconflict/mode-json'),
  sql: () => import('ace-builds/src-noconflict/mode-sql'),
  css: () => import('ace-builds/src-noconflict/mode-css'),
  html: () => import('ace-builds/src-noconflict/mode-html'),
  text: () => import('ace-builds/src-noconflict/mode-text'),
};

const workerLoaders: Record<string, () => MaybePromise<unknown>> = {
  javascript: () => import('ace-builds/src-noconflict/worker-javascript'),
  typescript: () => import('ace-builds/src-noconflict/worker-javascript'),
  json: () => import('ace-builds/src-noconflict/worker-json'),
  sql: () => import('ace-builds/src-noconflict/worker-json'),
  css: () => import('ace-builds/src-noconflict/worker-css'),
  html: () => import('ace-builds/src-noconflict/worker-html'),
};

const themeLoaders: Record<string, () => MaybePromise<unknown>> = {
  monokai: () => import('ace-builds/src-noconflict/theme-monokai'),
  github: () => import('ace-builds/src-noconflict/theme-github'),
  twilight: () => import('ace-builds/src-noconflict/theme-twilight'),
  dracula: () => import('ace-builds/src-noconflict/theme-dracula'),
  tomorrow: () => import('ace-builds/src-noconflict/theme-tomorrow'),
  xcode: () => import('ace-builds/src-noconflict/theme-xcode'),
};

const resolveAceTheme = (theme?: string) => {
  if (!theme) return 'monokai';
  if (theme === 'convex-dark') return 'monokai';
  if (theme === 'convex-light') return 'monokai';
  return themeLoaders[theme] ? theme : 'monokai';
};

let languageToolsImport: Promise<unknown> | null = null;

const ensureLanguageTools = (): Promise<unknown> => {
  if (languageToolsImport) {
    return languageToolsImport;
  }
  
  languageToolsImport = import('ace-builds/src-noconflict/ext-language_tools').catch(() => {
    // Silently fail - editor will work without autocomplete
    return null;
  });
  
  return languageToolsImport;
};

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

function useAceSetup(language?: string, theme?: string) {
  const [modeReady, setModeReady] = useState(false);
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    const normalized = (language || 'javascript').toLowerCase();
    const modeLoader = modeLoaders[normalized];
    const workerLoader = workerLoaders[normalized];
    
    setModeReady(false);
    
    if (!modeLoader) {
      setModeReady(true);
      return;
    }

    let cancelled = false;
    
    Promise.all([
      modeLoader(),
      workerLoader?.(),
      ensureLanguageTools(),
    ]).then(() => {
      if (!cancelled) {
        setModeReady(true);
      }
    }).catch(() => {
      if (!cancelled) {
        setModeReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [language]);

  useEffect(() => {
    const aceTheme = resolveAceTheme(theme);
    const themeLoader = themeLoaders[aceTheme];
    
    setThemeReady(false);
    
    if (!themeLoader) {
      setThemeReady(true);
      return;
    }

    let cancelled = false;
    
    (themeLoader() as Promise<unknown>).then(() => {
      if (!cancelled) {
        setThemeReady(true);
      }
    }).catch(() => {
      if (!cancelled) {
        setThemeReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [theme]);

  return { modeReady, themeReady };
}

function mapOptions(opts?: ConvexPanelLikeOptions): IAceEditorProps['setOptions'] {
  if (!opts) return undefined;
  return {
    useWorker: true,
    tabSize: opts.tabSize ?? 2,
    showLineNumbers: opts.lineNumbers !== 'off',
    displayIndentGuides: true,
    showGutter: opts.lineNumbers !== 'off',
    highlightGutterLine: opts.lineNumbers !== 'off',
    wrap: opts.wordWrap === 'on',
    showPrintMargin: false,
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
    enableSnippets: true,
    fontSize: opts.fontSize,
  };
}

const BaseEditor = React.forwardRef<AceEditor, BaseEditorProps>((props, ref) => {
  const {
    value,
    defaultValue,
    onChange,
    language = props.defaultLanguage || 'javascript',
    theme = 'convex-dark',
    height = '100%',
    width = '100%',
    className,
    options,
    onMount,
    beforeMount,
    markers,
    annotations,
    readOnly,
    loading,
    ...rest
  } = props;

  const { modeReady, themeReady } = useAceSetup(language, theme);
  const editorRef = React.useRef<Ace.Editor | null>(null);

  useEffect(() => {
    beforeMount?.();
  }, [beforeMount]);

  // Update mode when language changes
  useEffect(() => {
    if (editorRef.current && modeReady) {
      const normalizedMode = language?.toLowerCase() || 'typescript';
      const session = editorRef.current.getSession();
      const mode = session.getMode() as any;
      const currentModeId = mode.$id || mode.$name || '';
      const targetModeId = `ace/mode/${normalizedMode}`;
      
      if (currentModeId !== targetModeId && !currentModeId.includes(normalizedMode)) {
        session.setMode(targetModeId);
      }
    }
  }, [language, modeReady]);

  const handleLoad = useMemo(() => {
    return (editorInstance: Ace.Editor) => {
      editorRef.current = editorInstance;
      const normalizedMode = language?.toLowerCase() || 'typescript';
      const session = editorInstance.getSession();
      const mode = session.getMode() as any;
      const currentModeId = mode.$id || mode.$name || '';
      const targetModeId = `ace/mode/${normalizedMode}`;
      
      if (currentModeId !== targetModeId && !currentModeId.includes(normalizedMode)) {
        session.setMode(targetModeId);
      }
      onMount?.(editorInstance);
    };
  }, [onMount, language]);

  // Wait for mode and theme to be ready before rendering
  if (!modeReady || !themeReady) {
    return loading || <EditorLoading height={height} />;
  }

  return (
    <Suspense fallback={loading || <EditorLoading height={height} />}>
      <AceEditor
        ref={ref as any}
        mode={language?.toLowerCase()}
        theme={resolveAceTheme(theme)}
        name={className || 'ace-editor'}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        width={typeof width === 'number' ? `${width}px` : width}
        height={typeof height === 'number' ? `${height}px` : height}
        className={className}
        setOptions={mapOptions(options)}
        readOnly={readOnly ?? options?.readOnly ?? options?.domReadOnly}
        showGutter={options?.lineNumbers !== 'off'}
        wrapEnabled={options?.wordWrap === 'on'}
        highlightActiveLine={!readOnly}
        enableBasicAutocompletion
        enableLiveAutocompletion={true}
        enableSnippets={true}
        annotations={annotations || markers}
        markers={markers as any}
        editorProps={{ $blockScrolling: Infinity }}
        onLoad={handleLoad}
        {...rest}
      />
    </Suspense>
  );
});
BaseEditor.displayName = 'BaseEditor';

export const Editor: React.FC<BaseEditorProps> = (props) => <BaseEditor {...props} />;

type AceDiffEditorProps = {
  original: string;
  modified: string;
  language?: string;
  theme?: string;
  height?: string | number;
  width?: string | number;
  onMount?: DiffOnMount;
  beforeMount?: BeforeMount;
  options?: ConvexPanelLikeOptions;
};

export const DiffEditor: React.FC<AceDiffEditorProps> = ({
  original,
  modified,
  language = 'typescript',
  theme = 'convex-dark',
  height = '100%',
  width = '100%',
  onMount,
  beforeMount,
  options,
}) => {
  const { modeReady, themeReady } = useAceSetup(language, resolveAceTheme(theme));

  useEffect(() => {
    beforeMount?.();
  }, [beforeMount]);

  const editorsRef = React.useRef<{ left?: Ace.Editor; right?: Ace.Editor }>({});

  const commonProps = {
    mode: language?.toLowerCase(),
    theme: resolveAceTheme(theme),
    width: '100%',
    height: typeof height === 'number' ? `${height}px` : height,
    readOnly: true,
    setOptions: mapOptions({ ...options, readOnly: true, lineNumbers: 'on', wordWrap: 'on' }),
    showGutter: true,
    wrapEnabled: options?.wordWrap === 'on',
    highlightActiveLine: false,
    editorProps: { $blockScrolling: Infinity },
  } as const;

  const handleMount = (side: 'left' | 'right', editor?: Ace.Editor) => {
    if (!editor) return;
    const normalizedMode = language?.toLowerCase() || 'javascript';
    const session = editor.getSession();
    const mode = session.getMode() as any;
    const currentModeId = mode.$id || mode.$name || '';
    const targetModeId = `ace/mode/${normalizedMode}`;
    
    if (currentModeId !== targetModeId && !currentModeId.includes(normalizedMode)) {
      session.setMode(targetModeId);
    }
    editorsRef.current = { ...editorsRef.current, [side]: editor };
    const { left, right } = editorsRef.current;
    if (left && right) {
      onMount?.({ original: left, modified: right });
    }
  };

  if (!modeReady || !themeReady) {
    return <EditorLoading height={height} />;
  }

  return (
    <Suspense fallback={<EditorLoading height={height} />}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width }}>
        <AceEditor
          {...commonProps}
          name="ace-diff-original"
          value={original}
          onLoad={(editor) => handleMount('left', editor)}
        />
        <AceEditor
          {...commonProps}
          name="ace-diff-modified"
          value={modified}
          onLoad={(editor) => handleMount('right', editor)}
        />
      </div>
    </Suspense>
  );
};

export type EditorProps = BaseEditorProps;
export type DiffEditorProps = AceDiffEditorProps;

// Default export for compatibility (Editor)
export default Editor;

