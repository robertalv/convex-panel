import type { IconProps } from "@/components/ui/icon";

/**
 * Command category for grouping commands
 */
export enum CommandCategory {
  Navigation = "Navigation",
  Actions = "Actions",
  Settings = "Settings",
  Data = "Data",
  Functions = "Functions",
  Help = "Help",
}

/**
 * Command interface - represents a single command in the palette
 */
export interface Command {
  /** Unique identifier for the command */
  id: string;
  /** Display label shown in the palette */
  label: string;
  /** Category for grouping commands */
  category: CommandCategory;
  /** Optional keywords for fuzzy search */
  keywords?: string[];
  /** Optional keyboard shortcut (display only) */
  shortcut?: string;
  /** Optional icon */
  icon?: IconProps;
  /** Action to execute when command is selected */
  action: () => void;
  /** If true, this command is only available in OAuth mode (not deploy key mode) */
  requiresOAuth?: boolean;
  /** Optional description for more context */
  description?: string;
}

/**
 * Grouped commands by category
 */
export interface CommandGroup {
  category: CommandCategory;
  commands: Command[];
}

/**
 * Static navigation commands
 */
export const NAVIGATION_COMMANDS = (
  onNavigate: (path: string) => void,
  isDeployKeyMode: boolean,
): Command[] =>
  [
    {
      id: "nav-health",
      label: "Health",
      category: CommandCategory.Navigation,
      keywords: ["health", "dashboard", "status", "metrics"],
      shortcut: "⌘1",
      icon: { name: "activity" },
      action: () => onNavigate("/health"),
    },
    {
      id: "nav-data",
      label: "Data",
      category: CommandCategory.Navigation,
      keywords: ["data", "table", "database", "documents"],
      shortcut: "⌘2",
      icon: { name: "table" },
      action: () => onNavigate("/data"),
    },
    {
      id: "nav-schema",
      label: "Schema",
      category: CommandCategory.Navigation,
      keywords: ["schema", "visualize", "diagram", "relationships"],
      shortcut: "⌘3",
      icon: { name: "flow" },
      action: () => onNavigate("/schema"),
      requiresOAuth: true,
    },
    {
      id: "nav-advisor",
      label: "Advisor",
      category: CommandCategory.Navigation,
      keywords: ["advisor", "performance", "optimization", "recommendations"],
      shortcut: "⌘4",
      icon: { name: "performance" },
      action: () => onNavigate("/advisor"),
      requiresOAuth: true,
    },
    {
      id: "nav-functions",
      label: "Functions",
      category: CommandCategory.Navigation,
      keywords: ["functions", "queries", "mutations", "actions"],
      shortcut: "⌘5",
      icon: { name: "code" },
      action: () => onNavigate("/functions"),
    },
    {
      id: "nav-files",
      label: "Files",
      category: CommandCategory.Navigation,
      keywords: ["files", "storage", "uploads"],
      shortcut: "⌘7",
      icon: { name: "files" },
      action: () => onNavigate("/files"),
    },
    {
      id: "nav-schedules",
      label: "Schedules",
      category: CommandCategory.Navigation,
      keywords: ["schedules", "cron", "jobs", "scheduled"],
      shortcut: "⌘8",
      icon: { name: "timer" },
      action: () => onNavigate("/schedules"),
    },
    {
      id: "nav-logs",
      label: "Logs",
      category: CommandCategory.Navigation,
      keywords: ["logs", "console", "debug", "errors"],
      shortcut: "⌘9",
      icon: { name: "logs" },
      action: () => onNavigate("/logs"),
    },
    {
      id: "nav-marketplace",
      label: "Marketplace",
      category: CommandCategory.Navigation,
      keywords: ["marketplace", "components", "install"],
      shortcut: "G then M",
      icon: { name: "marketplace" },
      action: () => onNavigate("/marketplace"),
      requiresOAuth: true,
    },
    {
      id: "nav-settings",
      label: "Settings",
      category: CommandCategory.Navigation,
      keywords: ["settings", "preferences", "config"],
      shortcut: "⌘,",
      icon: { name: "settings" },
      action: () => onNavigate("/settings"),
    },
  ].filter((cmd) => !isDeployKeyMode || !cmd.requiresOAuth);

/**
 * Static action commands
 */
export const ACTION_COMMANDS = (
  onToggleTerminal: () => void,
  onToggleFunctionRunner: () => void,
  onToggleSidebar: () => void,
  onOpenAbout: () => void,
  onDisconnect: () => void,
  onRefreshProjects?: () => void,
  isDeployKeyMode?: boolean,
): Command[] =>
  [
    {
      id: "action-toggle-terminal",
      label: "Toggle Terminal",
      category: CommandCategory.Actions,
      keywords: ["terminal", "console", "cli", "command"],
      shortcut: "⌘`",
      icon: { name: "terminal" },
      action: onToggleTerminal,
    },
    {
      id: "action-toggle-function-runner",
      label: "Toggle Function Runner",
      category: CommandCategory.Actions,
      keywords: ["function", "runner", "execute", "run"],
      shortcut: "⌃1",
      icon: { name: "code" },
      action: onToggleFunctionRunner,
    },
    {
      id: "action-toggle-sidebar",
      label: "Toggle Sidebar",
      category: CommandCategory.Actions,
      keywords: ["sidebar", "navigation", "collapse"],
      shortcut: "⌘B",
      icon: { name: "chevron-back" },
      action: onToggleSidebar,
    },
    {
      id: "action-about",
      label: "About Convex Panel",
      category: CommandCategory.Actions,
      keywords: ["about", "version", "info"],
      icon: { name: "info" },
      action: onOpenAbout,
    },
    {
      id: "action-disconnect",
      label: "Disconnect",
      category: CommandCategory.Actions,
      keywords: ["disconnect", "logout", "sign out"],
      icon: { name: "log-out" },
      action: onDisconnect,
      description: "Sign out and return to welcome screen",
    },
    onRefreshProjects && !isDeployKeyMode
      ? {
          id: "action-refresh-projects",
          label: "Refresh Projects",
          category: CommandCategory.Actions,
          keywords: ["refresh", "reload", "projects"],
          icon: { name: "refresh" },
          action: onRefreshProjects,
          requiresOAuth: true,
        }
      : null,
  ].filter(Boolean) as Command[];

/**
 * Settings section commands
 */
export const SETTINGS_COMMANDS = (
  onNavigate: (path: string, section?: string) => void,
  isDeployKeyMode: boolean,
): Command[] => {
  const settingsSections = [
    {
      id: "settings-profile",
      label: "Settings → Profile",
      keywords: ["settings", "profile", "user", "account"],
      section: "profile",
      requiresOAuth: true,
    },
    {
      id: "settings-appearance",
      label: "Settings → Appearance",
      keywords: ["settings", "appearance", "theme", "dark", "light"],
      section: "appearance",
      requiresOAuth: true,
    },
    {
      id: "settings-notifications",
      label: "Settings → Notifications",
      keywords: ["settings", "notifications", "alerts"],
      section: "notifications",
      requiresOAuth: true,
    },
    {
      id: "settings-integrations",
      label: "Settings → Integrations",
      keywords: ["settings", "integrations", "github", "external"],
      section: "integrations",
      requiresOAuth: true,
    },
    {
      id: "settings-log-storage",
      label: "Settings → Log Storage",
      keywords: ["settings", "logs", "storage", "sqlite"],
      section: "log-storage",
      requiresOAuth: true,
    },
    {
      id: "settings-url-deploy-key",
      label: "Settings → URL & Deploy Key",
      keywords: ["settings", "url", "deploy", "key", "credentials"],
      section: "url-deploy-key",
    },
    {
      id: "settings-environment-variables",
      label: "Settings → Environment Variables",
      keywords: ["settings", "env", "environment", "variables"],
      section: "environment-variables",
      requiresOAuth: true,
    },
    {
      id: "settings-authentication",
      label: "Settings → Authentication",
      keywords: ["settings", "auth", "authentication", "clerk"],
      section: "authentication",
      requiresOAuth: true,
    },
    {
      id: "settings-components",
      label: "Settings → Components",
      keywords: ["settings", "components", "modules"],
      section: "components",
      requiresOAuth: true,
    },
    {
      id: "settings-backup-restore",
      label: "Settings → Backup & Restore",
      keywords: ["settings", "backup", "restore", "export", "import"],
      section: "backup-restore",
      requiresOAuth: true,
    },
    {
      id: "settings-pause-deployment",
      label: "Settings → Pause Deployment",
      keywords: ["settings", "pause", "deployment", "disable"],
      section: "pause-deployment",
      requiresOAuth: true,
    },
    {
      id: "settings-ai-analysis",
      label: "Settings → AI Analysis",
      keywords: ["settings", "ai", "analysis", "artificial intelligence"],
      section: "ai-analysis",
      requiresOAuth: true,
    },
  ];

  return settingsSections
    .filter((setting) => !isDeployKeyMode || !setting.requiresOAuth)
    .map((setting) => ({
      id: setting.id,
      label: setting.label,
      category: CommandCategory.Settings,
      keywords: setting.keywords,
      icon: { name: "settings" },
      action: () => onNavigate("/settings", setting.section),
      requiresOAuth: setting.requiresOAuth,
    }));
};

/**
 * Create dynamic table commands
 */
export function createTableCommands(
  tables: string[],
  onNavigate: (path: string) => void,
  onSelectTable: (tableName: string) => void,
): Command[] {
  return tables.map((tableName) => ({
    id: `data-table-${tableName}`,
    label: `Go to ${tableName}`,
    category: CommandCategory.Data,
    keywords: ["table", "data", tableName],
    icon: { name: "table" },
    description: `View ${tableName} table`,
    action: () => {
      onNavigate("/data");
      // Small delay to ensure navigation completes
      setTimeout(() => onSelectTable(tableName), 100);
    },
  }));
}

/**
 * Format function identifier for display
 * Removes .js extension and formats nicely
 * e.g., "todos.js:list" -> "todos:list"
 */
function formatFunctionIdentifier(identifier: string): string {
  return identifier.replace(/\.js:/g, ":").replace(/\.js$/g, "");
}

/**
 * Create dynamic function commands
 */
export function createFunctionCommands(
  functions: Array<{ identifier: string; type: string }>,
  onOpenFunctionRunner: (functionIdentifier: string) => void,
): Command[] {
  return functions.map((func) => {
    const displayName = formatFunctionIdentifier(func.identifier);
    return {
      id: `function-${func.identifier}`,
      label: displayName,
      category: CommandCategory.Functions,
      keywords: ["function", "run", func.type, displayName, func.identifier],
      icon: { name: "code" },
      description: `Run ${func.type}`,
      action: () => onOpenFunctionRunner(func.identifier),
    };
  });
}

/**
 * Filter commands by search query
 * Note: Function commands are only shown when actively searching (not in default view)
 */
export function filterCommands(commands: Command[], query: string): Command[] {
  const lowerQuery = query.toLowerCase().trim();

  // If no query, exclude function commands from default view
  if (!lowerQuery) {
    return commands.filter((cmd) => cmd.category !== CommandCategory.Functions);
  }

  const searchTerms = lowerQuery.split(/\s+/);

  return commands.filter((cmd) => {
    const searchableText = [
      cmd.label,
      ...(cmd.keywords || []),
      cmd.description || "",
    ]
      .join(" ")
      .toLowerCase();

    // All search terms must match
    return searchTerms.every((term) => searchableText.includes(term));
  });
}

/**
 * Group commands by category
 */
export function groupCommands(commands: Command[]): CommandGroup[] {
  const groups = new Map<CommandCategory, Command[]>();

  for (const command of commands) {
    const existing = groups.get(command.category) || [];
    groups.set(command.category, [...existing, command]);
  }

  // Return in a specific order
  const categoryOrder = [
    CommandCategory.Navigation,
    CommandCategory.Actions,
    CommandCategory.Data,
    CommandCategory.Functions,
    CommandCategory.Settings,
    CommandCategory.Help,
  ];

  return categoryOrder
    .filter((category) => groups.has(category))
    .map((category) => ({
      category,
      commands: groups.get(category)!,
    }));
}
