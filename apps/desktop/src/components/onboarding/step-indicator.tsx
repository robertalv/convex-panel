import type { OnboardingStep } from "./utils";
import { ONBOARDING_STEPS } from "./utils";

interface StepIndicatorProps {
  currentStep: OnboardingStep;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentStepIndex = ONBOARDING_STEPS.indexOf(currentStep);

  return (
    <div className="project-onboarding-dialog__steps flex items-center justify-center gap-2 mb-6">
      {ONBOARDING_STEPS.slice(0, -1).map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full transition-colors ${
              i < currentStepIndex
                ? "bg-green-500"
                : i === currentStepIndex
                  ? "bg-brand-base"
                  : "bg-surface-overlay"
            }`}
          />
          {i < ONBOARDING_STEPS.length - 2 && (
            <div
              className={`w-8 h-0.5 transition-colors ${
                i < currentStepIndex
                  ? "bg-green-500"
                  : "bg-surface-overlay"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
