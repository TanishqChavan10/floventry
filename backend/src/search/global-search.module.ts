import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../inventory/entities/product.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { CompanySettings } from '../company/company-settings.entity';
import { UserWarehouse } from '../auth/entities/user-warehouse.entity';
import { GoodsReceiptNote } from '../inventory/grn/entities/goods-receipt-note.entity';
import { IssueNote } from '../issues/entities/issue-note.entity';
import { WarehouseTransfer } from '../inventory/transfer/entities/warehouse-transfer.entity';
import { Supplier } from '../supplier/supplier.entity';
import { Category } from '../inventory/entities/category.entity';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { AuthModule } from '../auth/auth.module';
import { GlobalSearchResolver } from './global-search.resolver';
import { GlobalSearchService } from './global-search.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Warehouse,
      CompanySettings,
      UserWarehouse,
      GoodsReceiptNote,
      IssueNote,
      WarehouseTransfer,
      Supplier,
      Category,
      PurchaseOrder,
      SalesOrder,
    ]),
    AuthModule,
  ],
  providers: [GlobalSearchResolver, GlobalSearchService],
})
export class GlobalSearchModule {}
