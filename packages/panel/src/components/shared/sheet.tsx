import React, { useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: string;
  height?: string;
  maxHeight?: string;
  minHeight?: string;
  container?: HTMLElement | null;
  fullscreen?: boolean;
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  children,
  width = '500px',
  height,
  maxHeight,
  minHeight,
  container,
  fullscreen = false,
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
  const hasHeightConstraints = Boolean(height || maxHeight || minHeight);

  const sheetContent = (
    <>
      {/* Sheet */}
      <div
        style={{
          position: positionType,
          top: 0,
          left: fullscreen && isInContainer ? 0 : undefined,
          right: 0,
          bottom: 0,
          width: fullscreen && isInContainer ? '100%' : (fullscreen ? '100vw' : width),
          maxWidth: fullscreen && isInContainer ? '100%' : (fullscreen ? '100vw' : (isInContainer ? '50vw' : '90vw')),
          height: fullscreen && isInContainer ? '100%' : (fullscreen ? '100vh' : (hasHeightConstraints ? height : undefined)),
          maxHeight: fullscreen && isInContainer ? '100%' : (fullscreen ? '100vh' : (hasHeightConstraints ? maxHeight : undefined)),
          minHeight: fullscreen && isInContainer ? '100%' : (fullscreen ? '100vh' : (hasHeightConstraints ? minHeight : undefined)),
          backgroundColor: 'var(--color-panel-bg-secondary)',
          borderLeft: fullscreen && isInContainer ? 'none' : '1px solid var(--color-panel-border)',
          zIndex: fullscreen ? 99999 : 10000,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: fullscreen && isInContainer ? undefined : (isInContainer ? undefined : '-4px 0 24px var(--color-panel-shadow)'),
          animation: 'slideInRight 0.3s ease-out',
        }}
      >

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

