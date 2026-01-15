import { gql } from '@apollo/client';

/**
 * Get stock health for a specific warehouse
 */
export const GET_WAREHOUSE_STOCK_HEALTH = gql`
  query GetWarehouseStockHealth($warehouseId: ID!) {
    warehouseStockHealth(warehouseId: $warehouseId) {
      productId
      productName
      warehouseId
      totalStock
      usableStock
      expiredQty
      expiringSoonQty
      state
      nearestExpiryDate
      reorderPoint
      recommendation
    }
  }
`;

/**
 * Get company-wide stock health
 */
export const GET_COMPANY_STOCK_HEALTH = gql`
  query GetCompanyStockHealth {
    companyStockHealth {
      productId
      productName
      totalUsableStock
      state
      affectedWarehouses
      nearestExpiryDate
      recommendation
    }
  }
`;

/**
 * Stock health state enum
 */
export type StockHealthState =
    | 'HEALTHY'
    | 'AT_RISK'
    | 'LOW_STOCK'
    | 'CRITICAL'
    | 'BLOCKED';

/**
 * Warehouse stock health result type
 */
export interface WarehouseStockHealth {
    productId: string;
    productName: string;
    warehouseId: string;
    totalStock: number;
    usableStock: number;
    expiredQty: number;
    expiringSoonQty: number;
    state: StockHealthState;
    nearestExpiryDate?: string;
    reorderPoint?: number;
    recommendation: string;
}

/**
 * Company stock health result type
 */
export interface CompanyStockHealth {
    productId: string;
    productName: string;
    totalUsableStock: number;
    state: StockHealthState;
    affectedWarehouses: string[];
    nearestExpiryDate?: string;
    recommendation: string;
}
