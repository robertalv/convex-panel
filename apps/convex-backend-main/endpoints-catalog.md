# Convex HTTP Endpoints Catalog

A comprehensive list of all HTTP endpoints available in the Convex platform.

## Public API Endpoints

### Query & Mutation Endpoints
- `POST /api/query` - Execute a query function
- `POST /api/query_batch` - Execute multiple queries in batch
- `POST /api/mutation` - Execute a mutation function
- `POST /api/action` - Execute an action function
- `POST /api/function` - Execute any function type
- `POST /api/function/{path}` - Execute function with path parameter

### Timestamp & Consistency
- `POST /api/query_ts` - Get latest timestamp for queries
- `POST /api/query_at_ts` - Execute query at specific timestamp

### WebSocket & Real-time
- `GET /api/sync` - WebSocket connection for real-time updates

## Storage API Endpoints

### File Operations
- `POST /api/storage/upload` - Upload file to storage
- `GET /api/storage/{storage_id}` - Download file from storage

## Admin/Dashboard API Endpoints (`/api/v1`)

### Schema & Database Management
- `POST /api/v1/shapes2` - Get database shapes/schema
- `GET /api/v1/get_indexes` - List database indexes
- `DELETE /api/v1/delete_tables` - Delete database tables
- `DELETE /api/v1/delete_component` - Delete component
- `DELETE /api/v1/delete_scheduled_functions_table` - Delete scheduled functions

### Development & Deployment
- `POST /api/v1/push_config` - Push configuration
- `POST /api/v1/prepare_schema` - Prepare schema changes
- `POST /api/v1/run_test_function` - Run test functions
- `POST /api/v1/deploy2/start_push` - Start deployment push
- `POST /api/v1/deploy2/evaluate_push` - Evaluate deployment
- `POST /api/v1/deploy2/wait_for_schema` - Wait for schema deployment
- `POST /api/v1/deploy2/finish_push` - Finish deployment
- `POST /api/v1/deploy2/report_push_completed` - Report deployment completion

### Environment & Configuration
- `POST /api/v1/update_environment_variables` - Update environment variables
- `GET /api/v1/list_environment_variables` - List environment variables
- `POST /api/v1/update_canonical_url` - Update canonical URL

### Scheduled Jobs
- `POST /api/v1/cancel_all_jobs` - Cancel all scheduled jobs
- `POST /api/v1/cancel_job` - Cancel specific job

## Action Callback Endpoints (`/api/actions`)

### Internal Function Calls
- `POST /api/actions/query` - Internal query execution
- `POST /api/actions/mutation` - Internal mutation execution
- `POST /api/actions/action` - Internal action execution
- `POST /api/actions/schedule_job` - Schedule a job
- `POST /api/actions/cancel_job` - Cancel developer job
- `POST /api/actions/vector_search` - Vector search operations
- `POST /api/actions/create_function_handle` - Create function handle

### File Storage (Internal)
- `POST /api/actions/storage/generateUploadUrl` - Generate upload URL
- `POST /api/actions/storage/getUrl` - Get file URL
- `POST /api/actions/storage/getMetadata` - Get file metadata
- `POST /api/actions/storage/delete` - Delete file

## Export/Import Endpoints

### Streaming Export (`/api/export`)
- `GET /api/export/document_deltas` - Get document changes
- `POST /api/export/document_deltas` - Get document changes (POST)
- `GET /api/export/list_snapshot` - List snapshots
- `POST /api/export/list_snapshot` - List snapshots (POST)
- `GET /api/export/json_schemas` - Get JSON schemas
- `GET /api/export/test_streaming_export_connection` - Test export connection

### Streaming Import (`/api/streaming_import`)
- `POST /api/streaming_import/import_airbyte_records` - Import Airbyte records
- `POST /api/streaming_import/apply_fivetran_operations` - Apply Fivetran operations

## Log Management (`/api/logs`)

### Log Sinks
- `POST /api/logs/datadog_sink` - Add Datadog log sink
- `POST /api/logs/webhook_sink` - Add webhook log sink
- `POST /api/logs/regenerate_webhook_secret` - Regenerate webhook secret
- `POST /api/logs/axiom_sink` - Add Axiom log sink
- `POST /api/logs/sentry_sink` - Add Sentry log sink
- `DELETE /api/logs/delete_sink` - Delete log sink

## HTTP Actions (`/http`)

Custom HTTP endpoints defined by developers using `httpRouter()`:
- User-defined paths and methods
- Examples: `/http/postMessage`, `/http/getMessagesByAuthor`

## Health & System Endpoints

### Health Checks
- `GET /` - Basic health check
- `GET /instance_name` - Get instance name
- `GET /instance_version` - Get instance version
- `POST /echo` - Echo endpoint for testing

### OpenAPI Documentation
- `GET /api/public_openapi.json` - Public API OpenAPI spec
- `GET /api/v1/openapi.json` - Platform API OpenAPI spec
- `GET /api/dashboard_openapi.json` - Dashboard API OpenAPI spec

## Request/Response Formats

### Standard Request Format
```json
{
  "path": "moduleName:functionName",
  "args": { /* function arguments */ },
  "format": "json" // optional
}
```

### Standard Response Format
```json
{
  "status": "success",
  "value": { /* function result */ },
  "logLines": ["log1", "log2"]
}
```

### Error Response Format
```json
{
  "status": "error",
  "errorMessage": "Error description",
  "errorData": { /* additional error info */ }
}
```

## Authentication

- **Public endpoints**: No authentication required
- **Admin endpoints**: Require admin key or authentication token
- **Action callbacks**: Internal authentication between services
- **Custom HTTP actions**: Developer-defined authentication

## Rate Limits & Size Limits

- **Public API requests**: Configurable via `MAX_BACKEND_PUBLIC_API_REQUEST_SIZE`
- **RPC requests**: Limited by `MAX_BACKEND_RPC_REQUEST_SIZE`
- **File uploads**: Limited by `HTTP_ACTION_BODY_LIMIT`
- **Echo endpoint**: Limited by `MAX_ECHO_BYTES`
- **Push operations**: Limited by `MAX_PUSH_BYTES`