import { useCallback } from "react";
import { createGlobalState } from "react-use";
import { ModuleFunction } from "../utils/functionDiscovery";

export type CustomQuery = {
  type: "customQuery";
  table: string | null;
  componentId?: string | null;
};

const useGlobalRunnerShown = createGlobalState(false);
export const useGlobalRunnerSelectedItem = createGlobalState<{
  componentId: string | null;
  fn: ModuleFunction | CustomQuery;
} | null>(null);
export const useGlobalRunnerAutoRun = createGlobalState(false);

export function useIsGlobalRunnerShown() {
  const [isShown] = useGlobalRunnerShown();
  return isShown;
}

export function useShowGlobalRunner() {
  const [, setGlobalRunnerShown] = useGlobalRunnerShown();
  const [selectedItem, setGlobalRunnerSelectedItem] = useGlobalRunnerSelectedItem();
  const [, setAutoRun] = useGlobalRunnerAutoRun();

  return useCallback(
    (selected: ModuleFunction | CustomQuery | null, how: "click" | "keyboard" | "tutorial" | "redirect" = "click", autoRun: boolean = false) => {
      if (selected || !selectedItem) {
        const fn = selected ?? {
          type: "customQuery" as const,
          table: null,
          componentId: null,
        };
        setGlobalRunnerSelectedItem({
          componentId: 'type' in fn && fn.type === "customQuery" ? fn.componentId ?? null : (fn as ModuleFunction).componentId ?? null,
          fn: fn,
        });
      }
      setAutoRun(autoRun);
      setGlobalRunnerShown(true);
    },
    [selectedItem, setGlobalRunnerShown, setGlobalRunnerSelectedItem, setAutoRun],
  );
}

export function useHideGlobalRunner() {
  const [, setGlobalRunnerShown] = useGlobalRunnerShown();
  return useCallback(
    (how: "click" | "redirect" | "keyboard") => {
      setGlobalRunnerShown(false);
    },
    [setGlobalRunnerShown],
  );
} 