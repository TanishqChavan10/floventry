import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Product } from '../inventory/entities/product.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { StockLot } from '../inventory/entities/stock-lot.entity';
import { StockMovement } from '../inventory/entities/stock-movement.entity';
import {
  GoodsReceiptNote,
  GRNStatus,
} from '../inventory/entities/goods-receipt-note.entity';
import {
  IssueNote,
  IssueNoteStatus,
} from '../issues/entities/issue-note.entity';
import {
  WarehouseTransfer,
  TransferStatus,
} from '../inventory/entities/warehouse-transfer.entity';
import {
  Notification,
  NotificationType,
  NotificationSeverity,
} from '../notifications/entities/notification.entity';
import {
  ActiveAlertsSummary,
  CompanyDashboardData,
  CompanyDashboardKPIs,
  CompanyDashboardMovementsWindow,
  ExpiryRiskDistribution,
  RecentInventoryEvent,
  StockStatusDistribution,
  WarehouseHealthSnapshotItem,
} from './dto/company-dashboard.types';

@Injectable()
export class CompanyDashboardService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Warehouse)
    private warehouseRepository: Repository<Warehouse>,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    @InjectRepository(StockLot)
    private stockLotRepository: Repository<StockLot>,
    @InjectRepository(StockMovement)
    private stockMovementRepository: Repository<StockMovement>,
    @InjectRepository(GoodsReceiptNote)
    private grnRepository: Repository<GoodsReceiptNote>,
    @InjectRepository(IssueNote)
    private issueNoteRepository: Repository<IssueNote>,
    @InjectRepository(WarehouseTransfer)
    private transferRepository: Repository<WarehouseTransfer>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  private calculateStockStatusCounts(
    stocks: Array<
      Pick<Stock, 'quantity' | 'min_stock_level' | 'reorder_point'>
    >,
  ): StockStatusDistribution {
    let ok = 0;
    let low = 0;
    let critical = 0;

    for (const stock of stocks) {
      const qty = Number(stock.quantity ?? 0);
      const minLevel = stock.min_stock_level;
      const reorderPoint = stock.reorder_point;

      const isCritical =
        qty === 0 ||
        (minLevel !== null &&
          minLevel !== undefined &&
          qty <= Number(minLevel));
      if (isCritical) {
        critical++;
        continue;
      }

      const isLow =
        reorderPoint !== null &&
        reorderPoint !== undefined &&
        qty <= Number(reorderPoint);
      if (isLow) {
        low++;
      } else {
        ok++;
      }
    }

    return { ok, low, critical };
  }

  private async getMovementsWindow(
    companyId: string,
    days: number,
  ): Promise<CompanyDashboardMovementsWindow> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const raw = await this.stockMovementRepository
      .createQueryBuilder('m')
      .select(
        'COALESCE(SUM(CASE WHEN m.quantity > 0 THEN m.quantity ELSE 0 END), 0)',
        'in_units',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN m.quantity < 0 THEN -m.quantity ELSE 0 END), 0)',
        'out_units',
      )
      .where('m.company_id = :companyId', { companyId })
      .andWhere('m.created_at >= :since', { since })
      .getRawOne<{ in_units: string; out_units: string }>();

    return {
      in_units: Number(raw?.in_units ?? 0),
      out_units: Number(raw?.out_units ?? 0),
    };
  }

  private async getExpiryDistribution(
    companyId: string,
    expirySoonDays: number,
  ): Promise<ExpiryRiskDistribution> {
    const now = new Date();
    const soon = new Date(Date.now() + expirySoonDays * 24 * 60 * 60 * 1000);

    const effectiveExpiry =
      "CASE WHEN lot.expiry_date = date_trunc('day', lot.expiry_date) THEN date_trunc('day', lot.expiry_date) + interval '1 day' - interval '1 millisecond' ELSE lot.expiry_date END";

    const raw = await this.stockLotRepository
      .createQueryBuilder('lot')
      .select(
        `COALESCE(SUM(CASE WHEN lot.quantity > 0 AND lot.expiry_date IS NOT NULL AND ${effectiveExpiry} < :now THEN 1 ELSE 0 END), 0)`,
        'expired',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN lot.quantity > 0 AND lot.expiry_date IS NOT NULL AND ${effectiveExpiry} >= :now AND ${effectiveExpiry} <= :soon THEN 1 ELSE 0 END), 0)`,
        'expiring_soon',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN lot.quantity > 0 AND (lot.expiry_date IS NULL OR ${effectiveExpiry} > :soon) THEN 1 ELSE 0 END), 0)`,
        'ok',
      )
      .where('lot.company_id = :companyId', { companyId })
      .setParameters({ now, soon })
      .getRawOne<{ ok: string; expiring_soon: string; expired: string }>();

    return {
      ok: Number(raw?.ok ?? 0),
      expiring_soon: Number(raw?.expiring_soon ?? 0),
      expired: Number(raw?.expired ?? 0),
    };
  }

  private async getExpiredStockUnits(companyId: string): Promise<number> {
    const now = new Date();
    const effectiveExpiry =
      "CASE WHEN lot.expiry_date = date_trunc('day', lot.expiry_date) THEN date_trunc('day', lot.expiry_date) + interval '1 day' - interval '1 millisecond' ELSE lot.expiry_date END";
    const raw = await this.stockLotRepository
      .createQueryBuilder('lot')
      .select(
        `COALESCE(SUM(CASE WHEN lot.quantity > 0 AND lot.expiry_date IS NOT NULL AND ${effectiveExpiry} < :now THEN lot.quantity ELSE 0 END), 0)`,
        'expired_units',
      )
      .where('lot.company_id = :companyId', { companyId })
      .setParameters({ now })
      .getRawOne<{ expired_units: string }>();

    return Number(raw?.expired_units ?? 0);
  }

  private async getTotalStockUnits(companyId: string): Promise<number> {
    const raw = await this.stockRepository
      .createQueryBuilder('s')
      .select('COALESCE(SUM(s.quantity), 0)', 'total')
      .where('s.company_id = :companyId', { companyId })
      .setParameters({ companyId })
      .getRawOne<{ total: string }>();

    return Number(raw?.total ?? 0);
  }

  private async getActiveAlerts(
    companyId: string,
  ): Promise<ActiveAlertsSummary> {
    const unread = await this.notificationRepository.find({
      where: { company_id: companyId, read_at: IsNull() },
      select: ['type', 'severity'],
    });

    let critical = 0;
    let warning = 0;
    let low_stock = 0;
    let expiry = 0;
    let import_issues = 0;

    for (const n of unread) {
      if (n.severity === NotificationSeverity.CRITICAL) critical++;
      if (n.severity === NotificationSeverity.WARNING) warning++;

      if (
        n.type === NotificationType.STOCK_LOW ||
        n.type === NotificationType.STOCK_CRITICAL
      ) {
        low_stock++;
      }

      if (
        n.type === NotificationType.STOCK_EXPIRING_SOON ||
        n.type === NotificationType.STOCK_EXPIRED
      ) {
        expiry++;
      }

      if (
        n.type === NotificationType.IMPORT_COMPLETED ||
        n.type === NotificationType.IMPORT_PARTIAL_FAILURE
      ) {
        import_issues++;
      }
    }

    return { critical, warning, low_stock, expiry, import_issues };
  }

  private async getWarehouseHealthSnapshot(
    companyId: string,
  ): Promise<WarehouseHealthSnapshotItem[]> {
    const warehouses = await this.warehouseRepository.find({
      where: { company_id: companyId },
      select: ['id', 'name', 'slug'],
      order: { created_at: 'ASC' },
    });

    if (warehouses.length === 0) {
      return [];
    }

    // Load all stock rows once and compute per-warehouse status counts
    const stockRows = await this.stockRepository.find({
      where: { company_id: companyId },
      select: ['warehouse_id', 'quantity', 'min_stock_level', 'reorder_point'],
    });

    const perWarehouse: Record<
      string,
      { total: number; ok: number; low: number; critical: number }
    > = {};
    for (const w of warehouses) {
      perWarehouse[w.id] = { total: 0, ok: 0, low: 0, critical: 0 };
    }

    for (const s of stockRows) {
      const bucket = perWarehouse[s.warehouse_id];
      if (!bucket) continue;
      bucket.total++;

      const qty = Number(s.quantity ?? 0);
      const minLevel = s.min_stock_level;
      const reorderPoint = s.reorder_point;

      const isCritical =
        qty === 0 ||
        (minLevel !== null &&
          minLevel !== undefined &&
          qty <= Number(minLevel));
      if (isCritical) {
        bucket.critical++;
        continue;
      }

      const isLow =
        reorderPoint !== null &&
        reorderPoint !== undefined &&
        qty <= Number(reorderPoint);
      if (isLow) {
        bucket.low++;
      } else {
        bucket.ok++;
      }
    }

    // Also incorporate expiry risk per warehouse (any expired lots bumps to CRITICAL)
    const now = new Date();
    const effectiveExpiry =
      "CASE WHEN lot.expiry_date = date_trunc('day', lot.expiry_date) THEN date_trunc('day', lot.expiry_date) + interval '1 day' - interval '1 millisecond' ELSE lot.expiry_date END";
    const expiryAgg = await this.stockLotRepository
      .createQueryBuilder('lot')
      .select('lot.warehouse_id', 'warehouse_id')
      .addSelect(
        `COALESCE(SUM(CASE WHEN lot.quantity > 0 AND lot.expiry_date IS NOT NULL AND ${effectiveExpiry} < :now THEN 1 ELSE 0 END), 0)`,
        'expired_lots',
      )
      .where('lot.company_id = :companyId', { companyId })
      .setParameters({ now })
      .groupBy('lot.warehouse_id')
      .getRawMany<{ warehouse_id: string; expired_lots: string }>();

    const expiredLotsByWarehouse = new Map(
      expiryAgg.map((r) => [r.warehouse_id, Number(r.expired_lots ?? 0)]),
    );

    return warehouses.map((w) => {
      const stats = perWarehouse[w.id] ?? {
        total: 0,
        ok: 0,
        low: 0,
        critical: 0,
      };
      const okPercent =
        stats.total === 0 ? 100 : Math.round((stats.ok / stats.total) * 100);
      const expiredLots = expiredLotsByWarehouse.get(w.id) ?? 0;

      let risk_badge = 'OK';
      if (expiredLots > 0 || stats.critical > 0) {
        risk_badge = 'CRITICAL';
      } else if (stats.low > 0) {
        risk_badge = 'WARNING';
      }

      return {
        warehouse_id: w.id,
        warehouse_name: w.name,
        warehouse_slug: w.slug,
        ok_percent: okPercent,
        risk_badge,
      };
    });
  }

  private async getRecentActivity(
    companyId: string,
  ): Promise<RecentInventoryEvent[]> {
    const limitPerType = 10;

    const [grns, issues, transfers, adjustments] = await Promise.all([
      this.grnRepository.find({
        where: { company_id: companyId, status: GRNStatus.POSTED },
        order: { posted_at: 'DESC' },
        take: limitPerType,
        relations: ['warehouse', 'posted_by_user'],
      }),
      this.issueNoteRepository.find({
        where: { company_id: companyId, status: IssueNoteStatus.POSTED },
        order: { issued_at: 'DESC' },
        take: limitPerType,
        relations: ['warehouse', 'issuer'],
      }),
      this.transferRepository.find({
        where: { company_id: companyId, status: TransferStatus.POSTED },
        order: { updated_at: 'DESC' },
        take: limitPerType,
        relations: ['source_warehouse'],
      }),
      this.stockMovementRepository.find({
        where: { company_id: companyId },
        order: { created_at: 'DESC' },
        take: limitPerType,
        relations: ['warehouse', 'user'],
      }),
    ]);

    const events: RecentInventoryEvent[] = [];

    for (const g of grns) {
      if (!g.posted_at) continue;
      events.push({
        event_type: 'GRN_POSTED',
        reference_number: g.grn_number,
        warehouse_name: g.warehouse?.name,
        performed_by: g.posted_by_user?.fullName || undefined,
        occurred_at: g.posted_at,
      });
    }

    for (const i of issues) {
      if (!i.issued_at) continue;
      events.push({
        event_type: 'ISSUE_POSTED',
        reference_number: i.issue_number,
        warehouse_name: i.warehouse?.name,
        performed_by: i.issuer?.fullName || undefined,
        occurred_at: i.issued_at,
      });
    }

    for (const t of transfers) {
      events.push({
        event_type: 'TRANSFER_POSTED',
        reference_number: t.transfer_number,
        warehouse_name: t.source_warehouse?.name,
        performed_by: undefined,
        occurred_at: t.updated_at,
      });
    }

    // Adjustments: infer from movement type names
    for (const m of adjustments) {
      const typeStr = String((m as any).type);
      const isAdjustment =
        typeStr.includes('ADJUST') ||
        typeStr.includes('OPENING') ||
        typeStr.includes('ISSUE') ||
        String((m as any).reference_type) === 'ADJUSTMENT';
      if (!isAdjustment) continue;

      events.push({
        event_type: 'ADJUSTMENT',
        reference_number: (m as any).reference_id || undefined,
        warehouse_name: (m as any).warehouse?.name,
        performed_by: (m as any).user?.fullName || undefined,
        occurred_at: (m as any).created_at,
      });
    }

    events.sort((a, b) => b.occurred_at.getTime() - a.occurred_at.getTime());
    return events.slice(0, 10);
  }

  async getCompanyDashboard(companyId: string): Promise<CompanyDashboardData> {
    const expirySoonDays = 30;

    const [
      totalSkus,
      warehousesCount,
      totalStockUnits,
      expiredStockUnits,
      movements7d,
      movements30d,
      expiryDistribution,
      activeAlerts,
      warehouseSnapshot,
      recentActivity,
      stockRows,
    ] = await Promise.all([
      this.productRepository.count({
        where: { company_id: companyId, is_active: true as any } as any,
      }),
      this.warehouseRepository.count({ where: { company_id: companyId } }),
      this.getTotalStockUnits(companyId),
      this.getExpiredStockUnits(companyId),
      this.getMovementsWindow(companyId, 7),
      this.getMovementsWindow(companyId, 30),
      this.getExpiryDistribution(companyId, expirySoonDays),
      this.getActiveAlerts(companyId),
      this.getWarehouseHealthSnapshot(companyId),
      this.getRecentActivity(companyId),
      this.stockRepository.find({
        where: { company_id: companyId },
        select: ['quantity', 'min_stock_level', 'reorder_point'],
      }),
    ]);

    const stockStatus = this.calculateStockStatusCounts(stockRows);

    const stockAtRisk =
      stockStatus.low + stockStatus.critical + expiryDistribution.expiring_soon;

    const kpis: CompanyDashboardKPIs = {
      total_skus: totalSkus,
      warehouses: warehousesCount,
      total_stock_units: totalStockUnits,
      stock_at_risk: stockAtRisk,
      expired_stock_units: expiredStockUnits,
      movements_7d: movements7d,
      movements_30d: movements30d,
    };

    return {
      kpis,
      stock_status_distribution: stockStatus,
      expiry_risk_distribution: expiryDistribution,
      warehouse_health_snapshot: warehouseSnapshot,
      recent_activity: recentActivity,
      active_alerts_summary: activeAlerts,
    };
  }
}
