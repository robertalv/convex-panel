# Steps to Recreate FilesView as a Desktop Application

This guide outlines the steps needed to create a fully-featured desktop version of the FilesView component using Tauri.

## Current Status

✅ **Already Working:**
- Desktop app structure exists (`apps/desktop/`)
- FilesView component is already integrated into MainViews
- Tauri setup with OAuth authentication
- Basic React rendering in desktop window
- FilesView UI components and logic

## Implementation Steps

### Phase 1: Core Desktop Setup & Testing

#### 1.1 Verify Current Integration
- [ ] **Test existing FilesView in desktop app**
  - Run `pnpm dev` in `apps/desktop/`
  - Navigate to Files tab
  - Verify component renders correctly
  - Test basic file listing

#### 1.2 Update Tauri Configuration
- [ ] **Enhance `tauri.conf.json` for FilesView:**
```json
{
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": {
        "all": false,
        "open": true
      },
      "dialog": {
        "all": false,
        "open": true,
        "save": true
      },
      "fs": {
        "all": false,
        "scope": ["$DOWNLOAD/*", "$TEMP/*"]
      }
    },
    "windows": [{
      "width": 1200,
      "height": 800,
      "minWidth": 800,
      "minHeight": 600,
      "title": "Convex Panel - Files"
    }]
  }
}
```

### Phase 2: Native File Operations

#### 2.1 Add Native File Dialog Support
- [ ] **Update `apps/desktop/src-tauri/Cargo.toml`:**
```toml
[dependencies]
tauri = { version = "1", features = [
  "shell-open",
  "dialog-all",
  "fs-all",
  "fs-read-file",
  "fs-write-file",
  "fs-read-dir",
  "fs-create-dir",
  "fs-remove",
  "fs-rename",
  "fs-copy-file",
  "fs-exists"
] }
```

- [ ] **Add Rust commands for file dialogs** (`apps/desktop/src-tauri/src/main.rs`):
```rust
use tauri::api::dialog::{FileDialogBuilder, MessageDialogBuilder};
use tauri::Manager;

#[tauri::command]
async fn open_file_dialog() -> Result<Option<Vec<String>>, String> {
  let file_paths = FileDialogBuilder::new()
    .add_filter("All Files", &["*"])
    .set_multiselect(true)
    .pick_files();
  
  Ok(file_paths.map(|paths| {
    paths.iter().map(|p| p.to_string_lossy().to_string()).collect()
  }))
}

#[tauri::command]
async fn save_file_dialog(default_name: String) -> Result<Option<String>, String> {
  let file_path = FileDialogBuilder::new()
    .set_file_name(&default_name)
    .save_file();
  
  Ok(file_path.map(|p| p.to_string_lossy().to_string()))
}

#[tauri::command]
async fn read_file_bytes(path: String) -> Result<Vec<u8>, String> {
  std::fs::read(&path).map_err(|e| e.to_string())
}
```

- [ ] **Update invoke handler:**
```rust
.invoke_handler(tauri::generate_handler![
  start_oauth_server,
  open_file_dialog,
  save_file_dialog,
  read_file_bytes
])
```

#### 2.2 Create Desktop File Upload Hook
- [ ] **Create `apps/desktop/src/hooks/useNativeFileUpload.ts`:**
```typescript
import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

export function useNativeFileUpload() {
  const [isLoading, setIsLoading] = useState(false);

  const selectFiles = useCallback(async (): Promise<File[]> => {
    setIsLoading(true);
    try {
      const filePaths = await invoke<string[]>('open_file_dialog');
      
      if (!filePaths || filePaths.length === 0) {
        return [];
      }

      // Convert file paths to File objects
      const files = await Promise.all(
        filePaths.map(async (path) => {
          const bytes = await invoke<number[]>('read_file_bytes', { path });
          const blob = new Blob([new Uint8Array(bytes)]);
          
          // Extract filename from path
          const filename = path.split(/[/\\]/).pop() || 'file';
          
          return new File([blob], filename, {
            type: blob.type || 'application/octet-stream',
          });
        })
      );

      return files;
    } catch (error) {
      console.error('File selection error:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { selectFiles, isLoading };
}
```

### Phase 3: Enhanced File Download

#### 3.1 Add Native Save Dialog
- [ ] **Update Rust commands** (add to `main.rs`):
```rust
#[tauri::command]
async fn save_file_dialog_with_data(
  default_name: String,
  data: Vec<u8>
) -> Result<bool, String> {
  if let Some(path) = FileDialogBuilder::new()
    .set_file_name(&default_name)
    .save_file()
  {
    std::fs::write(&path, data).map_err(|e| e.to_string())?;
    Ok(true)
  } else {
    Ok(false)
  }
}
```

#### 3.2 Update FilesView Download Handler
- [ ] **Create desktop-specific download utility** (`apps/desktop/src/utils/nativeDownload.ts`):
```typescript
import { invoke } from '@tauri-apps/api/tauri';

export async function downloadFileNative(
  fileUrl: string,
  filename: string,
  accessToken: string
): Promise<void> {
  // Fetch file data
  const response = await fetch(fileUrl, {
    headers: {
      'Authorization': `Convex ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status}`);
  }

  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = Array.from(new Uint8Array(arrayBuffer));

  // Use native save dialog
  await invoke('save_file_dialog_with_data', {
    defaultName: filename,
    data: bytes,
  });
}
```

### Phase 4: System Integration Enhancements

#### 4.1 Context Menu Support
- [ ] **Add context menu Tauri commands:**
```rust
use tauri::Menu;
use tauri::MenuItem;

fn create_menu() -> Menu {
  Menu::new()
    .add_item(MenuItem::Copy)
    .add_item(MenuItem::Paste)
    .add_item(MenuItem::Separator)
    .add_item(MenuItem::SelectAll)
}
```

- [ ] **Update main.rs:**
```rust
tauri::Builder::default()
  .menu(create_menu())
  // ... rest of builder
```

#### 4.2 Native Drag & Drop from File System
- [ ] **The existing drag-and-drop should work**, but enhance with:
  - Visual feedback for files dragged from OS
  - Support for dropping entire folders
  - Progress indicators for multiple files

#### 4.3 Keyboard Shortcuts
- [ ] **Add global keyboard shortcuts** (`apps/desktop/src/hooks/useKeyboardShortcuts.ts`):
```typescript
import { useEffect } from 'react';
import { useGlobalShortcut } from '@tauri-apps/api/globalShortcut';

export function useFilesViewShortcuts({
  onUpload,
  onDelete,
  onSelectAll,
}: {
  onUpload: () => void;
  onDelete: () => void;
  onSelectAll: () => void;
}) {
  useEffect(() => {
    const registerShortcuts = async () => {
      await useGlobalShortcut.register('CommandOrControl+U', onUpload);
      await useGlobalShortcut.register('Delete', onDelete);
      await useGlobalShortcut.register('CommandOrControl+A', onSelectAll);
    };

    registerShortcuts();

    return () => {
      useGlobalShortcut.unregisterAll();
    };
  }, [onUpload, onDelete, onSelectAll]);
}
```

### Phase 5: Desktop-Specific UI Enhancements

#### 5.1 Window Management
- [ ] **Add window controls** for better desktop UX:
  - Maximize/minimize
  - Window state persistence
  - Multi-window support for file previews

#### 5.2 File Preview Enhancements
- [ ] **Enhance FilePreview component** for desktop:
  - Open in external applications
  - Quick look/preview integration
  - Better image/video handling

#### 5.3 System Notifications
- [ ] **Add Tauri notification support** (`Cargo.toml`):
```toml
tauri = { version = "1", features = ["notification-all"] }
```

- [ ] **Create notification utility:**
```typescript
import { sendNotification } from '@tauri-apps/api/notification';

export function notifyFileUploaded(filename: string) {
  sendNotification({
    title: 'File Uploaded',
    body: `${filename} has been uploaded successfully`,
  });
}
```

### Phase 6: Performance & Optimization

#### 6.1 Large File Handling
- [ ] **Stream large files** instead of loading entirely in memory
- [ ] **Add chunked upload** for files > 50MB
- [ ] **Progress persistence** across app restarts

#### 6.2 Offline Support
- [ ] **Cache file metadata** locally
- [ ] **Queue uploads** when offline
- [ ] **Sync when connection restored**

#### 6.3 Batch Operations
- [ ] **Multi-file selection** (already implemented)
- [ ] **Bulk delete/upload/download**
- [ ] **Progress tracking** for batch operations

### Phase 7: Testing & Polish

#### 7.1 Cross-Platform Testing
- [ ] **Test on macOS**
- [ ] **Test on Windows**
- [ ] **Test on Linux**

#### 7.2 Error Handling
- [ ] **Desktop-specific error dialogs**
- [ ] **Better error messages** for file system operations
- [ ] **Retry mechanisms** for failed uploads

#### 7.3 Accessibility
- [ ] **Screen reader support**
- [ ] **Keyboard navigation**
- [ ] **High contrast mode**

## Quick Start Implementation Order

1. **Minimum Viable Desktop App:**
   - Verify FilesView renders ✅ (Already done)
   - Test basic file listing ✅ (Already done)
   - Test file upload (web-based) ✅ (Already works)

2. **Essential Desktop Features:**
   - Native file picker (Phase 2.1-2.2)
   - Native file save (Phase 3.1-3.2)
   - Keyboard shortcuts (Phase 4.3)

3. **Enhanced Desktop Experience:**
   - System notifications (Phase 5.3)
   - Context menus (Phase 4.1)
   - Window management (Phase 5.1)

4. **Advanced Features:**
   - Large file handling (Phase 6.1)
   - Offline support (Phase 6.2)
   - Batch operations (Phase 6.3)

## Code Integration Points

### FilesView Component Location
- Main component: `packages/panel/src/views/files/files-view.tsx`
- Already integrated in: `packages/panel/src/components/main-view.tsx` (line 61-72)

### Desktop App Entry Point
- Desktop app: `apps/desktop/src/App.tsx`
- Uses: `@convex-panel` package which includes FilesView

### Authentication Flow
- Desktop auth: `apps/desktop/src/hooks/useTauriAuth.ts`
- OAuth server: `apps/desktop/src-tauri/src/main.rs`

## Dependencies to Add

```json
// apps/desktop/package.json
{
  "dependencies": {
    "@tauri-apps/api": "^1.5.3", // Already added
    // Add if needed:
    "@tauri-apps/plugin-dialog": "^1.0.0",
    "@tauri-apps/plugin-fs": "^1.0.0",
    "@tauri-apps/plugin-notification": "^1.0.0"
  }
}
```

## Notes

- The FilesView component is **already functional** in the desktop app
- Most enhancements are **optional** and focus on native desktop integration
- Web-based file operations (drag-drop, file input) **already work** in Tauri
- Native dialogs provide **better UX** but aren't strictly necessary

## Testing Commands

```bash
# Start desktop app
cd apps/desktop
pnpm dev

# Build for production
pnpm tauri build

# Run tests
pnpm test
```

