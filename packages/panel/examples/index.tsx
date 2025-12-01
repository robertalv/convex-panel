import React from "react";
import { ConvexReactClient, ConvexProvider } from "convex/react";
import ConvexPanel from "convex-panel";

// ConvexPanel auto-detects configuration from environment variables
// Just provide the Convex client if you have one
const getConvexUrl = () => {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CONVEX_URL) {
    return process.env.NEXT_PUBLIC_CONVEX_URL;
  }
  if (typeof window !== 'undefined' && (window as any).__CONVEX_URL__) {
    return (window as any).__CONVEX_URL__;
  }
  return "https://your-deployment.convex.cloud";
};

const convex = new ConvexReactClient(getConvexUrl());

function App() {
  return (
    <ConvexProvider client={convex}>
      <ConvexPanel />
    </ConvexProvider>
  );
}

export default App;

