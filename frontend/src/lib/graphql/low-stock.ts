import { gql } from '@apollo/client';

export const GET_LOW_STOCK_ITEMS = gql`
  query GetLowStockItems($warehouseId: String!) {
    lowStockItems(warehouseId: $warehouseId) {
      stockId
      product {
        id
        name
        sku
        unit
      }
      quantity
      minStockLevel
      reorderPoint
      maxStockLevel
      status
    }
  }
`;

export const UPDATE_STOCK_THRESHOLDS = gql`
  mutation UpdateStockThresholds(
    $stockId: String!
    $input: UpdateStockThresholdsInput!
  ) {
    updateStockThresholds(stockId: $stockId, input: $input) {
      id
      quantity
      min_stock_level
      reorder_point
      max_stock_level
    }
  }
`;
