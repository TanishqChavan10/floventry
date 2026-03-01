
import { gql } from "@apollo/client";

export const GET_WAREHOUSE_DASHBOARD = gql`
  query WarehouseDashboard($warehouseId: ID!) {
    warehouseKPIs(warehouseId: $warehouseId) {
      totalProducts
      totalQuantity
      lowStockCount
      outOfStockCount
      adjustmentsToday
      transfersToday
    }
    lowStockPreview(warehouseId: $warehouseId, limit: 5) {
      product {
        name
        sku
      }
      quantity
      status
    }
    recentMovements(warehouseId: $warehouseId, limit: 10) {
      type
      quantity
      product {
        name
      }
      createdAt
      performedBy {
        name
      }
    }
  }
`;
