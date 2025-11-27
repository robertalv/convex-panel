import React from 'react';

export const Card: React.FC<{ 
  children: React.ReactNode; 
  style?: React.CSSProperties; 
  title?: string; 
  action?: React.ReactNode 
}> = ({ children, style, title, action }) => (
  <div style={{
    backgroundColor: '#1C1F26',
    border: '1px solid #2D313A',
    borderRadius: '8px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    ...style
  }}>
    {(title || action) && (
      <div style={{
        paddingLeft: '12px',
        paddingRight: '12px',
        borderBottom: '1px solid #2D313A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'default'
      }}>
        {title && <h3 style={{ fontSize: '10px', fontWeight: 500, color: '#e5e7eb' }}>{title.toUpperCase()}</h3>}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af' }}>
          {action}
        </div>
      </div>
    )}
    <div style={{ padding: '12px', flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  </div>
);

