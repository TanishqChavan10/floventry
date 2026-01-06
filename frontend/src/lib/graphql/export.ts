import { gql } from '@apollo/client';

export const EXPORT_STOCK_SNAPSHOT = gql`
  mutation ExportStockSnapshot($warehouseId: String!, $filters: JSON) {
    exportStockSnapshot(warehouseId: $warehouseId, filters: $filters)
  }
`;

export const EXPORT_STOCK_MOVEMENTS = gql`
  mutation ExportStockMovements($warehouseId: String!, $filters: JSON) {
    exportStockMovements(warehouseId: $warehouseId, filters: $filters)
  }
`;

export const EXPORT_ADJUSTMENTS = gql`
  mutation ExportAdjustments($warehouseId: String!, $filters: JSON) {
    exportAdjustments(warehouseId: $warehouseId, filters: $filters)
  }
`;

export const EXPORT_EXPIRY_LOTS = gql`
  mutation ExportExpiryLots($warehouseId: String!, $filters: JSON) {
    exportExpiryLots(warehouseId: $warehouseId, filters: $filters)
  }
`;

export const EXPORT_INVENTORY_SUMMARY = gql`
  mutation ExportInventorySummary($filters: JSON) {
    exportInventorySummary(filters: $filters)
  }
`;

export const EXPORT_COMPANY_MOVEMENTS = gql`
  mutation ExportCompanyMovements($filters: JSON) {
    exportCompanyMovements(filters: $filters)
  }
`;

export const EXPORT_EXPIRY_RISK = gql`
  mutation ExportExpiryRisk($filters: JSON) {
    exportExpiryRisk(filters: $filters)
  }
`;
