import React from 'react';
import { Result } from './result';
import type { FunctionResult } from '../../utils/api/functionExecution';

interface QueryResultProps {
  result?: FunctionResult;
  loading?: boolean;
}

export const QueryResult: React.FC<QueryResultProps> = ({
  result,
  loading,
}) => {
  return (
    <Result
      result={result}
      loading={loading}
    />
  );
};

