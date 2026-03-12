import { useQuery, useMutation } from '@apollo/client';
import {
  GET_WAREHOUSES_BY_COMPANY,
  GET_WAREHOUSE_WITH_SETTINGS,
  GET_WAREHOUSE_MEMBERS,
  CREATE_WAREHOUSE,
  UPDATE_WAREHOUSE,
  UPDATE_WAREHOUSE_SETTINGS,
  ARCHIVE_WAREHOUSE,
  REACTIVATE_WAREHOUSE,
  ASSIGN_USER_TO_WAREHOUSE,
  REMOVE_USER_FROM_WAREHOUSE,
} from '@/lib/graphql/company';
import { GET_WAREHOUSE_DASHBOARD } from '@/lib/graphql/warehouse-dashboard';
import { GET_STOCK_SNAPSHOT, GET_ADJUSTMENT_REPORT } from '@/lib/graphql/warehouse-reports';
import {
  GET_WAREHOUSE_TRANSFERS,
  GET_WAREHOUSE_TRANSFER,
  CREATE_WAREHOUSE_TRANSFER,
  UPDATE_WAREHOUSE_TRANSFER,
  POST_WAREHOUSE_TRANSFER,
  CANCEL_WAREHOUSE_TRANSFER,
} from '@/lib/graphql/transfers';

// ── Warehouse Queries ──

export function useWarehousesByCompany(slug: string) {
  return useQuery(GET_WAREHOUSES_BY_COMPANY, {
    variables: { slug },
    skip: !slug,
    fetchPolicy: 'cache-and-network',
  });
}

export function useWarehouseWithSettings(id: string) {
  return useQuery(GET_WAREHOUSE_WITH_SETTINGS, {
    variables: { id },
    skip: !id,
  });
}

export function useWarehouseDashboard(warehouseId: string) {
  return useQuery(GET_WAREHOUSE_DASHBOARD, {
    variables: { warehouseId },
    skip: !warehouseId,
    fetchPolicy: 'cache-and-network',
  });
}

// ── Warehouse Mutations ──

export function useCreateWarehouse() {
  return useMutation(CREATE_WAREHOUSE, {
    update(cache, { data }) {
      if (!data?.createWarehouse) return;
      cache.modify({
        fields: {
          warehousesByCompany(existing = []) {
            const ref = cache.identify(data.createWarehouse);
            if (!ref) return existing;
            return [...existing, { __ref: ref }];
          },
        },
      });
    },
  });
}

export function useUpdateWarehouse() {
  return useMutation(UPDATE_WAREHOUSE);
}

export function useUpdateWarehouseSettings() {
  return useMutation(UPDATE_WAREHOUSE_SETTINGS);
}

export function useArchiveWarehouse() {
  return useMutation(ARCHIVE_WAREHOUSE, {
    update(cache, { data }, { variables }) {
      if (!data?.archiveWarehouse) return;
      cache.modify({
        fields: {
          warehousesByCompany(existing = [], { readField }) {
            return existing.filter(
              (ref: any) => readField('id', ref) !== variables?.id,
            );
          },
        },
      });
      cache.evict({ id: `Warehouse:${variables?.id}` });
      cache.gc();
    },
  });
}

export function useReactivateWarehouse() {
  return useMutation(REACTIVATE_WAREHOUSE, {
    update(cache, { data }) {
      if (!data?.reactivateWarehouse) return;
      // The returned object with status will auto-merge into cache
      cache.modify({
        fields: {
          warehousesByCompany(existing = []) {
            const ref = cache.identify(data.reactivateWarehouse);
            if (!ref) return existing;
            // Re-add if it was filtered out
            if (existing.some((e: any) => e.__ref === ref)) return existing;
            return [...existing, { __ref: ref }];
          },
        },
      });
    },
  });
}

// ── Warehouse Members ──

export function useWarehouseMembers(warehouseId: string) {
  return useQuery(GET_WAREHOUSE_MEMBERS, {
    variables: { warehouseId },
    skip: !warehouseId,
  });
}

export function useAssignUserToWarehouse() {
  return useMutation(ASSIGN_USER_TO_WAREHOUSE, {
    update(cache, { data }, { variables }) {
      if (!data?.assignUserToWarehouse) return;
      cache.modify({
        fields: {
          warehouseMembers(existing = [], { storeFieldName }) {
            // Only update the field matching this warehouseId
            if (!storeFieldName.includes(variables?.warehouseId)) return existing;
            const ref = cache.identify(data.assignUserToWarehouse);
            if (!ref) return existing;
            return [...existing, { __ref: ref }];
          },
        },
      });
    },
  });
}

export function useRemoveUserFromWarehouse() {
  return useMutation(REMOVE_USER_FROM_WAREHOUSE, {
    update(cache, { data }, { variables }) {
      if (!data?.removeUserFromWarehouse) return;
      // Evict the members cache for this warehouse so it refetches
      cache.modify({
        fields: {
          warehouseMembers(_, { DELETE, storeFieldName }) {
            if (storeFieldName.includes(variables?.warehouseId)) return DELETE;
            return _;
          },
        },
      });
    },
  });
}

// ── Warehouse Transfers ──

export function useWarehouseTransfers(variables: { filters: any }) {
  return useQuery(GET_WAREHOUSE_TRANSFERS, {
    variables,
    fetchPolicy: 'cache-and-network',
  });
}

export function useWarehouseTransfer(id: string) {
  return useQuery(GET_WAREHOUSE_TRANSFER, {
    variables: { id },
    skip: !id,
  });
}

export function useCreateWarehouseTransfer() {
  return useMutation(CREATE_WAREHOUSE_TRANSFER, {
    update(cache, { data }) {
      if (!data?.createWarehouseTransfer) return;
      cache.modify({
        fields: {
          warehouseTransfers(existing = []) {
            const ref = cache.identify(data.createWarehouseTransfer);
            if (!ref) return existing;
            return [{ __ref: ref }, ...existing];
          },
        },
      });
    },
  });
}

export function useUpdateWarehouseTransfer() {
  return useMutation(UPDATE_WAREHOUSE_TRANSFER);
}

export function usePostWarehouseTransfer() {
  return useMutation(POST_WAREHOUSE_TRANSFER, {
    optimisticResponse({ id }) {
      return {
        postWarehouseTransfer: {
          __typename: 'WarehouseTransfer',
          id,
          transfer_number: '',
          status: 'posted',
        },
      };
    },
    update(cache) {
      // Posted transfers affect stock levels
      cache.modify({
        fields: {
          lowStockItems(_, { DELETE }) { return DELETE; },
          inventoryHealthStats(_, { DELETE }) { return DELETE; },
        },
      });
    },
  });
}

export function useCancelWarehouseTransfer() {
  return useMutation(CANCEL_WAREHOUSE_TRANSFER, {
    optimisticResponse({ id }) {
      return {
        cancelWarehouseTransfer: {
          __typename: 'WarehouseTransfer',
          id,
          transfer_number: '',
          status: 'cancelled',
        },
      };
    },
  });
}

// ── Warehouse Reports ──

export function useStockSnapshot(variables: { warehouseId: string; filters?: any }) {
  return useQuery(GET_STOCK_SNAPSHOT, {
    variables,
    skip: !variables.warehouseId,
    fetchPolicy: 'cache-and-network',
  });
}

export function useAdjustmentReport(variables: { warehouseId: string; filters: any }) {
  return useQuery(GET_ADJUSTMENT_REPORT, {
    variables,
    skip: !variables.warehouseId,
    fetchPolicy: 'cache-and-network',
  });
}
