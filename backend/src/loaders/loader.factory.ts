import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../inventory/entities/product.entity';
import { Supplier } from '../supplier/supplier.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { Category } from '../inventory/entities/category.entity';
import { User } from '../auth/entities/user.entity';
import { DataLoaders } from './loader.types';
import {
  createProductLoader,
  createProductsBySupplierLoader,
  createProductCountBySupplierLoader,
} from './product.loader';
import { createSupplierLoader } from './supplier.loader';
import { createWarehouseLoader } from './warehouse.loader';
import { createCategoryLoader } from './category.loader';
import { createUserLoader } from './user.loader';

/**
 * Factory service that creates fresh DataLoader instances for each request.
 *
 * This is a singleton service — it does NOT hold per-request state.
 * Instead, it creates new DataLoader instances on every call to `createLoaders()`.
 * Each DataLoader has its own per-request cache and batching window.
 */
@Injectable()
export class LoaderFactory {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Creates a fresh set of DataLoaders scoped to a single request.
   * @param companyId - The active company for multi-tenant filtering.
   *                    Pass undefined for unauthenticated requests (loaders will return null).
   */
  createLoaders(companyId?: string): DataLoaders {
    // For unauthenticated requests or requests without a company,
    // use a dummy companyId that will match nothing.
    const safeCompanyId = companyId ?? '00000000-0000-0000-0000-000000000000';

    return {
      productLoader: createProductLoader(this.productRepository, safeCompanyId),
      supplierLoader: createSupplierLoader(
        this.supplierRepository,
        safeCompanyId,
      ),
      warehouseLoader: createWarehouseLoader(
        this.warehouseRepository,
        safeCompanyId,
      ),
      categoryLoader: createCategoryLoader(
        this.categoryRepository,
        safeCompanyId,
      ),
      userLoader: createUserLoader(this.userRepository),
      productsBySupplierLoader: createProductsBySupplierLoader(
        this.productRepository,
        safeCompanyId,
      ),
      productCountBySupplierLoader: createProductCountBySupplierLoader(
        this.productRepository,
        safeCompanyId,
      ),
    };
  }
}
