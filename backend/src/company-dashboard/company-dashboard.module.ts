import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyDashboardResolver } from './company-dashboard.resolver';
import { CompanyDashboardService } from './company-dashboard.service';
import { Product } from '../inventory/entities/product.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { StockLot } from '../inventory/stock-lot/entities/stock-lot.entity';
import { StockMovement } from '../inventory/entities/stock-movement.entity';
import { GoodsReceiptNote } from '../inventory/grn/entities/goods-receipt-note.entity';
import { IssueNote } from '../issues/entities/issue-note.entity';
import { WarehouseTransfer } from '../inventory/transfer/entities/warehouse-transfer.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Product,
      Warehouse,
      Stock,
      StockLot,
      StockMovement,
      GoodsReceiptNote,
      IssueNote,
      WarehouseTransfer,
      Notification,
    ]),
  ],
  providers: [CompanyDashboardResolver, CompanyDashboardService],
  exports: [CompanyDashboardService],
})
export class CompanyDashboardModule {}
