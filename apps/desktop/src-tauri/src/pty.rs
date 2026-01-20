//! PTY (Pseudo-Terminal) module for real terminal support
//! 
//! This module provides a true interactive terminal experience using
//! the portable-pty crate to spawn shell processes with proper PTY support.

use once_cell::sync::Lazy;
use parking_lot::Mutex;
use portable_pty::{native_pty_system, CommandBuilder, PtyPair, PtySize};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::Arc;
use std::thread;
use tauri::{AppHandle, Emitter};

/// Represents a PTY session
struct PtySession {
    /// The PTY pair (master + child)
    pty_pair: PtyPair,
    /// Writer to send data to the PTY
    writer: Box<dyn Write + Send>,
    /// Session ID
    id: String,
    /// Whether the session is still alive
    alive: bool,
}

/// Global state for PTY sessions
struct PtyState {
    sessions: HashMap<String, Arc<Mutex<PtySession>>>,
}

impl PtyState {
    fn new() -> Self {
        Self {
            sessions: HashMap::new(),
        }
    }
}

static PTY_STATE: Lazy<Mutex<PtyState>> = Lazy::new(|| Mutex::new(PtyState::new()));

/// Information about a PTY session
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PtySessionInfo {
    pub id: String,
    pub alive: bool,
}

/// Spawn a new PTY session
#[tauri::command]
pub fn pty_spawn(
    app_handle: AppHandle,
    session_id: String,
    cwd: Option<String>,
    rows: Option<u16>,
    cols: Option<u16>,
    env: Option<HashMap<String, String>>,
) -> Result<PtySessionInfo, String> {
    let pty_system = native_pty_system();

    // Create PTY with specified size
    let pair = pty_system
        .openpty(PtySize {
            rows: rows.unwrap_or(24),
            cols: cols.unwrap_or(80),
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| format!("Failed to open PTY: {}", e))?;

    // Build the shell command
    let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());
    let mut cmd = CommandBuilder::new(&shell);
    
    // Add login shell flags for proper environment
    cmd.arg("-l");
    
    // Set working directory
    if let Some(ref dir) = cwd {
        cmd.cwd(dir);
    }

    // Set environment variables
    cmd.env("TERM", "xterm-256color");
    cmd.env("COLORTERM", "truecolor");
    cmd.env("LANG", std::env::var("LANG").unwrap_or_else(|_| "en_US.UTF-8".to_string()));
    
    // Disable zsh's partial line indicator (the '%' symbol shown when output doesn't end with newline)
    // This is controlled by the PROMPT_SP option, we disable it via PROMPT_EOL_MARK
    cmd.env("PROMPT_EOL_MARK", "");
    
    // Add custom environment variables
    if let Some(custom_env) = env {
        for (key, value) in custom_env {
            cmd.env(key, value);
        }
    }

    // Spawn the child process
    let _child = pair
        .slave
        .spawn_command(cmd)
        .map_err(|e| format!("Failed to spawn shell: {}", e))?;

    // Get the writer for sending input to the PTY
    let writer = pair
        .master
        .take_writer()
        .map_err(|e| format!("Failed to get PTY writer: {}", e))?;

    // Get the reader for receiving output from the PTY
    let mut reader = pair
        .master
        .try_clone_reader()
        .map_err(|e| format!("Failed to get PTY reader: {}", e))?;

    let session = PtySession {
        pty_pair: pair,
        writer,
        id: session_id.clone(),
        alive: true,
    };

    let session_arc = Arc::new(Mutex::new(session));
    
    // Store the session
    {
        let mut state = PTY_STATE.lock();
        state.sessions.insert(session_id.clone(), session_arc.clone());
    }

    // Spawn a thread to read output from the PTY and emit events
    let session_id_clone = session_id.clone();
    let app_handle_clone = app_handle.clone();
    let session_arc_clone = session_arc.clone();
    
    thread::spawn(move || {
        let mut buffer = [0u8; 4096];
        loop {
            match reader.read(&mut buffer) {
                Ok(0) => {
                    // EOF - PTY closed
                    let mut session = session_arc_clone.lock();
                    session.alive = false;
                    
                    // Emit close event
                    let _ = app_handle_clone.emit(&format!("pty-close-{}", session_id_clone), ());
                    break;
                }
                Ok(n) => {
                    // Send the data to the frontend
                    let data = String::from_utf8_lossy(&buffer[..n]).to_string();
                    let _ = app_handle_clone.emit(&format!("pty-data-{}", session_id_clone), data);
                }
                Err(e) => {
                    eprintln!("PTY read error: {}", e);
                    let mut session = session_arc_clone.lock();
                    session.alive = false;
                    
                    // Emit error event
                    let _ = app_handle_clone.emit(
                        &format!("pty-error-{}", session_id_clone),
                        format!("Read error: {}", e),
                    );
                    break;
                }
            }
        }
        
        // Clean up the session
        let mut state = PTY_STATE.lock();
        state.sessions.remove(&session_id_clone);
    });

    Ok(PtySessionInfo {
        id: session_id,
        alive: true,
    })
}

/// Write data to a PTY session
#[tauri::command]
pub fn pty_write(session_id: String, data: String) -> Result<(), String> {
    let state = PTY_STATE.lock();
    
    let session_arc = state
        .sessions
        .get(&session_id)
        .ok_or_else(|| format!("Session not found: {}", session_id))?
        .clone();
    
    drop(state); // Release the lock before writing
    
    let mut session = session_arc.lock();
    
    if !session.alive {
        return Err("Session is not alive".to_string());
    }
    
    session
        .writer
        .write_all(data.as_bytes())
        .map_err(|e| format!("Failed to write to PTY: {}", e))?;
    
    session
        .writer
        .flush()
        .map_err(|e| format!("Failed to flush PTY: {}", e))?;
    
    Ok(())
}

/// Resize a PTY session
#[tauri::command]
pub fn pty_resize(session_id: String, rows: u16, cols: u16) -> Result<(), String> {
    let state = PTY_STATE.lock();
    
    let session_arc = state
        .sessions
        .get(&session_id)
        .ok_or_else(|| format!("Session not found: {}", session_id))?
        .clone();
    
    drop(state);
    
    let session = session_arc.lock();
    
    if !session.alive {
        return Err("Session is not alive".to_string());
    }
    
    session
        .pty_pair
        .master
        .resize(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| format!("Failed to resize PTY: {}", e))?;
    
    Ok(())
}

/// Kill a PTY session
#[tauri::command]
pub fn pty_kill(session_id: String) -> Result<(), String> {
    let mut state = PTY_STATE.lock();
    
    if let Some(session_arc) = state.sessions.remove(&session_id) {
        let mut session = session_arc.lock();
        session.alive = false;
        // The PTY will be cleaned up when the Arc is dropped
        Ok(())
    } else {
        Err(format!("Session not found: {}", session_id))
    }
}

/// Get information about a PTY session
#[tauri::command]
pub fn pty_get_session(session_id: String) -> Result<PtySessionInfo, String> {
    let state = PTY_STATE.lock();
    
    let session_arc = state
        .sessions
        .get(&session_id)
        .ok_or_else(|| format!("Session not found: {}", session_id))?;
    
    let session = session_arc.lock();
    
    Ok(PtySessionInfo {
        id: session.id.clone(),
        alive: session.alive,
    })
}

/// List all active PTY sessions
#[tauri::command]
pub fn pty_list_sessions() -> Vec<PtySessionInfo> {
    let state = PTY_STATE.lock();
    
    state
        .sessions
        .values()
        .map(|session_arc| {
            let session = session_arc.lock();
            PtySessionInfo {
                id: session.id.clone(),
                alive: session.alive,
            }
        })
        .collect()
}
