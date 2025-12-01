import React from 'react';
import { TabId } from '../../types/tabs';
import { SidebarItem } from './sidebar-item';
import { TAB_DEFINITIONS } from './tab-definitions';

export interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="cp-sidebar">
      {TAB_DEFINITIONS.map((tab) => (
        <SidebarItem
          key={tab.id}
          icon={tab.icon}
          label={tab.label}
          isActive={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
        />
      ))}
    </div>
  );
};

