import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export const ProBadge: React.FC<{ tooltip?: string }> = ({ tooltip }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

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
        const left = rect.left + rect.width / 2 - tooltipWidth / 2;
        const top = rect.top - tooltipHeight - margin - 4; // 4px for arrow

        setTooltipPosition({
          top: Math.max(margin, top),
          left: Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin)),
        });
      };

      // Set initial position
      const rect = triggerRef.current.getBoundingClientRect();
      const estimatedWidth = 280;
      const estimatedHeight = 60;
      const margin = 8;

      const initialLeft = rect.left + rect.width / 2 - estimatedWidth / 2;
      const initialTop = rect.top - estimatedHeight - margin - 4;

      setTooltipPosition({
        top: Math.max(margin, initialTop),
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
      {showTooltip && tooltip && tooltipPosition && typeof document !== 'undefined' && (
        createPortal(
          <div
            ref={tooltipRef}
            style={{
              position: 'fixed',
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              padding: '8px 12px',
              backgroundColor: 'var(--color-panel-bg-tertiary)',
              border: '1px solid var(--color-panel-border)',
              color: 'var(--color-panel-text)',
              fontSize: '12px',
              borderRadius: '4px',
              transition: 'opacity 0.2s',
              pointerEvents: 'none',
              zIndex: 99999,
              boxShadow: '0 10px 15px -3px var(--color-panel-shadow)',
              minWidth: '192px',
              maxWidth: '300px',
              textAlign: 'center',
              lineHeight: '1.5',
              whiteSpace: 'normal',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            {tooltip}
            <div
              style={{
                position: 'absolute',
                bottom: '-4px',
                left: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
                width: '8px',
                height: '8px',
                backgroundColor: 'var(--color-panel-bg-tertiary)',
                borderBottom: '1px solid var(--color-panel-border)',
                borderRight: '1px solid var(--color-panel-border)',
              }}
            />
          </div>,
          document.body
        )
      )}
    </>
  );
};


