import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Transaction } from '../transaction/transaction.entity';
import { Shipment } from '../supplier/shipment.entity';
import { Product } from '../inventory/product/product.entity';
import { Supplier } from '../supplier/supplier.entity';
import { Customer } from '../transaction/customer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction,
      Shipment,
      Product,
      Supplier,
      Customer,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule { }
