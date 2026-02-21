import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpiryScannerService } from './expiry-scanner.service';
import { ExpiryScannerResolver } from './expiry-scanner.resolver';
import { StockLot } from '../inventory/entities/stock-lot.entity';
import { CompanySettings } from '../company/company-settings.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockLot, CompanySettings]),
    NotificationsModule,
    AuthModule,
  ],
  providers: [ExpiryScannerService, ExpiryScannerResolver],
  exports: [ExpiryScannerService],
})
export class ExpiryScannerModule {}
