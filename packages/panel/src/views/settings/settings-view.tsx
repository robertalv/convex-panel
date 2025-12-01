import React, { useState } from 'react';
import { SettingsSidebar, SettingsSection } from './components/settings-sidebar';
import { EnvironmentVariables } from './components/environment-variables';

export interface SettingsViewProps {
  adminClient?: any;
  accessToken?: string;
  deploymentUrl?: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  adminClient,
  accessToken,
  deploymentUrl,
}) => {
  const [selectedSection, setSelectedSection] = useState<SettingsSection>('environment-variables');

  const renderSection = () => {
    switch (selectedSection) {
      case 'environment-variables':
        return (
          <EnvironmentVariables
            adminClient={adminClient}
            accessToken={accessToken}
            deploymentUrl={deploymentUrl}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="cp-components-view">
      <SettingsSidebar selectedSection={selectedSection} onSectionSelect={setSelectedSection} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {renderSection()}
      </div>
    </div>
  );
};
