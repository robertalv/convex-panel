import { Suspense, useEffect } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Analytics } from "@vercel/analytics/react";
import CallToAction from "./components/call-to-action";
import ContentSection from "./components/content-2";
import FooterSection from "./components/footer";
import HeroSection from "./components/hero-section";
import StatsSection from "./components/stats";
import { Button } from "./components/ui/button";
import ConvexPanel from "convex-panel";

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
      <div className="min-h-screen bg-background text-foreground antialiased">
        <HeroSection />
        <ContentSection />
        <StatsSection />
        <CallToAction />
        <FooterSection />

        <Suspense fallback={null}>
          <div className="hidden md:block">
            <ConvexPanel buttonPosition="bottom-right" />
          </div>
        </Suspense>

        <div className="try-me-container">
          <Button
            asChild
            size="lg"
            className="rounded-xl px-5 text-base font-mono flex items-center cursor-default"
            disabled
          >
            <div className="flex items-center gap-2">
              <span className="relative">
                <span className="transition-all duration-200">try me!</span>
              </span>
            </div>
          </Button>
        </div>
      </div>

      <Analytics />
    </ConvexProvider>
  );
}
