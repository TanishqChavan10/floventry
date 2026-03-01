import { differenceInDays } from 'date-fns';
import { StockLot } from '../stock-lot/entities/stock-lot.entity';
import { StockHealthState } from './stock-health.types';

/**
 * Calculate usable stock based on expiry status
 *
 * @param totalStock - Total stock quantity
 * @param expiredQty - Quantity of expired stock
 * @param expiringSoonQty - Quantity of stock expiring soon
 * @param excludeExpiringSoon - Whether to exclude expiring-soon from usable calculation
 * @returns Usable stock quantity
 */
export function calculateUsableStock(
  totalStock: number,
  expiredQty: number,
  expiringSoonQty: number,
  excludeExpiringSoon: boolean,
): number {
  if (excludeExpiringSoon) {
    return Math.max(0, totalStock - expiredQty - expiringSoonQty);
  }
  return Math.max(0, totalStock - expiredQty);
}

/**
 * Determine stock health state based on availability and expiry
 *
 * ✅ CORRECTED: Uses totalStock for AT_RISK threshold (not usableStock)
 * ✅ CORRECTED: AT_RISK threshold is 30% of total stock
 *
 * @param usableStock - Available usable stock
 * @param totalStock - Total stock (including all statuses)
 * @param expiredQty - Expired stock quantity
 * @param expiringSoonQty - Expiring soon stock quantity
 * @param reorderPoint - Optional reorder threshold
 * @returns Stock health state
 */
export function determineStockHealthState(
  usableStock: number,
  totalStock: number,
  expiredQty: number,
  expiringSoonQty: number,
  reorderPoint?: number,
): StockHealthState {
  // No usable stock but expired stock exists
  if (usableStock <= 0 && expiredQty > 0) {
    return StockHealthState.BLOCKED;
  }

  // No usable stock
  if (usableStock <= 0) {
    return StockHealthState.CRITICAL;
  }

  // Below reorder threshold
  if (reorderPoint && usableStock < reorderPoint) {
    return StockHealthState.LOW_STOCK;
  }

  // Stock exists but significant portion expiring soon
  // ✅ CORRECTED: Use absolute + relative check
  // This prevents misclassification when both usableStock and expiringSoonQty are small
  if (expiringSoonQty > 0 && expiringSoonQty >= totalStock * 0.3) {
    return StockHealthState.AT_RISK;
  }

  return StockHealthState.HEALTHY;
}

/**
 * Generate human-readable recommendation based on health state
 *
 * @param state - Stock health state
 * @param usableStock - Usable stock quantity
 * @param expiringSoonQty - Expiring soon quantity
 * @param nearestExpiry - Nearest expiry date
 * @returns Recommendation string
 */
export function generateRecommendation(
  state: StockHealthState,
  usableStock: number,
  expiringSoonQty: number,
  nearestExpiry?: Date,
): string {
  switch (state) {
    case StockHealthState.HEALTHY:
      return 'Healthy stock levels — reorder not required';

    case StockHealthState.AT_RISK:
      const days = nearestExpiry
        ? Math.max(0, differenceInDays(nearestExpiry, new Date()))
        : 0;
      return `At risk — ${expiringSoonQty} units expiring in ${days} days. Review before reordering.`;

    case StockHealthState.LOW_STOCK:
      return `Low usable stock — only ${usableStock} units available. Consider reordering.`;

    case StockHealthState.CRITICAL:
      return 'Critical: No usable stock available. Urgent reorder needed.';

    case StockHealthState.BLOCKED:
      return 'Blocked: Stock exists but is fully expired. Clear inventory before reordering.';

    default:
      return 'Status unknown';
  }
}

/**
 * Helper: Group stock lots by product ID
 *
 * ✅ Used to eliminate N+1 queries
 *
 * @param lots - Array of stock lots
 * @returns Map of product ID to lots
 */
export function groupLotsByProduct(lots: StockLot[]): Map<string, StockLot[]> {
  const grouped = new Map<string, StockLot[]>();

  for (const lot of lots) {
    const existing = grouped.get(lot.product_id) || [];
    existing.push(lot);
    grouped.set(lot.product_id, existing);
  }

  return grouped;
}

/**
 * Helper: Compare severity of stock health states
 * Used for aggregating company-level health (worst state wins)
 *
 * @param state1 - First state
 * @param state2 - Second state
 * @returns True if state1 is more severe than state2
 */
export function stateIsSevereThan(
  state1: StockHealthState,
  state2: StockHealthState,
): boolean {
  const severity = {
    [StockHealthState.HEALTHY]: 0,
    [StockHealthState.AT_RISK]: 1,
    [StockHealthState.LOW_STOCK]: 2,
    [StockHealthState.CRITICAL]: 3,
    [StockHealthState.BLOCKED]: 4,
  };

  return severity[state1] > severity[state2];
}
