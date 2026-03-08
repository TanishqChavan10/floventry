'use client';

import { useCallback, useRef } from 'react';
import {
  useApolloClient,
  DocumentNode,
  OperationVariables,
  TypedDocumentNode,
} from '@apollo/client';

interface PrefetchOptions {
  /**
   * Time-to-live in milliseconds. After this duration the prefetch is
   * considered stale and will fire again on the next trigger.
   * Default: no expiration (prefetch fires once).
   */
  ttl?: number;
  /**
   * Delay in ms before the prefetch actually fires.
   * Useful for hover-intent: if the user moves away before the delay,
   * the returned `cancel` function prevents the request.
   * Default: 0 (immediate).
   */
  delay?: number;
}

/**
 * Hook that prefetches a GraphQL query into the Apollo cache.
 * Useful for preloading data on hover or route anticipation.
 *
 * Returns `{ trigger, cancel }`.
 * - `trigger()` — starts the prefetch (respects `delay` and `ttl`).
 * - `cancel()` — cancels a pending delayed prefetch.
 *
 * Usage:
 * ```tsx
 * const { trigger, cancel } = usePrefetch(GET_PRODUCT, { id: 'abc' }, { delay: 100, ttl: 30_000 });
 * <Link onMouseEnter={trigger} onMouseLeave={cancel}>Product</Link>
 * ```
 */
export function usePrefetch<TData = any, TVariables extends OperationVariables = OperationVariables>(
  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
  variables?: TVariables,
  options: PrefetchOptions = {},
) {
  const { ttl, delay = 0 } = options;
  const client = useApolloClient();
  const lastFetchedAt = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const execute = useCallback(() => {
    const now = Date.now();
    if (ttl && now - lastFetchedAt.current < ttl) return;
    if (!ttl && lastFetchedAt.current > 0) return;

    lastFetchedAt.current = now;
    client.query({ query, variables, fetchPolicy: 'cache-first' });
  }, [client, query, variables, ttl]);

  const trigger = useCallback(() => {
    if (delay > 0) {
      timerRef.current = setTimeout(execute, delay);
    } else {
      execute();
    }
  }, [execute, delay]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return { trigger, cancel };
}
