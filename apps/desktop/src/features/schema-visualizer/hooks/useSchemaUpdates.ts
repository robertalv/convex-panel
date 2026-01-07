/**
 * useSchemaUpdates Hook
 *
 * Subscribes to real-time schema update notifications via SSE.
 * Notifies when schema.ts files are modified on GitHub.
 *
 * IMPORTANT: This hook includes protections against:
 * - SSE connection race conditions
 * - Stale callback execution
 * - State updates on unmounted components
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useGitHubOptional } from "../../../contexts/GitHubContext";
import {
  getSSEClient,
  destroySSEClient,
  type SSEConnectionState,
} from "../../../services/github/sse";
import type {
  SchemaUpdateEvent,
  GitHubRepo,
} from "../../../services/github/types";

export interface SchemaUpdate {
  id: string;
  repo: string;
  branch: string;
  file: string;
  commitId: string;
  commitMessage: string;
  author: string;
  timestamp: Date;
  seen: boolean;
}

export interface UseSchemaUpdatesOptions {
  /** Repositories to subscribe to (defaults to selected repo from context) */
  repos?: GitHubRepo[];
  /** Whether to automatically connect when authenticated */
  autoConnect?: boolean;
  /** Callback when a new update is received */
  onUpdate?: (update: SchemaUpdate) => void;
  /** Maximum number of updates to keep in history */
  maxUpdates?: number;
}

export interface UseSchemaUpdatesReturn {
  /** Connection state */
  connectionState: SSEConnectionState;
  /** Recent schema updates */
  updates: SchemaUpdate[];
  /** Number of unseen updates */
  unseenCount: number;
  /** Connect to SSE endpoint */
  connect: () => void;
  /** Disconnect from SSE endpoint */
  disconnect: () => void;
  /** Mark all updates as seen */
  markAllSeen: () => void;
  /** Mark a specific update as seen */
  markSeen: (updateId: string) => void;
  /** Clear all updates */
  clearUpdates: () => void;
  /** Whether connected and receiving updates */
  isConnected: boolean;
  /** Error message if any */
  error: string | null;
}

/**
 * Hook to subscribe to real-time schema updates
 */
export function useSchemaUpdates({
  repos,
  autoConnect = true,
  onUpdate,
  maxUpdates = 50,
}: UseSchemaUpdatesOptions = {}): UseSchemaUpdatesReturn {
  // Use optional hook to gracefully handle missing provider
  const github = useGitHubOptional();
  const isAuthenticated = github?.isAuthenticated ?? false;
  const selectedRepo = github?.selectedRepo ?? null;
  const hasConvexProject = github?.hasConvexProject ?? false;

  const [connectionState, setConnectionState] =
    useState<SSEConnectionState>("disconnected");
  const [updates, setUpdates] = useState<SchemaUpdate[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Refs for preventing stale updates
  const onUpdateRef = useRef(onUpdate);
  const isMountedRef = useRef(true);
  const connectionIdRef = useRef(0);

  // Update the callback ref
  onUpdateRef.current = onUpdate;

  // Compute repos to subscribe to - requires a project folder
  const subscribeRepos =
    hasConvexProject && repos?.length
      ? repos.map((r) => r.full_name)
      : hasConvexProject && selectedRepo
        ? [selectedRepo.full_name]
        : [];

  const isConnected = connectionState === "connected";

  // Track the current repo ID to detect changes
  const currentRepoIdRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Handle incoming schema update
   */
  const handleSchemaUpdate = useCallback(
    (event: SchemaUpdateEvent, validConnectionId: number) => {
      // Ignore if this callback is from a stale connection
      if (connectionIdRef.current !== validConnectionId) {
        return;
      }

      if (!isMountedRef.current) {
        return;
      }

      const update: SchemaUpdate = {
        id: `${event.commit.id}-${Date.now()}`,
        repo: event.repo,
        branch: event.branch,
        file: event.file,
        commitId: event.commit.id,
        commitMessage: event.commit.message,
        author: event.commit.author,
        timestamp: new Date(event.timestamp),
        seen: false,
      };

      setUpdates((prev) => {
        const next = [update, ...prev];
        // Keep only maxUpdates
        if (next.length > maxUpdates) {
          return next.slice(0, maxUpdates);
        }
        return next;
      });

      // Call external callback
      onUpdateRef.current?.(update);
    },
    [maxUpdates],
  );

  /**
   * Connect to SSE endpoint
   */
  const connect = useCallback(() => {
    // Require project folder for GitHub features
    if (!hasConvexProject) {
      setError("Connect a project folder to enable real-time updates");
      return;
    }

    if (subscribeRepos.length === 0) {
      setError("No repositories to subscribe to");
      return;
    }

    // Increment connection ID to invalidate any previous connection's callbacks
    connectionIdRef.current += 1;
    const thisConnectionId = connectionIdRef.current;

    setError(null);

    const client = getSSEClient({
      onStateChange: (state) => {
        // Only update if this is still the current connection
        if (
          connectionIdRef.current === thisConnectionId &&
          isMountedRef.current
        ) {
          setConnectionState(state);
        }
      },
      onSchemaUpdate: (event) => {
        handleSchemaUpdate(event, thisConnectionId);
      },
      onError: (e) => {
        if (
          connectionIdRef.current === thisConnectionId &&
          isMountedRef.current
        ) {
          setError(e.message);
        }
      },
      onHeartbeat: () => {
        // Reset error on successful heartbeat
        if (
          connectionIdRef.current === thisConnectionId &&
          isMountedRef.current
        ) {
          setError(null);
        }
      },
    });

    client.connect(subscribeRepos);
  }, [subscribeRepos, handleSchemaUpdate, hasConvexProject]);

  /**
   * Disconnect from SSE endpoint
   */
  const disconnect = useCallback(() => {
    // Invalidate current connection
    connectionIdRef.current += 1;
    destroySSEClient();
    setConnectionState("disconnected");
  }, []);

  /**
   * Mark all updates as seen
   */
  const markAllSeen = useCallback(() => {
    setUpdates((prev) => prev.map((u) => ({ ...u, seen: true })));
  }, []);

  /**
   * Mark a specific update as seen
   */
  const markSeen = useCallback((updateId: string) => {
    setUpdates((prev) =>
      prev.map((u) => (u.id === updateId ? { ...u, seen: true } : u)),
    );
  }, []);

  /**
   * Clear all updates
   */
  const clearUpdates = useCallback(() => {
    setUpdates([]);
  }, []);

  // Calculate unseen count
  const unseenCount = updates.filter((u) => !u.seen).length;

  // Clear updates when repo changes
  useEffect(() => {
    const newRepoId = selectedRepo?.id ?? null;

    if (currentRepoIdRef.current !== newRepoId) {
      currentRepoIdRef.current = newRepoId;

      // Clear updates for new repo
      setUpdates([]);
      setError(null);
    }
  }, [selectedRepo?.id]);

  // Auto-connect when authenticated and repos available
  useEffect(() => {
    if (
      autoConnect &&
      isAuthenticated &&
      hasConvexProject &&
      subscribeRepos.length > 0
    ) {
      connect();
    }

    return () => {
      disconnect();
    };
    // Note: Using join for stable comparison of repo list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    autoConnect,
    isAuthenticated,
    hasConvexProject,
    subscribeRepos.join(","),
  ]);

  // Update subscription when repos change (while connected)
  useEffect(() => {
    if (isConnected && subscribeRepos.length > 0) {
      const client = getSSEClient();
      client.updateRepos(subscribeRepos);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribeRepos.join(",")]);

  return {
    connectionState,
    updates,
    unseenCount,
    connect,
    disconnect,
    markAllSeen,
    markSeen,
    clearUpdates,
    isConnected,
    error,
  };
}

export default useSchemaUpdates;
