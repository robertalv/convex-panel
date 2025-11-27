import React, { useState } from 'react';
import { authPanelStyles, AUTH_PANEL_SPINNER_KEYFRAMES } from '../styles/panelStyles';

interface AuthPanelProps {
  oauthConfig?: any;
  onConnect?: () => void;
  error?: string | null;
  isLoading?: boolean;
}

const {
  container,
  missingConfig,
  missingConfigSubtext,
  header,
  title,
  description,
  errorBox,
  connectCard,
  cardIntro,
  cardTitle,
  cardList,
  connectButton,
  connectButtonDisabled,
  connectButtonHover,
  buttonIcon,
  spinner,
  securityCard,
  securityTitle,
  securityList,
} = authPanelStyles;

export const AuthPanel: React.FC<AuthPanelProps> = ({
  oauthConfig,
  onConnect,
  error,
  isLoading,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const isDisabled = isConnecting || isLoading;

  const handleConnect = async () => {
    if (isDisabled) {
      return;
    }
    setIsConnecting(true);
    try {
      await onConnect?.();
    } catch (err) {
      console.error('Authentication error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const connectButtonStyle = {
    ...connectButton,
    ...(isDisabled ? connectButtonDisabled : {}),
    ...(isButtonHovered && !isDisabled ? connectButtonHover : {}),
  };

  if (!oauthConfig) {
    return (
      <div style={missingConfig}>
        <p>OAuth configuration is required to use Convex Panel.</p>
        <p style={missingConfigSubtext}>Please provide oauthConfig with your clientId and redirectUri.</p>
      </div>
    );
  }

  return (
    <div style={container}>
      <div style={header}>
        <h2 style={title}>Connect Your Convex Project</h2>
        <p style={description}>
          Authenticate with Convex to access your project's logs, data, and metrics
        </p>
      </div>

      {error && <div style={errorBox}>{error}</div>}

      <div style={connectCard}>
        <div style={cardIntro}>
          <h3 style={cardTitle}>How it works</h3>
          <ul style={cardList}>
            <li>Click &quot;Connect Convex&quot; to authorize access to your projects</li>
            <li>You&apos;ll be redirected to Convex dashboard to grant permissions</li>
            <li>Once authorized, you can access all panel features</li>
          </ul>
        </div>

        <button
          onClick={handleConnect}
          disabled={isDisabled}
          style={connectButtonStyle}
          onMouseEnter={() => setIsButtonHovered(true)}
          onMouseLeave={() => setIsButtonHovered(false)}
          onFocus={() => setIsButtonHovered(true)}
          onBlur={() => setIsButtonHovered(false)}
        >
          {isDisabled ? (
            <>
              <div style={spinner} />
              Connecting...
            </>
          ) : (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={buttonIcon}
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              Connect Convex
            </>
          )}
        </button>
      </div>

      <div style={securityCard}>
        <p style={securityTitle}>Security &amp; Privacy</p>
        <ul style={securityList}>
          <li>Your credentials are stored securely in your browser</li>
          <li>Tokens are scoped to your authorized permissions</li>
          <li>You can disconnect at any time</li>
        </ul>
      </div>

      <style>{AUTH_PANEL_SPINNER_KEYFRAMES}</style>
    </div>
  );
};

