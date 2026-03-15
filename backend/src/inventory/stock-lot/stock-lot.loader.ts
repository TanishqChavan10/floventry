import { Injectable, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { StockLot } from './entities/stock-lot.entity';

/**
 * Request-scoped batch loader for StockLots.
 * Eliminates N+1 queries when resolving lots for multiple Stock items.
 *
 * Instead of 1 query per Stock row, this batches all lot lookups into
 * a single query per unique (company_id, warehouse_id) pair.
 */
@Injectable({ scope: Scope.REQUEST })
export class StockLotLoader {
  private cache = new Map<string, StockLot[]>();
  private batchedWarehouseKeys = new Set<string>();

  constructor(
    @InjectRepository(StockLot)
    private readonly stockLotRepository: Repository<StockLot>,
  ) {}

  /**
   * Get lots for a specific stock item.
   * On first call for a warehouse, pre-loads ALL lots for that warehouse
   * in one query, then serves subsequent calls from cache.
   */
  async getLotsForStock(params: {
    company_id: string;
    product_id: string;
    warehouse_id: string;
  }): Promise<StockLot[]> {
    const warehouseKey = `${params.company_id}:${params.warehouse_id}`;

    // If we haven't loaded lots for this warehouse yet, batch-load them
    if (!this.batchedWarehouseKeys.has(warehouseKey)) {
      await this.preloadWarehouseLots(params.company_id, params.warehouse_id);
      this.batchedWarehouseKeys.add(warehouseKey);
    }

    const cacheKey = `${params.company_id}:${params.product_id}:${params.warehouse_id}`;
    return this.cache.get(cacheKey) || [];
  }

  /**
   * Pre-load ALL lots for a given company+warehouse in a single query.
   * This turns N queries into 1 query per warehouse.
   */
  private async preloadWarehouseLots(
    companyId: string,
    warehouseId: string,
  ): Promise<void> {
    const lots = await this.stockLotRepository.find({
      where: {
        company_id: companyId,
        warehouse_id: warehouseId,
      },
      order: {
        expiry_date: 'ASC',
        received_at: 'ASC',
      },
    });

    // Group lots by product_id and cache them
    for (const lot of lots) {
      const cacheKey = `${lot.company_id}:${lot.product_id}:${lot.warehouse_id}`;
      const existing = this.cache.get(cacheKey) || [];
      existing.push(lot);
      this.cache.set(cacheKey, existing);
    }
  }
}
