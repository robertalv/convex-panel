import { Copy, Check, Gift, MoreVertical, ExternalLink } from "lucide-react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Team } from "convex-panel";

interface WelcomeBannerProps {
  userName?: string;
  team?: Team | null;
}

export function WelcomeBanner({ userName, team }: WelcomeBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const referralCode = team?.referralCode;
  const referralUrl = referralCode
    ? `https://convex.dev/referral/${referralCode}`
    : null;

  const handleCopy = useCallback(async () => {
    if (!referralUrl) return;

    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [referralUrl]);

  const openExternalLink = async (url: string) => {
    if (
      typeof window !== "undefined" &&
      (window as any).__TAURI_INTERNALS__
    ) {
      try {
        const { open } = await import("@tauri-apps/plugin-shell");
        await open(url);
      } catch {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    setMenuOpen(false);
  };

  if (!isVisible) return null;

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border-base bg-gradient-to-r from-surface-raised to-surface-base px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex grow items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-base/10 text-brand-base">
          <Gift className="h-4 w-4" />
        </div>
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
          <span className="text-xs font-medium text-text-base">
            {referralCode ? (
              <>Share link to quintuple your resource limits</>
            ) : (
              <>{userName ? `Welcome back, ${userName}!` : "Welcome to Convex!"} Select a project below.</>
            )}
          </span>

          {referralUrl && (
            <div className="flex items-center gap-0 overflow-hidden rounded-md border border-border-base bg-surface-base/50 transition-colors hover:border-border-muted sm:min-w-[280px]">
              <span className="flex-1 truncate px-2 py-0.5 text-[10px] tabular-nums text-text-muted">
                {referralUrl}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleCopy}
                className="h-6 w-6 shrink-0 rounded-none border-l border-border-base text-text-muted hover:bg-surface-raised hover:text-text-base"
                title={copied ? "Copied!" : "Copy referral link"}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end">
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 text-text-muted hover:bg-surface-raised hover:text-text-base"
              aria-label="Banner actions"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" sideOffset={4} className="w-40 p-1">
            <div className="space-y-0.5">
              {team && (
                <button
                  onClick={() => openExternalLink(`https://dashboard.convex.dev/t/${team.slug}/settings/referrals`)}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[11px] text-text-base transition-colors hover:bg-surface-raised"
                >
                  <span className="flex items-center gap-2">View referrals</span>
                  <ExternalLink className="h-3 w-3 text-text-disabled" />
                </button>
              )}
              <button
                onClick={() => setIsVisible(false)}
                className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-[11px] text-error-base transition-colors hover:bg-error-muted"
              >
                Hide banner
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
