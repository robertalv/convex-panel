import {
  Key,
  Check,
  RefreshCw,
  FileText,
  ExternalLink,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepNavigation } from "./step-navigation";
import { ErrorDisplay } from "../error-display";
import { getKeyPreview } from "../../lib/envFile";
import { getDashboardUrl, openExternalLink } from "./utils";
import type { useDeployment } from "../../contexts/deployment-context";

interface DeployKeyStepProps {
  deployment: ReturnType<typeof useDeployment>;
  envLocalKey: string | null;
  envLocalKeyMatchesDeployment: boolean;
  isGeneratingKey: boolean;
  keyError: string | null;
  manualKey: string;
  showManualEntry: boolean;
  teamSlug?: string | null;
  projectSlug?: string | null;
  deploymentName?: string;
  onGenerateKey: () => Promise<void>;
  onUseEnvLocalKey: () => Promise<void>;
  onSaveManualKey: () => Promise<void>;
  onManualKeyChange: (key: string) => void;
  onShowManualEntryChange: (show: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function DeployKeyStep({
  deployment,
  envLocalKey,
  envLocalKeyMatchesDeployment,
  isGeneratingKey,
  keyError,
  manualKey,
  showManualEntry,
  teamSlug,
  projectSlug,
  deploymentName,
  onGenerateKey,
  onUseEnvLocalKey,
  onSaveManualKey,
  onManualKeyChange,
  onShowManualEntryChange,
  onNext,
  onPrev,
}: DeployKeyStepProps) {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-4">
          <Key size={32} className="text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-text-base">
          Deploy Key Setup
        </h2>
        <p className="text-sm text-text-muted max-w-sm mx-auto mt-1">
          Authenticate CLI commands for your deployment.
        </p>
      </div>

      {/* Current key status */}
      {deployment.cliDeployKey && !deployment.cliDeployKeyLoading && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="flex items-center gap-3">
            <Check
              size={18}
              className="text-green-500 shrink-0"
            />
            <div className="text-left min-w-0 flex-1">
              <p className="text-sm font-medium text-text-base">
                Deploy Key Active
              </p>
              <p className="text-xs text-text-muted font-mono truncate">
                {getKeyPreview(deployment.cliDeployKey)}
              </p>
            </div>
          </div>
        </div>
      )}

      {deployment.cliDeployKeyLoading && (
        <div className="p-3 rounded-lg bg-brand-base/10 border border-brand-base/30">
          <div className="flex items-center gap-3">
            <Loader2
              size={18}
              className="text-brand-base animate-spin shrink-0"
            />
            <p className="text-sm text-text-base">
              Generating deploy key...
            </p>
          </div>
        </div>
      )}

      {/* Options when no key */}
      {!deployment.cliDeployKey && !deployment.cliDeployKeyLoading && (
        <div className="space-y-2">
          {/* Use .env.local key - only show if key matches current deployment */}
          {envLocalKey && envLocalKeyMatchesDeployment && (
            <button
              onClick={onUseEnvLocalKey}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-surface-raised/50 border border-border-base hover:bg-surface-overlay transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <FileText size={16} className="text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-base">
                  Use key from .env.local
                </p>
                <p className="text-xs text-text-muted font-mono truncate">
                  {getKeyPreview(envLocalKey)}
                </p>
              </div>
              <ArrowRight
                size={14}
                className="text-text-muted shrink-0"
              />
            </button>
          )}

          {/* Auto-generate */}
          <button
            onClick={onGenerateKey}
            disabled={isGeneratingKey}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-surface-raised/50 border border-border-base hover:bg-surface-overlay transition-colors text-left disabled:opacity-50"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-base/10 flex items-center justify-center shrink-0">
              {isGeneratingKey ? (
                <Loader2
                  size={16}
                  className="text-brand-base animate-spin"
                />
              ) : (
                <RefreshCw
                  size={16}
                  className="text-brand-base"
                />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-base">
                {isGeneratingKey ? "Generating..." : "Generate new key"}
              </p>
              <p className="text-xs text-text-muted">
                Using your OAuth credentials
              </p>
            </div>
            <ArrowRight
              size={14}
              className="text-text-muted shrink-0"
            />
          </button>

          {/* Get from dashboard */}
          <button
            onClick={() => openExternalLink(getDashboardUrl(teamSlug, projectSlug, deploymentName))}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-surface-raised/50 border border-border-base hover:bg-surface-overlay transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
              <ExternalLink
                size={16}
                className="text-purple-500"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-base">
                Get from Dashboard
              </p>
              <p className="text-xs text-text-muted">
                Open Convex Dashboard
              </p>
            </div>
            <ExternalLink
              size={14}
              className="text-text-muted shrink-0"
            />
          </button>

          {/* Manual entry toggle */}
          {!showManualEntry ? (
            <button
              onClick={() => onShowManualEntryChange(true)}
              className="w-full text-sm text-brand-base hover:text-brand-hover transition-colors py-2"
            >
              Enter a key manually
            </button>
          ) : (
            <div className="p-3 rounded-lg bg-surface-raised/50 border border-border-base space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-base">
                  Enter Deploy Key
                </p>
                <button
                  onClick={() => onShowManualEntryChange(false)}
                  className="text-xs text-text-muted hover:text-text-base"
                >
                  Cancel
                </button>
              </div>
              <textarea
                value={manualKey}
                onChange={(e) => {
                  onManualKeyChange(e.target.value);
                }}
                placeholder="prod:my-deployment|ey..."
                className="w-full h-16 px-3 py-2 text-sm font-mono bg-surface-base border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-base resize-none"
              />
              <Button
                onClick={onSaveManualKey}
                disabled={!manualKey.trim()}
                className="w-full"
                size="sm"
              >
                Save Key
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Error display */}
      {(keyError || deployment.cliDeployKeyError) && (
        <ErrorDisplay error={keyError || deployment.cliDeployKeyError || ""} />
      )}

      <StepNavigation
        onNext={onNext}
        onPrev={onPrev}
        nextLabel={deployment.cliDeployKey ? "Continue" : "Skip"}
      />
    </div>
  );
}
