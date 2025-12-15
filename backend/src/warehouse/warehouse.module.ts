import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserWarehouse } from '../auth/entities/user-warehouse.entity';
import { Warehouse } from './warehouse.entity';
import { WarehouseSettings } from './warehouse-settings.entity';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { WarehouseResolver } from './warehouse.resolver';
import { AuthModule } from '../auth/auth.module';
import { UserCompany } from '../user-company/user-company.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Warehouse, WarehouseSettings, UserWarehouse, UserCompany]), AuthModule],
  controllers: [WarehouseController],
  providers: [WarehouseService, WarehouseResolver],
  exports: [WarehouseService, TypeOrmModule],
})
export class WarehouseModule { }