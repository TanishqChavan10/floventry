import { useQuery, useMutation, type MutationHookOptions } from '@apollo/client';
import {
  GET_SALES_ORDERS,
  GET_SALES_ORDER,
  CREATE_SALES_ORDER,
  UPDATE_SALES_ORDER,
  CONFIRM_SALES_ORDER,
  CANCEL_SALES_ORDER,
} from '@/lib/graphql/sales';

export function useSalesOrders() {
  return useQuery(GET_SALES_ORDERS, { fetchPolicy: 'cache-and-network' });
}

export function useSalesOrder(id: string) {
  return useQuery(GET_SALES_ORDER, {
    variables: { id },
    skip: !id,
  });
}

export function useCreateSalesOrder(options?: MutationHookOptions) {
  return useMutation(CREATE_SALES_ORDER, {
    ...options,
    update(cache, result, context) {
      options?.update?.(cache, result, context);
      if (!result.data?.createSalesOrder) return;
      cache.modify({
        fields: {
          salesOrders(existing = []) {
            const ref = cache.identify(result.data!.createSalesOrder);
            if (!ref) return existing;
            // Avoid duplicating if the ref is already in the list
            if (existing.some((e: any) => e.__ref === ref)) return existing;
            return [{ __ref: ref }, ...existing];
          },
        },
      });
    },
  });
}

export function useUpdateSalesOrder() {
  return useMutation(UPDATE_SALES_ORDER);
}

export function useConfirmSalesOrder(options?: MutationHookOptions) {
  return useMutation(CONFIRM_SALES_ORDER, {
    ...options,
    update(cache, result, context) {
      options?.update?.(cache, result, context);
      // Confirming a sales order may affect stock reservations
      cache.modify({
        fields: {
          lowStockItems(_, { DELETE }) { return DELETE; },
        },
      });
    },
  });
}

export function useCancelSalesOrder(options?: MutationHookOptions) {
  return useMutation(CANCEL_SALES_ORDER, options);
}
