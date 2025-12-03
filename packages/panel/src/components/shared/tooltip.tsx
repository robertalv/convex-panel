import React, { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { usePortalTarget } from '../../contexts/portal-context';

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
          top = rect.top - tooltipHeight - margin - 4; // 4px for arrow
        } else if (position === 'bottom') {
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          top = rect.bottom + margin + 4;
        } else if (position === 'left') {
          left = rect.left - tooltipWidth - margin - 4;
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
        } else {
          // right
          left = rect.right + margin + 4;
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
        initialTop = rect.top - estimatedHeight - margin - 4;
      } else if (position === 'bottom') {
        initialLeft = rect.left + rect.width / 2 - estimatedWidth / 2;
        initialTop = rect.bottom + margin + 4;
      } else if (position === 'left') {
        initialLeft = rect.left - estimatedWidth - margin - 4;
        initialTop = rect.top + rect.height / 2 - estimatedHeight / 2;
      } else {
        initialLeft = rect.right + margin + 4;
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

  const getArrowStyle = () => {
    if (position === 'top') {
      return {
        position: 'absolute' as const,
        bottom: '-4px',
        left: '50%',
        transform: 'translateX(-50%) rotate(45deg)',
        width: '8px',
        height: '8px',
        backgroundColor: 'var(--color-panel-bg-tertiary)',
        borderBottom: '1px solid var(--color-panel-border)',
        borderRight: '1px solid var(--color-panel-border)',
      };
    } else if (position === 'bottom') {
      return {
        position: 'absolute' as const,
        top: '-4px',
        left: '50%',
        transform: 'translateX(-50%) rotate(45deg)',
        width: '8px',
        height: '8px',
        backgroundColor: 'var(--color-panel-bg-tertiary)',
        borderTop: '1px solid var(--color-panel-border)',
        borderLeft: '1px solid var(--color-panel-border)',
      };
    } else if (position === 'left') {
      return {
        position: 'absolute' as const,
        right: '-4px',
        top: '50%',
        transform: 'translateY(-50%) rotate(45deg)',
        width: '8px',
        height: '8px',
        backgroundColor: 'var(--color-panel-bg-tertiary)',
        borderTop: '1px solid var(--color-panel-border)',
        borderRight: '1px solid var(--color-panel-border)',
      };
    } else {
      return {
        position: 'absolute' as const,
        left: '-4px',
        top: '50%',
        transform: 'translateY(-50%) rotate(45deg)',
        width: '8px',
        height: '8px',
        backgroundColor: 'var(--color-panel-bg-tertiary)',
        borderBottom: '1px solid var(--color-panel-border)',
        borderLeft: '1px solid var(--color-panel-border)',
      };
    }
  };

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
            style={{
              position: 'fixed',
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              padding: '12px 16px',
              backgroundColor: 'var(--color-panel-bg-tertiary)',
              border: '1px solid var(--color-panel-border)',
              color: 'var(--color-panel-text)',
              fontSize: '12px',
              borderRadius: '6px',
              transition: 'opacity 0.2s',
              pointerEvents: 'auto',
              zIndex: 99999,
              boxShadow: '0 10px 15px -3px var(--color-panel-shadow)',
              minWidth: '200px',
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
            <div style={getArrowStyle()} />
          </div>,
          portalTarget
        )
      )}
    </>
  );
};
