import React, { useState, useRef, useCallback } from 'react';
import { Search, Upload, Calendar, FileCode, ExternalLink, Pause, Trash2, Loader2, Check, AlertCircle, X } from 'lucide-react';
import { ComponentSelector } from '../../components/function-runner/components/component-selector';
import { useComponents } from '../../hooks/useComponents';
import { useFiles } from '../../hooks/useFiles';
import { FileMetadata, deleteFile, uploadFileWithFallbacks } from '../../utils/api';
import { useSheetSafe } from '../../contexts/sheet-context';
import { FilePreview } from './components/file-preview';
import { searchInputStyles } from '../../styles/panelStyles';
import { DateFilterDropdown, DateFilter } from './components/date-filter-dropdown';
import { Checkbox } from '../../components/shared/checkbox';

export interface FilesViewProps {
  convexUrl?: string;
  accessToken: string;
  baseUrl?: string;
  adminClient?: any;
  useMockData?: boolean;
  onError?: (error: string) => void;
  teamSlug?: string;
  projectSlug?: string;
}

export const FilesView: React.FC<FilesViewProps> = ({
  convexUrl,
  accessToken,
  baseUrl,
  adminClient,
  useMockData = false,
  onError,
  teamSlug,
  projectSlug,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ type: 'any' });
  const [fileToDelete, setFileToDelete] = useState<FileMetadata | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Array<{
    id: string;
    file: File;
    progress: number;
    status: 'uploading' | 'success' | 'error';
    error?: string;
    storageId?: string;
  }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { openSheet } = useSheetSafe();

  const {
    componentNames,
    selectedComponentId,
    selectedComponent,
    setSelectedComponent,
  } = useComponents({
    adminClient,
    useMockData,
  });

  const {
    files,
    isLoading,
    error: filesError,
    refetch,
    hasMore,
    loadMore,
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

  const filteredFiles = files.filter(file => {
    // Filter by search query
    if (searchQuery) {
    const query = searchQuery.toLowerCase();
      const matchesSearch = (
      file._id.toLowerCase().includes(query) ||
      file.name?.toLowerCase().includes(query) ||
      (file.storageId && file.storageId.toLowerCase().includes(query))
    );
      if (!matchesSearch) return false;
    }

    // Filter by date
    if (dateFilter.type !== 'any') {
      const fileDate = new Date(file._creationTime);
      fileDate.setHours(0, 0, 0, 0);

      let startDate: Date | undefined;
      let endDate: Date | undefined;

      if (dateFilter.type === 'custom') {
        startDate = dateFilter.startDate;
        endDate = dateFilter.endDate;
      } else {
        // Get date range for preset
        const now = new Date();
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (dateFilter.type) {
          case 'last24h':
            startDate = new Date(end.getTime() - 24 * 60 * 60 * 1000);
            endDate = end;
            break;
          case 'last7d':
            startDate = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
            endDate = end;
            break;
          case 'last30d':
            startDate = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
            endDate = end;
            break;
          case 'last90d':
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

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleFileCheckboxSelect = (fileId: string, checked: boolean) => {
    if (checked) {
      setSelectedFileIds(prev => [...prev, fileId]);
    } else {
      setSelectedFileIds(prev => prev.filter(id => id !== fileId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFileIds(filteredFiles.map(f => f._id));
    } else {
      setSelectedFileIds([]);
    }
  };

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!adminClient && (!convexUrl || !accessToken)) {
      onError?.('Admin client or deployment URL and access token required');
      return;
    }

    const fileArray = Array.from(files);
    const newUploadingFiles = fileArray.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    // Upload each file
    for (const uploadingFile of newUploadingFiles) {
      try {
        const result = await uploadFileWithFallbacks(
          uploadingFile.file,
          adminClient,
          selectedComponentId || null,
          convexUrl,
          accessToken,
          (progress: number) => {
            setUploadingFiles(prev =>
              prev.map(f =>
                f.id === uploadingFile.id
                  ? { ...f, progress }
                  : f
              )
            );
          }
        );

        if (result.storageId) {
          setUploadingFiles(prev =>
            prev.map(f =>
              f.id === uploadingFile.id
                ? { ...f, status: 'success' as const, progress: 100, storageId: result.storageId || undefined }
                : f
            )
          );
          // Refresh the file list after successful upload
    refetch();
          // Remove from uploading files after a short delay to show success state
          setTimeout(() => {
            setUploadingFiles(prev => prev.filter(f => f.id !== uploadingFile.id));
          }, 1000);
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (err: any) {
        setUploadingFiles(prev =>
          prev.map(f =>
            f.id === uploadingFile.id
              ? { ...f, status: 'error' as const, error: err?.message || 'Upload failed' }
              : f
          )
        );
        onError?.(err?.message || 'Upload failed');
      }
    }
  }, [adminClient, convexUrl, accessToken, selectedComponentId, refetch, onError]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileSelect]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const dragCounterRef = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    // Only hide dragging if we've left the container completely
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const removeUploadingFile = useCallback((id: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleFileClick = (file: FileMetadata) => {
    openSheet({
      title: file.name || `File ${file.storageId || file._id}`,
      content: (
        <FilePreview
          file={file}
          deploymentUrl={convexUrl}
          accessToken={accessToken}
          componentId={selectedComponentId}
        />
      ),
      width: '600px',
    });
  };

  const handleFileDownload = async (e: React.MouseEvent, file: FileMetadata) => {
    e.stopPropagation();
    
    if (!convexUrl || !accessToken) {
      onError?.('Missing deployment URL or access token');
      return;
    }

    try {
      // Construct file URL
      const fileUrl = file.url || `${convexUrl}/api/storage/${file.storageId || file._id}`;
      
      // If file has a direct URL (signed URL), use it directly
      if (file.url && file.url.startsWith('http')) {
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.name || `file-${file.storageId || file._id}`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Otherwise, fetch with auth header and create blob
      const response = await fetch(fileUrl, {
        headers: {
          'Authorization': `Convex ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = file.name || `file-${file.storageId || file._id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (err: any) {
      onError?.(err?.message || 'Failed to download file');
    }
  };

  const handleFileDelete = async (e: React.MouseEvent, file: FileMetadata) => {
    e.stopPropagation();
    setFileToDelete(file);
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
        selectedComponentId || undefined
      );

      if (result.success) {
        // Remove from selected files if it was selected
        setSelectedFileIds(prev => prev.filter(id => id !== fileToDelete._id));
        // Refresh the file list
        refetch();
        setFileToDelete(null);
      } else {
        onError?.(result.error || 'Failed to delete file');
      }
    } catch (err: any) {
      onError?.(err?.message || 'Failed to delete file');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setFileToDelete(null);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--color-panel-bg)',
        position: 'relative',
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
        style={{ display: 'none' }}
      />

      {/* Drag overlay */}
      {isDragging && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            border: '2px dashed var(--color-panel-accent)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-panel-bg)',
              padding: '24px 32px',
              borderRadius: '8px',
              border: '1px solid var(--color-panel-border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Upload size={32} style={{ color: 'var(--color-panel-accent)' }} />
            <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-panel-text)' }}>
              Drop files here to upload
            </div>
          </div>
        </div>
      )}
      {/* Toolbar */}
      <div style={{
        padding: '8px',
        borderBottom: '1px solid var(--color-panel-border)',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        backgroundColor: 'var(--color-panel-bg)',
      }}>
        {componentNames && componentNames.length > 0 && (
          <div style={{ width: '192px' }}>
            <ComponentSelector
              selectedComponent={selectedComponent || null}
              onSelect={(component) => setSelectedComponent(component)}
              components={componentNames}
            />
          </div>
        )}
<<<<<<< HEAD
        <div style={{ flex: 1, maxWidth: '384px' }}>
          <div className="cp-search-wrapper">
            <Search size={14} className="cp-search-icon" />
=======
        <div style={{ ...searchInputStyles.container, flex: 1, maxWidth: '384px' }}>
          <Search
            size={14}
            style={searchInputStyles.icon}
          />
>>>>>>> b2a4a8f8de8904a46f4a76f8476d7f39a6f12196
          <input
            type="text"
            placeholder="Lookup by ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
<<<<<<< HEAD
            className="cp-search-input"
          />
          </div>
=======
            style={searchInputStyles.input}
            onFocus={(e) => {
              Object.assign(e.currentTarget.style, searchInputStyles.inputFocus);
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-panel-border)';
              e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-secondary)';
            }}
          />
>>>>>>> b2a4a8f8de8904a46f4a76f8476d7f39a6f12196
        </div>
        <DateFilterDropdown
          value={dateFilter}
          onChange={setDateFilter}
          triggerButton={
        <div style={{
          padding: '6px 12px',
          backgroundColor: 'var(--color-panel-bg-secondary)',
          border: '1px solid var(--color-panel-border)',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: 'var(--color-panel-text-muted)',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-secondary)';
            }}
            >
          <Calendar size={14} />
              <span>
                Uploaded at: {
                  dateFilter.type === 'any' ? 'Any time' :
                  dateFilter.type === 'last24h' ? 'Last 24 hours' :
                  dateFilter.type === 'last7d' ? 'Last 7 days' :
                  dateFilter.type === 'last30d' ? 'Last 30 days' :
                  dateFilter.type === 'last90d' ? 'Last 90 days' :
                  'Custom range'
                }
              </span>
        </div>
          }
        />
        <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--color-panel-text-muted)', marginLeft: '8px' }}>
        Total Files {files.length}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleUploadClick}
            className="cp-btn"
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-panel-accent-hover)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-panel-accent)';
            }}
          >
            <Upload size={14} /> Upload Files
          </button>
        </div>
      </div>


      {/* Table */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px',
          borderBottom: '1px solid var(--color-panel-border)',
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--color-panel-text-muted)',
          backgroundColor: 'var(--color-panel-bg)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div style={{ width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Checkbox
              checked={filteredFiles.length > 0 && selectedFileIds.length === filteredFiles.length}
              indeterminate={filteredFiles.length > 0 && selectedFileIds.length > 0 && selectedFileIds.length < filteredFiles.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
              size={16}
            />
          </div>
          <div style={{ width: '25%' }}>ID</div>
          <div style={{ width: '96px' }}>Size</div>
          <div style={{ width: '25%' }}>Content type</div>
          <div style={{ flex: 1 }}>Uploaded at</div>
        </div>

        {/* Table Content */}
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: 'var(--color-panel-bg)' }}>
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
            <div style={{
              color: 'var(--color-panel-text-muted)',
              fontSize: '14px',
              padding: '32px',
              textAlign: 'center',
            }}>
              Loading files...
            </div>
          ) : filteredFiles.length === 0 && uploadingFiles.length === 0 ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '32px',
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: 'color-mix(in srgb, var(--color-panel-error) 10%, transparent)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}>
                <FileCode size={24} style={{ color: 'var(--color-panel-error)' }} />
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 500,
                color: 'var(--color-panel-text)',
                marginBottom: '8px',
              }}>
                No files yet.
              </h3>
              <p style={{
                fontSize: '14px',
                color: 'var(--color-panel-text-muted)',
                marginBottom: '24px',
              }}>
                With Convex File Storage, you can store and serve files.
              </p>
              <a
                href="https://docs.convex.dev/file-storage"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '14px',
                  color: 'var(--color-panel-info)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                <ExternalLink size={12} /> Learn more about file storage.
              </a>
            </div>
          ) : (
            <>
              {/* Uploading files as skeleton rows */}
              {uploadingFiles.map((uploadingFile) => {
                const isUploading = uploadingFile.status === 'uploading';
                const isError = uploadingFile.status === 'error';
                const isSuccess = uploadingFile.status === 'success';

                return (
                  <div
                    key={uploadingFile.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px',
                      borderBottom: '1px solid var(--color-panel-border)',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      color: 'var(--color-panel-text-secondary)',
                      backgroundColor: isError ? 'color-mix(in srgb, var(--color-panel-error) 10%, transparent)' : 'transparent',
                      opacity: isSuccess ? 0.6 : 1,
                      cursor: isUploading ? 'default' : 'pointer',
                    }}
                    onClick={!isUploading ? () => {
                      // If uploaded successfully, try to find and click the file
                      if (uploadingFile.storageId) {
                        const uploadedFile = files.find(f => f._id === uploadingFile.storageId || f.storageId === uploadingFile.storageId);
                        if (uploadedFile) {
                          handleFileClick(uploadedFile);
                        }
                      }
                    } : undefined}
                    onMouseEnter={!isUploading ? (e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                    } : undefined}
                    onMouseLeave={!isUploading ? (e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    } : undefined}
                  >
                    <div style={{ width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isUploading ? (
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            backgroundColor: 'var(--color-panel-border)',
                            borderRadius: '6px',
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                          }}
                        />
                      ) : (
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={false}
                            disabled
                            size={16}
                          />
                        </div>
                      )}
                    </div>
                    <div style={{
                      width: '25%',
                      color: isError ? 'var(--color-panel-error)' : 'var(--color-panel-text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                    }}>
                      {isUploading ? (
                        <div
                          style={{
                            width: '140px',
                            height: '11px',
                            backgroundColor: 'var(--color-panel-border)',
                            borderRadius: '2px',
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                          }}
                        />
                      ) : (
                        uploadingFile.storageId || uploadingFile.file.name
                      )}
                    </div>
                    <div style={{ width: '96px', color: 'var(--color-panel-text-secondary)' }}>
                      {isUploading ? (
                        <div
                          style={{
                            width: '50px',
                            height: '12px',
                            backgroundColor: 'var(--color-panel-border)',
                            borderRadius: '2px',
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                          }}
                        />
                      ) : (
                        formatFileSize(uploadingFile.file.size)
                      )}
                    </div>
                    <div style={{
                      width: '25%',
                      color: 'var(--color-panel-text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {isUploading ? (
                        <div
                          style={{
                            width: '90px',
                            height: '12px',
                            backgroundColor: 'var(--color-panel-border)',
                            borderRadius: '2px',
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                          }}
                        />
                      ) : (
                        uploadingFile.file.type || '-'
                      )}
                    </div>
                    <div style={{ flex: 1, color: 'var(--color-panel-text-secondary)' }}>
                      {isUploading ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              flex: 1,
                              maxWidth: '200px',
                              height: '4px',
                              backgroundColor: 'var(--color-panel-border)',
                              borderRadius: '2px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${uploadingFile.progress}%`,
                                height: '100%',
                                backgroundColor: 'var(--color-panel-accent)',
                                transition: 'width 0.2s',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--color-panel-text-muted)', minWidth: '35px' }}>
                            {Math.round(uploadingFile.progress)}%
                          </span>
                        </div>
                      ) : isError ? (
                        <span style={{ fontSize: '12px', color: 'var(--color-panel-error)' }}>
                          {uploadingFile.error || 'Upload failed'}
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px' }}>
                          {formatTimestamp(Date.now())}
                        </span>
                      )}
                    </div>
                    <div style={{ width: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      {isUploading ? (
                        <>
                          <div style={{ width: '12px', height: '12px' }} />
                          <div style={{ width: '12px', height: '12px' }} />
                        </>
                      ) : isError ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeUploadingFile(uploadingFile.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-panel-text-muted)',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--color-panel-text)';
                            e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--color-panel-text-muted)';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <X size={12} />
                        </button>
                      ) : (
                        <>
                          {uploadingFile.storageId && convexUrl && (
                            <div
                              style={{
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--color-panel-text-muted)',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--color-panel-info)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--color-panel-text-muted)';
                              }}
                            >
                              <ExternalLink size={12} />
                            </div>
                          )}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              if (uploadingFile.storageId) {
                                setFileToDelete({
                                  _id: uploadingFile.storageId,
                                  _creationTime: Date.now(),
                                  storageId: uploadingFile.storageId,
                                  name: uploadingFile.file.name,
                                  size: uploadingFile.file.size,
                                  contentType: uploadingFile.file.type,
                                });
                              }
                            }}
                            style={{
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--color-panel-text-muted)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--color-panel-error)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--color-panel-text-muted)';
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

              {/* Regular file rows */}
              {filteredFiles.map((file) => {
              const isSelected = selectedFileIds.includes(file._id);
              return (
                <div
                  key={file._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px',
                    borderBottom: '1px solid var(--color-panel-border)',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: 'var(--color-panel-text-secondary)',
                    backgroundColor: isSelected ? 'var(--color-panel-bg-tertiary)' : 'transparent',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleFileClick(file)}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                      checked={isSelected}
                        onChange={(e) => handleFileCheckboxSelect(file._id, e.target.checked)}
                        size={16}
                      />
                    </div>
                  </div>
                  <div style={{
                    width: '25%',
                    color: 'var(--color-panel-text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                  }}>
                    {file.storageId || file._id}
                  </div>
                  <div style={{ width: '96px', color: 'var(--color-panel-text-secondary)' }}>
                    {formatFileSize(file.size)}
                  </div>
                  <div style={{
                    width: '25%',
                    color: 'var(--color-panel-text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {file.contentType || '-'}
                  </div>
                  <div style={{ flex: 1, color: 'var(--color-panel-text-secondary)' }}>
                    {formatTimestamp(file._creationTime)}
                  </div>
                  <div style={{ width: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {file.url || (file.storageId && convexUrl) ? (
                      <div
                        onClick={(e) => handleFileDownload(e, file)}
                        style={{
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-panel-text-muted)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--color-panel-info)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--color-panel-text-muted)';
                        }}
                      >
                        <ExternalLink size={12} />
                      </div>
                    ) : null}
                    <div
                      onClick={(e) => handleFileDelete(e, file)}
                      style={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-panel-text-muted)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--color-panel-error)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--color-panel-text-muted)';
                      }}
                    >
                      <Trash2 size={12} />
                    </div>
                  </div>
                </div>
              );
            })}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {fileToDelete && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={cancelDelete}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--color-panel-bg)',
              border: '1px solid var(--color-panel-border)',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--color-panel-text)',
                marginBottom: '12px',
              }}
            >
              Delete File
            </h3>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--color-panel-text-secondary)',
                marginBottom: '8px',
              }}
            >
              Are you sure you want to delete this file?
            </p>
            <div
              style={{
                fontSize: '12px',
                fontFamily: 'monospace',
                color: 'var(--color-panel-text-muted)',
                backgroundColor: 'var(--color-panel-bg-secondary)',
                padding: '8px',
                borderRadius: '4px',
                marginBottom: '20px',
                wordBreak: 'break-all',
              }}
            >
              {fileToDelete.name || fileToDelete.storageId || fileToDelete._id}
            </div>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                style={{
                  padding: '6px 16px',
                  backgroundColor: 'var(--color-panel-bg-secondary)',
                  border: '1px solid var(--color-panel-border)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--color-panel-text)',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-secondary)';
                  }
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                style={{
                  padding: '6px 16px',
                  backgroundColor: 'var(--color-panel-error)',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'white',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-error-hover, color-mix(in srgb, var(--color-panel-error) 90%, black))';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-error)';
                  }
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


