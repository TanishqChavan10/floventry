import { useQuery, useMutation } from '@apollo/client';
import {
  GET_WAREHOUSE_STOCK,
  CREATE_OPENING_STOCK,
  GET_STOCK_MOVEMENTS,
  ADJUST_STOCK,
  UPDATE_STOCK_LEVELS,
  GET_COMPANY_INVENTORY_SUMMARY,
  GET_STOCK_BY_PRODUCT,
  GET_COMPANY_STOCK_MOVEMENTS,
  GET_INVENTORY_HEALTH_STATS,
  GET_TOP_STOCK_PRODUCTS,
  GET_CRITICAL_STOCK_PRODUCTS,
  GET_WAREHOUSE_STOCK_DISTRIBUTION,
  GET_WAREHOUSE_HEALTH_SCORECARD,
  GET_MOVEMENT_TRENDS,
  GET_MOVEMENT_TYPE_BREAKDOWN,
  GET_ADJUSTMENT_TRENDS,
  GET_ADJUSTMENTS_BY_WAREHOUSE,
  GET_ADJUSTMENTS_BY_USER,
  GET_COMPANY_STOCK_HEALTH_OVERVIEW,
  GET_STOCK_MOVEMENTS_CONNECTION,
} from '@/lib/graphql';
import {
  CREATE_INVENTORY_ADJUSTMENT,
  GET_STOCK_MOVEMENTS_BY_WAREHOUSE,
} from '@/lib/graphql/adjustments';
import {
  GET_LOW_STOCK_ITEMS,
  UPDATE_STOCK_THRESHOLDS,
} from '@/lib/graphql/low-stock';
import {
  GET_WAREHOUSE_STOCK_HEALTH,
  GET_COMPANY_STOCK_HEALTH,
} from '@/lib/graphql/stock-health';
import {
  GET_STOCK_BY_WAREHOUSE,
  CREATE_STOCK,
  GET_STOCK,
  GET_STOCK_LOTS,
} from '@/lib/graphql/stock';
import {
  GET_EXPIRY_SCAN_STATUS,
  TRIGGER_EXPIRY_SCAN,
} from '@/lib/graphql/expiry-scanner';
import { useCursorPagination } from './useCursorPagination';
import type { CursorPaginationInput } from '@/types/pagination';

// ── Warehouse Stock ──

export function useWarehouseStock(warehouseId: string) {
  return useQuery(GET_WAREHOUSE_STOCK, {
    variables: { warehouseId },
    skip: !warehouseId,
    fetchPolicy: 'cache-and-network',
  });
}

export function useStockByWarehouse(warehouseId: string) {
  return useQuery(GET_STOCK_BY_WAREHOUSE, {
    variables: { warehouseId },
    skip: !warehouseId,
    fetchPolicy: 'cache-and-network',
  });
}

export function useStock(productId: string, warehouseId: string) {
  return useQuery(GET_STOCK, {
    variables: { productId, warehouseId },
    skip: !productId || !warehouseId,
  });
}

export function useStockByProduct(productId: string) {
  return useQuery(GET_STOCK_BY_PRODUCT, {
    variables: { productId },
    skip: !productId,
  });
}

export function useCreateOpeningStock() {
  return useMutation(CREATE_OPENING_STOCK, {
    update(cache) {
      // New stock affects health/analytics caches
      cache.modify({
        fields: {
          lowStockItems(_, { DELETE }) { return DELETE; },
          inventoryHealthStats(_, { DELETE }) { return DELETE; },
        },
      });
    },
  });
}

export function useCreateStock() {
  return useMutation(CREATE_STOCK, {
    update(cache) {
      cache.modify({
        fields: {
          lowStockItems(_, { DELETE }) { return DELETE; },
          inventoryHealthStats(_, { DELETE }) { return DELETE; },
        },
      });
    },
  });
}

export function useStockLots(productId: string, warehouseId: string) {
  return useQuery(GET_STOCK_LOTS, {
    variables: { productId, warehouseId },
    skip: !productId || !warehouseId,
  });
}

// ── Stock Movements ──

export function useStockMovements(variables: { warehouseId: string; filters: any }) {
  return useQuery(GET_STOCK_MOVEMENTS, {
    variables,
    skip: !variables.warehouseId,
    fetchPolicy: 'cache-and-network',
  });
}

export function useStockMovementsByWarehouse(variables: { warehouseId: string; filters: any }) {
  return useQuery(GET_STOCK_MOVEMENTS_BY_WAREHOUSE, {
    variables,
    skip: !variables.warehouseId,
    fetchPolicy: 'cache-and-network',
  });
}

export function useCompanyStockMovements(variables: { filters: any }) {
  return useQuery(GET_COMPANY_STOCK_MOVEMENTS, {
    variables,
    fetchPolicy: 'cache-and-network',
  });
}

export function useStockMovementsConnection(input?: CursorPaginationInput) {
  return useCursorPagination(
    GET_STOCK_MOVEMENTS_CONNECTION,
    'stockMovementsConnection',
    { variables: { input: input ?? { first: 20 } }, fetchPolicy: 'cache-and-network' },
  );
}

// ── Adjustments ──

export function useAdjustStock() {
  return useMutation(ADJUST_STOCK, {
    update(cache, { data }) {
      if (!data?.adjustStock) return;
      const stock = data.adjustStock;
      // Evict health/analytics caches so they refetch fresh data
      cache.modify({
        fields: {
          lowStockItems(_, { DELETE }) { return DELETE; },
          inventoryHealthStats(_, { DELETE }) { return DELETE; },
          companyStockHealthOverview(_, { DELETE }) { return DELETE; },
        },
      });
      // The returned stock object will auto-merge into cache by id
    },
  });
}

export function useCreateInventoryAdjustment() {
  return useMutation(CREATE_INVENTORY_ADJUSTMENT, {
    update(cache, { data }) {
      if (!data?.createInventoryAdjustment?.success) return;
      // Evict movement and health caches to refetch fresh data
      cache.modify({
        fields: {
          stockMovements(_, { DELETE }) { return DELETE; },
          stockByWarehouse(_, { DELETE }) { return DELETE; },
          allStock(_, { DELETE }) { return DELETE; },
          lowStockItems(_, { DELETE }) { return DELETE; },
          inventoryHealthStats(_, { DELETE }) { return DELETE; },
          companyStockHealthOverview(_, { DELETE }) { return DELETE; },
        },
      });
    },
  });
}

export function useUpdateStockLevels() {
  return useMutation(UPDATE_STOCK_LEVELS, {
    update(cache) {
      // Threshold changes affect health reporting
      cache.modify({
        fields: {
          lowStockItems(_, { DELETE }) { return DELETE; },
          inventoryHealthStats(_, { DELETE }) { return DELETE; },
        },
      });
    },
  });
}

export function useUpdateStockThresholds() {
  return useMutation(UPDATE_STOCK_THRESHOLDS, {
    update(cache) {
      cache.modify({
        fields: {
          lowStockItems(_, { DELETE }) { return DELETE; },
          inventoryHealthStats(_, { DELETE }) { return DELETE; },
        },
      });
    },
  });
}

// ── Stock Health ──

export function useLowStockItems(warehouseId: string) {
  return useQuery(GET_LOW_STOCK_ITEMS, {
    variables: { warehouseId },
    skip: !warehouseId,
    fetchPolicy: 'cache-and-network',
  });
}

export function useWarehouseStockHealth(warehouseId: string) {
  return useQuery(GET_WAREHOUSE_STOCK_HEALTH, {
    variables: { warehouseId },
    skip: !warehouseId,
    fetchPolicy: 'cache-and-network',
  });
}

export function useCompanyStockHealth() {
  return useQuery(GET_COMPANY_STOCK_HEALTH, {
    fetchPolicy: 'cache-and-network',
  });
}

export function useCompanyStockHealthOverview() {
  return useQuery(GET_COMPANY_STOCK_HEALTH_OVERVIEW, {
    fetchPolicy: 'cache-and-network',
  });
}

export function useInventoryHealthStats() {
  return useQuery(GET_INVENTORY_HEALTH_STATS, {
    fetchPolicy: 'cache-and-network',
  });
}

export function useWarehouseHealthScorecard() {
  return useQuery(GET_WAREHOUSE_HEALTH_SCORECARD, {
    fetchPolicy: 'cache-and-network',
  });
}

// ── Company Inventory Summary ──

export function useCompanyInventorySummary(variables: { filters: any }) {
  return useQuery(GET_COMPANY_INVENTORY_SUMMARY, {
    variables,
    fetchPolicy: 'cache-and-network',
  });
}

// ── Analytics / Visualization ──

export function useTopStockProducts(variables?: { limit?: number }) {
  return useQuery(GET_TOP_STOCK_PRODUCTS, {
    variables,
    fetchPolicy: 'cache-and-network',
  });
}

export function useCriticalStockProducts(variables?: { limit?: number }) {
  return useQuery(GET_CRITICAL_STOCK_PRODUCTS, {
    variables,
    fetchPolicy: 'cache-and-network',
  });
}

export function useWarehouseStockDistribution(productId: string) {
  return useQuery(GET_WAREHOUSE_STOCK_DISTRIBUTION, {
    variables: { productId },
    skip: !productId,
  });
}

export function useMovementTrends(variables?: { days?: number }) {
  return useQuery(GET_MOVEMENT_TRENDS, {
    variables,
    fetchPolicy: 'cache-and-network',
  });
}

export function useMovementTypeBreakdown(variables?: { days?: number }) {
  return useQuery(GET_MOVEMENT_TYPE_BREAKDOWN, {
    variables,
    fetchPolicy: 'cache-and-network',
  });
}

export function useAdjustmentTrends(variables?: { days?: number }) {
  return useQuery(GET_ADJUSTMENT_TRENDS, {
    variables,
    fetchPolicy: 'cache-and-network',
  });
}

export function useAdjustmentsByWarehouse(variables?: { days?: number }) {
  return useQuery(GET_ADJUSTMENTS_BY_WAREHOUSE, {
    variables,
    fetchPolicy: 'cache-and-network',
  });
}

export function useAdjustmentsByUser(variables?: { days?: number; limit?: number }) {
  return useQuery(GET_ADJUSTMENTS_BY_USER, {
    variables,
    fetchPolicy: 'cache-and-network',
  });
}

// ── Expiry Scanner ──

export function useExpiryScanStatus() {
  return useQuery(GET_EXPIRY_SCAN_STATUS, {
    fetchPolicy: 'network-only',
  });
}

export function useTriggerExpiryScan() {
  return useMutation(TRIGGER_EXPIRY_SCAN);
}
