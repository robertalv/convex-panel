import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Command,
  NAVIGATION_COMMANDS,
  ACTION_COMMANDS,
  SETTINGS_COMMANDS,
  createTableCommands,
  createFunctionCommands,
  filterCommands,
  groupCommands,
  type CommandGroup,
} from "@/lib/commands";
import { useTerminalActions } from "./terminal-context";
import { useFunctionRunnerActions } from "./function-runner-context";
import { useGlobalHotkeys } from "@/hooks/useGlobalHotkeys";
import type { HotkeyDefinition } from "@/lib/hotkeys";

interface CommandPaletteContextValue {
  /** All available commands */
  commands: Command[];
  /** Grouped commands for display */
  commandGroups: CommandGroup[];
  /** Filter commands by query */
  filterCommands: (query: string) => Command[];
  /** Open the command palette */
  open: () => void;
  /** Close the command palette */
  close: () => void;
  /** Toggle the command palette */
  toggle: () => void;
  /** Is the palette open? */
  isOpen: boolean;
  /** Register additional contextual commands */
  registerDynamicCommands: (commands: Command[]) => void;
  /** Clear dynamic commands */
  clearDynamicCommands: () => void;
}

const CommandPaletteContext = createContext<
  CommandPaletteContextValue | undefined
>(undefined);

interface CommandPaletteProviderProps {
  children: ReactNode;
  /** Callback when user disconnects/logs out */
  onDisconnect: () => void;
  /** Callback when user wants to open about dialog */
  onOpenAbout: () => void;
  /** Callback to toggle sidebar */
  onToggleSidebar: () => void;
  /** Callback to refresh projects (optional, only in OAuth mode) */
  onRefreshProjects?: () => void;
  /** Whether the app is in deploy key mode */
  isDeployKeyMode: boolean;
  /** Callback when a table is selected (for navigation to Data view) */
  onSelectTable?: (tableName: string) => void;
  /** Available tables (for dynamic commands) */
  tables?: string[];
  /** Available functions (for dynamic commands) */
  functions?: Array<{ identifier: string; type: string }>;
  /** Callback to open function runner with a specific function */
  onOpenFunctionRunner?: (functionIdentifier: string) => void;
}

export function CommandPaletteProvider({
  children,
  onDisconnect,
  onOpenAbout,
  onToggleSidebar,
  onRefreshProjects,
  isDeployKeyMode,
  onSelectTable,
  tables = [],
  functions = [],
  onOpenFunctionRunner,
}: CommandPaletteProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleTerminal } = useTerminalActions();
  const { toggleFunctionRunner } = useFunctionRunnerActions();

  const [isOpen, setIsOpen] = useState(false);
  const [dynamicCommands, setDynamicCommands] = useState<Command[]>([]);

  // Navigation handler that can optionally set a settings section
  const handleNavigate = useCallback(
    (path: string, section?: string) => {
      if (section) {
        // Store the settings section in localStorage for the settings view to read
        localStorage.setItem("convex-panel-settings-section", section);

        // Dispatch custom event to notify settings view of the change
        window.dispatchEvent(
          new CustomEvent("settings-section-change", {
            detail: { section },
          }),
        );
      }
      navigate(path);
      setIsOpen(false);
    },
    [navigate],
  );

  // Build static commands
  const staticCommands = useMemo(() => {
    const navCommands = NAVIGATION_COMMANDS(handleNavigate, isDeployKeyMode);
    const actionCommands = ACTION_COMMANDS(
      toggleTerminal,
      toggleFunctionRunner,
      onToggleSidebar,
      onOpenAbout,
      onDisconnect,
      onRefreshProjects,
      isDeployKeyMode,
    );
    const settingsCommands = SETTINGS_COMMANDS(handleNavigate, isDeployKeyMode);

    return [...navCommands, ...actionCommands, ...settingsCommands];
  }, [
    handleNavigate,
    isDeployKeyMode,
    toggleTerminal,
    toggleFunctionRunner,
    onToggleSidebar,
    onOpenAbout,
    onDisconnect,
    onRefreshProjects,
  ]);

  // Build dynamic commands from tables and functions
  const dynamicDataCommands = useMemo(() => {
    if (!onSelectTable || tables.length === 0) return [];
    return createTableCommands(tables, handleNavigate, onSelectTable);
  }, [tables, handleNavigate, onSelectTable]);

  const dynamicFunctionCommands = useMemo(() => {
    if (!onOpenFunctionRunner || functions.length === 0) return [];
    return createFunctionCommands(functions, onOpenFunctionRunner);
  }, [functions, onOpenFunctionRunner]);

  // Combine all commands
  const allCommands = useMemo(() => {
    return [
      ...staticCommands,
      ...dynamicDataCommands,
      ...dynamicFunctionCommands,
      ...dynamicCommands,
    ];
  }, [
    staticCommands,
    dynamicDataCommands,
    dynamicFunctionCommands,
    dynamicCommands,
  ]);

  // Group commands by category
  const commandGroups = useMemo(() => {
    return groupCommands(allCommands);
  }, [allCommands]);

  // Filter commands by query
  const handleFilterCommands = useCallback(
    (query: string) => {
      return filterCommands(allCommands, query);
    },
    [allCommands],
  );

  // Command palette controls
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Register dynamic commands (for views to add contextual commands)
  const registerDynamicCommands = useCallback((commands: Command[]) => {
    setDynamicCommands((prev) => [...prev, ...commands]);
  }, []);

  const clearDynamicCommands = useCallback(() => {
    setDynamicCommands([]);
  }, []);

  // Close palette on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Register ⌘K hotkey to open command palette
  const paletteHotkeys = useMemo<HotkeyDefinition[]>(
    () => [
      {
        keys: ["ctrl+k", "meta+k"],
        action: toggle,
        description: "Open command palette",
        enableOnFormTags: true,
      },
    ],
    [toggle],
  );

  useGlobalHotkeys(paletteHotkeys);

  const value = useMemo(
    () => ({
      commands: allCommands,
      commandGroups,
      filterCommands: handleFilterCommands,
      open,
      close,
      toggle,
      isOpen,
      registerDynamicCommands,
      clearDynamicCommands,
    }),
    [
      allCommands,
      commandGroups,
      handleFilterCommands,
      open,
      close,
      toggle,
      isOpen,
      registerDynamicCommands,
      clearDynamicCommands,
    ],
  );

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

/**
 * Hook to access the command palette context
 */
export function useCommandPalette(): CommandPaletteContextValue {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error(
      "useCommandPalette must be used within a CommandPaletteProvider",
    );
  }
  return context;
}

/**
 * Hook to access basic command palette controls without throwing
 * Useful for components that may be outside the provider
 */
export function useCommandPaletteOptional():
  | CommandPaletteContextValue
  | undefined {
  return useContext(CommandPaletteContext);
}
