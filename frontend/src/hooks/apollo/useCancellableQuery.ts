'use client';

import { useCallback, useRef, useEffect } from 'react';
import {
  useApolloClient,
  DocumentNode,
  OperationVariables,
  TypedDocumentNode,
  ApolloQueryResult,
} from '@apollo/client';

/**
 * Hook for manually cancellable GraphQL queries.
 *
 * Useful when the caller needs explicit control over cancellation,
 * e.g. search-as-you-type where each keystroke should cancel the
 * previous in-flight request.
 *
 * Usage:
 * ```tsx
 * const { fetch, cancel } = useCancellableQuery(SEARCH_PRODUCTS);
 *
 * const onSearch = (term: string) => {
 *   cancel();                              // cancel previous request
 *   fetch({ variables: { term } });        // start new one
 * };
 * ```
 */
export function useCancellableQuery<
  TData = any,
  TVariables extends OperationVariables = OperationVariables,
>(query: DocumentNode | TypedDocumentNode<TData, TVariables>) {
  const client = useApolloClient();
  const controllerRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  const fetch = useCallback(
    (options?: { variables?: TVariables }): Promise<ApolloQueryResult<TData>> => {
      // Abort any pending request
      controllerRef.current?.abort();

      const controller = new AbortController();
      controllerRef.current = controller;

      return client.query<TData, TVariables>({
        query,
        variables: options?.variables as TVariables,
        fetchPolicy: 'network-only',
        context: { fetchOptions: { signal: controller.signal } },
      });
    },
    [client, query],
  );

  // Clean up on unmount
  useEffect(() => cancel, [cancel]);

  return { fetch, cancel };
}
