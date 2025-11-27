import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor, { BeforeMount, OnMount } from '@monaco-editor/react';
import { executeCustomQuery, FunctionResult } from '../utils/functionExecution';
import { useThemeSafe } from './useTheme';

interface UseFunctionEditorProps {
  adminClient: any;
  deploymentUrl?: string;
  initialTableName?: string | null;
  componentId?: string | null;
  runHistoryItem?: any;
  onResult?: (result: FunctionResult) => void;
}

export interface UseFunctionEditorReturn {
  queryEditor: React.ReactElement;
  code: string;
  setCode: (code: string) => void;
  result: FunctionResult | undefined;
  loading: boolean;
  lastRequestTiming: { startedAt: number; endedAt: number } | undefined;
  runCustomQuery: () => Promise<void>;
}

const convexExtraLib = `
declare type ConvexQueryCtx = {
  db: {
    query: (table: string) => {
      take: (limit: number) => Promise<any>;
    };
  };
};

declare function query<T>(config: {
  handler: (ctx: ConvexQueryCtx) => Promise<T> | T;
}): Promise<T>;
`;

const defaultCode = (tableName: string) => `export default query({
  handler: async (ctx) => {
    console.log("Write and test your query function here!");
    return await ctx.db.query("${tableName}").take(10);
  },
})`;

export function useFunctionEditor({
  adminClient,
  deploymentUrl,
  initialTableName,
  componentId,
  runHistoryItem,
  onResult,
}: UseFunctionEditorProps): UseFunctionEditorReturn {
  const { theme } = useThemeSafe();
  const [code, setCode] = useState<string>('');
  const [isInFlight, setIsInFlight] = useState(false);
  const [result, setResult] = useState<FunctionResult | undefined>();
  const [lastRequestTiming, setLastRequestTiming] = useState<{
    startedAt: number;
    endedAt: number;
  }>();
  const [monaco, setMonaco] = useState<Parameters<BeforeMount>[0]>();
  const saveActionRef = useRef<() => void>();

  // Initialize code
  useEffect(() => {
    if (initialTableName) {
      setCode(defaultCode(initialTableName));
    } else {
      setCode(defaultCode('YOUR_TABLE_NAME'));
    }
  }, [initialTableName]);

  // Reset result when history item changes
  useEffect(() => {
    if (runHistoryItem) {
      setResult(undefined);
      setLastRequestTiming(undefined);
      if (runHistoryItem.type === 'custom' && runHistoryItem.code) {
        setCode(runHistoryItem.code);
      }
    }
  }, [runHistoryItem]);

  const runCustomQuery = useCallback(async () => {
    if (!adminClient || !code || isInFlight) {
      return;
    }

    const startedAt = Date.now();
    setIsInFlight(true);
    setResult(undefined);

    try {
      if (!monaco) {
        throw new Error('Monaco editor not initialized');
      }

      // Get TypeScript worker
      const worker = await monaco.languages.typescript.getTypeScriptWorker();
      const model = monaco.editor.getModels()[0];
      if (!model) {
        throw new Error('No editor model found');
      }

      const client = await worker(model.uri);
      const compiled = await client.getEmitOutput(model.uri.toString());

      if (!compiled.outputFiles || compiled.outputFiles.length === 0) {
        throw new Error('Failed to compile code');
      }

      // Add preamble for Convex
      const preamble = `import { query, internalQuery } from "convex:/_system/repl/wrappers.js";\n`;
      const fullCode = preamble + compiled.outputFiles[0].text;

      // For custom queries, args are typically embedded in the code
      // But we can pass empty args object as the code itself handles arguments
      const functionResult = await executeCustomQuery(adminClient, fullCode, componentId, {}, deploymentUrl);

      const endedAt = Date.now();
      setLastRequestTiming({ startedAt, endedAt });
      setResult(functionResult);
      onResult?.(functionResult);
    } catch (error: any) {
      const endedAt = Date.now();
      setLastRequestTiming({ startedAt, endedAt });
      setResult({
        success: false,
        errorMessage: error.message || 'An error occurred while executing the custom query',
        logLines: [],
      });
    } finally {
      setTimeout(() => {
        setIsInFlight(false);
      }, 100);
    }
  }, [adminClient, code, monaco, componentId, isInFlight, onResult]);

  // Store run function in ref
  useEffect(() => {
    saveActionRef.current = runCustomQuery;
  }, [runCustomQuery]);

  const handleEditorWillMount: BeforeMount = (monacoInstance) => {
    setMonaco(monacoInstance);

    // Configure TypeScript
    monacoInstance.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monacoInstance.languages.typescript.ScriptTarget.ESNext,
      moduleResolution: monacoInstance.languages.typescript.ModuleResolutionKind.NodeJs,
      allowNonTsExtensions: true,
      isolatedModules: true,
      strict: true,
    });

    // Helper to get theme color from CSS variable
    const getThemeColor = (varName: string, fallback: string = '#0F1115') => {
      // Try to find an element with the theme class
      const themeElement = document.querySelector('.cp-theme-dark, .cp-theme-light') || document.documentElement;
      const color = getComputedStyle(themeElement).getPropertyValue(varName).trim();
      return color || fallback;
    };

    // Helper to convert hex to Monaco format (without #)
    const toMonacoColor = (hex: string) => hex.replace('#', '');

    // Define dark theme
    monacoInstance.editor.defineTheme('convex-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: toMonacoColor(getThemeColor('--color-panel-text-muted', '#6b7280')), fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c084fc' },
        { token: 'string', foreground: 'fbbf24' },
        { token: 'number', foreground: 'fb923c' },
      ],
      colors: {
        'editor.background': getThemeColor('--color-panel-bg', '#0F1115'),
        'editor.foreground': getThemeColor('--color-panel-text', '#d1d5db'),
        'editor.lineHighlightBackground': getThemeColor('--color-panel-bg-secondary', '#16181D'),
        'editor.selectionBackground': getThemeColor('--color-panel-active', 'rgba(255, 255, 255, 0.1)'),
        'editorCursor.foreground': getThemeColor('--color-panel-text', '#d1d5db'),
        'editorLineNumber.foreground': getThemeColor('--color-panel-text-muted', '#6b7280'),
        'editorLineNumber.activeForeground': getThemeColor('--color-panel-text', '#d1d5db'),
        'editorIndentGuide.background': getThemeColor('--color-panel-border', '#2D313A'),
        'editorIndentGuide.activeBackground': getThemeColor('--color-panel-text-muted', '#6b7280'),
        'editorWhitespace.foreground': getThemeColor('--color-panel-border', '#2D313A'),
      },
    });

    // Define light theme
    monacoInstance.editor.defineTheme('convex-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: toMonacoColor(getThemeColor('--color-panel-text-muted', '#9ca3af')), fontStyle: 'italic' },
        { token: 'keyword', foreground: '7c3aed' },
        { token: 'string', foreground: 'd97706' },
        { token: 'number', foreground: 'ea580c' },
      ],
      colors: {
        'editor.background': getThemeColor('--color-panel-bg', '#ffffff'),
        'editor.foreground': getThemeColor('--color-panel-text', '#111827'),
        'editor.lineHighlightBackground': getThemeColor('--color-panel-bg-secondary', '#f9fafb'),
        'editor.selectionBackground': getThemeColor('--color-panel-active', 'rgba(0, 0, 0, 0.1)'),
        'editorCursor.foreground': getThemeColor('--color-panel-text', '#111827'),
        'editorLineNumber.foreground': getThemeColor('--color-panel-text-muted', '#9ca3af'),
        'editorLineNumber.activeForeground': getThemeColor('--color-panel-text', '#111827'),
        'editorIndentGuide.background': getThemeColor('--color-panel-border', '#e5e7eb'),
        'editorIndentGuide.activeBackground': getThemeColor('--color-panel-text-muted', '#9ca3af'),
        'editorWhitespace.foreground': getThemeColor('--color-panel-border', '#e5e7eb'),
      },
    });
  };

  const handleEditorDidMount: OnMount = (editor, monacoInstance) => {
    // Add keyboard shortcut for running (Ctrl+Enter or Cmd+Enter)
    editor.addAction({
      id: 'runCustomQuery',
      label: 'Run Custom Query',
      keybindings: [
        monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter,
      ],
      run: () => {
        if (!isInFlight && saveActionRef.current) {
          saveActionRef.current();
        }
      },
    });
  };

  // Update Monaco theme when theme changes
  useEffect(() => {
    if (monaco) {
      const monacoTheme = theme === 'light' ? 'convex-light' : 'convex-dark';
      monaco.editor.setTheme(monacoTheme);
    }
  }, [theme, monaco]);

  const monacoTheme = theme === 'light' ? 'convex-light' : 'convex-dark';

  const queryEditor = (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid var(--color-panel-border)',
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-panel-text-secondary)' }}>
          Custom Query
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <Editor
          height="100%"
          defaultLanguage="typescript"
          theme={monacoTheme}
          value={code}
          beforeMount={handleEditorWillMount}
          onMount={handleEditorDidMount}
          onChange={(value) => {
            if (value !== null && value !== undefined) {
              setCode(value);
            }
          }}
          options={{
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 13,
            fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            scrollbar: {
              horizontalScrollbarSize: 8,
              verticalScrollbarSize: 8,
            },
            wordWrap: 'on',
            tabSize: 2,
            readOnly: false,
            domReadOnly: false,
            contextmenu: true,
          }}
        />
      </div>
    </div>
  );

  return {
    queryEditor,
    code,
    setCode,
    result,
    loading: isInFlight,
    lastRequestTiming,
    runCustomQuery,
  } as UseFunctionEditorReturn;
}

