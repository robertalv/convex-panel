import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { isTauri } from "@/utils/desktop";
import { ProjectOnboardingDialog } from "@/components/project-onboarding-dialog";

export interface OnboardingState {
  isOpen: boolean;
  deploymentName: string | null;
  teamSlug: string | null;
  projectSlug: string | null;
}

interface OnboardingContextValue {
  state: OnboardingState;
  openOnboarding: (
    deploymentName?: string,
    teamSlug?: string | null,
    projectSlug?: string | null,
  ) => void;
  closeOnboarding: () => void;
  completeOnboarding: () => void;
  updateDeployment: (
    deploymentName?: string,
    teamSlug?: string | null,
    projectSlug?: string | null,
  ) => void;
}

const OnboardingContext = createContext<
  OnboardingContextValue | undefined
>(undefined);

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({
  children,
}: OnboardingProviderProps) {
  const [state, setState] = useState<OnboardingState>({
    isOpen: false,
    deploymentName: null,
    teamSlug: null,
    projectSlug: null,
  });
  const [hasChecked, setHasChecked] = useState(false);

  const getDismissedKey = useCallback((deploymentName: string | null) => {
    if (!deploymentName) return null;
    return `convex-panel-enhanced-onboarding-dismissed-${deploymentName}`;
  }, []);

  const isDismissed = useCallback(
    (deploymentName: string | null) => {
      if (!deploymentName) return false;
      const dismissedKey = getDismissedKey(deploymentName);
      if (!dismissedKey) return false;
      return Boolean(localStorage.getItem(dismissedKey));
    },
    [getDismissedKey],
  );

  const markAsDismissed = useCallback(
    (deploymentName: string | null) => {
      if (!deploymentName) return;
      const dismissedKey = getDismissedKey(deploymentName);
      if (dismissedKey) {
        localStorage.setItem(dismissedKey, "true");
      }
    },
    [getDismissedKey],
  );

  useEffect(() => {
    if (!state.deploymentName || hasChecked) return;

    const wasDismissed = isDismissed(state.deploymentName);

    if (!wasDismissed && isTauri()) {
      setState((prev) => ({ ...prev, isOpen: true }));
    }

    setHasChecked(true);
  }, [state.deploymentName, hasChecked, isDismissed]);

  useEffect(() => {
    setHasChecked(false);
  }, [state.deploymentName]);

  const openOnboarding = useCallback(
    (
      deploymentName?: string,
      teamSlug?: string | null,
      projectSlug?: string | null,
    ) => {
      setState({
        isOpen: true,
        deploymentName: deploymentName || null,
        teamSlug: teamSlug ?? null,
        projectSlug: projectSlug ?? null,
      });
    },
    [],
  );

  const closeOnboarding = useCallback(() => {
    if (state.deploymentName) {
      markAsDismissed(state.deploymentName);
    }
    setState((prev) => ({ ...prev, isOpen: false }));
  }, [state.deploymentName, markAsDismissed]);

  const completeOnboarding = useCallback(() => {
    if (state.deploymentName) {
      markAsDismissed(state.deploymentName);
    }
    setState((prev) => ({ ...prev, isOpen: false }));
  }, [state.deploymentName, markAsDismissed]);

  const updateDeployment = useCallback(
    (
      deploymentName?: string,
      teamSlug?: string | null,
      projectSlug?: string | null,
    ) => {
      setState((prev) => ({
        ...prev,
        deploymentName: deploymentName || null,
        teamSlug: teamSlug ?? null,
        projectSlug: projectSlug ?? null,
      }));
    },
    [],
  );

  const value: OnboardingContextValue = {
    state,
    openOnboarding,
    closeOnboarding,
    completeOnboarding,
    updateDeployment,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      <ProjectOnboardingDialog
        isOpen={state.isOpen}
        onClose={closeOnboarding}
        onComplete={completeOnboarding}
        deploymentName={state.deploymentName || undefined}
        teamSlug={state.teamSlug}
        projectSlug={state.projectSlug}
      />
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error(
      "useOnboarding must be used within an OnboardingProvider",
    );
  }
  return context;
}

export function useOnboardingSafe() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    return {
      state: {
        isOpen: false,
        deploymentName: null,
        teamSlug: null,
        projectSlug: null,
      },
      openOnboarding: () => {},
      closeOnboarding: () => {},
      completeOnboarding: () => {},
      updateDeployment: () => {},
    };
  }
  return context;
}

export function useOnboardingActions() {
  const { openOnboarding, closeOnboarding, completeOnboarding, updateDeployment } =
    useOnboarding();

  return {
    openOnboarding,
    closeOnboarding,
    completeOnboarding,
    updateDeployment,
  };
}

export function useOnboardingState() {
  const { state } = useOnboarding();
  return state;
}
