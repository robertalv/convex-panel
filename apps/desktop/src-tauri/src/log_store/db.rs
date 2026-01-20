use rusqlite::{Connection, Result};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager};

/// Thread-safe database connection wrapper
pub type DbConnection = Arc<Mutex<Connection>>;

/// Initialize database at the given path and run migrations
pub fn init_db(app_handle: &AppHandle) -> Result<DbConnection> {
    let db_path = get_db_path(app_handle);
    
    // Ensure parent directory exists
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;
    }

    let conn = Connection::open(&db_path)?;
    
    // Set pragmas for performance and safety
    conn.execute_batch(
        "
        PRAGMA journal_mode=WAL;
        PRAGMA synchronous=NORMAL;
        PRAGMA temp_store=MEMORY;
        PRAGMA foreign_keys=ON;
        PRAGMA cache_size=-64000;
        ",
    )?;

    // Run migrations
    run_migrations(&conn)?;

    Ok(Arc::new(Mutex::new(conn)))
}

/// Get the path to the database file
fn get_db_path(app_handle: &AppHandle) -> PathBuf {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .expect("Failed to get app data directory");
    
    app_data_dir.join("convex-logs.db")
}

/// Run database migrations
fn run_migrations(conn: &Connection) -> Result<()> {
    // Create logs table
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS logs (
            id TEXT PRIMARY KEY,
            ts INTEGER NOT NULL,
            deployment TEXT NOT NULL,
            request_id TEXT,
            execution_id TEXT,
            topic TEXT,
            level TEXT,
            function_path TEXT,
            function_name TEXT,
            udf_type TEXT,
            success INTEGER,
            duration_ms INTEGER,
            message TEXT NOT NULL,
            json_blob TEXT NOT NULL,
            created_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_logs_ts ON logs(ts DESC);
        CREATE INDEX IF NOT EXISTS idx_logs_deployment_ts ON logs(deployment, ts DESC);
        CREATE INDEX IF NOT EXISTS idx_logs_request_id ON logs(request_id) WHERE request_id IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_logs_function_ts ON logs(function_path, ts DESC) WHERE function_path IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_logs_level_ts ON logs(level, ts DESC) WHERE level IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_logs_success_ts ON logs(success, ts DESC) WHERE success IS NOT NULL;

        -- FTS5 table for full-text search
        CREATE VIRTUAL TABLE IF NOT EXISTS logs_fts USING fts5(
            message,
            function_path,
            function_name,
            request_id,
            content='logs',
            content_rowid='rowid',
            tokenize='porter unicode61'
        );

        -- Settings table
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        INSERT OR IGNORE INTO settings (key, value) VALUES ('retention_days', '30');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('enabled', 'true');
        ",
    )?;

    // Create FTS triggers if they don't exist
    // We need to check if triggers exist first to avoid errors on re-creation
    let trigger_exists: bool = conn
        .query_row(
            "SELECT COUNT(*) > 0 FROM sqlite_master WHERE type='trigger' AND name='logs_ai'",
            [],
            |row| row.get(0),
        )
        .unwrap_or(false);

    if !trigger_exists {
        conn.execute_batch(
            "
            CREATE TRIGGER logs_ai AFTER INSERT ON logs BEGIN
                INSERT INTO logs_fts(rowid, message, function_path, function_name, request_id)
                VALUES (new.rowid, new.message, new.function_path, new.function_name, new.request_id);
            END;

            CREATE TRIGGER logs_ad AFTER DELETE ON logs BEGIN
                INSERT INTO logs_fts(logs_fts, rowid, message, function_path, function_name, request_id)
                VALUES ('delete', old.rowid, old.message, old.function_path, old.function_name, old.request_id);
            END;

            CREATE TRIGGER logs_au AFTER UPDATE ON logs BEGIN
                INSERT INTO logs_fts(logs_fts, rowid, message, function_path, function_name, request_id)
                VALUES ('delete', old.rowid, old.message, old.function_path, old.function_name, old.request_id);
                INSERT INTO logs_fts(rowid, message, function_path, function_name, request_id)
                VALUES (new.rowid, new.message, new.function_path, new.function_name, new.request_id);
            END;
            ",
        )?;
    }

    Ok(())
}

/// Get the database file size in bytes
pub fn get_db_size(app_handle: &AppHandle) -> std::io::Result<u64> {
    let db_path = get_db_path(app_handle);
    let metadata = std::fs::metadata(db_path)?;
    Ok(metadata.len())
}
