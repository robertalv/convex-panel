import { useState, useEffect } from "react";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
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
import { Bell, TestTube2, CheckCircle, XCircle } from "lucide-react";

const STORAGE_KEY = "convex-panel-notifications-enabled";

export function NotificationSettings() {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : true;
  });
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
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

      console.log("[Notifications] Sending test notification...");
      await sendNotification({
        title: "Test Notification",
        body: "This is a test notification from Convex Panel",
      });

      console.log("[Notifications] Test notification sent successfully");
      setTestNotificationStatus({
        type: "success",
        message: "Test notification sent successfully!",
      });

      // Clear success message after 3 seconds
      setTimeout(() => setTestNotificationStatus(null), 3000);
    } catch (error) {
      console.error("[Notifications] Failed to send test notification:", error);
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
                          ✓ Granted
                        </span>
                      ) : (
                        <span className="text-yellow-600 dark:text-yellow-400">
                          ⚠ Not granted
                        </span>
                      )}
                    </div>
                  </div>
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
                <Switch id="deployment-notifications" checked disabled />
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
                <Switch id="error-notifications" disabled />
              </div>

              <div className="flex items-center justify-between opacity-50">
                <div className="space-y-0.5">
                  <Label htmlFor="build-notifications">Build Status</Label>
                  <div className="text-sm text-muted-foreground">
                    Get notified about build successes and failures
                  </div>
                </div>
                <Switch id="build-notifications" disabled />
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
