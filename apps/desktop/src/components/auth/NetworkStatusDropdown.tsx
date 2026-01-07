import * as React from "react";
import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { ConvexLogo } from "@/components/ui/ConvexLogo";
import {
  Wifi,
  Globe,
  Radio,
  Server,
  RefreshCw,
  Check,
  X,
  Loader2,
  Clock,
} from "lucide-react";

// Network test endpoints (hardcoded as per requirements)
const ENDPOINTS = {
  websocket: "wss://warmhearted-reindeer-937.convex.cloud/api/1.27.3/sync",
  http: "https://warmhearted-reindeer-937.convex.site/ping",
  sse: "https://warmhearted-reindeer-937.convex.site/sse",
  proxiedWebsocket: "https://sse-ws-proxy-production.up.railway.app/messages",
} as const;

type TestStatus = "pending" | "running" | "success" | "error";

interface TestResult {
  status: TestStatus;
  latency?: number;
  error?: string;
  messagesReceived?: number;
  lastRun?: Date;
}

interface TestRowProps {
  name: string;
  icon: React.ReactNode;
  result: TestResult;
  onRerun?: () => void;
}

function StatusIcon({ status }: { status: TestStatus }) {
  switch (status) {
    case "pending":
      return <Clock className="size-3.5 text-text-muted" />;
    case "running":
      return <Loader2 className="size-3.5 text-brand-base animate-spin" />;
    case "success":
      return <Check className="size-3.5 text-[var(--color-success-base)]" />;
    case "error":
      return <X className="size-3.5 text-[var(--color-error-base)]" />;
  }
}

function TestRow({ name, icon, result, onRerun }: TestRowProps) {
  return (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-surface-raised/50 rounded-lg group">
      <div className="flex items-center gap-2.5">
        <div className="text-text-muted">{icon}</div>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-text-base">{name}</span>
          {result.latency !== undefined && result.status === "success" && (
            <span className="text-[10px] text-text-muted">
              {result.latency}ms
            </span>
          )}
          {result.error && (
            <span className="text-[10px] text-[var(--color-error-base)] truncate max-w-[140px]">
              {result.error}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StatusIcon status={result.status} />
        {onRerun && result.status !== "running" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRerun();
            }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface-raised transition-opacity"
            title="Re-run this test"
          >
            <RefreshCw className="size-3 text-text-muted" />
          </button>
        )}
      </div>
    </div>
  );
}

function getOverallStatus(tests: Record<string, TestResult>): string {
  const statuses = Object.values(tests).map((t) => t.status);
  if (statuses.some((s) => s === "running")) return "running";
  if (statuses.every((s) => s === "pending")) return "pending";
  if (statuses.every((s) => s === "success")) return "success";
  if (statuses.every((s) => s === "error")) return "error";
  return "partial";
}

function getOverallStatusColor(status: string): string {
  switch (status) {
    case "success":
      return "bg-[var(--color-success-base)]";
    case "error":
      return "bg-[var(--color-error-base)]";
    case "partial":
      return "bg-amber-500";
    case "running":
      return "bg-brand-base animate-pulse";
    default:
      return "bg-[var(--color-border-muted)]";
  }
}

function getOverallStatusText(status: string): string {
  switch (status) {
    case "success":
      return "All connections working";
    case "error":
      return "Connection issues detected";
    case "partial":
      return "Some connections have issues";
    case "running":
      return "Testing connections...";
    default:
      return "Connection status unknown";
  }
}

const initialTestResult: TestResult = { status: "pending" };

/**
 * Standalone Network Status Dropdown for WelcomeScreen (pre-login)
 * Has its own state management since it runs before providers are mounted
 */
export function NetworkStatusDropdown() {
  const [tests, setTests] = useState({
    websocket: initialTestResult,
    http: initialTestResult,
    sse: initialTestResult,
    proxiedWebsocket: initialTestResult,
  });
  const [isRunning, setIsRunning] = useState(false);
  const hasInitializedRef = useRef(false);

  const updateTest = useCallback(
    (testType: string, result: Partial<TestResult>) => {
      setTests((prev) => ({
        ...prev,
        [testType]: { ...prev[testType as keyof typeof prev], ...result },
      }));
    },
    [],
  );

  // HTTP Test
  const runHttpTest = useCallback(async (): Promise<TestResult> => {
    const startTime = performance.now();
    try {
      const response = await fetch(ENDPOINTS.http, {
        method: "GET",
        mode: "cors",
      });
      const latency = Math.round(performance.now() - startTime);
      if (response.ok) {
        const data = await response.json();
        if (data.status === "success") {
          return { status: "success", latency, lastRun: new Date() };
        }
      }
      return {
        status: "error",
        error: `HTTP ${response.status}`,
        latency,
        lastRun: new Date(),
      };
    } catch (err) {
      return {
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
        latency: Math.round(performance.now() - startTime),
        lastRun: new Date(),
      };
    }
  }, []);

  // WebSocket Test
  const runWebsocketTest = useCallback(async (): Promise<TestResult> => {
    const startTime = performance.now();
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({
          status: "error",
          error: "Connection timeout (10s)",
          lastRun: new Date(),
        });
      }, 10000);

      try {
        const ws = new WebSocket(ENDPOINTS.websocket);
        let messagesReceived = 0;

        ws.onopen = () => {
          const latency = Math.round(performance.now() - startTime);
          const connectMessage = {
            connectionCount: 0,
            lastCloseReason: "InitialConnect",
            clientTs: Date.now(),
            type: "Connect",
            sessionId: crypto.randomUUID(),
          };
          ws.send(JSON.stringify(connectMessage));

          ws.onmessage = () => {
            messagesReceived++;
            if (messagesReceived >= 1) {
              clearTimeout(timeout);
              ws.close();
              resolve({
                status: "success",
                latency,
                messagesReceived,
                lastRun: new Date(),
              });
            }
          };

          setTimeout(() => {
            if (messagesReceived === 0) {
              clearTimeout(timeout);
              ws.close();
              resolve({
                status: "success",
                latency,
                messagesReceived: 0,
                lastRun: new Date(),
              });
            }
          }, 5000);
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          resolve({
            status: "error",
            error: "WebSocket connection failed",
            lastRun: new Date(),
          });
        };

        ws.onclose = (event) => {
          if (event.code !== 1000 && messagesReceived === 0) {
            clearTimeout(timeout);
            resolve({
              status: "error",
              error: `Connection closed: ${event.reason || event.code}`,
              lastRun: new Date(),
            });
          }
        };
      } catch (err) {
        clearTimeout(timeout);
        resolve({
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
          lastRun: new Date(),
        });
      }
    });
  }, []);

  // SSE Test
  const runSseTest = useCallback(async (): Promise<TestResult> => {
    const startTime = performance.now();
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({
          status: "error",
          error: "SSE timeout (15s)",
          lastRun: new Date(),
        });
      }, 15000);

      try {
        const eventSource = new EventSource(ENDPOINTS.sse);
        let messagesReceived = 0;
        let latency: number | undefined;

        eventSource.onopen = () => {
          latency = Math.round(performance.now() - startTime);
        };

        eventSource.onmessage = () => {
          messagesReceived++;
          if (messagesReceived >= 3) {
            clearTimeout(timeout);
            eventSource.close();
            resolve({
              status: "success",
              latency: latency ?? Math.round(performance.now() - startTime),
              messagesReceived,
              lastRun: new Date(),
            });
          }
        };

        eventSource.onerror = () => {
          clearTimeout(timeout);
          eventSource.close();
          if (messagesReceived > 0) {
            resolve({
              status: "success",
              latency: latency ?? Math.round(performance.now() - startTime),
              messagesReceived,
              lastRun: new Date(),
            });
          } else {
            resolve({
              status: "error",
              error: "SSE connection failed",
              lastRun: new Date(),
            });
          }
        };
      } catch (err) {
        clearTimeout(timeout);
        resolve({
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
          lastRun: new Date(),
        });
      }
    });
  }, []);

  // Proxied WebSocket Test - Verify proxy endpoint is reachable
  const runProxiedWebsocketTest = useCallback(async (): Promise<TestResult> => {
    const startTime = performance.now();
    try {
      // Generate session ID and secret as required by the proxy
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      const sessionSecret = Array.from(
        crypto.getRandomValues(new Uint8Array(32)),
      )
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Establish a session by connecting to the session endpoint
      const sessionResponse = await fetch(
        `${ENDPOINTS.proxiedWebsocket.replace("/messages", "/session")}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Session-Id": sessionId,
            "X-Session-Secret": sessionSecret,
          },
          body: JSON.stringify({
            targetUrl:
              "wss://warmhearted-reindeer-937.convex.cloud/api/1.27.3/sync",
          }),
          mode: "cors",
        },
      );

      const latency = Math.round(performance.now() - startTime);

      // If we can establish a session (or get a proper response), the proxy is working
      if (sessionResponse.ok) {
        return { status: "success", latency, lastRun: new Date() };
      }

      // Even a 4xx response shows the proxy is reachable
      if (sessionResponse.status >= 400 && sessionResponse.status < 500) {
        return { status: "success", latency, lastRun: new Date() };
      }

      return {
        status: "error",
        error: `HTTP ${sessionResponse.status}`,
        latency,
        lastRun: new Date(),
      };
    } catch (err) {
      return {
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
        latency: Math.round(performance.now() - startTime),
        lastRun: new Date(),
      };
    }
  }, []);

  const runTest = useCallback(
    async (testType: keyof typeof tests) => {
      updateTest(testType, { status: "running" });
      let result: TestResult;
      switch (testType) {
        case "websocket":
          result = await runWebsocketTest();
          break;
        case "http":
          result = await runHttpTest();
          break;
        case "sse":
          result = await runSseTest();
          break;
        case "proxiedWebsocket":
          result = await runProxiedWebsocketTest();
          break;
      }
      updateTest(testType, result);
    },
    [
      updateTest,
      runWebsocketTest,
      runHttpTest,
      runSseTest,
      runProxiedWebsocketTest,
    ],
  );

  const runAllTests = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    await Promise.all([
      runTest("http"),
      runTest("websocket"),
      runTest("sse"),
      runTest("proxiedWebsocket"),
    ]);
    setIsRunning(false);
  }, [isRunning, runTest]);

  // Run tests on mount
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      runAllTests();
    }
  }, [runAllTests]);

  const overallStatus = getOverallStatus(tests);

  return (
    <div className="absolute top-3 right-3">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "relative flex items-center justify-center",
              "size-8 rounded-lg",
              "transition-all duration-150",
              "bg-white/10 backdrop-blur-sm",
              "hover:bg-white/20",
              "border border-white/20",
            )}
            title={getOverallStatusText(overallStatus)}
          >
            <ConvexLogo size={20} />
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white/20",
                getOverallStatusColor(overallStatus),
              )}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 p-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-base">
            <div className="flex items-center gap-2">
              <ConvexLogo size={18} />
              <div>
                <h3 className="text-sm font-semibold text-text-base">
                  Network Status
                </h3>
                <p className="text-[10px] text-text-muted">
                  {getOverallStatusText(overallStatus)}
                </p>
              </div>
            </div>
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                isRunning
                  ? "text-text-disabled cursor-not-allowed"
                  : "text-text-muted hover:text-text-base hover:bg-surface-raised",
              )}
              title="Re-run all tests"
            >
              <RefreshCw
                className={cn("size-4", isRunning && "animate-spin")}
              />
            </button>
          </div>

          {/* Test Results */}
          <div className="py-1">
            <TestRow
              name="WebSocket (WSS)"
              icon={<Wifi className="size-4" />}
              result={tests.websocket}
              onRerun={() => runTest("websocket")}
            />
            <TestRow
              name="HTTP/HTTPS"
              icon={<Globe className="size-4" />}
              result={tests.http}
              onRerun={() => runTest("http")}
            />
            <TestRow
              name="Server-Sent Events"
              icon={<Radio className="size-4" />}
              result={tests.sse}
              onRerun={() => runTest("sse")}
            />
            <TestRow
              name="Proxied WebSocket"
              icon={<Server className="size-4" />}
              result={tests.proxiedWebsocket}
              onRerun={() => runTest("proxiedWebsocket")}
            />
          </div>

          {/* Footer with last run time */}
          {tests.http.lastRun && (
            <div className="px-4 py-2 border-t border-border-base">
              <p className="text-[10px] text-text-muted">
                Last tested: {tests.http.lastRun.toLocaleTimeString()}
              </p>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
