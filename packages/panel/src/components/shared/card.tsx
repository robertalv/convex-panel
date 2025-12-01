import React from 'react';

export const Card: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  title?: string;
  action?: React.ReactNode
}> = ({ children, style, className, title, action }) => (
  <div className={`cp-card ${className || ''}`} style={style}>
    {(title || action) && (
      <div className="cp-card-header">
        {title && <h3 className="cp-card-title">{title.toUpperCase()}</h3>}
        <div className="cp-card-actions">
          {action}
        </div>
      </div>
    )}
    <div className="cp-card-content">
      {children}
    </div>
  </div>
);

