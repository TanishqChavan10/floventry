import DataLoader from 'dataloader';
import { In, Repository } from 'typeorm';
import { Warehouse } from '../warehouse/warehouse.entity';
import { logLoaderBatch } from './loader.logger';

/** Maximum batch size to prevent huge IN queries */
const MAX_BATCH_SIZE = 100;

/**
 * Batch function: loads Warehouses by their primary IDs.
 * Filters by companyId to enforce multi-tenant isolation.
 */
export function createWarehouseLoader(
  warehouseRepository: Repository<Warehouse>,
  companyId: string,
): DataLoader<string, Warehouse | null> {
  return new DataLoader<string, Warehouse | null>(
    async (ids: readonly string[]) => {
      const start = Date.now();
      const warehouses = await warehouseRepository.find({
        where: {
          id: In([...ids]),
          company_id: companyId,
        },
      });
      logLoaderBatch('WarehouseLoader', ids.length, Date.now() - start);

      const warehouseMap = new Map(warehouses.map((w) => [w.id, w]));
      return ids.map((id) => warehouseMap.get(id) ?? null);
    },
    { maxBatchSize: MAX_BATCH_SIZE, cache: true },
  );
}
