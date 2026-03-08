'use client';

import { useCallback, useRef, useEffect } from 'react';

interface UseInfiniteScrollOptions {
  /** Whether there are more pages to load */
  hasNextPage: boolean;
  /** Whether a fetch is currently in progress */
  loading: boolean;
  /** Callback to load the next page */
  onLoadMore: () => void;
  /** Root margin for IntersectionObserver (default: '200px') */
  rootMargin?: string;
  /** Threshold for IntersectionObserver (default: 0) */
  threshold?: number;
}

/**
 * Attaches an IntersectionObserver to a sentinel element.
 * When the sentinel becomes visible, triggers `onLoadMore` if there are more pages.
 *
 * Usage:
 * ```tsx
 * const sentinelRef = useInfiniteScroll({ hasNextPage, loading, onLoadMore });
 * return <div ref={sentinelRef} />;
 * ```
 */
export function useInfiniteScroll({
  hasNextPage,
  loading,
  onLoadMore,
  rootMargin = '200px',
  threshold = 0,
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      // Disconnect previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!node || !hasNextPage || loading) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && hasNextPage && !loading) {
            onLoadMore();
          }
        },
        { rootMargin, threshold },
      );

      observerRef.current.observe(node);
    },
    [hasNextPage, loading, onLoadMore, rootMargin, threshold],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return sentinelRef;
}
