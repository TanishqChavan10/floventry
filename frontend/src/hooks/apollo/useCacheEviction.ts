'use client';

import { useCallback } from 'react';
import { useApolloClient } from '@apollo/client';
import { clearPersistedCache } from '@/lib/apollo/client';

/** Root Query fields that hold company-scoped data. */
const COMPANY_SCOPED_FIELDS = [
  'products',
  'productsConnection',
  'purchaseOrders',
  'purchaseOrdersConnection',
  'stockMovements',
  'stockMovementsConnection',
  'companyStockMovements',
  'notifications',
  'notificationsConnection',
  'unreadNotificationCount',
  'warehouses',
  'stockByWarehouse',
  'salesOrders',
  'issueNotesByCompany',
  'issueNotesByWarehouse',
  'auditLogsConnection',
  'companyDashboard',
  'companyBySlug',
  'companySettings',
  'lowStockProducts',
  'expiryReport',
] as const;

/**
 * Hook for cache eviction strategies.
 *
 * General:
 * - `evictAll()` — Resets the in-memory cache
 * - `evictEntity(typename, id)` — Evicts a single normalized entity
 * - `evictConnection(fieldName)` — Evicts a specific root Query field
 * - `gc()` — Runs garbage collection
 *
 * Multi-tenant:
 * - `clearCompanyCache()` — Evicts all company-scoped Query fields
 * - `evictInventoryCache()` — Evicts inventory-related fields
 * - `evictNotificationCache()` — Evicts notification-related fields
 * - `resetForCompanySwitch()` — Full reset: clears store, refetches active queries, wipes persisted cache
 * - `resetForLogout()` — Full reset: clears store + persisted cache (no refetch)
 */
export function useCacheEviction() {
  const client = useApolloClient();

  /** Clear the entire Apollo cache (in-memory only). */
  const evictAll = useCallback(() => {
    client.cache.reset();
  }, [client]);

  /** Evict a specific normalized entity from the cache. */
  const evictEntity = useCallback(
    (typename: string, id: string) => {
      client.cache.evict({ id: `${typename}:${id}` });
      client.cache.gc();
    },
    [client],
  );

  /** Evict a root Query field (e.g., a connection or list query). */
  const evictConnection = useCallback(
    (fieldName: string) => {
      client.cache.evict({ fieldName });
      client.cache.gc();
    },
    [client],
  );

  /** Run garbage collection to clean up orphaned references. */
  const gc = useCallback(() => {
    client.cache.gc();
  }, [client]);

  // ── Multi-tenant helpers ──

  /** Evict all company-scoped Query fields (targeted, not a full reset). */
  const clearCompanyCache = useCallback(() => {
    for (const field of COMPANY_SCOPED_FIELDS) {
      client.cache.evict({ fieldName: field });
    }
    client.cache.gc();
  }, [client]);

  /** Evict inventory-related cache entries. */
  const evictInventoryCache = useCallback(() => {
    for (const field of [
      'products',
      'productsConnection',
      'stockMovements',
      'stockMovementsConnection',
      'companyStockMovements',
      'stockByWarehouse',
      'lowStockProducts',
    ]) {
      client.cache.evict({ fieldName: field });
    }
    client.cache.gc();
  }, [client]);

  /** Evict notification-related cache entries. */
  const evictNotificationCache = useCallback(() => {
    for (const field of [
      'notifications',
      'notificationsConnection',
      'unreadNotificationCount',
    ]) {
      client.cache.evict({ fieldName: field });
    }
    client.cache.gc();
  }, [client]);

  /**
   * Full reset for company switching.
   * Clears in-memory cache, wipes persisted cache, and refetches all active queries.
   */
  const resetForCompanySwitch = useCallback(async () => {
    clearPersistedCache();
    await client.resetStore();
  }, [client]);

  /**
   * Full reset for logout.
   * Clears in-memory cache and wipes persisted cache. Does NOT refetch.
   */
  const resetForLogout = useCallback(async () => {
    clearPersistedCache();
    await client.clearStore();
  }, [client]);

  return {
    evictAll,
    evictEntity,
    evictConnection,
    gc,
    clearCompanyCache,
    evictInventoryCache,
    evictNotificationCache,
    resetForCompanySwitch,
    resetForLogout,
  };
}
