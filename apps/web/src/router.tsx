import React, { Suspense } from "react";
import {
  RootRoute,
  Route,
  Router,
  RouterProvider,
  Outlet,
} from "@tanstack/react-router";

import { StartPage } from "./components/startpage";
import { Header } from "./components/header";
import { DocsPage } from "./components/docs-page";
import { ChangelogPage } from "./components/changelog-page";

const RootLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-background-primary text-content-primary antialiased overflow-hidden">
    <Header />
    {children}
  </div>
);

// Home page (marketing + embedded ConvexPanel)
const HomePage: React.FC = () => {
  return (
    <main className="px-6 md:px-12 lg:px-36 overflow-hidden md:overflow-visible">
      <StartPage />
    </main>
  );
};

const DocsRouteComponent: React.FC = () => <DocsPage />;

const ChangelogRouteComponent: React.FC = () => <ChangelogPage />;

// Build the TanStack router route tree
const rootRoute = new RootRoute({
  component: () => (
    <RootLayout>
      <Suspense fallback={null}>
        <Outlet />
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
  component: DocsRouteComponent,
});

const changelogRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/changelog",
  component: ChangelogRouteComponent,
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


