mod secure_store;
mod mcp_server;
mod pty;

use tauri::{Manager, Emitter, AppHandle, include_image};
use tauri::menu::{Menu, MenuItem, IconMenuItem, Submenu, PredefinedMenuItem};
use tauri::tray::{TrayIconBuilder, MouseButton, MouseButtonState, TrayIconEvent};
use std::sync::Mutex;
use std::collections::VecDeque;
use once_cell::sync::Lazy;

// Network test status stored globally for tray updates
#[derive(Clone, serde::Serialize, serde::Deserialize, Default)]
pub struct NetworkTestStatus {
    pub websocket: String,
    pub http: String,
    pub sse: String,
    pub proxied_websocket: String,
    pub overall: String,
}

static NETWORK_STATUS: Lazy<Mutex<NetworkTestStatus>> = Lazy::new(|| {
    Mutex::new(NetworkTestStatus::default())
});

// Deployment push notification tracking
#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct DeploymentPush {
    pub deployment_name: String,
    pub deployment_url: String,
    pub timestamp: i64,
    pub version: Option<String>,
}

#[derive(Clone, serde::Serialize, serde::Deserialize, Default)]
pub struct DeploymentNotificationState {
    pub recent_pushes: VecDeque<DeploymentPush>,
    pub last_push_timestamp: Option<i64>,
}

static DEPLOYMENT_STATE: Lazy<Mutex<DeploymentNotificationState>> = Lazy::new(|| {
    Mutex::new(DeploymentNotificationState {
        recent_pushes: VecDeque::with_capacity(10),
        last_push_timestamp: None,
    })
});

// Store menu item references for dynamic updates
static TRAY_MENU_ITEMS: Lazy<Mutex<Option<TrayMenuItems>>> = Lazy::new(|| {
    Mutex::new(None)
});

struct TrayMenuItems {
    ws_status: MenuItem<tauri::Wry>,
    http_status: MenuItem<tauri::Wry>,
    sse_status: MenuItem<tauri::Wry>,
    proxy_status: MenuItem<tauri::Wry>,
}

/// Update network test status from frontend and update tray menu
#[tauri::command]
fn update_network_status(status: NetworkTestStatus) -> Result<(), String> {
    // Store the status
    {
        let mut network_status = NETWORK_STATUS.lock().unwrap();
        *network_status = status.clone();
    }
    
    // Update tray menu items
    if let Some(items) = TRAY_MENU_ITEMS.lock().unwrap().as_ref() {
        let _ = items.ws_status.set_text(format!("WebSocket: {}", status.websocket));
        let _ = items.http_status.set_text(format!("HTTP: {}", status.http));
        let _ = items.sse_status.set_text(format!("SSE: {}", status.sse));
        let _ = items.proxy_status.set_text(format!("Proxied WS: {}", status.proxied_websocket));
    }
    
    Ok(())
}

/// Get current network test status
#[tauri::command]
fn get_network_status() -> NetworkTestStatus {
    NETWORK_STATUS.lock().unwrap().clone()
}

// ============================================================================
// Deployment Notification Commands
// ============================================================================

/// Track a new deployment push and send a system notification
#[tauri::command]
async fn notify_deployment_push(
    app: AppHandle,
    deployment_name: String,
    deployment_url: String,
    timestamp: i64,
    version: Option<String>,
) -> Result<(), String> {
    let push = DeploymentPush {
        deployment_name: deployment_name.clone(),
        deployment_url,
        timestamp,
        version: version.clone(),
    };

    // Update state
    {
        let mut state = DEPLOYMENT_STATE.lock().unwrap();
        
        // Add to recent pushes (keep last 10)
        state.recent_pushes.push_front(push.clone());
        if state.recent_pushes.len() > 10 {
            state.recent_pushes.pop_back();
        }
        
        state.last_push_timestamp = Some(timestamp);
    }

    // Send system notification
    let notification = app.notification()
        .builder()
        .title("Deployment Updated")
        .body(format!(
            "{} was just deployed{}",
            deployment_name,
            version.as_ref().map(|v| format!(" (v{})", v)).unwrap_or_default()
        ));

    #[cfg(target_os = "macos")]
    let notification = notification.sound("default");

    notification.show().map_err(|e| e.to_string())?;

    Ok(())
}

/// Get recent deployment pushes
#[tauri::command]
fn get_recent_deployments() -> Vec<DeploymentPush> {
    let state = DEPLOYMENT_STATE.lock().unwrap();
    state.recent_pushes.iter().cloned().collect()
}

/// Clear deployment notification history
#[tauri::command]
fn clear_deployment_history() -> Result<(), String> {
    let mut state = DEPLOYMENT_STATE.lock().unwrap();
    state.recent_pushes.clear();
    state.last_push_timestamp = None;
    Ok(())
}

/// Command to expand the window to near-fullscreen (maximized)
#[tauri::command]
fn expand_window(window: tauri::Window) -> Result<(), String> {
    // Remove size constraints and make window resizable before maximizing
    window.set_resizable(true).map_err(|e| e.to_string())?;
    window.set_min_size(Some(tauri::LogicalSize::new(800.0, 600.0))).map_err(|e| e.to_string())?;
    window.set_max_size(None::<tauri::LogicalSize<f64>>).map_err(|e| e.to_string())?;
    window.maximize().map_err(|e| e.to_string())
}

/// Command to set custom window size (used during transition animation)
#[tauri::command]
fn set_window_size(window: tauri::Window, width: f64, height: f64) -> Result<(), String> {
    // Make window resizable and remove constraints when resizing beyond initial size
    window.set_resizable(true).map_err(|e| e.to_string())?;
    window.set_min_size(None::<tauri::LogicalSize<f64>>).map_err(|e| e.to_string())?;
    window.set_max_size(None::<tauri::LogicalSize<f64>>).map_err(|e| e.to_string())?;
    window
        .set_size(tauri::LogicalSize::new(width, height))
        .map_err(|e| e.to_string())
}

/// Command to set window size and keep it centered (for smooth center-out expansion)
#[tauri::command]
fn set_window_size_centered(window: tauri::Window, width: f64, height: f64) -> Result<(), String> {
    // Make window resizable and remove constraints
    window.set_resizable(true).map_err(|e| e.to_string())?;
    window.set_min_size(None::<tauri::LogicalSize<f64>>).map_err(|e| e.to_string())?;
    window.set_max_size(None::<tauri::LogicalSize<f64>>).map_err(|e| e.to_string())?;
    
    // Set size and immediately center
    window.set_size(tauri::LogicalSize::new(width, height)).map_err(|e| e.to_string())?;
    window.center().map_err(|e| e.to_string())
}

/// Command to center the window on screen
#[tauri::command]
fn center_window(window: tauri::Window) -> Result<(), String> {
    window.center().map_err(|e| e.to_string())
}

/// Command to set window to fixed size with min/max constraints (for welcome screen)
#[tauri::command]
fn set_window_fixed_size(window: tauri::Window, width: f64, height: f64) -> Result<(), String> {
    // Set min and max size to the same value to lock the window size
    let size = tauri::LogicalSize::new(width, height);
    window.set_min_size(Some(size)).map_err(|e| e.to_string())?;
    window.set_max_size(Some(size)).map_err(|e| e.to_string())?;
    window.set_resizable(false).map_err(|e| e.to_string())?;
    // Set size and center
    window.set_size(size).map_err(|e| e.to_string())?;
    window.center().map_err(|e| e.to_string())
}

/// Command to remove window size constraints and make it resizable (for main app)
#[tauri::command]
fn remove_window_constraints(window: tauri::Window) -> Result<(), String> {
    // Make window resizable and remove all size constraints to allow fullscreen
    window.set_resizable(true).map_err(|e| e.to_string())?;
    window.set_min_size(Some(tauri::LogicalSize::new(800.0, 600.0))).map_err(|e| e.to_string())?;
    window.set_max_size(None::<tauri::LogicalSize<f64>>).map_err(|e| e.to_string())?;
    Ok(())
}

// ============================================================================
// MCP Server Commands
// ============================================================================

/// Start the MCP server
#[tauri::command]
async fn start_mcp_server(app_handle: tauri::AppHandle) -> Result<u16, String> {
    mcp_server::start_server(app_handle).await
}

/// Stop the MCP server
#[tauri::command]
fn stop_mcp_server() -> Result<(), String> {
    mcp_server::stop_server()
}

/// Get MCP server status
#[tauri::command]
fn get_mcp_status() -> mcp_server::McpStatus {
    mcp_server::get_status()
}

/// Set project path for MCP operations
#[tauri::command]
fn set_mcp_project_path(path: Option<String>) {
    mcp_server::set_project_path(path);
}

/// Set deployment credentials for MCP operations
#[tauri::command]
fn set_mcp_deployment_credentials(url: Option<String>, key: Option<String>) {
    mcp_server::set_deployment_credentials(url, key);
}

/// Get the Cursor configuration JSON for the MCP server
#[tauri::command]
fn get_cursor_mcp_config() -> Option<String> {
    mcp_server::get_cursor_config()
}

// ============================================================================
// File System Commands
// ============================================================================

/// Select a directory using the native file picker
#[tauri::command]
async fn select_directory() -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    
    // Note: This requires the dialog plugin to be initialized
    // For now, return a placeholder - will be implemented with dialog plugin
    Ok(None)
}

/// List files in a directory
#[tauri::command]
fn list_directory_files(path: String, pattern: Option<String>) -> Result<Vec<String>, String> {
    use walkdir::WalkDir;
    
    let path = std::path::Path::new(&path);
    if !path.exists() {
        return Err("Directory does not exist".to_string());
    }
    
    let mut files = Vec::new();
    for entry in WalkDir::new(path)
        .max_depth(5)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if entry.file_type().is_file() {
            let file_name = entry.file_name().to_string_lossy().to_string();
            
            // Apply pattern filter if provided
            if let Some(ref pat) = pattern {
                if !file_name.ends_with(pat) && !file_name.contains(pat) {
                    continue;
                }
            }
            
            if let Ok(relative) = entry.path().strip_prefix(path) {
                files.push(relative.display().to_string());
            }
        }
    }
    
    Ok(files)
}

/// Read a file's contents
#[tauri::command]
fn read_project_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))
}

/// Write or update an environment variable in a .env file
/// If the variable exists, it will be updated. If not, it will be appended.
/// Creates the file if it doesn't exist.
#[tauri::command]
fn write_env_variable(file_path: String, key: String, value: String) -> Result<(), String> {
    use std::fs;
    use std::path::Path;
    
    let path = Path::new(&file_path);
    
    // Read existing content or start with empty string
    let existing_content = if path.exists() {
        fs::read_to_string(path).unwrap_or_default()
    } else {
        String::new()
    };
    
    let mut lines: Vec<String> = existing_content.lines().map(|s| s.to_string()).collect();
    let key_prefix = format!("{}=", key);
    let new_line = format!("{}={}", key, value);
    
    // Check if the key already exists
    let mut found = false;
    for line in lines.iter_mut() {
        let trimmed = line.trim();
        // Match key= at start of line (ignoring comments)
        if !trimmed.starts_with('#') && trimmed.starts_with(&key_prefix) {
            *line = new_line.clone();
            found = true;
            break;
        }
    }
    
    // If key wasn't found, append it
    if !found {
        // Add a newline before if file doesn't end with one and has content
        if !lines.is_empty() && !existing_content.ends_with('\n') {
            lines.push(String::new());
        }
        lines.push(new_line);
    }
    
    // Write back to file
    let new_content = lines.join("\n");
    // Ensure file ends with newline
    let final_content = if new_content.ends_with('\n') {
        new_content
    } else {
        format!("{}\n", new_content)
    };
    
    fs::write(path, final_content)
        .map_err(|e| format!("Failed to write file: {}", e))
}

/// Read an environment variable from a .env file
#[tauri::command]
fn read_env_variable(file_path: String, key: String) -> Result<Option<String>, String> {
    use std::fs;
    use std::path::Path;
    
    let path = Path::new(&file_path);
    
    if !path.exists() {
        return Ok(None);
    }
    
    let content = fs::read_to_string(path)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    
    let key_prefix = format!("{}=", key);
    
    for line in content.lines() {
        let trimmed = line.trim();
        if !trimmed.starts_with('#') && trimmed.starts_with(&key_prefix) {
            let value = trimmed[key_prefix.len()..].to_string();
            // Remove surrounding quotes if present
            let value = value.trim_matches('"').trim_matches('\'').to_string();
            return Ok(Some(value));
        }
    }
    
    Ok(None)
}

/// Open a file in an external editor (Cursor, VS Code, etc.)
#[tauri::command]
async fn open_in_editor(path: String, line: Option<u32>, editor: Option<String>) -> Result<(), String> {
    use std::process::Command;
    
    let editor_cmd = editor.unwrap_or_else(|| "cursor".to_string());
    
    let path_with_line = if let Some(l) = line {
        format!("{}:{}", path, l)
    } else {
        path
    };
    
    // Try to open with the specified editor
    Command::new(&editor_cmd)
        .arg(&path_with_line)
        .spawn()
        .map_err(|e| format!("Failed to open editor '{}': {}", editor_cmd, e))?;
    
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            expand_window, 
            set_window_size,
            set_window_size_centered,
            center_window,
            set_window_fixed_size,
            remove_window_constraints,
            secure_store::set_secret,
            secure_store::get_secret,
            secure_store::delete_secret,
            // MCP commands
            start_mcp_server,
            stop_mcp_server,
            get_mcp_status,
            set_mcp_project_path,
            set_mcp_deployment_credentials,
            get_cursor_mcp_config,
            // File system commands
            select_directory,
            list_directory_files,
            read_project_file,
            open_in_editor,
            // Env file commands
            write_env_variable,
            read_env_variable,
            // PTY commands
            pty::pty_spawn,
            pty::pty_write,
            pty::pty_resize,
            pty::pty_kill,
            pty::pty_get_session,
            pty::pty_list_sessions,
            // Network status commands
            update_network_status,
            get_network_status,
            // Deployment notification commands
            notify_deployment_push,
            get_recent_deployments,
            clear_deployment_history
        ])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            // Set window size constraints for welcome screen (960x600 fixed)
            let _ = window.set_min_size(Some(tauri::LogicalSize::new(960.0, 600.0)));
            let _ = window.set_max_size(Some(tauri::LogicalSize::new(960.0, 600.0)));

            // Create custom menu
            let about_item = MenuItem::with_id(app, "about", "About Convex Panel", true, None::<&str>)?;
            let settings_item = MenuItem::with_id(app, "settings", "Settings...", true, Some("CmdOrCtrl+,"))?;
            let separator1 = PredefinedMenuItem::separator(app)?;
            let hide = PredefinedMenuItem::hide(app, Some("Hide Convex Panel"))?;
            let hide_others = PredefinedMenuItem::hide_others(app, Some("Hide Others"))?;
            let show_all = PredefinedMenuItem::show_all(app, Some("Show All"))?;
            let separator2 = PredefinedMenuItem::separator(app)?;
            let quit = PredefinedMenuItem::quit(app, Some("Quit Convex Panel"))?;

            let app_menu = Submenu::with_items(
                app,
                "Convex Panel",
                true,
                &[
                    &about_item,
                    &separator1,
                    &settings_item,
                    &separator2,
                    &hide,
                    &hide_others,
                    &show_all,
                    &PredefinedMenuItem::separator(app)?,
                    &quit,
                ],
            )?;

            // Edit menu
            let undo = PredefinedMenuItem::undo(app, None)?;
            let redo = PredefinedMenuItem::redo(app, None)?;
            let cut = PredefinedMenuItem::cut(app, None)?;
            let copy = PredefinedMenuItem::copy(app, None)?;
            let paste = PredefinedMenuItem::paste(app, None)?;
            let select_all = PredefinedMenuItem::select_all(app, None)?;
            
            let edit_menu = Submenu::with_items(
                app,
                "Edit",
                true,
                &[
                    &undo,
                    &redo,
                    &PredefinedMenuItem::separator(app)?,
                    &cut,
                    &copy,
                    &paste,
                    &PredefinedMenuItem::separator(app)?,
                    &select_all,
                ],
            )?;

            // View menu
            let fullscreen = PredefinedMenuItem::fullscreen(app, None)?;
            let minimize = PredefinedMenuItem::minimize(app, None)?;
            
            let view_menu = Submenu::with_items(
                app,
                "View",
                true,
                &[
                    &fullscreen,
                    &minimize,
                ],
            )?;

            // Window menu
            let close_window = PredefinedMenuItem::close_window(app, None)?;
            let minimize2 = PredefinedMenuItem::minimize(app, None)?;
            
            let window_menu = Submenu::with_items(
                app,
                "Window",
                true,
                &[
                    &minimize2,
                    &PredefinedMenuItem::separator(app)?,
                    &close_window,
                ],
            )?;

            let menu = Menu::with_items(app, &[&app_menu, &edit_menu, &view_menu, &window_menu])?;
            app.set_menu(menu)?;

            // Handle menu events
            let window_clone = window.clone();
            app.on_menu_event(move |_app, event| {
                match event.id().as_ref() {
                    "about" => {
                        let _ = window_clone.emit("show-about", ());
                    }
                    "settings" => {
                        let _ = window_clone.emit("show-settings", ());
                    }
                    _ => {}
                }
            });

            // Auto-start MCP server
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                match mcp_server::start_server(app_handle).await {
                    Ok(port) => {
                        println!("MCP server started on port {}", port);
                    }
                    Err(e) => {
                        eprintln!("Failed to start MCP server: {}", e);
                    }
                }
            });


            // Create system tray with network status menu
            // Status items are initially "Pending" and will be updated by frontend via update_network_status
            let ws_status_item = MenuItem::with_id(app, "ws_status", "WebSocket: Pending", false, None::<&str>)?;
            let http_status_item = MenuItem::with_id(app, "http_status", "HTTP: Pending", false, None::<&str>)?;
            let sse_status_item = MenuItem::with_id(app, "sse_status", "SSE: Pending", false, None::<&str>)?;
            let proxy_status_item = MenuItem::with_id(app, "proxy_status", "Proxied WS: Pending", false, None::<&str>)?;
            
            // Store menu items for later updates
            {
                let mut items = TRAY_MENU_ITEMS.lock().unwrap();
                *items = Some(TrayMenuItems {
                    ws_status: ws_status_item.clone(),
                    http_status: http_status_item.clone(),
                    sse_status: sse_status_item.clone(),
                    proxy_status: proxy_status_item.clone(),
                });
            }
            
            // Load menu icon for "Show Convex Panel" item
            let menu_icon = include_image!("icons/menu-icon.png");
            
            let tray_menu = Menu::with_items(app, &[
                &MenuItem::with_id(app, "network_header", "Network Status", false, None::<&str>)?,
                &PredefinedMenuItem::separator(app)?,
                &ws_status_item,
                &http_status_item,
                &sse_status_item,
                &proxy_status_item,
                &PredefinedMenuItem::separator(app)?,
                &MenuItem::with_id(app, "run_tests", "Run Network Tests", true, None::<&str>)?,
                &PredefinedMenuItem::separator(app)?,
                &IconMenuItem::with_id(app, "show_window", "Show Convex Panel", true, Some(menu_icon), None::<&str>)?,
                &PredefinedMenuItem::quit(app, Some("Quit"))?,
            ])?;

            // Load tray icon - embedded at compile time for menu bar
            let icon = include_image!("icons/tray-icon.png");

            let window_for_tray = window.clone();
            let _tray = TrayIconBuilder::new()
                .icon(icon)
                .icon_as_template(true) // Makes it adapt to light/dark menu bar
                .menu(&tray_menu)
                .tooltip("Convex Panel - Network Status")
                .on_menu_event(move |_app, event| {
                    match event.id().as_ref() {
                        "show_window" => {
                            let _ = window_for_tray.show();
                            let _ = window_for_tray.set_focus();
                        }
                        "run_tests" => {
                            let _ = window_for_tray.emit("run-network-tests", ());
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
                        // Show the tray menu on left click
                        let _ = tray.app_handle().emit("tray-click", ());
                    }
                })
                .build(app)?;

            // set background color only when building for macOS
            #[cfg(target_os = "macos")]
            {
                use cocoa::appkit::{NSColor, NSWindow};
                use cocoa::base::{id, nil};

                let ns_window = window.ns_window().unwrap() as id;
                unsafe {
                    let bg_color = NSColor::colorWithRed_green_blue_alpha_(
                        nil,
                        42.0 / 255.0,
                        40.0 / 255.0,
                        37.0 / 255.0,
                        1.0,
                    );
                    ns_window.setBackgroundColor_(bg_color);
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
