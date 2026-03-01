import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthResolver } from './auth.resolver';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { UserCompany } from '../user-company/user-company.entity';
import { UserWarehouse } from './entities/user-warehouse.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { WarehouseGuard } from './guards/warehouse.guard';
import { UserWarehouseService } from './user-warehouse.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserWarehouse, Warehouse]),
    ConfigModule,
  ],
  providers: [
    AuthResolver,
    AuthService,
    AuthGuard,
    RolesGuard,
    WarehouseGuard,
    UserWarehouseService,
  ],
  exports: [
    AuthService,
    AuthGuard,
    RolesGuard,
    WarehouseGuard,
    UserWarehouseService,
    TypeOrmModule,
  ],
})
export class AuthModule {}
