import { gql } from '@apollo/client';

export const EXPORT_STOCK_SNAPSHOT = gql`
  mutation ExportStockSnapshot($warehouseId: String!, $filters: ExportFiltersInput) {
    exportStockSnapshot(warehouseId: $warehouseId, filters: $filters)
  }
`;

export const EXPORT_STOCK_MOVEMENTS = gql`
  mutation ExportStockMovements($warehouseId: String!, $filters: ExportFiltersInput) {
    exportStockMovements(warehouseId: $warehouseId, filters: $filters)
  }
`;

export const EXPORT_ADJUSTMENTS = gql`
  mutation ExportAdjustments($warehouseId: String!, $filters: ExportFiltersInput) {
    exportAdjustments(warehouseId: $warehouseId, filters: $filters)
  }
`;

export const EXPORT_EXPIRY_LOTS = gql`
  mutation ExportExpiryLots($warehouseId: String!, $filters: ExportFiltersInput) {
    exportExpiryLots(warehouseId: $warehouseId, filters: $filters)
  }
`;

export const EXPORT_INVENTORY_SUMMARY = gql`
  mutation ExportInventorySummary($filters: ExportFiltersInput) {
    exportInventorySummary(filters: $filters)
  }
`;

export const EXPORT_COMPANY_MOVEMENTS = gql`
  mutation ExportCompanyMovements($filters: ExportFiltersInput) {
    exportCompanyMovements(filters: $filters)
  }
`;

export const EXPORT_EXPIRY_RISK = gql`
  mutation ExportExpiryRisk($filters: ExportFiltersInput) {
    exportExpiryRisk(filters: $filters)
  }
`;
