import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { SelectedFunction } from "@/components/function-selector";

/** Layout mode for the Function Runner */
export type FunctionRunnerLayout = "side" | "bottom" | "fullscreen";

interface FunctionRunnerActionsContextValue {
  toggleFunctionRunner: () => void;
  openFunctionRunner: () => void;
  closeFunctionRunner: () => void;
  setLayoutMode: (mode: FunctionRunnerLayout) => void;
  setInitialFunction: (fn: SelectedFunction) => void;
  openWithFunction: (functionIdentifier: string, autoRun?: boolean) => void;
  clearAutoRun: () => void;
}

interface FunctionRunnerStateContextValue {
  isOpen: boolean;
  layoutMode: FunctionRunnerLayout;
  initialFunction: SelectedFunction;
  /** If true, the function should be auto-executed when opened */
  shouldAutoRun: boolean;
}

interface FunctionRunnerContextValue
  extends FunctionRunnerActionsContextValue,
    FunctionRunnerStateContextValue {}

const FunctionRunnerActionsContext =
  createContext<FunctionRunnerActionsContextValue | null>(null);
const FunctionRunnerStateContext =
  createContext<FunctionRunnerStateContextValue | null>(null);

interface FunctionRunnerProviderProps {
  children: ReactNode;
}

export function FunctionRunnerProvider({
  children,
}: FunctionRunnerProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [layoutMode, setLayoutModeState] =
    useState<FunctionRunnerLayout>("side");
  const [initialFunction, setInitialFunction] =
    useState<SelectedFunction>(null);
  const [shouldAutoRun, setShouldAutoRun] = useState(false);

  const toggleFunctionRunner = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const openFunctionRunner = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeFunctionRunner = useCallback(() => {
    setIsOpen(false);
    // Clear initial function and auto-run flag when closing
    setInitialFunction(null);
    setShouldAutoRun(false);
  }, []);

  const setLayoutMode = useCallback((mode: FunctionRunnerLayout) => {
    setLayoutModeState(mode);
  }, []);

  const clearAutoRun = useCallback(() => {
    setShouldAutoRun(false);
  }, []);

  const openWithFunction = useCallback(
    (functionIdentifier: string, autoRun = true) => {
      // We'll set a partial ModuleFunction object with just the identifier
      // The CustomQuerySheet will match it against available functions
      setInitialFunction({
        identifier: functionIdentifier,
        name: functionIdentifier,
        udfType: "query", // Default, will be corrected when matched
      } as any);
      setShouldAutoRun(autoRun);
      setIsOpen(true);
    },
    [],
  );

  const actions = useMemo<FunctionRunnerActionsContextValue>(
    () => ({
      toggleFunctionRunner,
      openFunctionRunner,
      closeFunctionRunner,
      setLayoutMode,
      setInitialFunction,
      openWithFunction,
      clearAutoRun,
    }),
    [
      toggleFunctionRunner,
      openFunctionRunner,
      closeFunctionRunner,
      setLayoutMode,
      openWithFunction,
      clearAutoRun,
    ],
  );

  const state = useMemo<FunctionRunnerStateContextValue>(
    () => ({
      isOpen,
      layoutMode,
      initialFunction,
      shouldAutoRun,
    }),
    [isOpen, layoutMode, initialFunction, shouldAutoRun],
  );

  return (
    <FunctionRunnerActionsContext.Provider value={actions}>
      <FunctionRunnerStateContext.Provider value={state}>
        {children}
      </FunctionRunnerStateContext.Provider>
    </FunctionRunnerActionsContext.Provider>
  );
}

export function useFunctionRunnerActions(): FunctionRunnerActionsContextValue {
  const context = useContext(FunctionRunnerActionsContext);
  if (!context) {
    throw new Error(
      "useFunctionRunnerActions must be used within a FunctionRunnerProvider",
    );
  }
  return context;
}

export function useFunctionRunnerState(): FunctionRunnerStateContextValue {
  const context = useContext(FunctionRunnerStateContext);
  if (!context) {
    throw new Error(
      "useFunctionRunnerState must be used within a FunctionRunnerProvider",
    );
  }
  return context;
}

export function useFunctionRunner(): FunctionRunnerContextValue {
  const actions = useContext(FunctionRunnerActionsContext);
  const state = useContext(FunctionRunnerStateContext);
  if (!actions || !state) {
    throw new Error(
      "useFunctionRunner must be used within a FunctionRunnerProvider",
    );
  }
  return { ...actions, ...state };
}
