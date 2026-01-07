/**
 * ConfirmDialog Component
 * A modal dialog for confirming destructive or important actions
 */

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Info } from "lucide-react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  disableCancel?: boolean;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  disableCancel = false,
  isLoading = false,
}: ConfirmDialogProps) {
  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !disableCancel) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, disableCancel]);

  if (!isOpen) return null;

  const variantColors = {
    danger: {
      icon: "var(--color-error-base)",
      button: "var(--color-error-base)",
      buttonHover: "color-mix(in srgb, var(--color-error-base) 90%, black)",
    },
    warning: {
      icon: "var(--color-warning-base)",
      button: "var(--color-warning-base)",
      buttonHover: "color-mix(in srgb, var(--color-warning-base) 90%, black)",
    },
    info: {
      icon: "var(--color-brand-base)",
      button: "var(--color-brand-base)",
      buttonHover: "color-mix(in srgb, var(--color-brand-base) 90%, black)",
    },
  };

  const colors = variantColors[variant];
  const IconComponent = variant === "info" ? Info : AlertTriangle;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={disableCancel ? undefined : onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
          zIndex: 100000,
          animation: "fadeIn 0.2s ease-out",
        }}
      />

      {/* Dialog */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "420px",
          maxWidth: "90vw",
          backgroundColor: "var(--color-surface-raised)",
          border: "1px solid var(--color-border-base)",
          borderRadius: "12px",
          zIndex: 100001,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          animation: "popupSlideIn 0.3s ease-out",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <div
            style={{
              color: colors.icon,
              flexShrink: 0,
              marginTop: "2px",
            }}
          >
            <IconComponent size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--color-text-base)",
                marginBottom: "4px",
              }}
            >
              {title}
            </h3>
            {typeof message === "string" ? (
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: "var(--color-text-muted)",
                  lineHeight: "1.5",
                }}
              >
                {message}
              </p>
            ) : (
              <div
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: "var(--color-text-muted)",
                  lineHeight: "1.5",
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
            padding: "16px 24px 24px",
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={disableCancel || isLoading}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: 500,
              backgroundColor: "transparent",
              border: "1px solid var(--color-border-base)",
              borderRadius: "8px",
              color: "var(--color-text-base)",
              cursor: disableCancel || isLoading ? "not-allowed" : "pointer",
              transition: "background 0.15s",
              opacity: disableCancel || isLoading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!disableCancel && !isLoading) {
                e.currentTarget.style.backgroundColor =
                  "var(--color-surface-raised)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
            }}
            disabled={isLoading}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: 500,
              backgroundColor: colors.button,
              border: "none",
              borderRadius: "8px",
              color: "white",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "background 0.15s",
              opacity: isLoading ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = colors.buttonHover;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.button;
            }}
          >
            {isLoading && (
              <span
                style={{
                  width: "14px",
                  height: "14px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "white",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
            )}
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

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>,
    document.body,
  );
}

export default ConfirmDialog;
