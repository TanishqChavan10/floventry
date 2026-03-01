import { gql } from '@apollo/client';

// Query to get all stock for a specific warehouse
export const GET_STOCK_BY_WAREHOUSE = gql`
  query GetStockByWarehouse($warehouseId: String!) {
    stockByWarehouse(warehouseId: $warehouseId) {
      id
      product {
        id
        name
        sku
        unit
        supplier_id
        supplier {
          id
          name
        }
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

// GET_STOCK_MOVEMENTS → canonical in inventory/inventory.ts
// GET_LOW_STOCK_ITEMS  → canonical in inventory/low-stock.ts

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

// ADJUST_STOCK → canonical in inventory/inventory.ts

// UPDATE_STOCK_LEVELS → canonical in inventory/inventory.ts

// Query to get a specific stock
export const GET_STOCK = gql`
  query GetStock($productId: String!, $warehouseId: String!) {
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
