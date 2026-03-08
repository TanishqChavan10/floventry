import { useEffect, useRef, useCallback } from 'react';
import { useApolloClient, OperationVariables, DocumentNode, TypedDocumentNode } from '@apollo/client';

interface BackgroundSyncOptions<TData, TVariables extends OperationVariables> {
  /** The query to periodically refetch. */
  query: DocumentNode | TypedDocumentNode<TData, TVariables>;
  /** Variables for the query. */
  variables?: TVariables;
  /** Interval in milliseconds (default: 60 000 — 1 minute). */
  intervalMs?: number;
  /** Whether the sync is enabled (default: true). */
  enabled?: boolean;
}

/**
 * Periodically refetch a query in the background to keep cached data fresh.
 * The refetch runs silently — errors are logged but do not surface to the UI.
 *
 * Pauses automatically when the tab is hidden (Page Visibility API).
 */
export function useBackgroundSync<
  TData = unknown,
  TVariables extends OperationVariables = OperationVariables,
>({ query, variables, intervalMs = 60_000, enabled = true }: BackgroundSyncOptions<TData, TVariables>) {
  const client = useApolloClient();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sync = useCallback(async () => {
    try {
      await client.query({ query, variables, fetchPolicy: 'network-only' });
    } catch (err) {
      console.warn('[BackgroundSync] Silent refetch failed:', err);
    }
  }, [client, query, variables]);

  useEffect(() => {
    if (!enabled) return;

    const start = () => {
      intervalRef.current = setInterval(sync, intervalMs);
    };
    const stop = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        // Sync immediately on re-focus, then resume interval
        sync();
        start();
      }
    };

    start();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [sync, intervalMs, enabled]);

  /** Manually trigger an immediate sync. */
  return { syncNow: sync };
}
