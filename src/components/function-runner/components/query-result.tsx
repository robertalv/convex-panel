import React from 'react';
import { Result } from './result';
import { FunctionResult } from '../../../utils/functionExecution';

interface QueryResultProps {
  result?: FunctionResult;
  loading?: boolean;
  lastRequestTiming?: {
    startedAt: number;
    endedAt: number;
  };
}

export const QueryResult: React.FC<QueryResultProps> = ({
  result,
  loading,
  lastRequestTiming,
}) => {
  // QueryResult now just displays the result passed to it
  // It no longer auto-runs queries
  return (
    <Result
      result={result}
      loading={loading}
      lastRequestTiming={lastRequestTiming}
    />
  );
};

