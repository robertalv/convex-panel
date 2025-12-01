import React, { useState, useEffect } from 'react';
import { Copy, Loader2, ExternalLink } from 'lucide-react';
import { copyToClipboard } from '../../../utils/toast';
import { createDocumentLink, isConvexId } from './table/data-table-utils';
import { useSheetSafe } from '../../../contexts/sheet-context';

export interface DocumentViewerProps {
  documentId: string;
  tableName: string;
  adminClient?: any;
  deploymentUrl?: string;
  componentId?: string | null;
  onNavigateToTable?: (tableName: string, documentId: string) => void;
  accessToken?: string;
  teamSlug?: string;
  projectSlug?: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentId,
  tableName,
  adminClient,
  deploymentUrl,
  componentId,
  onNavigateToTable,
  accessToken,
  teamSlug,
  projectSlug,
}) => {
  const { closeSheet } = useSheetSafe();
  const [document, setDocument] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!adminClient || !documentId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchDocument = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Normalize componentId: 'app' means root (null)
        const normalizedComponentId = componentId === 'app' || componentId === null ? null : componentId;

        // Create a filter for the specific document ID
        const filterString = btoa(JSON.stringify({
          clauses: [{
            op: 'eq',
            field: '_id',
            value: documentId,
            enabled: true,
            id: `_id_${Date.now()}`
          }]
        }));

        const result = await adminClient.query(
          "_system/frontend/paginatedTableDocuments:default" as any,
          {
            table: tableName,
            componentId: normalizedComponentId,
            filters: filterString,
            paginationOpts: {
              numItems: 1,
              cursor: null,
              id: Date.now(),
            },
          }
        );

        if (!cancelled) {
          const documents = result?.page || [];
          const doc = documents[0] || null;
          
          if (doc && doc._id === documentId) {
            setDocument(doc);
          } else {
            setError('Document not found');
          }
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load document');
          setIsLoading(false);
        }
      }
    };

    fetchDocument();

    return () => {
      cancelled = true;
    };
  }, [adminClient, documentId, tableName, componentId]);

  const handleCopy = () => {
    if (document) {
      const jsonString = JSON.stringify(document, null, 2);
      copyToClipboard(jsonString);
    }
  };

  // Create dashboard link
  const dashboardLink = createDocumentLink(
    deploymentUrl,
    tableName,
    documentId,
    componentId || null,
    teamSlug,
    projectSlug,
    accessToken
  );

  // Format creation date
  const creationDate = document?._creationTime
    ? new Date(document._creationTime).toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
    : null;

  if (isLoading) {
    return (
      <div
        style={{
          padding: '20px',
          minHeight: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          color: 'var(--color-panel-text-secondary)',
          fontSize: '14px',
        }}
      >
        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Loading document...</span>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '20px',
          minHeight: '100%',
          color: 'var(--color-panel-error)',
          fontSize: '14px',
        }}
      >
        {error}
      </div>
    );
  }

  if (!document) {
    return (
      <div
        style={{
          padding: '20px',
          minHeight: '100%',
          color: 'var(--color-panel-text-muted)',
          fontSize: '14px',
        }}
      >
        Document not found
      </div>
    );
  }

  const jsonString = JSON.stringify(document, null, 2);

  return (
    <div
      style={{
        padding: '20px',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '13px',
              color: 'var(--color-panel-text-muted)',
              marginBottom: '4px',
            }}
          >
            Document
          </div>
          <div
            style={{
              fontSize: '14px',
              color: 'var(--color-panel-text)',
              fontFamily: 'monospace',
              fontWeight: 500,
            }}
          >
            {documentId}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(onNavigateToTable || dashboardLink) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onNavigateToTable) {
                  onNavigateToTable(tableName, documentId);
                  closeSheet();
                } else if (dashboardLink) {
                  window.open(dashboardLink, '_blank', 'noopener,noreferrer');
                  closeSheet();
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                color: 'var(--color-panel-accent)',
                cursor: 'pointer',
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: '6px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <ExternalLink size={14} />
              <span>View in table</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              color: 'var(--color-panel-accent)',
              cursor: 'pointer',
              fontSize: '12px',
              padding: '6px 12px',
              borderRadius: '6px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Copy size={14} />
            <span>Copy</span>
          </button>
        </div>
      </div>

      {/* Document Content */}
      <div
        style={{
          flex: 1,
          padding: '16px',
          backgroundColor: 'var(--color-panel-bg)',
          borderRadius: '8px',
          border: '1px solid var(--color-panel-border)',
          overflow: 'auto',
        }}
      >
        <pre
          style={{
            margin: 0,
            padding: 0,
            color: 'var(--color-panel-text)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'monospace',
            fontSize: '13px',
            lineHeight: '1.6',
          }}
        >
          {jsonString}
        </pre>
      </div>

      {/* Metadata */}
      <div
        style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid var(--color-panel-border)',
          fontSize: '12px',
          color: 'var(--color-panel-text-muted)',
        }}
      >
        <div style={{ marginBottom: '4px' }}>
          <strong>Table:</strong>{' '}
          <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{tableName}</span>
        </div>
        {creationDate && (
          <div style={{ marginBottom: '4px' }}>
            <strong>Created:</strong> {creationDate}
          </div>
        )}
        <div>
          <strong>Fields:</strong> {Object.keys(document).length} properties
        </div>
      </div>
    </div>
  );
};

