import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchFiles } from "../api/files";
import type { FileMetadata } from "../api/types";

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
  addOptimisticFile: (file: FileMetadata) => void;
  removeOptimisticFile: (id: string) => void;
}

export function useFiles({
  adminClient,
  useMockData = false,
  componentId = null,
  onError,
}: UseFilesProps): UseFilesReturn {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [optimisticFiles, setOptimisticFiles] = useState<FileMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [continueCursor, setContinueCursor] = useState<string | undefined>(
    undefined,
  );
  const [hasMore, setHasMore] = useState(true);

  const fetchFilesData = useCallback(
    async (cursor?: string, append = false) => {
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
          setFiles((prev) => [...prev, ...result.page]);
        } else {
          setFiles(result.page);
        }

        setContinueCursor(result.continueCursor);
        setHasMore(!result.isDone);
      } catch (err: any) {
        const errorMessage = err?.message || "Failed to fetch files";
        setError(errorMessage);
        onError?.(errorMessage);
        if (!append) {
          setFiles([]);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [adminClient, useMockData, componentId, onError],
  );

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

  const addOptimisticFile = useCallback((file: FileMetadata) => {
    setOptimisticFiles((prev) => [file, ...prev]);
  }, []);

  const removeOptimisticFile = useCallback((id: string) => {
    setOptimisticFiles((prev) => prev.filter((f) => f._id !== id));
  }, []);

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminClient, useMockData, componentId]);

  // Merge optimistic files with fetched files, removing duplicates by storageId
  const allFiles = useMemo(() => {
    // Create a Set of storage IDs from real fetched files
    const realStorageIds = new Set(
      files.filter((f) => f.storageId).map((f) => f.storageId),
    );

    // Filter out optimistic files that have a matching storageId in real files
    // (this happens after upload completes and refetch brings the real file)
    const uniqueOptimisticFiles = optimisticFiles.filter((optFile) => {
      // If optimistic file has uploadState with success, check if real file exists
      if (optFile.uploadState?.status === "success" && optFile.storageId) {
        return !realStorageIds.has(optFile.storageId);
      }
      // Always keep uploading or error state files
      return true;
    });

    return [...uniqueOptimisticFiles, ...files];
  }, [optimisticFiles, files]);

  return {
    files: allFiles,
    isLoading,
    error,
    refetch,
    hasMore,
    loadMore,
    addOptimisticFile,
    removeOptimisticFile,
  };
}
