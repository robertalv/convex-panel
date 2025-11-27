import React from 'react';
import { Insight } from '../../../utils/api';

export const ProblemForInsight: React.FC<{ insight: Insight }> = ({ insight }) => {
  const getProblemText = (): string => {
    switch (insight.kind) {
      case 'bytesReadLimit':
        return 'Bytes read limit exceeded';
      case 'bytesReadThreshold':
        return 'Bytes read threshold exceeded';
      case 'documentsReadLimit':
        return 'Documents read limit exceeded';
      case 'documentsReadThreshold':
        return 'Documents read threshold exceeded';
      case 'occFailedPermanently':
        return 'Optimistic concurrency control failed permanently';
      case 'occRetried':
        return 'Optimistic concurrency control retried';
      default:
        return 'Unknown issue';
    }
  };

  return (
    <span style={{ fontSize: '12px', color: '#d1d5db' }}>
      {getProblemText()}
    </span>
  );
};

