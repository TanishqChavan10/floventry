import { NetworkStatus } from '@apollo/client';

/**
 * Human-readable labels for Apollo NetworkStatus values.
 * Useful for distinguishing initial load from refetch/fetchMore/polling.
 */
export const NETWORK_STATUS_LABELS: Record<NetworkStatus, string> = {
  [NetworkStatus.loading]: 'loading',
  [NetworkStatus.setVariables]: 'setVariables',
  [NetworkStatus.fetchMore]: 'fetchMore',
  [NetworkStatus.refetch]: 'refetch',
  [NetworkStatus.poll]: 'polling',
  [NetworkStatus.ready]: 'ready',
  [NetworkStatus.error]: 'error',
};

/**
 * Derive a UI-friendly loading state from an Apollo NetworkStatus value.
 */
export function getLoadingState(networkStatus: NetworkStatus) {
  return {
    /** True only on the very first load (no cached data yet). */
    isInitialLoading: networkStatus === NetworkStatus.loading,
    /** True when fetchMore is in flight (e.g. infinite scroll). */
    isFetchingMore: networkStatus === NetworkStatus.fetchMore,
    /** True during an explicit refetch. */
    isRefetching: networkStatus === NetworkStatus.refetch,
    /** True during background poll. */
    isPolling: networkStatus === NetworkStatus.poll,
    /** True for any in-flight state. */
    isAnyLoading: networkStatus < NetworkStatus.ready,
    /** Human-readable label. */
    label: NETWORK_STATUS_LABELS[networkStatus] ?? 'unknown',
  };
}
