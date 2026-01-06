//! MCP (Model Context Protocol) Server implementation
//! 
//! This module implements an HTTP-based MCP server that allows Cursor IDE
//! to interact with Convex through the desktop application.

use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Arc;

use axum::{
    extract::{Json, State},
    http::{header, Method, StatusCode},
    response::{IntoResponse, Response, Sse},
    routing::{get, post},
    Router,
};
use futures::stream::Stream;
use once_cell::sync::OnceCell;
use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use tauri::Emitter;
use tokio::sync::{broadcast, oneshot};
use tower_http::cors::{Any, CorsLayer};
use uuid::Uuid;

/// Global MCP server state
static MCP_SERVER: OnceCell<Arc<McpServerState>> = OnceCell::new();

/// MCP Server configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpConfig {
    pub port: u16,
    pub auto_start: bool,
}

impl Default for McpConfig {
    fn default() -> Self {
        Self {
            port: 0, // 0 means auto-select
            auto_start: true,
        }
    }
}

/// MCP Server status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpStatus {
    pub running: bool,
    pub port: Option<u16>,
    pub url: Option<String>,
    pub connected_clients: usize,
}

/// MCP Server state
pub struct McpServerState {
    pub config: RwLock<McpConfig>,
    pub status: RwLock<McpStatus>,
    pub shutdown_tx: RwLock<Option<oneshot::Sender<()>>>,
    pub event_tx: broadcast::Sender<McpEvent>,
    pub app_handle: RwLock<Option<tauri::AppHandle>>,
    pub project_path: RwLock<Option<String>>,
    pub deployment_url: RwLock<Option<String>>,
    pub deploy_key: RwLock<Option<String>>,
}

impl McpServerState {
    pub fn new() -> Self {
        let (event_tx, _) = broadcast::channel(100);
        Self {
            config: RwLock::new(McpConfig::default()),
            status: RwLock::new(McpStatus {
                running: false,
                port: None,
                url: None,
                connected_clients: 0,
            }),
            shutdown_tx: RwLock::new(None),
            event_tx,
            app_handle: RwLock::new(None),
            project_path: RwLock::new(None),
            deployment_url: RwLock::new(None),
            deploy_key: RwLock::new(None),
        }
    }

    pub fn global() -> &'static Arc<McpServerState> {
        MCP_SERVER.get_or_init(|| Arc::new(McpServerState::new()))
    }
}

/// Events that can be sent via SSE
#[derive(Debug, Clone, Serialize)]
pub enum McpEvent {
    LogEntry { level: String, message: String, timestamp: i64 },
    FunctionResult { id: String, result: serde_json::Value },
    Error { id: String, error: String },
}

// ============================================================================
// MCP Protocol Types (JSON-RPC 2.0 based)
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct JsonRpcRequest {
    pub jsonrpc: String,
    pub id: Option<serde_json::Value>,
    pub method: String,
    #[serde(default)]
    pub params: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub struct JsonRpcResponse {
    pub jsonrpc: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<JsonRpcError>,
}

#[derive(Debug, Serialize)]
pub struct JsonRpcError {
    pub code: i32,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<serde_json::Value>,
}

impl JsonRpcResponse {
    pub fn success(id: Option<serde_json::Value>, result: serde_json::Value) -> Self {
        Self {
            jsonrpc: "2.0".to_string(),
            id,
            result: Some(result),
            error: None,
        }
    }

    pub fn error(id: Option<serde_json::Value>, code: i32, message: String) -> Self {
        Self {
            jsonrpc: "2.0".to_string(),
            id,
            result: None,
            error: Some(JsonRpcError {
                code,
                message,
                data: None,
            }),
        }
    }
}

// ============================================================================
// MCP Tool Definitions
// ============================================================================

#[derive(Debug, Serialize)]
pub struct McpToolDefinition {
    pub name: String,
    pub description: String,
    #[serde(rename = "inputSchema")]
    pub input_schema: serde_json::Value,
}

fn get_tool_definitions() -> Vec<McpToolDefinition> {
    vec![
        McpToolDefinition {
            name: "convex_run".to_string(),
            description: "Run a Convex query, mutation, or action function".to_string(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "function_name": {
                        "type": "string",
                        "description": "The function path, e.g., 'api.users.list' or 'messages:send'"
                    },
                    "args": {
                        "type": "object",
                        "description": "Arguments to pass to the function",
                        "additionalProperties": true
                    }
                },
                "required": ["function_name"]
            }),
        },
        McpToolDefinition {
            name: "convex_dev_start".to_string(),
            description: "Start the Convex development server (npx convex dev)".to_string(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "project_path": {
                        "type": "string",
                        "description": "Optional path to the project directory"
                    }
                }
            }),
        },
        McpToolDefinition {
            name: "convex_deploy".to_string(),
            description: "Deploy Convex functions to production (npx convex deploy)".to_string(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "project_path": {
                        "type": "string",
                        "description": "Optional path to the project directory"
                    }
                }
            }),
        },
        McpToolDefinition {
            name: "convex_logs".to_string(),
            description: "Get recent logs from the Convex deployment".to_string(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of log entries to return",
                        "default": 50
                    },
                    "level": {
                        "type": "string",
                        "enum": ["debug", "info", "warn", "error"],
                        "description": "Minimum log level to include"
                    }
                }
            }),
        },
        McpToolDefinition {
            name: "convex_data_list".to_string(),
            description: "List all tables in the Convex database".to_string(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {}
            }),
        },
        McpToolDefinition {
            name: "convex_data_query".to_string(),
            description: "Query data from a specific table".to_string(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "table": {
                        "type": "string",
                        "description": "The table name to query"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of rows to return",
                        "default": 10
                    }
                },
                "required": ["table"]
            }),
        },
        McpToolDefinition {
            name: "convex_env_list".to_string(),
            description: "List all environment variables for the deployment".to_string(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {}
            }),
        },
        McpToolDefinition {
            name: "convex_env_set".to_string(),
            description: "Set an environment variable for the deployment".to_string(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "The environment variable name"
                    },
                    "value": {
                        "type": "string",
                        "description": "The environment variable value"
                    }
                },
                "required": ["name", "value"]
            }),
        },
        McpToolDefinition {
            name: "convex_functions_list".to_string(),
            description: "List all Convex functions in the deployment".to_string(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {}
            }),
        },
        McpToolDefinition {
            name: "convex_schema".to_string(),
            description: "Get the current database schema".to_string(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {}
            }),
        },
        McpToolDefinition {
            name: "convex_open_file".to_string(),
            description: "Open a Convex-related file in the editor".to_string(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "file": {
                        "type": "string",
                        "description": "Relative path to the file within the convex directory"
                    },
                    "line": {
                        "type": "integer",
                        "description": "Optional line number to navigate to"
                    }
                },
                "required": ["file"]
            }),
        },
        McpToolDefinition {
            name: "convex_list_files".to_string(),
            description: "List files in the convex directory".to_string(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {}
            }),
        },
    ]
}

// ============================================================================
// HTTP Handlers
// ============================================================================

/// Main MCP endpoint - handles JSON-RPC requests
async fn handle_mcp_request(
    State(state): State<Arc<McpServerState>>,
    Json(request): Json<JsonRpcRequest>,
) -> impl IntoResponse {
    let response = match request.method.as_str() {
        // MCP Protocol methods
        "initialize" => handle_initialize(&request),
        "tools/list" => handle_tools_list(&request),
        "tools/call" => handle_tools_call(&state, &request).await,
        "resources/list" => handle_resources_list(&request),
        "prompts/list" => handle_prompts_list(&request),
        
        // Unknown method
        _ => JsonRpcResponse::error(
            request.id,
            -32601,
            format!("Method not found: {}", request.method),
        ),
    };

    Json(response)
}

fn handle_initialize(request: &JsonRpcRequest) -> JsonRpcResponse {
    JsonRpcResponse::success(
        request.id.clone(),
        serde_json::json!({
            "protocolVersion": "2024-11-05",
            "capabilities": {
                "tools": {},
                "resources": {},
                "prompts": {}
            },
            "serverInfo": {
                "name": "convex-panel",
                "version": env!("CARGO_PKG_VERSION")
            }
        }),
    )
}

fn handle_tools_list(request: &JsonRpcRequest) -> JsonRpcResponse {
    let tools = get_tool_definitions();
    JsonRpcResponse::success(
        request.id.clone(),
        serde_json::json!({
            "tools": tools
        }),
    )
}

async fn handle_tools_call(
    state: &Arc<McpServerState>,
    request: &JsonRpcRequest,
) -> JsonRpcResponse {
    let params = &request.params;
    let tool_name = params.get("name").and_then(|v| v.as_str()).unwrap_or("");
    let arguments = params.get("arguments").cloned().unwrap_or(serde_json::json!({}));

    let result = match tool_name {
        "convex_run" => execute_convex_run(state, &arguments).await,
        "convex_dev_start" => execute_convex_dev_start(state, &arguments).await,
        "convex_deploy" => execute_convex_deploy(state, &arguments).await,
        "convex_logs" => execute_convex_logs(state, &arguments).await,
        "convex_data_list" => execute_convex_data_list(state, &arguments).await,
        "convex_data_query" => execute_convex_data_query(state, &arguments).await,
        "convex_env_list" => execute_convex_env_list(state, &arguments).await,
        "convex_env_set" => execute_convex_env_set(state, &arguments).await,
        "convex_functions_list" => execute_convex_functions_list(state, &arguments).await,
        "convex_schema" => execute_convex_schema(state, &arguments).await,
        "convex_open_file" => execute_convex_open_file(state, &arguments).await,
        "convex_list_files" => execute_convex_list_files(state, &arguments).await,
        _ => Err(format!("Unknown tool: {}", tool_name)),
    };

    match result {
        Ok(content) => JsonRpcResponse::success(
            request.id.clone(),
            serde_json::json!({
                "content": [{
                    "type": "text",
                    "text": content
                }]
            }),
        ),
        Err(error) => JsonRpcResponse::success(
            request.id.clone(),
            serde_json::json!({
                "content": [{
                    "type": "text",
                    "text": format!("Error: {}", error)
                }],
                "isError": true
            }),
        ),
    }
}

fn handle_resources_list(request: &JsonRpcRequest) -> JsonRpcResponse {
    JsonRpcResponse::success(
        request.id.clone(),
        serde_json::json!({
            "resources": []
        }),
    )
}

fn handle_prompts_list(request: &JsonRpcRequest) -> JsonRpcResponse {
    JsonRpcResponse::success(
        request.id.clone(),
        serde_json::json!({
            "prompts": []
        }),
    )
}

/// Health check endpoint
async fn health_check() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "ok",
        "server": "convex-panel-mcp",
        "version": env!("CARGO_PKG_VERSION")
    }))
}

// ============================================================================
// Tool Implementations
// ============================================================================

async fn execute_convex_run(
    state: &Arc<McpServerState>,
    args: &serde_json::Value,
) -> Result<String, String> {
    let function_name = args.get("function_name")
        .and_then(|v| v.as_str())
        .ok_or("Missing function_name parameter")?;
    
    let function_args = args.get("args").cloned().unwrap_or(serde_json::json!({}));
    
    // Send command to the frontend to execute
    if let Some(app_handle) = state.app_handle.read().as_ref() {
        app_handle.emit("mcp:run-function", serde_json::json!({
            "function": function_name,
            "args": function_args
        })).map_err(|e| e.to_string())?;
    }
    
    Ok(format!("Requested execution of function: {} with args: {}", function_name, function_args))
}

async fn execute_convex_dev_start(
    state: &Arc<McpServerState>,
    args: &serde_json::Value,
) -> Result<String, String> {
    let project_path = args.get("project_path")
        .and_then(|v| v.as_str())
        .map(String::from)
        .or_else(|| state.project_path.read().clone());
    
    if let Some(app_handle) = state.app_handle.read().as_ref() {
        app_handle.emit("mcp:terminal-command", serde_json::json!({
            "command": "npx convex dev",
            "cwd": project_path,
            "newSession": true,
            "sessionName": "Convex Dev"
        })).map_err(|e| e.to_string())?;
    }
    
    Ok("Started Convex dev server in a new terminal session".to_string())
}

async fn execute_convex_deploy(
    state: &Arc<McpServerState>,
    args: &serde_json::Value,
) -> Result<String, String> {
    let project_path = args.get("project_path")
        .and_then(|v| v.as_str())
        .map(String::from)
        .or_else(|| state.project_path.read().clone());
    
    if let Some(app_handle) = state.app_handle.read().as_ref() {
        app_handle.emit("mcp:terminal-command", serde_json::json!({
            "command": "npx convex deploy",
            "cwd": project_path,
            "newSession": false
        })).map_err(|e| e.to_string())?;
    }
    
    Ok("Initiated Convex deploy".to_string())
}

async fn execute_convex_logs(
    state: &Arc<McpServerState>,
    args: &serde_json::Value,
) -> Result<String, String> {
    let limit = args.get("limit").and_then(|v| v.as_i64()).unwrap_or(50);
    
    if let Some(app_handle) = state.app_handle.read().as_ref() {
        app_handle.emit("mcp:get-logs", serde_json::json!({
            "limit": limit
        })).map_err(|e| e.to_string())?;
    }
    
    Ok(format!("Requested {} log entries", limit))
}

async fn execute_convex_data_list(
    state: &Arc<McpServerState>,
    _args: &serde_json::Value,
) -> Result<String, String> {
    if let Some(app_handle) = state.app_handle.read().as_ref() {
        app_handle.emit("mcp:list-tables", ()).map_err(|e| e.to_string())?;
    }
    
    Ok("Requested table list".to_string())
}

async fn execute_convex_data_query(
    state: &Arc<McpServerState>,
    args: &serde_json::Value,
) -> Result<String, String> {
    let table = args.get("table")
        .and_then(|v| v.as_str())
        .ok_or("Missing table parameter")?;
    
    let limit = args.get("limit").and_then(|v| v.as_i64()).unwrap_or(10);
    
    if let Some(app_handle) = state.app_handle.read().as_ref() {
        app_handle.emit("mcp:query-table", serde_json::json!({
            "table": table,
            "limit": limit
        })).map_err(|e| e.to_string())?;
    }
    
    Ok(format!("Requested {} rows from table: {}", limit, table))
}

async fn execute_convex_env_list(
    state: &Arc<McpServerState>,
    _args: &serde_json::Value,
) -> Result<String, String> {
    if let Some(app_handle) = state.app_handle.read().as_ref() {
        app_handle.emit("mcp:list-env", ()).map_err(|e| e.to_string())?;
    }
    
    Ok("Requested environment variable list".to_string())
}

async fn execute_convex_env_set(
    state: &Arc<McpServerState>,
    args: &serde_json::Value,
) -> Result<String, String> {
    let name = args.get("name")
        .and_then(|v| v.as_str())
        .ok_or("Missing name parameter")?;
    
    let value = args.get("value")
        .and_then(|v| v.as_str())
        .ok_or("Missing value parameter")?;
    
    if let Some(app_handle) = state.app_handle.read().as_ref() {
        app_handle.emit("mcp:set-env", serde_json::json!({
            "name": name,
            "value": value
        })).map_err(|e| e.to_string())?;
    }
    
    Ok(format!("Set environment variable: {}", name))
}

async fn execute_convex_functions_list(
    state: &Arc<McpServerState>,
    _args: &serde_json::Value,
) -> Result<String, String> {
    if let Some(app_handle) = state.app_handle.read().as_ref() {
        app_handle.emit("mcp:list-functions", ()).map_err(|e| e.to_string())?;
    }
    
    Ok("Requested functions list".to_string())
}

async fn execute_convex_schema(
    state: &Arc<McpServerState>,
    _args: &serde_json::Value,
) -> Result<String, String> {
    if let Some(app_handle) = state.app_handle.read().as_ref() {
        app_handle.emit("mcp:get-schema", ()).map_err(|e| e.to_string())?;
    }
    
    Ok("Requested schema".to_string())
}

async fn execute_convex_open_file(
    state: &Arc<McpServerState>,
    args: &serde_json::Value,
) -> Result<String, String> {
    let file = args.get("file")
        .and_then(|v| v.as_str())
        .ok_or("Missing file parameter")?;
    
    let line = args.get("line").and_then(|v| v.as_i64());
    
    if let Some(app_handle) = state.app_handle.read().as_ref() {
        app_handle.emit("mcp:open-file", serde_json::json!({
            "file": file,
            "line": line
        })).map_err(|e| e.to_string())?;
    }
    
    Ok(format!("Opening file: {}", file))
}

async fn execute_convex_list_files(
    state: &Arc<McpServerState>,
    _args: &serde_json::Value,
) -> Result<String, String> {
    let project_path = state.project_path.read().clone();
    
    if let Some(path) = project_path {
        let convex_dir = std::path::Path::new(&path).join("convex");
        if convex_dir.exists() {
            let mut files = Vec::new();
            for entry in walkdir::WalkDir::new(&convex_dir)
                .max_depth(3)
                .into_iter()
                .filter_map(|e| e.ok())
            {
                if entry.file_type().is_file() {
                    if let Ok(relative) = entry.path().strip_prefix(&convex_dir) {
                        files.push(relative.display().to_string());
                    }
                }
            }
            return Ok(serde_json::to_string_pretty(&files).unwrap_or_default());
        }
    }
    
    Err("Project path not set or convex directory not found".to_string())
}

// ============================================================================
// Server Lifecycle
// ============================================================================

/// Start the MCP server
pub async fn start_server(app_handle: tauri::AppHandle) -> Result<u16, String> {
    let state = McpServerState::global();
    
    // Check if already running
    if state.status.read().running {
        return Err("MCP server is already running".to_string());
    }
    
    // Store app handle
    *state.app_handle.write() = Some(app_handle.clone());
    
    // Create the router
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION]);
    
    let app = Router::new()
        .route("/", get(health_check))
        .route("/health", get(health_check))
        .route("/mcp", post(handle_mcp_request))
        .layer(cors)
        .with_state(Arc::clone(state));
    
    // Bind to available port
    let config = state.config.read().clone();
    let addr = SocketAddr::from(([127, 0, 0, 1], config.port));
    
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .map_err(|e| format!("Failed to bind to port: {}", e))?;
    
    let actual_port = listener.local_addr()
        .map_err(|e| format!("Failed to get local address: {}", e))?
        .port();
    
    // Update status
    {
        let mut status = state.status.write();
        status.running = true;
        status.port = Some(actual_port);
        status.url = Some(format!("http://localhost:{}/mcp", actual_port));
    }
    
    // Create shutdown channel
    let (shutdown_tx, shutdown_rx) = oneshot::channel::<()>();
    *state.shutdown_tx.write() = Some(shutdown_tx);
    
    // Spawn the server
    tokio::spawn(async move {
        axum::serve(listener, app)
            .with_graceful_shutdown(async {
                let _ = shutdown_rx.await;
            })
            .await
            .ok();
        
        // Update status on shutdown
        let state = McpServerState::global();
        let mut status = state.status.write();
        status.running = false;
        status.port = None;
        status.url = None;
    });
    
    Ok(actual_port)
}

/// Stop the MCP server
pub fn stop_server() -> Result<(), String> {
    let state = McpServerState::global();
    
    if !state.status.read().running {
        return Err("MCP server is not running".to_string());
    }
    
    if let Some(shutdown_tx) = state.shutdown_tx.write().take() {
        let _ = shutdown_tx.send(());
    }
    
    Ok(())
}

/// Get the current MCP server status
pub fn get_status() -> McpStatus {
    McpServerState::global().status.read().clone()
}

/// Set the project path for MCP operations
pub fn set_project_path(path: Option<String>) {
    *McpServerState::global().project_path.write() = path;
}

/// Set the deployment credentials
pub fn set_deployment_credentials(url: Option<String>, key: Option<String>) {
    let state = McpServerState::global();
    *state.deployment_url.write() = url;
    *state.deploy_key.write() = key;
}

/// Generate Cursor configuration for the MCP server
pub fn get_cursor_config() -> Option<String> {
    let status = McpServerState::global().status.read();
    if let Some(url) = &status.url {
        Some(serde_json::to_string_pretty(&serde_json::json!({
            "mcpServers": {
                "convex-panel": {
                    "url": url
                }
            }
        })).unwrap_or_default())
    } else {
        None
    }
}
