import { useOnboardingDialog } from "../hooks/useOnboardingDialog";
import { GradientBackground } from "./gradient-background";
import { ConvexLettering } from "@/components/svg/convex-lettering";
import {
  WelcomeStep,
  FolderStep,
  GitHubStep,
  DeployKeyStep,
  DoneStep,
  StepIndicator,
} from "./onboarding";

interface ProjectOnboardingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  deploymentName?: string;
  teamSlug?: string | null;
  projectSlug?: string | null;
}

export function ProjectOnboardingDialog({
  isOpen,
  onClose,
  onComplete,
  deploymentName,
  teamSlug,
  projectSlug,
}: ProjectOnboardingDialogProps) {
  const {
    step,
    nextStep,
    prevStep,
    selectedPath,
    handleSelectDirectory,
    envLocalKey,
    envLocalKeyMatchesDeployment,
    isGeneratingKey,
    keyError,
    manualKey,
    showManualEntry,
    setManualKey,
    setShowManualEntry,
    handleGenerateKey,
    handleUseEnvLocalKey,
    handleSaveManualKey,
    handleComplete,
    handleSkip,
    github,
    deployment,
  } = useOnboardingDialog({
    isOpen,
    onClose,
    onComplete,
    deploymentName,
  });

  if (!isOpen) return null;

  return (
    <div
      className="project-onboarding-dialog fixed inset-0 z-50 flex items-center justify-center"
      data-project-scope="onboarding"
      data-deployment-name={deploymentName || undefined}
    >
      {/* Backdrop */}
      <div
        className="project-onboarding-dialog__backdrop absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Dialog */}
      <div
        className="project-onboarding-dialog__content relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden shadow-2xl border border-border-base"
        onClick={(e) => e.stopPropagation()}
      >
        <GradientBackground className="!min-h-0">
          <div className="p-6">
            {/* Convex Logo at the top */}
            <div className="flex justify-center mb-4">
              <ConvexLettering className="h-6" />
            </div>

            {/* Main card */}
            <div
              className="project-onboarding-dialog__card animate-fade-up"
              style={{ animationDelay: "100ms" }}
            >
              {/* Step indicators */}
              <StepIndicator currentStep={step} />

              {/* Content */}
              <div className="project-onboarding-dialog__content-inner overflow-y-auto max-h-[600px] max-w-[960px]">
                {step === "welcome" && (
                  <WelcomeStep onNext={nextStep} onSkip={handleSkip} />
                )}

                {step === "folder" && (
                  <FolderStep
                    selectedPath={selectedPath}
                    onSelectDirectory={handleSelectDirectory}
                    onNext={nextStep}
                    onPrev={prevStep}
                  />
                )}

                {step === "github" && (
                  <GitHubStep
                    github={github}
                    onNext={nextStep}
                    onPrev={prevStep}
                  />
                )}

                {step === "deploy-key" && (
                  <DeployKeyStep
                    deployment={deployment}
                    envLocalKey={envLocalKey}
                    envLocalKeyMatchesDeployment={envLocalKeyMatchesDeployment}
                    isGeneratingKey={isGeneratingKey}
                    keyError={keyError}
                    manualKey={manualKey}
                    showManualEntry={showManualEntry}
                    teamSlug={teamSlug}
                    projectSlug={projectSlug}
                    deploymentName={deploymentName}
                    onGenerateKey={handleGenerateKey}
                    onUseEnvLocalKey={handleUseEnvLocalKey}
                    onSaveManualKey={handleSaveManualKey}
                    onManualKeyChange={setManualKey}
                    onShowManualEntryChange={setShowManualEntry}
                    onNext={nextStep}
                    onPrev={prevStep}
                  />
                )}

                {step === "done" && (
                  <DoneStep
                    selectedPath={selectedPath}
                    github={github}
                    deployment={deployment}
                    onComplete={handleComplete}
                  />
                )}
              </div>

              {/* Skip link at the bottom */}
              <div className="mt-4 text-center">
                <button
                  onClick={handleSkip}
                  className="text-xs text-text-disabled hover:text-text-muted transition-colors cursor-pointer"
                >
                  Skip setup
                </button>
              </div>
            </div>
          </div>
        </GradientBackground>
      </div>
    </div>
  );
}

export default ProjectOnboardingDialog;
