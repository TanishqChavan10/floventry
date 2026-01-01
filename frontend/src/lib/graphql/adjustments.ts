import { gql } from '@apollo/client';

export const CREATE_INVENTORY_ADJUSTMENT = gql`
  mutation CreateInventoryAdjustment($input: CreateInventoryAdjustmentInput!) {
    createInventoryAdjustment(input: $input) {
      success
      stockMovement {
        id
        type
        quantity
        previous_quantity
        new_quantity
        reason
        reference_id
        created_at
        user_role
      }
      stock {
        id
        quantity
        product {
          id
          name
          sku
        }
      }
    }
  }
`;

export const GET_STOCK_MOVEMENTS_BY_WAREHOUSE = gql`
  query GetStockMovements($filters: StockMovementFilterInput!) {
    stockMovements(filters: $filters) {
      id
      type
      quantity
      previous_quantity
      new_quantity
      reason
      reference_id
      created_at
      product {
        id
        name
        sku
      }
      user {
        fullName
      }
      user_role
    }
  }
`;
