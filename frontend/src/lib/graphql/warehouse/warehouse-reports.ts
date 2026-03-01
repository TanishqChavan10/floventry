import { gql } from "@apollo/client";

export const GET_STOCK_SNAPSHOT = gql`
  query StockSnapshot($warehouseId: ID!, $filters: StockSnapshotFilters) {
    stockSnapshot(warehouseId: $warehouseId, filters: $filters) {
      items {
        id
        productName
        sku
        categoryName
        quantity
        unit
        status
        lastUpdated
      }
      total
    }
  }
`;

// GET_STOCK_MOVEMENTS → canonical in inventory/inventory.ts

export const GET_ADJUSTMENT_REPORT = gql`
  query AdjustmentReport($warehouseId: ID!, $filters: AdjustmentFilters!) {
    adjustmentReport(warehouseId: $warehouseId, filters: $filters) {
      items {
        id
        createdAt
        productName
        sku
        adjustmentType
        quantity
        reason
        referenceId
        performedBy
        userRole
      }
      total
    }
  }
`;
