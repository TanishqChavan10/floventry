import { gql } from '@apollo/client';

// Query to get all stock for a specific warehouse
export const GET_WAREHOUSE_STOCK = gql`
  query GetStockByWarehouse($warehouseId: String!) {
    stockByWarehouse(warehouseId: $warehouseId) {
      id
      product {
        id
        name
        sku
        unit
        category {
          id
          name
        }
        cost_price
        selling_price
      }
      warehouse {
        id
        name
      }
      quantity
      min_stock_level
      max_stock_level
      reorder_point
      created_at
      updated_at
    }
  }
`;

// Mutation to create opening stock
export const CREATE_OPENING_STOCK = gql`
  mutation CreateOpeningStock($input: CreateOpeningStockInput!) {
    createOpeningStock(input: $input) {
      id
      product {
        id
        name
        sku
      }
      warehouse {
        id
        name
      }
      quantity
      min_stock_level
      max_stock_level
      reorder_point
      created_at
    }
  }
`;

// Query to get stock movements with filters
export const GET_STOCK_MOVEMENTS = gql`
  query GetStockMovements($warehouseId: ID!, $filters: StockMovementFilters!) {
    stockMovements(warehouseId: $warehouseId, filters: $filters) {
      items {
        id
        type
        quantity
        referenceId
        referenceType
        reason
        productName
        sku
        createdAt
        performedBy
        userRole
      }
      total
    }
  }
`;

// Mutation to adjust stock
export const ADJUST_STOCK = gql`
  mutation AdjustStock($input: AdjustStockInput!) {
    adjustStock(input: $input) {
      id
      product {
        id
        name
        sku
      }
      warehouse {
        id
        name
      }
      quantity
      updated_at
    }
  }
`;

// Mutation to update stock levels (min/max/reorder)
export const UPDATE_STOCK_LEVELS = gql`
  mutation UpdateStockLevels($input: UpdateStockInput!) {
    updateStockLevels(input: $input) {
      id
      min_stock_level
      max_stock_level
      reorder_point
    }
  }
`;
