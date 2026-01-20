export type PlanType =
  | "CONVEX_BASE"
  | "CONVEX_STARTER_PLUS"
  | "CONVEX_PROFESSIONAL"
  | "CONVEX_BUSINESS"
  | string
  | null;

export interface PlanInfo {
  label: string;
  colorScheme: {
    background: string;
    text: string;
    border: string;
  };
}

export function getPlanInfo(planType: PlanType): PlanInfo {
  switch (planType) {
    case "CONVEX_STARTER_PLUS":
      return {
        label: "Starter",
        colorScheme: {
          background: "rgba(59, 130, 246, 0.1)",
          text: "#60a5fa",
          border: "rgba(59, 130, 246, 0.3)",
        },
      };
    case "CONVEX_PROFESSIONAL":
      return {
        label: "Pro",
        colorScheme: {
          background: "rgba(245, 158, 11, 0.1)",
          text: "#fbbf24",
          border: "rgba(245, 158, 11, 0.3)",
        },
      };
    case "CONVEX_BUSINESS":
      return {
        label: "Business",
        colorScheme: {
          background: "rgba(168, 85, 247, 0.1)",
          text: "#c084fc",
          border: "rgba(168, 85, 247, 0.3)",
        },
      };
    case "CONVEX_BASE":
    default:
      return {
        label: "Free",
        colorScheme: {
          background: "rgba(113, 113, 122, 0.1)",
          text: "#a1a1aa",
          border: "rgba(113, 113, 122, 0.3)",
        },
      };
  }
}

export const isFreePlan = (planType: PlanType) => planType === "CONVEX_BASE";

export const planNameMap: Record<string, string> = {
  CONVEX_BASE: "Free",
  CONVEX_STARTER_PLUS: "Starter",
  CONVEX_PROFESSIONAL: "Professional",
  CONVEX_BUSINESS: "Business",
};
