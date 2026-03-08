import { gql } from '@apollo/client';
import { STOCK_WITH_PRODUCT_FRAGMENT } from '../fragments/stock.fragment';
import { WAREHOUSE_REF_FRAGMENT } from '../fragments/warehouse.fragment';

// Query to get all stock for a specific warehouse
export const GET_STOCK_BY_WAREHOUSE = gql`
  query GetStockByWarehouse($warehouseId: String!) {
    stockByWarehouse(warehouseId: $warehouseId) {
      ...StockWithProduct
    }
  }
  ${STOCK_WITH_PRODUCT_FRAGMENT}
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
        ...WarehouseRef
      }
      quantity
      min_stock_level
      max_stock_level
      reorder_point
    }
  }
  ${WAREHOUSE_REF_FRAGMENT}
`;

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
        ...WarehouseRef
      }
      quantity
      min_stock_level
      max_stock_level
      reorder_point
    }
  }
  ${WAREHOUSE_REF_FRAGMENT}
`;

// Query to get stock lots for a specific product in a warehouse
export const GET_STOCK_LOTS = gql`
  query GetStockLots($productId: ID!, $warehouseId: ID!) {
    stockLots(productId: $productId, warehouseId: $warehouseId) {
      id
      quantity
      expiry_date
      received_at
      source_type
    }
  }
`;
