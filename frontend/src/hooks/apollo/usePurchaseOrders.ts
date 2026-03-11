import { useQuery, useMutation, type MutationHookOptions } from '@apollo/client';
import {
  GET_PURCHASE_ORDERS,
  GET_PURCHASE_ORDER,
  CREATE_PURCHASE_ORDER,
  UPDATE_PURCHASE_ORDER,
  MARK_PURCHASE_ORDER_ORDERED,
  CANCEL_PURCHASE_ORDER,
  GET_PURCHASE_ORDERS_CONNECTION,
} from '@/lib/graphql';
import {
  GET_GRNS,
  GET_GRN,
  CREATE_GRN,
  UPDATE_GRN,
  POST_GRN,
  CANCEL_GRN,
} from '@/lib/graphql/grn';
import { useCursorPagination } from './useCursorPagination';
import type { CursorPaginationInput } from '@/types/pagination';

// ── Purchase Orders ──

export function usePurchaseOrders(variables: { filters: any }) {
  return useQuery(GET_PURCHASE_ORDERS, {
    variables,
    fetchPolicy: 'cache-and-network',
  });
}

export function usePurchaseOrdersConnection(input?: CursorPaginationInput) {
  return useCursorPagination(
    GET_PURCHASE_ORDERS_CONNECTION,
    'purchaseOrdersConnection',
    { variables: { input: input ?? { first: 20 } }, fetchPolicy: 'cache-and-network' },
  );
}

export function usePurchaseOrder(id: string) {
  return useQuery(GET_PURCHASE_ORDER, {
    variables: { id },
    skip: !id,
  });
}

export function useCreatePurchaseOrder(options?: MutationHookOptions) {
  return useMutation(CREATE_PURCHASE_ORDER, {
    ...options,
    update(cache, result, context) {
      options?.update?.(cache, result, context);
      if (!result.data?.createPurchaseOrder) return;
      cache.modify({
        fields: {
          purchaseOrders(existing = []) {
            const ref = cache.identify(result.data!.createPurchaseOrder);
            if (!ref) return existing;
            if (existing.some((e: any) => e.__ref === ref)) return existing;
            return [{ __ref: ref }, ...existing];
          },
        },
      });
    },
  });
}

export function useUpdatePurchaseOrder() {
  return useMutation(UPDATE_PURCHASE_ORDER);
}

export function useMarkPurchaseOrderOrdered() {
  return useMutation(MARK_PURCHASE_ORDER_ORDERED, {
    optimisticResponse({ id }) {
      return {
        markPurchaseOrderOrdered: {
          __typename: 'PurchaseOrder',
          id,
          po_number: '',
          status: 'ordered',
          updated_at: new Date().toISOString(),
        },
      };
    },
  });
}

export function useCancelPurchaseOrder() {
  return useMutation(CANCEL_PURCHASE_ORDER, {
    optimisticResponse({ id }) {
      return {
        cancelPurchaseOrder: {
          __typename: 'PurchaseOrder',
          id,
          po_number: '',
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        },
      };
    },
  });
}

// ── Goods Receipt Notes ──

export function useGRNs(variables: { filters: any }) {
  return useQuery(GET_GRNS, {
    variables,
    fetchPolicy: 'cache-and-network',
  });
}

export function useGRN(id: string) {
  return useQuery(GET_GRN, {
    variables: { id },
    skip: !id,
  });
}

export function useCreateGRN() {
  return useMutation(CREATE_GRN, {
    update(cache, { data }) {
      if (!data?.createGRN) return;
      cache.modify({
        fields: {
          grns(existing = []) {
            const ref = cache.identify(data.createGRN);
            if (!ref) return existing;
            if (existing.some((e: any) => e.__ref === ref)) return existing;
            return [{ __ref: ref }, ...existing];
          },
        },
      });
    },
  });
}

export function useUpdateGRN() {
  return useMutation(UPDATE_GRN);
}

export function usePostGRN() {
  return useMutation(POST_GRN, {
    optimisticResponse({ id }) {
      return {
        postGRN: {
          __typename: 'GoodsReceiptNote',
          id,
          grn_number: '',
          status: 'posted',
          posted_at: new Date().toISOString(),
          posted_by_user: null,
        },
      };
    },
    update(cache) {
      // Posted GRN affects stock levels
      cache.modify({
        fields: {
          lowStockItems(_, { DELETE }) { return DELETE; },
          inventoryHealthStats(_, { DELETE }) { return DELETE; },
          companyStockHealthOverview(_, { DELETE }) { return DELETE; },
        },
      });
    },
  });
}

export function useCancelGRN() {
  return useMutation(CANCEL_GRN, {
    optimisticResponse({ id }) {
      return {
        cancelGRN: {
          __typename: 'GoodsReceiptNote',
          id,
          grn_number: '',
          status: 'cancelled',
        },
      };
    },
  });
}
