import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import ConvexPanel from './ConvexPanel';
import type { ConvexPanelProps } from './ConvexPanel';
import { panelStyles } from './styles/runtime';

/**
 * Shadow DOM wrapper for ConvexPanel that provides complete style isolation
 *
 * Styles inside Shadow DOM cannot leak out, and parent app styles cannot affect the panel.
 * This is the recommended wrapper for maximum isolation.
 */
export const ConvexPanelShadow = (props: ConvexPanelProps) => {
  const shadowHostRef = useRef<HTMLDivElement>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);
  const reactRootRef = useRef<Root | null>(null);
  const propsRef = useRef<ConvexPanelProps>(props);
  const mountIdRef = useRef(0);
  const portalContainerRef = useRef<HTMLElement | null>(null);

  propsRef.current = props;

  useEffect(() => {
    const currentMountId = ++mountIdRef.current;
    if (typeof window === 'undefined' || !shadowHostRef.current) {
      return;
    }

    let shadowRoot = shadowRootRef.current;

    // If a shadow root already exists on the host (e.g. due to React StrictMode
    // double-invoking effects in development), reuse it instead of trying to
    // attach a new one which would throw.
    if (!shadowRoot && shadowHostRef.current.shadowRoot) {
      shadowRoot = shadowHostRef.current.shadowRoot;
      shadowRootRef.current = shadowRoot;
    }

    // Create shadow root if it doesn't exist yet
    if (!shadowRoot) {
      shadowRoot = shadowHostRef.current.attachShadow({ mode: 'open' });
      shadowRootRef.current = shadowRoot;

      // Inject CSS styles into shadow DOM first
      const styleElement = document.createElement('style');
      styleElement.textContent = panelStyles;
      shadowRoot.appendChild(styleElement);

      // Create container for React app
      const container = document.createElement('div');
      container.id = 'convex-panel-shadow-container';
      shadowRoot.appendChild(container);

      // Create portal container for overlays
      const existingPortalContainer = shadowRoot.getElementById('convex-panel-portal-root');
      const portalContainer = existingPortalContainer || document.createElement('div');
      portalContainer.id = 'convex-panel-portal-root';
      portalContainer.style.position = 'fixed';
      portalContainer.style.inset = '0px';
      portalContainer.style.pointerEvents = 'none';
      portalContainer.style.zIndex = '100000';
      portalContainer.style.display = 'contents';
      if (!existingPortalContainer) {
        shadowRoot.appendChild(portalContainer);
      }
      portalContainerRef.current = portalContainer as HTMLElement;

      // Create React root
      reactRootRef.current = createRoot(container);
    } else if (!reactRootRef.current) {
      // If the shadow root exists but the React root was unmounted (e.g. from a
      // previous StrictMode cleanup), recreate the React root on the existing container.
      const container = shadowRoot.getElementById('convex-panel-shadow-container');
      if (container) {
        reactRootRef.current = createRoot(container);
      }
    }

    // Render/update ConvexPanel with current props
    if (shadowRoot) {
      const existingPortalContainer = shadowRoot.getElementById('convex-panel-portal-root');
      if (existingPortalContainer) {
        portalContainerRef.current = existingPortalContainer as HTMLElement;
      } else if (!portalContainerRef.current) {
        const portalContainer = document.createElement('div');
        portalContainer.id = 'convex-panel-portal-root';
        portalContainer.style.position = 'fixed';
        portalContainer.style.inset = '0px';
        portalContainer.style.pointerEvents = 'none';
        portalContainer.style.zIndex = '100000';
        portalContainer.style.display = 'contents';
        shadowRoot.appendChild(portalContainer);
        portalContainerRef.current = portalContainer;
      }
    }

    if (reactRootRef.current) {
      reactRootRef.current.render(
        <ConvexPanel
          {...propsRef.current}
          portalContainer={propsRef.current.portalContainer ?? portalContainerRef.current}
        />
      );
    }

    // Cleanup on unmount
    return () => {
      const root = reactRootRef.current;
      if (root) {
        // Defer unmounting to avoid React DevTools warning:
        // "Attempted to synchronously unmount a root while React was already rendering"
        // This can happen in StrictMode when effects are double-invoked.
        setTimeout(() => {
          // Only unmount if this cleanup is from the current mount instance.
          // This prevents a stale cleanup (from StrictMode's first mount) from
          // unmounting the root created by a subsequent re-mount.
          if (mountIdRef.current === currentMountId) {
            root.unmount();
            reactRootRef.current = null;
          }
        }, 0);
      }
    };
  }, []); // Only run once on mount

  // Update React root when props change (using a separate effect to avoid recreating shadow root)
  useEffect(() => {
    propsRef.current = props;
    if (reactRootRef.current) {
      reactRootRef.current.render(
        <ConvexPanel
          {...props}
          portalContainer={props.portalContainer ?? portalContainerRef.current}
        />
      );
    }
  }); // Run on every render to update props

  return (
    <div
      ref={shadowHostRef}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        // Let clicks pass through the host by default; actual panel/backdrop inside
        // the shadow root uses pointer-events:auto so it still captures interactions.
        pointerEvents: 'none',
        width: '100%',
        height: '100%',
        contain: 'layout style paint',
        isolation: 'isolate',
      }}
    />
  );
};

export default ConvexPanelShadow;

