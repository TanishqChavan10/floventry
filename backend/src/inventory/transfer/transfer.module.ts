import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../auth/auth.module';
import { AuditModule } from '../../audit/audit.module';
import { NotificationsModule } from '../../notifications/notifications.module';
import { WarehouseModule } from '../../warehouse/warehouse.module';
import { Stock } from '../entities/stock.entity';
import { StockMovement } from '../entities/stock-movement.entity';
import { StockLot } from '../stock-lot/entities/stock-lot.entity';
import { WarehouseTransfer } from './entities/warehouse-transfer.entity';
import { WarehouseTransferItem } from './entities/warehouse-transfer-item.entity';
import { TransferService } from './transfer.service';
import { TransferResolver } from './transfer.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WarehouseTransfer,
      WarehouseTransferItem,
      Stock,
      StockLot,
      StockMovement,
    ]),
    AuthModule,
    WarehouseModule,
    NotificationsModule,
    AuditModule,
  ],
  providers: [TransferService, TransferResolver],
  exports: [TransferService],
})
export class TransferModule {}
