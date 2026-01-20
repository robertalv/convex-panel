import { useState, useEffect } from "react";
import {
  isPermissionGranted,
  requestPermission,
} from "@tauri-apps/plugin-notification";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Circle } from "lucide-react";

// ============================================================================
// Section Container Component
// ============================================================================

interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function Section({ title, description, children }: SectionProps) {
  return (
    <div className="mb-4 rounded-xl border border-border-base bg-surface-raised p-4">
      <h3 className="m-0 mb-3 text-sm font-semibold text-text-base">{title}</h3>
      {description && (
        <p className="m-0 mb-3 text-xs text-text-muted">{description}</p>
      )}
      {children}
    </div>
  );
}

// ============================================================================
// Icon-based Switch Component (shows green checkmark when enabled)
// ============================================================================

interface IconSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

function IconSwitch({ checked, onCheckedChange, disabled }: IconSwitchProps) {
  return (
    <button
      onClick={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      className={`flex h-6 w-6 items-center justify-center border-0 bg-transparent p-0 transition-colors ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      }`}
    >
      {checked ? (
        <CheckCircle2 size={24} className="text-success-base" />
      ) : (
        <Circle size={24} className="text-border-base" />
      )}
    </button>
  );
}

// Storage keys for notification preferences
const STORAGE_KEY = "convex-panel-notifications-enabled";
const NOTIFICATION_TYPES_KEY = "convex-panel-notification-types";

interface NotificationTypeSettings {
  deploymentUpdates: boolean;
  errorNotifications: boolean;
  buildStatus: boolean;
}

const DEFAULT_NOTIFICATION_TYPES: NotificationTypeSettings = {
  deploymentUpdates: true,
  errorNotifications: false,
  buildStatus: false,
};

export function NotificationSettings() {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : true;
  });
  const [notificationTypes, setNotificationTypes] =
    useState<NotificationTypeSettings>(() => {
      const stored = localStorage.getItem(NOTIFICATION_TYPES_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_NOTIFICATION_TYPES;
    });
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isOpeningSettings, setIsOpeningSettings] = useState(false);

  // Check permission on mount
  useEffect(() => {
    async function checkPermission() {
      try {
        const granted = await isPermissionGranted();
        setPermissionGranted(granted);
      } catch (error) {
        console.error("Failed to check notification permission:", error);
      } finally {
        setIsCheckingPermission(false);
      }
    }
    void checkPermission();
  }, []);

  // Save preference to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notificationsEnabled));
  }, [notificationsEnabled]);

  // Save notification type preferences to localStorage
  useEffect(() => {
    localStorage.setItem(
      NOTIFICATION_TYPES_KEY,
      JSON.stringify(notificationTypes),
    );
  }, [notificationTypes]);

  const handleRequestPermission = async () => {
    setIsRequestingPermission(true);
    try {
      const permission = await requestPermission();
      setPermissionGranted(permission === "granted");
      if (permission === "granted") {
        setNotificationsEnabled(true);
      }
    } catch (error) {
      console.error("Failed to request notification permission:", error);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleOpenSystemSettings = async () => {
    setIsOpeningSettings(true);
    try {
      await invoke("open_notification_settings");
    } catch (error) {
      console.error("Failed to open system notification settings:", error);
    } finally {
      setIsOpeningSettings(false);
    }
  };

  const handleToggleNotifications = (enabled: boolean) => {
    if (enabled && !permissionGranted) {
      // If trying to enable but no permission, request it
      void handleRequestPermission();
    } else {
      setNotificationsEnabled(enabled);
    }
  };

  const handleToggleNotificationType = (
    type: keyof NotificationTypeSettings,
    enabled: boolean,
  ) => {
    setNotificationTypes((prev) => ({
      ...prev,
      [type]: enabled,
    }));
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background-base">
      {/* Content */}
      <div className="flex flex-1 justify-center overflow-y-auto p-4">
        <div className="w-full max-w-[600px]">
          {/* Permission Status Section */}
          {isCheckingPermission ? (
            <Section title="Notification Permissions">
              <div className="flex items-center gap-2 text-[13px] text-text-muted">
                Checking permissions...
              </div>
            </Section>
          ) : (
            <Section
              title="Notification Permissions"
              description="Allow the app to send system notifications"
            >
              <div className="flex flex-col gap-3">
                {/* Permission Status Display */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="permission-status">Permission Status</Label>
                    <div className="mt-1 text-xs">
                      {permissionGranted ? (
                        <span className="font-medium text-success-base">
                          Granted
                        </span>
                      ) : (
                        <span className="font-medium text-warning-base">
                          Not granted
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!permissionGranted && (
                      <Button
                        onClick={handleRequestPermission}
                        disabled={isRequestingPermission}
                        size="sm"
                      >
                        {isRequestingPermission
                          ? "Requesting..."
                          : "Grant Permission"}
                      </Button>
                    )}
                    <Button
                      onClick={handleOpenSystemSettings}
                      disabled={isOpeningSettings}
                      size="sm"
                      variant="outline"
                    >
                      {isOpeningSettings ? "Opening..." : "System Settings"}
                    </Button>
                  </div>
                </div>

                {/* Enable Notifications Toggle */}
                {permissionGranted && (
                  <div className="flex items-center justify-between border-t border-border-base pt-3">
                    <div>
                      <Label htmlFor="notifications-enabled">
                        Enable Notifications
                      </Label>
                      <p className="m-0 mt-1 text-xs text-text-muted">
                        Receive notifications for deployment updates
                      </p>
                    </div>
                    <IconSwitch
                      checked={notificationsEnabled}
                      onCheckedChange={handleToggleNotifications}
                    />
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Notification Types Section */}
          {permissionGranted && notificationsEnabled && (
            <Section
              title="Notification Types"
              description="Choose which events trigger notifications"
            >
              <div className="flex flex-col gap-3">
                {/* Deployment Updates */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="deployment-notifications">
                      Deployment Updates
                    </Label>
                    <p className="m-0 mt-1 text-xs text-text-muted">
                      Get notified when new code is pushed to your deployment
                    </p>
                  </div>
                  <IconSwitch
                    checked={notificationTypes.deploymentUpdates}
                    onCheckedChange={(checked) =>
                      handleToggleNotificationType("deploymentUpdates", checked)
                    }
                  />
                </div>

                {/* Error Notifications (Disabled) */}
                <div className="flex items-center justify-between opacity-50">
                  <div>
                    <Label htmlFor="error-notifications">
                      Error Notifications
                    </Label>
                    <p className="m-0 mt-1 text-xs text-text-muted">
                      Get notified when errors occur in your deployment
                    </p>
                  </div>
                  <IconSwitch
                    checked={notificationTypes.errorNotifications}
                    onCheckedChange={(checked) =>
                      handleToggleNotificationType(
                        "errorNotifications",
                        checked,
                      )
                    }
                    disabled
                  />
                </div>

                {/* Build Status (Disabled) */}
                <div className="flex items-center justify-between opacity-50">
                  <div>
                    <Label htmlFor="build-notifications">Build Status</Label>
                    <p className="m-0 mt-1 text-xs text-text-muted">
                      Get notified about build successes and failures
                    </p>
                  </div>
                  <IconSwitch
                    checked={notificationTypes.buildStatus}
                    onCheckedChange={(checked) =>
                      handleToggleNotificationType("buildStatus", checked)
                    }
                    disabled
                  />
                </div>

                <p className="m-0 mt-2 text-[11px] italic text-text-muted">
                  Additional notification types coming soon
                </p>
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
