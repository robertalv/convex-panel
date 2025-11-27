import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor, { BeforeMount, OnMount } from '@monaco-editor/react';
import { executeCustomQuery, FunctionResult } from '../utils/functionExecution';

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

    // Define dark theme
    monacoInstance.editor.defineTheme('convex-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c084fc' },
        { token: 'string', foreground: 'fbbf24' },
        { token: 'number', foreground: 'fb923c' },
      ],
      colors: {
        'editor.background': '#0F1115',
        'editor.foreground': '#d1d5db',
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

  const queryEditor = (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid #2D313A',
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 500, color: '#9ca3af' }}>
          Custom Query
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <Editor
          height="100%"
          defaultLanguage="typescript"
          theme="convex-dark"
          value={code}
          beforeMount={handleEditorWillMount}
          onMount={handleEditorDidMount}
          onChange={(value) => value && setCode(value)}
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

