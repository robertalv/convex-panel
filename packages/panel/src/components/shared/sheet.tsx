import React, { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: string;
  container?: HTMLElement | null;
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = '500px',
  container,
}) => {
  // Prevent body scroll when sheet is open (only if not in container)
  useEffect(() => {
    if (!container && isOpen) {
      document.body.style.overflow = 'hidden';
    } else if (!container) {
      document.body.style.overflow = '';
    }
    return () => {
      if (!container) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen, container]);

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

  const isInContainer = Boolean(container);
  const portalTarget = container || document.body;
  const positionType = isInContainer ? 'absolute' : 'fixed';

  const sheetContent = (
    <>
      {/* Backdrop - only show when not in container */}
      {!isInContainer && (
        <div
          onClick={onClose}
          style={{
            position: positionType,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'color-mix(in srgb, var(--color-panel-bg) 80%, transparent)',
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease-out',
          }}
        />
      )}

      {/* Sheet */}
      <div
        style={{
          position: positionType,
          top: 0,
          right: 0,
          bottom: 0,
          width: width,
          maxWidth: isInContainer ? '100%' : '90vw',
          backgroundColor: 'var(--color-panel-bg-secondary)',
          borderLeft: '1px solid var(--color-panel-border)',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 24px var(--color-panel-shadow)',
          animation: 'slideInRight 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--color-panel-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: '56px',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--color-panel-text)',
              }}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-panel-text-muted)',
                borderRadius: '4px',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                e.currentTarget.style.color = 'var(--color-panel-text)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--color-panel-text-muted)';
              }}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: 'var(--color-panel-bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {children}
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

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );

  return createPortal(sheetContent, portalTarget);
};

