import React, { useState, useEffect } from 'react';
import { ExternalLink, AlertCircle, Loader2, PlayCircle, PauseCircle, Info } from 'lucide-react';
import {
  getConvexDeploymentState,
  pauseConvexDeployment,
  resumeConvexDeployment,
} from '../../../utils/api/deployments';
import { getAdminClientInfo, validateAdminClientInfo } from '../../../utils/adminClient';
import { setStorageItem } from '../../../utils/storage';
import { STORAGE_KEYS } from '../../../utils/constants';

export interface PauseDeploymentProps {
  adminClient?: any;
  accessToken?: string;
  deploymentUrl?: string;
}

export const PauseDeployment: React.FC<PauseDeploymentProps> = ({
  adminClient,
  accessToken,
  deploymentUrl: providedDeploymentUrl,
}) => {
  const [deploymentState, setDeploymentState] = useState<'running' | 'paused' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    if (!adminClient) {
      setError('Admin client not available');
      setIsLoading(false);
      return;
    }

    loadDeploymentState();
  }, [adminClient]);

  const loadDeploymentState = async () => {
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

      const state = await getConvexDeploymentState(deploymentUrl, finalAdminKey);
      setDeploymentState(state.state);
    } catch (err: any) {
      setError(err?.message || 'Failed to load deployment state');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!adminClient || isToggling) return;

    // Show confirmation dialog only when pausing (not resuming)
    if (deploymentState === 'running') {
      setShowConfirmDialog(true);
      return;
    }

    // Resume immediately without confirmation
    await performToggle();
  };

  const performToggle = async () => {
    if (!adminClient || isToggling) return;

    const clientInfo = getAdminClientInfo(adminClient, providedDeploymentUrl);
    const validationError = validateAdminClientInfo(clientInfo);

    if (validationError) {
      setError(validationError);
      return;
    }

    const { deploymentUrl, adminKey } = clientInfo;
    const finalAdminKey = accessToken || adminKey;

    if (!deploymentUrl || !finalAdminKey) {
      setError('Missing deployment URL or admin key');
      return;
    }

    setIsToggling(true);
    setError(null);
    setShowConfirmDialog(false);

    try {
      if (deploymentState === 'paused') {
        await resumeConvexDeployment(deploymentUrl, finalAdminKey);
        setDeploymentState('running');
        // Trigger immediate refresh in bottom-sheet
        setStorageItem(STORAGE_KEYS.DEPLOYMENT_STATE_CHANGED, Date.now());
        window.dispatchEvent(new CustomEvent('deploymentStateChanged'));
      } else {
        await pauseConvexDeployment(deploymentUrl, finalAdminKey);
        setDeploymentState('paused');
        // Trigger immediate refresh in bottom-sheet
        setStorageItem(STORAGE_KEYS.DEPLOYMENT_STATE_CHANGED, Date.now());
        window.dispatchEvent(new CustomEvent('deploymentStateChanged'));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to toggle deployment state');
    } finally {
      setIsToggling(false);
    }
  };

  const cancelConfirm = () => {
    setShowConfirmDialog(false);
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
            padding: '0 8px',
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
            Pause Deployment
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
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} />
          Loading deployment state...
        </div>
      </div>
    );
  }

  if (error && deploymentState === null) {
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
            padding: '0 8px',
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
            Pause Deployment
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
            onClick={loadDeploymentState}
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

  const isPaused = deploymentState === 'paused';

  return (
    <>
      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
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
          padding: '0 8px',
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
          Pause Deployment
        </h2>
        <button
          type="button"
          onClick={handleToggle}
          disabled={isToggling}
          style={{
            height: '30px',
            padding: '8px 16px',
            fontSize: '11px',
            borderRadius: '8px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            border: isPaused ? 'none' : '1px solid var(--color-panel-border)',
            backgroundColor: isPaused ? 'var(--color-panel-accent)' : 'var(--color-panel-bg-tertiary)',
            color: isPaused ? '#fff' : 'var(--color-panel-text-secondary)',
            cursor: isToggling ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxSizing: 'border-box',
            whiteSpace: 'nowrap',
            opacity: isToggling ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isToggling) {
              if (!isPaused) {
                e.currentTarget.style.backgroundColor = 'var(--color-panel-accent)';
                e.currentTarget.style.color = '#fff';
              } else {
                e.currentTarget.style.backgroundColor = 'var(--color-panel-accent-hover)';
              }
            }
          }}
          onMouseLeave={(e) => {
            if (!isToggling) {
              if (!isPaused) {
                e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
                e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
              } else {
                e.currentTarget.style.backgroundColor = 'var(--color-panel-accent)';
              }
            }
          }}
        >
          {isToggling ? (
            <>
              <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />
              {isPaused ? 'Resuming...' : 'Pausing...'}
            </>
          ) : (
            <>
              {isPaused ? (
                <>
                  <PlayCircle size={10} />
                  Resume
                </>
              ) : (
                <>
                  <PauseCircle size={10} />
                  Pause
                </>
              )}
            </>
          )}
        </button>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
        }}
      >
        {/* Status Card */}
        <div
          style={{
            backgroundColor: 'var(--color-panel-bg-secondary)',
            border: '1px solid var(--color-panel-border)',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {isPaused ? (
            <PauseCircle size={20} style={{ color: '#f87171', flexShrink: 0 }} />
          ) : (
            <PlayCircle size={20} style={{ color: 'var(--color-panel-success)', flexShrink: 0 }} />
          )}
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--color-panel-text)',
                marginBottom: '4px',
              }}
            >
              Deployment Status
            </div>
            <div
              style={{
                fontSize: '13px',
                color: 'var(--color-panel-text-secondary)',
              }}
            >
              This deployment is currently{' '}
              <strong style={{ color: isPaused ? '#f87171' : 'var(--color-panel-success)' }}>
                {deploymentState}
              </strong>
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div
          style={{
            backgroundColor: 'var(--color-panel-bg-secondary)',
            border: '1px solid var(--color-panel-border)',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
            }}
          >
            <Info size={16} style={{ color: 'var(--color-panel-text-muted)', flexShrink: 0 }} />
            <div
              style={{
                fontSize: '14px',
                color: 'var(--color-panel-text)',
                fontWeight: 500,
              }}
            >
              What happens when paused
            </div>
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '13px',
              color: 'var(--color-panel-text-secondary)',
              lineHeight: '1.6',
            }}
          >
            <li>New function calls will return an error.</li>
            <li>Scheduled jobs will queue and run when the deployment is resumed.</li>
            <li>Cron jobs will be skipped.</li>
          </ul>
        </div>

        {/* Learn More Link */}
        <div>
          <a
            href="https://docs.convex.dev/production/pause-deployment"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--color-panel-accent)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            Learn more about pausing deployments
            <ExternalLink size={13} style={{ display: 'inline-block' }} />
          </a>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              marginTop: '24px',
              padding: '12px 16px',
              backgroundColor: 'color-mix(in srgb, var(--color-panel-error) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-panel-error) 20%, transparent)',
              borderRadius: '6px',
              color: 'var(--color-panel-error)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={cancelConfirm}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--color-panel-bg)',
              border: '1px solid var(--color-panel-border)',
              borderRadius: '8px',
              padding: '16px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--color-panel-text)',
                marginBottom: '12px',
              }}
            >
              Pause Deployment
            </h3>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--color-panel-text-secondary)',
                marginBottom: '20px',
                lineHeight: '1.5',
              }}
            >
              Are you sure you want to pause this deployment? New function calls will return an error while paused.
            </p>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={cancelConfirm}
                disabled={isToggling}
                style={{
                  padding: '6px 16px',
                  backgroundColor: 'var(--color-panel-bg-secondary)',
                  border: '1px solid var(--color-panel-border)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--color-panel-text)',
                  cursor: isToggling ? 'not-allowed' : 'pointer',
                  opacity: isToggling ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isToggling) {
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isToggling) {
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-secondary)';
                  }
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={performToggle}
                disabled={isToggling}
                style={{
                  padding: '6px 16px',
                  backgroundColor: 'var(--color-panel-error)',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'white',
                  cursor: isToggling ? 'not-allowed' : 'pointer',
                  opacity: isToggling ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isToggling) {
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-error-hover, color-mix(in srgb, var(--color-panel-error) 90%, black))';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isToggling) {
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-error)';
                  }
                }}
              >
                {isToggling ? 'Pausing...' : 'Pause Deployment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};
