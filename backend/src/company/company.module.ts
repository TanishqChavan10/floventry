import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyService } from './company.service';
import { CompanyResolver } from './company.resolver';
import { Company } from './company.entity';
import { CompanySettings } from './company-settings.entity';
import { User } from '../auth/entities/user.entity';
import { UserCompany } from '../user-company/user-company.entity';
import { UserWarehouse } from '../auth/entities/user-warehouse.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { ClerkService } from '../auth/clerk.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      CompanySettings,
      User,
      UserCompany,
      UserWarehouse,
      Warehouse,
      Stock,
    ]),
  ],
  providers: [CompanyService, CompanyResolver, ClerkService],
  exports: [CompanyService],
})
export class CompanyModule {}
