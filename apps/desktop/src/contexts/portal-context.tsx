import { createContext, useContext } from 'react';

export type PortalContainer = Element | DocumentFragment | null;

export interface PortalEnvironment {
  container: PortalContainer;
  ownerDocument: Document | null;
}

const PortalContext = createContext<PortalContainer>(null);

export const PortalProvider = PortalContext.Provider;

const getFallbackDocument = () =>
  (typeof document !== 'undefined' ? document : null);

const getFallbackContainer = () => getFallbackDocument()?.body ?? null;

export const usePortalEnvironment = (): PortalEnvironment => {
  const contextContainer = useContext(PortalContext);
  const fallbackDocument = getFallbackDocument();
  const container = contextContainer ?? getFallbackContainer();
  const ownerDocument =
    (contextContainer as (Element | DocumentFragment) | null)?.ownerDocument ??
    fallbackDocument;

  return {
    container,
    ownerDocument,
  };
};

export const usePortalContainer = () => {
  const { container } = usePortalEnvironment();
  return container;
};

export const usePortalTarget = () => {
  const { container, ownerDocument } = usePortalEnvironment();
  return container ?? ownerDocument?.body ?? null;
};
