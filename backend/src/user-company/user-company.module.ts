import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserCompanyService } from './user-company.service';
import { UserCompanyResolver } from './user-company.resolver';
import { UserCompany } from './user-company.entity';
import { Role } from '../role/role.entity';
import { UserWarehouse } from '../auth/entities/user-warehouse.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserCompany, Role, UserWarehouse]), AuthModule],
  providers: [UserCompanyService, UserCompanyResolver],
  exports: [UserCompanyService],
})
export class UserCompanyModule { }
