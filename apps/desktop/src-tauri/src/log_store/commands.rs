use rusqlite::{params, Result as SqliteResult};
use tauri::State;

use super::db::DbConnection;
use super::models::*;
use super::utils::{compute_log_id, extract_message, infer_level, infer_topic};

/// Ingest a batch of logs into the database
#[tauri::command]
pub async fn ingest_logs(
    db: State<'_, DbConnection>,
    logs: Vec<IngestLogEntry>,
    deployment: String,
) -> Result<IngestResult, String> {
    let conn = db.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let mut inserted = 0;
    let mut duplicates = 0;
    let mut errors = 0;
    
    let now = chrono::Utc::now().timestamp_millis();
    
    for entry in logs {
        // Compute stable ID
        let message = extract_message(&entry);
        let level = infer_level(&entry);
        let topic = infer_topic(entry.udf_type.as_deref());
        
        let id = compute_log_id(
            entry.timestamp,
            &deployment,
            entry.request_id.as_deref(),
            entry.function_identifier.as_deref(),
            level.as_deref(),
            &message,
        );
        
        // Serialize raw data to JSON
        let json_blob = if let Some(raw) = &entry.raw {
            serde_json::to_string(raw).unwrap_or_else(|_| "{}".to_string())
        } else {
            serde_json::to_string(&entry).unwrap_or_else(|_| "{}".to_string())
        };
        
        // Try to insert (will fail silently on duplicate primary key)
        let result: SqliteResult<usize> = conn.execute(
            "INSERT OR IGNORE INTO logs (
                id, ts, deployment, request_id, execution_id,
                topic, level, function_path, function_name, udf_type,
                success, duration_ms, message, json_blob, created_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
            params![
                id,
                entry.timestamp,
                deployment,
                entry.request_id,
                entry.execution_id,
                topic,
                level,
                entry.function_identifier,
                entry.function_name,
                entry.udf_type,
                entry.success.map(|s| if s { 1 } else { 0 }),
                entry.duration_ms,
                message,
                json_blob,
                now,
            ],
        );
        
        match result {
            Ok(rows) => {
                if rows > 0 {
                    inserted += 1;
                } else {
                    duplicates += 1;
                }
            }
            Err(e) => {
                eprintln!("Failed to insert log: {}", e);
                errors += 1;
            }
        }
    }
    
    Ok(IngestResult {
        inserted,
        duplicates,
        errors,
    })
}

/// Query logs with filters and pagination
#[tauri::command]
pub async fn query_logs(
    db: State<'_, DbConnection>,
    filters: LogFilters,
    limit: Option<i32>,
    cursor: Option<String>,
) -> Result<LogQueryResult, String> {
    let conn = db.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let limit = limit.unwrap_or(100).min(1000); // Cap at 1000
    
    // Parse cursor (format: "ts:id")
    let (cursor_ts, cursor_id) = if let Some(c) = cursor {
        let parts: Vec<&str> = c.split(':').collect();
        if parts.len() == 2 {
            (
                parts[0].parse::<i64>().ok(),
                Some(parts[1].to_string()),
            )
        } else {
            (None, None)
        }
    } else {
        (None, None)
    };
    
    // Build WHERE clause
    let mut where_clauses = Vec::new();
    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    
    if let Some(ref deployment) = filters.deployment {
        where_clauses.push("deployment = ?".to_string());
        params_vec.push(Box::new(deployment.clone()));
    }
    
    if let Some(start_ts) = filters.start_ts {
        where_clauses.push("ts >= ?".to_string());
        params_vec.push(Box::new(start_ts));
    }
    
    if let Some(end_ts) = filters.end_ts {
        where_clauses.push("ts <= ?".to_string());
        params_vec.push(Box::new(end_ts));
    }
    
    if let Some(ref request_id) = filters.request_id {
        where_clauses.push("request_id = ?".to_string());
        params_vec.push(Box::new(request_id.clone()));
    }
    
    if let Some(ref function_path) = filters.function_path {
        where_clauses.push("function_path = ?".to_string());
        params_vec.push(Box::new(function_path.clone()));
    }
    
    if let Some(success) = filters.success {
        where_clauses.push("success = ?".to_string());
        params_vec.push(Box::new(if success { 1 } else { 0 }));
    }
    
    if let Some(ref levels) = filters.levels {
        if !levels.is_empty() {
            let placeholders = levels.iter().map(|_| "?").collect::<Vec<_>>().join(",");
            where_clauses.push(format!("level IN ({})", placeholders));
            for level in levels {
                params_vec.push(Box::new(level.clone()));
            }
        }
    }
    
    // Cursor pagination
    if let (Some(ts), Some(id)) = (cursor_ts, cursor_id) {
        where_clauses.push("(ts < ? OR (ts = ? AND id < ?))".to_string());
        params_vec.push(Box::new(ts));
        params_vec.push(Box::new(ts));
        params_vec.push(Box::new(id));
    }
    
    let where_clause = if where_clauses.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", where_clauses.join(" AND "))
    };
    
    let query = format!(
        "SELECT id, ts, deployment, request_id, execution_id, topic, level, 
                function_path, function_name, udf_type, success, duration_ms, 
                message, json_blob, created_at
         FROM logs
         {}
         ORDER BY ts DESC, id DESC
         LIMIT {}",
        where_clause,
        limit + 1 // Fetch one extra to check if there's more
    );
    
    let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|b| b.as_ref()).collect();
    
    let mut stmt = conn
        .prepare(&query)
        .map_err(|e| format!("Prepare error: {}", e))?;
    
    let logs_iter = stmt
        .query_map(params_refs.as_slice(), |row| {
            Ok(LogEntry {
                id: row.get(0)?,
                ts: row.get(1)?,
                deployment: row.get(2)?,
                request_id: row.get(3)?,
                execution_id: row.get(4)?,
                topic: row.get(5)?,
                level: row.get(6)?,
                function_path: row.get(7)?,
                function_name: row.get(8)?,
                udf_type: row.get(9)?,
                success: row.get::<_, Option<i32>>(10)?.map(|v| v != 0),
                duration_ms: row.get(11)?,
                message: row.get(12)?,
                json_blob: row.get(13)?,
                created_at: row.get(14)?,
            })
        })
        .map_err(|e| format!("Query error: {}", e))?;
    
    let mut logs: Vec<LogEntry> = logs_iter.collect::<SqliteResult<Vec<_>>>()
        .map_err(|e| format!("Collect error: {}", e))?;
    
    // Check if there are more results
    let has_more = logs.len() > limit as usize;
    if has_more {
        logs.pop(); // Remove the extra item
    }
    
    // Create next cursor from last item
    let next_cursor = logs.last().map(|log| format!("{}:{}", log.ts, log.id));
    
    // Get total count (expensive, but useful)
    let total_count: i64 = conn
        .query_row(
            &format!("SELECT COUNT(*) FROM logs {}", where_clause),
            params_refs.as_slice(),
            |row| row.get(0),
        )
        .unwrap_or(0);
    
    Ok(LogQueryResult {
        logs,
        total_count,
        has_more,
        cursor: next_cursor,
    })
}

/// Search logs using FTS5 full-text search
#[tauri::command]
pub async fn search_logs(
    db: State<'_, DbConnection>,
    query: String,
    filters: LogFilters,
    limit: Option<i32>,
    _cursor: Option<String>, // TODO: Implement cursor for search
) -> Result<LogQueryResult, String> {
    let conn = db.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let limit = limit.unwrap_or(100).min(1000);
    
    // Sanitize FTS query (basic escaping)
    let fts_query = query
        .replace('"', "\"\"")
        .trim()
        .to_string();
    
    if fts_query.is_empty() {
        return Err("Empty search query".to_string());
    }
    
    // Build WHERE clause for additional filters
    let mut where_clauses = Vec::new();
    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    
    if let Some(ref deployment) = filters.deployment {
        where_clauses.push("logs.deployment = ?".to_string());
        params_vec.push(Box::new(deployment.clone()));
    }
    
    if let Some(start_ts) = filters.start_ts {
        where_clauses.push("logs.ts >= ?".to_string());
        params_vec.push(Box::new(start_ts));
    }
    
    if let Some(end_ts) = filters.end_ts {
        where_clauses.push("logs.ts <= ?".to_string());
        params_vec.push(Box::new(end_ts));
    }
    
    let additional_where = if where_clauses.is_empty() {
        String::new()
    } else {
        format!("AND {}", where_clauses.join(" AND "))
    };
    
    let sql = format!(
        "SELECT logs.id, logs.ts, logs.deployment, logs.request_id, logs.execution_id,
                logs.topic, logs.level, logs.function_path, logs.function_name, logs.udf_type,
                logs.success, logs.duration_ms, logs.message, logs.json_blob, logs.created_at
         FROM logs_fts
         JOIN logs ON logs.rowid = logs_fts.rowid
         WHERE logs_fts MATCH ?
         {}
         ORDER BY logs.ts DESC
         LIMIT {}",
        additional_where, limit
    );
    
    // Prepend FTS query to params
    let mut all_params: Vec<Box<dyn rusqlite::ToSql>> = vec![Box::new(fts_query)];
    all_params.extend(params_vec);
    
    let params_refs: Vec<&dyn rusqlite::ToSql> = all_params.iter().map(|b| b.as_ref()).collect();
    
    let mut stmt = conn
        .prepare(&sql)
        .map_err(|e| format!("Prepare error: {}", e))?;
    
    let logs_iter = stmt
        .query_map(params_refs.as_slice(), |row| {
            Ok(LogEntry {
                id: row.get(0)?,
                ts: row.get(1)?,
                deployment: row.get(2)?,
                request_id: row.get(3)?,
                execution_id: row.get(4)?,
                topic: row.get(5)?,
                level: row.get(6)?,
                function_path: row.get(7)?,
                function_name: row.get(8)?,
                udf_type: row.get(9)?,
                success: row.get::<_, Option<i32>>(10)?.map(|v| v != 0),
                duration_ms: row.get(11)?,
                message: row.get(12)?,
                json_blob: row.get(13)?,
                created_at: row.get(14)?,
            })
        })
        .map_err(|e| format!("Query error: {}", e))?;
    
    let logs: Vec<LogEntry> = logs_iter
        .collect::<SqliteResult<Vec<_>>>()
        .map_err(|e| format!("Collect error: {}", e))?;
    
    let total_count = logs.len() as i64;
    
    Ok(LogQueryResult {
        logs,
        total_count,
        has_more: false,
        cursor: None,
    })
}

/// Get a single log by ID
#[tauri::command]
pub async fn get_log_by_id(
    db: State<'_, DbConnection>,
    id: String,
) -> Result<Option<LogEntry>, String> {
    let conn = db.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let result = conn.query_row(
        "SELECT id, ts, deployment, request_id, execution_id, topic, level,
                function_path, function_name, udf_type, success, duration_ms,
                message, json_blob, created_at
         FROM logs WHERE id = ?",
        params![id],
        |row| {
            Ok(LogEntry {
                id: row.get(0)?,
                ts: row.get(1)?,
                deployment: row.get(2)?,
                request_id: row.get(3)?,
                execution_id: row.get(4)?,
                topic: row.get(5)?,
                level: row.get(6)?,
                function_path: row.get(7)?,
                function_name: row.get(8)?,
                udf_type: row.get(9)?,
                success: row.get::<_, Option<i32>>(10)?.map(|v| v != 0),
                duration_ms: row.get(11)?,
                message: row.get(12)?,
                json_blob: row.get(13)?,
                created_at: row.get(14)?,
            })
        },
    );
    
    match result {
        Ok(log) => Ok(Some(log)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Query error: {}", e)),
    }
}

/// Delete logs older than N days
#[tauri::command]
pub async fn delete_logs_older_than(
    db: State<'_, DbConnection>,
    days: i32,
) -> Result<i64, String> {
    let conn = db.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let cutoff_ts = chrono::Utc::now().timestamp_millis() - (days as i64 * 24 * 60 * 60 * 1000);
    
    let deleted = conn
        .execute("DELETE FROM logs WHERE ts < ?", params![cutoff_ts])
        .map_err(|e| format!("Delete error: {}", e))?;
    
    // Checkpoint WAL to reclaim space (query_row because it returns results)
    let _ = conn
        .query_row("PRAGMA wal_checkpoint(TRUNCATE)", [], |_| Ok(()))
        .map_err(|e| format!("Checkpoint error: {}", e))?;
    
    Ok(deleted as i64)
}

/// Get log statistics
#[tauri::command]
pub async fn get_log_stats(
    db: State<'_, DbConnection>,
    app_handle: tauri::AppHandle,
) -> Result<LogStats, String> {
    let conn = db.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    // Total logs
    let total_logs: i64 = conn
        .query_row("SELECT COUNT(*) FROM logs", [], |row| row.get(0))
        .unwrap_or(0);
    
    // Oldest and newest timestamps
    let oldest_ts: Option<i64> = conn
        .query_row("SELECT MIN(ts) FROM logs", [], |row| row.get(0))
        .ok();
    
    let newest_ts: Option<i64> = conn
        .query_row("SELECT MAX(ts) FROM logs", [], |row| row.get(0))
        .ok();
    
    // Logs by deployment
    let mut stmt = conn
        .prepare("SELECT deployment, COUNT(*) FROM logs GROUP BY deployment")
        .map_err(|e| format!("Prepare error: {}", e))?;
    
    let logs_by_deployment: Vec<(String, i64)> = stmt
        .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
        .map_err(|e| format!("Query error: {}", e))?
        .filter_map(|r| r.ok())
        .collect();
    
    // Database size
    let db_size_bytes = super::db::get_db_size(&app_handle).unwrap_or(0);
    
    Ok(LogStats {
        total_logs,
        oldest_ts,
        newest_ts,
        db_size_bytes: db_size_bytes as i64,
        logs_by_deployment,
    })
}

/// Get log store settings
#[tauri::command]
pub async fn get_log_store_settings(
    db: State<'_, DbConnection>,
) -> Result<LogStoreSettings, String> {
    let conn = db.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let retention_days: i32 = conn
        .query_row(
            "SELECT value FROM settings WHERE key = 'retention_days'",
            [],
            |row| {
                let val: String = row.get(0)?;
                Ok(val.parse().unwrap_or(30))
            },
        )
        .unwrap_or(30);
    
    let enabled: bool = conn
        .query_row("SELECT value FROM settings WHERE key = 'enabled'", [], |row| {
            let val: String = row.get(0)?;
            Ok(val == "true")
        })
        .unwrap_or(true);
    
    Ok(LogStoreSettings {
        retention_days,
        enabled,
    })
}

/// Set log store settings
#[tauri::command]
pub async fn set_log_store_settings(
    db: State<'_, DbConnection>,
    settings: LogStoreSettings,
) -> Result<(), String> {
    let conn = db.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('retention_days', ?)",
        params![settings.retention_days.to_string()],
    )
    .map_err(|e| format!("Update error: {}", e))?;
    
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('enabled', ?)",
        params![if settings.enabled { "true" } else { "false" }],
    )
    .map_err(|e| format!("Update error: {}", e))?;
    
    Ok(())
}

/// Clear all logs
#[tauri::command]
pub async fn clear_all_logs(db: State<'_, DbConnection>) -> Result<(), String> {
    let conn = db.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    conn.execute("DELETE FROM logs", [])
        .map_err(|e| format!("Delete error: {}", e))?;
    
    // Vacuum to reclaim space
    conn.execute("VACUUM", [])
        .map_err(|e| format!("Vacuum error: {}", e))?;
    
    Ok(())
}

/// Optimize database (VACUUM and rebuild FTS index)
#[tauri::command]
pub async fn optimize_log_db(db: State<'_, DbConnection>) -> Result<(), String> {
    let conn = db.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    // Checkpoint WAL (query_row because it returns results)
    let _ = conn
        .query_row("PRAGMA wal_checkpoint(TRUNCATE)", [], |_| Ok(()))
        .map_err(|e| format!("Checkpoint error: {}", e))?;
    
    // Rebuild FTS index
    conn.execute("INSERT INTO logs_fts(logs_fts) VALUES('rebuild')", [])
        .map_err(|e| format!("FTS rebuild error: {}", e))?;
    
    // Vacuum to reclaim space
    conn.execute("VACUUM", [])
        .map_err(|e| format!("Vacuum error: {}", e))?;
    
    Ok(())
}
