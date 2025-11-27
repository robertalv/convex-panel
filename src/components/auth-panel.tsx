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
  isLoading 
}) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      if (onConnect) {
        await onConnect();
      }
    } catch (err) {
      console.error('Authentication error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  if (!oauthConfig) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#999', backgroundColor: '#0F1115', height: '100%' }}>
        <p>OAuth configuration is required to use Convex Panel.</p>
        <p style={{ fontSize: '14px', marginTop: '8px' }}>
          Please provide oauthConfig with your clientId and redirectUri.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', backgroundColor: '#0F1115', height: '100%', overflowY: 'auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
          Connect Your Convex Project
        </h2>
        <p style={{ color: '#999', fontSize: '14px' }}>
          Authenticate with Convex to access your project's logs, data, and metrics
        </p>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '24px',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          backgroundColor: '#1C1F26',
          border: '1px solid #2D313A',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
            How it works
          </h3>
          <ul style={{ color: '#9ca3af', fontSize: '14px', lineHeight: '1.6', paddingLeft: '20px', margin: 0 }}>
            <li>Click "Connect Convex" to authorize access to your projects</li>
            <li>You'll be redirected to Convex dashboard to grant permissions</li>
            <li>Once authorized, you can access all panel features</li>
          </ul>
        </div>

        <button
          onClick={handleConnect}
          disabled={isConnecting || isLoading}
          style={{
            width: '100%',
            backgroundColor: '#5B46DF',
            color: '#fff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: 500,
            cursor: (isConnecting || isLoading) ? 'not-allowed' : 'pointer',
            opacity: (isConnecting || isLoading) ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!isConnecting && !isLoading) {
              e.currentTarget.style.backgroundColor = '#4d3bc2';
            }
          }}
          onMouseLeave={(e) => {
            if (!isConnecting && !isLoading) {
              e.currentTarget.style.backgroundColor = '#5B46DF';
            }
          }}
        >
          {(isConnecting || isLoading) ? (
            <>
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #fff',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
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

      <div
        style={{
          backgroundColor: '#1C1F26',
          border: '1px solid #2D313A',
          borderRadius: '6px',
          padding: '16px',
          fontSize: '12px',
          color: '#6b7280',
        }}
      >
        <p style={{ margin: 0, marginBottom: '8px', fontWeight: 500, color: '#9ca3af' }}>
          Security & Privacy
        </p>
        <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
          <li>Your credentials are stored securely in your browser</li>
          <li>Tokens are scoped to your authorized permissions</li>
          <li>You can disconnect at any time</li>
        </ul>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

