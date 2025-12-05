import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { usePortalEnvironment } from '../../contexts/portal-context';
import { useThemeSafe } from '../../hooks/useTheme';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  disableCancel?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  disableCancel = false,
}) => {
  const { container, ownerDocument } = usePortalEnvironment();
  const portalTarget = container ?? ownerDocument?.body ?? null;
  const { theme } = useThemeSafe();
  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (!portalTarget || !ownerDocument?.body) return;
    if (isOpen) {
      ownerDocument.body.style.overflow = 'hidden';
    } else {
      ownerDocument.body.style.overflow = '';
    }
    return () => {
      ownerDocument.body.style.overflow = '';
    };
  }, [isOpen, ownerDocument, portalTarget]);

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

  const variantColors = {
    danger: {
      icon: 'var(--color-panel-error)',
      button: 'var(--color-panel-error)',
      buttonHover: 'color-mix(in srgb, var(--color-panel-error) 90%, black)',
    },
    warning: {
      icon: 'var(--color-panel-warning)',
      button: 'var(--color-panel-warning)',
      buttonHover: 'color-mix(in srgb, var(--color-panel-warning) 90%, black)',
    },
    info: {
      icon: 'var(--color-panel-accent)',
      button: 'var(--color-panel-accent)',
      buttonHover: 'color-mix(in srgb, var(--color-panel-accent) 90%, black)',
    },
  };

  const colors = variantColors[variant];

  return createPortal(
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
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 100000,
          animation: 'fadeIn 0.2s ease-out',
          pointerEvents: 'auto',
        }}
      />

      {/* Dialog */}
      <div
        className={`cp-theme-${theme}`}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '420px',
          maxWidth: '90vw',
          backgroundColor: 'var(--color-panel-bg-secondary)',
          border: '1px solid var(--color-panel-border)',
          borderRadius: '12px',
          zIndex: 100001,
          boxShadow: '0 8px 32px var(--color-panel-shadow)',
          animation: 'popupSlideIn 0.3s ease-out',
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <div
            style={{
              color: colors.icon,
              flexShrink: 0,
              marginTop: '2px',
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--color-panel-text)',
                marginBottom: '4px',
              }}
            >
              {title}
            </h3>
            {typeof message === 'string' ? (
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  color: 'var(--color-panel-text-muted)',
                  lineHeight: '1.5',
                }}
              >
                {message}
              </p>
            ) : (
              <div
                style={{
                  margin: 0,
                  fontSize: '14px',
                  color: 'var(--color-panel-text-muted)',
                  lineHeight: '1.5',
                }}
              >
                {message}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            padding: '16px 24px 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={disableCancel}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 500,
              backgroundColor: 'transparent',
              border: '1px solid var(--color-panel-border)',
              borderRadius: '8px',
              color: 'var(--color-panel-text)',
              cursor: disableCancel ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
              pointerEvents: 'auto',
              opacity: disableCancel ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!disableCancel) {
                e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 500,
              backgroundColor: colors.button,
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              transition: 'background 0.15s',
              pointerEvents: 'auto',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.buttonHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.button;
            }}
          >
            {confirmLabel}
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
    </>,
    portalTarget,
  );
};

