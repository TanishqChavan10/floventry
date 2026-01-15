import { Resolver, Query, Args, Context } from '@nestjs/graphql';
import { StockHealthService } from './stock-health.service';
import {
    WarehouseStockHealthResult,
    CompanyStockHealthResult,
} from './stock-health.types';

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
    async companyStockHealth(
        @Context() context: any,
    ): Promise<CompanyStockHealthResult[]> {
        // Get company ID from context (set by auth middleware)
        const companyId = context.req.companyId;

        if (!companyId) {
            throw new Error('Company context not found');
        }

        return this.stockHealthService.getCompanyStockHealth(companyId);
    }
}
