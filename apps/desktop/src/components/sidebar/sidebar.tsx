import React from 'react';
import type { TabId } from '../../types/tabs';
import { SidebarItem } from './sidebar-item';
import { TAB_DEFINITIONS } from './tab-definitions';

export interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  // Separate settings tab from other tabs
  const settingsTab = TAB_DEFINITIONS.find(tab => tab.id === 'settings');
  const otherTabs = TAB_DEFINITIONS.filter(tab => tab.id !== 'settings');

  return (
    <div className="cp-sidebar">
      <div className="cp-sidebar-main">
        {otherTabs.map((tab) => (
          <SidebarItem
            key={tab.id}
            icon={tab.icon}
            label={tab.label}
            isActive={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          />
        ))}
      </div>
      {settingsTab && (
        <div className="cp-sidebar-footer">
          <SidebarItem
            key={settingsTab.id}
            icon={settingsTab.icon}
            label={settingsTab.label}
            isActive={activeTab === settingsTab.id}
            onClick={() => onTabChange(settingsTab.id)}
          />
        </div>
      )}
    </div>
  );
};

