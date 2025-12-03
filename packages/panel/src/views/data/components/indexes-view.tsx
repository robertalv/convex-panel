import React, { useMemo, useState, useEffect } from 'react';
import { Fingerprint, Search, ArrowUpRight } from 'lucide-react';
import { Card } from '../../../components/shared/card';

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
        padding: '20px',
        height: '100%',
        overflow: 'auto',
        backgroundColor: 'var(--color-panel-bg-secondary)',
      }}
    >
      <Card
        title="Indexes"
        style={{ maxWidth: '100%' }}
        action={
          <span style={{ fontSize: '11px', color: 'var(--color-panel-text-muted)' }}>
            Table{' '}
            <code style={{ fontFamily: 'monospace', fontSize: '11px' }}>
              {tableName}
            </code>
          </span>
        }
      >
        {isLoading && (
          <div
            style={{
              padding: '8px 0 4px',
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
              marginTop: '4px',
              marginBottom: '12px',
              fontSize: '12px',
              color: 'var(--color-panel-error)',
            }}
          >
            {error}
          </div>
        )}

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

        {isLoading ? (
          <div
            style={{
              padding: '12px',
              color: 'var(--color-panel-text-muted)',
              fontSize: '12px',
            }}
          >
            Loading indexes…
          </div>
        ) : error ? (
          <div
            style={{
              padding: '12px',
              color: 'var(--color-panel-error)',
              fontSize: '12px',
            }}
          >
            Error: {error}
          </div>
        ) : groupedIndexes.database.length > 0 ? (
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
            }}
          >
            {tableName} has no vector indexes.
          </div>
        )}
      </div>
      </Card>
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
        backgroundColor: 'var(--color-panel-bg-secondary)',
        border: '1px solid var(--color-panel-border)',
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
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
              color: 'var(--color-panel-text-muted)',
              textDecoration: 'underline',
              textDecorationStyle: 'dotted',
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
        <div style={{ paddingLeft: '8px', fontSize: '12px', color: 'var(--color-panel-text-secondary)' }}>
          <div style={{ marginBottom: '4px' }}>Backfill in progress</div>
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
        <div style={{ paddingLeft: '8px', fontSize: '12px', color: 'var(--color-panel-text-secondary)' }}>
          <div style={{ marginBottom: '4px' }}>Backfill completed</div>
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

