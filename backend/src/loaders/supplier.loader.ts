import DataLoader from 'dataloader';
import { In, Repository } from 'typeorm';
import { Supplier } from '../supplier/supplier.entity';
import { logLoaderBatch } from './loader.logger';

/** Maximum batch size to prevent huge IN queries */
const MAX_BATCH_SIZE = 100;

/**
 * Batch function: loads Suppliers by their primary IDs.
 * Filters by companyId to enforce multi-tenant isolation.
 */
export function createSupplierLoader(
  supplierRepository: Repository<Supplier>,
  companyId: string,
): DataLoader<string, Supplier | null> {
  return new DataLoader<string, Supplier | null>(
    async (ids: readonly string[]) => {
      const start = Date.now();
      const suppliers = await supplierRepository.find({
        where: {
          id: In([...ids]),
          company_id: companyId,
        },
      });
      logLoaderBatch('SupplierLoader', ids.length, Date.now() - start);

      const supplierMap = new Map(suppliers.map((s) => [s.id, s]));
      return ids.map((id) => supplierMap.get(id) ?? null);
    },
    { maxBatchSize: MAX_BATCH_SIZE, cache: true },
  );
}
