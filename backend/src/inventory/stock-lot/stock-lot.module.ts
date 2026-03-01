import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockLot } from './entities/stock-lot.entity';
import { StockLotLoader } from './stock-lot.loader';

@Module({
  imports: [TypeOrmModule.forFeature([StockLot])],
  providers: [StockLotLoader],
  exports: [StockLotLoader],
})
export class StockLotModule {}
