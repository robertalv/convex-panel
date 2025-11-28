import React from 'react';
import { Loader2, ExternalLink, Copy } from 'lucide-react';
import { createDocumentLink } from './table/data-table-utils';

export interface DocumentPreviewProps {
  documentId: string;
  tableName: string;
  adminClient?: any;
  deploymentUrl?: string;
  componentId?: string | null;
  isEditing?: boolean;
  onNavigateToTable?: (tableName: string, documentId: string) => void;
  accessToken?: string;
  teamSlug?: string;
  projectSlug?: string;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  documentId,
  tableName,
  adminClient,
  deploymentUrl,
  componentId,
  isEditing = false,
  onNavigateToTable,
  accessToken,
  teamSlug,
  projectSlug,
}) => {
  const [document, setDocument] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!adminClient || !documentId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchDocument = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Use the paginatedTableDocuments query with a filter for the specific document ID
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
          // Extract the document from the paginated result
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

  if (isLoading) {
    return (
      <>
        <div
          style={{
            padding: '16px',
            minWidth: '300px',
            maxWidth: '500px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            color: 'var(--color-panel-text-secondary)',
            fontSize: '12px',
          }}
        >
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Loading document...</span>
        </div>
        <style>{`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '16px',
          minWidth: '300px',
          maxWidth: '500px',
          color: 'var(--color-panel-error)',
          fontSize: '12px',
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
          padding: '16px',
          minWidth: '300px',
          maxWidth: '500px',
          color: 'var(--color-panel-text-muted)',
          fontSize: '12px',
        }}
      >
        Document not found
      </div>
    );
  }

  // Format creation date
  const creationDate = document._creationTime
    ? new Date(document._creationTime).toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
    : 'Unknown';

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

  // Handle copy document
  const handleCopyDocument = () => {
    const jsonString = JSON.stringify(document, null, 2);
    navigator.clipboard.writeText(jsonString).catch((err) => {
      console.error('Failed to copy document:', err);
    });
  };

  // Simple view (when not editing) - just JSON
  if (!isEditing) {
    return (
      <div
        style={{
          minWidth: '300px',
          maxWidth: '500px',
          maxHeight: '400px',
          overflow: 'auto',
          fontFamily: 'monospace',
          fontSize: '12px',
          lineHeight: '1.5',
          padding: 0,
        }}
      >
        <pre
          style={{
            margin: 0,
            padding: '16px',
            color: 'var(--color-panel-text)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            backgroundColor: 'transparent',
          }}
        >
          {JSON.stringify(document, null, 2)}
        </pre>
      </div>
    );
  }

  // Detailed view (when editing) - with header and actions
  return (
    <div
      onClick={(e) => {
        // Prevent clicks inside the preview from closing tooltip or bubbling
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        // Also prevent mousedown from bubbling
        e.stopPropagation();
      }}
      style={{
        minWidth: '300px',
        maxWidth: '500px',
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'auto',
        position: 'relative',
        zIndex: 100000,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--color-panel-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <div
          style={{
            fontSize: '13px',
            color: 'var(--color-panel-text)',
            fontWeight: 500,
          }}
        >
          Document in{' '}
          <span
            style={{
              color: 'var(--color-panel-accent)',
              fontFamily: 'monospace',
            }}
          >
            {tableName}
          </span>
          , created {creationDate}
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          padding: '8px 16px',
          borderBottom: '1px solid var(--color-panel-border)',
          display: 'flex',
          gap: '16px',
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            
            // Execute navigation
            if (onNavigateToTable) {
              onNavigateToTable(tableName, documentId);
            } else if (dashboardLink) {
              window.open(dashboardLink, '_blank', 'noopener,noreferrer');
            }
          }}
          onMouseDown={(e) => {
            // Handle mousedown - stop propagation immediately to prevent container from interfering
            e.stopPropagation();
            
            // Execute navigation here as primary handler since onClick might not fire due to event propagation issues
            if (onNavigateToTable) {
              onNavigateToTable(tableName, documentId);
            } else if (dashboardLink) {
              window.open(dashboardLink, '_blank', 'noopener,noreferrer');
            }
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
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
            padding: '4px 8px',
            fontFamily: 'inherit',
            position: 'relative',
            zIndex: 100000,
            pointerEvents: 'auto',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          <ExternalLink size={14} />
          <span>View in table</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCopyDocument();
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
            padding: 0,
            fontFamily: 'inherit',
          }}
        >
          <Copy size={14} />
          <span>Copy Document</span>
        </button>
      </div>

      {/* JSON Content */}
      <div
        style={{
          maxHeight: '400px',
          overflow: 'auto',
          fontFamily: 'monospace',
          fontSize: '12px',
          lineHeight: '1.5',
          padding: 0,
        }}
      >
        <pre
          style={{
            margin: 0,
            padding: '16px',
            color: 'var(--color-panel-text)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            backgroundColor: 'transparent',
          }}
        >
          {JSON.stringify(document, null, 2)}
        </pre>
      </div>
    </div>
  );
};

