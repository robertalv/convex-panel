import React, { useState, useEffect } from 'react';
import { SettingsSidebar, type SettingsSection } from './components/settings-sidebar';
import { EnvironmentVariables } from './components/environment-variables';
import { UrlDeployKey } from './components/url-deploy-key';
import { Authentication } from './components/authentication';
import { Components } from './components/components';
import { BackupRestore } from './components/backup-restore';
import { Integrations } from './components/integrations';
import { PauseDeployment } from './components/pause-deployment';
import { getStorageItem, setStorageItem } from '../../utils/storage';
import { STORAGE_KEYS } from '../../utils/constants';

export interface SettingsViewProps {
  adminClient?: any;
  accessToken?: string;
  teamAccessToken?: string;
  deploymentUrl?: string;
}

const DEFAULT_SECTION: SettingsSection = 'environment-variables';

export const SettingsView: React.FC<SettingsViewProps> = ({
  adminClient,
  accessToken,
  teamAccessToken,
  deploymentUrl,
}) => {
  const [selectedSection, setSelectedSection] = useState<SettingsSection>(() => {
    if (typeof window !== 'undefined') {
      return getStorageItem<SettingsSection>(STORAGE_KEYS.SETTINGS_SECTION, DEFAULT_SECTION);
    }
    return DEFAULT_SECTION;
  });

  useEffect(() => {
    if (selectedSection) {
      setStorageItem(STORAGE_KEYS.SETTINGS_SECTION, selectedSection);
    }
  }, [selectedSection]);

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
      case 'url-deploy-key':
        return (
          <UrlDeployKey
            adminClient={adminClient}
            accessToken={accessToken}
            deploymentUrl={deploymentUrl}
          />
        );
      case 'authentication':
        return (
          <Authentication adminClient={adminClient} />
        );
      case 'components':
        return (
          <Components
            adminClient={adminClient}
            accessToken={accessToken}
            deploymentUrl={deploymentUrl}
          />
        );
      case 'backup-restore':
        return (
          <BackupRestore
            adminClient={adminClient}
            accessToken={accessToken}
            teamAccessToken={teamAccessToken}
            deploymentUrl={deploymentUrl}
            teamId={59354}
          />
        );
      case 'integrations':
        return (
          <Integrations />
        );
      case 'pause-deployment':
        return (
          <PauseDeployment
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
