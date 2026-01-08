import React, { useEffect, useState, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

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
  /**
   * Render mode for the sheet:
   * - 'portal': Uses createPortal to render the sheet (default, used for overlays)
   * - 'inline': Renders directly without portal (used for push-aside layouts in desktop)
   */
  renderMode?: "portal" | "inline";
}

const ANIMATION_DURATION = 250; // ms

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  children,
  width = "500px",
  height,
  maxHeight,
  minHeight,
  container,
  fullscreen = false,
  renderMode = "portal",
}) => {
  // Track whether the sheet is visible (for animation purposes)
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle open/close state changes with animation
  useEffect(() => {
    if (isOpen) {
      // Clear any pending close timeout
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      setIsClosing(false);
      setIsVisible(true);
    } else if (isVisible) {
      // Start closing animation
      setIsClosing(true);
      closeTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, ANIMATION_DURATION);
    }

    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, [isOpen, isVisible]);

  // Prevent body scroll when sheet is open (only if not in container and not inline)
  useEffect(() => {
    if (!container && isVisible && renderMode === "portal") {
      document.body.style.overflow = "hidden";
    } else if (!container && renderMode === "portal") {
      document.body.style.overflow = "";
    }
    return () => {
      if (!container && renderMode === "portal") {
        document.body.style.overflow = "";
      }
    };
  }, [isVisible, container, renderMode]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Don't render if not visible
  if (!isVisible) return null;

  const isInContainer = Boolean(container);
  const isInline = renderMode === "inline";
  const portalTarget = container || document.body;
  const positionType = isInline
    ? "relative"
    : isInContainer
      ? "absolute"
      : "fixed";
  const hasHeightConstraints = Boolean(height || maxHeight || minHeight);

  // Determine animation class based on state
  const sheetAnimation = isClosing ? "slideOutRight" : "slideInRight";
  const backdropAnimation = isClosing ? "fadeOut" : "fadeIn";

  const sheetContent = (
    <>
      {/* Backdrop - only show when not in container and not inline */}
      {!isInContainer && !isInline && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: fullscreen ? 99998 : 9999,
            animation: `${backdropAnimation} ${ANIMATION_DURATION}ms ease-out forwards`,
          }}
        />
      )}

      {/* Sheet */}
      <div
        style={{
          position: positionType,
          top: isInline ? undefined : 0,
          left: isInline
            ? undefined
            : fullscreen && isInContainer
              ? 0
              : undefined,
          right: isInline ? undefined : 0,
          bottom: isInline ? undefined : 0,
          width: isInline
            ? width
            : fullscreen && isInContainer
              ? "100%"
              : fullscreen
                ? "100vw"
                : width,
          minWidth: isInline ? width : undefined,
          maxWidth: isInline
            ? width
            : fullscreen && isInContainer
              ? "100%"
              : fullscreen
                ? "100vw"
                : isInContainer
                  ? "50vw"
                  : "90vw",
          height: isInline
            ? "100%"
            : fullscreen && isInContainer
              ? "100%"
              : fullscreen
                ? "100vh"
                : hasHeightConstraints
                  ? height
                  : undefined,
          maxHeight: isInline
            ? undefined
            : fullscreen && isInContainer
              ? "100%"
              : fullscreen
                ? "100vh"
                : hasHeightConstraints
                  ? maxHeight
                  : undefined,
          minHeight: isInline
            ? undefined
            : fullscreen && isInContainer
              ? "100%"
              : fullscreen
                ? "100vh"
                : hasHeightConstraints
                  ? minHeight
                  : undefined,
          backgroundColor: "var(--color-panel-bg-secondary)",
          borderLeft: "1px solid var(--color-panel-border)",
          zIndex: isInline ? undefined : fullscreen ? 99999 : 10000,
          display: "flex",
          flexDirection: "column",
          flexShrink: isInline ? 0 : undefined,
          boxShadow: isInline
            ? undefined
            : fullscreen && isInContainer
              ? undefined
              : isInContainer
                ? undefined
                : "-4px 0 24px var(--color-panel-shadow)",
          animation: `${sheetAnimation} ${ANIMATION_DURATION}ms ease-out forwards`,
        }}
      >
        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            backgroundColor: "var(--color-panel-bg-secondary)",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
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

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
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

        @keyframes slideOutRight {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(100%);
          }
        }
      `}</style>
    </>
  );

  // For inline mode, render directly without portal
  if (isInline) {
    return sheetContent;
  }

  return createPortal(sheetContent, portalTarget);
};
