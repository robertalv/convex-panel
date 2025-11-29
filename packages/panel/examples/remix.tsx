import React from "react";
import { ConvexReactClient, ConvexProvider } from "convex/react";
import ConvexPanel from"@convex-panel/panel";

// ConvexPanel auto-detects from CONVEX_URL, CONVEX_DEPLOY_KEY, etc.
const convex = new ConvexReactClient(process.env.CONVEX_URL!);

export default function App() {
  return (
    <ConvexProvider client={convex}>
      <ConvexPanel />
    </ConvexProvider>
  );
}

