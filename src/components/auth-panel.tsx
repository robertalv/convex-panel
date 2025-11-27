import React, { useState } from 'react';

interface AuthPanelProps {
  oauthConfig?: any;
  onConnect?: () => void;
  error?: string | null;
  isLoading?: boolean;
}

export const AuthPanel: React.FC<AuthPanelProps> = ({
  oauthConfig,
  onConnect,
  error,
  isLoading,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
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

  if (!oauthConfig) {
    return (
      <div className="cp-auth-missing">
        <p>OAuth configuration is required to use Convex Panel.</p>
        <p className="cp-auth-missing-subtext">Please provide oauthConfig with your clientId and redirectUri.</p>
      </div>
    );
  }

  return (
    <div className="cp-auth-container">
      <div className="cp-auth-header">
        <h2 className="cp-auth-title">Connect Your Convex Project</h2>
        <p className="cp-auth-description">
          Authenticate with Convex to access your project's logs, data, and metrics
        </p>
      </div>

      {error && <div className="cp-auth-error">{error}</div>}

      <div className="cp-auth-card">
        <div>
          <h3 className="cp-auth-card-title">How it works</h3>
          <ul className="cp-auth-card-list">
            <li>Click &quot;Connect Convex&quot; to authorize access to your projects</li>
            <li>You&apos;ll be redirected to Convex dashboard to grant permissions</li>
            <li>Once authorized, you can access all panel features</li>
          </ul>
        </div>

        <button
          onClick={handleConnect}
          disabled={isDisabled}
          className="cp-auth-connect-btn"
        >
          {isDisabled ? (
            <>
              <div className="cp-auth-spinner" />
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
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              Connect Convex
            </>
          )}
        </button>
      </div>

      <div className="cp-auth-security">
        <p className="cp-auth-security-title">Security &amp; Privacy</p>
        <ul className="cp-auth-security-list">
          <li>Your credentials are stored securely in your browser</li>
          <li>Tokens are scoped to your authorized permissions</li>
          <li>You can disconnect at any time</li>
        </ul>
      </div>
    </div>
  );
};

