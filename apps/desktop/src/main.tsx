import React from "react";
import ReactDOM from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { panelStyles, injectPanelStyles } from "convex-panel";
import { HashRouter } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { QueryProvider } from "@/contexts/QueryContext";
import { NetworkTestProvider } from "@/contexts/NetworkTestContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import App from "./App";

// Import new Tailwind-based styles
import "./styles/globals.css";

// Keep panel styles for components we reuse from convex-panel
injectPanelStyles(panelStyles);

const convexUrl = import.meta.env.VITE_CONVEX_URL || "";
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryProvider>
      <ThemeProvider>
        <NetworkTestProvider>
          <TooltipProvider>
            <HashRouter>
              {convex ? (
                <ConvexProvider client={convex}>
                  <App convex={convex} />
                </ConvexProvider>
              ) : (
                <App convex={null} />
              )}
            </HashRouter>
          </TooltipProvider>
        </NetworkTestProvider>
      </ThemeProvider>
    </QueryProvider>
  </React.StrictMode>,
);
