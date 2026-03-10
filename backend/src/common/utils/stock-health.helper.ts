import { StockHealthFlag } from '../../inventory/entities/stock.entity';

/**
 * Compute the stock health flag from quantity and thresholds.
 * This MUST match the logic in stock-health.types.ts `calculateStockHealthStatus`.
 */
export function computeStockHealth(
  quantity: number,
  minStockLevel: number | null | undefined,
  reorderPoint: number | null | undefined,
): StockHealthFlag {
  const qty = Number(quantity ?? 0);

  if (
    qty === 0 ||
    (minStockLevel != null && qty <= Number(minStockLevel))
  ) {
    return StockHealthFlag.CRITICAL;
  }

  if (reorderPoint != null && qty <= Number(reorderPoint)) {
    return StockHealthFlag.LOW;
  }

  return StockHealthFlag.OK;
}
