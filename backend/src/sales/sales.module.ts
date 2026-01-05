import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrder } from './entities/sales-order.entity';
import { SalesOrderItem } from './entities/sales-order-item.entity';
import { SalesService } from './sales.service';
import { SalesResolver } from './sales.resolver';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([SalesOrder, SalesOrderItem]),
        AuthModule,
    ],
    providers: [SalesService, SalesResolver],
    exports: [SalesService],
})
export class SalesModule { }
