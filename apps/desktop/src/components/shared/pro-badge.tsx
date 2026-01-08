import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePortalTarget } from '../../contexts/portal-context';
import { useThemeSafe } from '../../hooks/useTheme';

export const ProBadge: React.FC<{ tooltip?: string }> = ({ tooltip }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const portalTarget = usePortalTarget();
  const { theme } = useThemeSafe();

  useEffect(() => {
    if (showTooltip && triggerRef.current && tooltip) {
      const updatePosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current?.getBoundingClientRect();
        const tooltipHeight = tooltipRect?.height || 60;
        const tooltipWidth = tooltipRect?.width || 280;
        const margin = 8;

        // Position tooltip above the badge, centered
        let left = rect.left + rect.width / 2 - tooltipWidth / 2;
        let top = rect.top - tooltipHeight - margin - 4; // 4px for arrow

        // Ensure tooltip doesn't go off screen horizontally
        if (left < margin) {
          left = margin;
        }
        if (left + tooltipWidth > window.innerWidth - margin) {
          left = window.innerWidth - tooltipWidth - margin;
        }

        // Ensure tooltip doesn't go off top edge
        if (top < margin) {
          top = margin;
        }

        setTooltipPosition({
          top,
          left,
        });
      };

      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          updatePosition();
          // Update again after tooltip renders to get accurate dimensions
          setTimeout(updatePosition, 10);
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
  }, [showTooltip, tooltip]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={() => tooltip && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          display: 'inline-flex',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: '#2563eb',
            color: 'white',
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            lineHeight: 1,
          }}
        >
          PRO
        </span>
      </div>
      {showTooltip && tooltip && tooltipPosition && portalTarget && (
        createPortal(
          <div
            ref={tooltipRef}
            className={`cp-theme-${theme} cp-tooltip-action-tooltip`}
            data-placement="top"
            style={{
              position: 'fixed',
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              opacity: showTooltip ? 1 : 0,
              minWidth: '192px',
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            {tooltip}
            <div
              className="cp-tooltip-action-arrow"
              style={{
                right: 'auto',
                left: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
              }}
            />
          </div>,
          portalTarget
        )
      )}
    </>
  );
};


