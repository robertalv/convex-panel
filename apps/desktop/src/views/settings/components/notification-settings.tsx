import { useState, useEffect } from "react";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  TestTube2,
  CheckCircle,
  XCircle,
  ExternalLink,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isOpeningSettings, setIsOpeningSettings] = useState(false);
  const [testNotificationStatus, setTestNotificationStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

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
      setTestNotificationStatus({
        type: "error",
        message: `Failed to open system settings: ${error instanceof Error ? error.message : String(error)}`,
      });
      setTimeout(() => setTestNotificationStatus(null), 5000);
    } finally {
      setIsOpeningSettings(false);
    }
  };

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
        overflow: "auto",
        backgroundColor: "var(--color-surface-base)",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 600,
              color: "var(--color-text-base)",
              marginBottom: "8px",
            }}
          >
            Notifications
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--color-text-muted)",
            }}
          >
            Manage system notifications for deployment events and errors
          </p>
        </div>

        {/* Permission Status */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notification Permissions</CardTitle>
            </div>
            <CardDescription>
              Allow the app to send system notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isCheckingPermission ? (
              <div className="text-sm text-muted-foreground">
                Checking permissions...
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="permission-status">Permission Status</Label>
                    <div className="text-sm text-muted-foreground">
                      {permissionGranted ? (
                        <span className="text-green-600 dark:text-green-400">
                          Granted
                        </span>
                      ) : (
                        <span className="text-yellow-600 dark:text-yellow-400">
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
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {isOpeningSettings ? "Opening..." : "System Settings"}
                    </Button>
                  </div>
                </div>

                {permissionGranted && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifications-enabled">
                        Enable Notifications
                      </Label>
                      <div className="text-sm text-muted-foreground">
                        Receive notifications for deployment updates
                      </div>
                    </div>
                    <Switch
                      id="notifications-enabled"
                      checked={notificationsEnabled}
                      onCheckedChange={handleToggleNotifications}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* System-Managed Options */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>System-Managed Options</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      These settings are managed by your operating system. Click
                      "System Settings" above to adjust them.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <CardDescription>
              Controlled by macOS/Windows System Settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <SystemManagedRow
              label="Alert Style"
              value="Banners or Alerts"
              description="How notifications appear on screen"
            />
            <Separator />
            <SystemManagedRow
              label="Show on Lock Screen"
              value="System controlled"
              description="Display notifications when device is locked"
            />
            <Separator />
            <SystemManagedRow
              label="Show in Notification Center"
              value="System controlled"
              description="Keep notifications in the notification center"
            />
            <Separator />
            <SystemManagedRow
              label="Badge App Icon"
              value="System controlled"
              description="Show notification count on app icon"
            />
            <Separator />
            <SystemManagedRow
              label="Play Sound"
              value="System controlled"
              description="Play a sound when notifications arrive"
            />
            <Separator />
            <SystemManagedRow
              label="Show Previews"
              value="System controlled"
              description="Show notification content in previews"
            />
            <Separator />
            <SystemManagedRow
              label="Notification Grouping"
              value="System controlled"
              description="How notifications are grouped together"
            />
          </CardContent>
        </Card>

        {/* Notification Types */}
        {permissionGranted && notificationsEnabled && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Notification Types</CardTitle>
              <CardDescription>
                Choose which events trigger notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="deployment-notifications">
                    Deployment Updates
                  </Label>
                  <div className="text-sm text-muted-foreground">
                    Get notified when new code is pushed to your deployment
                  </div>
                </div>
                <Switch
                  id="deployment-notifications"
                  checked={notificationTypes.deploymentUpdates}
                  onCheckedChange={(checked) =>
                    handleToggleNotificationType("deploymentUpdates", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between opacity-50">
                <div className="space-y-0.5">
                  <Label htmlFor="error-notifications">
                    Error Notifications
                  </Label>
                  <div className="text-sm text-muted-foreground">
                    Get notified when errors occur in your deployment
                  </div>
                </div>
                <Switch
                  id="error-notifications"
                  checked={notificationTypes.errorNotifications}
                  onCheckedChange={(checked) =>
                    handleToggleNotificationType("errorNotifications", checked)
                  }
                  disabled
                />
              </div>

              <div className="flex items-center justify-between opacity-50">
                <div className="space-y-0.5">
                  <Label htmlFor="build-notifications">Build Status</Label>
                  <div className="text-sm text-muted-foreground">
                    Get notified about build successes and failures
                  </div>
                </div>
                <Switch
                  id="build-notifications"
                  checked={notificationTypes.buildStatus}
                  onCheckedChange={(checked) =>
                    handleToggleNotificationType("buildStatus", checked)
                  }
                  disabled
                />
              </div>

              <p className="text-xs text-muted-foreground italic pt-2">
                Additional notification types coming soon
              </p>
            </CardContent>
          </Card>
        )}

        {/* Test Notification */}
        {permissionGranted && notificationsEnabled && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TestTube2 className="h-5 w-5" />
                <CardTitle>Test Notifications</CardTitle>
              </div>
              <CardDescription>
                Send a test notification to verify everything is working
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleTestNotification}
                variant="outline"
                disabled={isSendingTest}
              >
                <Bell className="h-4 w-4 mr-2" />
                {isSendingTest ? "Sending..." : "Send Test Notification"}
              </Button>

              {testNotificationStatus && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-md text-sm ${
                    testNotificationStatus.type === "success"
                      ? "bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100"
                      : "bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100"
                  }`}
                >
                  {testNotificationStatus.type === "success" ? (
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span>{testNotificationStatus.message}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

/**
 * A read-only row showing a system-managed notification setting.
 * These settings cannot be changed from within the app - the user must
 * go to System Settings to modify them.
 */
function SystemManagedRow({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="space-y-0.5">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{value}</span>
      </div>
    </div>
  );
}
