import { gql } from '@apollo/client';

// Query to get all stock for a specific warehouse
export const GET_WAREHOUSE_STOCK = gql`
  query GetStockByWarehouse($warehouseId: String!) {
    stockByWarehouse(warehouseId: $warehouseId) {
      id
      product {
        id
        name
        sku
        unit
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

// Mutation to create opening stock
export const CREATE_OPENING_STOCK = gql`
  mutation CreateOpeningStock($input: CreateOpeningStockInput!) {
    createOpeningStock(input: $input) {
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
      created_at
    }
  }
`;

// Query to get stock movements with filters
export const GET_STOCK_MOVEMENTS = gql`
  query GetStockMovements($warehouseId: ID!, $filters: StockMovementFilters!) {
    stockMovements(warehouseId: $warehouseId, filters: $filters) {
      items {
        id
        type
        quantity
        referenceId
        referenceType
        reason
        productName
        sku
        createdAt
        performedBy
        userRole
      }
      total
    }
  }
`;

// Mutation to adjust stock
export const ADJUST_STOCK = gql`
  mutation AdjustStock($input: AdjustStockInput!) {
    adjustStock(input: $input) {
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
      updated_at
    }
  }
`;

// Mutation to update stock levels (min/max/reorder)
export const UPDATE_STOCK_LEVELS = gql`
  mutation UpdateStockLevels($input: UpdateStockInput!) {
    updateStockLevels(input: $input) {
      id
      min_stock_level
      max_stock_level
      reorder_point
    }
  }
`;

export const GET_COMPANY_INVENTORY_SUMMARY = gql`
  query GetCompanyInventorySummary($filters: CompanyInventorySummaryFilterInput!) {
    companyInventorySummary(filters: $filters) {
      productId
      product {
        id
        name
        sku
        category {
          id
          name
        }
      }
      totalQuantity
      warehouseCount
      minQuantity
      maxQuantity
      status
    }
  }
`;

export const GET_STOCK_BY_PRODUCT = gql`
  query GetStockByProduct($productId: String!) {
    stockByProduct(productId: $productId) {
      id
      warehouse {
        id
        name
      }
      quantity
      min_stock_level
      reorder_point
      max_stock_level
      updated_at
    }
  }
`;

export const GET_COMPANY_STOCK_MOVEMENTS = gql`
  query GetCompanyStockMovements($filters: StockMovementFilterInput!) {
    companyStockMovements(filters: $filters) {
      id
      type
      quantity
      previous_quantity
      new_quantity
      reason
      reference_id
      reference_type
      performed_by
      user_role
      created_at
      product {
        id
        name
        sku
      }
      warehouse {
        id
        name
      }
      user {
        fullName
      }
      stock {
        id
      }
    }
  }
`;

// ===========================
// VISUALIZATION QUERIES
// ===========================

export const GET_INVENTORY_HEALTH_STATS = gql`
  query GetInventoryHealthStats {
    inventoryHealthStats {
      okCount
      warningCount
      criticalCount
    }
  }
`;

export const GET_TOP_STOCK_PRODUCTS = gql`
  query GetTopStockProducts($limit: Float) {
    topStockProducts(limit: $limit) {
      productId
      productName
      sku
      totalQuantity
    }
  }
`;

export const GET_CRITICAL_STOCK_PRODUCTS = gql`
  query GetCriticalStockProducts($limit: Float) {
    criticalStockProducts(limit: $limit) {
      productId
      productName
      sku
      lowestWarehouseStock
      warehouseName
    }
  }
`;

export const GET_WAREHOUSE_STOCK_DISTRIBUTION = gql`
  query GetWarehouseStockDistribution($productId: String!) {
    warehouseStockDistribution(productId: $productId) {
      warehouseId
      warehouseName
      quantity
      minLevel
      reorderPoint
      status
    }
  }
`;

export const GET_WAREHOUSE_HEALTH_SCORECARD = gql`
  query GetWarehouseHealthScorecard {
    warehouseHealthScorecard {
      warehouseId
      warehouseName
      okCount
      warningCount
      criticalCount
    }
  }
`;

export const GET_MOVEMENT_TRENDS = gql`
  query GetMovementTrends($days: Float) {
    movementTrends(days: $days) {
      date
      inQuantity
      outQuantity
    }
  }
`;

export const GET_MOVEMENT_TYPE_BREAKDOWN = gql`
  query GetMovementTypeBreakdown($days: Float) {
    movementTypeBreakdown(days: $days) {
      type
      count
      totalQuantity
    }
  }
`;

export const GET_ADJUSTMENT_TRENDS = gql`
  query GetAdjustmentTrends($days: Float) {
    adjustmentTrends(days: $days) {
      date
      adjustmentInQuantity
      adjustmentOutQuantity
    }
  }
`;

export const GET_ADJUSTMENTS_BY_WAREHOUSE = gql`
  query GetAdjustmentsByWarehouse($days: Float) {
    adjustmentsByWarehouse(days: $days) {
      warehouseId
      warehouseName
      totalAdjustments
    }
  }
`;

export const GET_ADJUSTMENTS_BY_USER = gql`
  query GetAdjustmentsByUser($days: Float, $limit: Float) {
    adjustmentsByUser(days: $days, limit: $limit) {
      userId
      userName
      adjustmentCount
      totalQuantity
    }
  }
`;
