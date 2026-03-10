import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyStats } from './company-stats.entity';
import { CompanyStatsService } from './company-stats.service';
import { CompanyStatsResolver } from './company-stats.resolver';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([CompanyStats])],
  providers: [CompanyStatsService, CompanyStatsResolver],
  exports: [CompanyStatsService],
})
export class CompanyStatsModule {}
