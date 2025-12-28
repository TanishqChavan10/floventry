import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { CategoryResolver, ProductResolver, UnitResolver, StockResolver } from './inventory.resolver';
import { GRNService } from './grn.service';
import { GRNResolver } from './grn.resolver';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { Unit } from './entities/unit.entity';
import { Stock } from './entities/stock.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { GoodsReceiptNote } from './entities/goods-receipt-note.entity';
import { GRNItem } from './entities/grn-item.entity';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';
import { PurchaseOrderItem } from '../purchase-orders/entities/purchase-order-item.entity';
import { AuthModule } from '../auth/auth.module';
import { SupplierModule } from '../supplier/supplier.module';
import { WarehouseModule } from '../warehouse/warehouse.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Category,
            Product,
            Unit,
            Stock,
            StockMovement,
            GoodsReceiptNote,
            GRNItem,
            PurchaseOrder,
            PurchaseOrderItem,
        ]),
        AuthModule,
        SupplierModule,
        WarehouseModule,
    ],
    providers: [
        InventoryService,
        CategoryResolver,
        ProductResolver,
        UnitResolver,
        StockResolver,
        GRNService,
        GRNResolver,
    ],
    exports: [InventoryService, GRNService],
})
export class InventoryModule { }
