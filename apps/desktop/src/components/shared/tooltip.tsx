import React, { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { usePortalTarget } from '../../contexts/portal-context';
import { useThemeSafe } from '../../hooks/useTheme';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  maxWidth?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  maxWidth = 320,
  position = 'top',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const portalTarget = usePortalTarget();
  const { theme } = useThemeSafe();

  useEffect(() => {
    if (showTooltip && triggerRef.current) {
      const updatePosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current?.getBoundingClientRect();
        const tooltipHeight = tooltipRect?.height || 60;
        const tooltipWidth = tooltipRect?.width || maxWidth;
        const margin = 8;

        let left: number;
        let top: number;

        if (position === 'top') {
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          top = rect.top - tooltipHeight - margin;
        } else if (position === 'bottom') {
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          top = rect.bottom + margin;
        } else if (position === 'left') {
          left = rect.left - tooltipWidth - margin;
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
        } else {
          // right
          left = rect.right + margin;
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
        }

        setTooltipPosition({
          top: Math.max(margin, Math.min(top, window.innerHeight - tooltipHeight - margin)),
          left: Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin)),
        });
      };

      // Set initial position
      const rect = triggerRef.current.getBoundingClientRect();
      const estimatedWidth = maxWidth;
      const estimatedHeight = 60;
      const margin = 8;

      let initialLeft: number;
      let initialTop: number;

      if (position === 'top') {
        initialLeft = rect.left + rect.width / 2 - estimatedWidth / 2;
        initialTop = rect.top - estimatedHeight - margin;
      } else if (position === 'bottom') {
        initialLeft = rect.left + rect.width / 2 - estimatedWidth / 2;
        initialTop = rect.bottom + margin;
      } else if (position === 'left') {
        initialLeft = rect.left - estimatedWidth - margin;
        initialTop = rect.top + rect.height / 2 - estimatedHeight / 2;
      } else {
        initialLeft = rect.right + margin;
        initialTop = rect.top + rect.height / 2 - estimatedHeight / 2;
      }

      setTooltipPosition({
        top: Math.max(margin, Math.min(initialTop, window.innerHeight - estimatedHeight - margin)),
        left: Math.max(margin, Math.min(initialLeft, window.innerWidth - estimatedWidth - margin)),
      });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          updatePosition();
          setTimeout(updatePosition, 10);
          setTimeout(updatePosition, 50);
        });
      });

      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    } else {
      setTooltipPosition(null);
    }
  }, [showTooltip, maxWidth, position]);


  const handleTriggerMouseEnter = () => {
    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowTooltip(true);
  };

  const handleTriggerMouseLeave = () => {
    // Add a small delay before hiding to allow mouse to move to tooltip
    hideTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
      hideTimeoutRef.current = null;
    }, 100);
  };

  const handleTooltipMouseEnter = () => {
    // Clear any pending hide timeout when mouse enters tooltip
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowTooltip(true);
  };

  const handleTooltipMouseLeave = () => {
    setShowTooltip(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleTriggerMouseEnter}
        onMouseLeave={handleTriggerMouseLeave}
        style={{
          display: 'inline-flex',
        }}
      >
        {children}
      </div>
      {showTooltip && tooltipPosition && portalTarget && (
        createPortal(
          <div
            ref={tooltipRef}
            className={`cp-theme-${theme} cp-tooltip-content`}
            style={{
              position: 'fixed',
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              padding: '6px 10px',
              backgroundColor: 'var(--color-panel-bg-secondary)',
              border: '1px solid var(--color-panel-border)',
              color: 'var(--color-panel-text)',
              fontSize: '12px',
              borderRadius: '8px',
              transition: 'opacity 0.2s',
              pointerEvents: 'auto',
              zIndex: 99999,
              boxShadow: '0 10px 15px -3px var(--color-panel-shadow)',
              maxWidth: `${maxWidth}px`,
              lineHeight: '1.5',
              whiteSpace: 'normal',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            }}
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
          >
            {content}
          </div>,
          portalTarget
        )
      )}
    </>
  );
};
