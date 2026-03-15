import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import {
  CategoryResolver,
  ProductResolver,
  UnitResolver,
  StockResolver,
} from './inventory.resolver';
import { LowStockResolver } from './low-stock.resolver';
import { AdjustmentResolver } from './adjustment/adjustment.resolver';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { Unit } from './entities/unit.entity';
import { Stock } from './entities/stock.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { StockLot } from './stock-lot/entities/stock-lot.entity';
import { BarcodeHistory } from './barcode/entities/barcode-history.entity';
import { ProductBarcodeUnit } from './barcode/entities/product-barcode-unit.entity';
import { AuthModule } from '../auth/auth.module';
import { SupplierModule } from '../supplier/supplier.module';
import { WarehouseModule } from '../warehouse/warehouse.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PurchaseOrdersModule } from '../purchase-orders/purchase-orders.module';
import { StockHealthModule } from './stock-health/stock-health.module';
import { AuditModule } from '../audit/audit.module';
// ── Sub-modules ──────────────────────────────────────────────────────────────
import { BarcodeModule } from './barcode/barcode.module';
import { GRNModule } from './grn/grn.module';
import { TransferModule } from './transfer/transfer.module';
import { StockLotModule } from './stock-lot/stock-lot.module';

@Module({
  imports: [
    // Core inventory entities used by InventoryService & AdjustmentResolver
    TypeOrmModule.forFeature([
      Category,
      Product,
      Unit,
      Stock,
      StockLot,
      StockMovement,
      BarcodeHistory,
      ProductBarcodeUnit,
    ]),
    AuthModule,
    SupplierModule,
    WarehouseModule,
    NotificationsModule,
    PurchaseOrdersModule,
    StockHealthModule, // Stock health intelligence
    AuditModule, // Company audit logs
    // ── Inventory sub-modules ──────────────────────────────────────────────
    BarcodeModule, // Barcode generation, label printing, CSV export
    GRNModule, // Goods Receipt Notes
    TransferModule, // Warehouse-to-warehouse transfers
    StockLotModule, // Stock lot loader (request-scoped DataLoader)
  ],
  providers: [
    // Core inventory: products, categories, units, stock
    InventoryService,
    CategoryResolver,
    ProductResolver,
    UnitResolver,
    StockResolver,
    LowStockResolver,
    AdjustmentResolver, // Depends on InventoryService — kept in core module
  ],
  // Re-export sub-modules so their exported services (GRNService, TransferService,
  // BarcodeFormatService etc.) stay available to modules that import InventoryModule.
  exports: [InventoryService, BarcodeModule, GRNModule, TransferModule],
})
export class InventoryModule {}
