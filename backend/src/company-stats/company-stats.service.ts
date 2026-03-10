import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { CompanyStats } from './company-stats.entity';

/**
 * Service for managing pre-computed company statistics.
 *
 * All mutation-time updates use atomic SQL increments/decrements
 * so they stay fast and safe under concurrency.
 * The `recalculate()` method is the fallback full-recompute
 * that can be called by a periodic job or admin action.
 */
@Injectable()
export class CompanyStatsService {
  private readonly logger = new Logger(CompanyStatsService.name);

  constructor(
    @InjectRepository(CompanyStats)
    private statsRepository: Repository<CompanyStats>,
  ) {}

  // ── Ensure row exists (upsert) ──

  async ensureStats(companyId: string): Promise<CompanyStats> {
    let stats = await this.statsRepository.findOne({
      where: { company_id: companyId },
    });
    if (!stats) {
      stats = this.statsRepository.create({ company_id: companyId });
      stats = await this.statsRepository.save(stats);
    }
    return stats;
  }

  async getStats(companyId: string): Promise<CompanyStats> {
    return this.ensureStats(companyId);
  }

  // ── Atomic partial-update helpers ──

  /**
   * Atomically increment/decrement one or more counters.
   * Uses raw UPDATE ... SET col = col + delta WHERE company_id = :id
   * to avoid race conditions.
   *
   * Can optionally accept an EntityManager to run inside an existing transaction.
   */
  async adjustCounters(
    companyId: string,
    deltas: Partial<Record<
      | 'total_products'
      | 'total_stock_units'
      | 'low_stock_count'
      | 'critical_stock_count'
      | 'expiring_soon_count'
      | 'expired_count'
      | 'total_warehouses'
      | 'total_purchase_orders'
      | 'total_sales_orders',
      number
    >>,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager
      ? manager.getRepository(CompanyStats)
      : this.statsRepository;

    // Ensure row exists
    const exists = await repo.findOne({ where: { company_id: companyId } });
    if (!exists) {
      const newStats = repo.create({ company_id: companyId });
      await repo.save(newStats);
    }

    // Build SET clause with atomic arithmetic
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    for (const [key, delta] of Object.entries(deltas)) {
      if (delta === 0 || delta === undefined) continue;
      setClauses.push(
        `"${key}" = GREATEST("${key}" + $${paramIndex}, 0)`,
      );
      values.push(delta);
      paramIndex++;
    }

    if (setClauses.length === 0) return;

    setClauses.push(`"updated_at" = NOW()`);

    values.push(companyId);
    const sql = `UPDATE "company_stats" SET ${setClauses.join(', ')} WHERE "company_id" = $${paramIndex}`;

    await repo.manager.query(sql, values);
  }

  // ── Convenience methods for common mutations ──

  async onProductCreated(companyId: string, manager?: EntityManager) {
    await this.adjustCounters(companyId, { total_products: 1 }, manager);
  }

  async onProductRemoved(companyId: string, manager?: EntityManager) {
    await this.adjustCounters(companyId, { total_products: -1 }, manager);
  }

  async onWarehouseCreated(companyId: string, manager?: EntityManager) {
    await this.adjustCounters(companyId, { total_warehouses: 1 }, manager);
  }

  async onWarehouseArchived(companyId: string, manager?: EntityManager) {
    await this.adjustCounters(companyId, { total_warehouses: -1 }, manager);
  }

  async onPurchaseOrderCreated(companyId: string, manager?: EntityManager) {
    await this.adjustCounters(companyId, { total_purchase_orders: 1 }, manager);
  }

  async onSalesOrderCreated(companyId: string, manager?: EntityManager) {
    await this.adjustCounters(companyId, { total_sales_orders: 1 }, manager);
  }

  /**
   * Called when stock quantity changes.
   * Adjusts total_stock_units by the delta and re-evaluates low/critical status.
   *
   * @param quantityDelta - The change in stock quantity (positive = increase, negative = decrease)
   * @param oldHealth - The previous stock health status ('OK' | 'LOW' | 'CRITICAL')
   * @param newHealth - The new stock health status  ('OK' | 'LOW' | 'CRITICAL')
   */
  async onStockQuantityChanged(
    companyId: string,
    quantityDelta: number,
    oldHealth: 'OK' | 'LOW' | 'CRITICAL',
    newHealth: 'OK' | 'LOW' | 'CRITICAL',
    manager?: EntityManager,
  ) {
    const deltas: Record<string, number> = {};

    if (quantityDelta !== 0) {
      deltas.total_stock_units = quantityDelta;
    }

    // Transition old health → new health
    if (oldHealth !== newHealth) {
      if (oldHealth === 'LOW') deltas.low_stock_count = -1;
      if (oldHealth === 'CRITICAL') deltas.critical_stock_count = -1;
      if (newHealth === 'LOW') deltas.low_stock_count = (deltas.low_stock_count ?? 0) + 1;
      if (newHealth === 'CRITICAL') deltas.critical_stock_count = (deltas.critical_stock_count ?? 0) + 1;
    }

    if (Object.keys(deltas).length > 0) {
      await this.adjustCounters(companyId, deltas, manager);
    }
  }

  /**
   * Called when a new stock record is created (e.g., first stock for a product in a warehouse).
   * Adds the initial quantity and sets the health counter.
   */
  async onStockCreated(
    companyId: string,
    quantity: number,
    health: 'OK' | 'LOW' | 'CRITICAL',
    manager?: EntityManager,
  ) {
    const deltas: Record<string, number> = {};
    if (quantity > 0) deltas.total_stock_units = quantity;
    if (health === 'LOW') deltas.low_stock_count = 1;
    if (health === 'CRITICAL') deltas.critical_stock_count = 1;
    if (Object.keys(deltas).length > 0) {
      await this.adjustCounters(companyId, deltas, manager);
    }
  }

  /**
   * Called when lot expiry status changes.
   * Adjusts expired/expiring_soon counters.
   */
  async onExpiryStatusChanged(
    companyId: string,
    oldStatus: 'OK' | 'EXPIRING_SOON' | 'EXPIRED' | 'NO_EXPIRY',
    newStatus: 'OK' | 'EXPIRING_SOON' | 'EXPIRED' | 'NO_EXPIRY',
    manager?: EntityManager,
  ) {
    if (oldStatus === newStatus) return;

    const deltas: Record<string, number> = {};
    if (oldStatus === 'EXPIRING_SOON') deltas.expiring_soon_count = -1;
    if (oldStatus === 'EXPIRED') deltas.expired_count = -1;
    if (newStatus === 'EXPIRING_SOON') deltas.expiring_soon_count = (deltas.expiring_soon_count ?? 0) + 1;
    if (newStatus === 'EXPIRED') deltas.expired_count = (deltas.expired_count ?? 0) + 1;

    if (Object.keys(deltas).length > 0) {
      await this.adjustCounters(companyId, deltas, manager);
    }
  }

  // ── Full recalculate (fallback / periodic) ──

  /**
   * Recomputes ALL counters from the source tables.
   * Intended for:
   *   - Initial seeding
   *   - Periodic nightly reconciliation cron
   *   - Manual admin repair
   */
  async recalculate(companyId: string, manager?: EntityManager): Promise<CompanyStats> {
    const repo = manager
      ? manager.getRepository(CompanyStats)
      : this.statsRepository;

    // Ensure the stats row exists
    await this.ensureStats(companyId);

    // One big raw query to compute all counters
    const rawResult = await (manager ?? this.statsRepository.manager).query(
      `
      SELECT
        -- Products
        (SELECT COUNT(*)::int FROM product WHERE company_id = $1 AND is_active = true) AS total_products,
        -- Total stock units
        (SELECT COALESCE(SUM(quantity), 0)::numeric FROM stock WHERE company_id = $1) AS total_stock_units,
        -- Stock health counts
        (SELECT COUNT(*)::int FROM stock WHERE company_id = $1
          AND reorder_point IS NOT NULL AND quantity <= reorder_point
          AND (min_stock_level IS NULL OR quantity > min_stock_level)
          AND quantity > 0) AS low_stock_count,
        (SELECT COUNT(*)::int FROM stock WHERE company_id = $1
          AND (quantity = 0 OR (min_stock_level IS NOT NULL AND quantity <= min_stock_level))) AS critical_stock_count,
        -- Expiry counts (from stock_lots)
        (SELECT COUNT(*)::int FROM stock_lots WHERE company_id = $1 AND quantity > 0
          AND expiry_date IS NOT NULL AND expiry_status = 'EXPIRING_SOON') AS expiring_soon_count,
        (SELECT COUNT(*)::int FROM stock_lots WHERE company_id = $1 AND quantity > 0
          AND expiry_date IS NOT NULL AND expiry_status = 'EXPIRED') AS expired_count,
        -- Warehouses
        (SELECT COUNT(*)::int FROM warehouse WHERE company_id = $1) AS total_warehouses,
        -- Orders
        (SELECT COUNT(*)::int FROM purchase_orders WHERE company_id = $1) AS total_purchase_orders,
        (SELECT COUNT(*)::int FROM sales_orders WHERE company_id = $1) AS total_sales_orders
      `,
      [companyId],
    );

    const row = rawResult[0];

    await repo.update(
      { company_id: companyId },
      {
        total_products: Number(row.total_products ?? 0),
        total_stock_units: Number(row.total_stock_units ?? 0),
        low_stock_count: Number(row.low_stock_count ?? 0),
        critical_stock_count: Number(row.critical_stock_count ?? 0),
        expiring_soon_count: Number(row.expiring_soon_count ?? 0),
        expired_count: Number(row.expired_count ?? 0),
        total_warehouses: Number(row.total_warehouses ?? 0),
        total_purchase_orders: Number(row.total_purchase_orders ?? 0),
        total_sales_orders: Number(row.total_sales_orders ?? 0),
      },
    );

    return repo.findOne({ where: { company_id: companyId } }) as Promise<CompanyStats>;
  }
}
