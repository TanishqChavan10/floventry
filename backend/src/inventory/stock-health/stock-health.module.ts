import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockHealthService } from './stock-health.service';
import { StockHealthResolver } from './stock-health.resolver';
import { Stock } from '../entities/stock.entity';
import { StockLot } from '../entities/stock-lot.entity';
import { Product } from '../entities/product.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Stock, StockLot, Product])],
    providers: [StockHealthService, StockHealthResolver],
    exports: [StockHealthService],
})
export class StockHealthModule { }
