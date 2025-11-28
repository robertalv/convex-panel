# Features

Detailed documentation of Convex Panel features.

---

## Health View

The Health View provides real-time monitoring and insights into your Convex application's performance.

### Metrics Dashboard

| Metric | Description |
|--------|-------------|
| **Failure Rate** | Percentage of failed function executions over time |
| **Cache Hit Rate** | Efficiency of your application's caching layer |
| **Scheduler Status** | Health and execution status of scheduled functions |
| **Lag Chart** | Visual representation of system latency |

### Function Insights

- **Invocation Count** - Total function calls over time
- **Error Rate** - Percentage of failed executions
- **Execution Time** - Average, min, and max execution times
- **Cache Efficiency** - Hit/miss ratios per function

---

## Data View

Browse, filter, and manage your Convex database tables.

### Table Browser

- View all tables in your Convex database
- Paginated data display for large tables
- Real-time updates when data changes

### Sorting

- Click column headers to sort ascending/descending
- Multi-column sorting support
- Persistent sort preferences

### Filtering

- Advanced query-based filtering
- Filter by column values
- Date range filtering for timestamp fields
- Full-text search capabilities

### Context Menu

Right-click on any row for quick actions:
- Copy document ID
- Copy cell value
- Delete document
- View document details

### In-place Editing

- **Double-click** any editable cell to modify
- Smart type conversion (string, number, boolean, array, object)
- Real-time validation
- Immediate database updates

---

## Function Runner

Test and debug your Convex functions directly from the panel.

### Supported Function Types

| Type | Description |
|------|-------------|
| **Queries** | Read-only database operations |
| **Mutations** | Write operations that modify data |
| **Actions** | Side-effect operations (API calls, etc.) |

### Features

- **Function Selection** - Browse and select any function
- **Input Editor** - JSON editor for function arguments
- **Syntax Highlighting** - Monaco editor with TypeScript support
- **Result Display** - Formatted output with expandable objects
- **Error Handling** - Clear error messages with stack traces

### Usage

1. Select a function from the dropdown
2. Enter input parameters as JSON
3. Click "Run" to execute
4. View results or errors in the output panel

---

## Ask AI

Integrated AI assistant powered by Kapa for Convex-related questions.

### Capabilities

- **Documentation Lookup** - Find relevant Convex docs
- **Code Examples** - Get working code snippets
- **Best Practices** - Learn recommended patterns
- **Troubleshooting** - Debug common issues

### Example Questions

- "How do I create a scheduled function?"
- "What's the difference between a query and a mutation?"
- "How do I implement authentication with Convex?"
- "Show me an example of using useQuery"

---

## Upcoming Features

### Data Management
Enhanced data creation and editing:
- Create new documents with form UI
- Bulk edit operations
- Import/export data
- Schema-aware validation

### Functions View
Deeper function analysis:
- Source code viewing with syntax highlighting
- Performance charts per function
- Invocation history
- Function dependencies

### Schedulers View
Scheduled job management:
- View all scheduled functions
- Cron job configuration
- Execution history and logs
- Manual trigger capability

### Logs View
Comprehensive logging:
- Real-time log streaming
- Advanced filtering and search
- Log level filtering
- Export to file

