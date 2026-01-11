import { gql } from '@apollo/client';

// Template Downloads
export const DOWNLOAD_PRODUCT_TEMPLATE = gql`
  mutation DownloadProductTemplate {
    downloadProductTemplate
  }
`;

export const DOWNLOAD_CATEGORY_TEMPLATE = gql`
  mutation DownloadCategoryTemplate {
    downloadCategoryTemplate
  }
`;

export const DOWNLOAD_SUPPLIER_TEMPLATE = gql`
  mutation DownloadSupplierTemplate {
    downloadSupplierTemplate
  }
`;

export const DOWNLOAD_OPENING_STOCK_TEMPLATE = gql`
  mutation DownloadOpeningStockTemplate {
    downloadOpeningStockTemplate
  }
`;

// Validation
export const VALIDATE_PRODUCT_IMPORT = gql`
  mutation ValidateProductImport($csvContent: String!) {
    validateProductImport(csvContent: $csvContent)
  }
`;

export const VALIDATE_CATEGORY_IMPORT = gql`
  mutation ValidateCategoryImport($csvContent: String!) {
    validateCategoryImport(csvContent: $csvContent)
  }
`;

export const VALIDATE_SUPPLIER_IMPORT = gql`
  mutation ValidateSupplierImport($csvContent: String!) {
    validateSupplierImport(csvContent: $csvContent)
  }
`;

export const VALIDATE_OPENING_STOCK_IMPORT = gql`
  mutation ValidateOpeningStockImport($csvContent: String!, $warehouseId: String!) {
    validateOpeningStockImport(csvContent: $csvContent, warehouseId: $warehouseId)
  }
`;

// Execution
export const EXECUTE_PRODUCT_IMPORT = gql`
  mutation ExecuteProductImport($validatedData: String!) {
    executeProductImport(validatedData: $validatedData)
  }
`;

export const EXECUTE_CATEGORY_IMPORT = gql`
  mutation ExecuteCategoryImport($validatedData: String!) {
    executeCategoryImport(validatedData: $validatedData)
  }
`;

export const EXECUTE_SUPPLIER_IMPORT = gql`
  mutation ExecuteSupplierImport($validatedData: String!) {
    executeSupplierImport(validatedData: $validatedData)
  }
`;

export const EXECUTE_OPENING_STOCK_IMPORT = gql`
  mutation ExecuteOpeningStockImport($validatedData: String!, $warehouseId: String!) {
    executeOpeningStockImport(validatedData: $validatedData, warehouseId: $warehouseId)
  }
`;

// Units Import
export const DOWNLOAD_UNIT_TEMPLATE = gql`
  mutation DownloadUnitTemplate {
    downloadUnitTemplate
  }
`;

export const VALIDATE_UNIT_IMPORT = gql`
  mutation ValidateUnitImport($csvContent: String!) {
    validateUnitImport(csvContent: $csvContent)
  }
`;

export const EXECUTE_UNIT_IMPORT = gql`
  mutation ExecuteUnitImport($validatedData: String!) {
    executeUnitImport(validatedData: $validatedData)
  }
`;
