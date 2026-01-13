export type HotkeyAction = () => void;

export interface HotkeyDefinition {
  keys: string | string[];
  action: HotkeyAction;
  description?: string;
  enableOnFormTags?: boolean;
}

export type GlobalHotkeysConfig = {
  toggleCommandPalette: HotkeyDefinition;
  openSettings: HotkeyDefinition;
  navigateToNavItem: (index: number) => HotkeyDefinition;
  toggleSidebar: HotkeyDefinition;
  toggleTerminal: HotkeyDefinition;
};

export function createGlobalHotkeysConfig(actions: {
  onToggleCommandPalette: HotkeyAction;
  onOpenSettings: HotkeyAction;
  onNavigateToNavItem: (index: number) => void;
  onToggleSidebar: HotkeyAction;
  onToggleTerminal: HotkeyAction;
}): HotkeyDefinition[] {
  const navItemHotkeys: HotkeyDefinition[] = [];
  
  for (let i = 1; i <= 9; i++) {
    navItemHotkeys.push({
      keys: [`ctrl+${i}`, `meta+${i}`],
      action: () => actions.onNavigateToNavItem(i - 1),
      description: `Navigate to nav item ${i}`,
      enableOnFormTags: false,
    });
  }

  return [
    {
      keys: ["ctrl+k", "meta+k"],
      action: actions.onToggleCommandPalette,
      description: "Toggle command palette",
      enableOnFormTags: true,
    },
    {
      keys: ["ctrl+,", "meta+,"],
      action: actions.onOpenSettings,
      description: "Open settings",
      enableOnFormTags: true,
    },
    ...navItemHotkeys,
    {
      keys: ["ctrl+b", "meta+b"],
      action: actions.onToggleSidebar,
      description: "Toggle sidebar",
      enableOnFormTags: false,
    },
    {
      keys: ["ctrl+`", "meta+`"],
      action: actions.onToggleTerminal,
      description: "Toggle terminal",
      enableOnFormTags: true,
    },
  ];
}
