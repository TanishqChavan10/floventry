import { gql } from '@apollo/client';

// GET_CURRENT_USER lives in ./auth.ts (canonical, full-field version)

// Warehouse permission queries
export const GET_USER_WAREHOUSES = gql`
  query GetUserWarehouses($userId: ID!) {
    userWarehouses(userId: $userId) {
      id
      warehouse {
        id
        name
        slug
      }
      is_manager_of_warehouse
      created_at
    }
  }
`;

export const GET_MANAGED_WAREHOUSES = gql`
  query GetManagedWarehouses($userId: ID!) {
    managedWarehouses(userId: $userId) {
      id
      warehouse {
        id
        name
        slug
      }
      created_at
    }
  }
`;

export const CAN_ACCESS_WAREHOUSE = gql`
  query CanAccessWarehouse($userId: ID!, $warehouseId: ID!) {
    canAccessWarehouse(userId: $userId, warehouseId: $warehouseId)
  }
`;

export const CAN_MANAGE_WAREHOUSE = gql`
  query CanManageWarehouse($userId: ID!, $warehouseId: ID!) {
    canManageWarehouse(userId: $userId, warehouseId: $warehouseId)
  }
`;

// Mutations for warehouse assignment
export const ASSIGN_USER_TO_WAREHOUSE = gql`
  mutation AssignUserToWarehouse($userId: ID!, $warehouseId: ID!, $isManager: Boolean) {
    assignUserToWarehouse(userId: $userId, warehouseId: $warehouseId, isManager: $isManager) {
      id
      user_id
      warehouse_id
      is_manager_of_warehouse
    }
  }
`;

export const REMOVE_USER_FROM_WAREHOUSE = gql`
  mutation RemoveUserFromWarehouse($userId: ID!, $warehouseId: ID!) {
    removeUserFromWarehouse(userId: $userId, warehouseId: $warehouseId)
  }
`;
