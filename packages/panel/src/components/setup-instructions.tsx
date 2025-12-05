import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Copy, CheckCircle2, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';
import { usePortalTarget } from '../contexts/portal-context';
import { useThemeSafe } from '../hooks/useTheme';
import { isNextJSEnv } from '../utils/env/platform';
import {
  buildEnvironmentVariablesUrl,
  buildOAuthApplicationsUrl,
  buildAccessTokensUrl,
} from '../utils/dashboard-urls';

export interface SetupInstructionsProps {
  isOpen: boolean;
  onClose: () => void;
  deploymentUrl?: string;
  teamSlug?: string;
  projectSlug?: string;
  accessToken?: string;
}

export const SetupInstructions: React.FC<SetupInstructionsProps> = ({
  isOpen,
  onClose,
  deploymentUrl,
  teamSlug,
  projectSlug,
  accessToken,
}) => {
  const portalTarget = usePortalTarget();
  const { theme } = useThemeSafe();
  const [currentStep, setCurrentStep] = useState(1);
  const [copied, setCopied] = useState<string | null>(null);
  const isNext = isNextJSEnv();

  // Reset to step 1 when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !portalTarget) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const envVarsUrl = buildEnvironmentVariablesUrl(deploymentUrl, teamSlug, projectSlug, accessToken);
  const oauthAppsUrl = buildOAuthApplicationsUrl(teamSlug, projectSlug, accessToken);
  const accessTokensUrl = buildAccessTokensUrl(teamSlug, projectSlug, accessToken);

  // Get framework-specific environment variable names
  // Next.js uses NEXT_PUBLIC_ prefix, Vite uses VITE_ prefix
  const convexUrlVar = isNext ? 'NEXT_PUBLIC_CONVEX_URL' : 'VITE_CONVEX_URL';
  const oauthClientIdVar = isNext ? 'NEXT_PUBLIC_OAUTH_CLIENT_ID' : 'VITE_OAUTH_CLIENT_ID';
  const oauthClientSecretVar = isNext ? 'NEXT_PUBLIC_CONVEX_CLIENT_SECRET' : 'VITE_CONVEX_CLIENT_SECRET';
  const accessTokenVar = isNext ? 'NEXT_PUBLIC_CONVEX_ACCESS_TOKEN' : 'VITE_CONVEX_ACCESS_TOKEN';
  const tokenExchangeUrlVar = isNext ? 'NEXT_PUBLIC_CONVEX_TOKEN_EXCHANGE_URL' : 'VITE_CONVEX_TOKEN_EXCHANGE_URL';

  // Calculate token exchange URL from deployment URL
  const tokenExchangeUrl = deploymentUrl && deploymentUrl.includes('.convex.cloud')
    ? deploymentUrl.replace('.convex.cloud', '.convex.site') + '/oauth/exchange'
    : deploymentUrl
      ? `${deploymentUrl.replace(/\/$/, '')}/oauth/exchange`
      : 'https://your-deployment.convex.site/oauth/exchange';

  const steps = [
    {
      number: 1,
      title: 'Create an OAuth Application',
      description: 'Set up OAuth authentication for Convex Panel.',
      content: (
        <div>
          <p style={{ margin: '0 0 12px 0', fontSize: '14px', lineHeight: '1.5', color: 'var(--color-panel-text-secondary)' }}>
            Navigate to your project settings and create a new OAuth application. You'll need to:
          </p>
          <ul style={{ 
            margin: '0 0 12px 0', 
            paddingLeft: '20px', 
            fontSize: '14px',
            color: 'var(--color-panel-text-secondary)',
            lineHeight: '1.6',
          }}>
            <li>Set a name for your OAuth application (e.g., "Convex Panel")</li>
            <li>Set the redirect URI to your current application URL: <code style={{
              backgroundColor: 'var(--color-panel-bg-primary)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '12px',
            }}>{typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'http://localhost:3000'}</code></li>
            <li>Copy the Client ID and Client Secret</li>
          </ul>
          {oauthAppsUrl && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
            <a
              href={oauthAppsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--color-primary, #3b82f6)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              Open OAuth Applications Settings <ExternalLink size={14} />
            </a>
            <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: 'var(--color-panel-text-secondary)' }}>
                Learn more about OAuth applications in the <a href="https://docs.convex.dev/platform-apis/oauth-applications" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary, #3b82f6)' }}>Convex documentation</a>.
            </p>
            </div>
          )}
        </div>
      ),
    },
    {
      number: 2,
      title: 'Create an Access Token',
      description: 'Create an access token in your project settings for authentication.',
      content: (
        <div>
          <p style={{ margin: '0 0 12px 0', fontSize: '14px', lineHeight: '1.5', color: 'var(--color-panel-text-secondary)' }}>
            Go to your project settings and create a new Access Token. Ensure it has sufficient permissions (e.g., `admin` role for full access).
          </p>
          {accessTokensUrl && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
            <a
              href={accessTokensUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--color-primary, #3b82f6)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              Open Access Tokens Settings <ExternalLink size={14} />
            </a>
            <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: 'var(--color-panel-text-secondary)' }}>
                Learn more about access tokens in the <a href="https://docs.convex.dev/platform-apis" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary, #3b82f6)' }}>Convex Platform APIs documentation</a>.
            </p>
            </div>
          )}
        </div>
      ),
    },
    {
      number: 3,
      title: 'Set Up Token Exchange',
      description: 'Create the OAuth token exchange endpoint in your Convex deployment.',
      content: (
        <div>
          <p style={{ margin: '0 0 12px 0', fontSize: '14px', lineHeight: '1.5', color: 'var(--color-panel-text-secondary)' }}>
            Run the setup script to inject the OAuth HTTP action into your <code style={{
              backgroundColor: 'var(--color-panel-bg-primary)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '12px',
            }}>convex/http.ts</code> file. This creates the <code style={{
              backgroundColor: 'var(--color-panel-bg-primary)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '12px',
            }}>/oauth/exchange</code> endpoint needed for OAuth authentication.
          </p>
          <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--color-panel-text-secondary)' }}>
            <strong>Important:</strong> Make sure you're in your project root directory (where your <code style={{
              backgroundColor: 'var(--color-panel-bg-primary)',
              padding: '2px 4px',
              borderRadius: '4px',
              fontSize: '11px',
            }}>package.json</code> is located) before running the command. The script will create <code style={{
              backgroundColor: 'var(--color-panel-bg-primary)',
              padding: '2px 4px',
              borderRadius: '4px',
              fontSize: '11px',
            }}>http.ts</code> if it doesn't exist, or append to it if it already exists.
          </p>
          <div style={{
            backgroundColor: 'var(--color-panel-bg-primary)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '12px',
            position: 'relative',
          }}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const command = 'npx convex-panel:setup:oauth';
                handleCopy(command, 'oauth_setup');
              }}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'transparent',
                border: 'none',
                color: 'var(--color-panel-text-secondary)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                transition: 'background-color 0.2s',
                zIndex: 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {copied === 'oauth_setup' ? (
                <CheckCircle2 size={16} style={{ color: 'var(--color-success, #22c55e)' }} />
              ) : (
                <Copy size={16} />
              )}
            </button>
            <pre style={{
              margin: 0,
              fontSize: '12px',
              fontFamily: 'monospace',
              color: 'var(--color-panel-text)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
{`npx convex-panel:setup:oauth`}
            </pre>
          </div>
          <p style={{ margin: '0 0 12px 0', fontSize: '14px', lineHeight: '1.5', color: 'var(--color-panel-text-secondary)' }}>
            After running the script, your token exchange URL will be:
          </p>
          <div style={{
            backgroundColor: 'var(--color-panel-bg-primary)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '12px',
          }}>
            <code style={{
              fontSize: '12px',
              fontFamily: 'monospace',
              color: 'var(--color-panel-text)',
              wordBreak: 'break-all',
            }}>
              {tokenExchangeUrl}
            </code>
          </div>
        </div>
      ),
    },
    {
      number: 4,
      title: 'Set Up Environment Variables',
      description: `Add your Convex credentials to your ${isNext ? '.env.local' : '.env'} file.`,
      content: (
        <div>
          <p style={{ margin: '0 0 12px 0', fontSize: '14px', lineHeight: '1.5', color: 'var(--color-panel-text-secondary)' }}>
            Create or update your <code style={{ 
              backgroundColor: 'var(--color-panel-bg-primary)',
              padding: '2px 6px', 
              borderRadius: '4px',
              fontSize: '12px',
            }}>{isNext ? '.env.local' : '.env'}</code> file in your project root with:
          </p>
          <div style={{
            backgroundColor: 'var(--color-panel-bg-primary)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '12px',
            position: 'relative',
          }}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const envContent = `${convexUrlVar}=${deploymentUrl || 'https://your-deployment.convex.cloud'}\n${oauthClientIdVar}=your-client-id\n${oauthClientSecretVar}=your-client-secret\n${tokenExchangeUrlVar}=${tokenExchangeUrl}\n${accessTokenVar}=your-access-token`;
                handleCopy(envContent, 'env_vars');
              }}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'transparent',
                border: 'none',
                color: 'var(--color-panel-text-secondary)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                transition: 'background-color 0.2s',
                zIndex: 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {copied === 'env_vars' ? (
                <CheckCircle2 size={16} style={{ color: 'var(--color-success, #22c55e)' }} />
              ) : (
                <Copy size={16} />
              )}
            </button>
            <pre style={{
              margin: 0,
              fontSize: '12px',
              fontFamily: 'monospace',
              color: 'var(--color-panel-text)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
{`${convexUrlVar}=${deploymentUrl || 'https://your-deployment.convex.cloud'}
${oauthClientIdVar}=your-client-id
${oauthClientSecretVar}=your-client-secret
${tokenExchangeUrlVar}=${tokenExchangeUrl}
${accessTokenVar}=your-access-token`}
            </pre>
          </div>
          <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: 'var(--color-panel-text-secondary)' }}>
            <strong>Note:</strong> Replace the placeholder values with your actual credentials. The access token is optional if you're using OAuth.
          </p>
          {envVarsUrl && (
            <div style={{ marginTop: '12px' }}>
              <a
                href={envVarsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--color-primary, #3b82f6)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                Open Environment Variables Settings <ExternalLink size={14} />
              </a>
            </div>
          )}
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep - 1];

  return createPortal(
    <>
      {/* Popup */}
      <div
        className={`cp-theme-${theme}`}
        style={{
          position: 'fixed',
          bottom: '50px',
          right: '10px',
          width: '500px',
          maxWidth: 'calc(100vw - 40px)',
          backgroundColor: 'var(--color-panel-bg-secondary)',
          border: '1px solid var(--color-panel-border)',
          borderRadius: '12px',
          zIndex: 100001,
          boxShadow: '0 8px 32px var(--color-panel-shadow)',
          animation: 'popupSlideInBottom 0.3s ease-out',
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <BookOpen size={20} style={{ color: 'var(--color-primary, #3b82f6)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 600,
                  color: 'var(--color-panel-text)',
                }}
              >
                Setup Instructions
              </h2>
              <p
                style={{
                  margin: '4px 0 0 0',
                  fontSize: '12px',
                  color: 'var(--color-panel-text-secondary)',
                }}
              >
                Step {currentStep} of {steps.length}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-panel-text-secondary)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'color 0.15s ease, background-color 0.15s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-panel-text)';
              e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: '0 24px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            flex: 1,
            overflowY: 'auto',
          }}
        >
          {/* Step Title */}
          <div>
            <h3
              style={{
                margin: '0 0 0px 0',
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--color-panel-text)',
              }}
            >
              {currentStepData.title}
            </h3>
            <p
              style={{
                margin: '0 0 16px 0',
                fontSize: '14px',
                lineHeight: '1.5',
                color: 'var(--color-panel-text-secondary)',
              }}
            >
              {currentStepData.description}
            </p>
          </div>

          {/* Step Content */}
          <div style={{ flex: 1 }}>
            {currentStepData.content}
          </div>
        </div>

        {/* Footer with Navigation */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--color-panel-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 500,
              color: currentStep === 1 
                ? 'var(--color-panel-text-muted)' 
                : 'var(--color-panel-text)',
              background: 'transparent',
              border: '1px solid var(--color-panel-border)',
              borderRadius: '6px',
              cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              opacity: currentStep === 1 ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (currentStep > 1) {
                e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ChevronLeft size={16} />
            Back
          </button>

          <div style={{ flex: 1 }} />

          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={handleNext}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#fff',
                background: 'var(--color-primary, #3b82f6)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary, #3b82f6)';
              }}
            >
              Next
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#fff',
                background: 'var(--color-primary, #3b82f6)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary, #3b82f6)';
              }}
            >
              Got it!
            </button>
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes popupSlideInBottom {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>,
    portalTarget
  );
};
