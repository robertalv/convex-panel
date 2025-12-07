import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { usePortalTarget } from '../../contexts/portal-context';

export interface DropdownPanelProps {
  isOpen: boolean;
  width?: number | string;
  maxHeight?: number;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  triggerRef?: React.RefObject<HTMLElement>;
}

export const DropdownPanel: React.FC<DropdownPanelProps> = ({
  isOpen,
  width,
  maxHeight = 300,
  children,
  className,
  style,
  triggerRef,
}) => {
  const portalTarget = usePortalTarget();
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && triggerRef?.current) {
      const updatePosition = () => {
        if (triggerRef.current && panelRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          const calculatedWidth = width 
            ? (typeof width === 'number' ? width : parseFloat(width)) 
            : rect.width;
          
          const finalWidth = Math.max(calculatedWidth, rect.width, 200);
          const viewportWidth = window.innerWidth;
          const viewportPadding = 16;
          
          const rightEdge = rect.left + finalWidth;
          const wouldOverflowRight = rightEdge > viewportWidth - viewportPadding;
          
          const leftEdgeIfFlipped = rect.right - finalWidth;
          const wouldOverflowLeft = leftEdgeIfFlipped < viewportPadding;
          
          let leftPosition: number;
          
          if (wouldOverflowRight && !wouldOverflowLeft) {
            leftPosition = rect.right - finalWidth;
          } else {
            leftPosition = rect.left;
          }
          
          leftPosition = Math.max(viewportPadding, leftPosition);
          
          const maxLeft = viewportWidth - finalWidth - viewportPadding;
          leftPosition = Math.min(leftPosition, maxLeft);

          setPosition({
            top: rect.bottom + 4,
            left: leftPosition,
            width: finalWidth,
          });
        }
      };

      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        updatePosition();
      });

      // Update position on scroll/resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    } else {
      setPosition(null);
    }
  }, [isOpen, triggerRef, width]);

  if (!isOpen) {
    return null;
  }

  const panelContent = (
    <div
      ref={panelRef}
      className={className}
      style={{
        position: triggerRef ? 'fixed' : 'absolute',
        ...(triggerRef && position
          ? {
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: `${Math.max(position.width, 200)}px`,
            }
          : {
              top: 'calc(100% + 4px)',
              left: 0,
              width: width ? (typeof width === 'number' ? `${Math.max(width, 200)}px` : width) : '100%',
            }),
        maxWidth: 'calc(100vw - 16px)',
        minWidth: '200px',
        backgroundColor: 'var(--color-panel-bg)',
        border: '1px solid var(--color-panel-border)',
        borderRadius: '6px',
        boxShadow: '0 4px 16px var(--color-panel-shadow)',
        zIndex: 100000,
        maxHeight: `${maxHeight}px`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'auto',
        ...style,
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );

  // Use portal when triggerRef is provided (for fixed positioning)
  if (triggerRef && portalTarget && position) {
    return createPortal(panelContent, portalTarget);
  }

  // Fall back to absolute positioning (backward compatibility)
  return panelContent;
};

