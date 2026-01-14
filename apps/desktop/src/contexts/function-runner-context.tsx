import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

/** Layout mode for the Function Runner */
export type FunctionRunnerLayout = "side" | "bottom" | "fullscreen";

interface FunctionRunnerActionsContextValue {
  toggleFunctionRunner: () => void;
  openFunctionRunner: () => void;
  closeFunctionRunner: () => void;
  setLayoutMode: (mode: FunctionRunnerLayout) => void;
}

interface FunctionRunnerStateContextValue {
  isOpen: boolean;
  layoutMode: FunctionRunnerLayout;
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

  const toggleFunctionRunner = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const openFunctionRunner = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeFunctionRunner = useCallback(() => {
    setIsOpen(false);
  }, []);

  const setLayoutMode = useCallback((mode: FunctionRunnerLayout) => {
    setLayoutModeState(mode);
  }, []);

  const actions = useMemo<FunctionRunnerActionsContextValue>(
    () => ({
      toggleFunctionRunner,
      openFunctionRunner,
      closeFunctionRunner,
      setLayoutMode,
    }),
    [
      toggleFunctionRunner,
      openFunctionRunner,
      closeFunctionRunner,
      setLayoutMode,
    ],
  );

  const state = useMemo<FunctionRunnerStateContextValue>(
    () => ({
      isOpen,
      layoutMode,
    }),
    [isOpen, layoutMode],
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
