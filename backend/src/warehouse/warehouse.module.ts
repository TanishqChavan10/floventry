import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserWarehouse } from '../auth/entities/user-warehouse.entity';
import { Warehouse } from './warehouse.entity';
import { WarehouseSettings } from './warehouse-settings.entity';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { WarehouseResolver } from './warehouse.resolver';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UserCompany } from '../user-company/user-company.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { StockMovement } from '../inventory/entities/stock-movement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Warehouse,
      WarehouseSettings,
      UserWarehouse,
      UserCompany,
      Stock,
      StockMovement,
    ]),
    AuthModule,
    AuditModule,
    NotificationsModule,
  ],
  controllers: [WarehouseController],
  providers: [WarehouseService, WarehouseResolver],
  exports: [WarehouseService, TypeOrmModule],
})
export class WarehouseModule {}
