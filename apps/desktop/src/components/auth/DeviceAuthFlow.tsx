import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ExternalLink } from "lucide-react";

interface DeviceAuthFlowProps {
  userCode: string;
  onCancel: () => void;
}

export function DeviceAuthFlow({ userCode, onCancel }: DeviceAuthFlowProps) {
  const codeChars = userCode.split("");

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="text-center space-y-2">
        <div className="flex h-[2rem] items-center gap-2 truncate rounded-full border text-sm font-medium transition-opacity hover:opacity-80 focus-visible:ring-1 focus-visible:ring-border-selected focus-visible:outline-hidden border-green-600 dark:border-green-400 bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-info-text text-sm">
          <ExternalLink className="h-3.5 w-3.5" />
          <span>Browser window opened</span>
        </div>
        <p className="text-sm text-text-muted">
          Complete the sign-in process in your browser, then return here.
        </p>
      </div>

      <div className="relative">
        <div className="absolute inset-0 rounded-xl blur-xl animate-pulse-slow bg-brand-base/20" />

        <div
          className={cn(
            "relative bg-surface-base/80 backdrop-blur-sm",
            "border border-border-base rounded-2xl p-6",
            // "animate-code-glow",
          )}
        >
          <p className="text-xs text-text-subtle text-center mb-3 uppercase tracking-wider font-medium">
            Verification Code
          </p>

          <div className="flex items-center justify-center gap-1.5">
            {codeChars.map((char, index) => (
              <span
                key={index}
                className={cn(
                  "inline-flex items-center justify-center",
                  "w-10 h-12 rounded-lg",
                  "bg-surface-raised border border-border-muted",
                  "text-2xl font-mono font-bold text-primary-foreground",
                  "animate-fade-up",
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: "backwards",
                }}
              >
                {char}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-3 text-text-muted">
          <Spinner size={"sm"} />
          <span className="text-sm">Waiting for authentication...</span>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="w-fit text-text-muted"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default DeviceAuthFlow;
