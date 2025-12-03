import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { usePortalEnvironment } from '../contexts/portal-context';

export function AskAI() {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const shadowRootRef = useRef<ShadowRoot | Document | null>(null);
  const { ownerDocument } = usePortalEnvironment();
  const resolvedDocument = ownerDocument ?? (typeof document !== 'undefined' ? document : null);

  // Helper function to get the shadow root or document
  const getRoot = useCallback(() => {
    if (shadowRootRef.current) {
      return shadowRootRef.current;
    }

    if (buttonRef.current) {
      const root = buttonRef.current.getRootNode();
      if (root instanceof ShadowRoot) {
        shadowRootRef.current = root;
        return root;
      } else if (root instanceof Document) {
        shadowRootRef.current = root;
        return root;
      }
    }

    return document;
  }, []);

  useEffect(() => {
    // Always load script in main document (not Shadow DOM) so widget can create overlays
    // Check if script is already loaded
    if (!resolvedDocument) {
      return undefined;
    }

    const scriptSelector = 'script[src="https://widget.kapa.ai/kapa-widget.bundle.js"]';
    const existingScript = resolvedDocument.querySelector(scriptSelector);

    if (existingScript) {
      setIsScriptLoaded(true);
    } else {
      // Create and load the Kapa AI widget script
      // Note: Script must be in main document, not Shadow DOM, so widget can create modal overlays
      const script = document.createElement('script');
      script.src = 'https://widget.kapa.ai/kapa-widget.bundle.js';
      script.setAttribute('data-modal-title', 'Convex AI');
      script.setAttribute('data-button-hide', 'true');
      script.setAttribute('data-modal-override-open-class', 'js-launch-kapa-ai');
      script.setAttribute('data-website-id', '8dfb3aad-6006-4f56-b2ed-75fa8051db22');
      script.setAttribute('data-project-name', 'Convex');
      script.setAttribute('data-project-color', '#3F5295');
      script.setAttribute('data-project-logo', 'https://img.stackshare.io/service/41143/default_f1d33b63d360437ba28c8ac981dd68d7d2478b22.png');
      script.setAttribute('data-user-analytics-fingerprint-enabled', 'true');
      script.setAttribute('data-user-analytics-cookie-enabled', 'true');
      script.setAttribute('data-search-mode-enabled', 'true');
      script.async = true;
      
      script.onload = () => {
        setIsScriptLoaded(true);
        // Give the widget a moment to initialize
        setTimeout(() => {
          // Widget should be ready now
        }, 100);
      };

      script.onerror = () => {
        console.error('Failed to load Kapa AI widget');
      };

      // Always append to main document body (not Shadow DOM)
      resolvedDocument.body.appendChild(script);
    }

    // Set up event listener in main document to handle Shadow DOM clicks
    // This allows the button inside Shadow DOM to trigger the widget in main document
    const handleKapaOpen = () => {
      if (typeof window !== 'undefined') {
        const kapaWindow = window as any;
        if (kapaWindow.kapa && typeof kapaWindow.kapa.open === 'function') {
          try {
            kapaWindow.kapa.open();
          } catch (err) {
            console.error('Error opening Kapa widget from event:', err);
          }
        }
      }
    };

    // Listen for custom event that can cross Shadow DOM boundary
    resolvedDocument.addEventListener('kapa-ai-open', handleKapaOpen);

    return () => {
      // Cleanup event listener
      resolvedDocument.removeEventListener('kapa-ai-open', handleKapaOpen);
    };
  }, [resolvedDocument]);

  const waitForKapa = useCallback(async () => {
    if (typeof window === 'undefined') {
      return null;
    }

    const kapaWindow = window as any;
    if (kapaWindow.kapa && typeof kapaWindow.kapa.open === 'function') {
      return kapaWindow.kapa;
    }

    // Poll for up to 2 seconds
    const start = Date.now();
    while (Date.now() - start < 2000) {
      if (kapaWindow.kapa && typeof kapaWindow.kapa.open === 'function') {
        return kapaWindow.kapa;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return null;
  }, []);

  const handleClick = useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Wait a moment for the widget to be ready if script just loaded
    const tryOpen = async () => {
      // Method 1: Try to access the global Kapa object (most reliable)
      // Since script is loaded in main document, window.kapa should be available
      if (typeof window !== 'undefined') {
        const kapaInstance = await waitForKapa();
        if (kapaInstance && typeof kapaInstance.open === 'function') {
          try {
            kapaInstance.open();
            return;
          } catch (err) {
            console.error('Error opening Kapa widget:', err);
          }
        }
      }

      // Method 2: Dispatch a custom event that bubbles to main document
      // This allows Shadow DOM clicks to be detected by scripts in main document
      if (resolvedDocument) {
        const customEvent = new CustomEvent('kapa-ai-open', {
          bubbles: true,
          cancelable: true,
          composed: true, // This allows the event to cross Shadow DOM boundary
        });
        if (buttonRef.current) {
          buttonRef.current.dispatchEvent(customEvent);
        }
        resolvedDocument.dispatchEvent(customEvent);
      }

      // Method 3: Try to trigger via class selector in main document
      // The widget should listen for clicks on elements with js-launch-kapa-ai class
      if (resolvedDocument) {
        const elements = resolvedDocument.querySelectorAll('.js-launch-kapa-ai');
        elements.forEach((el) => {
          // Create and dispatch a click event
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
            composed: true, // Allow event to cross Shadow DOM boundary
          });
          el.dispatchEvent(clickEvent);
        });
      }

      // Method 4: Try to find and click the Kapa trigger button in main document
      const kapaButton = resolvedDocument?.querySelector('[data-kapa-button]') as HTMLElement | null;
      if (kapaButton) {
        kapaButton.click();
      }
    };

    if (isScriptLoaded) {
      tryOpen();
    } else {
      // If script isn't loaded yet, wait a bit and try again
      setTimeout(tryOpen, 500);
    }
  }, [getRoot, isScriptLoaded, resolvedDocument, waitForKapa]);

  return (
    <button
      ref={buttonRef}
      type="button"
      className="js-launch-kapa-ai cp-ask-ai-btn"
      onClick={handleClick}
    >
      <Sparkles style={{ width: '12px', height: '12px' }} /> Ask AI
    </button>
  );
}

