import { Github, Check, ExternalLink, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorDisplay } from "../error-display";
import { openExternalLink } from "./utils";
import type { useGitHubOptional } from "../../contexts/github-context";

interface GitHubStepProps {
  github: ReturnType<typeof useGitHubOptional>;
  onNext: () => void;
  onPrev: () => void;
}

export function GitHubStep({ github, onNext, onPrev }: GitHubStepProps) {
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-gray-500/20 to-slate-500/20 flex items-center justify-center">
        <Github size={32} className="text-text-base" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-text-base">
          Connect GitHub
        </h2>
        <p className="text-sm text-text-muted max-w-sm mx-auto">
          Link your GitHub account for schema visualization.
        </p>
      </div>

      {github?.isAuthenticated ? (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="flex items-center gap-3">
            <Check
              size={18}
              className="text-green-500 shrink-0"
            />
            <div className="text-left">
              <p className="text-sm font-medium text-text-base">
                GitHub Connected
              </p>
              <p className="text-xs text-text-muted">
                Signed in as{" "}
                {github.user?.login ||
                  github.user?.name ||
                  "User"}
              </p>
            </div>
          </div>
        </div>
      ) : github?.authStatus === "polling" ||
        github?.authStatus === "awaiting_user" ? (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-brand-base/10 border border-brand-base/30">
            <p className="text-sm text-text-base mb-1">
              Enter this code on GitHub:
            </p>
            <p className="text-xl font-mono font-bold text-brand-base tracking-wider">
              {github.deviceCode?.user_code}
            </p>
          </div>
          <button
            onClick={() =>
              openExternalLink(
                github.deviceCode?.verification_uri ||
                  "https://github.com/login/device",
              )
            }
            className="inline-flex items-center gap-2 text-sm text-brand-base hover:text-brand-hover transition-colors"
          >
            <ExternalLink size={14} />
            Open GitHub to enter code
          </button>
          <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
            <Loader2 size={14} className="animate-spin" />
            Waiting for authorization...
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Button
            variant="secondary"
            onClick={() => github?.startAuth()}
            disabled={github?.isLoading}
            className="w-full"
          >
            <Github size={16} className="mr-2" />
            Connect GitHub Account
          </Button>
          <p className="text-xs text-text-muted">
            Optional - you can connect later in Settings
          </p>
        </div>
      )}

      {github?.error && <ErrorDisplay error={github.error} />}

      <div className="flex gap-3 justify-center pt-2">
        <Button variant="ghost" onClick={onPrev}>
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
        <Button onClick={onNext}>
          {github?.isAuthenticated ? "Continue" : "Skip"}
          <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  );
}
