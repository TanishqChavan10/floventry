import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { Product } from '../entities/product.entity';
import { StockHealthStatus } from './stock-health.types';
import { MovementType } from '../entities/stock-movement.entity';
import { StockHealthState } from '../stock-health/stock-health.types';

// ===========================
// EXISTING TYPE
// ===========================
@ObjectType()
export class CompanyInventorySummaryItem {
  @Field(() => ID)
  productId: string;

  @Field(() => Product)
  product: Product;

  @Field(() => Int)
  totalQuantity: number;

  @Field(() => Float)
  usableQuantity: number;

  @Field(() => StockHealthState)
  stockHealthState: StockHealthState;

  @Field(() => Int)
  warehouseCount: number;

  @Field(() => Int)
  minQuantity: number;

  @Field(() => Int)
  maxQuantity: number;

  @Field(() => StockHealthStatus)
  status: StockHealthStatus;
}

// ===========================
// NEW VISUALIZATION TYPES
// ===========================

@ObjectType()
export class InventoryHealthStats {
  @Field(() => Int)
  okCount: number;

  @Field(() => Int)
  warningCount: number;

  @Field(() => Int)
  criticalCount: number;
}

@ObjectType()
export class TopStockProduct {
  @Field(() => ID)
  productId: string;

  @Field(() => String)
  productName: string;

  @Field(() => String)
  sku: string;

  @Field(() => Int)
  totalQuantity: number;
}

@ObjectType()
export class CriticalStockProduct {
  @Field(() => ID)
  productId: string;

  @Field(() => String)
  productName: string;

  @Field(() => String)
  sku: string;

  @Field(() => Int)
  lowestWarehouseStock: number;

  @Field(() => String)
  warehouseName: string;
}

@ObjectType()
export class WarehouseStockDistribution {
  @Field(() => ID)
  warehouseId: string;

  @Field(() => String)
  warehouseName: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Int, { nullable: true })
  minLevel: number;

  @Field(() => Int, { nullable: true })
  reorderPoint: number;

  @Field(() => StockHealthStatus)
  status: StockHealthStatus;
}

@ObjectType()
export class WarehouseHealthScore {
  @Field(() => ID)
  warehouseId: string;

  @Field(() => String)
  warehouseName: string;

  @Field(() => Int)
  okCount: number;

  @Field(() => Int)
  warningCount: number;

  @Field(() => Int)
  criticalCount: number;
}

@ObjectType()
export class MovementTrendData {
  @Field(() => String)
  date: string;

  @Field(() => Int)
  inQuantity: number;

  @Field(() => Int)
  outQuantity: number;
}

@ObjectType()
export class MovementTypeBreakdown {
  @Field(() => MovementType)
  type: MovementType;

  @Field(() => Int)
  count: number;

  @Field(() => Int)
  totalQuantity: number;
}

@ObjectType()
export class AdjustmentTrendData {
  @Field(() => String)
  date: string;

  @Field(() => Int)
  adjustmentInQuantity: number;

  @Field(() => Int)
  adjustmentOutQuantity: number;
}

@ObjectType()
export class AdjustmentByWarehouse {
  @Field(() => ID)
  warehouseId: string;

  @Field(() => String)
  warehouseName: string;

  @Field(() => Int)
  totalAdjustments: number;
}

@ObjectType()
export class AdjustmentByUser {
  @Field(() => String)
  userId: string;

  @Field(() => String)
  userName: string;

  @Field(() => Int)
  adjustmentCount: number;

  @Field(() => Int)
  totalQuantity: number;
}

// ===========================
// NEW STOCK HEALTH TYPES
// ===========================

@ObjectType()
export class WarehouseHealthSummary {
  @Field(() => Float)
  totalStock: number;

  @Field(() => Float)
  usableStock: number;

  @Field(() => Float)
  expiredQuantity: number;

  @Field(() => Float)
  expiringSoonQuantity: number;

  @Field(() => Int)
  blockedProductsCount: number;

  @Field(() => Int)
  criticalProductsCount: number;

  @Field(() => Int)
  atRiskProductsCount: number;

  @Field(() => Int)
  lowStockProductsCount: number;

  @Field(() => String)
  lastUpdated: string;
}

@ObjectType()
export class WarehouseRiskMetric {
  @Field(() => String)
  warehouseId: string;

  @Field(() => String)
  warehouseName: string;

  @Field(() => String)
  warehouseSlug: string;

  @Field(() => Int)
  blockedProductCount: number;

  @Field(() => Float)
  expiredPercentage: number;

  @Field(() => Float)
  expiringSoonPercentage: number;

  @Field(() => Float)
  healthScore: number;

  @Field(() => String)
  lastUpdated: string;
}

@ObjectType()
export class CompanyStockHealthOverview {
  @Field(() => Int)
  totalBlockedProducts: number;

  @Field(() => [WarehouseRiskMetric])
  warehouseRiskMetrics: WarehouseRiskMetric[];

  @Field(() => String)
  lastUpdated: string;
}
