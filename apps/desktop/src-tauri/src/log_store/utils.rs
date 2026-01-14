use sha2::{Digest, Sha256};
use hex::encode;
use crate::log_store::models::IngestLogEntry;

/// Compute a stable ID for deduplication
/// Uses SHA-256 hash of key log properties
pub fn compute_log_id(
    ts: i64,
    deployment: &str,
    request_id: Option<&str>,
    function_path: Option<&str>,
    level: Option<&str>,
    message: &str,
) -> String {
    let mut hasher = Sha256::new();
    
    hasher.update(ts.to_le_bytes());
    hasher.update(deployment.as_bytes());
    
    if let Some(rid) = request_id {
        hasher.update(rid.as_bytes());
    }
    if let Some(fp) = function_path {
        hasher.update(fp.as_bytes());
    }
    if let Some(lvl) = level {
        hasher.update(lvl.as_bytes());
    }
    hasher.update(message.as_bytes());
    
    encode(hasher.finalize())
}

/// Extract a summary message from a log entry
pub fn extract_message(entry: &IngestLogEntry) -> String {
    // Priority: error > log lines > function name
    if let Some(ref error) = entry.error {
        return format!("Error: {}", error);
    }
    
    if let Some(ref lines) = entry.log_lines {
        if !lines.is_empty() {
            return lines.join(" | ");
        }
    }
    
    if let Some(ref name) = entry.function_name {
        if entry.success.unwrap_or(true) {
            return format!("Function '{}' executed", name);
        } else {
            return format!("Function '{}' failed", name);
        }
    }
    
    "Log entry".to_string()
}

/// Infer log level from entry
pub fn infer_level(entry: &IngestLogEntry) -> Option<String> {
    if entry.error.is_some() || !entry.success.unwrap_or(true) {
        return Some("ERROR".to_string());
    }
    
    // Could parse log_lines for level indicators if available
    // For now, default to INFO for successful executions
    if entry.success.unwrap_or(false) {
        Some("INFO".to_string())
    } else {
        None
    }
}

/// Infer topic from UDF type
pub fn infer_topic(udf_type: Option<&str>) -> Option<String> {
    udf_type.map(|t| match t.to_lowercase().as_str() {
        "query" | "mutation" | "action" | "httpaction" => "function".to_string(),
        _ => t.to_string(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compute_log_id_stable() {
        let id1 = compute_log_id(
            1234567890,
            "test-deployment",
            Some("req-123"),
            Some("api/myFunction"),
            Some("INFO"),
            "Test message",
        );
        
        let id2 = compute_log_id(
            1234567890,
            "test-deployment",
            Some("req-123"),
            Some("api/myFunction"),
            Some("INFO"),
            "Test message",
        );
        
        assert_eq!(id1, id2, "IDs should be stable for same input");
    }

    #[test]
    fn test_compute_log_id_different() {
        let id1 = compute_log_id(
            1234567890,
            "test-deployment",
            Some("req-123"),
            Some("api/myFunction"),
            Some("INFO"),
            "Test message 1",
        );
        
        let id2 = compute_log_id(
            1234567890,
            "test-deployment",
            Some("req-123"),
            Some("api/myFunction"),
            Some("INFO"),
            "Test message 2",
        );
        
        assert_ne!(id1, id2, "IDs should differ for different messages");
    }
}
