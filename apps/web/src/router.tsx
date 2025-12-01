import React, { Suspense } from "react";
import {
  RootRoute,
  Route,
  Router,
  RouterProvider,
  Outlet,
} from "@tanstack/react-router";
import HeroSection from "./components/hero-section";
import ContentSection from "./components/content-2";
import DemoSection from "./components/demo-section";
import StatsSection from "./components/stats";
import CallToAction from "./components/call-to-action";
import FooterSection from "./components/footer";
import DocsPage from "./components/docs-page";
import ChangelogPage from "./components/changelog-page";
import { Button } from "./components/ui/button";
import ConvexPanel from "convex-panel";

// Root layout shared by all routes
const RootLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {children}
    </div>
  );
};

// Home page (marketing + embedded ConvexPanel)
const HomePage: React.FC = () => {
  return (
    <>
      <HeroSection />
      <ContentSection />
      <DemoSection />
      <StatsSection />
      <CallToAction />
      <FooterSection />

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
    </>
  );
};

// Build the TanStack router route tree
const rootRoute = new RootRoute({
  component: () => (
    <RootLayout>
      <Suspense fallback={null}>
        <Outlet />
        <ConvexPanel forceDisplay={true} />
      </Suspense>
    </RootLayout>
  ),
});

const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const docsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/docs",
  component: DocsPage,
});

const changelogRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/changelog",
  component: ChangelogPage,
});

const routeTree = rootRoute.addChildren([indexRoute, docsRoute, changelogRoute]);

export const router = new Router({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export const AppRouterProvider: React.FC = () => {
  return <RouterProvider router={router} />;
};


