import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Insight } from '../../../utils/api';
import { Tooltip } from '../../../components/shared/tooltip';
import { ProblemForInsight } from './problem-for-insight';
import { SparklineForInsight } from './sparkline-for-insight';

const severityForInsightKind: Record<Insight['kind'], 'error' | 'warning'> = {
  bytesReadLimit: 'error',
  bytesReadThreshold: 'warning',
  documentsReadLimit: 'error',
  documentsReadThreshold: 'warning',
  occFailedPermanently: 'error',
  occRetried: 'warning',
};

// Helper to format function identifier
function functionIdentifierValue(functionId: string, componentPath?: string | null): string {
  if (componentPath) {
    return `${componentPath}/${functionId}`;
  }
  return functionId;
}

export const InsightsSummaryListItem: React.FC<{ insight: Insight }> = ({ insight }) => {
  const severity = severityForInsightKind[insight.kind];
  const functionName = functionIdentifierValue(insight.functionId, insight.componentPath);

  return (
    <button
      style={{
        display: 'flex',
        width: '100%',
        minWidth: 'fit-content',
        alignItems: 'center',
        gap: '8px',
        borderBottom: '1px solid #2D313A',
        padding: '8px',
        textAlign: 'left',
        background: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderTop: 'none',
        cursor: 'pointer',
        fontSize: '12px',
        color: '#d1d5db',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#1C1F26';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <span style={{ width: '80px', minWidth: '80px' }}>
        {severity === 'error' ? (
          <Tooltip
            text="This insight is a critical problem and should be addressed soon."
            side="left"
          >
            <div
              style={{
                display: 'flex',
                width: 'fit-content',
                gap: '4px',
                alignItems: 'center',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #dc2626',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                color: '#ef4444',
                fontSize: '12px',
              }}
            >
              <X size={14} />
              <span>Critical</span>
            </div>
          </Tooltip>
        ) : (
          <Tooltip
            text="This insight indicates a potential issue and should be investigated."
            side="left"
          >
            <div
              style={{
                display: 'flex',
                width: 'fit-content',
                gap: '4px',
                alignItems: 'center',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                color: '#fbbf24',
                fontSize: '12px',
              }}
            >
              <AlertTriangle size={14} />
              <span>Warning</span>
            </div>
          </Tooltip>
        )}
      </span>
      <div style={{ width: '288px', minWidth: '288px', fontWeight: 600, color: '#e5e7eb' }}>
        {functionName}
      </div>
      <div style={{ width: '240px', minWidth: '240px' }}>
        <ProblemForInsight insight={insight} />
      </div>
      <div style={{ height: '100%', width: '240px', minWidth: '240px', display: 'flex', alignItems: 'center' }}>
        <SparklineForInsight insight={insight} />
      </div>
    </button>
  );
};

