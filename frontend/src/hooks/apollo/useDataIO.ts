import { useMutation } from '@apollo/client';
import {
  EXPORT_STOCK_SNAPSHOT,
  EXPORT_STOCK_MOVEMENTS,
  EXPORT_ADJUSTMENTS,
  EXPORT_EXPIRY_LOTS,
  EXPORT_INVENTORY_SUMMARY,
  EXPORT_COMPANY_MOVEMENTS,
  EXPORT_EXPIRY_RISK,
} from '@/lib/graphql/export';
import {
  DOWNLOAD_PRODUCT_TEMPLATE,
  DOWNLOAD_CATEGORY_TEMPLATE,
  DOWNLOAD_SUPPLIER_TEMPLATE,
  DOWNLOAD_OPENING_STOCK_TEMPLATE,
  DOWNLOAD_UNIT_TEMPLATE,
  VALIDATE_PRODUCT_IMPORT,
  VALIDATE_CATEGORY_IMPORT,
  VALIDATE_SUPPLIER_IMPORT,
  VALIDATE_OPENING_STOCK_IMPORT,
  VALIDATE_UNIT_IMPORT,
  EXECUTE_PRODUCT_IMPORT,
  EXECUTE_CATEGORY_IMPORT,
  EXECUTE_SUPPLIER_IMPORT,
  EXECUTE_OPENING_STOCK_IMPORT,
  EXECUTE_UNIT_IMPORT,
} from '@/lib/graphql/import';

// ── Exports ──

export function useExportStockSnapshot() {
  return useMutation(EXPORT_STOCK_SNAPSHOT);
}

export function useExportStockMovements() {
  return useMutation(EXPORT_STOCK_MOVEMENTS);
}

export function useExportAdjustments() {
  return useMutation(EXPORT_ADJUSTMENTS);
}

export function useExportExpiryLots() {
  return useMutation(EXPORT_EXPIRY_LOTS);
}

export function useExportInventorySummary() {
  return useMutation(EXPORT_INVENTORY_SUMMARY);
}

export function useExportCompanyMovements() {
  return useMutation(EXPORT_COMPANY_MOVEMENTS);
}

export function useExportExpiryRisk() {
  return useMutation(EXPORT_EXPIRY_RISK);
}

// ── Import Templates ──

export function useDownloadProductTemplate() {
  return useMutation(DOWNLOAD_PRODUCT_TEMPLATE);
}

export function useDownloadCategoryTemplate() {
  return useMutation(DOWNLOAD_CATEGORY_TEMPLATE);
}

export function useDownloadSupplierTemplate() {
  return useMutation(DOWNLOAD_SUPPLIER_TEMPLATE);
}

export function useDownloadOpeningStockTemplate() {
  return useMutation(DOWNLOAD_OPENING_STOCK_TEMPLATE);
}

export function useDownloadUnitTemplate() {
  return useMutation(DOWNLOAD_UNIT_TEMPLATE);
}

// ── Import Validation ──

export function useValidateProductImport() {
  return useMutation(VALIDATE_PRODUCT_IMPORT);
}

export function useValidateCategoryImport() {
  return useMutation(VALIDATE_CATEGORY_IMPORT);
}

export function useValidateSupplierImport() {
  return useMutation(VALIDATE_SUPPLIER_IMPORT);
}

export function useValidateOpeningStockImport() {
  return useMutation(VALIDATE_OPENING_STOCK_IMPORT);
}

export function useValidateUnitImport() {
  return useMutation(VALIDATE_UNIT_IMPORT);
}

// ── Import Execution ──

export function useExecuteProductImport() {
  return useMutation(EXECUTE_PRODUCT_IMPORT);
}

export function useExecuteCategoryImport() {
  return useMutation(EXECUTE_CATEGORY_IMPORT);
}

export function useExecuteSupplierImport() {
  return useMutation(EXECUTE_SUPPLIER_IMPORT);
}

export function useExecuteOpeningStockImport() {
  return useMutation(EXECUTE_OPENING_STOCK_IMPORT);
}

export function useExecuteUnitImport() {
  return useMutation(EXECUTE_UNIT_IMPORT);
}
