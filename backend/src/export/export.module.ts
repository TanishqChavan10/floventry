import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportService } from './export.service';
import { ExportResolver } from './export.resolver';
import { Stock } from '../inventory/entities/stock.entity';
import { StockMovement } from '../inventory/entities/stock-movement.entity';
import { StockLot } from '../inventory/entities/stock-lot.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Stock, StockMovement, StockLot]),
    AuthModule,
  ],
  providers: [ExportService, ExportResolver],
  exports: [ExportService],
})
export class ExportModule {}
