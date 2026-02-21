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
import { ProductBarcodeUnit } from '../inventory/entities/product-barcode-unit.entity';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { BarcodeService } from '../inventory/barcode.service';
import { Company } from '../company/company.entity';
import { BarcodeFormatService } from '../inventory/barcode-format.service';
import { NotificationsModule } from '../notifications/notifications.module';

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
      ProductBarcodeUnit,
      Company,
    ]),
    AuthModule,
    AuditModule,
    NotificationsModule,
  ],
  providers: [ImportService, ImportResolver, BarcodeService, BarcodeFormatService],
  exports: [ImportService],
})
export class ImportModule {}
