import { useState } from "react";
import type { Team } from "@/types/desktop";
import { ROUTES } from "@/lib/constants";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { Icon } from "@/components/ui/icon";
import { Button, IconButton } from "@/components/ui/button";

interface WelcomeBannerProps {
  userName?: string;
  team?: Team | null;
  boostCurrent?: number;
  boostMax?: number;
}

export function WelcomeBanner({
  userName,
  team,
  boostCurrent = 0,
  boostMax = 5,
}: WelcomeBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { copied, copy } = useCopyToClipboard();
  
  const referralCode = team?.referralCode;
  const referralUrl = referralCode ? `${ROUTES.REFERRAL_URL}/${referralCode}` : null;

  const handleCopy = async () => {
    if (!referralUrl) return;
    await copy(referralUrl);
  };

  if (!isVisible) return null;

  if (!referralCode) {
    return (
      <div className="mb-4 flex items-center justify-between rounded-lg bg-surface-base p-6 border border-border-base">
        <div className="flex gap-5 items-start">
          <div className="space-y-1">
            <h3 className="text-lg font-medium text-text-base">
              {userName ? `Welcome back, ${userName}!` : "Welcome to Convex!"}
            </h3>
            <p className="text-text-muted text-sm leading-relaxed">
              Select a project below to get started.
            </p>
          </div>
        </div>
        <IconButton
          icon="close"
          onClick={() => setIsVisible(false)}
          size="sm"
          className="text-text-subtle hover:text-text-muted transition-colors"
        />
      </div>
    );
  }

  const boosts = Array.from({ length: boostMax }, (_, i) => i < boostCurrent);

  return (
    <div className="mb-4 flex flex-row gap-8 items-center justify-between rounded-xl bg-surface-base border border-border-base p-6">
      <div className="flex gap-5 items-start flex-1 min-w-0">
        <div className="space-y-1 min-w-0 flex-1">
          <h3 className="text-lg font-medium text-text-base">
            Referral Program
          </h3>
          <p className="text-text-muted text-sm leading-relaxed max-w-sm">
            Invite friends to increase your limits. <br />
            <span className="text-text-subtle">
              Get up to {boostMax}x boosts for your workspace.
            </span>
          </p>

          <div className="flex items-center gap-2 pt-3">
            <Button
              onClick={handleCopy}
              variant="secondary"
              size="sm"
            >
              {copied ? (
                <Icon name="check" className="w-3 h-3" />
              ) : (
                <Icon name="copy" className="w-3 h-3" />
              )}
              {copied ? "Copied" : "Copy Link"}
            </Button>
            <div className="h-4 w-px bg-surface-overlay mx-1 shrink-0"></div>
            <span className="text-xs font-mono text-text-subtle truncate select-all min-w-0">
              {referralUrl}
            </span>
          </div>
        </div>
      </div>

      <div className="w-auto ml-auto bg-surface-overlay/50 p-4 rounded-xl border border-border-base shrink-0">
        <div className="flex items-center justify-between gap-8 mb-3">
          <span className="text-xs font-medium text-text-subtle uppercase tracking-wider">
            Boost Status
          </span>
          <span className="text-xs text-text-base font-mono">
            {boostCurrent}/{boostMax}
          </span>
        </div>

        {/* Segmented Progress */}
        <div className="flex gap-1.5">
          {boosts.map((isActive, idx) => (
            <div
              key={idx}
              className={`h-2 w-10 rounded transition-all duration-300 ${
                isActive
                  ? "bg-success-base shadow-[0_0_10px_rgba(180,236,146,0.3)]"
                  : "bg-border-base"
              }`}
            />
          ))}
        </div>
        <div className="mt-3 text-[10px] text-text-subtle text-center">
          {boostCurrent === boostMax
            ? "Max boost achieved!"
            : `${boostMax - boostCurrent} more to go`}
        </div>
      </div>
    </div>
  );
}
