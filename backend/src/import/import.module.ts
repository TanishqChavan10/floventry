import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportService } from './import.service';
import { ImportResolver } from './import.resolver';
import { Product } from '../inventory/entities/product.entity';
import { Category } from '../inventory/entities/category.entity';
import { Supplier } from '../supplier/supplier.entity';
import { Unit } from '../inventory/entities/unit.entity';
import { StockLot } from '../inventory/entities/stock-lot.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { StockMovement } from '../inventory/entities/stock-movement.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Category,
      Supplier,
      Unit,
      StockLot,
      Stock,
      StockMovement,
    ]),
    AuthModule,
  ],
  providers: [ImportService, ImportResolver],
  exports: [ImportService],
})
export class ImportModule {}
