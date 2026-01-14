use serde::{Deserialize, Serialize};

/// Log entry as stored in SQLite
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    pub id: String,
    pub ts: i64,
    pub deployment: String,
    pub request_id: Option<String>,
    pub execution_id: Option<String>,
    pub topic: Option<String>,
    pub level: Option<String>,
    pub function_path: Option<String>,
    pub function_name: Option<String>,
    pub udf_type: Option<String>,
    pub success: Option<bool>,
    pub duration_ms: Option<i64>,
    pub message: String,
    pub json_blob: String,
    pub created_at: i64,
}

/// Incoming log entry from frontend (pre-processing)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IngestLogEntry {
    pub id: String,
    pub timestamp: i64,
    #[serde(rename = "functionIdentifier")]
    pub function_identifier: Option<String>,
    #[serde(rename = "functionName")]
    pub function_name: Option<String>,
    #[serde(rename = "udfType")]
    pub udf_type: Option<String>,
    #[serde(rename = "requestId")]
    pub request_id: Option<String>,
    #[serde(rename = "executionId")]
    pub execution_id: Option<String>,
    pub success: Option<bool>,
    #[serde(rename = "durationMs")]
    pub duration_ms: Option<i64>,
    pub error: Option<String>,
    #[serde(rename = "logLines")]
    pub log_lines: Option<Vec<String>>,
    pub raw: Option<serde_json::Value>,
}

/// Filter parameters for querying logs
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct LogFilters {
    pub deployment: Option<String>,
    pub start_ts: Option<i64>,
    pub end_ts: Option<i64>,
    pub levels: Option<Vec<String>>,
    pub topics: Option<Vec<String>>,
    pub function_path: Option<String>,
    pub request_id: Option<String>,
    pub success: Option<bool>,
}

/// Query result with logs and pagination cursor
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogQueryResult {
    pub logs: Vec<LogEntry>,
    pub total_count: i64,
    pub has_more: bool,
    pub cursor: Option<String>,
}

/// Result of ingest operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IngestResult {
    pub inserted: usize,
    pub duplicates: usize,
    pub errors: usize,
}

/// Statistics about the log store
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogStats {
    pub total_logs: i64,
    pub oldest_ts: Option<i64>,
    pub newest_ts: Option<i64>,
    pub db_size_bytes: i64,
    pub logs_by_deployment: Vec<(String, i64)>,
}

/// Configuration settings for log store
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogStoreSettings {
    pub retention_days: i32,
    pub enabled: bool,
}

impl Default for LogStoreSettings {
    fn default() -> Self {
        Self {
            retention_days: 30,
            enabled: true,
        }
    }
}
