import { useEffect } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Analytics } from "@vercel/analytics/react";
import { AppRouterProvider } from "./router";

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