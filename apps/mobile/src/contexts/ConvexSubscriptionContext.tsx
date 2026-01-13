/**
 * Convex Subscription Context
 *
 * Provides Convex client for Mobile Pro subscription queries
 */

import React from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

// Initialize Convex client for mobile-subscriptions backend
const convexClient = new ConvexReactClient(
  "https://friendly-wombat-759.convex.cloud",
);

export function ConvexSubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
}
