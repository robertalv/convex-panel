import React, { useState } from 'react';

export const Tooltip: React.FC<{
  text: string;
  children: React.ReactNode;
  side?: 'left' | 'right' | 'top' | 'bottom';
}> = ({ text, children, side = 'bottom' }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getTooltipStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      padding: '8px 12px',
      backgroundColor: 'var(--color-panel-bg-tertiary)',
      border: '1px solid var(--color-panel-border)',
      color: 'var(--color-panel-text)',
      fontSize: '12px',
      borderRadius: '4px',
      opacity: showTooltip ? 1 : 0,
      transition: 'opacity 0.2s',
      pointerEvents: 'none',
      zIndex: 50,
      boxShadow: '0 10px 15px -3px var(--color-panel-shadow)',
      whiteSpace: 'nowrap',
      lineHeight: '1.5',
    };

    switch (side) {
      case 'left':
        return {
          ...baseStyle,
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginRight: '8px',
        };
      case 'right':
        return {
          ...baseStyle,
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: '8px',
        };
      case 'top':
        return {
          ...baseStyle,
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px',
        };
      case 'bottom':
      default:
        return {
          ...baseStyle,
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '8px',
        };
    }
  };

  const getArrowStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      width: '8px',
      height: '8px',
      backgroundColor: 'var(--color-panel-bg-tertiary)',
      borderTop: '1px solid var(--color-panel-border)',
      borderLeft: '1px solid var(--color-panel-border)',
    };

    switch (side) {
      case 'left':
        return {
          ...baseStyle,
          right: '-4px',
          top: '50%',
          transform: 'translateY(-50%) rotate(45deg)',
        };
      case 'right':
        return {
          ...baseStyle,
          left: '-4px',
          top: '50%',
          transform: 'translateY(-50%) rotate(45deg)',
        };
      case 'top':
        return {
          ...baseStyle,
          bottom: '-4px',
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
        };
      case 'bottom':
      default:
        return {
          ...baseStyle,
          top: '-4px',
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
        };
    }
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      {showTooltip && (
        <div style={getTooltipStyle()}>
          {text}
          <div style={getArrowStyle()}></div>
        </div>
      )}
    </div>
  );
};

