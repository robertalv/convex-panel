/**
 * CustomQuerySheet Component
 * Sheet for running custom queries or selected functions on a Convex deployment
 * Uses the /api/run_test_function HTTP endpoint for custom queries
 * Uses function invocation for selected module functions
 * Uses Monaco Editor for code editing with TypeScript support
 */

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  X,
  Play,
  AlertCircle,
  CheckCircle2,
  Maximize2,
  Minimize2,
  PanelBottom,
  PanelRight,
} from "lucide-react";
import * as ts from "typescript";
import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import { useTheme } from "@/contexts/ThemeContext";
import { IconButton } from "@/components/ui/button";
import { ComponentSelector } from "./ComponentSelector";
import {
  FunctionSelector,
  isCustomQuery,
  type ModuleFunction,
  type SelectedFunction,
} from "./FunctionSelector";
import type { ConvexComponent } from "../types";

/** Layout mode for the Function Runner */
export type FunctionRunnerLayout = "side" | "bottom" | "fullscreen";

export interface CustomQuerySheetProps {
  tableName: string;
  adminClient: any;
  deploymentUrl?: string;
  accessToken?: string;
  /** Initial component ID (null = root app) */
  componentId: string | null;
  onClose: () => void;
  // New props for selectors
  availableFunctions?: ModuleFunction[];
  /** List of available components (ConvexComponent objects with id, name, path) */
  availableComponents?: ConvexComponent[];
  initialSelectedFunction?: SelectedFunction;
  /** Called when component changes - receives component ID (null = root app) */
  onComponentChange?: (componentId: string | null) => void;
  onFunctionChange?: (fn: SelectedFunction) => void;
  /** Layout mode: side (right panel), bottom (horizontal), or fullscreen */
  layoutMode?: FunctionRunnerLayout;
  /** Called when layout mode changes */
  onLayoutModeChange?: (mode: FunctionRunnerLayout) => void;
}

interface QueryResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime?: number;
  logLines?: LogLine[];
}

interface LogLine {
  level: string;
  message: string;
}

// Convex type definitions for autocomplete
const CONVEX_TYPE_DEFINITIONS = `
declare global {
  /**
   * Define a public query function.
   * @example
   * export default query({
   *   handler: async (ctx) => {
   *     return await ctx.db.query("messages").collect();
   *   },
   * });
   */
  const query: <Args extends Record<string, any> = {}>(definition: {
    args?: Args;
    handler: (ctx: QueryContext, args: Args) => Promise<any> | any;
  }) => any;

  /**
   * Define an internal query function (not exposed to clients).
   */
  const internalQuery: <Args extends Record<string, any> = {}>(definition: {
    args?: Args;
    handler: (ctx: QueryContext, args: Args) => Promise<any> | any;
  }) => any;

  /**
   * The context object passed to query handlers.
   */
  interface QueryContext {
    /**
     * Database interface for reading data.
     */
    db: DatabaseReader;
    /**
     * Authentication info for the current user.
     */
    auth: Auth;
  }

  /**
   * Database reader interface.
   */
  interface DatabaseReader {
    /**
     * Start a query on a table.
     * @param tableName The name of the table to query
     */
    query<T = any>(tableName: string): QueryBuilder<T>;
    
    /**
     * Get a document by its ID.
     * @param id The document ID
     */
    get<T = any>(id: string): Promise<T | null>;
    
    /**
     * Normalize a document ID.
     * @param tableName The table name
     * @param id The ID string
     */
    normalizeId(tableName: string, id: string): string | null;
  }

  /**
   * Query builder for constructing database queries.
   */
  interface QueryBuilder<T> {
    /**
     * Filter documents using a predicate.
     */
    filter(predicate: (q: FilterBuilder<T>) => FilterExpression): QueryBuilder<T>;
    
    /**
     * Order results by a field or index.
     */
    order(order: "asc" | "desc"): QueryBuilder<T>;
    
    /**
     * Use an index for the query.
     * @param indexName The name of the index
     * @param indexRange Optional range constraints
     */
    withIndex(indexName: string, indexRange?: (q: IndexRangeBuilder) => IndexRange): QueryBuilder<T>;
    
    /**
     * Collect all results into an array.
     */
    collect(): Promise<T[]>;
    
    /**
     * Take the first n results.
     */
    take(n: number): Promise<T[]>;
    
    /**
     * Get only the first result.
     */
    first(): Promise<T | null>;
    
    /**
     * Get the unique result (throws if not exactly one).
     */
    unique(): Promise<T | null>;
    
    /**
     * Paginate results.
     */
    paginate(opts: PaginationOptions): Promise<PaginationResult<T>>;
  }

  interface FilterBuilder<T> {
    eq<K extends keyof T>(field: K, value: T[K]): FilterExpression;
    neq<K extends keyof T>(field: K, value: T[K]): FilterExpression;
    lt<K extends keyof T>(field: K, value: T[K]): FilterExpression;
    lte<K extends keyof T>(field: K, value: T[K]): FilterExpression;
    gt<K extends keyof T>(field: K, value: T[K]): FilterExpression;
    gte<K extends keyof T>(field: K, value: T[K]): FilterExpression;
    and(...expressions: FilterExpression[]): FilterExpression;
    or(...expressions: FilterExpression[]): FilterExpression;
    not(expression: FilterExpression): FilterExpression;
  }

  interface FilterExpression {}
  interface IndexRangeBuilder {}
  interface IndexRange {}

  interface PaginationOptions {
    cursor: string | null;
    numItems: number;
  }

  interface PaginationResult<T> {
    page: T[];
    isDone: boolean;
    continueCursor: string;
  }

  interface Auth {
    getUserIdentity(): Promise<UserIdentity | null>;
  }

  interface UserIdentity {
    tokenIdentifier: string;
    subject: string;
    issuer: string;
    name?: string;
    email?: string;
    pictureUrl?: string;
    nickname?: string;
    givenName?: string;
    familyName?: string;
    emailVerified?: boolean;
    phoneNumber?: string;
    phoneNumberVerified?: boolean;
    updatedAt?: string;
  }

  /**
   * Console logging functions.
   */
  const console: {
    log(...args: any[]): void;
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
    debug(...args: any[]): void;
    time(label: string): void;
    timeEnd(label: string): void;
  };

  const process: {
    env: { [key: string]: string | undefined };
  };
}

export {};
`;

// Monaco editor options for a clean, minimal UI
const editorOptions = {
  automaticLayout: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbers: "on" as const,
  lineNumbersMinChars: 3,
  lineDecorationsWidth: 0,
  overviewRulerBorder: false,
  contextmenu: true,
  bracketPairColorization: { enabled: true },
  guides: { bracketPairs: true, indentation: true },
  renderLineHighlight: "line" as const,
  fontSize: 13,
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  tabSize: 2,
  insertSpaces: true,
  wordWrap: "on" as const,
  folding: true,
  scrollbar: {
    vertical: "auto" as const,
    horizontal: "auto" as const,
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
  },
  padding: { top: 12, bottom: 12 },
};

// JSON editor options (simpler for args editing)
const jsonEditorOptions = {
  ...editorOptions,
  lineNumbers: "off" as const,
  folding: false,
  renderLineHighlight: "none" as const,
  padding: { top: 8, bottom: 8 },
};

// Default query template
function getDefaultQuery(tableName: string): string {
  return `export default query({
  handler: async (ctx) => {
    console.log("Write and test your query function here!");
    return await ctx.db.query("${tableName}").take(10);
  },
})`;
}

// Helper to get admin key from adminClient
function getAdminKey(adminClient: any): string | null {
  if (!adminClient) return null;

  // Try different ways to get the admin key
  if (adminClient._adminAuth) return adminClient._adminAuth;
  if (adminClient.adminKey) return adminClient.adminKey;
  if (typeof adminClient.getAdminKey === "function")
    return adminClient.getAdminKey();

  // Check internal state
  const clientState = (adminClient as any).state;
  if (clientState?.auth?.adminKey) return clientState.auth.adminKey;

  // Check if it's stored in options
  const options = (adminClient as any).options;
  if (options?.adminKey) return options.adminKey;

  return null;
}

// Parse log line from API response
function parseLogLine(logString: string): LogLine {
  const logMatch = logString.match(/^\[(LOG|ERROR|WARN|INFO)\]\s*(.+)$/);
  if (logMatch) {
    const level = logMatch[1].toLowerCase();
    let message = logMatch[2].trim();
    // Remove quotes from message if present
    if (
      (message.startsWith("'") && message.endsWith("'")) ||
      (message.startsWith('"') && message.endsWith('"'))
    ) {
      message = message.slice(1, -1);
    }
    return {
      level: level === "log" ? "info" : level,
      message,
    };
  }
  return { level: "info", message: logString };
}

// Parse function args schema to generate default JSON
function getDefaultArgsJson(fn: ModuleFunction): string {
  if (!fn.args) return "{}";

  try {
    const argsSchema =
      typeof fn.args === "string" ? JSON.parse(fn.args) : fn.args;

    // If it's already an object, use it as template
    if (argsSchema && typeof argsSchema === "object") {
      // Generate default values based on schema
      const defaults: Record<string, any> = {};

      if (argsSchema.type === "object" && argsSchema.fields) {
        for (const [key, fieldSchema] of Object.entries(argsSchema.fields)) {
          const schema = fieldSchema as any;
          if (schema.type === "string") defaults[key] = "";
          else if (
            schema.type === "number" ||
            schema.type === "int64" ||
            schema.type === "float64"
          )
            defaults[key] = 0;
          else if (schema.type === "boolean") defaults[key] = false;
          else if (schema.type === "array") defaults[key] = [];
          else if (schema.type === "object") defaults[key] = {};
          else if (schema.type === "id") defaults[key] = "";
          else defaults[key] = null;
        }
      }

      return JSON.stringify(defaults, null, 2);
    }
  } catch {
    // Ignore parse errors
  }

  return "{}";
}

export function CustomQuerySheet({
  tableName,
  adminClient,
  deploymentUrl,
  accessToken,
  componentId: initialComponentId,
  onClose,
  availableFunctions = [],
  availableComponents = [],
  initialSelectedFunction,
  onComponentChange,
  onFunctionChange,
  layoutMode: externalLayoutMode,
  onLayoutModeChange,
}: CustomQuerySheetProps) {
  // Layout mode state (internal if not controlled)
  const [internalLayoutMode, setInternalLayoutMode] =
    useState<FunctionRunnerLayout>("side");
  const layoutMode = externalLayoutMode ?? internalLayoutMode;
  const isBottomLayout = layoutMode === "bottom";

  const handleLayoutModeChange = useCallback(
    (mode: FunctionRunnerLayout) => {
      if (onLayoutModeChange) {
        onLayoutModeChange(mode);
      } else {
        setInternalLayoutMode(mode);
      }
    },
    [onLayoutModeChange],
  );

  // Component selection state
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    initialComponentId,
  );

  // Function selection state - default to custom query
  const [selectedFunction, setSelectedFunction] = useState<SelectedFunction>(
    initialSelectedFunction ?? {
      type: "customQuery",
      table: tableName,
      componentId: initialComponentId,
    },
  );

  // Custom query code state
  const [code, setCode] = useState(() => getDefaultQuery(tableName));

  // Function args JSON state
  const [argsJson, setArgsJson] = useState("{}");

  // Execution state
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const { resolvedTheme } = useTheme();
  const runQueryRef = useRef<() => void>(() => {});

  // Determine if we're in custom query mode
  const isCustomQueryMode = isCustomQuery(selectedFunction);

  // Update default query when table changes
  useEffect(() => {
    setCode(getDefaultQuery(tableName));
    setResult(null);
  }, [tableName]);

  // Update args JSON when selected function changes
  useEffect(() => {
    if (!isCustomQueryMode && selectedFunction) {
      setArgsJson(getDefaultArgsJson(selectedFunction as ModuleFunction));
    }
    setResult(null);
  }, [selectedFunction, isCustomQueryMode]);

  // Handle component change
  const handleComponentChange = useCallback(
    (componentId: string | null) => {
      setSelectedComponentId(componentId);
      // Update custom query componentId
      if (isCustomQueryMode) {
        setSelectedFunction({
          type: "customQuery",
          table: tableName,
          componentId,
        });
      }
      onComponentChange?.(componentId);
    },
    [isCustomQueryMode, tableName, onComponentChange],
  );

  // Handle function change
  const handleFunctionChange = useCallback(
    (fn: SelectedFunction) => {
      setSelectedFunction(fn);
      setResult(null);
      onFunctionChange?.(fn);
    },
    [onFunctionChange],
  );

  // Run custom query via HTTP endpoint
  const runCustomQuery = useCallback(async () => {
    if (!adminClient || isRunning) return;

    // Get deployment URL - try from props first, then from adminClient
    let finalDeploymentUrl = deploymentUrl;
    if (!finalDeploymentUrl) {
      finalDeploymentUrl =
        adminClient.address ||
        adminClient._address ||
        (adminClient as any).options?.url;
    }

    // Get admin key
    const adminKey = accessToken || getAdminKey(adminClient);

    if (!finalDeploymentUrl) {
      setResult({
        success: false,
        error: "Deployment URL not available",
      });
      return;
    }

    if (!adminKey) {
      setResult({
        success: false,
        error: "Admin key not available",
      });
      return;
    }

    setIsRunning(true);
    setResult(null);
    const startTime = Date.now();

    try {
      // Transpile TypeScript to JavaScript
      const transpiled = ts.transpileModule(code, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2020,
          module: ts.ModuleKind.ESNext,
          jsx: ts.JsxEmit.React,
          isolatedModules: true,
        },
        fileName: "customQuery.ts",
      });

      // Prepend the Convex REPL wrapper imports
      const preamble = `import { query, internalQuery } from "convex:/_system/repl/wrappers.js";\n`;
      const fullCode = preamble + transpiled.outputText;

      // Make HTTP POST request to /api/run_test_function
      const response = await fetch(
        `${finalDeploymentUrl}/api/run_test_function`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bundle: {
              path: "testQuery.js",
              source: fullCode,
            },
            adminKey: adminKey,
            args: {},
            format: "convex_encoded_json",
            ...(selectedComponentId && { componentId: selectedComponentId }),
          }),
        },
      );

      const executionTime = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        setResult({
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          executionTime,
        });
        return;
      }

      const responseData = await response.json();

      if (responseData && responseData.status === "success") {
        setResult({
          success: true,
          data: responseData.value,
          executionTime,
          logLines: responseData.logLines
            ? responseData.logLines.map((log: string) => parseLogLine(log))
            : [],
        });
      } else {
        setResult({
          success: false,
          error: responseData?.errorMessage || "Function execution failed",
          executionTime,
          logLines: responseData?.logLines
            ? responseData.logLines.map((log: string) => parseLogLine(log))
            : [],
        });
      }
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      setResult({
        success: false,
        error: error?.message || "Failed to execute query",
        executionTime,
      });
    } finally {
      setIsRunning(false);
    }
  }, [
    adminClient,
    code,
    selectedComponentId,
    deploymentUrl,
    accessToken,
    isRunning,
  ]);

  // Run module function via adminClient
  const runModuleFunction = useCallback(async () => {
    if (!adminClient || isRunning || !selectedFunction || isCustomQueryMode)
      return;

    const fn = selectedFunction as ModuleFunction;

    setIsRunning(true);
    setResult(null);
    const startTime = Date.now();

    try {
      // Parse args JSON
      let args: Record<string, any> = {};
      try {
        args = JSON.parse(argsJson);
      } catch (e) {
        setResult({
          success: false,
          error: "Invalid JSON in arguments",
          executionTime: Date.now() - startTime,
        });
        setIsRunning(false);
        return;
      }

      // Determine the function path to call
      const functionPath = fn.identifier;

      // Call the function based on its type
      let resultData: any;
      const udfType = fn.udfType;

      // Build options with componentId if needed
      const options: any = {};
      if (selectedComponentId) {
        options.componentId = selectedComponentId;
      }

      if (udfType === "query") {
        resultData = await adminClient.query(
          functionPath as any,
          args,
          options,
        );
      } else if (udfType === "mutation") {
        resultData = await adminClient.mutation(
          functionPath as any,
          args,
          options,
        );
      } else if (udfType === "action") {
        resultData = await adminClient.action(
          functionPath as any,
          args,
          options,
        );
      } else {
        setResult({
          success: false,
          error: `Unsupported function type: ${udfType}`,
          executionTime: Date.now() - startTime,
        });
        setIsRunning(false);
        return;
      }

      const executionTime = Date.now() - startTime;

      setResult({
        success: true,
        data: resultData,
        executionTime,
      });
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      setResult({
        success: false,
        error: error?.message || "Failed to execute function",
        executionTime,
      });
    } finally {
      setIsRunning(false);
    }
  }, [
    adminClient,
    argsJson,
    selectedFunction,
    selectedComponentId,
    isRunning,
    isCustomQueryMode,
  ]);

  // Unified run function
  const runQuery = useCallback(() => {
    if (isCustomQueryMode) {
      runCustomQuery();
    } else {
      runModuleFunction();
    }
  }, [isCustomQueryMode, runCustomQuery, runModuleFunction]);

  // Keep runQueryRef updated
  useEffect(() => {
    runQueryRef.current = runQuery;
  }, [runQuery]);

  // Configure Monaco before it mounts
  const handleEditorWillMount: BeforeMount = useCallback((monaco: any) => {
    // Configure TypeScript compiler options
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      module: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      allowNonTsExtensions: true,
      isolatedModules: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      skipLibCheck: true,
      allowSyntheticDefaultImports: true,
    });

    // Disable built-in TypeScript diagnostics for a cleaner experience
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    // Add Convex type definitions
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      CONVEX_TYPE_DEFINITIONS,
      "file:///convex-globals.d.ts",
    );

    // Define custom themes that use a transparent editor background so the
    // surrounding container (which matches the sidebar) shows through.
    monaco.editor.defineTheme("convex-light", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#00000000",
      },
    });

    monaco.editor.defineTheme("convex-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#00000000",
      },
    });
  }, []);

  // Handle editor mount - add keybindings
  const handleEditorDidMount: OnMount = useCallback(
    (editor: any, monaco: any) => {
      // Add Cmd+Enter keybinding to run query
      editor.addAction({
        id: "runQuery",
        label: "Run Query",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        run: () => {
          runQueryRef.current?.();
        },
      });

      // Focus the editor
      editor.focus();
    },
    [],
  );

  // Handle code changes
  const handleEditorChange = useCallback((value: string | undefined) => {
    setCode(value || "");
  }, []);

  // Handle args JSON changes
  const handleArgsChange = useCallback((value: string | undefined) => {
    setArgsJson(value || "{}");
  }, []);

  // Get the selected function's display info
  const selectedFunctionInfo = useMemo(() => {
    if (!selectedFunction || isCustomQueryMode) return null;
    const fn = selectedFunction as ModuleFunction;
    return {
      name: fn.name || fn.identifier?.split(":").pop() || "Unknown",
      type: fn.udfType,
      hasArgs: !!fn.args,
    };
  }, [selectedFunction, isCustomQueryMode]);

  // Show component selector only if there are multiple components
  const showComponentSelector = availableComponents.length > 1;

  return (
    <div
      className="flex flex-col h-full w-full"
      style={{
        backgroundColor: "var(--color-background-raised)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: "1px solid var(--color-border-base)" }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h2
            className="text-sm font-semibold shrink-0"
            style={{ color: "var(--color-text-base)" }}
          >
            Function Input
          </h2>
        </div>
        <div className="flex items-center gap-1">
          {/* Layout toggle buttons */}
          <IconButton
            onClick={() =>
              handleLayoutModeChange(
                layoutMode === "fullscreen" ? "side" : "fullscreen",
              )
            }
            variant="ghost"
            size="sm"
            title={
              layoutMode === "fullscreen" ? "Exit fullscreen" : "Fullscreen"
            }
          >
            {layoutMode === "fullscreen" ? (
              <Minimize2 size={14} />
            ) : (
              <Maximize2 size={14} />
            )}
          </IconButton>
          <IconButton
            onClick={() =>
              handleLayoutModeChange(
                layoutMode === "bottom" ? "side" : "bottom",
              )
            }
            variant="ghost"
            size="sm"
            title={layoutMode === "bottom" ? "Align right" : "Align bottom"}
          >
            {layoutMode === "bottom" ? (
              <PanelRight size={14} />
            ) : (
              <PanelBottom size={14} />
            )}
          </IconButton>
          <IconButton onClick={onClose} variant="ghost" size="sm" title="Close">
            <X size={14} />
          </IconButton>
        </div>
      </div>

      {/* Selector bar - only show when NOT in bottom layout */}
      {!isBottomLayout && (
        <div
          className="flex flex-col gap-2 px-4 py-2 w-full"
          style={{ borderBottom: "1px solid var(--color-border-base)" }}
        >
          {showComponentSelector && (
            <div className="w-full">
              <ComponentSelector
                selectedComponentId={selectedComponentId}
                onSelect={handleComponentChange}
                components={availableComponents}
                fullWidth
                variant="input"
              />
            </div>
          )}
          <div className="w-full">
            <FunctionSelector
              selectedFunction={selectedFunction}
              onSelect={handleFunctionChange}
              functions={availableFunctions}
              componentId={selectedComponentId}
              showCustomQuery={true}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className={
          isBottomLayout
            ? "flex-1 flex overflow-hidden"
            : "flex-1 flex flex-col overflow-hidden"
        }
      >
        <div
          className={
            isBottomLayout
              ? "flex flex-col flex-1 min-w-[320px] max-w-[860px]"
              : "flex flex-col flex-1"
          }
        >
          {/* Selectors in left panel when in bottom layout */}
          {isBottomLayout && (
            <div
              className="flex flex-col gap-2 px-4 py-2 shrink-0"
              style={{ borderBottom: "1px solid var(--color-border-base)" }}
            >
              {showComponentSelector && (
                <div className="w-full">
                  <ComponentSelector
                    selectedComponentId={selectedComponentId}
                    onSelect={handleComponentChange}
                    components={availableComponents}
                    fullWidth
                    variant="input"
                  />
                </div>
              )}
              <div className="w-full">
                <FunctionSelector
                  selectedFunction={selectedFunction}
                  onSelect={handleFunctionChange}
                  functions={availableFunctions}
                  componentId={selectedComponentId}
                  showCustomQuery={true}
                />
              </div>
            </div>
          )}
          {isCustomQueryMode ? (
            <>
              {/* Code editor header */}
              <div
                className="flex items-center justify-between px-4 py-2 shrink-0"
                style={{ borderBottom: "1px solid var(--color-border-base)" }}
              >
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Query Code
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--color-text-subtle)" }}
                >
                  Cmd+Enter to run
                </span>
              </div>

              {/* Monaco Editor for custom query */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <Editor
                  height="100%"
                  defaultLanguage="typescript"
                  value={code}
                  theme={
                    resolvedTheme === "dark" ? "convex-dark" : "convex-light"
                  }
                  options={editorOptions}
                  beforeMount={handleEditorWillMount}
                  onMount={handleEditorDidMount}
                  onChange={handleEditorChange}
                  loading={
                    <div
                      className="flex items-center justify-center h-full"
                      style={{
                        backgroundColor: "var(--color-background-raised)",
                      }}
                    >
                      <span
                        className="text-sm"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        Loading editor...
                      </span>
                    </div>
                  }
                />
              </div>
            </>
          ) : (
            <>
              {/* Function info header */}
              <div
                className="flex items-center justify-between px-4 py-2 shrink-0"
                style={{ borderBottom: "1px solid var(--color-border-base)" }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Arguments
                  </span>
                  {selectedFunctionInfo && (
                    <span
                      className="text-[10px] font-medium uppercase px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor:
                          selectedFunctionInfo.type === "query"
                            ? "rgba(59, 130, 246, 0.1)"
                            : selectedFunctionInfo.type === "mutation"
                              ? "rgba(249, 115, 22, 0.1)"
                              : "rgba(168, 85, 247, 0.1)",
                        color:
                          selectedFunctionInfo.type === "query"
                            ? "rgb(59, 130, 246)"
                            : selectedFunctionInfo.type === "mutation"
                              ? "rgb(249, 115, 22)"
                              : "rgb(168, 85, 247)",
                      }}
                    >
                      {selectedFunctionInfo.type}
                    </span>
                  )}
                </div>
                <span
                  className="text-xs"
                  style={{ color: "var(--color-text-subtle)" }}
                >
                  Cmd+Enter to run
                </span>
              </div>

              {/* JSON Args Editor */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  value={argsJson}
                  theme={
                    resolvedTheme === "dark" ? "convex-dark" : "convex-light"
                  }
                  options={jsonEditorOptions}
                  onMount={(editor, monaco) => {
                    // Add Cmd+Enter keybinding
                    editor.addAction({
                      id: "runFunction",
                      label: "Run Function",
                      keybindings: [
                        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
                      ],
                      run: () => {
                        runQueryRef.current?.();
                      },
                    });
                    editor.focus();
                  }}
                  onChange={handleArgsChange}
                  loading={
                    <div
                      className="flex items-center justify-center h-full"
                      style={{
                        backgroundColor: "var(--color-background-raised)",
                      }}
                    >
                      <span
                        className="text-sm"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        Loading editor...
                      </span>
                    </div>
                  }
                />
              </div>
            </>
          )}

          {/* Run button */}
          <div
            className="px-4 py-3 shrink-0"
            style={{ borderTop: "1px solid var(--color-border-base)" }}
          >
            <button
              onClick={runQuery}
              disabled={isRunning || !adminClient}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: isRunning
                  ? "var(--color-surface-raised)"
                  : "var(--color-brand-base)",
                color: isRunning ? "var(--color-text-muted)" : "white",
                opacity: isRunning ? 0.7 : 1,
                cursor: isRunning ? "not-allowed" : "pointer",
              }}
            >
              {isRunning ? (
                <>
                  <span
                    className="w-3.5 h-3.5 border-2 border-current rounded-full animate-spin"
                    style={{ borderTopColor: "transparent" }}
                  />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play size={14} />
                  <span>
                    {isCustomQueryMode
                      ? "Run Query"
                      : `Run ${selectedFunctionInfo?.type || "Function"}`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {(isBottomLayout || result) && (
          <div
            className={`flex-1 min-h-0 flex flex-col overflow-hidden ${
              isBottomLayout ? "border-l" : "border-t"
            }`}
            style={{ borderColor: "var(--color-border-base)" }}
          >
            {result ? (
              <>
                {/* Result header */}
                <div
                  className="flex items-center justify-between px-4 py-2 shrink-0"
                  style={{
                    backgroundColor: result.success
                      ? "var(--color-success-base-alpha, rgba(34, 197, 94, 0.1))"
                      : "var(--color-error-base-alpha, rgba(239, 68, 68, 0.1))",
                  }}
                >
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle2
                        size={14}
                        style={{ color: "var(--color-success-base, #22c55e)" }}
                      />
                    ) : (
                      <AlertCircle
                        size={14}
                        style={{ color: "var(--color-error-base)" }}
                      />
                    )}
                    <span
                      className="text-xs font-medium"
                      style={{
                        color: result.success
                          ? "var(--color-success-base, #22c55e)"
                          : "var(--color-error-base)",
                      }}
                    >
                      {result.success ? "Success" : "Error"}
                    </span>
                  </div>
                  {result.executionTime !== undefined && (
                    <span
                      className="text-xs"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {result.executionTime}ms
                    </span>
                  )}
                </div>

                {/* Log lines */}
                {result.logLines && result.logLines.length > 0 && (
                  <div
                    className="px-4 py-2 border-b shrink-0"
                    style={{
                      borderColor: "var(--color-border-base)",
                      backgroundColor: "var(--color-surface-raised)",
                    }}
                  >
                    <div
                      className="text-xs font-medium mb-1"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Console Output
                    </div>
                    {result.logLines.map((line, i) => (
                      <div
                        key={i}
                        className="text-xs font-mono"
                        style={{
                          color:
                            line.level === "error"
                              ? "var(--color-error-base)"
                              : line.level === "warn"
                                ? "var(--color-warning-base)"
                                : "var(--color-text-base)",
                        }}
                      >
                        {line.message}
                      </div>
                    ))}
                  </div>
                )}

                {/* Result data or error */}
                <div className="flex-1 overflow-auto p-4">
                  {result.success ? (
                    <pre
                      className="text-xs font-mono whitespace-pre-wrap"
                      style={{ color: "var(--color-text-base)" }}
                    >
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  ) : (
                    <pre
                      className="text-xs font-mono whitespace-pre-wrap"
                      style={{ color: "var(--color-error-base)" }}
                    >
                      {result.error}
                    </pre>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6">
                <span
                  className="text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Run this function to produce a result.
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomQuerySheet;
