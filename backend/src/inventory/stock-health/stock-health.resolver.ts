import { Resolver, Query, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { StockHealthService } from './stock-health.service';
import {
    WarehouseStockHealthResult,
    CompanyStockHealthResult,
} from './stock-health.types';
import { ClerkAuthGuard } from '../../auth/guards/clerk-auth.guard';
import { ClerkUser } from '../../auth/decorators/clerk-user.decorator';

@Resolver()
export class StockHealthResolver {
    constructor(private stockHealthService: StockHealthService) { }

    @Query(() => [WarehouseStockHealthResult])
    async warehouseStockHealth(
        @Args('warehouseId') warehouseId: string,
    ): Promise<WarehouseStockHealthResult[]> {
        return this.stockHealthService.getWarehouseStockHealth(warehouseId);
    }

    @Query(() => [CompanyStockHealthResult])
    @UseGuards(ClerkAuthGuard)
    async companyStockHealth(
        @ClerkUser() user: any,
    ): Promise<CompanyStockHealthResult[]> {
        if (!user.activeCompanyId) {
            throw new Error('No active company');
        }

        return this.stockHealthService.getCompanyStockHealth(user.activeCompanyId);
    }
}
