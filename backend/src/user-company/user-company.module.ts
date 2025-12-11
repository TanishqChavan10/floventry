import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserCompanyService } from './user-company.service';
import { UserCompanyResolver } from './user-company.resolver';
import { UserCompany } from './user-company.entity';
import { Role } from '../role/role.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserCompany, Role]), AuthModule],
  providers: [UserCompanyService, UserCompanyResolver],
  exports: [UserCompanyService],
})
export class UserCompanyModule { }
