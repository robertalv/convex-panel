import React from 'react';

export type SettingsSection = 'environment-variables';

export interface SettingsSidebarProps {
  selectedSection: SettingsSection;
  onSectionSelect: (section: SettingsSection) => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  selectedSection,
  onSectionSelect,
}) => {
  const sections: Array<{ id: SettingsSection; label: string }> = [
    { id: 'environment-variables', label: 'Environment Variables' },
  ];

  return (
    <div className="cp-components-sidebar">
      {/* Sections */}
      <div className="cp-components-categories">
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 0 8px 0',
          gap: '8px',
        }}>
          {sections.map((section) => (
            <div
              key={section.id}
              onClick={() => onSectionSelect(section.id)}
              style={{
                padding: '6px 12px',
                margin: '0 8px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: selectedSection === section.id ? 'var(--color-panel-bg-tertiary)' : 'transparent',
                color: selectedSection === section.id ? 'var(--color-panel-text)' : 'var(--color-panel-text-secondary)',
                transition: 'background-color 0.15s ease, opacity 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (selectedSection !== section.id) {
                  e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                  e.currentTarget.style.opacity = '0.8';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedSection !== section.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.opacity = '1';
                }
              }}
            >
              {section.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
