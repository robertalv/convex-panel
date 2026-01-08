import React, { useState, useEffect } from 'react';

export interface FilterHistorySettingsProps {
  adminClient?: any;
  isFilterHistoryInstalled: boolean;
}

export const FilterHistorySettings: React.FC<FilterHistorySettingsProps> = ({
  adminClient,
  isFilterHistoryInstalled,
}) => {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [retentionHours, setRetentionHours] = useState<number>(24);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    // Load current settings from backend
    if (adminClient && isFilterHistoryInstalled) {
      loadSettings();
    } else {
      setIsLoading(false);
    }
  }, [adminClient, isFilterHistoryInstalled]);

  const loadSettings = async () => {
    if (!adminClient) return;

    setIsLoading(true);
    try {
      const settings = await adminClient.query('filterHistory:getCleanupSettings' as any, {});
      if (settings) {
        setEnabled(settings.enabled || false);
        setRetentionHours(settings.retentionHours || 24);
      }
    } catch (error: any) {
      console.error('Failed to load cleanup settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isFilterHistoryInstalled || !adminClient) return;
    
    setIsSaving(true);
    setSaveMessage(null);

    try {
      await adminClient.mutation('filterHistory:setCleanupSettings' as any, {
        enabled,
        retentionHours,
      });
      setSaveMessage('Settings saved successfully');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      setSaveMessage(`Error saving settings: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isFilterHistoryInstalled) {
    return (
      <div style={{
        padding: '24px',
        backgroundColor: 'var(--color-panel-bg)',
        border: '1px solid var(--color-panel-border)',
        borderRadius: '8px',
        marginBottom: '16px',
      }}>
        <p style={{
          margin: 0,
          color: 'var(--color-panel-text-secondary)',
          fontSize: '14px',
        }}>
          Filter history settings are only available when the convex-component (filterHistory) is installed.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px',
      backgroundColor: 'var(--color-panel-bg)',
      border: '1px solid var(--color-panel-border)',
      borderRadius: '8px',
      marginBottom: '16px',
    }}>
      <h3 style={{
        margin: '0 0 16px 0',
        fontSize: '16px',
        fontWeight: 600,
        color: 'var(--color-panel-text)',
      }}>
        Filter History Cleanup
      </h3>
      
      <p style={{
        margin: '0 0 16px 0',
        color: 'var(--color-panel-text-secondary)',
        fontSize: '14px',
        lineHeight: '1.5',
      }}>
        Enable automatic cleanup of old filter history states. 
        Old filter states are automatically removed by a scheduled job that runs every 6 hours.
      </p>

      {isLoading ? (
        <div style={{
          padding: '16px',
          textAlign: 'center',
          color: 'var(--color-panel-text-secondary)',
          fontSize: '14px',
        }}>
          Loading settings...
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '16px',
        }}>
          {/* Enable Cleanup Checkbox */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={!isFilterHistoryInstalled}
              style={{
                width: '16px',
                height: '16px',
                cursor: isFilterHistoryInstalled ? 'pointer' : 'not-allowed',
              }}
            />
            <span style={{
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--color-panel-text)',
            }}>
              I want to delete old filter histories
            </span>
          </label>

          {/* Retention Period Input */}
          {enabled && (
            <label style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              <span style={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--color-panel-text)',
              }}>
                Delete filter histories older than:
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <input
                  type="number"
                  min="1"
                  max="720"
                  step="1"
                  value={retentionHours}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    if (!isNaN(value) && value > 0) {
                      setRetentionHours(value);
                    }
                  }}
                  disabled={!isFilterHistoryInstalled || !enabled}
                  style={{
                    width: '100px',
                    padding: '6px 10px',
                    fontSize: '13px',
                    backgroundColor: enabled ? 'var(--color-panel-bg-tertiary)' : 'var(--color-panel-bg)',
                    border: '1px solid var(--color-panel-border)',
                    borderRadius: '4px',
                    color: 'var(--color-panel-text)',
                    fontFamily: 'monospace',
                    opacity: enabled ? 1 : 0.5,
                  }}
                />
                <span style={{
                  fontSize: '13px',
                  color: 'var(--color-panel-text-secondary)',
                }}>
                  hours
                </span>
                <span style={{
                  fontSize: '12px',
                  color: 'var(--color-panel-text-muted)',
                  marginLeft: '8px',
                }}>
                  (Minimum: 1 hour)
                </span>
              </div>
            </label>
          )}

          {saveMessage && (
            <div style={{
              padding: '8px 12px',
              fontSize: '12px',
              backgroundColor: saveMessage.includes('Error') 
                ? 'color-mix(in srgb, var(--color-panel-error) 20%, transparent)'
                : 'color-mix(in srgb, var(--color-panel-success) 20%, transparent)',
              border: `1px solid ${saveMessage.includes('Error') ? 'var(--color-panel-error)' : 'var(--color-panel-success)'}`,
              borderRadius: '4px',
              color: saveMessage.includes('Error') 
                ? 'var(--color-panel-error)'
                : 'var(--color-panel-success)',
            }}>
              {saveMessage}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={!isFilterHistoryInstalled || isSaving || isLoading}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 500,
              backgroundColor: isFilterHistoryInstalled && !isSaving && !isLoading
                ? 'var(--color-panel-accent)'
                : 'var(--color-panel-bg-tertiary)',
              border: '1px solid var(--color-panel-border)',
              borderRadius: '4px',
              color: isFilterHistoryInstalled && !isSaving && !isLoading
                ? 'var(--color-panel-text)'
                : 'var(--color-panel-text-muted)',
              cursor: isFilterHistoryInstalled && !isSaving && !isLoading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              alignSelf: 'flex-start',
            }}
            onMouseEnter={(e) => {
              if (isFilterHistoryInstalled && !isSaving && !isLoading) {
                e.currentTarget.style.opacity = '0.9';
              }
            }}
            onMouseLeave={(e) => {
              if (isFilterHistoryInstalled && !isSaving && !isLoading) {
                e.currentTarget.style.opacity = '1';
              }
            }}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      )}
    </div>
  );
};
