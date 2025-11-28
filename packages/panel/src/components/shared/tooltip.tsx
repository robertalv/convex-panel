import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  maxWidth?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  delay = 500,
  placement = 'bottom',
  maxWidth = '400px',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number; transform: string } | null>(null);
  const timerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const calculatePosition = () => {
    if (!triggerRef.current) return null;
    
    // Get the trigger element's position relative to the viewport
    const rect = triggerRef.current.getBoundingClientRect();
    
    // Check if element is actually visible in viewport
    if (rect.width === 0 && rect.height === 0) return null;
    
    // Get tooltip dimensions - use defaults if not yet measured
    const tooltipRect = tooltipRef.current?.getBoundingClientRect();
    const tooltipWidth = tooltipRect && tooltipRect.width > 0 ? tooltipRect.width : 400;
    const tooltipHeight = tooltipRect && tooltipRect.height > 0 ? tooltipRect.height : 200;
    
    let x = 0;
    let y = 0;
    let transform = '';

    switch (placement) {
      case 'bottom':
        x = rect.left + rect.width / 2;
        y = rect.bottom + 8;
        transform = 'translateX(-50%)';
        break;
      case 'top':
        x = rect.left + rect.width / 2;
        y = rect.top - 8;
        transform = 'translateX(-50%) translateY(-100%)';
        break;
      case 'right':
        x = rect.right + 8;
        y = rect.top;
        transform = '';
        break;
      case 'left':
        x = rect.left - 8;
        y = rect.top;
        transform = 'translateX(-100%)';
        break;
    }

    // Clamp to viewport with better margins
    const margin = 12;
    
    // For right placement, ensure tooltip doesn't go off right edge
    if (placement === 'right') {
      // If tooltip would go off screen on the right, try left side instead
      if (x + tooltipWidth > window.innerWidth - margin) {
        x = rect.left - 8;
        transform = 'translateX(-100%)';
        // If left side also goes off screen, position at right edge
        if (x - tooltipWidth < margin) {
          x = window.innerWidth - tooltipWidth - margin;
          transform = '';
        }
      } else {
        // Ensure we don't go off left edge
        x = Math.max(margin, x);
      }
    }
    
    // For left placement, ensure tooltip doesn't go off left edge
    if (placement === 'left') {
      const minX = margin;
      if (x - tooltipWidth < minX) {
        x = rect.right + 8;
        transform = '';
        // If right side also goes off screen, position at left edge
        if (x + tooltipWidth > window.innerWidth - margin) {
          x = margin;
          transform = '';
        }
      }
    }
    
    // Ensure vertical position stays within viewport
    const maxY = window.innerHeight - tooltipHeight - margin;
    y = Math.max(margin, Math.min(y, maxY));

    return { x, y, transform };
  };

  const handleMouseEnter = () => {
    clearTimer();
    clearCloseTimer(); // Cancel any pending close
    timerRef.current = window.setTimeout(() => {
      setIsVisible(true);
      // Calculate position after a brief delay to ensure DOM is ready
      requestAnimationFrame(() => {
        const initialPos = calculatePosition();
        if (initialPos) {
          setPosition(initialPos);
        }
      });
    }, delay);
  };

  const handleMouseLeave = () => {
    clearTimer();
    // Add a small delay before closing to allow moving to tooltip
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setIsVisible(false);
      setPosition(null);
    }, 100); // 100ms delay to allow moving from trigger to tooltip
  };

  const handleTooltipMouseEnter = () => {
    clearCloseTimer(); // Cancel any pending close
    setIsVisible(true);
    const pos = calculatePosition();
    if (pos) setPosition(pos);
  };

  const handleTooltipMouseLeave = () => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setIsVisible(false);
      setPosition(null);
    }, 100);
  };

  const handleTooltipClick = (e: React.MouseEvent) => {
    // Prevent clicks inside tooltip from closing it
    e.stopPropagation();
    // Keep tooltip open when clicking inside
    clearCloseTimer();
  };

  // Update position on scroll/resize and when tooltip becomes visible
  useEffect(() => {
    if (!isVisible) return;

    const updatePosition = () => {
      // Ensure tooltip ref is attached before calculating
      if (!tooltipRef.current || !triggerRef.current) return;
      const pos = calculatePosition();
      if (pos) {
        setPosition(pos);
      }
    };

    // Update position multiple times to account for content loading
    // Use multiple requestAnimationFrame calls to ensure tooltip is in DOM
    // The portal needs time to render the tooltip to document.body
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        updatePosition();
        // Continue updating as content loads
        const timeout1 = setTimeout(updatePosition, 10);
        const timeout2 = setTimeout(updatePosition, 50);
        const timeout3 = setTimeout(updatePosition, 150);
        const timeout4 = setTimeout(updatePosition, 300);
      });
    });
    
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      clearCloseTimer();
    };
  }, [isVisible, placement]);

  // Calculate position when visibility changes - render off-screen first to measure
  useEffect(() => {
    if (isVisible) {
      // First render off-screen to measure, then position
      const measureAndPosition = () => {
        if (!tooltipRef.current || !triggerRef.current) return;
        
        // Force a layout calculation by accessing getBoundingClientRect
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        
        // Now calculate the actual position
        const pos = calculatePosition();
        if (pos) {
          setPosition(pos);
        }
      };
      
      // Use multiple RAFs to ensure DOM is ready
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => {
          measureAndPosition();
        });
      });
      
      return () => {
        // Cleanup handled by RAF cancellation
      };
    }
  }, [isVisible]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearTimer();
      clearCloseTimer();
    };
  }, []);

  // Prevent document clicks from closing tooltip when clicking inside it
  useEffect(() => {
    if (!isVisible) return;

    const handleDocumentClick = (e: MouseEvent) => {
      // If click is inside tooltip, don't close it
      if (tooltipRef.current && tooltipRef.current.contains(e.target as Node)) {
        e.stopPropagation();
        clearCloseTimer();
        return;
      }
      // If click is outside both trigger and tooltip, close tooltip
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        setIsVisible(false);
        setPosition(null);
      }
    };

    // Use capture phase to catch clicks early
    document.addEventListener('click', handleDocumentClick, true);

    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, [isVisible]);

  const tooltipContent = isVisible ? (
    <div
      ref={tooltipRef}
      style={{
        position: 'fixed',
        left: position ? `${position.x}px` : '-9999px',
        top: position ? `${position.y}px` : '-9999px',
        transform: position?.transform || '',
        zIndex: 99999,
        pointerEvents: position ? 'auto' : 'none',
        maxWidth,
        opacity: position ? 1 : 0,
        transition: position ? 'opacity 0.15s ease-out' : 'none',
        visibility: position ? 'visible' : 'hidden',
        // Ensure tooltip is always on top and not clipped
        isolation: 'isolate',
        contain: 'layout style paint',
        // Always render (even off-screen) so we can measure it
        display: 'block',
      }}
      onMouseEnter={handleTooltipMouseEnter}
      onMouseLeave={handleTooltipMouseLeave}
      onClick={handleTooltipClick}
      onMouseDown={(e) => {
        // Don't stop propagation on mousedown - let child elements handle it
        // Only stop if it's not coming from an interactive element
        const target = e.target as HTMLElement;
        if (target.tagName === 'BUTTON' || target.closest('button')) {
          // Let button handle its own mousedown
          return;
        }
        e.stopPropagation();
      }}
      onFocus={(e) => {
        // Keep tooltip open when it receives focus
        clearCloseTimer();
        e.stopPropagation();
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-panel-bg-tertiary)',
          border: '1px solid var(--color-panel-border)',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 8px 24px var(--color-panel-shadow)',
          maxWidth: '100%',
          minWidth: '200px',
          minHeight: '50px',
          position: 'relative',
          zIndex: 99999,
        }}
      >
        {content}
      </div>
    </div>
  ) : null;

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ display: 'inline-flex', alignItems: 'center' }}
      >
        {children}
      </div>
      {typeof document !== 'undefined' && tooltipContent
        ? createPortal(tooltipContent, document.body)
        : tooltipContent}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};
