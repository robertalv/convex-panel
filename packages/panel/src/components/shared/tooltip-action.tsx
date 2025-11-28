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
        className="cp-tooltip-action-btn"
      >
        {icon}
      </button>
      {showTooltip && (
        <div className="cp-tooltip-action-tooltip" style={{ opacity: showTooltip ? 1 : 0 }}>
          {text}
          <div className="cp-tooltip-action-arrow"></div>
        </div>
      )}
    </div>
  );
};

