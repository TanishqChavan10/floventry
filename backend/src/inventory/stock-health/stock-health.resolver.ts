import { Resolver, Query, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { StockHealthService } from './stock-health.service';
import {
  WarehouseStockHealthResult,
  CompanyStockHealthResult,
} from './stock-health.types';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Resolver()
export class StockHealthResolver {
  constructor(private stockHealthService: StockHealthService) {}

  @Query(() => [WarehouseStockHealthResult])
  async warehouseStockHealth(
    @Args('warehouseId') warehouseId: string,
  ): Promise<WarehouseStockHealthResult[]> {
    return this.stockHealthService.getWarehouseStockHealth(warehouseId);
  }

  @Query(() => [CompanyStockHealthResult])
  @UseGuards(AuthGuard)
  async companyStockHealth(
    @CurrentUser() user: any,
  ): Promise<CompanyStockHealthResult[]> {
    if (!user.activeCompanyId) {
      throw new Error('No active company');
    }

    return this.stockHealthService.getCompanyStockHealth(user.activeCompanyId);
  }
}
