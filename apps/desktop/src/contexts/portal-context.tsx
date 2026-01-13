import React, { createContext, useContext } from "react";

interface PortalContextValue {
  container: HTMLElement | null;
  ownerDocument: Document | null;
}

const PortalContext = createContext<PortalContextValue | undefined>(undefined);

interface PortalProviderProps {
  children: React.ReactNode;
  container?: HTMLElement | null;
}

/**
 * Portal Provider
 * Provides a portal target for dropdowns and modals
 */
export function PortalProvider({ children, container }: PortalProviderProps) {
  const value: PortalContextValue = {
    container: container ?? null,
    ownerDocument: typeof document !== "undefined" ? document : null,
  };

  return (
    <PortalContext.Provider value={value}>{children}</PortalContext.Provider>
  );
}

/**
 * Use Portal Environment
 * Returns the portal environment (container and document)
 */
export function usePortalEnvironment(): PortalContextValue {
  const context = useContext(PortalContext);
  if (context === undefined) {
    return {
      container: null,
      ownerDocument: typeof document !== "undefined" ? document : null,
    };
  }
  return context;
}

/**
 * Get the portal target (where to render portals)
 */
export function usePortalTarget(): HTMLElement | null {
  const { container, ownerDocument } = usePortalEnvironment();
  return container ?? ownerDocument?.body ?? null;
}

/**
 * Get the portal container
 */
export function usePortalContainer(): HTMLElement | null {
  const { container } = usePortalEnvironment();
  return container;
}
