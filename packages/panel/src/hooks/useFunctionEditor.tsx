import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor, { type OnMount } from '../components/editor/lazy-editor';
import { executeCustomQuery } from '../utils/api/functionExecution';
import type { FunctionResult } from '../utils/api/functionExecution';
import { useThemeSafe } from './useTheme';
import * as ts from 'typescript';
import { getConvexPanelTheme } from '../components/editor/editor-theme';

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
  const saveActionRef = useRef<() => void>(() => {});

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
      const transpiled = ts.transpileModule(code, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2020,
          module: ts.ModuleKind.ESNext,
          jsx: ts.JsxEmit.React,
          isolatedModules: true,
        },
        fileName: 'function.ts',
      });

      const preamble = `import { query, internalQuery } from "convex:/_system/repl/wrappers.js";\n`;
      const fullCode = preamble + transpiled.outputText;

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
  }, [adminClient, code, componentId, isInFlight, onResult]);

  // Store run function in ref
  useEffect(() => {
    saveActionRef.current = runCustomQuery;
  }, [runCustomQuery]);

  const convexPanelTheme = getConvexPanelTheme(theme);

  const handleEditorDidMount: OnMount = (editor) => {
    editor.commands.addCommand({
      name: 'runCustomQuery',
      bindKey: { win: 'Ctrl-Enter', mac: 'Command-Enter' },
      exec: () => {
        if (!isInFlight && saveActionRef.current) {
          saveActionRef.current();
        }
      },
    });
  };

  const queryEditor = (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <Editor
        height="100%"
        language="typescript"
        theme={convexPanelTheme}
        value={code}
        onMount={handleEditorDidMount}
        onChange={(value: string | undefined) => {
          if (value !== null && value !== undefined) {
            setCode(value);
          }
        }}
        options={{
          scrollBeyondLastLine: false,
          fontSize: 13,
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

