import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export const TooltipAction: React.FC<{ 
  icon: React.ReactNode; 
  text: string; 
  onClick?: () => void 
}> = ({ icon, text, onClick }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ 
    top: number; 
    right: number;
    placement: 'top' | 'bottom';
  } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showTooltip && triggerRef.current) {
      const updatePosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current?.getBoundingClientRect();
        const tooltipHeight = tooltipRect?.height || 80; // Estimate if not yet rendered
        const tooltipWidth = tooltipRect?.width || 200;
        const margin = 8;
        
        // Check if there's enough space below
        const spaceBelow = window.innerHeight - rect.bottom - margin;
        const spaceAbove = rect.top - margin;
        
        // Determine vertical placement
        let placement: 'top' | 'bottom' = 'bottom';
        let top: number;
        
        if (spaceBelow < tooltipHeight && spaceAbove > spaceBelow) {
          // Not enough space below, but more space above - flip to top
          placement = 'top';
          top = rect.top - tooltipHeight - margin;
        } else {
          // Default to bottom
          placement = 'bottom';
          top = rect.bottom + margin;
        }
        
        // Ensure tooltip doesn't go off top edge
        if (top < margin) {
          top = margin;
        }
        
        // Ensure tooltip doesn't go off bottom edge
        if (top + tooltipHeight > window.innerHeight - margin) {
          top = window.innerHeight - tooltipHeight - margin;
        }
        
        // Calculate horizontal position
        // Align tooltip to the right edge of the trigger (since trigger is typically on the right)
        let right: number = window.innerWidth - rect.right;
        
        // If tooltip would go off the right edge, align to left of trigger instead
        if (right < tooltipWidth + margin) {
          right = window.innerWidth - rect.left;
        }
        
        // Ensure tooltip doesn't go off screen horizontally
        if (right < margin) {
          right = margin;
        }
        if (window.innerWidth - right < tooltipWidth + margin) {
          right = window.innerWidth - tooltipWidth - margin;
        }
        
        setTooltipPosition({
          top,
          right,
          placement,
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
  }, [showTooltip]);

  return (
    <>
      <div 
        ref={triggerRef}
        style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <button 
          onClick={onClick} 
          className="cp-tooltip-action-btn"
        >
          {icon}
        </button>
      </div>
      {showTooltip && tooltipPosition && typeof document !== 'undefined' && (
        createPortal(
          <div 
            ref={tooltipRef}
            className="cp-tooltip-action-tooltip" 
            style={{ 
              opacity: showTooltip ? 1 : 0,
              position: 'fixed',
              top: `${tooltipPosition.top}px`,
              right: `${tooltipPosition.right}px`,
            }}
            data-placement={tooltipPosition.placement}
          >
            {text}
            <div 
              className="cp-tooltip-action-arrow" 
              style={{
                [tooltipPosition.placement === 'top' ? 'bottom' : 'top']: '-4px',
              }}
            />
          </div>,
          document.body
        )
      )}
    </>
  );
};

