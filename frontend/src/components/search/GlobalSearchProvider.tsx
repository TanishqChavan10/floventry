'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
  GlobalSearchContext,
  type GlobalSearchContextValue,
  type GlobalSearchDocumentType,
  type GlobalSearchResultsData,
} from '@/hooks/useGlobalSearch';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  useGlobalSearchQuery,
  useGrnForRedirect,
  useIssueForRedirect,
  useTransferForRedirect,
  useProductByBarcode,
} from '@/hooks/apollo';
import { GlobalSearchModal } from './GlobalSearchModal';
import { CreateWarehouseDialog } from '@/components/warehouses/CreateWarehouseDialog';
import { useLoadingContext } from '@/context/loading-context';
import { usePlanTier } from '@/hooks/usePlanTier';

const EMPTY_RESULTS: GlobalSearchResultsData = {
  products: [],
  warehouses: [],
  documents: [],
  suppliers: [],
  categories: [],
  purchaseOrders: [],
  salesOrders: [],
};

function isAbortLikeError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const anyErr = error as any;
  const name = String(anyErr?.name || '');
  const message = String(anyErr?.message || '');
  return name === 'AbortError' || /aborted|abort/i.test(message);
}

export function GlobalSearchProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const companySlug = params?.slug as string | undefined;

  const { plan: planTier, loading: planLoading } = usePlanTier();

  // Lazy query hooks for search & redirects
  const [searchQuery] = useGlobalSearchQuery();
  const [lookupBarcode] = useProductByBarcode();
  const [fetchGrn] = useGrnForRedirect();
  const [fetchIssue] = useIssueForRedirect();
  const [fetchTransfer] = useTransferForRedirect();

  const companyPlan = companySlug && !planLoading ? planTier : null;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GlobalSearchResultsData>(EMPTY_RESULTS);

  const { _increment, _decrement } = useLoadingContext();
  // Tracks whether the global counter has been incremented for the current in-flight search.
  const searchInFlightRef = useRef(false);

  const startSearchLoading = useCallback(() => {
    if (!searchInFlightRef.current) {
      searchInFlightRef.current = true;
      _increment();
    }
    setLoading(true);
  }, [_increment]);

  const stopSearchLoading = useCallback(() => {
    if (searchInFlightRef.current) {
      searchInFlightRef.current = false;
      _decrement();
    }
    setLoading(false);
  }, [_decrement]);

  const [activeIndex, setActiveIndex] = useState(0);

  const [createWarehouseOpen, setCreateWarehouseOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const resultsRef = useRef<GlobalSearchResultsData>(results);
  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  const openPalette = useCallback(() => {
    setOpen(true);
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key?.toLowerCase?.() ?? '';
      if ((e.ctrlKey || e.metaKey) && key === 'k') {
        e.preventDefault();
        setOpen(true);
        return;
      }

      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Reset state when closing.
  useEffect(() => {
    if (open) return;
    abortRef.current?.abort();
    abortRef.current = null;
    setQuery('');
    stopSearchLoading();
    setError(null);
    setResults(EMPTY_RESULTS);
    setActiveIndex(0);
  }, [open]);

  // Execute global search with debounce + cancellation.
  useEffect(() => {
    if (!open) return;

    const q = debouncedQuery.trim();

    if (q.length < 2) {
      abortRef.current?.abort();
      abortRef.current = null;
      stopSearchLoading();
      setError(null);
      setResults(EMPTY_RESULTS);
      setActiveIndex(0);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let disposed = false;
    startSearchLoading();
    setError(null);

    searchQuery({
      variables: { query: q },
      fetchPolicy: 'no-cache',
      context: {
        fetchOptions: {
          signal: controller.signal,
        },
      },
    })
      .then((res) => {
        if (disposed) return;
        setResults(res.data?.globalSearch ?? EMPTY_RESULTS);
        setActiveIndex(0);
      })
      .catch((err) => {
        if (disposed) return;
        if (isAbortLikeError(err)) return;
        setError(err?.message ?? 'Search failed');
        setResults(EMPTY_RESULTS);
        setActiveIndex(0);
      })
      .finally(() => {
        if (disposed) return;
        stopSearchLoading();
      });

    return () => {
      disposed = true;
      controller.abort();
      stopSearchLoading();
    };
  }, [searchQuery, debouncedQuery, open, startSearchLoading, stopSearchLoading]);

  const navigateToResult: GlobalSearchContextValue['navigateToResult'] = useCallback(
    async (item) => {
      if (item.kind === 'action') {
        setOpen(false);

        if (item.id === 'create-company') {
          router.push('/onboarding/create-company');
          return;
        }

        if (item.id === 'create-warehouse') {
          if (!companySlug) return;
          setCreateWarehouseOpen(true);
          return;
        }

        if (item.id === 'scan-barcode') {
          if (!companySlug) return;

          // Normalize scanner noise (whitespace/newlines/control chars)
          const normalized = String(query || '')
            .replace(/[\x00-\x1F\x7F]/g, '')
            .replace(/\s+/g, '')
            .trim();

          if (!normalized) return;

          try {
            const res = await lookupBarcode({
              variables: { barcode: normalized },
              fetchPolicy: 'no-cache',
            });

            const productId = res.data?.productByBarcode?.id as string | undefined;
            if (!productId) {
              toast.error('No product found for barcode');
              return;
            }

            router.push(
              `/${companySlug}/catalog/products?productId=${encodeURIComponent(productId)}`,
            );
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Barcode lookup failed';
            toast.error(message);
          }

          return;
        }

        return;
      }

      if (!companySlug) return;

      // Close first to keep navigation snappy.
      setOpen(false);

      if (item.kind === 'product') {
        router.push(`/${companySlug}/catalog/products?productId=${encodeURIComponent(item.id)}`);
        return;
      }

      if (item.kind === 'warehouse') {
        const wh = resultsRef.current.warehouses.find((w) => w.id === item.id);
        const slug = wh?.slug ?? null;
        if (!slug) return;

        const archived = wh?.status && String(wh.status).toLowerCase() !== 'active';
        router.push(
          `/${companySlug}/warehouses/${encodeURIComponent(slug)}${archived ? '?archived=1' : ''}`,
        );
        return;
      }

      if (item.kind === 'supplier') {
        router.push(`/${companySlug}/suppliers`);
        return;
      }

      if (item.kind === 'category') {
        router.push(`/${companySlug}/catalog/categories`);
        return;
      }

      if (item.kind === 'purchaseOrder') {
        router.push(`/${companySlug}/purchase-orders`);
        return;
      }

      if (item.kind === 'salesOrder') {
        router.push(`/${companySlug}/sales/orders/${encodeURIComponent(item.id)}`);
        return;
      }

      if (item.kind === 'document') {
        const type = item.type;
        if (!type) return;

        try {
          if (type === 'GRN') {
            const res = await fetchGrn({
              variables: { id: item.id },
              fetchPolicy: 'no-cache',
            });
            const whSlug = res.data?.grn?.warehouse?.slug;
            const whStatus = res.data?.grn?.warehouse?.status;
            if (!whSlug) return;

            const archived = whStatus && String(whStatus).toLowerCase() !== 'active';
            router.push(
              `/${companySlug}/warehouses/${encodeURIComponent(whSlug)}/inventory/grn/${encodeURIComponent(item.id)}${
                archived ? '?archived=1' : ''
              }`,
            );
            return;
          }

          if (type === 'ISSUE') {
            const res = await fetchIssue({
              variables: { id: item.id },
              fetchPolicy: 'no-cache',
            });
            const whSlug = res.data?.issueNote?.warehouse?.slug;
            const whStatus = res.data?.issueNote?.warehouse?.status;
            if (!whSlug) return;

            const archived = whStatus && String(whStatus).toLowerCase() !== 'active';
            router.push(
              `/${companySlug}/warehouses/${encodeURIComponent(whSlug)}/issues/${encodeURIComponent(item.id)}${
                archived ? '?archived=1' : ''
              }`,
            );
            return;
          }

          if (type === 'TRANSFER') {
            const res = await fetchTransfer({
              variables: { id: item.id },
              fetchPolicy: 'no-cache',
            });

            const source = res.data?.warehouseTransfer?.source_warehouse;
            const dest = res.data?.warehouseTransfer?.destination_warehouse;
            const whSlug = source?.slug ?? dest?.slug;
            const whStatus = source?.status ?? dest?.status;

            if (!whSlug) return;
            const archived = whStatus && String(whStatus).toLowerCase() !== 'active';

            router.push(
              `/${companySlug}/warehouses/${encodeURIComponent(whSlug)}/inventory/transfers/${encodeURIComponent(item.id)}${
                archived ? '?archived=1' : ''
              }`,
            );
          }
        } catch (err) {
          // Navigation is best-effort; the modal is already closed.
          // If needed we can surface this via toast later.
          return;
        }
      }
    },
    [lookupBarcode, fetchGrn, fetchIssue, fetchTransfer, companySlug, router],
  );

  const value: GlobalSearchContextValue = useMemo(
    () => ({
      companyPlan,

      open,
      setOpen,

      query,
      setQuery,

      loading,
      error,
      results,

      activeIndex,
      setActiveIndex,

      openPalette,
      closePalette,
      navigateToResult,
    }),
    [
      companyPlan,
      activeIndex,
      closePalette,
      error,
      loading,
      navigateToResult,
      open,
      openPalette,
      query,
      results,
    ],
  );

  return (
    <GlobalSearchContext.Provider value={value}>
      {children}
      <GlobalSearchModal />
      {companySlug && (
        <CreateWarehouseDialog
          open={createWarehouseOpen}
          onOpenChange={setCreateWarehouseOpen}
          companySlug={companySlug}
        />
      )}
    </GlobalSearchContext.Provider>
  );
}
