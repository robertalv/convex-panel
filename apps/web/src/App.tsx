import { ConvexReactClient, ConvexProvider } from "convex/react";
// import ConvexPanel from "@convex-panel/panel";
import TodoApp from "./TodoApp";

// Get Convex URL from environment variables (Vite uses import.meta.env)
// ConvexPanel will auto-detect this, but we need it for ConvexProvider
const convexUrl = import.meta.env.VITE_CONVEX_URL || "https://polished-sockeye-52.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

function App() {
  return (
    <ConvexProvider client={convex}>
      <TodoApp />
        {/* <ConvexPanel /> */}
    </ConvexProvider>
  );
}

export default App;
