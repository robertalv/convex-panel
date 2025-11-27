import React, { useEffect } from 'react';
import { Sparkles } from 'lucide-react';

export function AskAI() {
  useEffect(() => {
    // Check if script is already loaded
    if (document.querySelector('script[src="https://widget.kapa.ai/kapa-widget.bundle.js"]')) {
      return;
    }

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

    document.body.appendChild(script);

    return () => {
      // Cleanup: remove script on unmount if needed
      const existingScript = document.querySelector('script[src="https://widget.kapa.ai/kapa-widget.bundle.js"]');
      if (existingScript) {
        // Note: We don't remove it on cleanup to avoid reloading on re-renders
      }
    };
  }, []);

  return (
    <button
      className="js-launch-kapa-ai cp-ask-ai-btn"
    >
      <Sparkles style={{ width: '12px', height: '12px' }} /> Ask AI
    </button>
  );
}

