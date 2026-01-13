import { Code2, Key, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepNavigation } from "./step-navigation";

interface WelcomeStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export function WelcomeStep({ onNext, onSkip }: WelcomeStepProps) {
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-base/20 to-purple-500/20 flex items-center justify-center">
        <Code2 size={32} className="text-brand-base" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-text-base">
          Connect Your Project
        </h2>
        <p className="text-sm text-text-muted max-w-sm mx-auto">
          Link your project folder to unlock powerful features.
        </p>
      </div>

      <div className="space-y-2 text-left">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-raised/50 border border-border-base">
          <div>
            <p className="text-sm font-medium text-text-base">
              Integrated Terminal
            </p>
            <p className="text-xs text-text-muted">
              Run Convex CLI with auto-configured credentials
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-raised/50 border border-border-base">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
            <Key size={16} className="text-green-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-base">
              Deploy Key Sync
            </p>
            <p className="text-xs text-text-muted">
              Auto-sync with your project's .env.local
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-raised/50 border border-border-base">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
            <Code2 size={16} className="text-purple-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-base">
              Cursor MCP
            </p>
            <p className="text-xs text-text-muted">
              Let Cursor AI interact with your backend
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-center pt-2">
        <Button
          variant="ghost"
          onClick={onSkip}
          className="text-text-muted"
        >
          Skip for now
        </Button>
        <Button onClick={onNext}>
          Get Started
          <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  );
}
