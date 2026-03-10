import DataLoader from 'dataloader';
import { Product } from '../inventory/entities/product.entity';
import { Supplier } from '../supplier/supplier.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { Category } from '../inventory/entities/category.entity';
import { User } from '../auth/entities/user.entity';

/**
 * All DataLoader instances available in the GraphQL context.
 * Each request gets fresh loaders to ensure per-request caching
 * and prevent cross-request data leakage.
 */
export interface DataLoaders {
  productLoader: DataLoader<string, Product | null>;
  supplierLoader: DataLoader<string, Supplier | null>;
  warehouseLoader: DataLoader<string, Warehouse | null>;
  categoryLoader: DataLoader<string, Category | null>;
  userLoader: DataLoader<string, User | null>;
  /** Batch load products by supplier_id → Product[] */
  productsBySupplierLoader: DataLoader<string, Product[]>;
  /** Batch load product count by supplier_id → number */
  productCountBySupplierLoader: DataLoader<string, number>;
}

export interface GqlContext {
  req: any;
  loaders: DataLoaders;
}
