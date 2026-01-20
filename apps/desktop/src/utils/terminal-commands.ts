/**
 * Terminal command execution utilities for automated editor CLI installation
 */

/**
 * Commands to install editor CLI tools
 * These commands actually perform the installation automatically
 * Keys match the editor command names from editor.ts
 */
export const EDITOR_INSTALL_COMMANDS: Record<string, string> = {
  // Cursor - Create symlink directly
  cursor:
    'echo "Installing Cursor CLI tool..." && if [ -d "/Applications/Cursor.app" ]; then sudo ln -sf "/Applications/Cursor.app/Contents/Resources/app/bin/cursor" /usr/local/bin/cursor && echo "\\n✓ Cursor CLI installed successfully! Try: cursor --version"; else echo "\\n✗ Error: Cursor.app not found in /Applications\\nPlease install Cursor first from https://cursor.sh"; fi',

  // VS Code - Create symlink directly
  code: 'echo "Installing VS Code CLI tool..." && if [ -d "/Applications/Visual Studio Code.app" ]; then sudo ln -sf "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" /usr/local/bin/code && echo "\\n✓ VS Code CLI installed successfully! Try: code --version"; else echo "\\n✗ Error: Visual Studio Code.app not found in /Applications\\nPlease install VS Code first from https://code.visualstudio.com"; fi',

  // Zed - Create symlink directly
  zed: 'echo "Installing Zed CLI tool..." && if [ -d "/Applications/Zed.app" ]; then sudo ln -sf "/Applications/Zed.app/Contents/MacOS/cli" /usr/local/bin/zed && echo "\\n✓ Zed CLI installed successfully! Try: zed --version"; else echo "\\n✗ Error: Zed.app not found in /Applications\\nPlease install Zed first from https://zed.dev"; fi',

  // Sublime Text - Create symlink directly
  subl: 'echo "Installing Sublime Text CLI tool..." && if [ -d "/Applications/Sublime Text.app" ]; then sudo ln -sf "/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl" /usr/local/bin/subl && echo "\\n✓ Sublime Text CLI installed successfully! Try: subl --version"; else echo "\\n✗ Error: Sublime Text.app not found in /Applications\\nPlease install Sublime Text first from https://sublimetext.com"; fi',

  // WebStorm - Create symlink to the launcher script
  webstorm:
    'echo "Installing WebStorm CLI tool..." && if [ -d "/Applications/WebStorm.app" ]; then sudo ln -sf "/Applications/WebStorm.app/Contents/MacOS/webstorm" /usr/local/bin/webstorm && echo "\\n✓ WebStorm CLI installed successfully! Try: webstorm --version"; else echo "\\n✗ Error: WebStorm.app not found in /Applications\\nPlease install WebStorm first from https://jetbrains.com/webstorm"; fi',

  // IntelliJ IDEA - Create symlink to the launcher script
  idea: 'echo "Installing IntelliJ IDEA CLI tool..." && if [ -d "/Applications/IntelliJ IDEA.app" ]; then sudo ln -sf "/Applications/IntelliJ IDEA.app/Contents/MacOS/idea" /usr/local/bin/idea && echo "\\n✓ IntelliJ IDEA CLI installed successfully! Try: idea --version"; else echo "\\n✗ Error: IntelliJ IDEA.app not found in /Applications\\nPlease install IntelliJ IDEA first from https://jetbrains.com/idea"; fi',

  // Neovim - Install via Homebrew
  nvim: 'if command -v brew >/dev/null 2>&1; then echo "Installing Neovim via Homebrew..." && brew install neovim && echo "\\n✓ Neovim installed successfully! Try: nvim --version"; else echo "✗ Error: Homebrew not found.\\nInstall Homebrew from https://brew.sh then try again."; fi',

  // Vim - Usually pre-installed, but can install via Homebrew
  vim: 'if command -v vim >/dev/null 2>&1; then echo "✓ Vim is already installed: $(vim --version | head -n 1)"; elif command -v brew >/dev/null 2>&1; then echo "Installing Vim via Homebrew..." && brew install vim && echo "\\n✓ Vim installed successfully!"; else echo "✗ Error: Vim not found and Homebrew not available."; fi',

  // Emacs - Install via Homebrew
  emacs:
    'if command -v brew >/dev/null 2>&1; then echo "Installing Emacs via Homebrew..." && brew install emacs && echo "\\n✓ Emacs installed successfully! Try: emacs --version"; else echo "✗ Error: Homebrew not found.\\nInstall Homebrew from https://brew.sh then try again."; fi',
};

/**
 * Gets the installation command for a specific editor
 * @param editorCommand - The command identifier (e.g., "code", "cursor")
 * @returns The installation command or undefined if not available
 */
export function getEditorInstallCommand(
  editorCommand: string,
): string | undefined {
  return EDITOR_INSTALL_COMMANDS[editorCommand];
}

/**
 * Checks if an editor has an automated installation command
 * @param editorCommand - The command identifier (e.g., "code", "cursor")
 * @returns True if automated install is available
 */
export function hasAutomatedInstall(editorCommand: string): boolean {
  return editorCommand in EDITOR_INSTALL_COMMANDS;
}

/**
 * Opens the terminal and executes a command
 * Uses the window event system to trigger terminal command execution
 * @param command - The command to execute
 */
export function executeInTerminal(command: string): void {
  console.log("[executeInTerminal] Opening terminal and executing:", command);

  // First, open the terminal
  window.dispatchEvent(new CustomEvent("terminal-open"));
  console.log("[executeInTerminal] Dispatched terminal-open event");

  // Then, dispatch command execution after a delay to ensure terminal is ready
  // Increased delay to 500ms to ensure terminal animation completes and PTY is ready
  setTimeout(() => {
    console.log(
      "[executeInTerminal] Dispatching terminal-execute-command event",
    );
    window.dispatchEvent(
      new CustomEvent("terminal-execute-command", {
        detail: {
          sessionId: "active", // Special identifier for active session
          command,
        },
      }),
    );
  }, 500);
}
