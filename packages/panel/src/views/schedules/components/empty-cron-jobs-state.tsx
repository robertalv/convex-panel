import React, { useEffect, useRef, useState } from 'react';
import { Calendar, ExternalLink } from 'lucide-react';

export interface EmptyCronJobsStateProps {
  searchQuery?: string;
}

export const EmptyCronJobsState: React.FC<EmptyCronJobsStateProps> = ({ 
  searchQuery 
}) => {
  const tableRef = useRef<HTMLDivElement | null>(null);
  const [fakeRows, setFakeRows] = useState(15);

  useEffect(() => {
    if (!tableRef.current) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect?.height ?? 0;
      const rowHeight = 40;
      setFakeRows(Math.max(10, Math.ceil(height / rowHeight) + 5));
    });
    observer.observe(tableRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', overflow: 'hidden' }}>
      {/* Skeleton Table */}
      <div
        ref={tableRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          maskImage:
            'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 30%, transparent 90%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 30%, transparent 90%)',
        }}
      >
        {/* Header Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px',
          borderBottom: '1px solid var(--cp-data-row-border)',
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--color-panel-text-muted)',
          backgroundColor: 'var(--color-panel-bg)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div style={{ width: '25%', display: 'flex', alignItems: 'center' }}>Name</div>
          <div style={{ width: '25%', display: 'flex', alignItems: 'center' }}>Schedule</div>
          <div style={{ width: '25%', display: 'flex', alignItems: 'center' }}>Function</div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>Last/Next Run</div>
          <div style={{ width: '100px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}></div>
        </div>

        {/* Skeleton Rows */}
        <div style={{ paddingTop: '0' }}>
          {Array.from({ length: fakeRows }).map((_, rowIdx) => (
            <div
              key={`skeleton-row-${rowIdx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px',
                borderBottom: '1px solid var(--cp-data-row-border)',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: 'var(--color-panel-text-secondary)',
              }}
            >
              {/* Name Column */}
              <div style={{ width: '25%', display: 'flex', alignItems: 'center' }}>
                <div
                  style={{
                    height: '12px',
                    borderRadius: '999px',
                    backgroundColor: 'var(--color-panel-hover)',
                    width: `${50 + (rowIdx % 4) * 14}%`,
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  }}
                />
              </div>
              {/* Schedule Column */}
              <div style={{ width: '25%', display: 'flex', alignItems: 'center' }}>
                <div
                  style={{
                    height: '12px',
                    borderRadius: '999px',
                    backgroundColor: 'var(--color-panel-hover)',
                    width: `${60 + (rowIdx % 3) * 13}%`,
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    animationDelay: `${rowIdx * 0.1}s`,
                  }}
                />
              </div>
              {/* Function Column */}
              <div style={{ width: '25%', display: 'flex', alignItems: 'center' }}>
                <div
                  style={{
                    height: '12px',
                    borderRadius: '999px',
                    backgroundColor: 'var(--color-panel-hover)',
                    width: `${65 + (rowIdx % 5) * 9}%`,
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    animationDelay: `${rowIdx * 0.12}s`,
                  }}
                />
              </div>
              {/* Last/Next Run Column */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', justifyContent: 'center' }}>
                <div
                  style={{
                    height: '10px',
                    borderRadius: '999px',
                    backgroundColor: 'var(--color-panel-hover)',
                    width: `${55 + (rowIdx % 4) * 11}%`,
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    animationDelay: `${rowIdx * 0.14}s`,
                  }}
                />
                <div
                  style={{
                    height: '10px',
                    borderRadius: '999px',
                    backgroundColor: 'var(--color-panel-hover)',
                    width: `${45 + (rowIdx % 3) * 16}%`,
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    animationDelay: `${rowIdx * 0.16}s`,
                  }}
                />
              </div>
              {/* Actions Column */}
              <div style={{ width: '100px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-panel-hover)',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    animationDelay: `${rowIdx * 0.18}s`,
                  }}
                />
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-panel-hover)',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    animationDelay: `${rowIdx * 0.2}s`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Centered Message */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-panel-bg) 92%, transparent)',
            border: '1px solid var(--color-panel-border)',
            borderRadius: '24px',
            padding: '32px 40px',
            textAlign: 'center',
            color: 'var(--color-panel-text)',
            maxWidth: 420,
            width: '90%',
            boxShadow: '0 25px 55px var(--color-panel-shadow)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              backgroundColor: 'color-mix(in srgb, var(--color-panel-error) 10%, transparent)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              margin: '0 auto 16px',
            }}
          >
            <Calendar size={24} style={{ color: 'var(--color-panel-error)' }} />
          </div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 500,
            color: 'var(--color-panel-text)',
            marginBottom: '8px',
            margin: '0 0 8px',
          }}>
            {searchQuery ? 'No matching cron jobs found' : 'No Cron Jobs Found'}
          </h3>
          <p style={{
            fontSize: '14px',
            color: 'var(--color-panel-text-muted)',
            marginBottom: '24px',
            margin: '0 0 24px',
          }}>
            {searchQuery ? 'Try adjusting your search query' : 'Define cron jobs in your Convex functions to see them here.'}
          </p>
          <a
            href="https://docs.convex.dev/scheduling/cron-jobs"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '14px',
              color: 'var(--color-panel-info)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              pointerEvents: 'auto',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            <ExternalLink size={12} /> Learn more about cron jobs
          </a>
        </div>
      </div>
    </div>
  );
};








