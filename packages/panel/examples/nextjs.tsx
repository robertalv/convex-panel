"use client";

import React, { useEffect, useState } from "react";
import { ConvexReactClient, ConvexProvider } from "convex/react";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues
const ConvexPanel = dynamic(() => import("@convex-panel"), { ssr: false });

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ConvexProvider client={convex}>
      {children}
      {mounted && <ConvexPanel />}
    </ConvexProvider>
  );
}

