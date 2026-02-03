import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import { Product } from '../entities/product.entity';

/**
 * Stock Health Status Enum
 * Computed at query time based on thresholds
 */
export enum StockHealthStatus {
  OK = 'OK',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

registerEnumType(StockHealthStatus, {
  name: 'StockHealthStatus',
  description: 'Health status of stock based on quantity vs thresholds',
});

/**
 * Stock Health Item DTO
 * Represents a stock item with computed health status
 * Used for low stock alerts (WARNING & CRITICAL only)
 */
@ObjectType()
export class StockHealthItem {
  @Field(() => ID)
  stockId: string;

  @Field(() => Product)
  product: Product;

  @Field(() => Int)
  quantity: number;

  @Field(() => Int, { nullable: true })
  minStockLevel: number;

  @Field(() => Int, { nullable: true })
  reorderPoint: number;

  @Field(() => Int, { nullable: true })
  maxStockLevel: number;

  @Field(() => StockHealthStatus)
  status: StockHealthStatus;
}

/**
 * Calculate stock health status
 * Logic: quantity <= min = CRITICAL
 *        quantity <= reorder = WARNING
 *        otherwise = OK
 */
export function calculateStockHealthStatus(
  quantity: number,
  minStockLevel: number | null,
  reorderPoint: number | null,
): StockHealthStatus {
  // If no thresholds set, status is OK
  if (minStockLevel === null && reorderPoint === null) {
    return StockHealthStatus.OK;
  }

  // Check CRITICAL first (most severe)
  if (minStockLevel !== null && quantity <= minStockLevel) {
    return StockHealthStatus.CRITICAL;
  }

  // Check WARNING
  if (reorderPoint !== null && quantity <= reorderPoint) {
    return StockHealthStatus.WARNING;
  }

  // Default to OK
  return StockHealthStatus.OK;
}
