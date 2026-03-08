'use client';

import { useCallback, useMemo } from 'react';
import {
  useQuery,
  DocumentNode,
  OperationVariables,
  TypedDocumentNode,
  QueryHookOptions,
} from '@apollo/client';
import type { Connection, Edge } from '@/types/pagination';

interface UseCursorPaginationOptions<TData, TVariables extends OperationVariables>
  extends Omit<QueryHookOptions<TData, TVariables>, 'variables'> {
  variables?: TVariables;
}

interface UseCursorPaginationResult<TNode> {
  /** Flattened array of node items (extracted from edges) */
  items: TNode[];
  /** Whether the initial load is in progress */
  loading: boolean;
  /** Apollo error */
  error: any;
  /** Whether there are more items to load */
  hasNextPage: boolean;
  /** Total count from the server */
  totalCount: number;
  /** Whether a fetchMore is currently loading */
  loadingMore: boolean;
  /** Load the next page of results */
  loadMore: () => void;
  /** Refetch from scratch */
  refetch: () => void;
}

/**
 * Generic hook for cursor-based pagination.
 * Wraps a relay-style connection query with fetchMore support.
 *
 * @param query - The GraphQL DocumentNode (must return a single connection field)
 * @param connectionPath - Dot path to the connection in the query result, e.g. 'productsConnection'
 *
 * Usage:
 * ```ts
 * const { items, hasNextPage, loadMore, loading } = useCursorPagination(
 *   GET_PRODUCTS_CONNECTION,
 *   'productsConnection',
 *   { variables: { input: { first: 20 } } },
 * );
 * ```
 */
export function useCursorPagination<TNode = any>(
  query: DocumentNode | TypedDocumentNode,
  connectionPath: string,
  options?: UseCursorPaginationOptions<any, any>,
): UseCursorPaginationResult<TNode> {
  const { data, loading, error, fetchMore, refetch, networkStatus } = useQuery(
    query,
    {
      ...options,
      notifyOnNetworkStatusChange: true,
    },
  );

  // Extract connection from data using the path
  const connection: Connection<TNode> | undefined = data?.[connectionPath];

  const pageInfo = connection?.pageInfo;
  const hasNextPage = pageInfo?.hasNextPage ?? false;
  const totalCount = pageInfo?.totalCount ?? 0;
  const endCursor = pageInfo?.endCursor ?? null;

  // networkStatus 3 = fetchMore in progress
  const loadingMore = networkStatus === 3;

  const items = useMemo(
    () => (connection?.edges ?? []).map((edge: Edge<TNode>) => edge.node),
    [connection?.edges],
  );

  const loadMore = useCallback(() => {
    if (!hasNextPage || loadingMore || !endCursor) return;

    fetchMore({
      variables: {
        input: {
          ...((options?.variables as any)?.input ?? {}),
          after: endCursor,
        },
      },
    });
  }, [fetchMore, hasNextPage, loadingMore, endCursor, options?.variables]);

  const handleRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    items,
    loading: loading && !loadingMore,
    error,
    hasNextPage,
    totalCount,
    loadingMore,
    loadMore,
    refetch: handleRefetch,
  };
}
