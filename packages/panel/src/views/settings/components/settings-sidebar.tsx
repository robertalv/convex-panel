import React from 'react';

export type SettingsSection = 'environment-variables' | 'url-deploy-key' | 'authentication' | 'components' | 'backup-restore' | 'integrations' | 'pause-deployment' | 'ai-analysis';

export interface SettingsSidebarProps {
  selectedSection: SettingsSection;
  onSectionSelect: (section: SettingsSection) => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  selectedSection,
  onSectionSelect,
}) => {
  const sections: Array<{ id: SettingsSection; label: string }> = [
    { id: 'url-deploy-key', label: 'URL & Deploy Key' },
    { id: 'environment-variables', label: 'Environment Variables' },
    { id: 'authentication', label: 'Authentication' },
    { id: 'components', label: 'Components' },
    { id: 'backup-restore', label: 'Backup & Restore' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'pause-deployment', label: 'Pause Deployment' },
    { id: 'ai-analysis', label: 'AI Analysis' },
  ];

  return (
    <div className="cp-components-sidebar">
      {/* Sections */}
      <div className="cp-components-categories">
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px',
        }}>
          <div style={{ gap: '4px', display: 'flex', flexDirection: 'column', color: 'var(--color-panel-text-secondary)', fontSize: '12px' }}>
            {sections.map((section) => (
              <div
                key={section.id}
                onClick={() => onSectionSelect(section.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: selectedSection === section.id ? 'var(--color-panel-bg-tertiary)' : 'transparent',
                  color: selectedSection === section.id ? 'var(--color-panel-text)' : 'var(--color-panel-text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (selectedSection !== section.id) {
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = selectedSection === section.id ? 'var(--color-panel-bg-tertiary)' : 'transparent';
                }}
              >
                <span style={{ fontSize: '12px' }}>{section.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
