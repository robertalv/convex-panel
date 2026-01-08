import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { SetupInstructions } from './setup-instructions';

interface AuthPanelProps {
  oauthConfig?: any;
  onConnect?: () => void;
  error?: string | null;
  isLoading?: boolean;
  deploymentUrl?: string;
  teamSlug?: string;
  projectSlug?: string;
  accessToken?: string;
}

export const AuthPanel: React.FC<AuthPanelProps> = ({
  oauthConfig,
  onConnect,
  error,
  isLoading,
  deploymentUrl,
  teamSlug,
  projectSlug,
  accessToken,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
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
      <>
        <div className="cp-auth-missing">
          <p>OAuth configuration is required to use Convex Panel.</p>
          <p className="cp-auth-missing-subtext">Please provide oauthConfig with your clientId and redirectUri.</p>
          <button
            onClick={() => setShowInstructions(true)}
            className="cp-auth-instructions-btn"
            style={{
              marginTop: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: 'var(--color-primary, #3b82f6)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary, #3b82f6)';
            }}
          >
            <BookOpen size={16} />
            View Setup Instructions
          </button>
        </div>
        <SetupInstructions
          isOpen={showInstructions}
          onClose={() => setShowInstructions(false)}
          deploymentUrl={deploymentUrl}
          teamSlug={teamSlug}
          projectSlug={projectSlug}
          accessToken={accessToken}
        />
      </>
    );
  }

  return (
    <>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

            <button
              onClick={() => setShowInstructions(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 20px',
                backgroundColor: 'transparent',
                color: 'var(--color-text-secondary, #888)',
                border: '1px solid var(--color-panel-border, #333)',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-primary, #1a1a1a)';
                e.currentTarget.style.borderColor = 'var(--color-primary, #3b82f6)';
                e.currentTarget.style.color = 'var(--color-primary, #3b82f6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'var(--color-panel-border, #333)';
                e.currentTarget.style.color = 'var(--color-text-secondary, #888)';
              }}
            >
              <BookOpen size={16} />
              Setup Instructions
            </button>
          </div>
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
      <SetupInstructions
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        deploymentUrl={deploymentUrl}
        teamSlug={teamSlug}
        projectSlug={projectSlug}
        accessToken={accessToken}
      />
    </>
  );
};

