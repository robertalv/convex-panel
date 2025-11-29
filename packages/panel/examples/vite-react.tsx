import React from "react";
import { ConvexReactClient, ConvexProvider } from "convex/react";
import ConvexPanel from "@convex-panel";

// ConvexPanel auto-detects from VITE_CONVEX_URL, VITE_DEPLOY_KEY, etc.
// Note: Add /// <reference types="vite/client" /> at the top for TypeScript support
const convexUrl = (import.meta as any).env?.VITE_CONVEX_URL || "https://your-deployment.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

function App() {
  return (
    <ConvexProvider client={convex}>
      <ConvexPanel />
    </ConvexProvider>
  );
}

export default App;

