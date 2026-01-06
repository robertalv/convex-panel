import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  type ReactNode,
} from "react";

export interface TerminalSession {
  id: string;
  name: string;
  workingDirectory?: string;
  commandHistory: string[];
  // Process info for long-running commands
  runningProcess?: {
    command: string;
    startedAt: number;
  };
}

// Actions context - stable references that never change
interface TerminalActionsContextValue {
  toggleTerminal: () => void;
  openTerminal: () => void;
  closeTerminal: () => void;
  setTerminalHeight: (height: number) => void;
  writeToTerminal: (sessionId: string, data: string) => void;
  clearTerminal: (sessionId: string) => void;
  // Session management
  createSession: (name?: string, workingDirectory?: string) => string;
  closeSession: (id: string) => void;
  switchSession: (id: string) => void;
  renameSession: (id: string, name: string) => void;
  setSessionWorkingDirectory: (id: string, path: string) => void;
  addToSessionHistory: (id: string, command: string) => void;
  setSessionRunningProcess: (
    id: string,
    process: TerminalSession["runningProcess"] | undefined,
  ) => void;
}

// State context - changes when terminal state changes
interface TerminalStateContextValue {
  isOpen: boolean;
  height: number;
  isConnected: boolean;
  sessions: TerminalSession[];
  activeSessionId: string | null;
}

// Combined interface for convenience
interface TerminalContextValue
  extends TerminalActionsContextValue, TerminalStateContextValue {}

const TerminalActionsContext =
  createContext<TerminalActionsContextValue | null>(null);
const TerminalStateContext = createContext<TerminalStateContextValue | null>(
  null,
);

// Event emitter for terminal writes (so xterm can subscribe)
type TerminalWriteListener = (sessionId: string, data: string) => void;
type TerminalClearListener = (sessionId: string) => void;

interface TerminalEventEmitter {
  onWrite: (listener: TerminalWriteListener) => () => void;
  onClear: (listener: TerminalClearListener) => () => void;
}

const TerminalEventContext = createContext<TerminalEventEmitter | null>(null);

const TERMINAL_HEIGHT_STORAGE_KEY = "convex-desktop-terminal-height";
const TERMINAL_SESSIONS_STORAGE_KEY = "convex-desktop-terminal-sessions";
const TERMINAL_ACTIVE_SESSION_STORAGE_KEY =
  "convex-desktop-terminal-active-session";
const TERMINAL_DEFAULT_HEIGHT = 300;
const TERMINAL_MIN_HEIGHT = 150;
const TERMINAL_MAX_HEIGHT_RATIO = 0.6; // Max 60% of viewport height

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function loadPersistedSessions(): TerminalSession[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(TERMINAL_SESSIONS_STORAGE_KEY);
    if (saved) {
      const sessions = JSON.parse(saved) as TerminalSession[];
      // Clear running processes on load (they won't survive restart)
      return sessions.map((s) => ({ ...s, runningProcess: undefined }));
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

function loadActiveSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TERMINAL_ACTIVE_SESSION_STORAGE_KEY);
}

interface TerminalProviderProps {
  children: ReactNode;
}

export function TerminalProvider({ children }: TerminalProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [height, setHeight] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(TERMINAL_HEIGHT_STORAGE_KEY);
      return saved ? parseInt(saved, 10) : TERMINAL_DEFAULT_HEIGHT;
    }
    return TERMINAL_DEFAULT_HEIGHT;
  });
  const [isConnected] = useState(true); // Always connected in Tauri

  // Multi-session state
  const [sessions, setSessions] = useState<TerminalSession[]>(() => {
    const persisted = loadPersistedSessions();
    if (persisted.length > 0) return persisted;
    // Create default session
    return [
      {
        id: generateSessionId(),
        name: "Terminal 1",
        commandHistory: [],
      },
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    const persisted = loadActiveSessionId();
    const persistedSessions = loadPersistedSessions();
    // Validate that persisted active session exists
    if (persisted && persistedSessions.some((s) => s.id === persisted)) {
      return persisted;
    }
    // Fall back to first session
    return persistedSessions[0]?.id ?? null;
  });

  // Ensure activeSessionId points to valid session after initial load
  useEffect(() => {
    if (
      sessions.length > 0 &&
      !sessions.some((s) => s.id === activeSessionId)
    ) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId]);

  // Persist sessions
  useEffect(() => {
    localStorage.setItem(
      TERMINAL_SESSIONS_STORAGE_KEY,
      JSON.stringify(sessions),
    );
  }, [sessions]);

  // Persist active session
  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem(
        TERMINAL_ACTIVE_SESSION_STORAGE_KEY,
        activeSessionId,
      );
    }
  }, [activeSessionId]);

  // Event listeners for terminal writes
  const writeListenersRef = useRef<Set<TerminalWriteListener>>(new Set());
  const clearListenersRef = useRef<Set<TerminalClearListener>>(new Set());

  const toggleTerminal = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const openTerminal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeTerminal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const setTerminalHeight = useCallback((newHeight: number) => {
    const clampedHeight = Math.max(
      TERMINAL_MIN_HEIGHT,
      Math.min(newHeight, window.innerHeight * TERMINAL_MAX_HEIGHT_RATIO),
    );
    setHeight(clampedHeight);
    localStorage.setItem(TERMINAL_HEIGHT_STORAGE_KEY, clampedHeight.toString());
  }, []);

  const writeToTerminal = useCallback((sessionId: string, data: string) => {
    writeListenersRef.current.forEach((listener) => listener(sessionId, data));
  }, []);

  const clearTerminal = useCallback((sessionId: string) => {
    clearListenersRef.current.forEach((listener) => listener(sessionId));
  }, []);

  // Session management
  const createSession = useCallback(
    (name?: string, workingDirectory?: string): string => {
      const id = generateSessionId();
      const sessionNumber = sessions.length + 1;
      const newSession: TerminalSession = {
        id,
        name: name || `Terminal ${sessionNumber}`,
        workingDirectory,
        commandHistory: [],
      };
      setSessions((prev) => [...prev, newSession]);
      setActiveSessionId(id);
      return id;
    },
    [sessions.length],
  );

  const closeSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const newSessions = prev.filter((s) => s.id !== id);
        // If we closed the active session, switch to another
        if (activeSessionId === id && newSessions.length > 0) {
          const closedIndex = prev.findIndex((s) => s.id === id);
          const newActiveIndex = Math.min(closedIndex, newSessions.length - 1);
          setActiveSessionId(newSessions[newActiveIndex].id);
        }
        // If no sessions left, create a new one
        if (newSessions.length === 0) {
          const newSession: TerminalSession = {
            id: generateSessionId(),
            name: "Terminal 1",
            commandHistory: [],
          };
          setActiveSessionId(newSession.id);
          return [newSession];
        }
        return newSessions;
      });
    },
    [activeSessionId],
  );

  const switchSession = useCallback(
    (id: string) => {
      if (sessions.some((s) => s.id === id)) {
        setActiveSessionId(id);
      }
    },
    [sessions],
  );

  const renameSession = useCallback((id: string, name: string) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  }, []);

  const setSessionWorkingDirectory = useCallback((id: string, path: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, workingDirectory: path } : s)),
    );
  }, []);

  const addToSessionHistory = useCallback((id: string, command: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, commandHistory: [...s.commandHistory, command] }
          : s,
      ),
    );
  }, []);

  const setSessionRunningProcess = useCallback(
    (id: string, process: TerminalSession["runningProcess"] | undefined) => {
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, runningProcess: process } : s)),
      );
    },
    [],
  );

  // Actions are stable - only created once
  const actions = useMemo<TerminalActionsContextValue>(
    () => ({
      toggleTerminal,
      openTerminal,
      closeTerminal,
      setTerminalHeight,
      writeToTerminal,
      clearTerminal,
      createSession,
      closeSession,
      switchSession,
      renameSession,
      setSessionWorkingDirectory,
      addToSessionHistory,
      setSessionRunningProcess,
    }),
    [
      toggleTerminal,
      openTerminal,
      closeTerminal,
      setTerminalHeight,
      writeToTerminal,
      clearTerminal,
      createSession,
      closeSession,
      switchSession,
      renameSession,
      setSessionWorkingDirectory,
      addToSessionHistory,
      setSessionRunningProcess,
    ],
  );

  // State changes when terminal state changes
  const state = useMemo<TerminalStateContextValue>(
    () => ({
      isOpen,
      height,
      isConnected,
      sessions,
      activeSessionId,
    }),
    [isOpen, height, isConnected, sessions, activeSessionId],
  );

  // Event emitter for terminal
  const eventEmitter = useMemo<TerminalEventEmitter>(
    () => ({
      onWrite: (listener: TerminalWriteListener) => {
        writeListenersRef.current.add(listener);
        return () => {
          writeListenersRef.current.delete(listener);
        };
      },
      onClear: (listener: TerminalClearListener) => {
        clearListenersRef.current.add(listener);
        return () => {
          clearListenersRef.current.delete(listener);
        };
      },
    }),
    [],
  );

  // Listen for MCP terminal command events
  useEffect(() => {
    const handleMcpCommand = (
      event: CustomEvent<{
        command: string;
        cwd?: string;
        newSession?: boolean;
        sessionName?: string;
      }>,
    ) => {
      const { command, cwd, newSession, sessionName } = event.detail;

      let targetSessionId: string;

      if (newSession) {
        // Create a new session for this command
        targetSessionId = createSession(sessionName, cwd);
      } else {
        // Use active session or create one if none exists
        targetSessionId = activeSessionId ?? createSession(sessionName, cwd);
      }

      // Open terminal and switch to the session
      openTerminal();
      switchSession(targetSessionId);

      // Write the command to the terminal
      // The actual execution happens in the TerminalPanel
      writeToTerminal(targetSessionId, `$ ${command}\n`);

      // Dispatch an event for the terminal panel to execute the command
      window.dispatchEvent(
        new CustomEvent("terminal-execute-command", {
          detail: { sessionId: targetSessionId, command, cwd },
        }),
      );
    };

    window.addEventListener(
      "mcp-terminal-command",
      handleMcpCommand as EventListener,
    );
    return () => {
      window.removeEventListener(
        "mcp-terminal-command",
        handleMcpCommand as EventListener,
      );
    };
  }, [
    activeSessionId,
    createSession,
    openTerminal,
    switchSession,
    writeToTerminal,
  ]);

  return (
    <TerminalActionsContext.Provider value={actions}>
      <TerminalStateContext.Provider value={state}>
        <TerminalEventContext.Provider value={eventEmitter}>
          {children}
        </TerminalEventContext.Provider>
      </TerminalStateContext.Provider>
    </TerminalActionsContext.Provider>
  );
}

// Hook to get only actions - won't cause re-renders when state changes
export function useTerminalActions(): TerminalActionsContextValue {
  const context = useContext(TerminalActionsContext);
  if (!context) {
    throw new Error(
      "useTerminalActions must be used within a TerminalProvider",
    );
  }
  return context;
}

// Hook to get only state - will re-render when state changes
export function useTerminalState(): TerminalStateContextValue {
  const context = useContext(TerminalStateContext);
  if (!context) {
    throw new Error("useTerminalState must be used within a TerminalProvider");
  }
  return context;
}

// Full hook for components that need everything
export function useTerminal(): TerminalContextValue {
  const actions = useContext(TerminalActionsContext);
  const state = useContext(TerminalStateContext);
  if (!actions || !state) {
    throw new Error("useTerminal must be used within a TerminalProvider");
  }
  return { ...actions, ...state };
}

// Hook to get terminal event emitter
export function useTerminalEvents(): TerminalEventEmitter {
  const context = useContext(TerminalEventContext);
  if (!context) {
    throw new Error("useTerminalEvents must be used within a TerminalProvider");
  }
  return context;
}

// Hook to get the active session
export function useActiveSession(): TerminalSession | null {
  const { sessions, activeSessionId } = useTerminalState();
  return sessions.find((s) => s.id === activeSessionId) ?? null;
}

export {
  TERMINAL_DEFAULT_HEIGHT,
  TERMINAL_MIN_HEIGHT,
  TERMINAL_MAX_HEIGHT_RATIO,
};

export type { TerminalSession as TerminalSessionType };
