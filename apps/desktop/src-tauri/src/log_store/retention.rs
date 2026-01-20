use std::sync::{Arc, Mutex};
use std::time::Duration;
use rusqlite::{params, Connection};

/// Run retention job immediately (synchronous version)
pub fn run_retention_once(
    conn: Arc<Mutex<Connection>>,
    retention_days: i32,
) -> Result<i64, String> {
    let conn_guard = conn.lock().unwrap();
    
    let cutoff_ts = chrono::Utc::now().timestamp_millis() 
        - (retention_days as i64 * 24 * 60 * 60 * 1000);
    
    let deleted = conn_guard
        .execute("DELETE FROM logs WHERE ts < ?", params![cutoff_ts])
        .map_err(|e| format!("Delete error: {}", e))?;
    
    // Checkpoint WAL to reclaim space (query_row because it returns results)
    let _ = conn_guard
        .query_row("PRAGMA wal_checkpoint(TRUNCATE)", [], |_| Ok(()))
        .map_err(|e| format!("Checkpoint error: {}", e))?;
    
    drop(conn_guard); // Release lock
    
    println!("[log_store] Retention job: deleted {} old logs", deleted);
    
    Ok(deleted as i64)
}

/// Start background retention scheduler using Tauri's async runtime
/// Runs on startup and then every 24 hours
pub fn start_retention_scheduler(conn: Arc<Mutex<Connection>>, _handle: tauri::AppHandle) {
    // Use Tauri's async runtime instead of tokio::spawn
    tauri::async_runtime::spawn(async move {
        // Run immediately on startup
        let retention_days = get_retention_days(&conn);
        if let Err(e) = run_retention_once(Arc::clone(&conn), retention_days) {
            eprintln!("[log_store] Retention job failed on startup: {}", e);
        }
        
        // Then run every 24 hours
        loop {
            tokio::time::sleep(Duration::from_secs(24 * 60 * 60)).await;
            
            let retention_days = get_retention_days(&conn);
            
            match run_retention_once(Arc::clone(&conn), retention_days) {
                Ok(deleted) => {
                    println!("[log_store] Scheduled retention: deleted {} logs", deleted);
                }
                Err(e) => {
                    eprintln!("[log_store] Scheduled retention failed: {}", e);
                }
            }
        }
    });
}

/// Get retention_days setting from database (synchronous)
fn get_retention_days(conn: &Arc<Mutex<Connection>>) -> i32 {
    let conn_guard = conn.lock().unwrap();
    
    conn_guard
        .query_row(
            "SELECT value FROM settings WHERE key = 'retention_days'",
            [],
            |row| {
                let val: String = row.get(0)?;
                Ok(val.parse().unwrap_or(30))
            },
        )
        .unwrap_or(30)
}
