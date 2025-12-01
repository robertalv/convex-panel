import React, { useEffect, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import ConvexPanel, { ConvexPanelProps } from './ConvexPanel';
import { panelStyles } from './styles/runtime';

/**
 * Shadow DOM wrapper for ConvexPanel that provides complete style isolation
 * 
 * Styles inside Shadow DOM cannot leak out, and parent app styles cannot affect the panel.
 * This is the recommended wrapper for maximum isolation.
 */
export const ConvexPanelShadow: React.FC<ConvexPanelProps> = (props) => {
  const shadowHostRef = useRef<HTMLDivElement>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);
  const reactRootRef = useRef<Root | null>(null);
  const propsRef = useRef<ConvexPanelProps>(props);

  // Keep props ref updated
  propsRef.current = props;

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined' || !shadowHostRef.current) {
      return;
    }

    let shadowRoot = shadowRootRef.current;

    // Create shadow root if it doesn't exist
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

      // Create React root and render ConvexPanel
      reactRootRef.current = createRoot(container);
    }

    // Render/update ConvexPanel with current props
    if (reactRootRef.current) {
      reactRootRef.current.render(<ConvexPanel {...propsRef.current} />);
    }

    // Cleanup on unmount
    return () => {
      if (reactRootRef.current) {
        reactRootRef.current.unmount();
        reactRootRef.current = null;
        shadowRootRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // Update React root when props change (using a separate effect to avoid recreating shadow root)
  useEffect(() => {
    if (reactRootRef.current) {
      reactRootRef.current.render(<ConvexPanel {...props} />);
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
        pointerEvents: 'none', // Allow clicks to pass through to parent app
        width: '100%',
        height: '100%',
        contain: 'layout style paint',
        isolation: 'isolate',
      }}
    />
  );
};

export default ConvexPanelShadow;

