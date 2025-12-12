import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { CategoryResolver, ProductResolver, UnitResolver, StockResolver } from './inventory.resolver';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { Unit } from './entities/unit.entity';
import { Stock } from './entities/stock.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { AuthModule } from '../auth/auth.module';
import { SupplierModule } from '../supplier/supplier.module';
import { WarehouseModule } from '../warehouse/warehouse.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Category, Product, Unit, Stock, StockMovement]),
        AuthModule,
        SupplierModule,
        WarehouseModule,
    ],
    providers: [InventoryService, CategoryResolver, ProductResolver, UnitResolver, StockResolver],
    exports: [InventoryService],
})
export class InventoryModule { }
