import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../auth/auth.module';
import { AuditModule } from '../../audit/audit.module';
import { NotificationsModule } from '../../notifications/notifications.module';
import { PurchaseOrdersModule } from '../../purchase-orders/purchase-orders.module';
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity';
import { PurchaseOrderItem } from '../../purchase-orders/entities/purchase-order-item.entity';
import { Stock } from '../entities/stock.entity';
import { StockMovement } from '../entities/stock-movement.entity';
import { GoodsReceiptNote } from './entities/goods-receipt-note.entity';
import { GRNItem } from './entities/grn-item.entity';
import { StockLot } from '../stock-lot/entities/stock-lot.entity';
import { GRNService } from './grn.service';
import { GRNResolver } from './grn.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GoodsReceiptNote,
      GRNItem,
      Stock,
      StockLot,
      StockMovement,
      PurchaseOrder,
      PurchaseOrderItem,
    ]),
    AuthModule,
    NotificationsModule,
    PurchaseOrdersModule,
    AuditModule,
  ],
  providers: [GRNService, GRNResolver],
  exports: [GRNService],
})
export class GRNModule {}
