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
// Section Container Component (matching profile-settings pattern)
// ============================================================================

interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function Section({ title, description, children }: SectionProps) {
  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "var(--color-surface-raised)",
        borderRadius: "12px",
        border: "1px solid var(--color-border-base)",
        marginBottom: "16px",
      }}
    >
      <h3
        style={{
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--color-text-base)",
          margin: 0,
          marginBlockEnd: description ? "4px" : "12px",
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontSize: "12px",
            color: "var(--color-text-muted)",
            margin: 0,
            marginBlockEnd: "12px",
          }}
        >
          {description}
        </p>
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
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "24px",
        height: "24px",
        border: "none",
        background: "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        padding: "0",
        opacity: disabled ? 0.5 : 1,
        transition: "color 0.2s ease-in-out",
      }}
    >
      {checked ? (
        <CheckCircle2
          size={24}
          style={{ color: "var(--color-success-base, #22c55e)" }}
        />
      ) : (
        <Circle
          size={24}
          style={{ color: "var(--color-border-base, #e5e7eb)" }}
        />
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
  // Note: These are only used in the commented-out test notification section
  // const [isSendingTest, setIsSendingTest] = useState(false);
  const [isOpeningSettings, setIsOpeningSettings] = useState(false);
  // const [testNotificationStatus, setTestNotificationStatus] = useState<{
  //   type: "success" | "error";
  //   message: string;
  // } | null>(null);

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
      // Error handling can be added back when test notification section is re-enabled
    } finally {
      setIsOpeningSettings(false);
    }
  };

  /* Test notification is currently disabled - kept for future use
  const handleTestNotification = async () => {
    setIsSendingTest(true);
    setTestNotificationStatus(null);

    try {
      console.log("[Notifications] Checking permission before sending test...");
      const granted = await isPermissionGranted();
      console.log("[Notifications] Permission granted:", granted);

      if (!granted) {
        console.error("[Notifications] Permission not granted");
        setTestNotificationStatus({
          type: "error",
          message:
            "Notification permission not granted. Please grant permission first.",
        });
        setIsSendingTest(false);
        return;
      }

      console.log(
        "[Notifications] Sending test notification via Rust backend...",
      );
      console.log("[Notifications] Invoking send_test_notification command...");

      // Try using the Rust backend notification API for better macOS compatibility
      try {
        const result = await invoke("send_test_notification");
        console.log("[Notifications] Rust backend response:", result);
        console.log(
          "[Notifications] Test notification sent via Rust backend successfully",
        );
        setTestNotificationStatus({
          type: "success",
          message:
            "Test notification sent successfully! Check your notification center.",
        });
      } catch (rustError) {
        console.warn(
          "[Notifications] Rust backend failed, trying direct API:",
          rustError,
        );
        console.error(
          "[Notifications] Rust error details:",
          JSON.stringify(rustError),
        );
        // Fallback to direct API
        console.log(
          "[Notifications] Attempting direct sendNotification API...",
        );
        const notifResult = await sendNotification({
          title: "Test Notification",
          body: "This is a test notification from Convex Panel",
        });
        console.log("[Notifications] Direct API result:", notifResult);
        console.log(
          "[Notifications] Test notification sent via direct API successfully",
        );
        setTestNotificationStatus({
          type: "success",
          message:
            "Test notification sent successfully! Check your notification center.",
        });
      }

      // Clear success message after 5 seconds
      setTimeout(() => setTestNotificationStatus(null), 5000);
    } catch (error) {
      console.error("[Notifications] Failed to send test notification:", error);
      console.error("[Notifications] Error type:", typeof error);
      console.error(
        "[Notifications] Error details:",
        JSON.stringify(error, null, 2),
      );
      setTestNotificationStatus({
        type: "error",
        message: `Failed to send notification: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setIsSendingTest(false);
    }
  };
  */

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
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: "var(--color-background-base)",
      }}
    >
      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ maxWidth: "600px", width: "100%" }}>
          {/* Permission Status Section */}
          {isCheckingPermission ? (
            <Section title="Notification Permissions">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "var(--color-text-muted)",
                  fontSize: "13px",
                }}
              >
                Checking permissions...
              </div>
            </Section>
          ) : (
            <Section
              title="Notification Permissions"
              description="Allow the app to send system notifications"
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {/* Permission Status Display */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <Label htmlFor="permission-status">Permission Status</Label>
                    <div style={{ fontSize: "12px", marginTop: "4px" }}>
                      {permissionGranted ? (
                        <span
                          style={{
                            color: "var(--color-success-base, #22c55e)",
                            fontWeight: 500,
                          }}
                        >
                          Granted
                        </span>
                      ) : (
                        <span
                          style={{
                            color: "var(--color-warning-base, #eab308)",
                            fontWeight: 500,
                          }}
                        >
                          Not granted
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: "12px",
                      borderTop: "1px solid var(--color-border-base)",
                    }}
                  >
                    <div>
                      <Label htmlFor="notifications-enabled">
                        Enable Notifications
                      </Label>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "var(--color-text-muted)",
                          margin: 0,
                          marginTop: "4px",
                        }}
                      >
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
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {/* Deployment Updates */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <Label htmlFor="deployment-notifications">
                      Deployment Updates
                    </Label>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "var(--color-text-muted)",
                        margin: 0,
                        marginTop: "4px",
                      }}
                    >
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    opacity: 0.5,
                  }}
                >
                  <div>
                    <Label htmlFor="error-notifications">
                      Error Notifications
                    </Label>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "var(--color-text-muted)",
                        margin: 0,
                        marginTop: "4px",
                      }}
                    >
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    opacity: 0.5,
                  }}
                >
                  <div>
                    <Label htmlFor="build-notifications">Build Status</Label>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "var(--color-text-muted)",
                        margin: 0,
                        marginTop: "4px",
                      }}
                    >
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

                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--color-text-muted)",
                    fontStyle: "italic",
                    margin: 0,
                    marginTop: "8px",
                  }}
                >
                  Additional notification types coming soon
                </p>
              </div>
            </Section>
          )}

          {/* Test Notification Section */}
          {/* {permissionGranted && notificationsEnabled && (
            <Section
              title="Test Notifications"
              description="Send a test notification to verify everything is working"
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <Button
                  onClick={handleTestNotification}
                  variant="outline"
                  disabled={isSendingTest}
                  style={{ width: "100%" }}
                >
                  {isSendingTest ? "Sending..." : "Send Test Notification"}
                </Button>

                {testNotificationStatus && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      backgroundColor:
                        testNotificationStatus.type === "success"
                          ? "var(--color-success-base-alpha, rgba(34, 197, 94, 0.1))"
                          : "var(--color-error-base-alpha, rgba(239, 68, 68, 0.1))",
                      color:
                        testNotificationStatus.type === "success"
                          ? "var(--color-success-base, #22c55e)"
                          : "var(--color-error-base, #ef4444)",
                    }}
                  >
                    {testNotificationStatus.type === "success" ? (
                      <CheckCircle2
                        size={16}
                        className="flex-shrink-0"
                        style={{ color: "var(--color-success-base, #22c55e)" }}
                      />
                    ) : (
                      <Circle
                        size={16}
                        className="flex-shrink-0"
                        style={{ color: "var(--color-error-base, #ef4444)" }}
                      />
                    )}
                    <span>{testNotificationStatus.message}</span>
                  </div>
                )}
              </div>
            </Section>
          )} */}
        </div>
      </div>
    </div>
  );
}

/* SystemManagedRow component - kept for future use if system-managed settings are needed
function SystemManagedRow({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: "1px solid var(--color-border-base)",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--color-text-base)",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "var(--color-text-muted)",
            marginTop: "2px",
          }}
        >
          {description}
        </div>
      </div>
      <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
        System controlled
      </div>
    </div>
  );
}
*/
