import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import {
  CategoryResolver,
  ProductResolver,
  UnitResolver,
  StockResolver,
} from './inventory.resolver';
import { GRNService } from './grn.service';
import { GRNResolver } from './grn.resolver';
import { TransferService } from './transfer.service';
import { TransferResolver } from './transfer.resolver';
import { LowStockResolver } from './low-stock.resolver';
import { AdjustmentResolver } from './adjustment.resolver';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { Unit } from './entities/unit.entity';
import { Stock } from './entities/stock.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { GoodsReceiptNote } from './entities/goods-receipt-note.entity';
import { GRNItem } from './entities/grn-item.entity';
import { WarehouseTransfer } from './entities/warehouse-transfer.entity';
import { WarehouseTransferItem } from './entities/warehouse-transfer-item.entity';
import { StockLot } from './entities/stock-lot.entity';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';
import { PurchaseOrderItem } from '../purchase-orders/entities/purchase-order-item.entity';
import { AuthModule } from '../auth/auth.module';
import { SupplierModule } from '../supplier/supplier.module';
import { WarehouseModule } from '../warehouse/warehouse.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PurchaseOrdersModule } from '../purchase-orders/purchase-orders.module';
import { StockHealthModule } from './stock-health/stock-health.module';
import { BarcodeService } from './barcode.service';
import { BarcodeLabelController } from './barcode-label.controller';
import { BarcodeLabelService } from './barcode-label.service';
import { BarcodeLabelResolver } from './barcode-label.resolver';
import { AuditModule } from '../audit/audit.module';
import { ThermalLabelController } from './thermal-label.controller';
import { BarcodeThermalLabelService } from './barcode-thermal-label.service';
import { BarcodesController } from './barcodes.controller';
import { BarcodeHistory } from './entities/barcode-history.entity';
import { ProductBarcodeUnit } from './entities/product-barcode-unit.entity';
import { Company } from '../company/company.entity';
import { BarcodeFormatService } from './barcode-format.service';
import { StockLotLoader } from './stock-lot.loader';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Category,
      Product,
      Unit,
      Stock,
      StockLot,
      StockMovement,
      BarcodeHistory,
      ProductBarcodeUnit,
      GoodsReceiptNote,
      GRNItem,
      WarehouseTransfer,
      WarehouseTransferItem,
      PurchaseOrder,
      PurchaseOrderItem,
      Company,
    ]),
    AuthModule,
    SupplierModule,
    WarehouseModule,
    NotificationsModule,
    PurchaseOrdersModule,
    StockHealthModule, // Stock health intelligence
    AuditModule, // Company audit logs
  ],
  controllers: [BarcodeLabelController, ThermalLabelController, BarcodesController],
  providers: [
    BarcodeService,
    BarcodeFormatService,
    BarcodeLabelService,
    BarcodeLabelResolver,
    BarcodeThermalLabelService,
    InventoryService,
    CategoryResolver,
    ProductResolver,
    UnitResolver,
    StockResolver,
    GRNService,
    GRNResolver,
    TransferService,
    TransferResolver,
    LowStockResolver,
    AdjustmentResolver,
    StockLotLoader,
  ],
  exports: [InventoryService, GRNService, TransferService, BarcodeFormatService],
})
export class InventoryModule { }
