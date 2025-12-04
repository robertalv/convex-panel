import React, { useEffect, useState, useCallback, useRef } from 'react';
import { SparklesIcon } from './icons';
import { usePortalEnvironment } from '../contexts/portal-context';

export function AskAI() {
  const [, setIsScriptLoaded] = useState(false);
  const hiddenButtonRef = useRef<HTMLButtonElement | null>(null);
  const { ownerDocument } = usePortalEnvironment();
  const resolvedDocument = ownerDocument ?? (typeof document !== 'undefined' ? document : null);

  useEffect(() => {
    if (!resolvedDocument) {
      return undefined;
    }

    const scriptSelector = 'script[src="https://widget.kapa.ai/kapa-widget.bundle.js"]';
    const existingScript = resolvedDocument.querySelector(scriptSelector);

    if (existingScript) {
      setIsScriptLoaded(true);
    } else {
      // Create and load the Kapa AI widget script
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
      };

      script.onerror = () => {
        console.error('Failed to load Kapa AI widget');
      };

      // Always append to main document body (not Shadow DOM)
      resolvedDocument.body.appendChild(script);
    }

    const existingHiddenButton = resolvedDocument.querySelector('#kapa-ai-hidden-trigger');
    if (!existingHiddenButton) {
      const hiddenButton = document.createElement('button');
      hiddenButton.id = 'kapa-ai-hidden-trigger';
      hiddenButton.className = 'js-launch-kapa-ai';
      hiddenButton.style.display = 'none';
      hiddenButton.style.visibility = 'hidden';
      hiddenButton.style.position = 'absolute';
      hiddenButton.style.pointerEvents = 'none';
      resolvedDocument.body.appendChild(hiddenButton);
      hiddenButtonRef.current = hiddenButton;
    } else {
      hiddenButtonRef.current = existingHiddenButton as HTMLButtonElement;
    }

    return () => {
      // Don't remove the hidden button or script on unmount as they might be shared
      // across multiple instances of the component
    };
  }, [resolvedDocument]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (typeof window !== 'undefined') {
      const kapaWindow = window as any;
      if (kapaWindow.kapa && typeof kapaWindow.kapa.open === 'function') {
        try {
          kapaWindow.kapa.open();
          return;
        } catch (err) {
          console.error('Error opening Kapa widget:', err);
        }
      }
    }

    if (hiddenButtonRef.current) {
      try {
        hiddenButtonRef.current.click();
        return;
      } catch (err) {
        console.error('Error clicking hidden trigger:', err);
      }
    }

    if (resolvedDocument) {
      const hiddenButton = resolvedDocument.querySelector('#kapa-ai-hidden-trigger') as HTMLButtonElement;
      if (hiddenButton) {
        try {
          hiddenButton.click();
          return;
        } catch (err) {
          console.error('Error clicking hidden button by selector:', err);
        }
      }
    }

    console.warn('Could not open Kapa AI widget - no method succeeded');
  }, [resolvedDocument]);

  return (
    <button
      type="button"
      className="cp-ask-ai-btn"
      onClick={handleClick}
    >
      <SparklesIcon style={{ width: '12px', height: '12px' }} /> Ask AI
    </button>
  );
}
