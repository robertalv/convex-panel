import React from 'react';
import { HelpCircle } from 'lucide-react';
import type { Insight } from '../../../utils/api/types';
import { Tooltip } from '../../../components/shared/tooltip';

const formatNumberCompact = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

// Constants from Convex reference
const documentsReadLimit = 32000;
const megabytesReadLimit = 16;

export const ProblemForInsight: React.FC<{ insight: Insight }> = ({ insight }) => {
  // Handle OCC insights
  if (insight.kind === 'occRetried' || insight.kind === 'occFailedPermanently') {
    const isFailed = insight.kind === 'occFailedPermanently';
    const occDetails = insight.details as {
      occCalls: number;
      occTableName?: string;
      hourlyCounts: any[];
      recentEvents: any[];
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--color-panel-text)' }}>
          {isFailed ? 'Failed' : 'Retried'} due to write conflicts{' '}
          <Tooltip
            content={
              <>
                <a
                  href="https://docs.convex.dev/error#1"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'underline' }}
                >
                  Learn more
                </a>{' '}
                about write conflicts.
              </>
            }
            position="right"
          >
            <HelpCircle size={12} style={{ cursor: 'help', color: 'var(--color-panel-text-secondary)' }} />
          </Tooltip>
        </span>
        <span style={{ fontSize: '11px', color: 'var(--color-panel-text-secondary)', textAlign: 'left' }}>
          {formatNumberCompact(occDetails.occCalls || 0)} time{occDetails.occCalls === 1 ? '' : 's'} in{' '}
          {!occDetails.occTableName ? (
            'an unknown table'
          ) : (
            <>
              table{' '}
              <span style={{ fontWeight: 600 }}>{occDetails.occTableName}</span>
            </>
          )}
        </span>
      </div>
    );
  }

  // Handle bytes read insights
  if (insight.kind === 'bytesReadLimit' || insight.kind === 'bytesReadThreshold') {
    const bytesDetails = insight.details as {
      count: number;
      hourlyCounts: any[];
      recentEvents: any[];
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--color-panel-text)' }}>
          Nearing bytes read limit
          <Tooltip
            content={`This function has been approaching or exceeding the Convex limit on bytes read. When a function exceeds the limit of ${megabytesReadLimit} MB, it will fail.`}
            position="right"
          >
            <HelpCircle size={12} style={{ cursor: 'help', color: 'var(--color-panel-text-secondary)' }} />
          </Tooltip>
        </span>
        <span style={{ fontSize: '11px', color: 'var(--color-panel-text-secondary)' }}>
          {formatNumberCompact(bytesDetails.count || 0)} function call{(bytesDetails.count || 0) === 1 ? '' : 's'}
        </span>
      </div>
    );
  }

  // Handle documents read insights
  if (insight.kind === 'documentsReadLimit' || insight.kind === 'documentsReadThreshold') {
    const docsDetails = insight.details as {
      count: number;
      hourlyCounts: any[];
      recentEvents: any[];
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--color-panel-text)' }}>
          Nearing documents read limit
          <Tooltip
            content={`This function has been approaching or exceeding the Convex limit on documents read. When a function exceeds the limit of ${documentsReadLimit.toLocaleString()} documents, it will fail.`}
            position="right"
          >
            <HelpCircle size={12} style={{ cursor: 'help', color: 'var(--color-panel-text-secondary)' }} />
          </Tooltip>
        </span>
        <span style={{ fontSize: '11px', color: 'var(--color-panel-text-secondary)' }}>
          {formatNumberCompact(docsDetails.count || 0)} function call{(docsDetails.count || 0) === 1 ? '' : 's'}
        </span>
      </div>
    );
  }

  // Fallback
  return (
    <span style={{ fontSize: '12px', color: 'var(--color-panel-text)' }}>
      Unknown issue
    </span>
  );
};
