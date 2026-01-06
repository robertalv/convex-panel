# Schema Diff Mode - Future Implementation

## Overview

Add the ability to compare schema versions side-by-side, showing what changed between deployments or git commits.

## UI Design (Reference: Image 1 & 3)

- Toggle switch in toolbar labeled "Diff"
- When enabled, shows two version selectors:
  - "From" dropdown with schema versions (timestamps or commit hashes)
  - "To" dropdown (defaults to "LATEST")
- Graph view highlights changes:
  - **Green** - New tables/fields/indexes
  - **Red** - Removed tables/fields/indexes
  - **Yellow** - Modified tables/fields/indexes
- Sidebar tree also shows diff indicators

## Data Sources

1. **Git-based diff**: Parse schema.ts from git history
   - Requires access to local git repository
   - Use `git log --oneline convex/schema.ts` to get versions
   - Use `git show <commit>:convex/schema.ts` to get file content

2. **Deployment-based diff**: Compare deployed schemas
   - Fetch schema snapshots from Convex deployment API
   - Store historical schema snapshots locally
   - Compare against current `_system/frontend/getSchemas` response

## Implementation Steps

### Phase 1: Schema History Storage

- [ ] Create local SQLite/IndexedDB store for schema snapshots
- [ ] Hook into deployment events to capture schema changes
- [ ] Store schema JSON with timestamp and optional git commit hash

### Phase 2: Diff Algorithm

- [ ] Create `diffSchemas(oldSchema, newSchema)` utility
- [ ] Detect added/removed/modified tables
- [ ] Detect added/removed/modified fields within tables
- [ ] Detect added/removed/modified indexes
- [ ] Return structured diff result with change types

### Phase 3: UI Components

- [ ] Add diff toggle to `VisualizerToolbar`
- [ ] Create version selector dropdowns
- [ ] Modify `TableNode` to accept diff state and render change indicators
- [ ] Modify `SchemaTreeSidebar` to show diff indicators
- [ ] Add diff legend to explain color coding

### Phase 4: Code Editor Diff

- [ ] Integrate Monaco diff editor or similar
- [ ] Show side-by-side schema.ts code comparison
- [ ] Sync selection between graph and code diff views

## Types to Add

```typescript
interface SchemaDiff {
  added: {
    tables: string[];
    fields: Map<string, string[]>;
    indexes: Map<string, string[]>;
  };
  removed: {
    tables: string[];
    fields: Map<string, string[]>;
    indexes: Map<string, string[]>;
  };
  modified: {
    tables: string[];
    fields: Map<string, FieldChange[]>;
    indexes: Map<string, IndexChange[]>;
  };
}

interface FieldChange {
  fieldName: string;
  changeType: "type" | "optional" | "both";
  oldValue: string;
  newValue: string;
}

interface IndexChange {
  indexName: string;
  changeType: "fields" | "type" | "config";
  oldValue: any;
  newValue: any;
}

interface SchemaSnapshot {
  id: string;
  timestamp: number;
  commitHash?: string;
  commitMessage?: string;
  schemaJson: SchemaJSON;
}
```

## API Considerations

- May need new Convex API endpoint for schema history
- Or rely entirely on local git history
- Consider caching strategy for large schemas

## Priority

Medium - Nice to have after core visualizer is complete
