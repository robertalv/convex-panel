import React, { useState, useRef, useCallback } from "react";
import {
  Search,
  Upload,
  Calendar,
  ExternalLink,
  Trash2,
  FileCode,
  X,
} from "lucide-react";
import { ComponentSelector } from "../../components/component-selector";
import { ToolbarButton } from "../../components/ui/button";
import { Toolbar } from "../../components/ui/toolbar";
import { useComponents } from "../data/hooks/useComponents";
import { useFiles } from "./hooks/useFiles";
import type { FileMetadata } from "./api/types";
import { deleteFile, uploadFileWithFallbacks } from "./api/files";
import { useDeployment } from "@/contexts/deployment-context";
import { FilePreview } from "./components/FilePreview";
import { DateFilterDropdown } from "./components/DateFilterDropdown";
import type { DateFilter } from "./components/DateFilterDropdown";
import { Checkbox } from "../../components/ui/checkbox";
import { ROUTES } from "../../lib/constants";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import { ResizableSheet } from "../data/components/ResizableSheet";

// Module-level singleton to prevent multiple Tauri listener registrations
// This exists outside React's lifecycle to survive StrictMode mount/unmount cycles
let tauriDragDropInitialized = false;
// @ts-ignore - Stored for potential cleanup, kept alive for app lifetime
let tauriUnlistenFn: (() => void) | undefined;

// Module-level drop deduplication state
// Must be at module level to work with the module-level Tauri listener
let lastDropEvent: { paths: string[]; timestamp: number } | null = null;
let isProcessingDrop = false;

export interface FilesViewProps {
  convexUrl?: string;
  accessToken?: string;
  adminClient?: any;
  useMockData?: boolean;
  onError?: (error: string) => void;
}

export const FilesView: React.FC<FilesViewProps> = ({
  convexUrl: convexUrlProp,
  accessToken: accessTokenProp,
  adminClient: adminClientProp,
  useMockData = false,
  onError,
}) => {
  // Get deployment info from context if not provided as props
  const {
    deploymentUrl,
    adminClient: contextAdminClient,
    authToken,
  } = useDeployment();

  // Use props if provided, otherwise fall back to context
  const convexUrl = convexUrlProp || deploymentUrl || undefined;
  const accessToken = accessTokenProp || authToken || "";
  const adminClient = adminClientProp || contextAdminClient;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ type: "any" });
  const [fileToDelete, setFileToDelete] = useState<FileMetadata | null>(null);
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSingleDeleteDialogOpen, setIsSingleDeleteDialogOpen] =
    useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isTauriRef = useRef(false);

  const { components, selectedComponentId, setSelectedComponent } =
    useComponents({
      adminClient,
      useMockData,
    });

  const {
    files,
    isLoading,
    error: filesError,
    refetch,
    addOptimisticFile,
    removeOptimisticFile,
  } = useFiles({
    adminClient,
    useMockData,
    componentId: selectedComponentId,
    onError,
  });

  // Handle files error
  React.useEffect(() => {
    if (filesError) {
      onError?.(filesError);
    }
  }, [filesError, onError]);

  // Helper function to infer content type from filename
  const getContentTypeFromFilename = useCallback((filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      pdf: "application/pdf",
      txt: "text/plain",
      json: "application/json",
      xml: "application/xml",
      html: "text/html",
      css: "text/css",
      js: "text/javascript",
      ts: "text/typescript",
      zip: "application/zip",
      mp3: "audio/mpeg",
      mp4: "video/mp4",
      webm: "video/webm",
    };
    return mimeTypes[ext || ""] || "application/octet-stream";
  }, []);

  // Refs for values used in Tauri event handler (to avoid stale closures)
  const adminClientRef = useRef(adminClient);
  const convexUrlRef = useRef(convexUrl);
  const accessTokenRef = useRef(accessToken);
  const selectedComponentIdRef = useRef(selectedComponentId);
  const addOptimisticFileRef = useRef(addOptimisticFile);
  const removeOptimisticFileRef = useRef(removeOptimisticFile);
  const refetchRef = useRef(refetch);
  const onErrorRef = useRef(onError);

  // Update refs when values change
  React.useEffect(() => {
    adminClientRef.current = adminClient;
    convexUrlRef.current = convexUrl;
    accessTokenRef.current = accessToken;
    selectedComponentIdRef.current = selectedComponentId;
    addOptimisticFileRef.current = addOptimisticFile;
    removeOptimisticFileRef.current = removeOptimisticFile;
    refetchRef.current = refetch;
    onErrorRef.current = onError;
  }, [
    adminClient,
    convexUrl,
    accessToken,
    selectedComponentId,
    addOptimisticFile,
    removeOptimisticFile,
    refetch,
    onError,
  ]);

  // Tauri v2 drag and drop support
  React.useEffect(() => {
    // Use module-level singleton to prevent multiple registrations across React remounts
    // This survives React StrictMode's mount/unmount/remount cycle
    if (tauriDragDropInitialized) {
      console.log(
        "[FilesView] Tauri listener already registered at module level, skipping",
      );
      isTauriRef.current = true; // Still mark this component as Tauri-aware
      return;
    }

    console.log(
      "[FilesView] Initializing module-level Tauri drag drop listener",
    );
    tauriDragDropInitialized = true;
    isTauriRef.current = true;

    const setupTauriDragDrop = async () => {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        const { readFile } = await import("@tauri-apps/plugin-fs");
        console.log("[FilesView] Setting up Tauri v2 drag drop listener");

        const currentWindow = getCurrentWindow();

        tauriUnlistenFn = await currentWindow.onDragDropEvent(async (event) => {
          console.log(
            "[FilesView] Drag drop event:",
            event.payload.type,
            event.payload,
          );

          if (event.payload.type === "enter" || event.payload.type === "over") {
            console.log("[FilesView] Drag enter/over - showing overlay");
            setIsDragging(true);
          } else if (event.payload.type === "drop") {
            console.log("[FilesView] Files dropped:", event.payload.paths);
            console.log(
              "[FilesView] Current processing state:",
              isProcessingDrop,
            );

            // Deduplicate drop events SYNCHRONOUSLY before any async work
            // This prevents race conditions from multiple rapid Tauri drop events
            const now = Date.now();
            const pathsKey = JSON.stringify(event.payload.paths.sort());

            // CRITICAL: Check and set the processing flag synchronously in one step
            if (isProcessingDrop) {
              console.log(
                "[FilesView] Ignoring drop event - already processing",
              );
              return;
            }

            // Check for duplicate drop event within time window
            if (
              lastDropEvent &&
              JSON.stringify(lastDropEvent.paths) === pathsKey &&
              now - lastDropEvent.timestamp < 2000
            ) {
              console.log("[FilesView] Ignoring duplicate drop event");
              return;
            }

            // Mark as processing IMMEDIATELY and SYNCHRONOUSLY before any async work
            isProcessingDrop = true;
            lastDropEvent = {
              paths: event.payload.paths.sort(),
              timestamp: now,
            };
            console.log(
              "[FilesView] Set processing flag to true, starting upload",
            );

            setIsDragging(false);
            dragCounterRef.current = 0;

            // Validate prerequisites
            if (
              !adminClientRef.current &&
              (!convexUrlRef.current || !accessTokenRef.current)
            ) {
              onErrorRef.current?.(
                "Admin client or deployment URL and access token required",
              );
              isProcessingDrop = false;
              return;
            }

            // Convert file paths to File objects and upload them
            // Wrap everything to ensure processing flag is always reset
            try {
              await Promise.all(
                event.payload.paths.map(async (filePath) => {
                  try {
                    console.log("[FilesView] Reading file:", filePath);
                    // Read file as Uint8Array
                    const fileData = await readFile(filePath);

                    // Extract filename from path (handle both Unix and Windows paths)
                    const fileName = filePath.split(/[/\\]/).pop() || "file";

                    // Create a File object
                    const file = new File([fileData], fileName, {
                      type: getContentTypeFromFilename(fileName),
                    });

                    console.log(
                      "[FilesView] File created:",
                      fileName,
                      file.size,
                      "bytes",
                    );

                    // Create optimistic file entry and start upload
                    const optimisticId = `optimistic-${Date.now()}-${Math.random()}`;
                    console.log(
                      "[FilesView] Creating optimistic entry for:",
                      file.name,
                    );

                    const optimisticFile: FileMetadata = {
                      _id: optimisticId,
                      _creationTime: Date.now(),
                      storageId: "",
                      name: file.name,
                      size: file.size,
                      contentType: file.type,
                      uploadState: {
                        progress: 0,
                        status: "uploading",
                        file,
                      },
                    };

                    addOptimisticFileRef.current(optimisticFile);

                    // Start upload
                    try {
                      const result = await uploadFileWithFallbacks(
                        file,
                        adminClientRef.current,
                        selectedComponentIdRef.current || null,
                        convexUrlRef.current,
                        accessTokenRef.current,
                        (progress: number) => {
                          const updatedFile: FileMetadata = {
                            ...optimisticFile,
                            uploadState: {
                              ...optimisticFile.uploadState!,
                              progress,
                            },
                          };
                          removeOptimisticFileRef.current(optimisticId);
                          addOptimisticFileRef.current(updatedFile);
                        },
                      );

                      if (result.storageId) {
                        const successFile: FileMetadata = {
                          ...optimisticFile,
                          storageId: result.storageId,
                          uploadState: {
                            ...optimisticFile.uploadState!,
                            status: "success",
                            progress: 100,
                          },
                        };
                        removeOptimisticFileRef.current(optimisticId);
                        addOptimisticFileRef.current(successFile);
                        refetchRef.current();
                        setTimeout(() => {
                          removeOptimisticFileRef.current(optimisticId);
                        }, 2000);
                      } else {
                        throw new Error(result.error || "Upload failed");
                      }
                    } catch (err: any) {
                      const errorFile: FileMetadata = {
                        ...optimisticFile,
                        uploadState: {
                          ...optimisticFile.uploadState!,
                          status: "error",
                          error: err?.message || "Upload failed",
                        },
                      };
                      removeOptimisticFileRef.current(optimisticId);
                      addOptimisticFileRef.current(errorFile);
                      onErrorRef.current?.(err?.message || "Upload failed");
                    }
                  } catch (err) {
                    console.error(
                      "[FilesView] Error reading file:",
                      filePath,
                      err,
                    );
                    onErrorRef.current?.(`Failed to read file: ${filePath}`);
                  }
                }),
              );
            } catch (err) {
              console.error("[FilesView] Error in drop processing:", err);
            } finally {
              // Reset processing flag after all files are processed
              isProcessingDrop = false;
              console.log("[FilesView] Finished processing drop, reset flag");
            }
          } else if (event.payload.type === "leave") {
            console.log("[FilesView] Drag leave - hiding overlay");
            setIsDragging(false);
            dragCounterRef.current = 0;
          }
        });

        console.log("[FilesView] Tauri v2 drag drop listener ready");
      } catch (err) {
        console.error("[FilesView] Failed to setup Tauri drag drop:", err);
        // If Tauri setup fails, reset the flags so web handlers can work
        isTauriRef.current = false;
        tauriDragDropInitialized = false;
      }
    };

    setupTauriDragDrop();

    // Cleanup function - only runs when component unmounts for good (not on StrictMode remount)
    return () => {
      // Note: We intentionally DON'T clean up the module-level listener here
      // because React StrictMode will call this cleanup even though we want to keep it
      // The listener will be cleaned up when the app/window closes
      console.log(
        "[FilesView] Component unmounting, but keeping module-level Tauri listener",
      );
      isTauriRef.current = false;
    };
    // Empty dependencies - we only want this to run ONCE on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredFiles = files.filter((file) => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        file._id.toLowerCase().includes(query) ||
        file.name?.toLowerCase().includes(query) ||
        (file.storageId && file.storageId.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Filter by date
    if (dateFilter.type !== "any") {
      const fileDate = new Date(file._creationTime);
      fileDate.setHours(0, 0, 0, 0);

      let startDate: Date | undefined;
      let endDate: Date | undefined;

      if (dateFilter.type === "custom") {
        startDate = dateFilter.startDate;
        endDate = dateFilter.endDate;
      } else {
        // Get date range for preset
        const now = new Date();
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (dateFilter.type) {
          case "last24h":
            startDate = new Date(end.getTime() - 24 * 60 * 60 * 1000);
            endDate = end;
            break;
          case "last7d":
            startDate = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
            endDate = end;
            break;
          case "last30d":
            startDate = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
            endDate = end;
            break;
          case "last90d":
            startDate = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
            endDate = end;
            break;
        }
      }

      if (startDate && endDate) {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999); // Include the entire end date
        if (fileDate < startDate || fileDate > endDate) {
          return false;
        }
      }
    }

    return true;
  });

  const formatFileSize = (bytes?: number | null): string => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleFileCheckboxSelect = (fileId: string, checked: boolean) => {
    if (checked) {
      setSelectedFileIds((prev) => [...prev, fileId]);
    } else {
      setSelectedFileIds((prev) => prev.filter((id) => id !== fileId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFileIds(filteredFiles.map((f) => f._id));
    } else {
      setSelectedFileIds([]);
    }
  };

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      console.log(
        "[FilesView] handleFileSelect called with",
        files?.length,
        "files",
      );
      if (!files || files.length === 0) return;
      if (!adminClient && (!convexUrl || !accessToken)) {
        onError?.("Admin client or deployment URL and access token required");
        return;
      }

      const fileArray = Array.from(files);
      console.log(
        "[FilesView] Processing files:",
        fileArray.map((f) => f.name),
      );

      // Upload each file
      for (const file of fileArray) {
        const optimisticId = `optimistic-${Date.now()}-${Math.random()}`;
        console.log("[FilesView] Creating optimistic entry for:", file.name);

        // Create optimistic file entry
        const optimisticFile: FileMetadata = {
          _id: optimisticId,
          _creationTime: Date.now(),
          storageId: "",
          name: file.name,
          size: file.size,
          contentType: file.type,
          uploadState: {
            progress: 0,
            status: "uploading",
            file,
          },
        };

        addOptimisticFile(optimisticFile);

        try {
          const result = await uploadFileWithFallbacks(
            file,
            adminClient,
            selectedComponentId || null,
            convexUrl,
            accessToken,
            (progress: number) => {
              // Update progress
              const updatedFile: FileMetadata = {
                ...optimisticFile,
                uploadState: {
                  ...optimisticFile.uploadState!,
                  progress,
                },
              };
              removeOptimisticFile(optimisticId);
              addOptimisticFile(updatedFile);
            },
          );

          if (result.storageId) {
            // Update to success state with storageId
            const successFile: FileMetadata = {
              ...optimisticFile,
              storageId: result.storageId,
              uploadState: {
                ...optimisticFile.uploadState!,
                status: "success",
                progress: 100,
              },
            };
            removeOptimisticFile(optimisticId);
            addOptimisticFile(successFile);

            // Refresh the file list after successful upload
            refetch();

            // Remove optimistic file after a short delay (the deduplication logic will hide it once real file appears)
            setTimeout(() => {
              removeOptimisticFile(optimisticId);
            }, 2000);
          } else {
            throw new Error(result.error || "Upload failed");
          }
        } catch (err: any) {
          // Update to error state
          const errorFile: FileMetadata = {
            ...optimisticFile,
            uploadState: {
              ...optimisticFile.uploadState!,
              status: "error",
              error: err?.message || "Upload failed",
            },
          };
          removeOptimisticFile(optimisticId);
          addOptimisticFile(errorFile);
          onError?.(err?.message || "Upload failed");
        }
      }
    },
    [
      adminClient,
      convexUrl,
      accessToken,
      selectedComponentId,
      addOptimisticFile,
      removeOptimisticFile,
      refetch,
      onError,
    ],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(e.target.files);
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFileSelect],
  );

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const dragCounterRef = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    // Skip web drag handlers if Tauri is handling it
    if (isTauriRef.current) return;

    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    console.log(
      "[FilesView] DragEnter - counter:",
      dragCounterRef.current,
      "types:",
      Array.from(e.dataTransfer.types),
    );
    // In Tauri, dataTransfer.types might not always include "Files"
    // So we show the overlay regardless if we have items
    if (e.dataTransfer.items.length > 0 || e.dataTransfer.types.length > 0) {
      console.log("[FilesView] DragEnter - Setting isDragging to true");
      setIsDragging(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    // Skip web drag handlers if Tauri is handling it
    if (isTauriRef.current) return;

    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    console.log(
      "[FilesView] DragOver - types:",
      Array.from(e.dataTransfer.types),
    );
    // Keep overlay visible during drag
    if (e.dataTransfer.items.length > 0 || e.dataTransfer.types.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Skip web drag handlers if Tauri is handling it
    if (isTauriRef.current) return;

    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    console.log("[FilesView] DragLeave - counter:", dragCounterRef.current);
    // Only hide dragging if we've left the container completely
    if (dragCounterRef.current === 0) {
      console.log("[FilesView] DragLeave - Setting isDragging to false");
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      // Skip web drag handlers if Tauri is handling it
      if (isTauriRef.current) {
        console.log(
          "[FilesView] Skipping web drop handler - Tauri is handling it",
        );
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      console.log("[FilesView] Drop - files:", e.dataTransfer.files.length);
      console.log(
        "[FilesView] Drop - file details:",
        Array.from(e.dataTransfer.files).map((f) => ({
          name: f.name,
          size: f.size,
          type: f.type,
          path: (f as any).path, // Tauri adds path property
        })),
      );
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect],
  );

  const handleFileClick = (file: FileMetadata) => {
    setSelectedFile(file);
  };

  const handleFileDownload = async (
    e: React.MouseEvent,
    file: FileMetadata,
  ) => {
    e.stopPropagation();

    if (!convexUrl || !accessToken) {
      onError?.("Missing deployment URL or access token");
      return;
    }

    try {
      // Construct file URL
      const fileUrl =
        file.url ||
        `${convexUrl}${ROUTES.STORAGE}/${file.storageId || file._id}`;

      // If file has a direct URL (signed URL), use it directly
      if (file.url && file.url.startsWith("http")) {
        const link = document.createElement("a");
        link.href = file.url;
        link.download = file.name || `file-${file.storageId || file._id}`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Otherwise, fetch with auth header and create blob
      const response = await fetch(fileUrl, {
        headers: {
          Authorization: `Convex ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = file.name || `file-${file.storageId || file._id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (err: any) {
      onError?.(err?.message || "Failed to download file");
    }
  };

  const handleFileDelete = async (e: React.MouseEvent, file: FileMetadata) => {
    e.stopPropagation();
    setFileToDelete(file);
    setIsSingleDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!fileToDelete || !adminClient) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteFile(
        adminClient,
        fileToDelete.storageId || fileToDelete._id,
        selectedComponentId || undefined,
      );

      if (result.success) {
        // Remove from selected files if it was selected
        setSelectedFileIds((prev) =>
          prev.filter((id) => id !== fileToDelete._id),
        );
        // Small delay to ensure backend processes deletion
        await new Promise((resolve) => setTimeout(resolve, 300));
        // Refresh the file list
        refetch();
        setFileToDelete(null);
        setIsSingleDeleteDialogOpen(false);
      } else {
        onError?.(result.error || "Failed to delete file");
      }
    } catch (err: any) {
      onError?.(err?.message || "Failed to delete file");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = () => {
    if (selectedFileIds.length === 0) return;
    setFilesToDelete([...selectedFileIds]);
    setIsBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    if (filesToDelete.length === 0 || !adminClient) {
      return;
    }

    setIsDeleting(true);
    try {
      // Get storageIds for the selected files
      const storageIds = filesToDelete.map((id) => {
        const file = files.find((f) => f._id === id);
        return file?.storageId || file?._id || id;
      });

      const result = await deleteFile(
        adminClient,
        storageIds,
        selectedComponentId || undefined,
      );

      if (result.success) {
        // Clear selection
        setSelectedFileIds([]);
        // Small delay to ensure backend processes deletions
        await new Promise((resolve) => setTimeout(resolve, 300));
        // Refresh the file list
        refetch();
        setFilesToDelete([]);
        setIsBulkDeleteDialogOpen(false);
      } else if (result.deletedCount && result.deletedCount > 0) {
        // Partial success - show info and refresh
        onError?.(
          `Partial deletion: ${result.deletedCount} file(s) deleted, ${result.failedCount} failed. ${result.error || ""}`,
        );
        // Clear selection and refresh to show remaining files
        setSelectedFileIds([]);
        // Small delay to ensure backend processes deletions
        await new Promise((resolve) => setTimeout(resolve, 300));
        refetch();
        setFilesToDelete([]);
        setIsBulkDeleteDialogOpen(false);
      } else {
        onError?.(result.error || "Failed to delete files");
      }
    } catch (err: any) {
      onError?.(err?.message || "Failed to delete files");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <div
        ref={containerRef}
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          backgroundColor: "var(--color-panel-bg)",
          position: "relative",
          flex: 1,
          minWidth: 0,
        }}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleInputChange}
          style={{ display: "none" }}
        />

        {/* Drag overlay */}
        {isDragging && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              border: "3px dashed var(--color-panel-accent)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                backgroundColor: "var(--color-panel-bg)",
                padding: "32px 48px",
                borderRadius: "12px",
                border: "2px solid var(--color-panel-accent)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
              }}
            >
              <Upload
                size={48}
                style={{ color: "var(--color-panel-accent)" }}
              />
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "var(--color-panel-text)",
                }}
              >
                Drop files here to upload
              </div>
            </div>
          </div>
        )}
        {/* Toolbar */}
        <Toolbar
          left={
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {components && components.length > 1 && (
              <ComponentSelector
                selectedComponentId={selectedComponentId || null}
                onSelect={(componentId) => setSelectedComponent(componentId)}
                components={components}
              />
            )}
            <div style={{ minWidth: "200px", width: "300px" }}>
              <div className="cp-search-wrapper">
                <Search size={14} className="cp-search-icon" />
                <input
                  type="text"
                  placeholder="Lookup by ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="cp-search-input"
                />
              </div>
            </div>
            <DateFilterDropdown
              value={dateFilter}
              onChange={setDateFilter}
              triggerButton={
                <div
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "var(--color-panel-bg-secondary)",
                    border: "1px solid var(--color-panel-border)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "12px",
                    color: "var(--color-panel-text-muted)",
                    cursor: "pointer",
                    transition: "background-color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-panel-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-panel-bg-secondary)";
                  }}
                >
                  <Calendar size={14} />
                  <span>
                    Uploaded at:{" "}
                    {dateFilter.type === "any"
                      ? "Any time"
                      : dateFilter.type === "last24h"
                        ? "Last 24 hours"
                        : dateFilter.type === "last7d"
                          ? "Last 7 days"
                          : dateFilter.type === "last30d"
                            ? "Last 30 days"
                            : dateFilter.type === "last90d"
                              ? "Last 90 days"
                              : "Custom range"}
                  </span>
                </div>
              }
            />
            </div>
          }
          right={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 400,
                color: "var(--color-panel-text-muted)",
              }}
            >
              Total Files {files.length}
            </span>
            {selectedFileIds.length > 0 && (
              <ToolbarButton onClick={handleBulkDelete} variant="destructive">
                <Trash2 size={12} />
                Delete {selectedFileIds.length}{" "}
                {selectedFileIds.length === 1 ? "file" : "files"}
              </ToolbarButton>
            )}
            <ToolbarButton onClick={handleUploadClick} variant="primary">
              <Upload size={14} /> Upload Files
            </ToolbarButton>
            </div>
          }
        />

        {/* Table */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px",
              borderBottom: "1px solid var(--cp-data-row-border)",
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--color-panel-text-muted)",
              backgroundColor: "var(--color-panel-bg)",
              position: "sticky",
              top: 0,
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Checkbox
                checked={
                  filteredFiles.length > 0 &&
                  selectedFileIds.length === filteredFiles.length
                }
                indeterminate={
                  filteredFiles.length > 0 &&
                  selectedFileIds.length > 0 &&
                  selectedFileIds.length < filteredFiles.length
                }
                onChange={(e) => handleSelectAll(e.target.checked)}
                size={16}
              />
            </div>
            <div style={{ width: "25%" }}>ID</div>
            <div style={{ width: "96px" }}>Size</div>
            <div style={{ width: "25%" }}>Content type</div>
            <div style={{ flex: 1 }}>Uploaded at</div>
          </div>

          {/* Table Content */}
          <div
            style={{
              flex: 1,
              overflow: "auto",
              backgroundColor: "var(--color-panel-bg)",
            }}
          >
            <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          `}</style>
            {isLoading ? (
              <div
                style={{
                  color: "var(--color-panel-text-muted)",
                  fontSize: "14px",
                  padding: "32px",
                  textAlign: "center",
                }}
              >
                Loading files...
              </div>
            ) : filteredFiles.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: "32px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor:
                      "color-mix(in srgb, var(--color-panel-error) 10%, transparent)",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                  }}
                >
                  <FileCode
                    size={24}
                    style={{ color: "var(--color-panel-error)" }}
                  />
                </div>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 500,
                    color: "var(--color-panel-text)",
                    marginBottom: "8px",
                  }}
                >
                  No files yet.
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--color-panel-text-muted)",
                    marginBottom: "24px",
                  }}
                >
                  With Convex File Storage, you can store and serve files.
                </p>
                <a
                  href="https://docs.convex.dev/file-storage"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "14px",
                    color: "var(--color-panel-info)",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = "underline";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = "none";
                  }}
                >
                  <ExternalLink size={12} /> Learn more about file storage.
                </a>
              </div>
            ) : (
              <>
                {/* File rows (includes both regular and optimistic uploading files) */}
                {filteredFiles.map((file) => {
                  const isSelected = selectedFileIds.includes(file._id);
                  const uploadState = file.uploadState;
                  const isUploading = uploadState?.status === "uploading";
                  const isError = uploadState?.status === "error";
                  const isSuccess = uploadState?.status === "success";
                  const baseRowBackground =
                    isUploading || isSuccess
                      ? "var(--color-panel-bg-secondary)"
                      : "";

                  return (
                    <div
                      key={file._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "8px",
                        borderBottom: "1px solid var(--cp-data-row-border)",
                        fontSize: "12px",
                        fontFamily: "monospace",
                        color: "var(--color-panel-text-secondary)",
                        backgroundColor: isError
                          ? "color-mix(in srgb, var(--color-panel-error) 10%, transparent)"
                          : isSelected
                            ? "var(--cp-data-row-selected-bg)"
                            : baseRowBackground,
                        opacity: isSuccess ? 0.6 : 1,
                        cursor: isUploading ? "default" : "pointer",
                        transition: "background-color 0.35s ease",
                      }}
                      onClick={() => !isUploading && handleFileClick(file)}
                      onMouseEnter={(e) => {
                        if (!isUploading && !isSelected) {
                          e.currentTarget.style.backgroundColor =
                            "var(--color-panel-hover)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isUploading) {
                          e.currentTarget.style.backgroundColor = isSelected
                            ? "var(--cp-data-row-selected-bg)"
                            : baseRowBackground;
                        }
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {isUploading ? (
                          <div
                            style={{
                              width: "16px",
                              height: "16px",
                              backgroundColor: "var(--color-panel-border)",
                              borderRadius: "6px",
                              animation:
                                "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                            }}
                          />
                        ) : (
                          <div onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              disabled={!!uploadState}
                              onChange={(e) =>
                                handleFileCheckboxSelect(
                                  file._id,
                                  e.target.checked,
                                )
                              }
                              size={16}
                            />
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          width: "25%",
                          color: isError
                            ? "var(--color-panel-error)"
                            : "var(--color-panel-text)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontFamily: "monospace",
                          fontSize: "11px",
                        }}
                      >
                        {isUploading ? (
                          <div
                            style={{
                              width: "140px",
                              height: "11px",
                              backgroundColor: "var(--color-panel-border)",
                              borderRadius: "2px",
                              animation:
                                "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                            }}
                          />
                        ) : (
                          file.name || file.storageId || file._id
                        )}
                      </div>
                      <div
                        style={{
                          width: "96px",
                          color: "var(--color-panel-text-secondary)",
                        }}
                      >
                        {isUploading ? (
                          <div
                            style={{
                              width: "50px",
                              height: "12px",
                              backgroundColor: "var(--color-panel-border)",
                              borderRadius: "2px",
                              animation:
                                "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                            }}
                          />
                        ) : (
                          formatFileSize(file.size)
                        )}
                      </div>
                      <div
                        style={{
                          width: "25%",
                          color: "var(--color-panel-text-secondary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isUploading ? (
                          <div
                            style={{
                              width: "90px",
                              height: "12px",
                              backgroundColor: "var(--color-panel-border)",
                              borderRadius: "2px",
                              animation:
                                "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                            }}
                          />
                        ) : (
                          file.contentType || "-"
                        )}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          color: "var(--color-panel-text-secondary)",
                        }}
                      >
                        {isUploading ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                flex: 1,
                                maxWidth: "200px",
                                height: "4px",
                                backgroundColor: "var(--color-panel-border)",
                                borderRadius: "2px",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${uploadState?.progress || 0}%`,
                                  height: "100%",
                                  backgroundColor: "var(--color-panel-accent)",
                                  transition: "width 0.2s",
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: "12px",
                                color: "var(--color-panel-text-muted)",
                                minWidth: "35px",
                              }}
                            >
                              {Math.round(uploadState?.progress || 0)}%
                            </span>
                          </div>
                        ) : isError ? (
                          <span
                            style={{
                              fontSize: "12px",
                              color: "var(--color-panel-error)",
                            }}
                          >
                            {uploadState?.error || "Upload failed"}
                          </span>
                        ) : (
                          formatTimestamp(file._creationTime)
                        )}
                      </div>
                      <div
                        style={{
                          width: "64px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        {isUploading ? (
                          <>
                            <div style={{ width: "12px", height: "12px" }} />
                            <div style={{ width: "12px", height: "12px" }} />
                          </>
                        ) : isError ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeOptimisticFile(file._id);
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--color-panel-text-muted)",
                              cursor: "pointer",
                              padding: "4px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "4px",
                              transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color =
                                "var(--color-panel-text)";
                              e.currentTarget.style.backgroundColor =
                                "var(--color-panel-hover)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color =
                                "var(--color-panel-text-muted)";
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                            }}
                          >
                            <X size={12} />
                          </button>
                        ) : (
                          <>
                            {(file.url || file.storageId) && convexUrl && (
                              <div
                                onClick={(e) => handleFileDownload(e, file)}
                                style={{
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "var(--color-panel-text-muted)",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color =
                                    "var(--color-panel-info)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color =
                                    "var(--color-panel-text-muted)";
                                }}
                              >
                                <ExternalLink size={12} />
                              </div>
                            )}
                            <div
                              onClick={(e) => handleFileDelete(e, file)}
                              style={{
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "var(--color-panel-text-muted)",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color =
                                  "var(--color-panel-error)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color =
                                  "var(--color-panel-text-muted)";
                              }}
                            >
                              <Trash2 size={12} />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Single File Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={isSingleDeleteDialogOpen}
          onClose={() => {
            setIsSingleDeleteDialogOpen(false);
            setFileToDelete(null);
          }}
          onConfirm={confirmDelete}
          title="Delete File"
          message={
            <>
              <p style={{ marginBottom: "8px" }}>
                Are you sure you want to delete this file?
              </p>
              {fileToDelete && (
                <div
                  style={{
                    fontSize: "12px",
                    fontFamily: "monospace",
                    color: "var(--color-panel-text-muted)",
                    backgroundColor: "var(--color-panel-bg-secondary)",
                    padding: "8px",
                    borderRadius: "4px",
                    wordBreak: "break-all",
                  }}
                >
                  {fileToDelete.name ||
                    fileToDelete.storageId ||
                    fileToDelete._id}
                </div>
              )}
            </>
          }
          confirmLabel={isDeleting ? "Deleting..." : "Delete"}
          cancelLabel="Cancel"
          variant="danger"
          container={containerRef.current}
          disableCancel={isDeleting}
        />

        {/* Bulk Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={isBulkDeleteDialogOpen}
          onClose={() => {
            setIsBulkDeleteDialogOpen(false);
            setFilesToDelete([]);
          }}
          onConfirm={confirmBulkDelete}
          title={`Delete ${filesToDelete.length.toLocaleString()} selected file${filesToDelete.length > 1 ? "s" : ""}`}
          message="Are you sure you want to permanently delete these files? Deleted files cannot be recovered."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="danger"
          container={containerRef.current}
        />
      </div>

      {/* Sheet panel (slides in from right) */}
      {selectedFile && (
        <ResizableSheet
          id="files-preview"
          side="right"
          defaultWidth={600}
          minWidth={400}
          maxWidth={900}
          title={
            selectedFile.name ||
            `File ${selectedFile.storageId || selectedFile._id}`
          }
          onClose={() => setSelectedFile(null)}
          headerActions={
            <>
              {/* Download button */}
              {(selectedFile.url || selectedFile.storageId) && (
                <button
                  type="button"
                  onClick={(e) => handleFileDownload(e, selectedFile)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "24px",
                    height: "24px",
                    padding: 0,
                    backgroundColor: "transparent",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    color: "var(--color-panel-text-muted)",
                    flexShrink: 0,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--color-panel-text)";
                    e.currentTarget.style.backgroundColor =
                      "var(--color-panel-bg-tertiary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color =
                      "var(--color-panel-text-muted)";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <Upload size={14} style={{ transform: "rotate(180deg)" }} />
                </button>
              )}
            </>
          }
        >
          <FilePreview
            file={selectedFile}
            deploymentUrl={convexUrl}
            accessToken={accessToken}
          />
        </ResizableSheet>
      )}
    </div>
  );
};
