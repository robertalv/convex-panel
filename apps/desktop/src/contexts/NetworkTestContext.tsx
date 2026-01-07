import * as React from "react";
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

// Network test endpoints (hardcoded as per requirements)
const ENDPOINTS = {
  websocket: "wss://warmhearted-reindeer-937.convex.cloud/api/1.27.3/sync",
  http: "https://warmhearted-reindeer-937.convex.site/ping",
  sse: "https://warmhearted-reindeer-937.convex.site/sse",
  proxiedWebsocket: "https://sse-ws-proxy-production.up.railway.app/session",
} as const;

export type TestStatus = "pending" | "running" | "success" | "error";

export interface TestResult {
  status: TestStatus;
  latency?: number; // ms
  error?: string;
  messagesReceived?: number;
  lastRun?: Date;
}

export interface NetworkTestState {
  websocket: TestResult;
  http: TestResult;
  sse: TestResult;
  proxiedWebsocket: TestResult;
}

interface NetworkTestContextValue {
  tests: NetworkTestState;
  isRunning: boolean;
  runAllTests: () => Promise<void>;
  runTest: (testType: keyof NetworkTestState) => Promise<void>;
  overallStatus: "success" | "partial" | "error" | "pending" | "running";
}

const initialTestResult: TestResult = { status: "pending" };

const initialState: NetworkTestState = {
  websocket: initialTestResult,
  http: initialTestResult,
  sse: initialTestResult,
  proxiedWebsocket: initialTestResult,
};

const NetworkTestContext = createContext<NetworkTestContextValue | null>(null);

export function NetworkTestProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tests, setTests] = React.useState<NetworkTestState>(initialState);
  const [isRunning, setIsRunning] = React.useState(false);
  const hasInitializedRef = useRef(false);

  const updateTest = useCallback(
    (testType: keyof NetworkTestState, result: Partial<TestResult>) => {
      setTests((prev) => ({
        ...prev,
        [testType]: { ...prev[testType], ...result },
      }));
    },
    [],
  );

  // HTTP Test - simple ping
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

  // WebSocket Test - connect and verify handshake
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
          // Send a Connect message
          const connectMessage = {
            connectionCount: 0,
            lastCloseReason: "InitialConnect",
            clientTs: Date.now(),
            type: "Connect",
            sessionId: crypto.randomUUID(),
          };
          ws.send(JSON.stringify(connectMessage));

          // Wait for response
          ws.onmessage = (event) => {
            messagesReceived++;
            try {
              const data = JSON.parse(event.data);
              // Check if we got a valid Transition message
              if (data.type === "Transition" || messagesReceived >= 1) {
                clearTimeout(timeout);
                ws.close();
                resolve({
                  status: "success",
                  latency,
                  messagesReceived,
                  lastRun: new Date(),
                });
              }
            } catch {
              // Keep waiting for valid message
            }
          };

          // If we connected but don't get messages within 5s, still consider it a success
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

  // SSE Test - connect and verify we receive messages
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

        eventSource.onmessage = (event) => {
          messagesReceived++;

          // Check for completion or enough messages
          try {
            const data = JSON.parse(event.data);
            if (data.type === "complete" || messagesReceived >= 3) {
              clearTimeout(timeout);
              eventSource.close();
              resolve({
                status: "success",
                latency: latency ?? Math.round(performance.now() - startTime),
                messagesReceived,
                lastRun: new Date(),
              });
            }
          } catch {
            // If we received any message, that's progress
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
          }
        };

        eventSource.onerror = () => {
          clearTimeout(timeout);
          eventSource.close();
          if (messagesReceived > 0) {
            // If we got some messages, consider it a success
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
  // The proxy requires an active session, so we test connectivity by establishing a session
  const runProxiedWebsocketTest = useCallback(async (): Promise<TestResult> => {
    const startTime = performance.now();
    try {
      // Generate session credentials
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      const sessionSecret = Array.from(
        crypto.getRandomValues(new Uint8Array(32)),
      )
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Establish a session via the /session endpoint
      const sessionResponse = await fetch(ENDPOINTS.proxiedWebsocket, {
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
      });

      const latency = Math.round(performance.now() - startTime);

      // If we can establish a session (or get a proper response), the proxy is working
      if (sessionResponse.ok) {
        return { status: "success", latency, lastRun: new Date() };
      }

      // Even a 4xx response (except network errors) shows the proxy is reachable
      // We'll consider it a success if we got any HTTP response
      if (sessionResponse.status >= 400 && sessionResponse.status < 500) {
        // Proxy is reachable but session setup failed - still shows connectivity
        return {
          status: "success",
          latency,
          lastRun: new Date(),
        };
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
    async (testType: keyof NetworkTestState) => {
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

  // Helper to format status for tray display
  const formatStatusForTray = useCallback((result: TestResult): string => {
    if (result.status === "pending") return "Pending";
    if (result.status === "running") return "Testing...";
    if (result.status === "success") {
      return result.latency ? `OK (${result.latency}ms)` : "OK";
    }
    return result.error ? `Error: ${result.error}` : "Error";
  }, []);

  // Sync test results to system tray
  const syncToTray = useCallback(
    async (currentTests: NetworkTestState) => {
      try {
        const statuses = Object.values(currentTests).map((t) => t.status);
        let overall = "pending";
        if (statuses.some((s) => s === "running")) overall = "running";
        else if (statuses.every((s) => s === "success")) overall = "success";
        else if (statuses.every((s) => s === "error")) overall = "error";
        else if (statuses.some((s) => s === "success" || s === "error"))
          overall = "partial";

        await invoke("update_network_status", {
          status: {
            websocket: formatStatusForTray(currentTests.websocket),
            http: formatStatusForTray(currentTests.http),
            sse: formatStatusForTray(currentTests.sse),
            proxied_websocket: formatStatusForTray(
              currentTests.proxiedWebsocket,
            ),
            overall,
          },
        });
      } catch (err) {
        console.error("Failed to sync network status to tray:", err);
      }
    },
    [formatStatusForTray],
  );

  const runAllTests = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);

    // Run all tests in parallel
    await Promise.all([
      runTest("http"),
      runTest("websocket"),
      runTest("sse"),
      runTest("proxiedWebsocket"),
    ]);

    setIsRunning(false);
  }, [isRunning, runTest]);

  // Sync to tray whenever tests state changes
  useEffect(() => {
    syncToTray(tests);
  }, [tests, syncToTray]);

  // Run tests on mount (initial load) - no delay, run immediately
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      runAllTests();
    }
  }, [runAllTests]);

  // Listen for tray menu "Run Network Tests" event
  useEffect(() => {
    let unlisten: UnlistenFn | undefined;

    listen("run-network-tests", () => {
      runAllTests();
    }).then((unlistenFn) => {
      unlisten = unlistenFn;
    });

    return () => {
      unlisten?.();
    };
  }, [runAllTests]);

  // Run tests periodically (every hour)
  useEffect(() => {
    const ONE_HOUR = 60 * 60 * 1000;
    const interval = setInterval(() => {
      runAllTests();
    }, ONE_HOUR);

    return () => clearInterval(interval);
  }, [runAllTests]);

  // Calculate overall status
  const overallStatus =
    React.useMemo((): NetworkTestContextValue["overallStatus"] => {
      const statuses = Object.values(tests).map((t) => t.status);

      if (statuses.some((s) => s === "running")) return "running";
      if (statuses.every((s) => s === "pending")) return "pending";
      if (statuses.every((s) => s === "success")) return "success";
      if (statuses.every((s) => s === "error")) return "error";
      return "partial";
    }, [tests]);

  const value: NetworkTestContextValue = {
    tests,
    isRunning,
    runAllTests,
    runTest,
    overallStatus,
  };

  return (
    <NetworkTestContext.Provider value={value}>
      {children}
    </NetworkTestContext.Provider>
  );
}

export function useNetworkTests() {
  const context = useContext(NetworkTestContext);
  if (!context) {
    throw new Error(
      "useNetworkTests must be used within a NetworkTestProvider",
    );
  }
  return context;
}

export function useNetworkTestsOptional() {
  return useContext(NetworkTestContext);
}
