import { ConvexReactClient, ConvexProvider } from "convex/react";
import ConvexPanel from "convex-panel";

// Get Convex URL from environment variables (Vite uses import.meta.env)
// ConvexPanel will auto-detect this, but we need it for ConvexProvider
const convexUrl = import.meta.env.VITE_CONVEX_URL || "https://polished-sockeye-52.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

function App() {
  return (
    <ConvexProvider client={convex}>
        <ConvexPanel />
    </ConvexProvider>
  );
}

export default App;

