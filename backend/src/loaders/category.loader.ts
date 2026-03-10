import DataLoader from 'dataloader';
import { In, Repository } from 'typeorm';
import { Category } from '../inventory/entities/category.entity';
import { logLoaderBatch } from './loader.logger';

/** Maximum batch size to prevent huge IN queries */
const MAX_BATCH_SIZE = 100;

/**
 * Batch function: loads Categories by their primary IDs.
 * Filters by companyId to enforce multi-tenant isolation.
 */
export function createCategoryLoader(
  categoryRepository: Repository<Category>,
  companyId: string,
): DataLoader<string, Category | null> {
  return new DataLoader<string, Category | null>(
    async (ids: readonly string[]) => {
      const start = Date.now();
      const categories = await categoryRepository.find({
        where: {
          id: In([...ids]),
          company_id: companyId,
        },
      });
      logLoaderBatch('CategoryLoader', ids.length, Date.now() - start);

      const categoryMap = new Map(categories.map((c) => [c.id, c]));
      return ids.map((id) => categoryMap.get(id) ?? null);
    },
    { maxBatchSize: MAX_BATCH_SIZE, cache: true },
  );
}
