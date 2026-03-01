import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockHealthService } from './stock-health.service';
import { StockHealthResolver } from './stock-health.resolver';
import { Stock } from '../entities/stock.entity';
import { StockLot } from '../stock-lot/entities/stock-lot.entity';
import { Product } from '../entities/product.entity';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Stock, StockLot, Product]), AuthModule],
  providers: [StockHealthService, StockHealthResolver],
  exports: [StockHealthService],
})
export class StockHealthModule {}
