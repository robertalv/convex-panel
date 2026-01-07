export type PlanType =
  | "CONVEX_BASE"
  | "CONVEX_STARTER_PLUS"
  | "CONVEX_PROFESSIONAL"
  | "CONVEX_BUSINESS"
  | string;

export interface SubscriptionPlan {
  id: string;
  name: string;
  planType: PlanType | null;
  description?: string;
  status?: string;
}

export interface TeamSubscription {
  plan: SubscriptionPlan;
}