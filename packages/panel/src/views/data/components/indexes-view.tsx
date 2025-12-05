import React, { useMemo, useState, useEffect } from 'react';
import { Fingerprint, Search, ArrowUpRight, X } from 'lucide-react';
import { useSheetSafe } from '../../../contexts/sheet-context';

export interface Index {
  table?: string;
  name: string;
  staged?: boolean;
  fields:
    | string[]
    | {
        searchField: string;
        filterFields: string[];
      }
    | {
        vectorField: string;
        filterFields: string[];
        dimensions: number;
      };
  backfill: {
    state: 'backfilling' | 'backfilled' | 'done';
    stats?: {
      numDocsIndexed: number;
      totalDocs: number | null;
    };
  };
}

export interface IndexesViewProps {
  tableName: string;
  adminClient?: any;
  componentId?: string | null;
}

function getIndexType(index: Index): 'database' | 'search' | 'vector' | 'unknown' {
  if (Array.isArray(index.fields)) {
    return 'database';
  }
  if ('searchField' in index.fields) {
    return 'search';
  }
  if ('vectorField' in index.fields) {
    return 'vector';
  }
  return 'unknown';
}

export const IndexesView: React.FC<IndexesViewProps> = ({ 
  tableName, 
  adminClient,
  componentId,
}) => {
  const { closeSheet } = useSheetSafe();
  const [fetchedIndexes, setFetchedIndexes] = useState<Index[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch indexes from the _system/frontend/indexes endpoint
  useEffect(() => {
    const fetchIndexes = async () => {
      if (!adminClient || !tableName) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const normalizedComponentId = componentId === 'app' || componentId === null ? null : componentId;
        
        // Use the same endpoint as the Convex dashboard
        const indexes = await adminClient.query(
          "_system/frontend/indexes:default" as any,
          {
            tableName,
            tableNamespace: normalizedComponentId,
          }
        );

        if (Array.isArray(indexes)) {
          setFetchedIndexes(indexes);
        } else {
          setFetchedIndexes([]);
        }
      } catch (err: any) {
        console.error('Error fetching indexes:', err);
        setError(err?.message || 'Failed to fetch indexes');
        setFetchedIndexes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIndexes();
  }, [adminClient, tableName, componentId]);

  // Group indexes by type
  const groupedIndexes = useMemo(() => {
    const groups: {
      database: Index[];
      search: Index[];
      vector: Index[];
    } = {
      database: [],
      search: [],
      vector: [],
    };

    fetchedIndexes.forEach((index) => {
      const type = getIndexType(index);
      if (type === 'database') {
        groups.database.push(index);
      } else if (type === 'search') {
        groups.search.push(index);
      } else if (type === 'vector') {
        groups.vector.push(index);
      }
    });

    return groups;
  }, [fetchedIndexes]);

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
          height: '40px',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--color-panel-text)',
          }}
        >
          <span>Indexes</span>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 400,
              color: 'var(--color-panel-text-muted)',
            }}
          >
            for{' '}
            <code
              style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                padding: '2px 4px',
                borderRadius: '3px',
                backgroundColor: 'var(--color-panel-bg-tertiary)',
                border: '1px solid var(--color-panel-border)',
              }}
            >
              {tableName}
            </code>
          </span>
        </div>

        {/* Close Button */}
        {closeSheet && (
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
        )}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px',
        }}
      >
        {isLoading && (
          <div
            style={{
              padding: '12px',
              fontSize: '12px',
              color: 'var(--color-panel-text-muted)',
            }}
          >
            Loading indexes…
          </div>
        )}
        {error && !isLoading && (
          <div
            style={{
              padding: '12px',
              marginBottom: '12px',
              fontSize: '12px',
              color: 'var(--color-panel-error)',
              backgroundColor: 'var(--color-panel-bg-tertiary)',
              border: '1px solid var(--color-panel-border)',
              borderRadius: '6px',
            }}
          >
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <>
            {/* Regular Indexes */}
            <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          <Fingerprint size={16} style={{ color: 'var(--color-panel-text-secondary)' }} />
          <h3
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--color-panel-text)',
            }}
          >
            Indexes
          </h3>
        </div>

        {groupedIndexes.database.length > 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {groupedIndexes.database.map((index) => (
              <IndexRow key={index.name} index={index} />
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: '12px',
              color: 'var(--color-panel-text-muted)',
              fontSize: '12px',
              fontStyle: 'italic',
              backgroundColor: 'var(--color-panel-bg-tertiary)',
              border: '1px solid var(--color-panel-border)',
              borderRadius: '6px',
            }}
          >
            <code style={{ fontFamily: 'monospace' }}>{tableName}</code> has no indexes.
          </div>
        )}
      </div>

      {/* Search Indexes */}
      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          <Search size={16} style={{ color: 'var(--color-panel-text-secondary)' }} />
          <h3
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--color-panel-text)',
            }}
          >
            Search indexes
          </h3>
        </div>
        {groupedIndexes.search.length > 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {groupedIndexes.search.map((index) => (
              <IndexRow key={index.name} index={index} />
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: '12px',
              color: 'var(--color-panel-text-muted)',
              fontSize: '12px',
              fontStyle: 'italic',
              backgroundColor: 'var(--color-panel-bg-tertiary)',
              border: '1px solid var(--color-panel-border)',
              borderRadius: '6px',
            }}
          >
            {tableName} has no search indexes.
          </div>
        )}
      </div>

      {/* Vector Indexes */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          <ArrowUpRight size={16} style={{ color: 'var(--color-panel-text-secondary)' }} />
          <h3
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--color-panel-text)',
            }}
          >
            Vector indexes
          </h3>
        </div>
        {groupedIndexes.vector.length > 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {groupedIndexes.vector.map((index) => (
              <IndexRow key={index.name} index={index} />
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: '12px',
              color: 'var(--color-panel-text-muted)',
              fontSize: '12px',
              fontStyle: 'italic',
              backgroundColor: 'var(--color-panel-bg-tertiary)',
              border: '1px solid var(--color-panel-border)',
              borderRadius: '6px',
            }}
          >
            {tableName} has no vector indexes.
          </div>
        )}
      </div>
          </>
        )}
      </div>
    </div>
  );
};

function IndexRow({ index }: { index: Index }) {
  const isStaged = index.staged === true;
  const fields = index.fields;

  return (
    <div
      style={{
        padding: '12px',
        backgroundColor: 'var(--color-panel-bg-tertiary)',
        border: '1px solid var(--color-panel-border)',
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-panel-accent)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-panel-border)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--color-panel-text)',
          }}
        >
          {index.name}
        </div>
        {isStaged && (
          <span
            style={{
              fontSize: '11px',
              padding: '2px 6px',
              color: 'var(--color-panel-text-secondary)',
              backgroundColor: 'var(--color-panel-bg-secondary)',
              border: '1px solid var(--color-panel-border)',
              borderRadius: '4px',
              fontFamily: 'monospace',
            }}
          >
            Staged
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px' }}>
        {Array.isArray(fields) && (
          <IndexAttribute title="Fields">
            <span style={{ fontFamily: 'monospace' }}>
              {fields.map((field, i) => (
                <React.Fragment key={field}>
                  <code>{field}</code>
                  {i < fields.length - 1 && <span>, </span>}
                </React.Fragment>
              ))}
            </span>
          </IndexAttribute>
        )}

        {'searchField' in fields && (
          <IndexAttribute title="Search field">
            <code style={{ fontFamily: 'monospace' }}>{fields.searchField}</code>
          </IndexAttribute>
        )}

        {'vectorField' in fields && (
          <IndexAttribute title="Vector field">
            <code style={{ fontFamily: 'monospace' }}>{fields.vectorField}</code>
          </IndexAttribute>
        )}

        {'filterFields' in fields && fields.filterFields.length > 0 && (
          <IndexAttribute title="Filter fields">
            <span style={{ fontFamily: 'monospace' }}>
              {fields.filterFields.map((field, i) => (
                <React.Fragment key={field}>
                  <code>{field}</code>
                  {i < fields.filterFields.length - 1 && <span>, </span>}
                </React.Fragment>
              ))}
            </span>
          </IndexAttribute>
        )}

        {'dimensions' in fields && (
          <IndexAttribute title="Dimensions">
            {fields.dimensions}
          </IndexAttribute>
        )}
      </div>

      {index.backfill.state === 'backfilling' && (
        <div
          style={{
            padding: '8px',
            marginTop: '4px',
            fontSize: '12px',
            color: 'var(--color-panel-text-secondary)',
            backgroundColor: 'var(--color-panel-bg-secondary)',
            border: '1px solid var(--color-panel-border)',
            borderRadius: '4px',
          }}
        >
          <div style={{ marginBottom: '6px', fontWeight: 500 }}>Backfill in progress</div>
          {index.backfill.stats && index.backfill.stats.totalDocs !== null && (
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'var(--color-panel-border)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(
                    99,
                    (index.backfill.stats.numDocsIndexed / index.backfill.stats.totalDocs) * 100
                  )}%`,
                  height: '100%',
                  backgroundColor: 'var(--color-panel-accent)',
                  transition: 'width 0.3s',
                }}
              />
            </div>
          )}
        </div>
      )}

      {index.backfill.state === 'backfilled' && (
        <div
          style={{
            padding: '8px',
            marginTop: '4px',
            fontSize: '12px',
            color: 'var(--color-panel-text-secondary)',
            backgroundColor: 'var(--color-panel-bg-secondary)',
            border: '1px solid var(--color-panel-border)',
            borderRadius: '4px',
          }}
        >
          <div style={{ marginBottom: '6px', fontWeight: 500 }}>Backfill completed</div>
          <div
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'var(--color-panel-accent)',
              borderRadius: '4px',
            }}
          />
        </div>
      )}
    </div>
  );
}

function IndexAttribute({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <div style={{ display: 'flex', gap: '4px', fontSize: '12px', color: 'var(--color-panel-text-secondary)' }}>
      <span>
        <strong style={{ fontWeight: 500, color: 'var(--color-panel-text)' }}>{title}</strong>:
      </span>
      <div>{children}</div>
    </div>
  );
}

