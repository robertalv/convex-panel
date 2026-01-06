import { useCallback } from "react";
import { createGlobalState } from "../hooks/createGlobalState";
import type { ModuleFunction } from "../utils/api/functionDiscovery";
import type { CustomQuery } from "../types/functions";

const FUNCTION_RUNNER_ORIENTATION_KEY = "functionRunnerOrientation";

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

/**
 * Sets the function runner orientation directly (for opening in specific mode)
 */
function setFunctionRunnerOrientation(vertical: boolean) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      FUNCTION_RUNNER_ORIENTATION_KEY,
      JSON.stringify(vertical),
    );
    // Dispatch event to notify other components using useGlobalLocalStorage
    window.dispatchEvent(
      new StorageEvent("local-storage", {
        key: FUNCTION_RUNNER_ORIENTATION_KEY,
      }),
    );
  }
}

export function useShowGlobalRunner() {
  const [, setGlobalRunnerShown] = useGlobalRunnerShown();
  const [selectedItem, setGlobalRunnerSelectedItem] =
    useGlobalRunnerSelectedItem();
  const [, setAutoRun] = useGlobalRunnerAutoRun();

  return useCallback(
    (
      selected: ModuleFunction | CustomQuery | null,
      autoRun: boolean = false,
      vertical?: boolean,
    ) => {
      if (selected || !selectedItem) {
        const fn = selected ?? {
          type: "customQuery" as const,
          table: null,
          componentId: null,
        };
        setGlobalRunnerSelectedItem({
          componentId:
            "type" in fn && fn.type === "customQuery"
              ? (fn.componentId ?? null)
              : ((fn as ModuleFunction).componentId ?? null),
          fn: fn,
        });
      }
      setAutoRun(autoRun);
      // Set orientation if specified
      if (vertical !== undefined) {
        setFunctionRunnerOrientation(vertical);
      }
      setGlobalRunnerShown(true);
    },
    [
      selectedItem,
      setGlobalRunnerShown,
      setGlobalRunnerSelectedItem,
      setAutoRun,
    ],
  );
}

export function useHideGlobalRunner() {
  const [, setGlobalRunnerShown] = useGlobalRunnerShown();
  return useCallback(() => {
    setGlobalRunnerShown(false);
  }, [setGlobalRunnerShown]);
}
