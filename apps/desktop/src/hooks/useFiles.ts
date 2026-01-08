import { useState, useEffect, useCallback } from 'react';
import { fetchFiles } from "../utils/api";
import type { FileMetadata } from "../utils/api";

export interface UseFilesProps {
  adminClient: any;
  useMockData?: boolean;
  componentId?: string | null;
  onError?: (error: string) => void;
}

export interface UseFilesReturn {
  files: FileMetadata[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  hasMore: boolean;
  loadMore: () => void;
}

export function useFiles({
  adminClient,
  useMockData = false,
  componentId = null,
  onError,
}: UseFilesProps): UseFilesReturn {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [continueCursor, setContinueCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);

  const fetchFilesData = useCallback(async (cursor?: string, append = false) => {
    if (!adminClient && !useMockData) {
      setFiles([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFiles(adminClient, componentId, useMockData, {
        numItems: 100,
        ...(cursor ? { cursor } : {}),
      });

      if (append) {
        setFiles(prev => [...prev, ...result.page]);
      } else {
        setFiles(result.page);
      }

      setContinueCursor(result.continueCursor);
      setHasMore(!result.isDone);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch files';
      setError(errorMessage);
      onError?.(errorMessage);
      if (!append) {
        setFiles([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [adminClient, useMockData, componentId, onError]);

  const refetch = useCallback(() => {
    setContinueCursor(undefined);
    setHasMore(true);
    fetchFilesData(undefined, false);
  }, [fetchFilesData]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading && continueCursor) {
      fetchFilesData(continueCursor, true);
    }
  }, [hasMore, isLoading, continueCursor, fetchFilesData]);

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminClient, useMockData, componentId]);

  return {
    files,
    isLoading,
    error,
    refetch,
    hasMore,
    loadMore,
  };
}

