import React, { useState, useRef, useCallback } from "react";
import { Upload, X, Check, Loader2, AlertCircle, Info } from "lucide-react";
import {
  uploadFileWithFallbacks,
  diagnoseFileStorageAvailability,
} from "../api/files";

export interface FileUploadProps {
  adminClient?: any;
  deploymentUrl?: string;
  accessToken?: string;
  componentId?: string | null;
  onUploadComplete?: () => void;
  onError?: (error: string) => void;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  adminClient,
  deploymentUrl,
  accessToken,
  componentId,
  onUploadComplete,
  onError,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      if (!adminClient && (!deploymentUrl || !accessToken)) {
        onError?.("Admin client or deployment URL and access token required");
        return;
      }

      const fileArray = Array.from(files);
      const newUploadingFiles: UploadingFile[] = fileArray.map(
        (file, index) => ({
          id: `${Date.now()}-${index}`,
          file,
          progress: 0,
          status: "uploading" as const,
        }),
      );

      setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

      // Upload each file
      for (const uploadingFile of newUploadingFiles) {
        try {
          const result = await uploadFileWithFallbacks(
            uploadingFile.file,
            adminClient,
            componentId,
            deploymentUrl,
            accessToken,
            (progress: number) => {
              setUploadingFiles((prev) =>
                prev.map((f) =>
                  f.id === uploadingFile.id ? { ...f, progress } : f,
                ),
              );
            },
          );

          if (result.storageId) {
            // Mark as success
            setUploadingFiles((prev) =>
              prev.map((f) =>
                f.id === uploadingFile.id
                  ? { ...f, status: "success" as const, progress: 100 }
                  : f,
              ),
            );

            // Call completion callback
            onUploadComplete?.();
          } else {
            throw new Error(result.error || "Upload failed");
          }
        } catch (err: any) {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === uploadingFile.id
                ? {
                    ...f,
                    status: "error" as const,
                    error: err?.message || "Upload failed",
                  }
                : f,
            ),
          );
          onError?.(err?.message || "Upload failed");
        }
      }
    },
    [
      adminClient,
      componentId,
      deploymentUrl,
      accessToken,
      onUploadComplete,
      onError,
    ],
  );

  const runDiagnostics = useCallback(async () => {
    const result = await diagnoseFileStorageAvailability(
      adminClient,
      deploymentUrl,
      accessToken,
    );
    setDiagnostics(result.details);
    setShowDiagnostics(true);
  }, [adminClient, deploymentUrl, accessToken]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect],
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

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const removeUploadingFile = useCallback((id: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const hasActiveUploads = uploadingFiles.some((f) => f.status === "uploading");

  return (
    <div>
      {/* Diagnostics Button */}
      <div
        style={{
          marginBottom: "12px",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={runDiagnostics}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            backgroundColor: "var(--color-panel-bg-secondary)",
            border: "1px solid var(--color-panel-border)",
            borderRadius: "6px",
            fontSize: "12px",
            color: "var(--color-panel-text)",
            cursor: "pointer",
            transition: "background-color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-panel-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor =
              "var(--color-panel-bg-secondary)";
          }}
        >
          <Info size={14} />
          <span>Run Diagnostics</span>
        </button>
      </div>

      {/* Diagnostics Display */}
      {showDiagnostics && diagnostics.length > 0 && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px",
            backgroundColor: "var(--color-panel-bg-secondary)",
            border: "1px solid var(--color-panel-border)",
            borderRadius: "6px",
            fontSize: "11px",
            fontFamily: "monospace",
            color: "var(--color-panel-text)",
            whiteSpace: "pre-wrap",
            maxHeight: "200px",
            overflow: "auto",
          }}
        >
          {diagnostics.join("\n")}
        </div>
      )}

      {/* Drag and Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        style={{
          border: `2px dashed ${isDragging ? "var(--color-panel-accent)" : "var(--color-panel-border)"}`,
          borderRadius: "8px",
          padding: "32px",
          textAlign: "center",
          backgroundColor: isDragging
            ? "var(--color-panel-hover)"
            : "var(--color-panel-bg)",
          cursor: "pointer",
          transition: "all 0.2s",
          marginBottom: uploadingFiles.length > 0 ? "16px" : "0",
        }}
        onMouseEnter={(e) => {
          if (!isDragging) {
            e.currentTarget.style.borderColor = "var(--color-panel-accent)";
            e.currentTarget.style.backgroundColor = "var(--color-panel-hover)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            e.currentTarget.style.borderColor = "var(--color-panel-border)";
            e.currentTarget.style.backgroundColor = "var(--color-panel-bg)";
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleInputChange}
          style={{ display: "none" }}
          disabled={hasActiveUploads}
        />
        <Upload
          size={32}
          style={{
            color: "var(--color-panel-text-muted)",
            marginBottom: "12px",
          }}
        />
        <div
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--color-panel-text)",
            marginBottom: "4px",
          }}
        >
          {isDragging
            ? "Drop files here"
            : "Drag files here or click to select"}
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "var(--color-panel-text-muted)",
          }}
        >
          Select one or more files to upload
        </div>
      </div>

      {/* Upload Progress List */}
      {uploadingFiles.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {uploadingFiles.map((uploadingFile) => (
            <div
              key={uploadingFile.id}
              style={{
                padding: "12px",
                backgroundColor: "var(--color-panel-bg)",
                border: "1px solid var(--color-panel-border)",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              {/* Status Icon */}
              <div>
                {uploadingFile.status === "uploading" && (
                  <Loader2
                    size={16}
                    style={{
                      animation: "spin 1s linear infinite",
                      color: "var(--color-panel-accent)",
                    }}
                  />
                )}
                {uploadingFile.status === "success" && (
                  <Check
                    size={16}
                    style={{ color: "var(--color-panel-success)" }}
                  />
                )}
                {uploadingFile.status === "error" && (
                  <AlertCircle
                    size={16}
                    style={{ color: "var(--color-panel-error)" }}
                  />
                )}
                <style>{`
                  @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                `}</style>
              </div>

              {/* File Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "var(--color-panel-text)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginBottom: "2px",
                  }}
                  title={uploadingFile.file.name}
                >
                  {uploadingFile.file.name}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--color-panel-text-muted)",
                  }}
                >
                  {formatFileSize(uploadingFile.file.size)}
                </div>
              </div>

              {/* Progress Bar */}
              {uploadingFile.status === "uploading" && (
                <div
                  style={{
                    width: "120px",
                    height: "4px",
                    backgroundColor: "var(--color-panel-border)",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${uploadingFile.progress}%`,
                      height: "100%",
                      backgroundColor: "var(--color-panel-accent)",
                      transition: "width 0.2s",
                    }}
                  />
                </div>
              )}

              {/* Progress Text */}
              {uploadingFile.status === "uploading" && (
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--color-panel-text-muted)",
                    minWidth: "40px",
                    textAlign: "right",
                  }}
                >
                  {Math.round(uploadingFile.progress)}%
                </div>
              )}

              {/* Error Message */}
              {uploadingFile.status === "error" && (
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--color-panel-error)",
                    flex: 1,
                    textAlign: "right",
                  }}
                  title={uploadingFile.error}
                >
                  {uploadingFile.error}
                </div>
              )}

              {/* Remove Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeUploadingFile(uploadingFile.id);
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
                  e.currentTarget.style.color = "var(--color-panel-text)";
                  e.currentTarget.style.backgroundColor =
                    "var(--color-panel-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--color-panel-text-muted)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
