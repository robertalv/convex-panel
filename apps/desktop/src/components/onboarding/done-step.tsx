import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getKeyPreview } from "../../lib/envFile";
import type { useGitHubOptional } from "../../contexts/github-context";
import type { useDeployment } from "../../contexts/deployment-context";

interface DoneStepProps {
  selectedPath: string | null;
  github: ReturnType<typeof useGitHubOptional>;
  deployment: ReturnType<typeof useDeployment>;
  onComplete: () => void;
}

export function DoneStep({
  selectedPath,
  github,
  deployment,
  onComplete,
}: DoneStepProps) {
  return (
    <div className="text-center space-y-5">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
        <Check size={32} className="text-green-500" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-text-base">
          You're All Set!
        </h2>
        <p className="text-sm text-text-muted max-w-sm mx-auto">
          Your project is configured and ready.
        </p>
      </div>

      {/* Summary */}
      <div className="space-y-2 text-left">
        {selectedPath && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-raised/50 border border-border-base">
            <Check
              size={16}
              className="text-green-500 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-base">
                Project Folder
              </p>
              <p className="text-xs text-text-muted font-mono truncate">
                {selectedPath}
              </p>
            </div>
          </div>
        )}
        {github?.isAuthenticated && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-raised/50 border border-border-base">
            <Check
              size={16}
              className="text-green-500 shrink-0"
            />
            <div>
              <p className="text-sm font-medium text-text-base">
                GitHub Connected
              </p>
              <p className="text-xs text-text-muted">
                {github.user?.login || "Connected"}
              </p>
            </div>
          </div>
        )}
        {deployment.cliDeployKey && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-raised/50 border border-border-base">
            <Check
              size={16}
              className="text-green-500 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-base">
                Deploy Key Active
              </p>
              <p className="text-xs text-text-muted font-mono truncate">
                {getKeyPreview(deployment.cliDeployKey)}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-center pt-2">
        <Button onClick={onComplete}>
          <Check size={16} className="mr-2" />
          Done
        </Button>
      </div>
    </div>
  );
}
