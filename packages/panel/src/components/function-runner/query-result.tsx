import React from 'react';
import { Result } from './result';
import { FunctionResult } from '../../utils/functionExecution';

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
  return (
    <Result
      result={result}
      loading={loading}
      lastRequestTiming={lastRequestTiming}
    />
  );
};

