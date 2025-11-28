import React, { useEffect } from 'react';
import { X, Sparkles, ExternalLink, Check } from 'lucide-react';

export interface UpgradePopupProps {
  isOpen: boolean;
  onClose: () => void;
  upgradeUrl?: string;
}

export const UpgradePopup: React.FC<UpgradePopupProps> = ({
  isOpen,
  onClose,
  upgradeUrl = 'https://convex.dev/referral/IDYLCO2615',
}) => {
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

  if (!isOpen) return null;

  const handleUpgradeClick = () => {
    window.open(upgradeUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'color-mix(in srgb, var(--color-panel-bg) 80%, transparent)',
          zIndex: 10000,
          animation: 'fadeIn 0.2s ease-out',
        }}
      />

      {/* Popup */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '560px',
          maxWidth: '90vw',
          backgroundColor: 'var(--color-panel-bg)',
          border: '1px solid var(--color-panel-border)',
          borderRadius: '12px',
          zIndex: 10001,
          boxShadow: '0 8px 32px var(--color-panel-shadow)',
          animation: 'popupSlideIn 0.3s ease-out',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 24px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--color-panel-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '10px',
                backgroundColor: 'color-mix(in srgb, var(--color-panel-accent) 15%, transparent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-panel-accent)',
              }}
            >
              <Sparkles size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: 'var(--color-panel-text)',
                  margin: 0,
                  lineHeight: '28px',
                  marginBottom: '4px',
                }}
              >
                Upgrade to Professional
              </h2>
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--color-panel-text-secondary)',
                  margin: 0,
                  lineHeight: '20px',
                }}
              >
                $25 per member, per month
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: 'var(--color-panel-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
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
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <p
            style={{
              fontSize: '14px',
              color: 'var(--color-panel-text)',
              margin: 0,
              lineHeight: '20px',
            }}
          >
            The system mutation for inserting documents is only available on Convex Professional plans. 
            Upgrade to unlock this feature and many more advanced capabilities.
          </p>

          {/* Professional Plan Features Card */}
          <div
            style={{
              backgroundColor: 'var(--color-panel-bg-secondary)',
              border: '1px solid var(--color-panel-border)',
              borderRadius: '8px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--color-panel-text)',
                  margin: 0,
                  marginBottom: '12px',
                }}
              >
                Professional Plan Includes:
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                }}
              >
                <FeatureItem text="Everything in Starter" />
                <FeatureItem text="120 deployments" />
                <FeatureItem text="Higher included usage limits" />
                <FeatureItem text="Better performance" />
                <FeatureItem text="Email support" />
                <FeatureItem text="System mutations" />
              </div>
            </div>
            <div
              style={{
                padding: '12px',
                borderRadius: '6px',
                backgroundColor: 'color-mix(in srgb, var(--color-panel-warning) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--color-panel-warning) 20%, transparent)',
              }}
            >
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--color-panel-text-secondary)',
                  margin: 0,
                  lineHeight: '18px',
                  fontWeight: 500,
                }}
              >
                <strong style={{ color: 'var(--color-panel-text)' }}>
                  Usage-based pricing applies for usage above included limits
                </strong>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '20px 24px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            borderTop: '1px solid var(--color-panel-border)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid var(--color-panel-border)',
              background: 'var(--color-panel-bg-tertiary)',
              color: 'var(--color-panel-text)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
            }}
          >
            Maybe Later
          </button>
          <button
            onClick={handleUpgradeClick}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--color-panel-accent)',
              color: 'var(--color-panel-bg)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px color-mix(in srgb, var(--color-panel-accent) 20%, transparent)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-panel-accent-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-panel-accent)';
            }}
          >
            <span>Upgrade to Professional</span>
            <ExternalLink size={16} />
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes popupSlideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -48%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </>
  );
};

// Feature item component with checkmark
const FeatureItem: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}
  >
    <div
      style={{
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        backgroundColor: 'color-mix(in srgb, var(--color-panel-success) 15%, transparent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: 'var(--color-panel-success)',
      }}
    >
      <Check size={12} strokeWidth={3} />
    </div>
    <span
      style={{
        fontSize: '13px',
        color: 'var(--color-panel-text)',
        lineHeight: '18px',
      }}
    >
      {text}
    </span>
  </div>
);

