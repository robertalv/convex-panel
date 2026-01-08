import React, { useEffect, useState } from 'react';
import { X, ExternalLink, MessageSquare } from 'lucide-react';
import { createPortal } from 'react-dom';
import { usePortalTarget } from '../contexts/portal-context';
import { useThemeSafe } from '../hooks/useTheme';

export interface SupportPopupProps {
  isOpen: boolean;
  onClose: () => void;
  hasProAccess?: boolean;
}

export const SupportPopup: React.FC<SupportPopupProps> = ({
  isOpen,
  onClose,
  hasProAccess = false,
}) => {
  const [showProTooltip, setShowProTooltip] = useState(false);
  const portalTarget = usePortalTarget();
  const { theme } = useThemeSafe();

  // Prevent body scroll when popup is open
  useEffect(() => {
    if (isOpen) {
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

  const handleDocsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open('https://docs.convex.dev/', '_blank', 'noopener,noreferrer');
  };

  const handleDiscordClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open('https://convex.dev/community', '_blank', 'noopener,noreferrer');
  };

  const handleSupportTicketClick = (e: React.MouseEvent) => {
    if (!hasProAccess) {
      e.preventDefault();
      // Open upgrade page for non-Pro users
      window.open('https://convex.dev/referral/IDYLCO2615', '_blank', 'noopener,noreferrer');
      onClose();
    } else {
      // TODO: Implement support ticket functionality for Pro users
      window.open('https://convex.dev/support', '_blank', 'noopener,noreferrer');
    }
  };

  // Discord icon SVG
  const DiscordIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ flexShrink: 0 }}
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );

  return createPortal(
    <>
      {/* Popup */}
      <div
        className={`cp-theme-${theme}`}
        style={{
          position: 'fixed',
          bottom: '50px',
          right: '10px',
          width: '400px',
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
          <h2
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--color-panel-text)',
            }}
          >
            Get in touch
          </h2>
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
            gap: '20px',
          }}
        >
          {/* Description */}
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              lineHeight: '1.5',
              color: 'var(--color-panel-text-secondary)',
            }}
          >
            Discord is a great way to get a quick response from the Convex community or to ask an AI for help!
          </p>

          {/* Links */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* Convex Documentation */}
            <a
              href="https://docs.convex.dev/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDocsClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '8px',
                color: 'var(--color-panel-text)',
                textDecoration: 'none',
                fontSize: '14px',
                transition: 'background-color 0.15s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <ExternalLink size={16} style={{ flexShrink: 0, color: 'var(--color-panel-text-secondary)' }} />
              <span>Convex Documentation</span>
            </a>

            {/* Discord Community */}
            <a
              href="https://convex.dev/community"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDiscordClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '8px',
                color: 'var(--color-panel-text)',
                textDecoration: 'none',
                fontSize: '14px',
                transition: 'background-color 0.15s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <DiscordIcon />
              <span>Join the Discord community</span>
            </a>

            {/* Support Ticket */}
            <div
              style={{
                position: 'relative',
              }}
              onMouseEnter={() => setShowProTooltip(true)}
              onMouseLeave={() => setShowProTooltip(false)}
            >
              {showProTooltip && !hasProAccess && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 0,
                    marginBottom: '8px',
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-panel-bg-tertiary)',
                    border: '1px solid var(--color-panel-border)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: 'var(--color-panel-text-secondary)',
                    whiteSpace: 'nowrap',
                    zIndex: 1,
                    boxShadow: '0 4px 12px var(--color-panel-shadow)',
                  }}
                >
                  Email support is available on the Pro plan.
                </div>
              )}
              <a
                href={hasProAccess ? 'https://convex.dev/support' : 'https://convex.dev/referral/IDYLCO2615'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleSupportTicketClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  color: hasProAccess ? 'var(--color-panel-text)' : 'var(--color-panel-text-muted)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  transition: 'background-color 0.15s ease',
                  cursor: hasProAccess ? 'pointer' : 'default',
                  opacity: hasProAccess ? 1 : 0.7,
                }}
                onMouseEnter={(e) => {
                  if (hasProAccess) {
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <MessageSquare size={16} style={{ flexShrink: 0, color: 'var(--color-panel-text-secondary)' }} />
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>File a support ticket</span>
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: '#6366f1',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    PRO
                  </span>
                </span>
              </a>
            </div>
          </div>
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
