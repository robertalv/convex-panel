import React, { useState } from 'react';

export const TooltipAction: React.FC<{ 
  icon: React.ReactNode; 
  text: string; 
  onClick?: () => void 
}> = ({ icon, text, onClick }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div 
      style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button 
        onClick={onClick} 
        style={{ 
          cursor: 'pointer', 
          color: '#9ca3af', 
          background: 'none',
          border: 'none',
          padding: 0,
          display: 'flex',
          alignItems: 'center'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; }}
      >
        {icon}
      </button>
      {showTooltip && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: '100%',
          marginTop: '8px',
          marginRight: '-8px',
          padding: '8px 12px',
          backgroundColor: '#0F1115',
          border: '1px solid #2D313A',
          color: '#d1d5db',
          fontSize: '12px',
          borderRadius: '4px',
          opacity: showTooltip ? 1 : 0,
          transition: 'opacity 0.2s',
          pointerEvents: 'none',
          zIndex: 50,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
          width: '192px',
          textAlign: 'center',
          lineHeight: '1.5'
        }}>
          {text}
          <div style={{
            position: 'absolute',
            top: '-4px',
            right: '12px',
            width: '8px',
            height: '8px',
            backgroundColor: '#0F1115',
            borderTop: '1px solid #2D313A',
            borderLeft: '1px solid #2D313A',
            transform: 'rotate(45deg)'
          }}></div>
        </div>
      )}
    </div>
  );
};

