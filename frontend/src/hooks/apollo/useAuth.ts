import { useQuery, useMutation } from '@apollo/client';
import {
  GET_CURRENT_USER,
  UPDATE_PREFERENCES,
  JOIN_COMPANY_WITH_CODE,
  SWITCH_WAREHOUSE,
} from '@/lib/graphql/auth';
import {
  GET_USER_WAREHOUSES,
  GET_MANAGED_WAREHOUSES,
  CAN_ACCESS_WAREHOUSE,
  CAN_MANAGE_WAREHOUSE,
} from '@/lib/graphql/users';

// ── Current User ──

export function useCurrentUser() {
  return useQuery(GET_CURRENT_USER, { fetchPolicy: 'cache-and-network' });
}

export function useUpdatePreferences() {
  return useMutation(UPDATE_PREFERENCES);
}

export function useJoinCompanyWithCode() {
  return useMutation(JOIN_COMPANY_WITH_CODE);
}

export function useSwitchWarehouse() {
  return useMutation(SWITCH_WAREHOUSE);
}

// ── User Warehouse Access ──

export function useUserWarehouses(userId: string) {
  return useQuery(GET_USER_WAREHOUSES, {
    variables: { userId },
    skip: !userId,
  });
}

export function useManagedWarehouses(userId: string) {
  return useQuery(GET_MANAGED_WAREHOUSES, {
    variables: { userId },
    skip: !userId,
  });
}

export function useCanAccessWarehouse(userId: string, warehouseId: string) {
  return useQuery(CAN_ACCESS_WAREHOUSE, {
    variables: { userId, warehouseId },
    skip: !userId || !warehouseId,
  });
}

export function useCanManageWarehouse(userId: string, warehouseId: string) {
  return useQuery(CAN_MANAGE_WAREHOUSE, {
    variables: { userId, warehouseId },
    skip: !userId || !warehouseId,
  });
}
