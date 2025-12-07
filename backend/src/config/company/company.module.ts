import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyService } from './company.service';
import { CompanyResolver } from './company.resolver';
import { Company } from './company.entity';
import { CompanySettings } from './company-settings.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Company, CompanySettings])],
  providers: [CompanyService, CompanyResolver],
  exports: [CompanyService],
})
export class CompanyModule {}
