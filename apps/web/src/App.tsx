import { ConvexReactClient, ConvexProvider } from "convex/react";
import ConvexPanel from"convex-panel";
import "convex-panel/styles.css"

const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl) {
  throw new Error("VITE_CONVEX_URL is required for Convex Panel to connect.");
}

const convex = new ConvexReactClient(convexUrl);

export default function App() {
  useEffect(() => {
    document.documentElement.lang = "en";
    document.documentElement.classList.add("dark");

    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  return (
    <ConvexProvider client={convex}>
      <AppRouterProvider />
      <Analytics />
    </ConvexProvider>
  );
}