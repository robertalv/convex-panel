// Icons available for future use: Crown, Sparkles, Zap from "lucide-react"

type PlanType =
  | "CONVEX_BASE"
  | "CONVEX_STARTER_PLUS"
  | "CONVEX_PROFESSIONAL"
  | "CONVEX_BUSINESS"
  | string
  | null;

export interface TeamSubscription {
  plan: {
    planType: PlanType;
    name?: string;
  };
}

export function getPlanInfo(planType: PlanType): {
  label: string;
  icon: React.ReactNode;
  className: string;
} {
  switch (planType) {
    case "CONVEX_STARTER_PLUS":
      return {
        label: "Starter",
        icon: null,
        className: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      };
    case "CONVEX_PROFESSIONAL":
      return {
        label: "Pro",
        icon: null,
        className: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      };
    case "CONVEX_BUSINESS":
      return {
        label: "Business",
        icon: null,
        className: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      };
    case "CONVEX_BASE":
    default:
      return {
        label: "Free",
        icon: null,
        className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
      };
  }
}
