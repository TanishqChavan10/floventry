import { gql } from '@apollo/client';

// Query to get all stock for a specific warehouse
export const GET_STOCK_BY_WAREHOUSE = gql`
  query GetStockByWarehouse($warehouseId: ID!) {
    stockByWarehouse(warehouseId: $warehouseId) {
      id
      product {
        id
        name
        sku
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

// Query to get stock movements with filters
export const GET_STOCK_MOVEMENTS = gql`
  query GetStockMovements($filters: StockMovementFilterInput!) {
    stockMovements(filters: $filters) {
      id
      type
      quantity
      previous_quantity
      new_quantity
      reason
      reference_id
      reference_type
      notes
      product {
        id
        name
        sku
      }
      warehouse {
        id
        name
      }
      user {
        id
        firstName
        lastName
      }
      created_at
    }
  }
`;

// Query to get low stock items
export const GET_LOW_STOCK_ITEMS = gql`
  query GetLowStockItems($warehouseId: ID) {
    lowStockItems(warehouseId: $warehouseId) {
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
      reorder_point
    }
  }
`;

// Mutation to create stock
export const CREATE_STOCK = gql`
  mutation CreateStock($input: CreateStockInput!) {
    createStock(input: $input) {
      id
      product {
        id
        name
      }
      warehouse {
        id
        name
      }
      quantity
      min_stock_level
      max_stock_level
      reorder_point
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

// Query to get a specific stock
export const GET_STOCK = gql`
  query GetStock($productId: ID!, $warehouseId: ID!) {
    stock(productId: $productId, warehouseId: $warehouseId) {
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
    }
  }
`;
