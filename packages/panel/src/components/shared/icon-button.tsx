import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface IconButtonProps {
  icon: LucideIcon;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  size?: number;
  'aria-label'?: string;
  className?: string;
  style?: React.CSSProperties;
  hoverBackgroundColor?: string;
  hoverColor?: string;
  defaultColor?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  onClick,
  size = 14,
  'aria-label': ariaLabel,
  className,
  style,
  hoverBackgroundColor = 'var(--color-panel-bg-tertiary)',
  hoverColor = 'var(--color-panel-text)',
  defaultColor = 'var(--color-panel-text-muted)',
}) => {
  const initialBackgroundColor = (style?.backgroundColor as string) || 'transparent';
  const initialTextColor = (style?.color as string) || defaultColor;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '24px',
        height: '24px',
        padding: 0,
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'all 0.2s',
        ...style,
        color: initialTextColor,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = hoverColor;
        e.currentTarget.style.backgroundColor = hoverBackgroundColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = initialTextColor;
        e.currentTarget.style.backgroundColor = initialBackgroundColor;
      }}
    >
      <Icon size={size} />
    </button>
  );
};
