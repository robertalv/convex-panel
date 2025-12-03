import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import type {
  AuthProvider,
  OIDCProvider,
  CustomJWTProvider
} from '../../../utils/api/types';
import { getAuthProviders } from '../../../utils/api/auth';

export interface AuthenticationProps {
  adminClient?: any;
}

const isOIDCProvider = (provider: AuthProvider): provider is OIDCProvider => {
  return 'domain' in provider && !('type' in provider);
};

const isCustomJWTProvider = (provider: AuthProvider): provider is CustomJWTProvider => {
  return 'type' in provider;
};

export const Authentication: React.FC<AuthenticationProps> = ({
  adminClient
}) => {
  const [authProviders, setAuthProviders] = useState<AuthProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!adminClient) {
      setError('Admin client not available');
      setIsLoading(false);
      return;
    }

    loadAuthProviders();
  }, [adminClient]);

  const loadAuthProviders = async () => {
    if (!adminClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const providers = await getAuthProviders(adminClient);
      setAuthProviders(providers || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load authentication providers');
      console.error('Error loading authentication providers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: 'var(--color-panel-bg)',
        }}
      >
        <div
          style={{
            height: '49px',
            borderBottom: '1px solid var(--color-panel-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            backgroundColor: 'var(--color-panel-bg)',
          }}
        >
          <h2
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--color-panel-text)',
              margin: 0,
            }}
          >
            Authentication Configuration
          </h2>
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-panel-text-secondary)',
            fontSize: '14px',
            padding: '32px',
          }}
        >
          Loading authentication providers...
        </div>
      </div>
    );
  }

  if (error && authProviders.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: 'var(--color-panel-bg)',
        }}
      >
        <div
          style={{
            height: '49px',
            borderBottom: '1px solid var(--color-panel-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            backgroundColor: 'var(--color-panel-bg)',
          }}
        >
          <h2
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--color-panel-text)',
              margin: 0,
            }}
          >
            Authentication Configuration
          </h2>
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '32px',
          }}
        >
          <AlertCircle size={24} style={{ color: 'var(--color-panel-error)' }} />
          <div style={{ color: 'var(--color-panel-error)', fontSize: '14px' }}>
            {error}
          </div>
          <button
            type="button"
            onClick={loadAuthProviders}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: 'var(--color-panel-accent)',
              color: 'var(--color-panel-bg)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: 'var(--color-panel-bg)',
      }}
    >
      {/* Header */}
      <div
        style={{
          height: '49px',
          borderBottom: '1px solid var(--color-panel-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          backgroundColor: 'var(--color-panel-bg)',
        }}
      >
        <h2
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--color-panel-text)',
            margin: 0,
          }}
        >
          Authentication Configuration
        </h2>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxWidth: '800px',
          }}
        >
          {/* Title */}
          {/* <h1
            style={{
              fontSize: '24px',
              fontWeight: 600,
              color: 'var(--color-panel-text)',
              margin: 0,
            }}
          >
            Authentication Configuration
          </h1> */}

          {/* Description paragraphs */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              fontSize: '14px',
              lineHeight: '1.6',
              color: 'var(--color-panel-text-secondary)',
            }}
          >
            <p style={{ margin: 0 }}>
              These are the authentication providers configured for this deployment.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div
              style={{
                padding: '12px',
                backgroundColor: 'color-mix(in srgb, var(--color-panel-error) 10%, transparent)',
                border: '1px solid var(--color-panel-error)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--color-panel-error)',
                fontSize: '13px',
              }}
            >
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Table */}
          {authProviders.length > 0 ? (
            <div
              style={{
                border: '1px solid var(--color-panel-border)',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: 'var(--color-panel-bg-secondary)',
              }}
            >
              {/* Table Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 16px',
                  borderBottom: '1px solid var(--color-panel-border)',
                  backgroundColor: 'var(--color-panel-bg)',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--color-panel-text-secondary)',
                  }}
                >
                  Domain
                </div>
                <div
                  style={{
                    flex: 1,
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--color-panel-text-secondary)',
                  }}
                >
                  Application ID
                </div>
                <div
                  style={{
                    width: '200px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--color-panel-text-secondary)',
                  }}
                >
                  Type
                </div>
              </div>

              {/* Table Rows */}
              <div>
                {authProviders.map((provider, index) => {
                  const isOIDC = isOIDCProvider(provider);
                  const isJWT = isCustomJWTProvider(provider);

                  return (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 16px',
                        borderBottom: index < authProviders.length - 1 ? '1px solid var(--color-panel-border)' : 'none',
                        backgroundColor: 'transparent',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {/* Domain */}
                      <div
                        style={{
                          flex: 1,
                          paddingRight: '16px',
                        }}
                      >
                        <div
                          style={{
                            padding: '8px 12px',
                            backgroundColor: 'var(--color-panel-bg)',
                            border: '1px solid var(--color-panel-border)',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontFamily: 'monospace',
                            color: 'var(--color-panel-text)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isOIDC ? provider.domain : isJWT ? provider.issuer : '-'}
                        </div>
                      </div>

                      {/* Application ID */}
                      <div
                        style={{
                          flex: 1,
                          paddingRight: '16px',
                        }}
                      >
                        <div
                          style={{
                            padding: '8px 12px',
                            backgroundColor: 'var(--color-panel-bg)',
                            border: '1px solid var(--color-panel-border)',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontFamily: 'monospace',
                            color: 'var(--color-panel-text)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isOIDC ? provider.applicationID : isJWT ? (provider.applicationID || '-') : '-'}
                        </div>
                      </div>

                      {/* Type */}
                      <div
                        style={{
                          width: '200px',
                          fontSize: '13px',
                          color: 'var(--color-panel-text-secondary)',
                        }}
                      >
                        {isOIDC ? (
                          <a
                            href="https://docs.convex.dev/auth/advanced/custom-auth"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: 'var(--color-panel-info)',
                              textDecoration: 'none',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.textDecoration = 'underline';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.textDecoration = 'none';
                            }}
                          >
                            OIDC provider
                          </a>
                        ) : isJWT ? (
                          'Custom JWT provider'
                        ) : (
                          'Unknown'
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div
              style={{
                border: '1px solid var(--color-panel-border)',
                borderRadius: '8px',
                padding: '48px 24px',
                textAlign: 'center',
                backgroundColor: 'var(--color-panel-bg-secondary)',
                color: 'var(--color-panel-text-muted)',
                fontSize: '14px',
              }}
            >
              No authentication providers configured
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

