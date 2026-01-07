import { cn } from "@/lib/utils";
import { getPlanInfo } from "./getPlanInfo";
import type { TeamSubscription } from "@/api/bigbrain";

/**
 * Tier badge component showing the team's subscription plan
 */
export function TierBadge({
    subscription,
  }: {
    subscription: TeamSubscription | null;
  }) {
    // null subscription means free plan
    const planType = subscription?.plan?.planType ?? "CONVEX_BASE";
    const { label, icon, className } = getPlanInfo(planType);
  
    return (
      <div
        className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-xs font-medium",
          "border transition-colors",
          className,
        )}
      >
        {icon}
        <span>{label}</span>
      </div>
    );
  }