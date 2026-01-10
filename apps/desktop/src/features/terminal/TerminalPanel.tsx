import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import {
  useTerminalState,
  useTerminalActions,
  type TerminalSession,
} from "../../contexts/TerminalContext";
import {
  X,
  Terminal as TerminalIcon,
  Maximize2,
  Minimize2,
  Plus,
  Square,
  Key,
} from "lucide-react";
import { useDeployment } from "../../contexts/DeploymentContext";
import { DeployKeyDialog } from "../../components/DeployKeyDialog";

// Color theme matching the desktop app's dark theme
// Terminal background color - matches --color-panel-bg-secondary from panel package
const TERMINAL_BG_COLOR = "#2a2825"; // rgb(42, 40, 37)

const TERMINAL_THEME = {
  background: TERMINAL_BG_COLOR,
  foreground: "#e5e5e5",
  cursor: "#e5e5e5",
  cursorAccent: "#0a0a0a",
  selection: "rgba(99, 102, 241, 0.3)",
  black: "#0a0a0a",
  red: "#ef4444",
  green: "#22c55e",
  yellow: "#eab308",
  blue: "#3b82f6",
  magenta: "#a855f7",
  cyan: "#06b6d4",
  white: "#e5e5e5",
  brightBlack: "#737373",
  brightRed: "#f87171",
  brightGreen: "#4ade80",
  brightYellow: "#facc15",
  brightBlue: "#60a5fa",
  brightMagenta: "#c084fc",
  brightCyan: "#22d3ee",
  brightWhite: "#ffffff",
};

// Common Convex CLI commands for quick access
const CONVEX_COMMANDS = [
  { label: "Dev", command: "npx convex dev", description: "Start dev server" },
  {
    label: "Deploy",
    command: "npx convex deploy",
    description: "Deploy to production",
  },
  { label: "Logs", command: "npx convex logs", description: "Tail logs" },
  {
    label: "Data",
    command: "npx convex data",
    description: "List tables",
  },
  {
    label: "Env",
    command: "npx convex env list",
    description: "List env variables",
  },
];

interface TerminalInstanceProps {
  session: TerminalSession;
  isActive: boolean;
  onReady?: () => void;
  defaultWorkingDirectory?: string;
  /** Environment variables to pass to the shell (e.g., CONVEX_DEPLOY_KEY) */
  shellEnv?: Record<string, string>;
}

/**
 * Individual terminal instance for a session.
 * Uses real PTY (pseudo-terminal) for true interactive shell experience.
 */
function TerminalInstance({
  session,
  isActive,
  onReady,
  defaultWorkingDirectory,
  shellEnv,
}: TerminalInstanceProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isReady, setIsReady] = useState(false);
  const ptySpawnedRef = useRef(false);
  const unlistenersRef = useRef<UnlistenFn[]>([]);

  const { height } = useTerminalState();
  const { setSessionRunningProcess } = useTerminalActions();

  // Initialize xterm and spawn PTY
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const xterm = new XTerm({
      cursorBlink: true,
      cursorStyle: "bar",
      fontSize: 13,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      lineHeight: 1.2,
      theme: TERMINAL_THEME,
      allowProposedApi: true,
      scrollback: 10000,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    xterm.loadAddon(fitAddon);
    xterm.loadAddon(webLinksAddon);

    xterm.open(terminalRef.current);

    // Small delay to ensure container is ready
    setTimeout(() => {
      fitAddon.fit();
    }, 50);

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // Spawn the PTY
    const spawnPty = async () => {
      if (ptySpawnedRef.current) return;
      ptySpawnedRef.current = true;

      try {
        // Get terminal dimensions
        const rows = xterm.rows;
        const cols = xterm.cols;

        // Set up event listeners before spawning
        const dataUnlisten = await listen<string>(
          `pty-data-${session.id}`,
          (event) => {
            xterm.write(event.payload);
          },
        );
        unlistenersRef.current.push(dataUnlisten);

        const closeUnlisten = await listen<void>(
          `pty-close-${session.id}`,
          () => {
            xterm.writeln("\r\n\x1b[2m[Process exited]\x1b[0m");
            setSessionRunningProcess(session.id, undefined);
          },
        );
        unlistenersRef.current.push(closeUnlisten);

        const errorUnlisten = await listen<string>(
          `pty-error-${session.id}`,
          (event) => {
            xterm.writeln(`\r\n\x1b[31m[Error: ${event.payload}]\x1b[0m`);
          },
        );
        unlistenersRef.current.push(errorUnlisten);

        // Spawn the PTY session
        await invoke("pty_spawn", {
          sessionId: session.id,
          cwd: session.workingDirectory || defaultWorkingDirectory || null,
          rows,
          cols,
          env: shellEnv || null,
        });

        // Mark as having a running process
        setSessionRunningProcess(session.id, {
          command: "shell",
          startedAt: Date.now(),
        });

        setIsReady(true);
        onReady?.();
      } catch (error) {
        console.error("Failed to spawn PTY:", error);
        xterm.writeln(
          `\x1b[31mFailed to spawn terminal: ${error instanceof Error ? error.message : String(error)}\x1b[0m`,
        );
        ptySpawnedRef.current = false;
      }
    };

    spawnPty();

    // Handle user input - send directly to PTY
    const inputDisposable = xterm.onData((data) => {
      invoke("pty_write", {
        sessionId: session.id,
        data,
      }).catch((err) => {
        console.error("Failed to write to PTY:", err);
      });
    });

    return () => {
      inputDisposable.dispose();

      // Clean up event listeners
      unlistenersRef.current.forEach((unlisten) => unlisten());
      unlistenersRef.current = [];

      // Kill the PTY session
      if (ptySpawnedRef.current) {
        invoke("pty_kill", { sessionId: session.id }).catch((err) => {
          // Only log if it's not a "session not found" error (which is expected when already cleaned up)
          const errorMessage = err instanceof Error ? err.message : String(err);
          if (!errorMessage.includes("Session not found")) {
            console.error("Failed to kill PTY:", err);
          }
        });
        ptySpawnedRef.current = false;
      }

      xterm.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, [
    session.id,
    session.workingDirectory,
    defaultWorkingDirectory,
    shellEnv,
    onReady,
    setSessionRunningProcess,
  ]);

  // Handle resize
  useEffect(() => {
    if (!fitAddonRef.current || !isActive || !terminalRef.current) return;

    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleResize = () => {
      // Clear any pending resize
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }

      // Debounce the resize
      resizeTimeout = setTimeout(() => {
        try {
          const container = terminalRef.current;
          if (!container) return;

          // Only fit if container has valid dimensions
          const { offsetWidth, offsetHeight } = container;
          if (offsetWidth <= 0 || offsetHeight <= 0) return;

          fitAddonRef.current?.fit();

          // Also resize the PTY
          const xterm = xtermRef.current;
          if (xterm && ptySpawnedRef.current) {
            invoke("pty_resize", {
              sessionId: session.id,
              rows: xterm.rows,
              cols: xterm.cols,
            }).catch((err) => {
              // Only log if it's not a "session not found" error (which is expected when already cleaned up)
              const errorMessage =
                err instanceof Error ? err.message : String(err);
              if (!errorMessage.includes("Session not found")) {
                console.error("Failed to resize PTY:", err);
              }
            });
          }
        } catch {
          // Ignore fit errors during transitions
        }
      }, 50);
    };

    // Use ResizeObserver for more reliable size detection
    const resizeObserver = new ResizeObserver(handleResize);

    resizeObserver.observe(terminalRef.current);
    window.addEventListener("resize", handleResize);

    // Initial fit after mount
    handleResize();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    };
  }, [isActive, height, session.id]);

  // Focus terminal when becoming active
  useEffect(() => {
    if (isActive && xtermRef.current) {
      xtermRef.current.focus();
      fitAddonRef.current?.fit();
    }
  }, [isActive]);

  // Listen for external command execution (from MCP or quick commands)
  useEffect(() => {
    const handleExternalCommand = (event: Event) => {
      const customEvent = event as CustomEvent<{
        sessionId: string;
        command: string;
      }>;
      // Handle both specific session ID and "active" (for current session)
      const targetSessionId = customEvent.detail.sessionId;

      console.log("[TerminalInstance] Received command event:", {
        targetSessionId,
        actualSessionId: session.id,
        isActive,
        isReady,
        command: customEvent.detail.command,
      });

      if (targetSessionId !== session.id && targetSessionId !== "active")
        return;
      if (targetSessionId === "active" && !isActive) return;
      if (!isReady) return;

      const { command } = customEvent.detail;

      console.log("[TerminalInstance] Executing command:", command);

      // Write the command to the PTY (including the newline to execute it)
      invoke("pty_write", {
        sessionId: session.id,
        data: command + "\n",
      }).catch((err) => {
        console.error("Failed to write command to PTY:", err);
      });
    };

    window.addEventListener("terminal-execute-command", handleExternalCommand);
    return () => {
      window.removeEventListener(
        "terminal-execute-command",
        handleExternalCommand,
      );
    };
  }, [session.id, isReady, isActive]);

  // Listen for kill process events
  useEffect(() => {
    const handleKillProcess = (event: Event) => {
      const customEvent = event as CustomEvent<{ sessionId: string }>;
      if (customEvent.detail.sessionId !== session.id) return;

      // Send Ctrl+C to the PTY
      invoke("pty_write", {
        sessionId: session.id,
        data: "\x03", // Ctrl+C
      }).catch((err) => {
        console.error("Failed to send Ctrl+C to PTY:", err);
      });
    };

    window.addEventListener("terminal-kill-process", handleKillProcess);
    return () => {
      window.removeEventListener("terminal-kill-process", handleKillProcess);
    };
  }, [session.id]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        display: isActive ? "block" : "none",
        padding: "8px",
        backgroundColor: TERMINAL_BG_COLOR,
      }}
    >
      <div
        ref={terminalRef}
        style={{
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
        data-session-id={session.id}
      />
    </div>
  );
}

interface TerminalPanelProps {
  /** Working directory for new terminals */
  workingDirectory?: string;
  /** Callback when terminal is ready */
  onReady?: () => void;
}

export function TerminalPanel({
  workingDirectory,
  onReady,
}: TerminalPanelProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeployKeyDialogOpen, setIsDeployKeyDialogOpen] = useState(false);

  const { isOpen, height, sessions, activeSessionId } = useTerminalState();
  const {
    closeTerminal,
    openTerminal,
    setTerminalHeight,
    createSession,
    closeSession,
    switchSession,
  } = useTerminalActions();

  const defaultWorkingDirectory = workingDirectory || undefined;

  // Listen for terminal-open event (from editor install button)
  useEffect(() => {
    const handleTerminalOpen = () => {
      console.log(
        "[TerminalPanel] Received terminal-open event, opening terminal",
      );
      openTerminal();
    };

    window.addEventListener("terminal-open", handleTerminalOpen);
    return () => {
      window.removeEventListener("terminal-open", handleTerminalOpen);
    };
  }, [openTerminal]);

  // Get deployment context for environment variables
  const deployment = useDeployment();

  // Build shell environment with Convex credentials
  const shellEnv = useMemo(() => {
    const env: Record<string, string> = {};

    // Add CONVEX_DEPLOY_KEY if we have a CLI deploy key (auto-generated from OAuth)
    if (deployment.cliDeployKey) {
      env.CONVEX_DEPLOY_KEY = deployment.cliDeployKey;
      console.log("[Terminal] Using cliDeployKey for CONVEX_DEPLOY_KEY");
    }

    // Add deployment URL for reference
    if (deployment.deploymentUrl) {
      env.CONVEX_URL = deployment.deploymentUrl;
    }

    return Object.keys(env).length > 0 ? env : undefined;
  }, [deployment.cliDeployKey, deployment.deploymentUrl]);

  // Determine credential status for UI display
  const credentialStatus = useMemo(() => {
    if (deployment.cliDeployKeyError) {
      return {
        color: "var(--color-panel-error)",
        text: "Auth Error",
        title: `Error: ${deployment.cliDeployKeyError}`,
      };
    }

    if (deployment.cliDeployKeyLoading) {
      return {
        color: "var(--color-panel-text-muted)",
        text: "Loading...",
        title: "Loading credentials...",
      };
    }

    if (deployment.cliDeployKey) {
      if (deployment.cliDeployKeyIsManual) {
        return {
          color: "var(--color-panel-success)",
          text: "Manual Key",
          title: "Using manually set deploy key",
        };
      }

      // Check if this is an OAuth token being used as fallback
      // OAuth tokens typically don't contain pipe characters like deploy keys do
      const isOAuthFallback = !deployment.cliDeployKey.includes("|");

      if (isOAuthFallback) {
        return {
          color: "var(--color-panel-success)",
          text: "OAuth Token",
          title: "Using OAuth access token as credential (auto-fallback)",
        };
      }

      return {
        color: "var(--color-panel-success)",
        text: "Authenticated",
        title: "Terminal has Convex credentials",
      };
    }

    return {
      color: "var(--color-panel-text-muted)",
      text: "No credentials",
      title: "No Convex credentials available",
    };
  }, [
    deployment.cliDeployKey,
    deployment.cliDeployKeyError,
    deployment.cliDeployKeyLoading,
    deployment.cliDeployKeyIsManual,
  ]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  // Resize handle
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newHeight = window.innerHeight - e.clientY;
      setTerminalHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, setTerminalHeight]);

  // Quick command execution
  const executeQuickCommand = useCallback(
    (command: string) => {
      if (!activeSessionId) return;

      // Dispatch event for the terminal instance to handle
      window.dispatchEvent(
        new CustomEvent("terminal-execute-command", {
          detail: { sessionId: activeSessionId, command },
        }),
      );
    },
    [activeSessionId],
  );

  // Quick command buttons
  const renderQuickCommands = useMemo(
    () => (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        {CONVEX_COMMANDS.slice(0, 4).map((cmd) => (
          <button
            key={cmd.command}
            type="button"
            onClick={() => executeQuickCommand(cmd.command)}
            title={cmd.description}
            style={{
              padding: "2px 8px",
              fontSize: "12px",
              borderRadius: "4px",
              border: "none",
              backgroundColor: "var(--color-panel-bg-tertiary)",
              color: "var(--color-panel-text-secondary)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "var(--color-panel-bg-tertiary)";
              e.currentTarget.style.color = "var(--color-panel-text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor =
                "var(--color-panel-bg-tertiary)";
              e.currentTarget.style.color = "var(--color-panel-text-secondary)";
            }}
          >
            {cmd.label}
          </button>
        ))}
      </div>
    ),
    [executeQuickCommand],
  );

  // Always render terminal instances to keep PTY sessions alive
  // They are hidden when the panel is closed but remain mounted
  const terminalInstances = (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        position: "relative",
        backgroundColor: "#0a0a0a",
      }}
    >
      {sessions.map((session) => (
        <TerminalInstance
          key={session.id}
          session={session}
          isActive={session.id === activeSessionId}
          onReady={session.id === activeSessionId ? onReady : undefined}
          defaultWorkingDirectory={defaultWorkingDirectory}
          shellEnv={shellEnv}
        />
      ))}
    </div>
  );

  return (
    <>
      {/* 
        Terminal panel - always mounted to keep PTY sessions alive.
        Uses CSS transform for hide/show animation instead of conditional rendering.
      */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          borderTop: isOpen ? "1px solid var(--color-border-base)" : "none",
          backgroundColor: "var(--color-panel-bg-secondary)",
          height: isExpanded ? "100%" : `${height}px`,
          minHeight: "200px",
          position: isExpanded ? "fixed" : "relative",
          bottom: isExpanded ? 0 : undefined,
          left: isExpanded ? 0 : undefined,
          right: isExpanded ? 0 : undefined,
          inset: isExpanded ? 0 : undefined,
          zIndex: isExpanded ? 50 : 1,
          width: "100%",
          flexShrink: 0,
          overflow: "hidden",
          // Hide when closed - use transform to slide down and visibility to hide
          transform: isOpen ? "translateY(0)" : "translateY(100%)",
          visibility: isOpen ? "visible" : "hidden",
          opacity: isOpen ? 1 : 0,
          transition:
            "transform 0.25s ease-out, opacity 0.2s ease-out, visibility 0.25s ease-out",
          // When hidden, don't take up space in the layout
          ...(isOpen
            ? {}
            : { position: "absolute" as const, bottom: 0, left: 0, right: 0 }),
        }}
      >
        {/* Resize handle */}
        {!isExpanded && (
          <div
            style={{
              height: "4px",
              cursor: "row-resize",
              borderTop: isResizing
                ? "2px solid var(--color-panel-accent)"
                : "1px solid var(--color-border-base)",
              transition: "border-color 0.15s ease",
              backgroundColor: "transparent",
            }}
            onMouseDown={handleResizeStart}
            onMouseEnter={(e) => {
              if (!isResizing) {
                e.currentTarget.style.borderTopColor =
                  "var(--color-panel-accent)";
                e.currentTarget.style.borderTopWidth = "2px";
              }
            }}
            onMouseLeave={(e) => {
              if (!isResizing) {
                e.currentTarget.style.borderTopColor =
                  "var(--color-border-base)";
                e.currentTarget.style.borderTopWidth = "1px";
              }
            }}
          />
        )}

        {/* Header with tabs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0px 12px",
            borderBottom: "1px solid var(--color-border-base)",
            backgroundColor: "var(--color-panel-bg)",
            height: "40px",
            flexShrink: 0,
            minHeight: "40px",
            zIndex: 2,
            position: "relative",
          }}
        >
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              flex: 1,
              minWidth: 0,
              overflowX: "auto",
            }}
          >
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => switchSession(session.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    border: "none",
                    backgroundColor: isActive
                      ? "var(--color-panel-bg-tertiary)"
                      : "transparent",
                    color: isActive
                      ? "var(--color-panel-text)"
                      : "var(--color-panel-text-secondary)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor =
                        "var(--color-panel-bg-tertiary)";
                      e.currentTarget.style.color = "var(--color-panel-text)";
                    } else {
                      // Subtle hover effect for active tab
                      e.currentTarget.style.backgroundColor =
                        "var(--color-panel-bg-tertiary)";
                      e.currentTarget.style.opacity = "0.9";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color =
                        "var(--color-panel-text-secondary)";
                    } else {
                      e.currentTarget.style.opacity = "1";
                    }
                  }}
                >
                  <TerminalIcon size={12} />
                  <span
                    style={{
                      maxWidth: "100px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {session.name}
                  </span>
                  {session.runningProcess && (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span
                        className="animate-pulse-opacity"
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          backgroundColor: "var(--color-panel-success)",
                        }}
                      />
                    </span>
                  )}
                  {sessions.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeSession(session.id);
                      }}
                      style={{
                        padding: "2px",
                        border: "none",
                        backgroundColor: "transparent",
                        borderRadius: "4px",
                        cursor: "pointer",
                        opacity: 0.6,
                        transition: "all 0.15s ease",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--color-panel-bg-tertiary)";
                        e.currentTarget.style.opacity = "1";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.opacity = "0.6";
                      }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </button>
              );
            })}

            {/* New tab button */}
            <button
              type="button"
              onClick={() => createSession(undefined, defaultWorkingDirectory)}
              title="New terminal"
              style={{
                padding: "4px",
                borderRadius: "4px",
                border: "none",
                backgroundColor: "transparent",
                color: "var(--color-panel-text-muted)",
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--color-panel-bg-tertiary)";
                e.currentTarget.style.color =
                  "var(--color-panel-text-secondary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--color-panel-text-muted)";
              }}
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Quick commands */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              margin: "0 8px",
            }}
          >
            {renderQuickCommands}
          </div>

          {/* Authentication status indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "2px 8px",
              fontSize: "11px",
              color: credentialStatus.color,
            }}
            title={credentialStatus.title}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: credentialStatus.color,
              }}
              className={
                deployment.cliDeployKeyLoading
                  ? "animate-pulse-opacity"
                  : undefined
              }
            />
            <span>{credentialStatus.text}</span>
            {/* Set Key button - show on error or when no credentials */}
            {(deployment.cliDeployKeyError || !deployment.cliDeployKey) &&
              !deployment.cliDeployKeyLoading && (
                <button
                  type="button"
                  onClick={() => setIsDeployKeyDialogOpen(true)}
                  title="Set deploy key manually"
                  style={{
                    padding: "2px 6px",
                    border: `1px solid ${deployment.cliDeployKeyError ? "var(--color-panel-error)" : "var(--color-panel-text-muted)"}`,
                    backgroundColor: "transparent",
                    borderRadius: "4px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    color: deployment.cliDeployKeyError
                      ? "var(--color-panel-error)"
                      : "var(--color-panel-text-muted)",
                    fontSize: "10px",
                  }}
                  onMouseEnter={(e) => {
                    const color = deployment.cliDeployKeyError
                      ? "var(--color-panel-error)"
                      : "var(--color-panel-accent)";
                    e.currentTarget.style.backgroundColor = color;
                    e.currentTarget.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = deployment.cliDeployKeyError
                      ? "var(--color-panel-error)"
                      : "var(--color-panel-text-muted)";
                  }}
                >
                  <Key size={10} />
                  Set Key
                </button>
              )}
            {/* Manage key button - show when authenticated */}
            {deployment.cliDeployKey && !deployment.cliDeployKeyLoading && (
              <button
                type="button"
                onClick={() => setIsDeployKeyDialogOpen(true)}
                title="Manage deploy key"
                style={{
                  padding: "2px",
                  border: "none",
                  backgroundColor: "transparent",
                  borderRadius: "4px",
                  cursor: "pointer",
                  opacity: 0.6,
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "inherit",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.backgroundColor =
                    "var(--color-panel-bg-tertiary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "0.6";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <Key size={10} />
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {activeSession?.runningProcess && (
              <button
                type="button"
                title="Stop running process (Ctrl+C)"
                onClick={() => {
                  // Dispatch a kill event
                  window.dispatchEvent(
                    new CustomEvent("terminal-kill-process", {
                      detail: { sessionId: activeSessionId },
                    }),
                  );
                }}
                style={{
                  padding: "4px",
                  borderRadius: "4px",
                  border: "none",
                  backgroundColor: "transparent",
                  color: "var(--color-panel-error)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--color-panel-error)";
                  e.currentTarget.style.opacity = "0.2";
                  e.currentTarget.style.color = "var(--color-panel-error)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.color = "var(--color-panel-error)";
                }}
              >
                <Square size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Restore" : "Maximize"}
              style={{
                padding: "4px",
                borderRadius: "4px",
                border: "none",
                backgroundColor: "transparent",
                color: "var(--color-panel-text-secondary)",
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--color-panel-bg-tertiary)";
                e.currentTarget.style.color = "var(--color-panel-text)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color =
                  "var(--color-panel-text-secondary)";
              }}
            >
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              type="button"
              onClick={closeTerminal}
              title="Close terminal"
              style={{
                padding: "4px",
                borderRadius: "4px",
                border: "none",
                backgroundColor: "transparent",
                color: "var(--color-panel-text-secondary)",
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--color-panel-bg-tertiary)";
                e.currentTarget.style.color = "var(--color-panel-text)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color =
                  "var(--color-panel-text-secondary)";
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Terminal instances - always rendered to keep PTY alive */}
        {terminalInstances}
      </div>

      {/* Deploy Key Dialog */}
      <DeployKeyDialog
        isOpen={isDeployKeyDialogOpen}
        onClose={() => setIsDeployKeyDialogOpen(false)}
        onSave={deployment.setManualDeployKey}
        onRetryAutoGenerate={deployment.regenerateDeployKey}
        deploymentName={deployment.deployment?.name}
        teamSlug={deployment.teamSlug}
        projectSlug={deployment.projectSlug}
        currentKey={deployment.cliDeployKey}
        projectPath={defaultWorkingDirectory}
      />
    </>
  );
}

export default TerminalPanel;
