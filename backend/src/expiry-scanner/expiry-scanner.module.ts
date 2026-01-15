import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpiryScannerService } from './expiry-scanner.service';
import { StockLot } from '../inventory/entities/stock-lot.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([StockLot]),
        NotificationsModule,
    ],
    providers: [ExpiryScannerService],
    exports: [ExpiryScannerService],
})
export class ExpiryScannerModule { }
