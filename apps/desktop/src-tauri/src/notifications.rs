//! Notification subsystem for cross-platform native notifications.
//!
//! Provides:
//! - `send_test_notification`: Send a test notification with platform-specific fallbacks
//! - `open_notification_settings`: Open OS notification settings for this app
//!
//! ## Platform Support
//! - macOS: Full support with terminal-notifier/osascript/Tauri fallbacks
//! - Windows: Full support with Tauri notification API and ms-settings deep link
//! - Linux: TODO - Not yet implemented, contributions welcome!

use tauri::AppHandle;
use tauri_plugin_notification::NotificationExt;

/// Send a test notification (for settings page).
///
/// On macOS, uses a fallback chain:
/// 1. terminal-notifier (best for dev mode, supports banners)
/// 2. osascript display notification
/// 3. Tauri notification builder
///
/// On Windows, uses Tauri notification builder directly.
#[tauri::command]
pub async fn send_test_notification(app: AppHandle) -> Result<(), String> {
    println!("[Notifications] Attempting to send test notification...");
    
    let title = "Test Notification";
    let subtitle = "Convex Panel";
    let body = "Notifications are working correctly!";
    
    #[cfg(target_os = "macos")]
    {
        // Use terminal-notifier for better banner support in dev mode
        println!("[Notifications] macOS: Trying terminal-notifier first...");
        
        match std::process::Command::new("terminal-notifier")
            .arg("-title")
            .arg(title)
            .arg("-subtitle")
            .arg(subtitle)
            .arg("-message")
            .arg(body)
            .arg("-sound")
            .arg("Glass")
            .output()
        {
            Ok(output) if output.status.success() => {
                println!("[Notifications] ✓ Notification sent via terminal-notifier");
                return Ok(());
            }
            Ok(output) => {
                eprintln!("[Notifications] terminal-notifier failed: {:?}", String::from_utf8_lossy(&output.stderr));
                println!("[Notifications] Falling back to osascript...");
            }
            Err(e) => {
                eprintln!("[Notifications] terminal-notifier not available: {}", e);
                println!("[Notifications] Falling back to osascript...");
            }
        }
        
        // Fallback to osascript
        let script = format!(
            "display notification \"{}\" with title \"{}\" subtitle \"{}\" sound name \"Glass\"",
            body.replace("\"", "\\\""),
            title.replace("\"", "\\\""),
            subtitle.replace("\"", "\\\"")
        );
        
        match std::process::Command::new("osascript")
            .arg("-e")
            .arg(&script)
            .output()
        {
            Ok(output) => {
                if output.status.success() {
                    println!("[Notifications] ✓ osascript notification sent successfully");
                    return Ok(());
                } else {
                    eprintln!("[Notifications] osascript failed: {:?}", String::from_utf8_lossy(&output.stderr));
                    println!("[Notifications] Falling back to Tauri notification API...");
                }
            }
            Err(e) => {
                eprintln!("[Notifications] Failed to execute osascript: {}", e);
                println!("[Notifications] Falling back to Tauri notification API...");
            }
        }
    }
    
    // Fallback to Tauri notification API (cross-platform)
    // On Windows, this is the primary method
    let mut notification = app.notification()
        .builder()
        .title(&format!("{} - {}", title, subtitle))
        .body(body);

    #[cfg(target_os = "macos")]
    {
        notification = notification.sound("default");
    }

    println!("[Notifications] Calling notification.show()...");
    let result = notification.show();
    
    match result {
        Ok(_) => {
            println!("[Notifications] ✓ Notification.show() succeeded");
            Ok(())
        },
        Err(e) => {
            eprintln!("[Notifications] ✗ Failed to show notification: {}", e);
            Err(e.to_string())
        }
    }
}

/// Open the OS notification settings for this application.
///
/// ## Platform Behavior
/// - **macOS**: Attempts to open the app-specific notification settings using the bundle
///   identifier. Falls back to the general Notifications preference pane if the deep link fails.
/// - **Windows**: Opens `ms-settings:notifications` which shows the Windows notification settings.
/// - **Linux**: Not yet implemented (returns an error with instructions).
#[tauri::command]
pub async fn open_notification_settings() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        open_notification_settings_macos()
    }
    
    #[cfg(target_os = "windows")]
    {
        open_notification_settings_windows()
    }
    
    #[cfg(target_os = "linux")]
    {
        // TODO: Add Linux support
        // Options to consider:
        // - gnome-control-center notifications
        // - kde systemsettings5 notifications
        // - xfce4-notifyd-config
        // For now, return a helpful error message
        Err("Opening notification settings is not yet supported on Linux. Please open your system settings manually and navigate to Notifications.".to_string())
    }
    
    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        Err("Opening notification settings is not supported on this platform.".to_string())
    }
}

/// macOS implementation: Open System Preferences > Notifications
/// 
/// Tries to open the app-specific notification settings first using the bundle identifier.
/// Falls back to the general Notifications pane if that fails.
#[cfg(target_os = "macos")]
fn open_notification_settings_macos() -> Result<(), String> {
    // The bundle identifier from tauri.conf.json
    const BUNDLE_ID: &str = "dev.convexpanel.desktop";
    
    println!("[Notifications] macOS: Attempting to open notification settings...");
    
    // First, try to open app-specific notification settings (macOS 13+)
    // This URL scheme opens directly to our app's notification settings
    let app_specific_url = format!(
        "x-apple.systempreferences:com.apple.Notifications-Settings.extension?id={}",
        BUNDLE_ID
    );
    
    println!("[Notifications] Trying app-specific URL: {}", app_specific_url);
    
    match std::process::Command::new("open")
        .arg(&app_specific_url)
        .output()
    {
        Ok(output) if output.status.success() => {
            println!("[Notifications] ✓ Opened app-specific notification settings");
            return Ok(());
        }
        Ok(output) => {
            eprintln!(
                "[Notifications] App-specific URL failed: {:?}",
                String::from_utf8_lossy(&output.stderr)
            );
            println!("[Notifications] Falling back to general notifications pane...");
        }
        Err(e) => {
            eprintln!("[Notifications] Failed to execute open command: {}", e);
            println!("[Notifications] Falling back to general notifications pane...");
        }
    }
    
    // Fallback: Open the general Notifications preference pane
    // This works on all macOS versions
    let general_url = "x-apple.systempreferences:com.apple.preference.notifications";
    
    println!("[Notifications] Trying general URL: {}", general_url);
    
    match std::process::Command::new("open")
        .arg(general_url)
        .output()
    {
        Ok(output) if output.status.success() => {
            println!("[Notifications] ✓ Opened general notification settings");
            Ok(())
        }
        Ok(output) => {
            let stderr = String::from_utf8_lossy(&output.stderr);
            eprintln!("[Notifications] Failed to open notifications pane: {:?}", stderr);
            Err(format!("Failed to open notification settings: {}", stderr))
        }
        Err(e) => {
            eprintln!("[Notifications] Failed to execute open command: {}", e);
            Err(format!("Failed to open notification settings: {}", e))
        }
    }
}

/// Windows implementation: Open Settings > Notifications
///
/// Uses the ms-settings URI scheme to open Windows Settings directly to the
/// notifications page.
#[cfg(target_os = "windows")]
fn open_notification_settings_windows() -> Result<(), String> {
    println!("[Notifications] Windows: Opening notification settings...");
    
    // ms-settings:notifications opens the Windows Settings > System > Notifications page
    match std::process::Command::new("cmd")
        .args(["/C", "start", "ms-settings:notifications"])
        .output()
    {
        Ok(output) if output.status.success() => {
            println!("[Notifications] ✓ Opened Windows notification settings");
            Ok(())
        }
        Ok(output) => {
            let stderr = String::from_utf8_lossy(&output.stderr);
            eprintln!("[Notifications] Failed to open settings: {:?}", stderr);
            Err(format!("Failed to open notification settings: {}", stderr))
        }
        Err(e) => {
            eprintln!("[Notifications] Failed to execute command: {}", e);
            Err(format!("Failed to open notification settings: {}", e))
        }
    }
}
