"use client";

import React from "react";
import { ConvexReactClient, ConvexProvider } from "convex/react";
import ConvexPanel from "convex-panel/nextjs";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  console.warn(
    "NEXT_PUBLIC_CONVEX_URL is not set. Convex Panel will not be able to connect."
  );
}

const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function ConvexProviderWrapper({ 
  children,
}: { 
  children: React.ReactNode;
}) {
  if (!convex) {
    return <>{children}</>;
  }

  return (
    <ConvexProvider client={convex}>
      {children}
      <ConvexPanel />
    </ConvexProvider>
  );
}

export { ConvexProviderWrapper as ConvexProvider };

