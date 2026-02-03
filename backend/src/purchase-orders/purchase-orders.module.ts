import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { UserWarehouse } from '../auth/entities/user-warehouse.entity';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersResolver } from './purchase-orders.resolver';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PurchaseOrder, PurchaseOrderItem, UserWarehouse]),
    AuthModule,
  ],
  providers: [PurchaseOrdersService, PurchaseOrdersResolver],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
