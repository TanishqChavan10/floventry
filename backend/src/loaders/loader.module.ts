import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../inventory/entities/product.entity';
import { Supplier } from '../supplier/supplier.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { Category } from '../inventory/entities/category.entity';
import { User } from '../auth/entities/user.entity';
import { LoaderFactory } from './loader.factory';

/**
 * Module that provides the LoaderFactory service.
 * Import this in AppModule so the factory is available
 * to the GraphQL context and any resolver that needs it.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Supplier, Warehouse, Category, User]),
  ],
  providers: [LoaderFactory],
  exports: [LoaderFactory],
})
export class LoaderModule {}
