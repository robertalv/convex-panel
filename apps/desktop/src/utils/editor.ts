/**
 * Editor Integration Utilities
 * Handles opening files in external editors with line number support
 */

import { invoke } from "@tauri-apps/api/core";

/**
 * Editor configuration with installation instructions
 */
export interface EditorConfig {
  label: string;
  command: string;
  installInstructions: string;
  checkCommand: string; // Command to check if editor is installed
  installCommand?: string; // Optional automatic installation command
  isCustom?: boolean; // Whether this is a user-added custom editor
}

/**
 * Built-in supported code editors
 */
export const BUILTIN_EDITORS: Record<string, EditorConfig> = {
  cursor: {
    label: "Cursor",
    command: "cursor",
    checkCommand: "which cursor",
    installInstructions:
      "Open Cursor → Settings (Cmd+,) → Search 'shell command' → Click 'Install 'cursor' command in PATH'",
  },
  vscode: {
    label: "VS Code",
    command: "code",
    checkCommand: "which code",
    installInstructions:
      "Open VS Code → Command Palette (Cmd+Shift+P) → Type 'Shell Command: Install 'code' command in PATH'",
  },
  zed: {
    label: "Zed",
    command: "zed",
    checkCommand: "which zed",
    installInstructions:
      "Open Zed → Menu Bar → Zed → Install CLI → This will install the 'zed' command in /usr/local/bin",
  },
  sublime: {
    label: "Sublime Text",
    command: "subl",
    checkCommand: "which subl",
    installInstructions:
      "Create symlink: sudo ln -s '/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl' /usr/local/bin/subl",
  },
  webstorm: {
    label: "WebStorm",
    command: "webstorm",
    checkCommand: "which webstorm",
    installInstructions:
      "Open WebStorm → Tools → Create Command-line Launcher → Set path to /usr/local/bin/webstorm",
  },
  idea: {
    label: "IntelliJ IDEA",
    command: "idea",
    checkCommand: "which idea",
    installInstructions:
      "Open IntelliJ IDEA → Tools → Create Command-line Launcher → Set path to /usr/local/bin/idea",
  },
  vim: {
    label: "Vim",
    command: "vim",
    checkCommand: "which vim",
    installInstructions:
      "Vim is usually pre-installed on macOS/Linux. If not: brew install vim",
  },
  neovim: {
    label: "Neovim",
    command: "nvim",
    checkCommand: "which nvim",
    installInstructions: "Install via Homebrew: brew install neovim",
  },
  emacs: {
    label: "Emacs",
    command: "emacs",
    checkCommand: "which emacs",
    installInstructions: "Install via Homebrew: brew install emacs",
  },
} as const;

/**
 * Custom editor storage key
 */
const CUSTOM_EDITORS_KEY = "convex-panel-custom-editors";

/**
 * Get custom editors from localStorage
 */
export function getCustomEditors(): Record<string, EditorConfig> {
  try {
    const stored = localStorage.getItem(CUSTOM_EDITORS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load custom editors:", error);
  }
  return {};
}

/**
 * Save custom editors to localStorage
 */
export function saveCustomEditors(editors: Record<string, EditorConfig>): void {
  try {
    localStorage.setItem(CUSTOM_EDITORS_KEY, JSON.stringify(editors));
  } catch (error) {
    console.error("Failed to save custom editors:", error);
  }
}

/**
 * Add a custom editor
 */
export function addCustomEditor(
  id: string,
  label: string,
  command: string,
  installInstructions?: string,
): void {
  const customEditors = getCustomEditors();
  customEditors[id] = {
    label,
    command,
    checkCommand: `which ${command}`,
    installInstructions:
      installInstructions ||
      `Make sure '${command}' is installed and available in your PATH.`,
    isCustom: true,
  };
  saveCustomEditors(customEditors);
}

/**
 * Remove a custom editor
 */
export function removeCustomEditor(id: string): void {
  const customEditors = getCustomEditors();
  delete customEditors[id];
  saveCustomEditors(customEditors);
}

/**
 * Get all editors (built-in + custom)
 */
export function getAllEditors(): Record<string, EditorConfig> {
  return {
    ...BUILTIN_EDITORS,
    ...getCustomEditors(),
  };
}

/**
 * Supported code editors (for backwards compatibility)
 */
export const SUPPORTED_EDITORS = getAllEditors();

export type EditorType = string; // Changed from keyof to string to support custom editors

/**
 * Get the preferred editor from localStorage
 * Defaults to 'cursor' if not set
 */
export function getPreferredEditor(): EditorType {
  const saved = localStorage.getItem("convex-panel-preferred-editor");
  const allEditors = getAllEditors();

  if (saved && saved in allEditors) {
    return saved;
  }
  return "cursor";
}

/**
 * Set the preferred editor in localStorage
 */
export function setPreferredEditor(editor: EditorType): void {
  localStorage.setItem("convex-panel-preferred-editor", editor);
}

/**
 * Open a file in the user's preferred editor
 * @param filePath - Absolute path to the file
 * @param lineNumber - Optional 1-based line number to jump to
 * @param editor - Optional editor override (uses preference if not provided)
 */
export async function openInEditor(
  filePath: string,
  lineNumber?: number,
  editor?: EditorType,
): Promise<void> {
  const editorType = editor || getPreferredEditor();
  const allEditors = getAllEditors();
  const editorConfig = allEditors[editorType];

  if (!editorConfig) {
    throw new Error(`Unknown editor: ${editorType}`);
  }

  const editorCommand = editorConfig.command;

  console.log("[openInEditor] Opening file:", {
    filePath,
    lineNumber,
    editorType,
    editorCommand,
  });

  try {
    await invoke("open_in_editor", {
      path: filePath,
      line: lineNumber,
      editor: editorCommand,
    });
  } catch (error) {
    console.error(`Failed to open file in ${editorType}:`, error);
    throw new Error(
      `Could not open ${editorConfig.label}. Make sure it's installed and available in your PATH.`,
    );
  }
}

/**
 * Open the schema.ts file in the editor
 * @param projectPath - Path to the Convex project
 * @param lineNumber - Optional line number to jump to
 */
export async function openSchemaInEditor(
  projectPath: string,
  lineNumber?: number,
): Promise<void> {
  const schemaPath = `${projectPath}/convex/schema.ts`;
  await openInEditor(schemaPath, lineNumber);
}

/**
 * Check if an editor is available in PATH
 * Uses Rust command for reliable PATH checking
 * @param editor - Editor type to check
 * @returns Promise<boolean> - true if editor is available
 */
export async function isEditorAvailable(editor: EditorType): Promise<boolean> {
  const allEditors = getAllEditors();
  const config = allEditors[editor];

  if (!config) {
    return false;
  }

  try {
    const available = await invoke<boolean>("check_editor_available", {
      editor: config.command,
    });
    return available;
  } catch (error) {
    console.error(`Failed to check ${editor} availability:`, error);
    return false;
  }
}

/**
 * Get installation instructions for an editor
 * @param editor - Editor type
 * @returns Installation instructions string
 */
export function getInstallInstructions(editor: EditorType): string {
  const allEditors = getAllEditors();
  return (
    allEditors[editor]?.installInstructions || "No instructions available."
  );
}
