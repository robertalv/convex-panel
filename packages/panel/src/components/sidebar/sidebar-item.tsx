import React, { useState } from 'react';

export interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, isActive, onClick }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="cp-sidebar-item-wrapper"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {isActive && <div className="cp-sidebar-active-indicator" />}
      <button
        type="button"
        onClick={onClick}
        className={`cp-sidebar-btn ${isActive ? 'active' : ''}`}
      >
        {icon}
      </button>
      {showTooltip && <div className="cp-tooltip">{label}</div>}
    </div>
  );
};

