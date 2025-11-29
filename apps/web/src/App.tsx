import { ConvexReactClient, ConvexProvider } from "convex/react";
import ConvexPanel from "@convex-panel";
import "@convex-panel/styles.css"

// Get Convex URL from environment variables (Vite uses import.meta.env)
// ConvexPanel will auto-detect this, but we need it for ConvexProvider
const convexUrl = import.meta.env.VITE_CONVEX_URL!;
const convex = new ConvexReactClient(convexUrl);

function App() {
  return (
    <ConvexProvider client={convex}>
      <span>Hello World</span>
      {/* ConvexPanel automatically excludes itself in production builds */}
      {/* You can safely leave this in your code - it won't affect production */}
      <ConvexPanel />
    </ConvexProvider>
  );
}

export default App;
