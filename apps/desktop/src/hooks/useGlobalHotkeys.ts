import { useHotkeys } from "react-hotkeys-hook";
import type { HotkeyDefinition } from "@/lib/hotkeys";

function useHotkey(definition: HotkeyDefinition) {
  const keys = Array.isArray(definition.keys)
    ? definition.keys
    : [definition.keys];

  useHotkeys(
    keys.join(","),
    (e) => {
      e.preventDefault();
      definition.action();
    },
    {
      enableOnFormTags: definition.enableOnFormTags ?? false,
    },
    [definition.action],
  );
}

export function useGlobalHotkeys(definitions: HotkeyDefinition[]) {
  for (let i = 0; i < definitions.length; i++) {
    useHotkey(definitions[i]);
  }
}
