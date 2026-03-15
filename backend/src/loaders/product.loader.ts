import DataLoader from 'dataloader';
import { In, Repository } from 'typeorm';
import { Product } from '../inventory/entities/product.entity';
import { logLoaderBatch } from './loader.logger';

/** Maximum batch size to prevent huge IN queries */
const MAX_BATCH_SIZE = 100;

/**
 * Batch function: loads Products by their primary IDs.
 * Filters by companyId to enforce multi-tenant isolation.
 */
export function createProductLoader(
  productRepository: Repository<Product>,
  companyId: string,
): DataLoader<string, Product | null> {
  return new DataLoader<string, Product | null>(
    async (ids: readonly string[]) => {
      const start = Date.now();
      const products = await productRepository.find({
        where: {
          id: In([...ids]),
          company_id: companyId,
        },
        relations: ['category', 'supplier'],
      });
      logLoaderBatch('ProductLoader', ids.length, Date.now() - start);

      const productMap = new Map(products.map((p) => [p.id, p]));
      return ids.map((id) => productMap.get(id) ?? null);
    },
    { maxBatchSize: MAX_BATCH_SIZE, cache: true },
  );
}

/**
 * Batch function: loads Products grouped by supplier_id.
 * Returns Product[] for each supplier_id key.
 */
export function createProductsBySupplierLoader(
  productRepository: Repository<Product>,
  companyId: string,
): DataLoader<string, Product[]> {
  return new DataLoader<string, Product[]>(
    async (supplierIds: readonly string[]) => {
      const start = Date.now();
      const products = await productRepository.find({
        where: {
          supplier_id: In([...supplierIds]),
          company_id: companyId,
        },
        select: {
          id: true,
          name: true,
          sku: true,
          unit: true,
          supplier_id: true,
        },
        order: { name: 'ASC' },
      });
      logLoaderBatch(
        'ProductsBySupplierLoader',
        supplierIds.length,
        Date.now() - start,
      );

      const grouped = new Map<string, Product[]>();
      for (const product of products) {
        const list = grouped.get(product.supplier_id) ?? [];
        list.push(product);
        grouped.set(product.supplier_id, list);
      }
      return supplierIds.map((id) => grouped.get(id) ?? []);
    },
    { maxBatchSize: MAX_BATCH_SIZE, cache: true },
  );
}

/**
 * Batch function: loads product count grouped by supplier_id.
 * Single query with GROUP BY instead of N separate count queries.
 */
export function createProductCountBySupplierLoader(
  productRepository: Repository<Product>,
  companyId: string,
): DataLoader<string, number> {
  return new DataLoader<string, number>(
    async (supplierIds: readonly string[]) => {
      const start = Date.now();
      const counts = await productRepository
        .createQueryBuilder('product')
        .select('product.supplier_id', 'supplier_id')
        .addSelect('COUNT(product.id)', 'count')
        .where('product.supplier_id IN (:...supplierIds)', {
          supplierIds: [...supplierIds],
        })
        .andWhere('product.company_id = :companyId', { companyId })
        .groupBy('product.supplier_id')
        .getRawMany<{ supplier_id: string; count: string }>();
      logLoaderBatch(
        'ProductCountBySupplierLoader',
        supplierIds.length,
        Date.now() - start,
      );

      const countMap = new Map(
        counts.map((c) => [c.supplier_id, parseInt(c.count, 10)]),
      );
      return supplierIds.map((id) => countMap.get(id) ?? 0);
    },
    { maxBatchSize: MAX_BATCH_SIZE, cache: true },
  );
}
