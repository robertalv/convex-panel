import {
  Terminal,
  Database,
  Activity,
  Zap,
  BookOpen,
  Settings,
  Key,
  Code,
  Rocket,
} from "lucide-react";
import type { FrameworkData, MenuCategory } from "./types";
import ReactIcon from "@shared/frameworks/react.svg?raw";
import NextJsIcon from "@shared/frameworks/nextjs.svg?raw";
import TanStackIcon from "@shared/frameworks/tanstack.svg?raw";

export const frameworks: FrameworkData[] = [
  {
    id: "react",
    label: "React",
    icon: ReactIcon,
    install: "npm install convex-panel",
    filename: "src/App.tsx",
    description: "Set up ConvexProvider with ConvexReactClient and add ConvexPanel. Use AppContentWrapper for error boundaries.",
    setup: `import { ConvexProvider, ConvexReactClient } from "convex/react"
import ConvexPanel, { AppContentWrapper } from "convex-panel/react"

const convexUrl = import.meta.env.VITE_CONVEX_URL

if (!convexUrl) {
  throw new Error("VITE_CONVEX_URL is required for Convex Panel to connect.")
}

const convex = new ConvexReactClient(convexUrl)

export default function App() {
  return (
    <ConvexProvider client={convex}>
      {/* App content with error boundary - if this crashes, panel still shows */}
      <AppContentWrapper>
        {/* Your app components */}
      </AppContentWrapper>
      
      {/* Convex Panel - always visible, even if app crashes */}
      <ConvexPanel />
    </ConvexProvider>
  )
}`,
  },
  {
    id: "next",
    label: "Next.js",
    icon: NextJsIcon,
    install: "npm install convex-panel",
    filename: "app/providers.tsx",
    description: "Create a client component provider. Then use it in your layout.tsx: import { ConvexClientProvider } from './providers' and wrap your children.",
    setup: `"use client"

import { ConvexReactClient, ConvexProvider } from "convex/react"
import ConvexPanel from "convex-panel/nextjs"

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export function ConvexClientProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <ConvexProvider client={convex}>
      {children}
      <ConvexPanel />
    </ConvexProvider>
  )
}`,
  },
  {
    id: "tanstack-start",
    label: "TanStack Start",
    icon: TanStackIcon,
    install: "npm install convex-panel",
    filename: "app/router.tsx",
    description: "Set up ConvexProvider and ConvexPanel in your router configuration. TanStack Start is currently in Release Candidate stage.",
    setup: `import { createRouter } from "@tanstack/react-router"
import { QueryClient } from "@tanstack/react-query"
import { routerWithQueryClient } from "@tanstack/react-router-with-query"
import { ConvexQueryClient } from "@convex-dev/react-query"
import { ConvexProvider } from "convex/react"
import ConvexPanel from "convex-panel"
import { routeTree } from "./routeTree.gen"

export function getRouter() {
  const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!

  if (!CONVEX_URL) {
    console.error("missing envar VITE_CONVEX_URL")
  }

  const convexQueryClient = new ConvexQueryClient(CONVEX_URL)

  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
  })

  convexQueryClient.connect(queryClient)

  const router = routerWithQueryClient(
    createRouter({
      routeTree,
      defaultPreload: "intent",
      context: { queryClient },
      scrollRestoration: true,
      Wrap: ({ children }) => (
        <ConvexProvider client={convexQueryClient.convexClient}>
          {children}
          <ConvexPanel />
        </ConvexProvider>
      ),
    }),
    queryClient,
  )

  return router
}`,
  },
];

export const menuStructure: MenuCategory[] = [
  {
    category: "Getting Started",
    items: [
      { id: "quick-start", label: "Quick Start", icon: Rocket },
      { id: "intro", label: "Introduction", icon: BookOpen },
      { id: "installation", label: "Installation", icon: Terminal },
    ],
  },
  {
    category: "Platform",
    items: [
      {
        id: "functions",
        label: "Functions",
        icon: Zap,
        subItems: [
          { id: "queries", label: "Queries" },
          { id: "mutations", label: "Mutations" },
          { id: "actions", label: "Actions" },
        ],
      },
      { id: "data", label: "Data", icon: Database },
      { id: "logs", label: "Logs", icon: Activity },
    ],
  },
  {
    category: "API",
    items: [
      { id: "api-reference", label: "API Reference", icon: Code },
      { id: "configuration", label: "Configuration", icon: Settings },
      { id: "authentication", label: "Authentication", icon: Key },
    ],
  },
];
