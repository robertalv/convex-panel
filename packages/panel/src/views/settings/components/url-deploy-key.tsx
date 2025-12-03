import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Copy, Check, AlertCircle, Plus } from 'lucide-react';
import {
  getDeploymentCredentials,
  getDeploymentInfo
} from '../../../utils/api/deployments';
import type { DeploymentCredentials, DeploymentInfo } from '../../../utils/api/types';
import { getAdminClientInfo, validateAdminClientInfo } from '../../../utils/adminClient';

export interface UrlDeployKeyProps {
  adminClient?: any;
  accessToken?: string;
  deploymentUrl?: string;
}

export const UrlDeployKey: React.FC<UrlDeployKeyProps> = ({
  adminClient,
  accessToken,
  deploymentUrl: providedDeploymentUrl,
}) => {
  const [credentials, setCredentials] = useState<DeploymentCredentials | null>(null);
  const [deploymentInfo, setDeploymentInfo] = useState<DeploymentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  useEffect(() => {
    if (!adminClient) {
      setError('Admin client not available');
      setIsLoading(false);
      return;
    }

    loadData();
  }, [adminClient]);

  const loadData = async () => {
    if (!adminClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const clientInfo = getAdminClientInfo(adminClient, providedDeploymentUrl);
      const validationError = validateAdminClientInfo(clientInfo);

      if (validationError) {
        setError(validationError);
        setIsLoading(false);
        return;
      }

      const { deploymentUrl, adminKey } = clientInfo;
      const finalAdminKey = accessToken || adminKey;

      if (!deploymentUrl || !finalAdminKey) {
        setError('Missing deployment URL or admin key');
        setIsLoading(false);
        return;
      }

      // Load credentials and deployment info
      const [credentialsData, infoData] = await Promise.all([
        getDeploymentCredentials(adminClient).catch(() => null),
        getDeploymentInfo(adminClient).catch(() => null),
      ]);

      setCredentials(credentialsData);
      setDeploymentInfo(infoData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load deployment credentials');
      console.error('Error loading deployment credentials:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, identifier: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedValue(identifier);
      setTimeout(() => setCopiedValue(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCreateDeployKey = async () => {
    if (!adminClient || !deploymentInfo) {
      setError('Admin client or deployment info not available');
      return;
    }

    // Note: Creating deploy keys requires a team access token via the Management API
    // The deployment info should contain the deployment name
    if (!deploymentInfo.deploymentName) {
      setError('Deployment name is required to create a deploy key');
      return;
    }

    // We need a team access token for the Management API
    // For now, we'll show an error that this requires team access token
    // In the future, this could be passed as a prop or obtained from OAuth
    setError('Creating deploy keys requires a team access token. Please use the Convex dashboard to create deploy keys, or provide a team access token.');
    return;

    // Future implementation (when team access token is available):
    // setIsCreatingKey(true);
    // try {
    //   const keyName = `Development Deploy Key - ${new Date().toISOString()}`;
    //   const result = await createDeployKey(
    //     deploymentInfo.deploymentName,
    //     teamAccessToken,
    //     keyName
    //   );
    //   setCreatedKey(result.deployKey);
    // } catch (err: any) {
    //   setError(err?.message || 'Failed to create deploy key');
    //   console.error('Error creating deploy key:', err);
    // } finally {
    //   setIsCreatingKey(false);
    // }
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
            Deployment URL and Deploy Key
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
          Loading deployment credentials...
        </div>
      </div>
    );
  }

  if (error && !credentials) {
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
            Deployment URL and Deploy Key
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
            onClick={loadData}
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

  const deploymentUrl = credentials?.deploymentUrl || providedDeploymentUrl || '';
  const httpActionsUrl = credentials?.httpActionsUrl || '';
  const isDev = deploymentInfo?.deploymentType === 'dev';

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
          Deployment URL and Deploy Key
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
            Deployment URL and Deploy Key
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
              This personal development Convex deployment also has deployment credentials. Edits you make to functions in your editor sync automatically, but it is also possible to deploy to it from somewhere else using a deploy key.
            </p>
          </div>

          {/* Collapsible Development Credentials Section */}
          <div
            style={{
              border: '1px solid var(--color-panel-border)',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: 'var(--color-panel-bg-secondary)',
            }}
          >
            {/* Collapsible Header */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                width: '100%',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-panel-text)',
                fontSize: '14px',
                textAlign: 'left',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {isExpanded ? (
                <ChevronUp size={16} style={{ color: 'var(--color-panel-text-muted)' }} />
              ) : (
                <ChevronDown size={16} style={{ color: 'var(--color-panel-text-muted)' }} />
              )}
              <span style={{ fontWeight: 500 }}>Show development credentials</span>
            </button>

            {/* Collapsible Content */}
            {isExpanded && (
              <div
                style={{
                  padding: '16px',
                  borderTop: '1px solid var(--color-panel-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px',
                }}
              >
                {/* Deployment URL Section */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--color-panel-text)',
                      margin: 0,
                    }}
                  >
                    Deployment URL
                  </h3>
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--color-panel-text-secondary)',
                      margin: 0,
                    }}
                  >
                    This development Convex deployment is hosted at the following URL. Configure a Convex client with this URL while developing locally.
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
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
                      {deploymentUrl || 'Loading...'}
                    </div>
                    <button
                      onClick={() => deploymentUrl && copyToClipboard(deploymentUrl, 'deployment-url')}
                      style={{
                        padding: '8px',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--color-panel-border)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: copiedValue === 'deployment-url' ? 'var(--color-panel-accent)' : 'var(--color-panel-text-muted)',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (copiedValue !== 'deployment-url') {
                          e.currentTarget.style.color = 'var(--color-panel-text)';
                          e.currentTarget.style.borderColor = 'var(--color-panel-accent)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (copiedValue !== 'deployment-url') {
                          e.currentTarget.style.color = 'var(--color-panel-text-muted)';
                          e.currentTarget.style.borderColor = 'var(--color-panel-border)';
                        }
                      }}
                      title="Copy deployment URL"
                    >
                      {copiedValue === 'deployment-url' ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                {/* HTTP Actions URL Section */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--color-panel-text)',
                      margin: 0,
                    }}
                  >
                    HTTP Actions URL
                  </h3>
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--color-panel-text-secondary)',
                      margin: 0,
                    }}
                  >
                    This development Convex deployment hosts{' '}
                    <a
                      href="https://docs.convex.dev/functions/http-actions"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--color-panel-info)',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.textDecoration = 'none';
                      }}
                    >
                      HTTP Actions
                    </a>{' '}
                    at the following URL. In Convex functions, this is available as process.env.CONVEX_SITE_URL.
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
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
                      {httpActionsUrl || 'Loading...'}
                    </div>
                    <button
                      onClick={() => httpActionsUrl && copyToClipboard(httpActionsUrl, 'http-actions-url')}
                      style={{
                        padding: '8px',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--color-panel-border)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: copiedValue === 'http-actions-url' ? 'var(--color-panel-accent)' : 'var(--color-panel-text-muted)',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (copiedValue !== 'http-actions-url') {
                          e.currentTarget.style.color = 'var(--color-panel-text)';
                          e.currentTarget.style.borderColor = 'var(--color-panel-accent)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (copiedValue !== 'http-actions-url') {
                          e.currentTarget.style.color = 'var(--color-panel-text-muted)';
                          e.currentTarget.style.borderColor = 'var(--color-panel-border)';
                        }
                      }}
                      title="Copy HTTP Actions URL"
                    >
                      {copiedValue === 'http-actions-url' ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                {/* Deploy Keys Section */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <h3
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'var(--color-panel-text)',
                          margin: 0,
                        }}
                      >
                        Deploy Keys
                      </h3>
                      <p
                        style={{
                          fontSize: '13px',
                          color: 'var(--color-panel-text-secondary)',
                          margin: 0,
                        }}
                      >
                        It's rare to need a development deploy key.
                      </p>
                    </div>
                    {isDev && (
                      <button
                        onClick={handleCreateDeployKey}
                        className="cp-btn"
                      >
                        <Plus size={14} /> Generate Development Deploy Key
                      </button>
                    )}
                  </div>

                  {/* Deploy Keys Info */}
                  <div
                    style={{
                      padding: '24px',
                      textAlign: 'center',
                      color: 'var(--color-panel-text-muted)',
                      fontSize: '14px',
                    }}
                  >
                    Deploy keys cannot be listed from here. To create or manage deploy keys, please use the{' '}
                    <a
                      href="https://dashboard.convex.dev"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--color-panel-info)',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.textDecoration = 'none';
                      }}
                    >
                      Convex dashboard
                    </a>
                    .
                  </div>
                </div>
              </div>
            )}
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
        </div>
      </div>
    </div>
  );
};

