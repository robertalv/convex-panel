import React, { useState, useEffect } from 'react';
import { Copy, Loader2, ExternalLink, Download, FileText, File, X } from 'lucide-react';
import { copyToClipboard } from '../../../utils/toast';
import type { FileMetadata } from '../../../utils/api/types';
import { useSheetSafe } from '../../../contexts/sheet-context';

const ImagePreview: React.FC<{
  url: string;
  accessToken?: string;
  deploymentUrl?: string;
  onError: () => void;
}> = ({ url, accessToken, deploymentUrl, onError }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accessToken || !deploymentUrl || !url.includes(deploymentUrl)) {
      setImageUrl(url);
      setIsLoading(false);
      return;
    }

    const loadImage = async () => {
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Convex ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load: ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setImageUrl(blobUrl);
      } catch (err) {
        onError();
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();

    return () => {
      // Cleanup will be handled by the state update
    };
  }, [url, accessToken, deploymentUrl, onError]);

  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          color: 'var(--color-panel-text-secondary)',
          fontSize: '14px',
        }}
      >
        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Loading image...</span>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!imageUrl) {
    return null;
  }

  return (
    <img
      src={imageUrl}
      alt="File preview"
      style={{
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
      }}
      onError={onError}
    />
  );
};

export interface FilePreviewProps {
  file: FileMetadata;
  deploymentUrl?: string;
  accessToken?: string;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  deploymentUrl,
  accessToken,
}) => {
  const { closeSheet } = useSheetSafe();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [fileContent, setFileContent] = useState<string | null>(null);

  useEffect(() => {
    if (!file.url && deploymentUrl && file.storageId) {
      setPreviewUrl(`${deploymentUrl}/api/storage/${file.storageId}`);
    } else if (file.url) {
      setPreviewUrl(file.url);
    }
  }, [file, deploymentUrl]);


  const handleCopy = (text: string) => {
    copyToClipboard(text);
  };

  const handleDownload = async () => {
    if (!previewUrl || !accessToken) return;

    try {
      const response = await fetch(previewUrl, {
        headers: {
          'Authorization': `Convex ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = file.name || `file-${file.storageId || file._id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      setPreviewError(err?.message || 'Failed to download file');
    }
  };

  const loadTextPreview = async () => {
    if (!previewUrl || !accessToken || fileContent !== null) return;

    setIsLoadingPreview(true);
    setPreviewError(null);

    try {
      const response = await fetch(previewUrl, {
        headers: {
          'Authorization': `Convex ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load: ${response.status}`);
      }

      const text = await response.text();
      setFileContent(text);
    } catch (err: any) {
      setPreviewError(err?.message || 'Failed to load file content');
    } finally {
      setIsLoadingPreview(false);
    }
  };

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
      second: '2-digit',
    });
  };

  const isImage = file.contentType?.startsWith('image/');
  const isText = file.contentType?.startsWith('text/') || 
                 file.contentType === 'application/json' ||
                 file.contentType === 'application/javascript' ||
                 file.contentType === 'application/xml' ||
                 file.name?.endsWith('.txt') ||
                 file.name?.endsWith('.json') ||
                 file.name?.endsWith('.js') ||
                 file.name?.endsWith('.ts') ||
                 file.name?.endsWith('.tsx') ||
                 file.name?.endsWith('.jsx') ||
                 file.name?.endsWith('.css') ||
                 file.name?.endsWith('.html') ||
                 file.name?.endsWith('.md');

  const fileMetadataJson = JSON.stringify({
    _id: file._id,
    _creationTime: file._creationTime,
    storageId: file.storageId,
    contentType: file.contentType,
    size: file.size,
    name: file.name,
    sha256: file.sha256,
    url: file.url || previewUrl,
  }, null, 2);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--color-panel-bg-secondary)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0px 12px',
          borderBottom: '1px solid var(--color-panel-border)',
          backgroundColor: 'var(--color-panel-bg-secondary)',
          height: '50px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--color-panel-text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: '20px',
              }}
            >
              {file.name || `${file.storageId || file._id}`}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {previewUrl && (
            <button
              type="button"
              onClick={handleDownload}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                padding: 0,
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                color: 'var(--color-panel-text-muted)',
                flexShrink: 0,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-panel-text)';
                e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-panel-text-muted)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Download size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={() => handleCopy(fileMetadataJson)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              padding: 0,
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              color: 'var(--color-panel-text-muted)',
              flexShrink: 0,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-panel-text)';
              e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-panel-text-muted)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Copy size={14} />
          </button>
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                padding: 0,
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                color: 'var(--color-panel-text-muted)',
                flexShrink: 0,
                transition: 'all 0.2s',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-panel-text)';
                e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-panel-text-muted)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <ExternalLink size={14} />
            </a>
          )}
          <button
            type="button"
            onClick={closeSheet}
            style={{
              padding: '6px',
              color: 'var(--color-panel-text-secondary)',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-panel-text)';
              e.currentTarget.style.backgroundColor = 'var(--color-panel-border)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div
        style={{
          flex: 1,
          padding: '16px',
          backgroundColor: 'var(--color-panel-bg)',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          // borderBottom: '1px solid var(--color-panel-border)',
        }}
      >
        {previewError ? (
          <div style={{ color: 'var(--color-panel-error)', fontSize: '14px', textAlign: 'center' }}>
            {previewError}
          </div>
        ) : isImage && previewUrl ? (
          <ImagePreview
            url={previewUrl}
            accessToken={accessToken}
            deploymentUrl={deploymentUrl}
            onError={() => setPreviewError('Failed to load image')}
          />
        ) : isText ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {isLoadingPreview ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: 'var(--color-panel-text-secondary)',
                  fontSize: '14px',
                  height: '100%',
                }}
              >
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Loading file content...</span>
                <style>{`
                  @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            ) : fileContent !== null ? (
              <pre
                style={{
                  margin: 0,
                  padding: '16px',
                  color: 'var(--color-panel-text)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  width: '100%',
                  backgroundColor: 'var(--color-panel-bg)',
                  borderRadius: '6px',
                  // border: '1px solid var(--color-panel-border)',
                  overflow: 'auto',
                  flex: 1,
                }}
              >
                {fileContent}
              </pre>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <FileText size={48} style={{ color: 'var(--color-panel-text-muted)', marginBottom: '12px' }} />
                <div style={{ color: 'var(--color-panel-text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
                  Text file detected
                </div>
                <button
                  type="button"
                  onClick={loadTextPreview}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--color-panel-accent)',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-accent-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-accent)';
                  }}
                >
                  Load Content
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <File size={48} style={{ color: 'var(--color-panel-text-muted)', marginBottom: '12px' }} />
            <div style={{ color: 'var(--color-panel-text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
              Preview not available for this file type
            </div>
            <div style={{ color: 'var(--color-panel-text-muted)', fontSize: '12px' }}>
              {file.contentType || 'Unknown content type'}
            </div>
          </div>
        )}
      </div>

      {/* Metadata Footer */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid var(--color-panel-border)',
          backgroundColor: 'var(--color-panel-bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            color: 'var(--color-panel-text-muted)',
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '8px 12px',
            alignItems: 'baseline',
          }}
        >
          <div style={{ fontWeight: 500, color: 'var(--color-panel-text-secondary)' }}>Storage ID:</div>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-panel-text)', wordBreak: 'break-all' }}>
            {file.storageId || file._id}
          </div>
          
          <div style={{ fontWeight: 500, color: 'var(--color-panel-text-secondary)' }}>Content Type:</div>
          <div style={{ color: 'var(--color-panel-text)' }}>{file.contentType || '-'}</div>
          
          <div style={{ fontWeight: 500, color: 'var(--color-panel-text-secondary)' }}>Size:</div>
          <div style={{ color: 'var(--color-panel-text)' }}>{formatFileSize(file.size)}</div>
          
          {file._creationTime && (
            <>
              <div style={{ fontWeight: 500, color: 'var(--color-panel-text-secondary)' }}>Uploaded:</div>
              <div style={{ color: 'var(--color-panel-text)' }}>{formatTimestamp(file._creationTime)}</div>
            </>
          )}
          
          {file.sha256 && (
            <>
              <div style={{ fontWeight: 500, color: 'var(--color-panel-text-secondary)' }}>SHA256:</div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-panel-text)', wordBreak: 'break-all' }}>
                {file.sha256}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

